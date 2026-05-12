# ISIR Conference — Testing Guide

A learning-oriented reference for building out a full test suite for this project.
**Goal:** explain what to test, with what tool, and why — without writing the
tests for you.

---

## Table of contents

1. [Your stack at a glance](#your-stack-at-a-glance)
2. [Why local testing has been broken](#why-local-testing-has-been-broken)
3. [The testing pyramid](#the-testing-pyramid)
4. [Layer 1 — Unit tests (Vitest + React Testing Library)](#layer-1--unit-tests-vitest--react-testing-library)
5. [Layer 2 — Integration / contract tests (Pact)](#layer-2--integration--contract-tests-pact)
6. [Layer 3 — End-to-end tests (Playwright)](#layer-3--end-to-end-tests-playwright)
7. [Recommended build-out order](#recommended-build-out-order)
8. [References](#references)

---

## Your stack at a glance

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind |
| Backend | Cloudflare Pages Functions (`functions/api/*.js`) |
| Database | Cloudflare D1 (SQLite) |
| File storage | Cloudflare R2 (`TRAINEE_LETTERS_BUCKET`) |
| Payments | Stripe |
| Email | Resend |
| Hosting | Cloudflare Pages |

**Already installed in `package.json`:**
`vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`, `@testing-library/dom`, `jsdom`, `wrangler`.

**Not yet installed (you'll add when needed):**
`@pact-foundation/pact`, `@playwright/test`, optionally `msw`.

---

## Why local testing has been broken

When you run `npm run dev`, Vite only serves the React frontend. That's why
hitting any `/api/*` route locally has felt like "the live stuff isn't
connected." Here's what's actually happening:

1. **Vite has no Cloudflare runtime.** Your APIs are Pages Functions — they
   need the Workers runtime to run.
2. **No bindings.** Your code uses `env.ISIR_DB` (D1),
   `env.TRAINEE_LETTERS_BUCKET` (R2), `env.STRIPE_SECRET_KEY`,
   `env.RESEND_API_KEY`. Plain Vite has none of these.
3. **Result:** form submissions silently 404 in dev → you've been forced to
   test on production.

### Two ways to fix it

| Approach | Tool | When to use it |
|---|---|---|
| Run the real Cloudflare runtime locally (local D1 + local R2) | `wrangler pages dev` | E2E tests, manual sanity checks |
| Mock the bindings in-process | Vitest + `vi.fn()` / MSW | Unit and most integration tests |

A typical one-liner for the full local stack:

```bash
npx wrangler pages dev -- npm run dev
```

This serves the React app **and** your `/api/*` routes against a local D1
(stored as a SQLite file in `.wrangler/`). You can seed it with
`npx wrangler d1 execute <db-name> --local --file=./schema.sql`.

> For most tests you won't even need wrangler — you'll mock `env`.

---

## The testing pyramid

```
        /\
       /E2E\        Playwright  —  few, slow, real browser, real backend
      /------\
     /  Pact  \     Pact        —  some, medium, frontend/backend contracts
    /----------\
   /    Unit    \   Vitest+RTL  —  many, fast, isolated functions/components
  /--------------\
```

**Many unit, some integration, few E2E.** Each layer catches different bugs:

- Unit catches **logic** bugs (wrong math, wrong validation rule).
- Integration catches **interface** bugs (frontend sends a field the backend
  doesn't read).
- E2E catches **wiring** bugs (the deploy is broken, env vars missing, routes
  return 500).

---

## Layer 1 — Unit tests (Vitest + React Testing Library)

### What "unit" means here

One function or one component, in isolation. No real HTTP, no real database,
no real Stripe. Anything external gets mocked.

### Tools

| Package | Role |
|---|---|
| `vitest` | Test runner (Jest-compatible API, much faster) |
| `@testing-library/react` | Renders components to a fake DOM |
| `@testing-library/jest-dom` | Extra matchers like `toBeInTheDocument()` |
| `@testing-library/user-event` | Simulates real user interactions (typing/clicking) |
| `jsdom` | A fake browser DOM so React can render without a real browser |
| `@vitest/ui` | Web UI to view test results |

All already in your `package.json`.

### Config you still need

You're missing `vitest.config.js`. It should:

- Set `test.environment` to `"jsdom"` (so `document`/`window` exist).
- Set `test.globals: true` (so `describe`/`it`/`expect` work without imports).
- Point `test.setupFiles` to `tests/setup.js`, which imports
  `@testing-library/jest-dom/vitest`.
- Optionally use **projects** to split node-environment tests (API handler
  tests) from jsdom-environment tests (component tests). API handlers don't
  need a DOM and run faster without one.

### Scripts (already in `package.json`)

| Command | What it does |
|---|---|
| `npm test` | Watch mode (great while developing) |
| `npm run test:run` | Single pass (CI) |
| `npm run test:ui` | Vitest UI in browser |

### What to write — by file

#### A. Pure utilities (start here, easiest wins)

These are pure functions with no React and no HTTP. Perfect first tests.

**`src/utils/currency.js`**
- USD → USD returns the input unchanged
- USD → KRW multiplies by the configured rate
- Unknown currency code → throws or sensible fallback
- Rounding at boundaries (0.5 cent behavior)
- Negative numbers and zero handled

**`src/config/constants.js`**
- `REGISTRATION_OPEN` is a boolean
- `isPreviewMode()` returns `true` when `?preview=...` is in the URL, `false`
  otherwise (use `vi.stubGlobal('location', ...)` or set
  `window.location.search`)
- Pricing constants are valid numbers
- Deadline date strings parse to real `Date`s

**Abstract validation helpers** (extracted from `abstract-submission.js` if you
choose to refactor)
- Word counter handles multiple spaces, newlines, tabs
- Email regex accepts good emails, rejects bad ones
- Submission-type normalization: `"Clinical Research" → "Clinical Studies"`
- `escapeHtml()` escapes `<`, `>`, `&`, `"`

#### B. React components (RTL)

Test pattern for every component:

1. `render(<Component {...props} />)`
2. Query with **accessible** selectors:
   `screen.getByRole(...)`, `getByLabelText(...)`
3. Interact with `userEvent.click(...)` / `userEvent.type(...)`
4. Assert with `expect(...).toBeInTheDocument()` /
   `.toHaveTextContent(...)` / `.toBeDisabled()`

**`RegistrationTab.jsx`**
- Shows "Registration is temporarily closed" banner when
  `REGISTRATION_OPEN === false` and no `?invite` param
- Auto-opens the form when URL has `?invite=anything`
- Shows the purple "Preview Mode" banner when `?preview=true`
- "Register Now" button toggles form visibility on click

**`SpeakerProfileTab.jsx`**
- Renders the speaker key from URL params
- Shows "speaker not found" when key is invalid
- Loads fields from fetched data (mock `fetch`)
- Submit is disabled until required fields are filled
- Validation errors appear under empty/invalid fields

**`SpeakerHotelTab.jsx`**
- Hotel radio options render
- Check-out before check-in is rejected
- Special requests respects character limit
- Submit calls `fetch` with the right payload (assert on `fetch.mock.calls`)

**`TraineeLetterUpload.jsx`**
- Accepts only PDF/JPG/PNG; `.docx` shows an error
- Rejects files over the size limit
- Renders progress/spinner state during upload
- Calls `onUploadComplete` with the right args after success

**`PaymentForm.jsx`**
- Renders Stripe Elements (mock `@stripe/react-stripe-js` — Stripe's docs
  literally tell you to mock `useStripe` / `useElements`)
- Submit button is disabled while `processing` is `true`
- Calls `createPaymentIntent` with the correct amount
- Shows the error message when Stripe returns an error

**`FormComponents.jsx`**
- Each input renders its label
- `required` prop adds the asterisk and `aria-required`
- `error` prop displays the error text
- `onChange` fires with the right value

#### C. API handler unit tests (Node environment)

Your Cloudflare Functions are just async functions taking `{ request, env }`.
You can call them like regular code. Mock `env.ISIR_DB.prepare().bind().run()`
with `vi.fn()`.

**`functions/api/abstract-submission.js` — `onRequestPost`**
- 400 when `title` is missing
- 400 when `presenterEmail` is malformed
- 400 when abstract > 300 words
- 400 when `presentationPreference` not in `["oral","poster","either"]`
- 400 when `abstractSubmissionType` is unrecognized
- 400 when no author is marked corresponding
- 400 when `authors` JSON is malformed
- Normalizes `"Clinical Research"` → `"Clinical Studies"`
- Submission ID matches `/^ABS-\d+-[A-Z0-9]+$/`
- Calls `env.ISIR_DB.prepare` with the right SQL and bound values
  (assert via the mock)
- Falls back to legacy insert when D1 throws an `"abstract_submission_type"`
  error
- Inserts one row per author
- Returns 201 with `{ success: true, submissionId }` on happy path
- Does **not** throw if Resend email fails (mock `fetch` to reject)
- 400 when `now < submissionOpens` (use `vi.setSystemTime(...)`)
- 400 when `now > submissionDeadline`

Repeat the same pattern for **`visa-request.js`**, **`create-payment-intent.js`**,
**`upload-trainee-letter.js`**, **`stripe-webhook.js`**.

### Mocking cheat sheet

| Need | API |
|---|---|
| Replace a whole module | `vi.mock('module-name', () => ({ ... }))` |
| Fake function | `const fn = vi.fn(); fn.mock.calls` |
| Wrap an existing method | `vi.spyOn(obj, 'method')` |
| Fake `fetch` | `vi.stubGlobal('fetch', vi.fn(...))` |
| Control `Date.now()` | `vi.useFakeTimers(); vi.setSystemTime(new Date('2026-04-01'))` |
| Reset between tests | `beforeEach(() => vi.clearAllMocks())` |

---

## Layer 2 — Integration / contract tests (Pact)

### What Pact actually is

Pact is a **consumer-driven contract** tester. It is **not** a generic
integration tester. It works in two phases:

1. **Consumer side** (your React app): a test says "when I call
   `POST /api/abstract-submission` with body X, I expect response Y." Pact
   spins up a fake HTTP server matching that expectation, your code hits it,
   and Pact writes a contract file (a JSON "pact").
2. **Provider side** (your Cloudflare Functions): you point Pact at your real
   running API and tell it "replay every interaction in this contract and
   verify the responses still match." If the provider's response shape drifts,
   the test fails.

**Point of Pact:** frontend and backend stay in sync about what each endpoint
looks like, even when developed independently.

### Honest caveat

Since your frontend and backend are in the **same repo**, classic Pact is
heavier than you strictly need. People in monorepos often skip Pact and use
**MSW (Mock Service Worker)** for frontend integration tests instead. But
since you specifically want to learn Pact, the plan below covers it; you can
keep just one or two Pact contracts as learning artifacts and use MSW for the
rest.

### Tools

- `@pact-foundation/pact` — consumer test library + provider verifier
- A running provider (your API via `wrangler pages dev`) for the verification
  phase
- (Optional, advanced) a Pact Broker for sharing contracts across teams —
  skip until you have multiple repos

### How it runs locally

Consumer tests run inside Vitest. Pact spins up a mock HTTP server on a port;
your code hits that port. You don't need anything live.

Provider verification needs your real API running locally. The flow:

1. Start `wrangler pages dev --local --persist` with a seeded test D1
2. Run the provider verification script that replays each pact against the
   local API
3. Pact reports pass/fail per interaction

### Contracts worth writing

Pick the endpoints your React app talks to. For each, define one or more
interactions:

**`POST /api/abstract-submission`**
- "Submission window open" + valid body → `201`, body matches
  `{ success: true, submissionId: /^ABS-/ }`
- "Submission window closed" → `400`, body
  `{ error: "Submission deadline has passed" }`
- Missing `title` → `400`, body containing `"Missing required field"`
- Abstract > 300 words → `400`, body containing `"300 word limit"`

**`POST /api/visa-request`**
- Valid → `200`, body `{ success: true, visaRequestId: <uuid> }`
- Missing country → `400`, body containing `"country"`

**`POST /api/create-payment-intent`**
- Valid → `200`, body `{ clientSecret: <string>, paymentIntentId: <string> }`
- Missing amount → `400`

**`POST /api/upload-trainee-letter`** *(multipart — fiddly but supported)*
- Valid PDF + email → `200`, body with `fileKey`
- `.docx` → `400`, invalid file type
- Missing email → `400`

**`GET /api/speaker-profiles/public`**
- Always `200`, shape
  `{ success: true, plenary: Speaker[], congress: Speaker[] }`

**`POST /api/speaker-profile`** (and any other speaker endpoints)
- "Speaker exists" + valid body → `200`, updated profile
- Speaker not found → `404`

### Provider states

A key Pact concept: **provider states** like `"submission window is open"` or
`"speaker exists"`. On the provider side, before replaying a given
interaction, you set up the D1 database into the right state (insert rows,
freeze `Date.now()`, etc.). You implement state handlers as small functions
Pact calls before each replay.

---

## Layer 3 — End-to-end tests (Playwright)

### What E2E means

Playwright launches a real browser (Chrome/Firefox/WebKit), clicks through
your app like a real user, and asserts on what's visible. It catches the bugs
that unit tests can't see — like "the deploy is missing a `STRIPE_SECRET_KEY`
binding."

### Tools

- `@playwright/test` — runner + library (install via `npm i -D`)
- `npx playwright install` — downloads browser binaries (run once)
- `npx playwright codegen http://localhost:5173` — opens a browser where every
  click/type auto-generates test code. Use this when learning.

### Local setup options

For E2E you want a **real backend running locally** — the whole point is "does
the system work end to end." Two options:

#### Option A — Full local stack (recommended)

1. `npx wrangler pages dev` against a local D1 (SQLite file in `.wrangler/`)
2. Seed local D1 with schema + test data:
   `npx wrangler d1 execute <db-name> --local --file=./schema.sql`
3. Point Playwright at `http://localhost:8788` (wrangler's default port)
4. Stripe → use **test mode** keys in `.dev.vars`, plus test card numbers
   (`4242 4242 4242 4242` always succeeds; `4000 0000 0000 0002` always
   declines)
5. Resend → either don't set `RESEND_API_KEY` (your code skips email when
   missing) or run a fake SMTP catcher like Mailpit

#### Option B — Mocked backend

Use Playwright's `page.route()` to intercept network requests and return
canned responses. Good for UI flows without backend dependency. Faster but
catches fewer real bugs.

**Start with Option A while learning.** That's where the real bugs hide.

### Playwright config essentials

A `playwright.config.js` typically defines:

- `testDir: './e2e'`
- `webServer: { command: 'npx wrangler pages dev', url: 'http://localhost:8788', reuseExistingServer: !process.env.CI }`
- `use.baseURL: 'http://localhost:8788'`
- `projects`: list of browsers (start with just `chromium`)
- `use.trace: 'on-first-retry'` — generates a beautiful trace viewer on failure

### Commands

| Command | What it does |
|---|---|
| `npx playwright test` | Run all tests |
| `npx playwright test --ui` | Interactive UI mode (best while learning) |
| `npx playwright test --debug` | Step through each action |
| `npx playwright show-report` | Open results in browser after run |
| `npx playwright codegen <url>` | Record actions → auto-generate test code |

### Scenarios to write

Each test is one **full user journey**, not a single assertion.

#### Abstract submission — happy path
1. Go to `/`, click "Submission" tab
2. Click "Submit Abstract"
3. Fill title, category, keywords, abstract (≤ 300 words)
4. Add 2 authors; mark one as corresponding, one as presenter
5. Add affiliations
6. Submit
7. Expect success message + ID matching `/ABS-\d+-/`
8. *(Optional)* query local D1 to confirm a row exists; delete after

#### Abstract submission — validation
- Empty title → inline error
- 350-word abstract → "exceeds 300 word limit"
- Malformed email → "invalid email"
- No corresponding author → designation error

#### Registration — happy path
1. Visit `/?invite=test-invite` (or `?preview=true`) to bypass the closed banner
2. Open Registration tab → form auto-opens
3. Fill personal info, choose tier (regular / trainee / student)
4. If trainee → upload a fake PDF via `setInputFiles` with a buffer
5. Continue to payment
6. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC
7. Submit payment → confirmation page with registration ID
8. Confirmation PDF is downloadable/viewable

#### Registration — payment declined
1. Same flow as above
2. Use Stripe `4000 0000 0000 0002` (always declines)
3. Expect a "payment declined" error
4. No DB row (or row marked failed)

#### Registration — closed by default
1. Visit `/` without `?invite=` and with registration closed in config
2. Open Registration tab
3. Expect the amber "Registration is temporarily closed" banner
4. No "Register Now" CTA

#### Visa request
1. Open Travel/Visa tab
2. Click "Request visa letter"
3. Fill name, email, country, notes
4. Submit → success message with request ID
5. *(Optional)* verify row in local D1

#### Speaker profile editing
1. Navigate to `/speaker-profile?key=jane-doe`
2. Existing profile loads
3. Edit bio, save
4. Reload → new bio still there

#### Speaker hotel booking
1. Open speaker hotel page (using the key/auth your app uses)
2. Select a hotel option
3. Set check-in / check-out dates
4. Add special requests
5. Submit → confirmation
6. Reload → selection persisted

#### Trainee letter upload
1. Start a trainee registration flow
2. Upload an invalid `.docx` → inline error "PDF, JPG, or PNG only"
3. Upload a valid PDF → success, file name displayed

#### Admin tab access
1. Visit Admin tab unauthenticated → login prompt / 401
2. Authenticated → list of submissions visible

#### Cross-cutting smoke
1. Every nav tab loads without errors (loop through tabs, assert a heading
   exists on each)
2. Footer links work
3. Mobile viewport (`use.viewport: { width: 375, height: 667 }`) — the
   registration form is still usable

---

## Recommended build-out order

| Week | Focus | Why |
|---|---|---|
| 1 | Vitest config + tests for `currency.js`, `constants.js` | Easy wins, learn the runner |
| 2 | RTL tests for `FormComponents.jsx` + 1–2 tabs | Learn `getByRole`, `userEvent`, mocking `fetch` |
| 3 | API handler unit tests for `abstract-submission.js` | Highest bug-catching ratio |
| 4 | Get `wrangler pages dev` running locally with a seeded D1 | Unlocks integration + E2E |
| 5 | First Playwright test: abstract submission happy path (use `codegen`) | Learn Playwright syntax |
| 6 | Full E2E suite: registration, visa, payment with Stripe test cards | Real coverage |
| Later | A Pact contract or two, once you understand the rest | Optional in a monorepo |

---

## References

- **Vitest** — https://vitest.dev/guide/
- **React Testing Library queries** — https://testing-library.com/docs/queries/about/
- **Playwright getting started** — https://playwright.dev/docs/intro
- **Stripe test cards** — https://docs.stripe.com/testing
- **Pact JS** — https://docs.pact.io/implementation_guides/javascript
- **Wrangler local D1** — https://developers.cloudflare.com/d1/best-practices/local-development/
- **MSW** (lighter alternative to Pact in a monorepo) — https://mswjs.io/

---

## Existing scaffolding in the repo

Per git status, these stub files already exist (untracked):

```
tests/README.md
tests/setup.js
tests/helpers/d1.js
tests/unit/constants.test.js
tests/unit/currency.test.js
tests/components/RegistrationTab.test.jsx
tests/components/SpeakerHotelTab.test.jsx
tests/components/SpeakerProfileTab.test.jsx
tests/api/abstract-submission.test.js
tests/api/create-payment-intent.test.js
tests/api/upload-trainee-letter.test.js
tests/api/visa-request.test.js
```

`vitest.config.js` is **missing** — until you create it, none of these will
run. You can either delete the stubs and start from scratch, or open them as
scaffolding and write the bodies yourself.
