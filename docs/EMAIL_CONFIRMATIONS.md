# Email confirmations with Google Workspace

The app sends a **registration confirmation email** after a successful Stripe payment. Cloudflare Workers/Pages cannot use SMTP directly, so we use **Resend** and send from your **Google Workspace domain** (e.g. `noreply@yourdomain.com`).

## Where does the “from” email come from? Do I need a real mailbox?

**No.** You do **not** need to create that address in Google Workspace.

- Resend verifies that you **own the domain** (e.g. `yourdomain.com`) by having you add DNS records. It does **not** use Gmail or any mailbox.
- Once the domain is verified, you can use **any** address at that domain as the “from” address, for example:
  - `noreply@yourdomain.com`
  - `conference@yourdomain.com`
  - `isir2026@yourdomain.com`
- Those addresses do **not** have to exist as real mailboxes in Google. Resend sends the email through their own servers; they only need proof you control the domain. So you can pick a friendly “from” (e.g. `ISIR 2026 <noreply@yourdomain.com>`) and set it in `CONFIRMATION_FROM_EMAIL`—no setup in Google required for that address.

## 1. Use Resend with your Google Workspace domain

1. **Sign up at [resend.com](https://resend.com)** and get an API key (Dashboard → API Keys).

2. **Add and verify your domain** (your Google Workspace domain, e.g. `yourdomain.com`):
   - In Resend: Domains → Add domain → enter your domain.
   - Add the DNS records Resend shows (MX, TXT, etc.) in your DNS (e.g. in Google Admin or your registrar). This does **not** change how you receive email in Google Workspace; it only allows Resend to send **from** that domain.

3. **Set environment variables** (for local dev use `.dev.vars`; for production use Cloudflare Pages → your project → Settings → Environment variables):
   - `RESEND_API_KEY` – your Resend API key (e.g. `re_...`).
   - `CONFIRMATION_FROM_EMAIL` – the “From” address, e.g. `ISIR 2026 <noreply@yourdomain.com>` (must use the verified domain).

   **Use runtime variables, not build variables.** The webhook runs in a Pages Function at request time, so it only sees runtime env vars. Build variables are for the build step and can end up in the client—never put `RESEND_API_KEY` there.

Example `.dev.vars` (do not commit):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
CONFIRMATION_FROM_EMAIL=ISIR 2026 <noreply@yourdomain.com>
```

In **Cloudflare Pages**: same variable names under **Settings → Environment variables** for Production (and Preview if you want).

## 2. When emails are sent

- **Registration payment succeeded** (`payment_intent.succeeded`): the Stripe webhook updates the registration and, if `RESEND_API_KEY` and `CONFIRMATION_FROM_EMAIL` are set, sends one confirmation email to the registrant’s email.
- **Abstract submitted** (`/api/abstract-submission`): after the abstract is saved, if the same env vars are set, a confirmation email is sent to the **corresponding author** email with the submission ID, title, category, and presentation preference.
- **Abstract accept/reject** (admin): from the Abstracts admin list, send acceptance or rejection emails manually (`POST /api/admin/abstracts/:id/send-decision` or bulk `/api/admin/abstracts/send-decisions`).
- **Oral / poster selection** (admin): after assigning format in **Oral / Poster assignment**, send selection emails manually (`POST /api/admin/abstracts/:id/send-format-notification` or bulk `/api/admin/abstracts/send-format-notifications`). Requires D1 column `format_email_sent_at` (`db/migration_add_format_email_sent_at.sql`).
- **Oral session speaker letter** (admin): after placing an oral abstract in N1–N6 under **Sessions**, send the session letter manually (`POST /api/admin/abstracts/:id/send-oral-session-notification` or bulk `/api/admin/abstracts/send-oral-session-notifications`). Emails both presenting and corresponding authors. Requires D1 columns from `db/migration_add_oral_session.sql`. N1 uses the Young Investigator Award opening.
- **Poster session letter** (admin): after placing a poster abstract in #1 or #2 under **Sessions**, send the letter manually (`POST /api/admin/abstracts/:id/send-poster-session-notification` or bulk `/api/admin/abstracts/send-poster-session-notifications`). #1 and #2 use different letters (placeholder copy until the official text is provided). Requires `db/migration_add_poster_session.sql`.

If either env var is missing, the request still succeeds; it just skips sending the email.

---

## Force-send a registration confirmation email

You can resend the same confirmation email for any registration (e.g. if it failed the first time or the attendee didn’t receive it).

**Endpoint:** `POST /api/resend-confirmation`  
**Auth:** Same as test email – use `TEST_EMAIL_SECRET` (header `X-Test-Email-Secret` or body `secret`).  
**Body:** `{ "registrationId": "REG-xxx...", "secret": "your-test-secret" }`

Example from the browser console (replace the registration ID and secret):

```javascript
fetch("/api/resend-confirmation", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    registrationId: "REG-1234567890-XXXXXXXXX",
    secret: "your-test-secret",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

The email is the same as the automatic one (registration summary). You can get the registration ID from the admin registrations list or from your D1 data.

---

## Registration confirmation not sending (test email works)

If the **test email** works but the **registration confirmation** (after payment) does not, the flow is: Stripe calls your webhook → worker updates the DB → worker sends the email. Check the following:

1. **Stripe webhook URL**  
   In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks), the endpoint URL must be your worker URL, e.g.  
   `https://www.isir2026.org/api/stripe-webhook`  
   If it points to an old or different URL, Stripe never hits your worker.

2. **Events**  
   The webhook must subscribe to **`payment_intent.succeeded`** (and optionally `payment_intent.payment_failed`). Without `payment_intent.succeeded`, the confirmation email is never triggered.

3. **Webhook secret**  
   After adding or changing the endpoint, Stripe shows a **Signing secret** (starts with `whsec_`). That value must be set as **`STRIPE_WEBHOOK_SECRET`** in your Worker’s Variables and Secrets (or via `wrangler secret put STRIPE_WEBHOOK_SECRET`). If the secret is wrong, the worker returns 400 and Stripe may show “Webhook signature verification failed”.

4. **Registration exists in D1**  
   The confirmation email is sent only if a row exists in `registrations` with the same `id` as `payment_intent.metadata.registrationId`. Registrations are created when the user submits the form (POST `/api/register`). If the user pays without having registered first, or the registration ID in the payment intent doesn’t match, no email is sent. In Cloudflare Dashboard → Workers & Pages → your worker → **Logs**, look for:
   - `Payment confirmed for registration: REG-...` (webhook ran and DB updated)
   - `Registration confirmation: no row found for id=...` (no matching registration)
   - `Confirmation email sent to ...` (email sent)

5. **Local testing with Stripe CLI**  
   If you use `stripe listen --forward-to https://www.isir2026.org/api/stripe-webhook`, the CLI uses a **temporary** signing secret. Use that secret in your env (e.g. `.dev.vars`) while testing; for production, use the secret from the Dashboard webhook.

6. **See what Stripe is doing**  
   In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks), click your endpoint → **Recent deliveries**. After a test payment, you should see a `payment_intent.succeeded` event. Check:
   - **Response code 200** – webhook reached your worker and succeeded.
   - **Response code 400** – signature verification failed; fix `STRIPE_WEBHOOK_SECRET`.
   - **No event or failed** – endpoint URL is wrong, or the event isn’t selected.

