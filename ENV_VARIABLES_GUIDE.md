# Environment Variables Guide: Build-Time vs Runtime

In Cloudflare Workers, there are **two separate places** to configure environment variables:

## 1. Build-Time Variables (CI/CD Configuration)

**Location:** Git repository connection settings → Environment Variables and Secrets section

**When:** Available during `npm run build` (Vite build process)

**Used by:** Frontend React code (baked into the JavaScript bundle)

**Variables needed here:**
- `VITE_ISIR_API_ENDPOINT` - API endpoint for member verification
- `VITE_ISIR_API_KEY` - API key for member verification  
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (safe for frontend)

**How they're accessed:**
```javascript
// In React components (src/config/constants.js, RegistrationForm.jsx)
import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
import.meta.env.VITE_ISIR_API_ENDPOINT
import.meta.env.VITE_ISIR_API_KEY
```

**Note:** These get compiled into your frontend bundle during build, so they're visible in the browser. Only use non-sensitive keys here (like publishable keys).

---

## 2. Runtime Variables (Worker Variables and Secrets)

**Location:** Worker → Settings → Variables and Secrets

**When:** Available when the Worker runs (at request time)

**Used by:** Backend Worker code (`src/worker.js`)

**Variables needed here:**
- `STRIPE_SECRET_KEY` - Stripe secret key (NEVER expose to frontend!)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

**How they're accessed:**
```javascript
// In worker.js
async function handleCreatePaymentIntent(request, env, corsHeaders) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {...});
  // env.STRIPE_SECRET_KEY is available here
}
```

**Note:** These are server-side only and never exposed to the browser. Use secrets for sensitive keys.

---

## Summary Table

| Variable | Type | Where to Set | Used By | Sensitive? |
|----------|------|--------------|---------|------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Build-time | CI/CD Variables | Frontend React | No (public key) |
| `VITE_ISIR_API_ENDPOINT` | Build-time | CI/CD Variables | Frontend React | No |
| `VITE_ISIR_API_KEY` | Build-time | CI/CD Variables | Frontend React | Yes (but needed in frontend) |
| `STRIPE_SECRET_KEY` | Runtime | Worker Variables/Secrets | Backend Worker | **YES** |
| `STRIPE_WEBHOOK_SECRET` | Runtime | Worker Variables/Secrets | Backend Worker | **YES** |

---

## Quick Setup Checklist

### In CI/CD Build Configuration (Git Settings):
- [ ] Add `VITE_ISIR_API_ENDPOINT` as Variable or Secret
- [ ] Add `VITE_ISIR_API_KEY` as Secret
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` as Secret

### In Worker Runtime Settings:
- [ ] Add `STRIPE_SECRET_KEY` as Secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` as Secret

---

## Why Two Places?

1. **Build-time variables** are needed when Vite compiles your React app into static files
2. **Runtime variables** are needed when your Worker handles API requests

They're separate because:
- Build happens once (when you deploy)
- Runtime happens on every request
- Security: Secret keys stay server-side only

---

## Troubleshooting

**"Stripe secret key not configured" error:**
→ Check that `STRIPE_SECRET_KEY` is set in **Worker Runtime Variables**, not just build variables

**Frontend can't find `VITE_STRIPE_PUBLISHABLE_KEY`:**
→ Check that it's set in **CI/CD Build Variables**, and rebuild/redeploy

**Variables not updating:**
→ Build-time vars: Trigger a new build/deployment
→ Runtime vars: Changes take effect immediately (no redeploy needed)
