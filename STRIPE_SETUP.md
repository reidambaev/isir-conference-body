# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for Korean Won (KRW) and US Dollar (USD) payments.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Cloudflare Pages environment variables
- Node.js and npm installed

## Installation

If you encounter peer dependency warnings with React 19, the project includes a `.npmrc` file that uses `legacy-peer-deps`. To install dependencies:

```bash
npm install
```

If you still encounter issues, you can manually run:
```bash
npm install --legacy-peer-deps
```

**Note:** `@stripe/react-stripe-js` currently lists React 16-18 as peer dependencies, but it works fine with React 19. The `--legacy-peer-deps` flag allows npm to proceed with the installation despite the peer dependency warning.

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

## Step 2: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe-webhook`
4. **Select event source**: Choose **"Your account"** (not "Connected and v2 accounts")
   - "Your account" is correct for direct payments to your conference
   - "Connected and v2 accounts" is only for marketplace/platform scenarios
5. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Configure Environment Variables

### For Local Development (.env file)

Create or update your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### For Cloudflare Pages

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add the following variables:

**Production:**
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_your_live_publishable_key`
- `STRIPE_SECRET_KEY` = `sk_live_your_live_secret_key`
- `STRIPE_WEBHOOK_SECRET` = `whsec_your_webhook_secret`

**Preview:**
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_test_your_test_publishable_key`
- `STRIPE_SECRET_KEY` = `sk_test_your_test_secret_key`
- `STRIPE_WEBHOOK_SECRET` = `whsec_your_test_webhook_secret`

## Step 4: Update Database Schema

Run the migration to add currency support:

```bash
# Using Wrangler CLI
wrangler d1 execute ISIR_DB --file=./db/migration_add_currency.sql
```

Or manually add these columns to your `registrations` table:
- `currency TEXT DEFAULT 'USD'`
- `payment_intent_id TEXT`

## Step 5: Test the Integration

### Test Cards (Test Mode Only)

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: `4000 0000 0000 0002`

### Testing Korean Currency

1. Select "Korea" or "Korea" as the country during registration
2. Prices should automatically convert to KRW (₩) and include 10% Korean tax
3. Complete a test payment using a test card

## Currency Conversion

- **Exchange Rate**: Currently set to 1 USD = 1,350 KRW (approximate)
- **Korean Tax**: 10% VAT is automatically applied for Korean customers
- **For Production**: Consider using a real-time exchange rate API for accurate conversions

## Payment Flow

1. User selects country → Currency is determined (KRW for Korea, USD for others)
2. Registration is saved to database with `payment_status: 'pending'`
3. Payment intent is created with Stripe
4. User enters card details via Stripe Elements (secure, PCI-compliant)
5. Payment is processed by Stripe
6. Webhook updates `payment_status` to `'completed'` or `'failed'`

## Troubleshooting

### Payment Intent Creation Fails
- Check that `STRIPE_SECRET_KEY` is set correctly in Cloudflare
- Verify the API endpoint `/api/create-payment-intent` is accessible

### Webhook Not Working
- Ensure webhook URL is publicly accessible
- Check webhook secret matches in both Stripe and Cloudflare
- View webhook logs in Stripe Dashboard

### Currency Not Displaying Correctly
- Verify country selection is working
- Check browser console for currency utility errors
- Ensure `getCurrency()` function is receiving country data

## Security Notes

- Never commit secret keys to version control
- Use test keys for development, live keys only in production
- Stripe Elements handles PCI compliance automatically
- All card data is processed securely by Stripe

## Support

For Stripe-specific issues, contact Stripe Support: https://support.stripe.com
For application issues, check the console logs and Cloudflare Workers logs.