## 3. Test email from the browser console

To verify that Resend and your “from” address work, you can send a test email from the browser console.

1. **Enable the test endpoint** by setting a **runtime** env var (e.g. in Cloudflare Pages → Preview, or in `.dev.vars` for local):
   - `TEST_EMAIL_SECRET` – any random string you keep private (e.g. `my-test-secret-123`).

2. **Open your site** (local or deployed), open DevTools (F12) → **Console**, and run (replace the email and secret):

```javascript
fetch("/api/test-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "your@email.com",
    secret: "your-test-secret", // same as TEST_EMAIL_SECRET
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

Or send the secret in a header (so it’s not in the request body):

```javascript
fetch("/api/test-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Test-Email-Secret": "your-test-secret",
  },
  body: JSON.stringify({ to: "your@email.com" }),
})
  .then((r) => r.json())
  .then(console.log);
```

If it works, you’ll see `{ success: true, message: "Test email sent to your@email.com", ... }` and receive a short test email. Do **not** set `TEST_EMAIL_SECRET` in Production if you want to disable this endpoint there.

**If you get 502 Bad Gateway:** Open the request in the Network tab and check the **response body** (JSON). It will include `error` and often `details` from Resend. Common causes:

- **Domain not verified** – In [Resend → Domains](https://resend.com/domains), add and verify the domain used in `CONFIRMATION_FROM_EMAIL` (e.g. `noreply@yourdomain.com` → verify `yourdomain.com`).
- **Invalid API key** – Regenerate the key in Resend → API Keys and set `RESEND_API_KEY` in your deployment (Cloudflare Pages → Settings → Environment variables, **runtime**).
- **Wrong env in production** – Ensure `RESEND_API_KEY`, `CONFIRMATION_FROM_EMAIL`, and `TEST_EMAIL_SECRET` are set for the **same** environment you’re calling (e.g. Production).
- **Worker not used** – If you deploy with Pages only (no worker), the request may hit a different handler; ensure the worker (`src/worker.js`) is your entry point so `/api/test-email` is handled there.

## 4. Optional: Send via Gmail SMTP instead

If you prefer to send through Gmail/Google Workspace SMTP (e.g. with Nodemailer):

- Cloudflare Workers **cannot** open SMTP connections (no raw TCP).
- You’d need a small backend elsewhere (e.g. Node on Railway/Render) that:
  1. Uses a Google Workspace account and an [App Password](https://support.google.com/accounts/answer/185833).
  2. Exposes an HTTP endpoint that accepts “send confirmation” requests (e.g. with a secret or token).
  3. Sends the email via SMTP (e.g. `smtp.gmail.com`, port 587, TLS).

Then your Stripe webhook would call that HTTP endpoint instead of Resend. The Resend + domain approach above is simpler and keeps everything on Cloudflare.
