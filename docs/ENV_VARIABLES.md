# Environment variables: Build vs Runtime

In **Cloudflare Pages** (Settings → Environment variables), you choose **Build** or **Runtime** (Production/Preview) for each variable. With **wrangler** (worker), secrets and server-only vars go in **.dev.vars** (local) or the dashboard (production); they are always “runtime” for the worker.

| Variable | Build or Runtime? | Why |
|----------|-------------------|-----|
| **VITE_ISIR_API_ENDPOINT** | **Build** | Used in the frontend at build time (`import.meta.env`). Baked into the client bundle. |
| **VITE_ISIR_API_KEY** | **Build** | Same. Used by the frontend for member verification. |
| **VITE_STRIPE_PUBLISHABLE_KEY** | **Build** | Used in the frontend (Stripe.js). Publishable keys are meant to be public. |
| **STRIPE_SECRET_KEY** | **Runtime** | Used only in the worker (create-payment-intent, stripe-webhook). **Secret** — must not be in the client. |
| **STRIPE_WEBHOOK_SECRET** | **Runtime** | Used only in the worker (stripe-webhook). **Secret**. |
| **RESEND_API_KEY** | **Runtime** | Used only in the worker (test-email, confirmation emails). **Secret**. |
| **CONFIRMATION_FROM_EMAIL** | **Runtime** | Used only in the worker when sending email. |
| **TEST_EMAIL_SECRET** | **Runtime** | Used only in the worker (/api/test-email). **Secret**. |

**ISIR_DB** is a **D1 database binding**, not a normal env var. It’s configured in `wrangler.jsonc` (`d1_databases`) and is available at runtime to the worker.

## Summary

- **Build**: `VITE_*` only. These are inlined into the frontend during `npm run build`. Never put secrets here.
- **Runtime**: Everything else (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CONFIRMATION_FROM_EMAIL`, `TEST_EMAIL_SECRET`). Used when the worker handles a request.

For **local dev** with wrangler, put runtime vars in `.dev.vars` (and do not commit that file).
