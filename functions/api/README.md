# API functions (reference only)

**All API routes are implemented in `src/worker.js`.** When the app is deployed with the worker (`wrangler` with `main: src/worker.js`), every `/api/*` request is handled by the worker.

The files in this folder (`stripe-webhook.js`, `abstract-submission.js`, `create-payment-intent.js`, `visa-request.js`, `test-email.js`) are kept for reference or for a Cloudflare Pages–only deployment that does not use the worker. For a single source of truth, use and deploy via `src/worker.js`.
