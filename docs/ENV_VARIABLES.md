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

---

## "Resend not configured" but my variables are set

If the app returns `Resend not configured. Set RESEND_API_KEY and CONFIRMATION_FROM_EMAIL` even though those secrets exist in the dashboard, the worker is not receiving them at runtime. Check the following:

### 1. Where did you set the secrets?

This project uses a **Worker** (`main: src/worker.js` in wrangler). Secrets must be set **for that Worker**:

- **If you deploy with `wrangler deploy`:** Go to **Cloudflare Dashboard → Workers & Pages → [your project: isir-conference-2026]** → **Settings** → **Variables and Secrets**. Add `RESEND_API_KEY` and `CONFIRMATION_FROM_EMAIL` there (as Encrypted variables / Secrets). These are the only vars the worker sees.
- **If you set them under a Pages project** (e.g. a different project or "Pages" in the sidebar): the Worker does **not** use Pages env vars. Set them in the **Worker** project (same name as in wrangler) under Variables and Secrets.

### 2. If you use Cloudflare Pages (git deploy) with the worker

Some setups use **Pages** for the app and attach a Worker. In that case, in **Pages → your project → Settings → Environment variables**, ensure `RESEND_API_KEY` and `CONFIRMATION_FROM_EMAIL` are set as **Runtime** (not Build), and for the environment you’re testing (e.g. **Production**). Then trigger a new deployment so runtime vars are applied.

### 3. Redeploy after changing secrets

After adding or changing variables, redeploy (e.g. run `wrangler deploy` again or push a new Pages deployment) so the running worker gets the new env.

### 4. See what the worker actually sees (debug)

A **GET** request to **`/api/debug-env`** returns which env vars the worker sees (**set** or **missing**), without exposing values. Use it to confirm the worker is getting the right env:

- Open: `https://www.isir2026.org/api/debug-env` (or your live URL).
- If `RESEND_API_KEY` or `CONFIRMATION_FROM_EMAIL` show **missing**, the worker is not receiving them. Set them via the Worker’s **Variables and Secrets** (same project as in wrangler) or via CLI (below), then redeploy.

### 5. Set secrets via CLI (Workers)

If the dashboard isn’t applying, set secrets from your project directory so they’re bound to this Worker:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONFIRMATION_FROM_EMAIL
npx wrangler secret put TEST_EMAIL_SECRET
```

Enter the value when prompted. Then run `npx wrangler deploy` again. After that, hit `/api/debug-env` to confirm they show **set**. Remove or restrict `/api/debug-env` in production when you’re done debugging.
