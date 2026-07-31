/**
 * ISIR Conference Worker
 * Handles static assets + API routes
 */
import bundledSpeakerSeed from "./speakersSeed.js";

const SPEAKER_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB cap for R2 headshots (JPEG/PNG)
const SPEAKER_CV_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB cap for brief CV (PDF/Word)
const MAX_SPEAKER_AFFILIATION_CHARS = 90;
const MAX_SPEAKER_PRESENTATION_TITLE_CHARS = 300;

const CONGRESS_DAY_PASS_KEYS = ["Thursday", "Friday", "Saturday", "Sunday"];

function isSouthKoreaCountryName(countryStr) {
  const n = String(countryStr || "")
    .trim()
    .toLowerCase();
  return (
    n === "south korea" ||
    n === "republic of korea" ||
    n === "korea, republic of" ||
    n === "korea (south)" ||
    n === "korea, south"
  );
}

function parseClientDayPassDays(data) {
  const raw = data?.dayPassDays;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((d) => CONGRESS_DAY_PASS_KEYS.includes(String(d)));
  }
  if (typeof raw === "object") {
    return CONGRESS_DAY_PASS_KEYS.filter((d) => Boolean(raw[d]));
  }
  return [];
}

function seedRowBySpeakerKey(speakerKey) {
  if (speakerKey == null || String(speakerKey).trim() === "") return null;
  const k = String(speakerKey).trim();
  for (const s of bundledSpeakerSeed) {
    if (String(s.key || "").trim() === k) return s;
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API routes first
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, url);
    }

    // Public reads from R2 (trainee letters + invited speaker headshots + visa proofs)
    if (
      url.pathname.startsWith("/trainee-letters/") ||
      url.pathname.startsWith("/speaker-photos/") ||
      url.pathname.startsWith("/visa-registration-proofs/")
    ) {
      return handleR2PublicGet(request, env, url);
    }

    // Serve static assets for everything else
    // For SPA routing: if asset not found, serve index.html
    const response = await env.ASSETS.fetch(request);

    // If the asset was not found and it's a navigation request (not a file with extension),
    // serve index.html for client-side routing
    if (response.status === 404 && !url.pathname.includes(".")) {
      const indexRequest = new Request(new URL("/", url.origin), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};

// Public GET for R2 objects (path must match key, e.g. speaker-photos/… or trainee-letters/…)
function isR2BucketBinding(value) {
  return (
    value != null &&
    typeof value.get === "function" &&
    typeof value.put === "function" &&
    typeof value.delete === "function"
  );
}

function getSpeakerPhotosBucketForWrite(env) {
  return isR2BucketBinding(env.SPEAKER_PHOTOS_BUCKET)
    ? env.SPEAKER_PHOTOS_BUCKET
    : null;
}

function getSpeakerPhotosBucketForRead(env) {
  if (isR2BucketBinding(env.SPEAKER_PHOTOS_BUCKET)) {
    return env.SPEAKER_PHOTOS_BUCKET;
  }
  if (isR2BucketBinding(env.TRAINEE_LETTERS_BUCKET)) {
    return env.TRAINEE_LETTERS_BUCKET;
  }
  return null;
}

function getBucketForR2Key(env, key) {
  if (String(key || "").startsWith("speaker-photos/")) {
    return getSpeakerPhotosBucketForRead(env);
  }
  return isR2BucketBinding(env.TRAINEE_LETTERS_BUCKET)
    ? env.TRAINEE_LETTERS_BUCKET
    : null;
}

async function handleR2PublicGet(request, env, url) {
  const key = url.pathname.slice(1);

  try {
    const bucket = getBucketForR2Key(env, key);
    const object = bucket ? await bucket.get(key) : null;

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "application/octet-stream",
    );
    // Speaker headshots can be removed from R2; avoid year-long browser cache so deletes show up.
    if (key.startsWith("speaker-photos/")) {
      headers.set("Cache-Control", "private, max-age=0, must-revalidate");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000");
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Error fetching R2 object:", error);
    return new Response("Error fetching file", { status: 500 });
  }
}

async function handleApiRequest(request, env, url) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Admin-Token, X-ISIR-API-Key",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // POST /api/register
  if (url.pathname === "/api/register" && request.method === "POST") {
    return handleRegistration(request, env, corsHeaders);
  }

  // POST /api/check-member (alias: underscore — avoids 404/403 from typos in env)
  if (
    (url.pathname === "/api/check-member" ||
      url.pathname === "/api/check_member") &&
    request.method === "POST"
  ) {
    return handleCheckMemberProxy(request, env, corsHeaders);
  }

  // GET /api/speaker-invites/verify?token=...
  if (
    url.pathname === "/api/speaker-invites/verify" &&
    request.method === "GET"
  ) {
    return handleVerifySpeakerInvite(request, env, url, corsHeaders);
  }

  // GET /api/speaker-invites/check?email=...
  if (
    url.pathname === "/api/speaker-invites/check" &&
    request.method === "GET"
  ) {
    return handleCheckSpeakerInviteByEmail(request, env, url, corsHeaders);
  }

  // GET /api/discount-code/verify?code=...
  if (url.pathname === "/api/discount-code/verify" && request.method === "GET") {
    return handleVerifyDiscountCode(env, url, corsHeaders);
  }
  if (url.pathname === "/api/admin/discount-code" && request.method === "GET") {
    return handleAdminGetDiscountCode(request, env, corsHeaders);
  }
  if (
    url.pathname === "/api/admin/discount-code" &&
    request.method === "PATCH"
  ) {
    return handleAdminUpdateDiscountCode(request, env, corsHeaders);
  }

  // GET /api/checkin/registration/:id — public read for badge booth (no admin token)
  const checkinRegistrationMatch = url.pathname.match(
    /^\/api\/checkin\/registration\/([^/]+)$/,
  );
  if (checkinRegistrationMatch && request.method === "GET") {
    return handleGetCheckinRegistration(
      env,
      corsHeaders,
      checkinRegistrationMatch[1],
    );
  }

  // GET /api/registrations (admin endpoint)
  if (url.pathname === "/api/registrations" && request.method === "GET") {
    return handleGetRegistrations(request, env, corsHeaders);
  }

  // POST /api/abstract-submission
  if (
    url.pathname === "/api/abstract-submission" &&
    request.method === "POST"
  ) {
    return handleAbstractSubmission(request, env, corsHeaders);
  }

  // POST /api/visa-request
  if (url.pathname === "/api/visa-request" && request.method === "POST") {
    return handleVisaRequest(request, env, corsHeaders);
  }

  // POST /api/sponsorship-inquiry
  if (
    url.pathname === "/api/sponsorship-inquiry" &&
    request.method === "POST"
  ) {
    return handleSponsorshipInquiry(request, env, corsHeaders);
  }

  // GET /api/speaker-hotel/check-invite?email= — row exists in speaker_invites (any token state)
  if (
    url.pathname === "/api/speaker-hotel/check-invite" &&
    request.method === "GET"
  ) {
    return handleSpeakerHotelCheckInvite(request, env, url, corsHeaders);
  }

  // POST /api/speaker-hotel-registration
  if (
    url.pathname === "/api/speaker-hotel-registration" &&
    request.method === "POST"
  ) {
    return handleSpeakerHotelRegistration(request, env, corsHeaders);
  }

  // POST /api/upload-trainee-letter
  if (url.pathname === "/api/upload-trainee-letter") {
    if (request.method === "POST") {
      return handleTraineeLetterUpload(request, env, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed. Please use POST.",
        }),
        { status: 405, headers: corsHeaders },
      );
    }
  }

  // POST /api/create-payment-intent
  if (
    url.pathname === "/api/create-payment-intent" &&
    request.method === "POST"
  ) {
    return handleCreatePaymentIntent(request, env, corsHeaders);
  }

  // POST /api/stripe-webhook
  if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
    return handleStripeWebhook(request, env);
  }

  // GET /api/admin/abstracts
  if (url.pathname === "/api/admin/abstracts" && request.method === "GET") {
    return handleGetAbstracts(request, env, corsHeaders);
  }

  // POST /api/admin/abstracts/send-confirmations - Bulk (re)send confirmation emails
  if (
    url.pathname === "/api/admin/abstracts/send-confirmations" &&
    request.method === "POST"
  ) {
    return handleBulkSendAbstractConfirmations(request, env, corsHeaders);
  }

  // POST /api/admin/abstracts/send-decisions - Bulk (re)send accept/reject decision emails
  if (
    url.pathname === "/api/admin/abstracts/send-decisions" &&
    request.method === "POST"
  ) {
    return handleBulkSendAbstractDecisions(request, env, corsHeaders);
  }

  // POST /api/admin/abstracts/:id/send-confirmation - (Re)send a single confirmation email
  const sendConfirmationMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/([^/]+)\/send-confirmation$/,
  );
  if (sendConfirmationMatch && request.method === "POST") {
    return handleSendAbstractConfirmation(
      request,
      env,
      corsHeaders,
      sendConfirmationMatch[1],
    );
  }

  // POST /api/admin/abstracts/:id/send-decision - Manually send accept/reject decision email
  const sendDecisionMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/([^/]+)\/send-decision$/,
  );
  if (sendDecisionMatch && request.method === "POST") {
    return handleSendAbstractDecision(
      request,
      env,
      corsHeaders,
      sendDecisionMatch[1],
    );
  }

  // POST /api/admin/registrations/:id/send-confirmation - (Re)send a single registration confirmation email
  const sendRegistrationConfirmationMatch = url.pathname.match(
    /^\/api\/admin\/registrations\/([^/]+)\/send-confirmation$/,
  );
  if (sendRegistrationConfirmationMatch && request.method === "POST") {
    return handleSendRegistrationConfirmation(
      request,
      env,
      corsHeaders,
      sendRegistrationConfirmationMatch[1],
    );
  }

  // PATCH /api/admin/registrations/:id/trainee-letter-status
  const traineeLetterStatusMatch = url.pathname.match(
    /^\/api\/admin\/registrations\/([^/]+)\/trainee-letter-status$/,
  );
  if (traineeLetterStatusMatch && request.method === "PATCH") {
    return handleUpdateTraineeLetterStatus(
      request,
      env,
      corsHeaders,
      traineeLetterStatusMatch[1],
    );
  }

  // PATCH /api/admin/abstracts/:id/status - Update abstract status
  const abstractStatusMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/([^/]+)\/status$/,
  );
  if (abstractStatusMatch && request.method === "PATCH") {
    return handleUpdateAbstractStatus(
      request,
      env,
      corsHeaders,
      abstractStatusMatch[1],
    );
  }

  // PATCH /api/admin/abstracts/:id/invited-speaker - Toggle invited speaker flag
  const abstractInvitedMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/([^/]+)\/invited-speaker$/,
  );
  if (abstractInvitedMatch && request.method === "PATCH") {
    return handleUpdateAbstractInvitedSpeaker(
      request,
      env,
      corsHeaders,
      abstractInvitedMatch[1],
    );
  }

  // PATCH /api/admin/abstracts/:id/speakers - Change presenting/corresponding authors
  const abstractSpeakersMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/([^/]+)\/speakers$/,
  );
  if (abstractSpeakersMatch && request.method === "PATCH") {
    return handleUpdateAbstractSpeakers(
      request,
      env,
      corsHeaders,
      abstractSpeakersMatch[1],
    );
  }

  // POST /api/admin/abstracts/accept-invited-speakers - Accept all invited speaker abstracts
  if (
    url.pathname === "/api/admin/abstracts/accept-invited-speakers" &&
    request.method === "POST"
  ) {
    return handleAcceptAllInvitedSpeakerAbstracts(request, env, corsHeaders);
  }

  // GET /api/admin/visa-requests
  if (url.pathname === "/api/admin/visa-requests" && request.method === "GET") {
    return handleGetVisaRequests(request, env, corsHeaders);
  }

  // PATCH /api/admin/visa-requests/:id/status
  const visaStatusMatch = url.pathname.match(
    /^\/api\/admin\/visa-requests\/([^/]+)\/status$/,
  );
  if (visaStatusMatch && request.method === "PATCH") {
    return handleUpdateVisaRequestStatus(
      request,
      env,
      corsHeaders,
      visaStatusMatch[1],
    );
  }

  // POST /api/admin/visa-requests/:id/delete
  const visaDeleteMatch = url.pathname.match(
    /^\/api\/admin\/visa-requests\/([^/]+)\/delete$/,
  );
  if (visaDeleteMatch && request.method === "POST") {
    return handleDeleteVisaRequest(
      request,
      env,
      corsHeaders,
      visaDeleteMatch[1],
    );
  }

  // GET /api/admin/speaker-hotel-registrations
  if (
    url.pathname === "/api/admin/speaker-hotel-registrations" &&
    request.method === "GET"
  ) {
    return handleGetSpeakerHotelRegistrations(request, env, corsHeaders);
  }

  // POST /api/admin/visa-requests/resend-reviewer-email
  if (
    url.pathname === "/api/admin/visa-requests/resend-reviewer-email" &&
    request.method === "POST"
  ) {
    return handleResendVisaReviewerEmails(request, env, corsHeaders);
  }

  // POST /api/reviewers/login
  if (url.pathname === "/api/reviewers/login" && request.method === "POST") {
    return handleReviewerLogin(request, env, corsHeaders);
  }

  // GET /api/reviewers/abstracts
  if (url.pathname === "/api/reviewers/abstracts" && request.method === "GET") {
    return handleGetReviewerAbstracts(request, env, corsHeaders);
  }

  // POST /api/reviewers/reviews
  if (url.pathname === "/api/reviewers/reviews" && request.method === "POST") {
    return handleSubmitReviewerReview(request, env, corsHeaders);
  }

  // POST /api/admin/reviewers/create (create/activate reviewer by email)
  if (
    url.pathname === "/api/admin/reviewers/create" &&
    request.method === "POST"
  ) {
    return handleAdminCreateReviewer(request, env, corsHeaders);
  }

  // POST /api/admin/speaker-invites/create (create or return token for email)
  if (
    url.pathname === "/api/admin/speaker-invites/create" &&
    request.method === "POST"
  ) {
    return handleAdminCreateSpeakerInvite(request, env, corsHeaders);
  }

  // POST /api/admin/test-payment-intent (admin-only $1 live test payment)
  if (
    url.pathname === "/api/admin/test-payment-intent" &&
    request.method === "POST"
  ) {
    return handleAdminTestPaymentIntent(request, env, corsHeaders);
  }

  // GET /api/admin/env-vars (admin-only env visibility)
  if (url.pathname === "/api/admin/env-vars" && request.method === "GET") {
    return handleAdminEnvVars(request, env, corsHeaders);
  }

  // GET /api/admin/reviewers/overview
  if (
    url.pathname === "/api/admin/reviewers/overview" &&
    request.method === "GET"
  ) {
    return handleAdminReviewerOverview(request, env, corsHeaders);
  }

  // GET/POST /api/admin/reviewers/settings (abstracts per reviewer)
  if (
    url.pathname === "/api/admin/reviewers/settings" &&
    (request.method === "GET" || request.method === "POST")
  ) {
    return handleAdminReviewerSettings(request, env, corsHeaders);
  }

  // GET /api/admin/reviewers/list (all reviewer accounts + individual targets)
  if (
    url.pathname === "/api/admin/reviewers/list" &&
    request.method === "GET"
  ) {
    return handleAdminListReviewers(request, env, corsHeaders);
  }

  // POST /api/admin/reviewers/target (set one reviewer's abstract count)
  if (
    url.pathname === "/api/admin/reviewers/target" &&
    request.method === "POST"
  ) {
    return handleAdminSetReviewerTarget(request, env, corsHeaders);
  }

  // GET /api/admin/reviewers/abstract-scores
  if (
    url.pathname === "/api/admin/reviewers/abstract-scores" &&
    request.method === "GET"
  ) {
    return handleAdminReviewerAbstractScores(request, env, corsHeaders);
  }

  // GET /api/speaker-profiles/public — plenary + congress grids (D1 only)
  if (
    url.pathname === "/api/speaker-profiles/public" &&
    request.method === "GET"
  ) {
    return handleGetPublicSpeakerProfiles(request, env, corsHeaders);
  }

  // GET /api/speaker-profiles/invite-check?email= — same list as /api/speaker-invites/check, no token; ignores used (after registration is OK)
  if (
    url.pathname === "/api/speaker-profiles/invite-check" &&
    request.method === "GET"
  ) {
    return handleSpeakerProfileInviteCheck(request, env, url, corsHeaders);
  }

  // POST /api/speaker-profiles/submit (multipart, invited speakers)
  if (
    url.pathname === "/api/speaker-profiles/submit" &&
    request.method === "POST"
  ) {
    return handleSubmitSpeakerProfile(request, env, corsHeaders);
  }

  // GET /api/admin/speaker-profiles
  if (
    url.pathname === "/api/admin/speaker-profiles" &&
    request.method === "GET"
  ) {
    return handleAdminListSpeakerProfiles(request, env, corsHeaders);
  }

  const spApproveMatch = url.pathname.match(
    /^\/api\/admin\/speaker-profiles\/([^/]+)\/approve$/,
  );
  if (spApproveMatch && request.method === "POST") {
    return handleAdminSpeakerProfileApprove(
      request,
      env,
      corsHeaders,
      spApproveMatch[1],
    );
  }

  const spRejectMatch = url.pathname.match(
    /^\/api\/admin\/speaker-profiles\/([^/]+)\/reject$/,
  );
  if (spRejectMatch && request.method === "POST") {
    return handleAdminSpeakerProfileReject(
      request,
      env,
      corsHeaders,
      spRejectMatch[1],
    );
  }

  const spDeleteMatch = url.pathname.match(
    /^\/api\/admin\/speaker-profiles\/([^/]+)\/delete$/,
  );
  if (spDeleteMatch && request.method === "POST") {
    return handleAdminSpeakerProfileDelete(
      request,
      env,
      corsHeaders,
      spDeleteMatch[1],
    );
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

async function handleCheckMemberProxy(request, env, corsHeaders) {
  try {
    const upstreamUrl =
      String(env.ISIR_MEMBER_CHECK_ENDPOINT || "").trim() ||
      "https://theisir.org/wp-admin/admin-ajax.php";

    const requestBody = await request.text();
    let email = "";
    let name = "";
    try {
      const bodyJson = JSON.parse(requestBody || "{}");
      email = String(bodyJson?.email ?? "").trim();
      name = String(bodyJson?.name ?? "").trim();
    } catch {
      // ignore
    }

    const formBody = new URLSearchParams();
    formBody.set("action", "isir_check_member");
    formBody.set("email", email);
    formBody.set("name", name);

    const upstreamHeaders = {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      // Some WordPress/WAF stacks block non-browser fetch; avoid 403 from bot rules.
      "User-Agent":
        "Mozilla/5.0 (compatible; ISIR-Conference-Worker/1.0; +https://www.isir2026.org)",
    };

    // Keep the API key server-side when configured.
    const serverApiKey = String(env.ISIR_API_KEY || "").trim();
    const clientApiKey = String(
      request.headers.get("X-ISIR-API-Key") || "",
    ).trim();
    const effectiveApiKey = serverApiKey || clientApiKey;
    if (effectiveApiKey) {
      upstreamHeaders["X-ISIR-API-Key"] = effectiveApiKey;
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: formBody.toString(),
    });

    const responseText = await upstreamResponse.text();
    let responsePayload;
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = {
        success: false,
        message: "Invalid response from membership service",
        raw: responseText,
      };
    }

    return new Response(JSON.stringify(responsePayload), {
      status: upstreamResponse.status,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Membership proxy error:", error);
    return jsonResponse(
      {
        success: false,
        message: error.message || "Failed to verify membership",
      },
      502,
      corsHeaders,
    );
  }
}

function getBearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders });
}

/** D1 allows at most 100 bound parameters per query. */
const D1_MAX_BOUND_PARAMS = 100;

/**
 * Run a query with an IN (?) list, chunking ids so we stay under D1's
 * bound-parameter limit. `buildSql(placeholders)` returns the full SQL.
 * `extraBinds` are prepended on every chunk (e.g. a reviewer email).
 */
async function d1AllWhereIn(db, buildSql, ids, extraBinds = []) {
  if (!ids.length) return [];
  const chunkSize = Math.max(1, D1_MAX_BOUND_PARAMS - extraBinds.length);
  const out = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    const res = await db
      .prepare(buildSql(placeholders))
      .bind(...extraBinds, ...chunk)
      .all();
    out.push(...(res.results || []));
  }
  return out;
}

/** Like d1AllWhereIn but for statements that use .run() (UPDATE/DELETE). */
async function d1RunWhereIn(db, buildSql, ids, extraBinds = []) {
  if (!ids.length) return;
  const chunkSize = Math.max(1, D1_MAX_BOUND_PARAMS - extraBinds.length);
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    await db
      .prepare(buildSql(placeholders))
      .bind(...extraBinds, ...chunk)
      .run();
  }
}

function normalizeEmail(value) {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  const m = s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (m ? m[0] : s).trim().toLowerCase();
}

function getFlatDiscountConfig(env) {
  const expectedCode =
    typeof env.REGISTRATION_FLAT_DISCOUNT_CODE === "string"
      ? env.REGISTRATION_FLAT_DISCOUNT_CODE.trim()
      : "";
  const amountUsd = Number(env.REGISTRATION_FLAT_DISCOUNT_AMOUNT_USD || 175);
  const enabled =
    expectedCode.length > 0 && Number.isFinite(amountUsd) && amountUsd >= 0;
  return { expectedCode, amountUsd, enabled };
}

function isValidFlatDiscountCode(env, rawCode) {
  const { expectedCode, enabled } = getFlatDiscountConfig(env);
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  if (!enabled || code.length === 0) return false;
  return code.toLowerCase() === expectedCode.toLowerCase();
}

function normalizeDiscountCode(rawCode) {
  return String(rawCode || "").trim().toLowerCase();
}

async function ensureDiscountCodeTables(env) {
  if (!env?.ISIR_DB) return;
  await env.ISIR_DB.prepare(
    `CREATE TABLE IF NOT EXISTS discount_code_settings (
      code TEXT PRIMARY KEY,
      max_uses INTEGER,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    )`,
  ).run();
  await env.ISIR_DB.prepare(
    `CREATE TABLE IF NOT EXISTS discount_code_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      email TEXT NOT NULL,
      registration_id TEXT,
      redeemed_at INTEGER NOT NULL,
      UNIQUE(code, email)
    )`,
  ).run();
  await env.ISIR_DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_discount_redemptions_code
     ON discount_code_redemptions (code)`,
  ).run();
}

async function getDiscountUsage(env, rawCode) {
  const code = normalizeDiscountCode(rawCode);
  if (!env?.ISIR_DB || !code) {
    return { code, maxUses: null, usedCount: 0, remainingUses: null };
  }
  await ensureDiscountCodeTables(env);
  const settings = await env.ISIR_DB.prepare(
    `SELECT max_uses FROM discount_code_settings WHERE code = ? LIMIT 1`,
  )
    .bind(code)
    .first();
  const used = await env.ISIR_DB.prepare(
    `SELECT COUNT(*) AS count FROM discount_code_redemptions WHERE code = ?`,
  )
    .bind(code)
    .first();
  const maxUses =
    settings && settings.max_uses != null ? Number(settings.max_uses) : null;
  const usedCount = Number(used?.count || 0);
  const remainingUses =
    maxUses == null ? null : Math.max(0, Number(maxUses) - usedCount);
  return { code, maxUses, usedCount, remainingUses };
}

async function upsertDiscountUsageLimit(env, rawCode, maxUses, updatedBy) {
  const code = normalizeDiscountCode(rawCode);
  if (!env?.ISIR_DB || !code) return;
  await ensureDiscountCodeTables(env);
  await env.ISIR_DB.prepare(
    `INSERT INTO discount_code_settings (code, max_uses, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       max_uses = excluded.max_uses,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  )
    .bind(code, maxUses, Date.now(), updatedBy || "admin")
    .run();
}

async function upsertDiscountRedemption(env, rawCode, email, registrationId) {
  const code = normalizeDiscountCode(rawCode);
  const normalizedEmail = normalizeEmail(email);
  if (!env?.ISIR_DB || !code || !normalizedEmail) return;
  await ensureDiscountCodeTables(env);
  await env.ISIR_DB.prepare(
    `INSERT INTO discount_code_redemptions (code, email, registration_id, redeemed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(code, email) DO UPDATE SET
       registration_id = excluded.registration_id,
       redeemed_at = excluded.redeemed_at`,
  )
    .bind(code, normalizedEmail, registrationId || null, Date.now())
    .run();
}

async function handleAdminCreateSpeakerInvite(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const data = await request.json();
    const email = normalizeEmail(data?.email);
    if (!email) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }

    const now = Date.now();

    // Return existing unused token if present (invites never expire)
    const existing = await env.ISIR_DB.prepare(
      `SELECT token, used_at FROM speaker_invites WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (existing?.token && Number(existing.used_at || 0) === 0) {
      return jsonResponse(
        {
          success: true,
          token: existing.token,
          email,
          reused: true,
        },
        200,
        corsHeaders,
      );
    }

    const token = crypto.randomUUID();
    // expires_at is kept for schema compatibility but no longer enforced; 0 = never expires
    await env.ISIR_DB.prepare(
      `INSERT INTO speaker_invites (token, email, created_at, expires_at, used_at, used_registration_id)
       VALUES (?, ?, ?, 0, NULL, NULL)
       ON CONFLICT(email) DO UPDATE SET
         token = excluded.token,
         created_at = excluded.created_at,
         expires_at = excluded.expires_at,
         used_at = NULL,
         used_registration_id = NULL`,
    )
      .bind(token, email, now)
      .run();

    return jsonResponse(
      { success: true, token, email, reused: false },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Create speaker invite error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to create invite" },
      500,
      corsHeaders,
    );
  }
}

async function handleVerifySpeakerInvite(request, env, url, corsHeaders) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    const token = (url.searchParams.get("token") || "").trim();
    if (!token) {
      return jsonResponse(
        { success: false, error: "token is required" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT token, email, used_at FROM speaker_invites WHERE token = ?`,
    )
      .bind(token)
      .first();

    if (!row?.email) {
      return jsonResponse(
        { success: false, error: "Invalid invite token" },
        404,
        corsHeaders,
      );
    }
    if (row.used_at != null && Number(row.used_at) > 0) {
      return jsonResponse(
        { success: false, error: "Invite token already used" },
        409,
        corsHeaders,
      );
    }

    return jsonResponse(
      { success: true, email: row.email },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Verify speaker invite error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to verify invite" },
      500,
      corsHeaders,
    );
  }
}

async function handleCheckSpeakerInviteByEmail(request, env, url, corsHeaders) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    const email = normalizeEmail(url.searchParams.get("email") || "");
    if (!email) {
      return jsonResponse(
        { success: false, error: "email is required" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT token, email, used_at FROM speaker_invites WHERE email = ?`,
    )
      .bind(email)
      .first();

    const eligible =
      Boolean(row?.token) &&
      (row.used_at == null || Number(row.used_at) === 0);

    return jsonResponse(
      {
        success: true,
        eligible,
        email,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Check speaker invite error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to check invite" },
      500,
      corsHeaders,
    );
  }
}

/** Same `speaker_invites` table as registration; email only (no token). Used invites still OK so people can register first, then submit a headshot. */
async function getSpeakerProfileInviteAccess(env, email) {
  if (!env.ISIR_DB || !email) {
    return { ok: false, code: "not_in_list" };
  }
  const row = await env.ISIR_DB.prepare(
    `SELECT email FROM speaker_invites WHERE email = ?`,
  )
    .bind(email)
    .first();
  if (!row?.email) {
    return { ok: false, code: "not_in_list" };
  }
  return { ok: true, code: "ok" };
}

async function handleSpeakerProfileInviteCheck(request, env, url, corsHeaders) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    const email = normalizeEmail(url.searchParams.get("email") || "");
    if (!email) {
      return jsonResponse(
        { success: false, error: "email is required" },
        400,
        corsHeaders,
      );
    }
    const access = await getSpeakerProfileInviteAccess(env, email);
    return jsonResponse(
      {
        success: true,
        allowed: access.ok,
        code: access.code,
        email,
      },
      200,
      corsHeaders,
    );
  } catch (e) {
    console.error("handleSpeakerProfileInviteCheck:", e);
    return jsonResponse(
      { success: false, error: "Failed to check invite" },
      500,
      corsHeaders,
    );
  }
}

async function requireReviewer(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const now = Date.now();
  const session = await env.ISIR_DB.prepare(
    `SELECT token, reviewer_email, expires_at FROM reviewer_sessions WHERE token = ?`,
  )
    .bind(token)
    .first();

  if (!session || !session.reviewer_email) return null;
  if (Number(session.expires_at) <= now) return null;
  return { email: session.reviewer_email, token };
}

function requireAdmin(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false;
  const headerToken = request.headers.get("X-Admin-Token");
  return Boolean(headerToken && headerToken === expected);
}

function ensureAdmin(request, env, corsHeaders) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return jsonResponse(
      {
        success: false,
        error:
          "Admin token is not configured on the server (missing ADMIN_TOKEN).",
      },
      500,
      corsHeaders,
    );
  }
  const headerToken = request.headers.get("X-Admin-Token");
  if (!headerToken) {
    return jsonResponse(
      { success: false, error: "Unauthorized (missing X-Admin-Token header)" },
      401,
      corsHeaders,
    );
  }
  if (headerToken !== expected) {
    return jsonResponse(
      { success: false, error: "Unauthorized" },
      401,
      corsHeaders,
    );
  }
  return null;
}

async function handleAdminCreateReviewer(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    const data = await request.json();
    const email = normalizeEmail(data?.email || "");
    if (!email) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }

    // Optional per-reviewer abstract count set at creation time
    let abstractsTarget = null;
    if (
      data?.abstracts_per_reviewer != null &&
      data.abstracts_per_reviewer !== ""
    ) {
      const n = Number(data.abstracts_per_reviewer);
      if (!Number.isInteger(n) || n < 1 || n > MAX_ABSTRACTS_PER_REVIEWER) {
        return jsonResponse(
          {
            success: false,
            error: `abstracts_per_reviewer must be an integer between 1 and ${MAX_ABSTRACTS_PER_REVIEWER}`,
          },
          400,
          corsHeaders,
        );
      }
      abstractsTarget = n;
    }

    const now = Date.now();

    const existing = await env.ISIR_DB.prepare(
      `SELECT email, active FROM reviewers WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (existing?.email) {
      await env.ISIR_DB.prepare(
        `UPDATE reviewers SET active = 1, updated_at = ? WHERE email = ?`,
      )
        .bind(now, email)
        .run();
    } else {
      await env.ISIR_DB.prepare(
        `INSERT INTO reviewers (email, password_hash, active, created_at, updated_at)
         VALUES (?, '', 1, ?, ?)`,
      )
        .bind(email, now, now)
        .run();
    }

    if (abstractsTarget != null) {
      await ensureReviewerSettingsTable(env);
      await env.ISIR_DB.prepare(
        `INSERT INTO reviewer_settings (key, value, updated_at, updated_by)
         VALUES (?, ?, ?, 'admin')
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
        .bind(reviewerTargetSettingKey(email), String(abstractsTarget), now)
        .run();
    }

    return jsonResponse(
      {
        success: true,
        email,
        existing: Boolean(existing?.email),
        abstracts_per_reviewer: abstractsTarget,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Create reviewer error:", error);
    return jsonResponse(
      { success: false, error: error.message },
      500,
      corsHeaders,
    );
  }
}

async function handleReviewerLogin(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const email = normalizeEmail(data?.email || "");
    if (!email) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT email, active FROM reviewers WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (!row?.email || Number(row.active) !== 1) {
      return jsonResponse(
        { success: false, error: "No active reviewer account for this email" },
        401,
        corsHeaders,
      );
    }

    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 1000 * 60 * 60 * 24 * 14; // 14 days
    await env.ISIR_DB.prepare(
      `INSERT INTO reviewer_sessions (token, reviewer_email, created_at, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(token, email, now, expiresAt)
      .run();

    return jsonResponse(
      { success: true, token, expires_at: expiresAt },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Reviewer login error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Login failed" },
      500,
      corsHeaders,
    );
  }
}

function shuffleInPlace(arr) {
  const a = arr;
  for (let i = a.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEFAULT_ABSTRACTS_PER_REVIEWER = 5;
const MAX_ABSTRACTS_PER_REVIEWER = 100;

async function ensureReviewerSettingsTable(env) {
  if (!env?.ISIR_DB) return;
  await env.ISIR_DB.prepare(
    `CREATE TABLE IF NOT EXISTS reviewer_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    )`,
  ).run();
}

async function getAbstractsPerReviewer(env) {
  try {
    await ensureReviewerSettingsTable(env);
    const row = await env.ISIR_DB.prepare(
      `SELECT value FROM reviewer_settings WHERE key = 'abstracts_per_reviewer' LIMIT 1`,
    ).first();
    const n = Number(row?.value);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ABSTRACTS_PER_REVIEWER) {
      return n;
    }
  } catch (error) {
    console.error("Failed to read abstracts_per_reviewer setting:", error);
  }
  return DEFAULT_ABSTRACTS_PER_REVIEWER;
}

function reviewerTargetSettingKey(email) {
  return `abstracts_per_reviewer:${email}`;
}

// Per-reviewer override; falls back to the global setting when not set.
async function getAbstractsTargetForReviewer(env, email) {
  try {
    await ensureReviewerSettingsTable(env);
    const row = await env.ISIR_DB.prepare(
      `SELECT value FROM reviewer_settings WHERE key = ? LIMIT 1`,
    )
      .bind(reviewerTargetSettingKey(email))
      .first();
    const n = Number(row?.value);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ABSTRACTS_PER_REVIEWER) {
      return n;
    }
  } catch (error) {
    console.error("Failed to read reviewer target setting:", error);
  }
  return getAbstractsPerReviewer(env);
}

// GET /api/admin/reviewers/list — all reviewer accounts with individual targets
async function handleAdminListReviewers(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    await ensureReviewerSettingsTable(env);

    const rows = await env.ISIR_DB.prepare(
      `SELECT r.email, r.active, r.created_at,
              (SELECT COUNT(*) FROM reviewer_assignments ra
               WHERE ra.reviewer_email = r.email) AS assigned_count
       FROM reviewers r
       ORDER BY r.email ASC`,
    ).all();

    const overrides = await env.ISIR_DB.prepare(
      `SELECT key, value FROM reviewer_settings
       WHERE key LIKE 'abstracts_per_reviewer:%'`,
    ).all();

    const overrideByEmail = {};
    (overrides.results || []).forEach((r) => {
      const email = String(r.key).slice("abstracts_per_reviewer:".length);
      const n = Number(r.value);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_ABSTRACTS_PER_REVIEWER) {
        overrideByEmail[email] = n;
      }
    });

    const defaultTarget = await getAbstractsPerReviewer(env);
    const reviewers = (rows.results || []).map((r) => ({
      email: r.email,
      active: Number(r.active) === 1,
      created_at: r.created_at || null,
      assigned_count: Number(r.assigned_count || 0),
      abstracts_target: overrideByEmail[r.email] ?? null,
    }));

    return jsonResponse(
      { success: true, default_target: defaultTarget, reviewers },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin list reviewers error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to list reviewers" },
      500,
      corsHeaders,
    );
  }
}

// POST /api/admin/reviewers/target — set/clear one reviewer's abstract count
async function handleAdminSetReviewerTarget(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const data = await request.json();
    const email = normalizeEmail(data?.email || "");
    if (!email) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }

    const reviewerRow = await env.ISIR_DB.prepare(
      `SELECT email FROM reviewers WHERE email = ?`,
    )
      .bind(email)
      .first();
    if (!reviewerRow?.email) {
      return jsonResponse(
        { success: false, error: "No reviewer account for this email" },
        404,
        corsHeaders,
      );
    }

    await ensureReviewerSettingsTable(env);
    const raw = data?.abstracts_per_reviewer;

    // Blank/null clears the individual number so the default applies again
    if (raw == null || raw === "") {
      await env.ISIR_DB.prepare(
        `DELETE FROM reviewer_settings WHERE key = ?`,
      )
        .bind(reviewerTargetSettingKey(email))
        .run();
      return jsonResponse(
        { success: true, email, abstracts_per_reviewer: null },
        200,
        corsHeaders,
      );
    }

    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > MAX_ABSTRACTS_PER_REVIEWER) {
      return jsonResponse(
        {
          success: false,
          error: `abstracts_per_reviewer must be an integer between 1 and ${MAX_ABSTRACTS_PER_REVIEWER}`,
        },
        400,
        corsHeaders,
      );
    }

    await env.ISIR_DB.prepare(
      `INSERT INTO reviewer_settings (key, value, updated_at, updated_by)
       VALUES (?, ?, ?, 'admin')
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
      .bind(reviewerTargetSettingKey(email), String(n), Date.now())
      .run();

    return jsonResponse(
      { success: true, email, abstracts_per_reviewer: n },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin set reviewer target error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to save setting" },
      500,
      corsHeaders,
    );
  }
}

// GET/POST /api/admin/reviewers/settings
async function handleAdminReviewerSettings(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    if (request.method === "POST") {
      const data = await request.json();
      const n = Number(data?.abstracts_per_reviewer);
      if (!Number.isInteger(n) || n < 1 || n > MAX_ABSTRACTS_PER_REVIEWER) {
        return jsonResponse(
          {
            success: false,
            error: `abstracts_per_reviewer must be an integer between 1 and ${MAX_ABSTRACTS_PER_REVIEWER}`,
          },
          400,
          corsHeaders,
        );
      }
      await ensureReviewerSettingsTable(env);
      await env.ISIR_DB.prepare(
        `INSERT INTO reviewer_settings (key, value, updated_at, updated_by)
         VALUES ('abstracts_per_reviewer', ?, ?, 'admin')
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      )
        .bind(String(n), Date.now())
        .run();
      return jsonResponse(
        { success: true, abstracts_per_reviewer: n },
        200,
        corsHeaders,
      );
    }

    const current = await getAbstractsPerReviewer(env);
    return jsonResponse(
      { success: true, abstracts_per_reviewer: current },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin reviewer settings error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to update settings" },
      500,
      corsHeaders,
    );
  }
}

async function handleGetReviewerAbstracts(request, env, corsHeaders) {
  try {
    const reviewer = await requireReviewer(request, env);
    if (!reviewer) {
      return jsonResponse(
        { success: false, error: "Unauthorized" },
        401,
        corsHeaders,
      );
    }

    // Ensure the configured number of assigned abstracts (persisted) — general submissions only
    const targetCount = await getAbstractsTargetForReviewer(
      env,
      reviewer.email,
    );

    const existing = await env.ISIR_DB.prepare(
      `SELECT ra.abstract_id
       FROM reviewer_assignments ra
       JOIN abstractions a ON a.id = ra.abstract_id
       WHERE ra.reviewer_email = ?
         AND COALESCE(a.is_invited_speaker, 0) != 1
       ORDER BY ra.assigned_at ASC`,
    )
      .bind(reviewer.email)
      .all();

    let assignedIds = (existing.results || []).map((r) => r.abstract_id);

    if (assignedIds.length < targetCount) {
      // Only assign general (non–invited speaker) abstracts to reviewers,
      // preferring the abstracts with the fewest reviewers assigned so far.
      const allAbstracts = await env.ISIR_DB.prepare(
        `SELECT a.id, COUNT(ra.abstract_id) AS assign_count
         FROM abstractions a
         LEFT JOIN reviewer_assignments ra ON ra.abstract_id = a.id
         WHERE a.status = 'submitted'
           AND COALESCE(a.is_invited_speaker, 0) != 1
         GROUP BY a.id
         LIMIT 1000`,
      ).all();

      const pool = (allAbstracts.results || [])
        .map((r) => ({ id: r.id, count: Number(r.assign_count || 0) }))
        .filter((r) => !assignedIds.includes(r.id));

      // Shuffle first so ties in assignment count are broken randomly,
      // then stable-sort by fewest reviewers assigned.
      shuffleInPlace(pool);
      pool.sort((a, b) => a.count - b.count);

      const toAdd = pool
        .slice(0, targetCount - assignedIds.length)
        .map((r) => r.id);

      if (toAdd.length > 0) {
        const now = Date.now();
        const stmt = env.ISIR_DB.prepare(
          `INSERT OR IGNORE INTO reviewer_assignments (reviewer_email, abstract_id, assigned_at) VALUES (?, ?, ?)`,
        );
        for (const absId of toAdd) {
          await stmt.bind(reviewer.email, absId, now).run();
        }
        assignedIds = [...assignedIds, ...toAdd];
      }
    }

    // Cap at the configured count (legacy/manual extras)
    if (assignedIds.length > targetCount) {
      assignedIds = assignedIds.slice(0, targetCount);
    }

    if (assignedIds.length === 0) {
      return jsonResponse(
        { success: true, data: [], existingReviews: [] },
        200,
        corsHeaders,
      );
    }

    const abstracts = await d1AllWhereIn(
      env.ISIR_DB,
      (ph) => `SELECT * FROM abstractions WHERE id IN (${ph})`,
      assignedIds,
    );

    // Attach authors/affiliations
    const authorRows = await d1AllWhereIn(
      env.ISIR_DB,
      (ph) => `SELECT * FROM authors WHERE abstract_id IN (${ph})`,
      assignedIds,
    );
    const affiliationRows = await d1AllWhereIn(
      env.ISIR_DB,
      (ph) => `SELECT * FROM affiliations WHERE abstract_id IN (${ph})`,
      assignedIds,
    );

    const authorsBy = {};
    authorRows.forEach((au) => {
      if (!authorsBy[au.abstract_id]) authorsBy[au.abstract_id] = [];
      authorsBy[au.abstract_id].push(au);
    });

    const affBy = {};
    affiliationRows.forEach((af) => {
      if (!affBy[af.abstract_id]) affBy[af.abstract_id] = [];
      affBy[af.abstract_id].push(af);
    });

    abstracts.forEach((a) => {
      a.authors = authorsBy[a.id] || [];
      a.affiliations = affBy[a.id] || [];
    });

    // Keep ordering stable to assignments
    const mapById = Object.fromEntries(abstracts.map((a) => [a.id, a]));
    const ordered = assignedIds.map((id) => mapById[id]).filter(Boolean);

    const existingReviewRows = await d1AllWhereIn(
      env.ISIR_DB,
      (ph) =>
        `SELECT * FROM reviews WHERE reviewer_email = ? AND abstract_id IN (${ph})`,
      assignedIds,
      [reviewer.email],
    );

    return jsonResponse(
      {
        success: true,
        data: ordered,
        existingReviews: existingReviewRows,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Get reviewer abstracts error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to load abstracts" },
      500,
      corsHeaders,
    );
  }
}

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.trunc(x)));
}

async function handleSubmitReviewerReview(request, env, corsHeaders) {
  try {
    const reviewer = await requireReviewer(request, env);
    if (!reviewer) {
      return jsonResponse(
        { success: false, error: "Unauthorized" },
        401,
        corsHeaders,
      );
    }

    const data = await request.json();
    const abstractId = (data?.abstract_id || "").trim();
    if (!abstractId) {
      return jsonResponse(
        { success: false, error: "abstract_id is required" },
        400,
        corsHeaders,
      );
    }

    // Ensure this abstract is assigned to reviewer
    const assignment = await env.ISIR_DB.prepare(
      `SELECT 1 FROM reviewer_assignments WHERE reviewer_email = ? AND abstract_id = ?`,
    )
      .bind(reviewer.email, abstractId)
      .first();
    if (!assignment) {
      return jsonResponse(
        { success: false, error: "Abstract not assigned to reviewer" },
        403,
        corsHeaders,
      );
    }

    const originality = clampInt(data?.originality, 0, 10);
    const clarity = clampInt(data?.clarity, 0, 10);
    const powerpoint = clampInt(data?.powerpoint, 0, 10);
    const study_design = clampInt(data?.study_design, 0, 10);
    const data_analysis = clampInt(data?.data_analysis, 0, 10);
    const significance = clampInt(data?.significance, 0, 10);
    const total =
      originality +
      clarity +
      powerpoint +
      study_design +
      data_analysis +
      significance;

    const coi_mentor_pi = data?.coi_mentor_pi ? 1 : 0;
    const coi_same_lab = data?.coi_same_lab ? 1 : 0;
    const coi_other = data?.coi_other ? 1 : 0;
    const coi_other_details = (data?.coi_other_details || "").trim() || null;
    const previous_study_notes =
      (data?.previous_study_notes || "").trim() || null;
    const now = Date.now();

    await env.ISIR_DB.prepare(
      `INSERT INTO reviews (
        reviewer_email, abstract_id,
        coi_mentor_pi, coi_same_lab, coi_other, coi_other_details,
        originality, clarity, powerpoint, study_design, data_analysis, significance,
        total, previous_study_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(reviewer_email, abstract_id) DO UPDATE SET
        coi_mentor_pi = excluded.coi_mentor_pi,
        coi_same_lab = excluded.coi_same_lab,
        coi_other = excluded.coi_other,
        coi_other_details = excluded.coi_other_details,
        originality = excluded.originality,
        clarity = excluded.clarity,
        powerpoint = excluded.powerpoint,
        study_design = excluded.study_design,
        data_analysis = excluded.data_analysis,
        significance = excluded.significance,
        total = excluded.total,
        previous_study_notes = excluded.previous_study_notes,
        updated_at = excluded.updated_at`,
    )
      .bind(
        reviewer.email,
        abstractId,
        coi_mentor_pi,
        coi_same_lab,
        coi_other,
        coi_other_details,
        originality,
        clarity,
        powerpoint,
        study_design,
        data_analysis,
        significance,
        total,
        previous_study_notes,
        now,
        now,
      )
      .run();

    return jsonResponse(
      { success: true, message: "Review saved", total },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Submit review error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to submit review" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: reviewer stats and assignments
async function handleAdminReviewerOverview(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    // Overall totals
    const totalsRow = await env.ISIR_DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM reviews) AS total_reviews,
         (SELECT COUNT(DISTINCT reviewer_email) FROM reviewer_assignments) AS total_reviewers_with_assignments,
         (SELECT COUNT(*) FROM reviewer_assignments) AS total_assignments`,
    ).first();

    // Per-reviewer aggregate stats
    const perReviewer = await env.ISIR_DB.prepare(
      `SELECT
         ra.reviewer_email,
         COUNT(*) AS assigned_count,
         SUM(CASE WHEN r.total IS NOT NULL THEN 1 ELSE 0 END) AS reviewed_count,
         AVG(r.total) AS avg_score,
         MAX(r.updated_at) AS last_review_at
       FROM reviewer_assignments ra
       LEFT JOIN reviews r
         ON r.reviewer_email = ra.reviewer_email
        AND r.abstract_id = ra.abstract_id
       GROUP BY ra.reviewer_email
       ORDER BY ra.reviewer_email ASC`,
    ).all();

    // Detailed assignments with abstracts and scores
    const assignmentDetails = await env.ISIR_DB.prepare(
      `SELECT
         ra.reviewer_email,
         ra.abstract_id,
         ra.assigned_at,
         a.title,
         a.status,
         r.total AS review_total,
         r.updated_at AS review_updated_at
       FROM reviewer_assignments ra
       JOIN abstractions a
         ON a.id = ra.abstract_id
       LEFT JOIN reviews r
         ON r.reviewer_email = ra.reviewer_email
        AND r.abstract_id = ra.abstract_id
       ORDER BY ra.reviewer_email ASC, ra.assigned_at ASC`,
    ).all();

    const reviewersMap = {};

    (perReviewer.results || []).forEach((row) => {
      reviewersMap[row.reviewer_email] = {
        reviewer_email: row.reviewer_email,
        assigned_count: Number(row.assigned_count || 0),
        reviewed_count: Number(row.reviewed_count || 0),
        avg_score:
          row.avg_score != null && !Number.isNaN(Number(row.avg_score))
            ? Number(row.avg_score)
            : null,
        last_review_at: row.last_review_at || null,
        assignments: [],
      };
    });

    (assignmentDetails.results || []).forEach((row) => {
      if (!reviewersMap[row.reviewer_email]) {
        reviewersMap[row.reviewer_email] = {
          reviewer_email: row.reviewer_email,
          assigned_count: 0,
          reviewed_count: 0,
          avg_score: null,
          last_review_at: null,
          assignments: [],
        };
      }
      reviewersMap[row.reviewer_email].assignments.push({
        abstract_id: row.abstract_id,
        assigned_at: row.assigned_at || null,
        title: row.title || "",
        status: row.status || "",
        review_total:
          row.review_total != null && !Number.isNaN(Number(row.review_total))
            ? Number(row.review_total)
            : null,
        review_updated_at: row.review_updated_at || null,
      });
    });

    const reviewers = Object.values(reviewersMap);
    const abstractsPerReviewer = await getAbstractsPerReviewer(env);

    return jsonResponse(
      {
        success: true,
        totals: {
          total_reviews: Number(totalsRow?.total_reviews || 0),
          total_reviewers_with_assignments: Number(
            totalsRow?.total_reviewers_with_assignments || 0,
          ),
          total_assignments: Number(totalsRow?.total_assignments || 0),
        },
        abstracts_per_reviewer: abstractsPerReviewer,
        reviewers,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin reviewer overview error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to load reviewer overview",
      },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: abstract-level review averages + reviewer notes/details
async function handleAdminReviewerAbstractScores(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    const abstractsResult = await env.ISIR_DB.prepare(
      `SELECT
         a.id,
         a.title,
         a.category,
         a.status,
         a.submission_date
       FROM abstractions a
       ORDER BY a.submission_date DESC`,
    ).all();

    const reviewAveragesResult = await env.ISIR_DB.prepare(
      `SELECT
         r.abstract_id,
         COUNT(*) AS review_count,
         AVG(r.originality) AS avg_originality,
         AVG(r.clarity) AS avg_clarity,
         AVG(r.study_design) AS avg_study_design,
         AVG(r.data_analysis) AS avg_data_analysis,
         AVG(r.significance) AS avg_significance,
         AVG(r.total) AS avg_total
       FROM reviews r
       GROUP BY r.abstract_id`,
    ).all();

    const reviewDetailsResult = await env.ISIR_DB.prepare(
      `SELECT
         r.abstract_id,
         r.reviewer_email,
         r.originality,
         r.clarity,
         r.study_design,
         r.data_analysis,
         r.significance,
         r.total,
         r.previous_study_notes,
         r.coi_mentor_pi,
         r.coi_same_lab,
         r.coi_other,
         r.coi_other_details,
         r.updated_at
       FROM reviews r
       ORDER BY r.updated_at DESC`,
    ).all();

    const avgByAbstract = {};
    (reviewAveragesResult.results || []).forEach((row) => {
      avgByAbstract[row.abstract_id] = {
        review_count: Number(row.review_count || 0),
        avg_originality:
          row.avg_originality != null ? Number(row.avg_originality) : null,
        avg_clarity: row.avg_clarity != null ? Number(row.avg_clarity) : null,
        avg_study_design:
          row.avg_study_design != null ? Number(row.avg_study_design) : null,
        avg_data_analysis:
          row.avg_data_analysis != null ? Number(row.avg_data_analysis) : null,
        avg_significance:
          row.avg_significance != null ? Number(row.avg_significance) : null,
        avg_total: row.avg_total != null ? Number(row.avg_total) : null,
      };
    });

    const detailsByAbstract = {};
    (reviewDetailsResult.results || []).forEach((row) => {
      if (!detailsByAbstract[row.abstract_id])
        detailsByAbstract[row.abstract_id] = [];
      detailsByAbstract[row.abstract_id].push({
        reviewer_email: row.reviewer_email,
        originality:
          row.originality != null && !Number.isNaN(Number(row.originality))
            ? Number(row.originality)
            : null,
        clarity:
          row.clarity != null && !Number.isNaN(Number(row.clarity))
            ? Number(row.clarity)
            : null,
        study_design:
          row.study_design != null && !Number.isNaN(Number(row.study_design))
            ? Number(row.study_design)
            : null,
        data_analysis:
          row.data_analysis != null && !Number.isNaN(Number(row.data_analysis))
            ? Number(row.data_analysis)
            : null,
        significance:
          row.significance != null && !Number.isNaN(Number(row.significance))
            ? Number(row.significance)
            : null,
        total:
          row.total != null && !Number.isNaN(Number(row.total))
            ? Number(row.total)
            : null,
        previous_study_notes: row.previous_study_notes || "",
        coi_mentor_pi: Number(row.coi_mentor_pi || 0) === 1,
        coi_same_lab: Number(row.coi_same_lab || 0) === 1,
        coi_other: Number(row.coi_other || 0) === 1,
        coi_other_details: row.coi_other_details || "",
        updated_at: row.updated_at || null,
      });
    });

    const abstracts = (abstractsResult.results || []).map((a) => ({
      id: a.id,
      title: a.title || "",
      category: a.category || "",
      status: a.status || "",
      submission_date: a.submission_date || null,
      review_summary: avgByAbstract[a.id] || {
        review_count: 0,
        avg_originality: null,
        avg_clarity: null,
        avg_study_design: null,
        avg_data_analysis: null,
        avg_significance: null,
        avg_total: null,
      },
      reviewer_reviews: detailsByAbstract[a.id] || [],
    }));

    return jsonResponse(
      {
        success: true,
        data: abstracts,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin reviewer abstract scores error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to load abstract review scores",
      },
      500,
      corsHeaders,
    );
  }
}

async function handleRegistration(request, env, corsHeaders) {
  try {
    const data = await request.json();
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const normalizedEmail = normalizeEmail(data?.email);
    if (!normalizedEmail) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }

    // Prevent duplicate registrations by email (authoritative server-side check)
    const existingRegistration = await env.ISIR_DB.prepare(
      `SELECT id, payment_status, payment_date FROM registrations WHERE lower(trim(email)) = ? LIMIT 1`,
    )
      .bind(normalizedEmail)
      .first();
    if (existingRegistration?.id) {
      const existingPaymentStatus = String(
        existingRegistration.payment_status || "",
      ).toLowerCase();
      const hasCompletedPayment =
        existingRegistration.payment_date != null &&
        Number(existingRegistration.payment_date) > 0;

      // Allow retries:
      // - failed: payment did not succeed
      // - pending with no payment_date: abandoned / incomplete checkout (never completed in DB)
      const canReplaceExisting =
        existingPaymentStatus === "failed" ||
        (existingPaymentStatus === "pending" && !hasCompletedPayment);

      if (canReplaceExisting) {
        await env.ISIR_DB.prepare(`DELETE FROM registrations WHERE id = ?`)
          .bind(existingRegistration.id)
          .run();
      } else {
        return jsonResponse(
          {
            success: false,
            error:
              "A registration with this email already exists. If you already registered, please check your email for confirmation.",
          },
          409,
          corsHeaders,
        );
      }
    }

    // Generate unique registration ID
    const registrationId = `REG-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    const registrationDate = Date.now();

    const countryNameRaw =
      typeof data.country === "object"
        ? data.country?.name || null
        : data.country || null;

    // Calculate total price
    const ticketPrices = {
      "isir-member": { early: 350, standard: 450 },
      "non-member": { early: 650, standard: 750 },
      "trainee-member": { early: 150, standard: 200 },
      "trainee-non-member": { early: 250, standard: 300 },
      "invited-speaker": { early: 0, standard: 0 },
      "korea-day-pass": { early: 200, standard: 250 },
    };

    const earlyBirdDeadline = new Date("2026-09-01").getTime();
    const isEarlyBird = registrationDate < earlyBirdDeadline;

    let dayPassDayList = [];
    let dayPassDaysStored = null;
    if (data.ticketType === "korea-day-pass") {
      if (!isSouthKoreaCountryName(countryNameRaw)) {
        return jsonResponse(
          {
            success: false,
            error:
              "Daypass (Korean locals only) requires your country to be South Korea.",
          },
          400,
          corsHeaders,
        );
      }
      dayPassDayList = parseClientDayPassDays(data);
      if (dayPassDayList.length === 0) {
        return jsonResponse(
          {
            success: false,
            error: "Select at least one congress day for your day pass.",
          },
          400,
          corsHeaders,
        );
      }
      dayPassDaysStored = JSON.stringify(dayPassDayList);
    }

    const dayPassUnit =
      ticketPrices["korea-day-pass"]?.[isEarlyBird ? "early" : "standard"] ?? 0;
    let ticketPrice =
      data.ticketType === "korea-day-pass"
        ? dayPassUnit * dayPassDayList.length
        : ticketPrices[data.ticketType]?.[isEarlyBird ? "early" : "standard"] ||
          0;

    let accompanyingCount =
      data.ticketType === "korea-day-pass"
        ? 0
        : Number(data.accompanyingPersonCount || 0);
    let galaDinnerAttending = data.galaDinnerAttending ? 1 : 0;
    let openingReceptionAttending = data.openingReceptionAttending ? 1 : 0;
    let lunchDays = Object.entries(data.mealAttendance?.lunch || {})
      .filter(([, attending]) => Boolean(attending))
      .map(([day]) => day);
    let breakfastDays = Object.entries(data.mealAttendance?.breakfast || {})
      .filter(([, attending]) => Boolean(attending))
      .map(([day]) => day);

    if (data.ticketType === "korea-day-pass") {
      const allowed = new Set(dayPassDayList);
      lunchDays = lunchDays.filter((d) => allowed.has(d));
      breakfastDays = breakfastDays.filter((d) => allowed.has(d));
    }

    let accompanyingPrice = (isEarlyBird ? 250 : 350) * accompanyingCount;
    let totalPrice = ticketPrice + accompanyingPrice;

    // Speaker invite override: enforce free base ticket and validate token
    let isInvitedSpeaker = 0;
    let invitedSpeakerToken = null;
    if (data.ticketType === "invited-speaker") {
      const email = normalizedEmail;
      const token = (data.inviteToken || data.invitedSpeakerToken || "").trim();

      let invite = null;
      if (token) {
        invite = await env.ISIR_DB.prepare(
          `SELECT token, email, used_at FROM speaker_invites WHERE token = ?`,
        )
          .bind(token)
          .first();
      } else {
        // Email-only flow (no link): look up invite by email
        invite = await env.ISIR_DB.prepare(
          `SELECT token, email, used_at FROM speaker_invites WHERE email = ?`,
        )
          .bind(email)
          .first();
      }

      if (!invite?.email) {
        return jsonResponse(
          { success: false, error: "Invalid invite token" },
          400,
          corsHeaders,
        );
      }
      if (normalizeEmail(invite.email) !== email) {
        return jsonResponse(
          { success: false, error: "Invite token does not match email" },
          400,
          corsHeaders,
        );
      }
      if (invite.used_at != null && Number(invite.used_at) > 0) {
        return jsonResponse(
          { success: false, error: "Invite token already used" },
          409,
          corsHeaders,
        );
      }

      // Enforce free ticket price; accompanying is still paid (if any)
      isInvitedSpeaker = 1;
      invitedSpeakerToken = String(invite.token);
      // Speakers register for free; accompanying persons are still paid
      totalPrice = accompanyingPrice;
    }

    // Preview pricing: flat total when client sends valid preview key (same secret as ?preview= URL; 0 = free)
    let isPreviewModeRequest = false;
    const previewKeyRaw =
      typeof data.previewKey === "string" ? data.previewKey.trim() : "";
    const expectedPreviewKey = env.PREVIEW_KEY || "isir2026test";
    if (previewKeyRaw && previewKeyRaw === expectedPreviewKey) {
      isPreviewModeRequest = true;
      totalPrice = 0;
    }

    // Discount-code override: force a flat registration total regardless of selected ticket mode.
    const discountCodeRaw =
      typeof data.discountCode === "string" ? data.discountCode.trim() : "";
    const { amountUsd: flatDiscountUsd } = getFlatDiscountConfig(env);
    const hasValidFlatDiscountCode = isValidFlatDiscountCode(env, discountCodeRaw);
    if (discountCodeRaw.length > 0 && !hasValidFlatDiscountCode) {
      return jsonResponse(
        { success: false, error: "Invalid discount code" },
        400,
        corsHeaders,
      );
    }
    if (hasValidFlatDiscountCode) {
      const discountUsage = await getDiscountUsage(env, discountCodeRaw);
      if (
        discountUsage.maxUses != null &&
        Number(discountUsage.remainingUses || 0) <= 0
      ) {
        return jsonResponse(
          {
            success: false,
            error: "This discount code has reached its usage limit",
          },
          409,
          corsHeaders,
        );
      }
      totalPrice = flatDiscountUsd;
    }

    // Extract primitive values from objects (react-country-state-city returns objects)
    const city =
      typeof data.city === "object"
        ? data.city?.name || null
        : data.city || null;
    const state =
      typeof data.stateSelect === "object"
        ? data.stateSelect?.name || null
        : data.stateSelect || data.stateText || null;
    const country =
      typeof data.country === "object"
        ? data.country?.name || null
        : data.country || null;

    // Insert into D1 database
    await env.ISIR_DB.prepare(
      `
      INSERT INTO registrations (
        id, registration_date, email, first_name, middle_name, last_name,
        salutation, suffix, institution, credentials, badge_name, pronouns,
        address1, address2, city, state, zip, country, phone, cell_phone,
        is_physician, ticket_type, accompanying_count, gala_dinner, gala_dinner_attending,
        lunch_days, breakfast_days, day_pass_days, opening_reception_attending, ticket_price, total_price,
        is_early_bird, dietary_vegan, dietary_vegetarian, dietary_gluten_free,
        dietary_kosher, dietary_other, special_assistance, policy_agreed,
        privacy_marketing, privacy_app, opt_out_mailing, payment_status,
        is_invited_speaker, invited_speaker_token,
        membership_level, membership_status, trainee_letter_url, trainee_letter_status, trainee_letter_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        registrationId,
        registrationDate,
        normalizedEmail,
        data.firstName,
        data.middleName || null,
        data.lastName,
        data.salutation || null,
        data.suffix || null,
        data.institution || null,
        data.credentials || null,
        data.badgeName || null,
        data.pronouns || null,
        data.address1 || null,
        data.address2 || null,
        city,
        state,
        data.zip || null,
        country,
        data.phone || null,
        data.cellPhone || null,
        data.isPhysician || null,
        data.ticketType,
        accompanyingCount,
        galaDinnerAttending,
        galaDinnerAttending,
        JSON.stringify(lunchDays),
        JSON.stringify(breakfastDays),
        dayPassDaysStored,
        openingReceptionAttending,
        ticketPrice,
        totalPrice,
        isEarlyBird ? 1 : 0,
        data.dietary?.vegan ? 1 : 0,
        data.dietary?.vegetarian ? 1 : 0,
        data.dietary?.glutenFree ? 1 : 0,
        data.dietary?.kosher ? 1 : 0,
        data.dietary?.other ? 1 : 0,
        data.specialAssistance ? 1 : 0,
        data.policyAgreed ? 1 : 0,
        data.privacyMarketing ? 1 : 0,
        data.privacyApp ? 1 : 0,
        data.optOutMailing ? 1 : 0,
        (isInvitedSpeaker && totalPrice === 0) ||
          (isPreviewModeRequest && totalPrice === 0)
          ? "completed"
          : "pending",
        isInvitedSpeaker,
        invitedSpeakerToken,
        data.membershipLevel || null,
        data.membershipStatus || null,
        data.traineeLetterUrl || null,
        data.traineeLetterUrl ? "pending" : "not_required",
        data.traineeLetterUrl ? Date.now() : null,
      )
      .run();

    if (hasValidFlatDiscountCode) {
      await upsertDiscountRedemption(
        env,
        discountCodeRaw,
        normalizedEmail,
        registrationId,
      );
    }

    if (isInvitedSpeaker && totalPrice === 0 && env.ISIR_DB) {
      try {
        await env.ISIR_DB.prepare(
          `UPDATE speaker_invites SET used_at = ?, used_registration_id = ? WHERE token = ?`,
        )
          .bind(Date.now(), registrationId, invitedSpeakerToken)
          .run();
        // Mark payment date for free registrations (helps reporting/email logic)
        await env.ISIR_DB.prepare(
          `UPDATE registrations SET payment_date = ? WHERE id = ?`,
        )
          .bind(Date.now(), registrationId)
          .run();
      } catch (e) {
        console.error("Failed to mark invite used:", e);
      }
    } else if (isPreviewModeRequest && totalPrice === 0 && env.ISIR_DB) {
      try {
        await env.ISIR_DB.prepare(
          `UPDATE registrations SET payment_date = ? WHERE id = ?`,
        )
          .bind(Date.now(), registrationId)
          .run();
      } catch (e) {
        console.error("Failed to set preview registration payment date:", e);
      }
    }

    if (totalPrice === 0) {
      // Free registrations bypass Stripe webhook, so send confirmation here.
      await sendRegistrationConfirmationEmail(env, registrationId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: registrationId,
        totalPrice: totalPrice,
        message: "Registration saved successfully",
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to save registration",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

async function handleVerifyDiscountCode(env, url, corsHeaders) {
  try {
    const code = String(url.searchParams.get("code") || "").trim();
    if (!code) {
      return jsonResponse(
        { success: true, valid: false, error: "Discount code is required" },
        200,
        corsHeaders,
      );
    }
    const { amountUsd, enabled } = getFlatDiscountConfig(env);
    const valid = isValidFlatDiscountCode(env, code);
    const usage = valid
      ? await getDiscountUsage(env, code)
      : { maxUses: null, usedCount: null, remainingUses: null };
    const isExhausted =
      valid &&
      usage.maxUses != null &&
      Number(usage.remainingUses || 0) <= 0;
    return jsonResponse(
      {
        success: true,
        valid: valid && !isExhausted,
        amountUsd: valid ? amountUsd : null,
        maxUses: usage.maxUses,
        usedCount: usage.usedCount,
        remainingUses: usage.remainingUses,
        error: !enabled
          ? "Discount code feature is not configured"
          : !valid
            ? "Invalid discount code"
            : isExhausted
              ? "This discount code has reached its usage limit"
              : null,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        valid: false,
        error: error?.message || "Failed to verify discount code",
      },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminGetDiscountCode(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    const { expectedCode, amountUsd, enabled } = getFlatDiscountConfig(env);
    const usage = enabled
      ? await getDiscountUsage(env, expectedCode)
      : { maxUses: null, usedCount: 0, remainingUses: null };
    return jsonResponse(
      {
        success: true,
        discount: {
          code: expectedCode || "",
          enabled,
          amountUsd,
          maxUses: usage.maxUses,
          usedCount: usage.usedCount,
          remainingUses: usage.remainingUses,
        },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error?.message || "Failed to load discount details",
      },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminUpdateDiscountCode(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;
    const { expectedCode, enabled, amountUsd } = getFlatDiscountConfig(env);
    if (!enabled || !expectedCode) {
      return jsonResponse(
        { success: false, error: "Discount code feature is not configured" },
        400,
        corsHeaders,
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawMaxUses = body?.maxUses;
    let nextMaxUses = null;
    if (rawMaxUses == null || rawMaxUses === "") {
      nextMaxUses = null;
    } else {
      const parsed = Number(rawMaxUses);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return jsonResponse(
          { success: false, error: "maxUses must be a non-negative number" },
          400,
          corsHeaders,
        );
      }
      nextMaxUses = Math.floor(parsed);
    }

    await upsertDiscountUsageLimit(env, expectedCode, nextMaxUses, "admin");
    const usage = await getDiscountUsage(env, expectedCode);
    return jsonResponse(
      {
        success: true,
        discount: {
          code: expectedCode,
          enabled: true,
          amountUsd,
          maxUses: usage.maxUses,
          usedCount: usage.usedCount,
          remainingUses: usage.remainingUses,
        },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error?.message || "Failed to update discount settings",
      },
      500,
      corsHeaders,
    );
  }
}

/** Public check-in lookup: requires knowing the registration id (e.g. from QR). */
async function handleGetCheckinRegistration(
  env,
  corsHeaders,
  registrationIdRaw,
) {
  try {
    const id = String(registrationIdRaw || "").trim();
    if (!id || !/^[a-zA-Z0-9_-]{8,128}$/.test(id)) {
      return jsonResponse(
        { success: false, error: "Invalid registration id" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT id, first_name, last_name, email, ticket_type, accompanying_count, is_invited_speaker,
       lunch_days, breakfast_days, dinner_days, opening_reception_attending, gala_dinner_attending
       FROM registrations WHERE id = ? LIMIT 1`,
    )
      .bind(id)
      .first();

    if (!row?.id) {
      return jsonResponse(
        { success: false, error: "Registration not found" },
        404,
        corsHeaders,
      );
    }

    return jsonResponse({ success: true, data: row }, 200, corsHeaders);
  } catch (error) {
    console.error("Check-in registration lookup error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Lookup failed" },
      500,
      corsHeaders,
    );
  }
}

async function handleGetRegistrations(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    const result = await env.ISIR_DB.prepare(
      "SELECT * FROM registrations ORDER BY registration_date DESC",
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        data: result.results,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

async function handleAbstractSubmission(request, env, corsHeaders) {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "authors",
      "affiliations",
      "presenterName",
      "presenterEmail",
      "correspondingName",
      "correspondingEmail",
      "category",
      "abstractSubmissionType",
      "keywords",
      "abstract",
      "presentationPreference",
    ];

    for (const field of requiredFields) {
      if (field === "authors" || field === "affiliations") {
        let fieldData = data[field];
        if (typeof fieldData === "string") {
          try {
            fieldData = JSON.parse(fieldData);
          } catch (e) {
            return new Response(
              JSON.stringify({
                error: `Invalid ${field} format. Must be valid JSON array.`,
              }),
              { status: 400, headers: corsHeaders },
            );
          }
        }
        if (!Array.isArray(fieldData) || fieldData.length === 0) {
          return new Response(
            JSON.stringify({ error: `${field} must be a non-empty array` }),
            { status: 400, headers: corsHeaders },
          );
        }
      } else if (!data[field] || data[field].trim() === "") {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.presenterEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!emailRegex.test(data.correspondingEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid corresponding author email format" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Validate word count (max 300 words)
    const wordCount = data.abstract.split(/\s+/).filter((w) => w).length;
    if (wordCount > 300) {
      return new Response(
        JSON.stringify({
          error: `Abstract exceeds 300 word limit (current: ${wordCount} words)`,
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate presentation preference
    const validPreferences = ["oral", "poster", "either"];
    if (!validPreferences.includes(data.presentationPreference)) {
      return new Response(
        JSON.stringify({ error: "Invalid presentation preference" }),
        { status: 400, headers: corsHeaders },
      );
    }
    const submissionTypeMap = {
      "Clinical Studies": "Clinical Studies",
      "Basic Studies": "Basic Studies",
      "Clinical Research": "Clinical Studies",
      "Basic Research": "Basic Studies",
    };
    const normalizedSubmissionType =
      submissionTypeMap[data.abstractSubmissionType];
    if (!normalizedSubmissionType) {
      return new Response(
        JSON.stringify({ error: "Invalid abstract submission type" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Check submission window (aligned with SubmissionTab copy)
    // Open at start of March 15 UTC, close at end of August 7 UTC.
    const submissionOpens = Date.parse("2026-03-15T00:00:00Z");
    const submissionDeadline = Date.parse("2026-08-07T23:59:59Z");
    const now = Date.now();

    if (now > submissionDeadline) {
      return new Response(
        JSON.stringify({ error: "Submission deadline has passed" }),
        { status: 400, headers: corsHeaders },
      );
    }
    if (now < submissionOpens) {
      return new Response(
        JSON.stringify({ error: "Submission window has not opened yet" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate unique submission ID
    const submissionId = `ABS-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    const submissionDate = Date.now();

    // Parse and validate authors
    let authorsData =
      typeof data.authors === "string"
        ? JSON.parse(data.authors)
        : data.authors;

    for (const author of authorsData) {
      if (!author.firstName?.trim() || !author.lastName?.trim()) {
        return new Response(
          JSON.stringify({
            error: "All authors must have first and last name",
          }),
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // Determine presenting author id for linkage
    const presenterIdx = authorsData.findIndex((author) => author.isPresenter);
    if (presenterIdx === -1) {
      return new Response(
        JSON.stringify({ error: "A presenting author must be designated" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Determine corresponding author id for linkage
    const correspondingIdx = authorsData.findIndex(
      (author) => author.isCorresponding,
    );
    if (correspondingIdx === -1) {
      return new Response(
        JSON.stringify({ error: "A corresponding author must be designated" }),
        { status: 400, headers: corsHeaders },
      );
    }
    const correspondingAuthorId = `AUTH-${submissionId}-${correspondingIdx}`;
    const presenterAuthorId = `AUTH-${submissionId}-${presenterIdx}`;

    // Insert abstract. Store abstract_submission_type when available, and
    // gracefully fall back for older DBs that haven't run the migration yet.
    try {
      await env.ISIR_DB.prepare(
        `INSERT INTO abstractions (
          id, submission_date, title, category, abstract_submission_type, keywords, abstract,
          word_count, presentation_preference,
          presenter_name, presenter_email,
          presenter_author_id,
          corresponding_name, corresponding_email, corresponding_author_id,
          affiliations, status, created_at,
          is_invited_speaker
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          submissionId,
          submissionDate,
          data.title.trim(),
          data.category,
          normalizedSubmissionType,
          data.keywords.trim(),
          data.abstract.trim(),
          wordCount,
          data.presentationPreference,
          data.presenterName.trim(),
          data.presenterEmail.trim(),
          presenterAuthorId,
          data.correspondingName.trim(),
          data.correspondingEmail.trim(),
          correspondingAuthorId,
          data.affiliations || null,
          "submitted",
          submissionDate,
          data.isInvitedSpeaker ? 1 : 0,
        )
        .run();
    } catch (insertError) {
      const message = String(insertError?.message || "");
      if (!message.includes("abstract_submission_type")) {
        throw insertError;
      }
      await env.ISIR_DB.prepare(
        `INSERT INTO abstractions (
          id, submission_date, title, category, keywords, abstract,
          word_count, presentation_preference,
          presenter_name, presenter_email,
          presenter_author_id,
          corresponding_name, corresponding_email, corresponding_author_id,
          affiliations, status, created_at,
          is_invited_speaker
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          submissionId,
          submissionDate,
          data.title.trim(),
          data.category,
          data.keywords.trim(),
          data.abstract.trim(),
          wordCount,
          data.presentationPreference,
          data.presenterName.trim(),
          data.presenterEmail.trim(),
          presenterAuthorId,
          data.correspondingName.trim(),
          data.correspondingEmail.trim(),
          correspondingAuthorId,
          data.affiliations || null,
          "submitted",
          submissionDate,
          data.isInvitedSpeaker ? 1 : 0,
        )
        .run();
    }

    // Insert authors
    for (let i = 0; i < authorsData.length; i++) {
      const author = authorsData[i];
      const authorId = `AUTH-${submissionId}-${i}`;

      await env.ISIR_DB.prepare(
        `INSERT INTO authors (
          id, abstract_id, first_name, middle_name, last_name,
          email, is_presenter, is_corresponding, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          authorId,
          submissionId,
          author.firstName.trim(),
          author.middleName?.trim() || null,
          author.lastName.trim(),
          author.email?.trim() || null,
          author.isPresenter ? 1 : 0,
          author.isCorresponding ? 1 : 0,
          i,
        )
        .run();
    }

    // Insert affiliations
    let affiliationsData =
      typeof data.affiliations === "string"
        ? JSON.parse(data.affiliations)
        : data.affiliations;

    if (Array.isArray(affiliationsData)) {
      for (let i = 0; i < affiliationsData.length; i++) {
        const aff = affiliationsData[i];
        const affId = `AFF-${submissionId}-${i}`;

        await env.ISIR_DB.prepare(
          `INSERT INTO affiliations (
            id, abstract_id, author_name, department, institution,
            city, country, position
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            affId,
            submissionId,
            aff.authorName?.trim() || null,
            aff.department?.trim() || null,
            aff.institution?.trim() || null,
            aff.city?.trim() || null,
            aff.country?.trim() || null,
            i,
          )
          .run();
      }
    }

    // Send confirmation email to the corresponding author (non-blocking)
    try {
      await sendAbstractConfirmationEmail(env, {
        id: submissionId,
        title: data.title.trim(),
        category: data.category,
        abstract: data.abstract.trim(),
        word_count: wordCount,
        presentation_preference: data.presentationPreference,
        presenter_name: data.presenterName.trim(),
        presenter_email: data.presenterEmail.trim(),
        corresponding_name: data.correspondingName.trim(),
        corresponding_email: data.correspondingEmail.trim(),
      });
    } catch (emailError) {
      console.error("Abstract confirmation email error:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submissionId,
        message: "Abstract submitted successfully!",
      }),
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Abstract submission error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit abstract" }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// Build and send the abstract-received confirmation email via Resend.
// Accepts a normalized abstract row (DB columns or in-memory equivalent).
// On success, records the send timestamp on the abstract row.
async function sendAbstractConfirmationEmail(env, abstract) {
  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return {
      success: false,
      error:
        "Email service not configured (missing RESEND_API_KEY or CONFIRMATION_FROM_EMAIL).",
    };
  }
  if (!abstract || !abstract.id) {
    return { success: false, error: "Missing abstract record" };
  }

  const toEmail =
    (abstract.corresponding_email || "").trim() ||
    (abstract.presenter_email || "").trim();
  if (!toEmail) {
    return { success: false, error: "No recipient email on file" };
  }

  const name =
    (abstract.corresponding_name || "").trim() ||
    (abstract.presenter_name || "").trim() ||
    "Author";
  const submissionId = abstract.id;
  const title = (abstract.title || "").trim();
  const category = (abstract.category || "").trim();
  const pref = String(abstract.presentation_preference || "").toLowerCase();
  const prefLabel =
    pref === "oral"
      ? "Oral"
      : pref === "poster"
        ? "Poster"
        : pref === "either"
          ? "Oral or Poster"
          : abstract.presentation_preference || "";
  const wordCount = abstract.word_count || 0;
  const abstractText = (abstract.abstract || "").trim();
  const abstractSnippet = abstractText.slice(0, 280);
  const abstractDisplay =
    abstractSnippet + (abstractText.length > 280 ? "…" : "");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Abstract Received – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Abstract submission received</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Thank you for submitting your abstract to the ISIR 2026 World Congress. We have received your submission and it will be reviewed by the scientific committee.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Submission details</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0; vertical-align: top;">Submission ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(submissionId)}</strong></td></tr>
      <tr><td style="padding: 4px 0; vertical-align: top;">Title</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(title)}</td></tr>
      <tr><td style="padding: 4px 0;">Category</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(category)}</td></tr>
      <tr><td style="padding: 4px 0;">Presentation preference</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(prefLabel)}</td></tr>
      <tr><td style="padding: 4px 0;">Word count</td><td style="padding: 4px 0; text-align: right;">${wordCount} / 300</td></tr>
    </table>
    ${abstractDisplay ? `<p style="margin: 12px 0 0 0; font-size: 0.9rem; color: #555;"><strong>Abstract (excerpt):</strong><br/>${escapeHtml(abstractDisplay)}</p>` : ""}
  </div>
  <p><strong>What happens next</strong></p>
  <ul style="margin: 0 0 20px 0; padding-left: 1.2rem;">
    <li><strong>Save your Submission ID</strong> (${escapeHtml(submissionId)}) — you may need it when contacting us or checking status.</li>
    <li>Your abstract will be reviewed by the scientific committee. You will be notified of the outcome by email.</li>
  </ul>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@theisir.org" style="color: #1a3a6c;">support@theisir.org</a> and quote your submission ID.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to: [toEmail],
        subject: "ISIR 2026 – Abstract submission received",
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "Resend abstract confirmation failed:",
        res.status,
        errText,
      );
      return {
        success: false,
        error: `Resend ${res.status}: ${errText || "email send failed"}`,
      };
    }

    const sentAt = Date.now();
    // Best-effort persist the send timestamp. Swallow error if the column is
    // missing on older databases so that the email still counts as sent.
    try {
      await env.ISIR_DB.prepare(
        `UPDATE abstractions SET confirmation_sent_at = ? WHERE id = ?`,
      )
        .bind(sentAt, submissionId)
        .run();
    } catch (e) {
      console.warn(
        "Could not update confirmation_sent_at (migration pending?):",
        e?.message || e,
      );
    }

    console.log(`Abstract confirmation email sent to ${toEmail}`);
    return { success: true, toEmail, sentAt };
  } catch (emailError) {
    console.error("Abstract confirmation email error:", emailError);
    return {
      success: false,
      error: String(emailError?.message || emailError),
    };
  }
}

// Manual accept/reject decision email (not sent automatically on status change).
async function sendAbstractDecisionEmail(env, abstract) {
  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return {
      success: false,
      error:
        "Email service not configured (missing RESEND_API_KEY or CONFIRMATION_FROM_EMAIL).",
    };
  }
  if (!abstract || !abstract.id) {
    return { success: false, error: "Missing abstract record" };
  }

  const status = String(abstract.status || "")
    .trim()
    .toLowerCase();
  if (status !== "accepted" && status !== "rejected") {
    return {
      success: false,
      error:
        "Abstract must be marked accepted or rejected before sending a decision email.",
    };
  }

  const toEmail =
    (abstract.corresponding_email || "").trim() ||
    (abstract.presenter_email || "").trim();
  if (!toEmail) {
    return { success: false, error: "No recipient email on file" };
  }

  const name =
    (abstract.corresponding_name || "").trim() ||
    (abstract.presenter_name || "").trim() ||
    "Author";
  const submissionId = abstract.id;
  const title = (abstract.title || "").trim();
  const category = (abstract.category || "").trim();
  const rejectionReason = (abstract.rejection_reason || "").trim();
  const isAccepted = status === "accepted";

  const outcomeLabel = isAccepted ? "Accepted" : "Not accepted";
  const subject = isAccepted
    ? "ISIR 2026 – Abstract accepted"
    : "ISIR 2026 – Abstract decision";

  // Acceptance letter uses the official committee wording.
  // Rejection keeps a structured notice with optional committee reason.
  const html = isAccepted
    ? `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Abstract Accepted – ISIR 2026</title></head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
  <p>Dear ${escapeHtml(name)},</p>
  <p>On behalf of the organizing committee, congratulations! This letter is to inform you that your abstract has been accepted for the ISIR 2026 Congress in Busan, Korea (November 5th–8th, 2026).</p>
  <p>You will receive an additional separate notification if your submission is selected for an oral presentation.</p>
  <p style="margin-top: 28px;">Sincerely,<br/>The ISIR 2026 Organizing Committee</p>
</body>
</html>`
    : `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Abstract Not Accepted – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Abstract decision</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Thank you for submitting your abstract to the ISIR 2026 World Congress. After careful review by the scientific committee, we regret to inform you that your abstract was <strong style="color: #b91c1c;">not accepted</strong> for presentation this year.</p>
  ${
    rejectionReason
      ? `<div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">Committee note</p>
    <p style="margin: 0; color: #7f1d1d;">${escapeHtml(rejectionReason)}</p>
  </div>`
      : ""
  }
  <p>We sincerely appreciate your interest in ISIR 2026 and hope you will consider participating in future meetings.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Submission details</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0; vertical-align: top;">Submission ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(submissionId)}</strong></td></tr>
      <tr><td style="padding: 4px 0; vertical-align: top;">Title</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(title)}</td></tr>
      <tr><td style="padding: 4px 0;">Category</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(category)}</td></tr>
      <tr><td style="padding: 4px 0;">Decision</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(outcomeLabel)}</strong></td></tr>
    </table>
  </div>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@theisir.org" style="color: #1a3a6c;">support@theisir.org</a> and quote your submission ID.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Resend abstract decision failed:", res.status, errText);
      return {
        success: false,
        error: `Resend ${res.status}: ${errText || "email send failed"}`,
      };
    }

    const sentAt = Date.now();
    try {
      await env.ISIR_DB.prepare(
        `UPDATE abstractions SET decision_email_sent_at = ? WHERE id = ?`,
      )
        .bind(sentAt, submissionId)
        .run();
    } catch (e) {
      console.warn(
        "Could not update decision_email_sent_at (migration pending?):",
        e?.message || e,
      );
    }

    console.log(
      `Abstract decision email (${status}) sent to ${toEmail} for ${submissionId}`,
    );
    return { success: true, toEmail, sentAt, status };
  } catch (emailError) {
    console.error("Abstract decision email error:", emailError);
    return {
      success: false,
      error: String(emailError?.message || emailError),
    };
  }
}

const VISA_NOTIFY_EMAILS = [
  "sklee@kyuh.ac.kr",
  "office@the-ksri.org", // Ms. Lee, KSRI office
];
const VISA_NOTIFY_SALUTATION = "Sung Ki Lee and Ms. Lee";

function formatVisaSubmittedAt(timestamp) {
  return (
    new Date(timestamp).toISOString().replace("T", " ").slice(0, 19) + " UTC"
  );
}

function buildVisaReviewerNotificationHtml({
  visaRequestId,
  name,
  email,
  affiliation,
  nationality,
  timestamp,
  registrationProofUrl,
  isInvited,
}) {
  const submittedAt = formatVisaSubmittedAt(timestamp);
  const proofRow = isInvited
    ? `<tr><td style="padding: 4px 0;">Eligibility</td><td style="padding: 4px 0; text-align: right;"><strong>Invited speaker/chair</strong> (no proof required)</td></tr>`
    : registrationProofUrl
      ? `<tr><td style="padding: 4px 0;">Abstract / registration proof</td><td style="padding: 4px 0; text-align: right;"><a href="${escapeHtml(registrationProofUrl)}">View uploaded file</a></td></tr>`
      : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Visa Request – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">New visa invitation letter request</p>
  </div>
  <p>Dear ${escapeHtml(VISA_NOTIFY_SALUTATION)},</p>
  <p>A new visa invitation letter request has been submitted. Please prepare the standard invitation letter using the details below.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Applicant details (for template)</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Request ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(visaRequestId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Formal name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 4px 0;">Affiliation</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(affiliation)}</td></tr>
      <tr><td style="padding: 4px 0;">Nationality</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(nationality)}</td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      ${proofRow}
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
  </div>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 System</strong></p>
</body>
</html>`;
}

async function sendVisaReviewerNotificationEmail(env, visaRequest) {
  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return {
      success: false,
      skipped: true,
      error: "Resend not configured",
    };
  }

  const html = buildVisaReviewerNotificationHtml(visaRequest);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to: VISA_NOTIFY_EMAILS,
        subject: `ISIR 2026 – Visa letter request: ${visaRequest.name} (${visaRequest.nationality})`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Visa notification email failed:", res.status, err);
      return {
        success: false,
        error: `Resend ${res.status}: ${err || "email send failed"}`,
      };
    }

    console.log(
      `Visa notification email sent to ${VISA_NOTIFY_EMAILS.join(", ")}`,
    );
    return { success: true };
  } catch (emailError) {
    console.error("Visa notification email error:", emailError);
    return {
      success: false,
      error: String(emailError?.message || emailError),
    };
  }
}

async function handleVisaRequest(request, env, corsHeaders) {
  let uploadedR2Key = null;
  try {
    const contentType = String(request.headers.get("content-type") || "");
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Please submit the visa request form (multipart). Include proof unless you are an invited speaker/chair.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const formData = await request.formData();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const name = String(formData.get("name") || "").trim();
    const affiliationValue = String(formData.get("affiliation") || "").trim();
    const nationalityValue = String(
      formData.get("nationality") || formData.get("country") || "",
    ).trim();
    const isInvitedRaw = String(formData.get("isInvited") || "")
      .trim()
      .toLowerCase();
    const isInvited =
      isInvitedRaw === "true" ||
      isInvitedRaw === "1" ||
      isInvitedRaw === "yes";
    const file = formData.get("registrationProof") || formData.get("file");
    const hasFile = Boolean(file && typeof file !== "string" && file.size);

    if (!email || !name || !affiliationValue || !nationalityValue) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Email, formal name, affiliation, and nationality are required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!isInvited && !hasFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "A photo or PDF of your abstract acceptance or congress registration confirmation is required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const visaRequestId = crypto.randomUUID();
    const timestamp = Date.now();
    let r2Key = null;
    let originalFilename = null;
    const notes = isInvited ? "Invited speaker/chair" : null;

    if (hasFile) {
      if (!env.TRAINEE_LETTERS_BUCKET) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "File storage not configured. Please contact support.",
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const fileType = String(file.type || "").toLowerCase();
      if (!allowedTypes.includes(fileType)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid file type. Please upload a PDF, JPG, or PNG file.",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "File size exceeds 5MB limit.",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      const randomId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
      const mimeToExt = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
      };
      const extension = mimeToExt[fileType] || "file";
      originalFilename = String(file.name || `registration-proof.${extension}`)
        .trim()
        .slice(0, 200);
      r2Key = `visa-registration-proofs/${sanitizedEmail}_${timestamp}_${randomId}.${extension}`;

      const fileBuffer = await file.arrayBuffer();
      await env.TRAINEE_LETTERS_BUCKET.put(r2Key, fileBuffer, {
        httpMetadata: {
          contentType: fileType,
        },
        customMetadata: {
          email,
          visaRequestId,
          uploadedAt: new Date().toISOString(),
          originalName: originalFilename,
        },
      });
      uploadedR2Key = r2Key;
    }

    try {
      await env.ISIR_DB.prepare(
        `INSERT INTO visa_requests (
          id, email, name, affiliation, country, notes, status,
          registration_proof_r2_key, registration_proof_filename,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      )
        .bind(
          visaRequestId,
          email,
          name,
          affiliationValue,
          nationalityValue,
          notes,
          r2Key,
          originalFilename,
          timestamp,
          timestamp,
        )
        .run();
    } catch (dbError) {
      if (r2Key) {
        await safeDeleteR2Object(env, r2Key);
        uploadedR2Key = null;
      }
      throw dbError;
    }

    const requestOrigin = new URL(request.url).origin;
    const registrationProofUrl = r2Key ? `${requestOrigin}/${r2Key}` : null;

    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const submittedAt = formatVisaSubmittedAt(timestamp);
      await sendVisaReviewerNotificationEmail(env, {
        visaRequestId,
        name,
        email,
        affiliation: affiliationValue,
        nationality: nationalityValue,
        timestamp,
        registrationProofUrl,
        isInvited,
      });

      const proofRow = isInvited
        ? `<tr><td style="padding: 4px 0;">Eligibility</td><td style="padding: 4px 0; text-align: right;">Invited speaker/chair</td></tr>`
        : `<tr><td style="padding: 4px 0;">Abstract / registration proof</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(originalFilename || "—")}</td></tr>`;

      const thankYouLine = isInvited
        ? "Thank you for submitting your visa invitation letter request as an invited speaker/chair. Our coordinator will prepare your letter using the standard template and send it to this email address."
        : "Thank you for submitting your visa invitation letter request and abstract/registration proof. Our coordinator will prepare your letter using the standard template and send it to this email address.";

      const requesterHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Visa Request Received – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Visa invitation letter request received</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>${thankYouLine}</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Your submission</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Request ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(visaRequestId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Formal name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 4px 0;">Affiliation</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(affiliationValue)}</td></tr>
      <tr><td style="padding: 4px 0;">Nationality</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(nationalityValue)}</td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(email)}</td></tr>
      ${proofRow}
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
  </div>
  <p>If any detail is incorrect, please reply to this email promptly so we can update your letter.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
</body>
</html>`;

      try {
        const requesterRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.CONFIRMATION_FROM_EMAIL,
            to: [email],
            subject: "ISIR 2026 – Visa invitation letter request received",
            html: requesterHtml,
          }),
        });
        if (!requesterRes.ok) {
          const err = await requesterRes.text();
          console.error(
            "Visa requester confirmation email failed:",
            requesterRes.status,
            err,
          );
        } else {
          console.log(`Visa requester confirmation email sent to ${email}`);
        }
      } catch (emailError) {
        console.error("Visa requester confirmation email error:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        visaRequestId: visaRequestId,
        message: "Visa request submitted successfully",
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Visa request error:", error);
    if (uploadedR2Key) {
      await safeDeleteR2Object(env, uploadedR2Key);
    }
    const message = String(error?.message || "");
    const missingColumn =
      /no such column/i.test(message) &&
      /registration_proof/i.test(message);
    return new Response(
      JSON.stringify({
        success: false,
        error: missingColumn
          ? "Visa registration proof storage is not set up yet. Please run the database migration and try again."
          : "Failed to submit visa request",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

const SPONSORSHIP_NOTIFY_EMAILS = ["info@isir2026.org"];

const SPONSORSHIP_INTEREST_LABELS = {
  sponsorship: "Sponsorship package",
  exhibition: "Exhibition / Booth",
  both: "Sponsorship & Exhibition",
  undecided: "Not sure yet",
};

const SPONSORSHIP_PACKAGE_LABELS = {
  platinum: "Platinum Sponsor (USD 30,000)",
  gold: "Gold Sponsor (USD 20,000)",
  silver: "Silver Sponsor (USD 10,000)",
  bronze: "Bronze Sponsor (USD 5,000)",
  exhibitor: "Exhibitor (USD 2,500)",
  gala_dinner: "Gala Dinner Sponsor (USD 20,000)",
  luncheon_symposium: "Luncheon Symposium (USD 15,000)",
  welcome_reception: "Welcome Reception Sponsor (USD 10,000)",
  congress_bag: "Congress Bag Sponsor (USD 10,000)",
  young_investigator_award: "Young Investigator Award Sponsor (USD 7,500)",
  lanyard: "Lanyard Sponsor (USD 7,500)",
  travel_award: "Travel Award Sponsor (USD 5,000)",
  coffee_break: "Coffee Break Sponsor (USD 5,000)",
  wifi: "Wi-Fi Sponsor (USD 5,000)",
  mobile_app: "Mobile Application Sponsor (USD 5,000)",
  charging_station: "Charging Station Sponsor (USD 3,000)",
  custom: "Customized package",
  not_sure: "Not sure yet",
  // Legacy values from earlier form versions
  principal: "Principal Sponsor",
  exhibition_booth: "Exhibition Booth",
};

function formatSponsorshipInterest(value) {
  return SPONSORSHIP_INTEREST_LABELS[value] || value || "—";
}

function formatSponsorshipPackage(value) {
  if (!value) return "—";
  return SPONSORSHIP_PACKAGE_LABELS[value] || value;
}

function buildSponsorshipTeamNotificationHtml({
  inquiryId,
  company,
  name,
  email,
  phone,
  interest,
  packageInterest,
  message,
  timestamp,
}) {
  const submittedAt = formatVisaSubmittedAt(timestamp);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Sponsorship Inquiry – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">New sponsorship inquiry</p>
  </div>
  <p>A new sponsorship inquiry has been submitted via the congress website.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Inquiry details</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Inquiry ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(inquiryId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Company</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(company)}</td></tr>
      <tr><td style="padding: 4px 0;">Contact</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding: 4px 0;">Phone</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(phone || "—")}</td></tr>
      <tr><td style="padding: 4px 0;">Interest</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(formatSponsorshipInterest(interest))}</td></tr>
      <tr><td style="padding: 4px 0;">Package</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(formatSponsorshipPackage(packageInterest))}</td></tr>
      <tr><td style="padding: 4px 0; vertical-align: top;">Message</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(message || "—")}</td></tr>
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
  </div>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 System</strong></p>
</body>
</html>`;
}

async function sendSponsorshipTeamNotificationEmail(env, inquiry) {
  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return {
      success: false,
      skipped: true,
      error: "Resend not configured",
    };
  }

  const html = buildSponsorshipTeamNotificationHtml(inquiry);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to: SPONSORSHIP_NOTIFY_EMAILS,
        subject: `ISIR 2026 – Sponsorship inquiry: ${inquiry.company}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Sponsorship notification email failed:", res.status, err);
      return {
        success: false,
        error: `Resend ${res.status}: ${err || "email send failed"}`,
      };
    }

    console.log(
      `Sponsorship notification email sent to ${SPONSORSHIP_NOTIFY_EMAILS.join(", ")}`,
    );
    return { success: true };
  } catch (emailError) {
    console.error("Sponsorship notification email error:", emailError);
    return {
      success: false,
      error: String(emailError?.message || emailError),
    };
  }
}

async function handleSponsorshipInquiry(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const company = String(data?.company || "").trim();
    const name = String(data?.name || "").trim();
    const email = normalizeEmail(data?.email);
    const phone = String(data?.phone || "").trim();
    const interest = String(data?.interest || "").trim();
    const packageInterest = String(
      data?.packageInterest || data?.package_interest || "",
    ).trim();
    const message = String(data?.message || "").trim();

    if (!company || !name || !email || !interest) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Company, contact name, email, and interest type are required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const inquiryId = crypto.randomUUID();
    const timestamp = Date.now();

    await env.ISIR_DB.prepare(
      `INSERT INTO sponsorship_inquiries (
        id, company, name, email, phone, interest, package_interest, message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
      .bind(
        inquiryId,
        company,
        name,
        email,
        phone || null,
        interest,
        packageInterest || null,
        message || null,
        timestamp,
        timestamp,
      )
      .run();

    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const submittedAt = formatVisaSubmittedAt(timestamp);
      await sendSponsorshipTeamNotificationEmail(env, {
        inquiryId,
        company,
        name,
        email,
        phone,
        interest,
        packageInterest,
        message,
        timestamp,
      });

      const requesterHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sponsorship Inquiry Received – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Sponsorship inquiry received</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Thank you for your interest in sponsoring or exhibiting at ISIR 2026. Our sponsorship team has received your inquiry and will respond within 2–3 business days.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Your submission</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Inquiry ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(inquiryId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Company</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(company)}</td></tr>
      <tr><td style="padding: 4px 0;">Interest</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(formatSponsorshipInterest(interest))}</td></tr>
      <tr><td style="padding: 4px 0;">Package</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(formatSponsorshipPackage(packageInterest))}</td></tr>
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
  </div>
  <p>If you have additional questions in the meantime, you can reply to this email or contact us at <a href="mailto:info@isir2026.org">info@isir2026.org</a>.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Sponsorship Team</strong></p>
</body>
</html>`;

      try {
        const requesterRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.CONFIRMATION_FROM_EMAIL,
            to: [email],
            subject: "ISIR 2026 – Sponsorship inquiry received",
            html: requesterHtml,
          }),
        });
        if (!requesterRes.ok) {
          const err = await requesterRes.text();
          console.error(
            "Sponsorship requester confirmation email failed:",
            requesterRes.status,
            err,
          );
        } else {
          console.log(`Sponsorship requester confirmation email sent to ${email}`);
        }
      } catch (emailError) {
        console.error(
          "Sponsorship requester confirmation email error:",
          emailError,
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inquiryId,
        message: "Sponsorship inquiry submitted successfully",
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Sponsorship inquiry error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit sponsorship inquiry",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

function isValidSpeakerHotelIsoDate(iso) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) {
    return false;
  }
  const d = new Date(`${iso.trim()}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

async function handleSpeakerHotelCheckInvite(request, env, url, corsHeaders) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    const email = normalizeEmail(url.searchParams.get("email") || "");
    if (!email) {
      return jsonResponse({ success: false, error: "email is required" }, 400, corsHeaders);
    }
    const row = await env.ISIR_DB.prepare(
      `SELECT email FROM speaker_invites WHERE email = ?`,
    )
      .bind(email)
      .first();
    return jsonResponse(
      { success: true, invited: Boolean(row?.email) },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Speaker hotel check invite error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to check invite" },
      500,
      corsHeaders,
    );
  }
}

/** @returns {Promise<boolean>} whether Resend accepted the message */
async function sendSpeakerHotelConfirmationEmail(env, row) {
  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return false;
  }
  const {
    registrationId,
    invitedSpeakerEmail,
    passportName,
    nationality,
    guestCount,
    arrivalDate,
    departureDate,
    phone,
    addressPhysical,
    submittedAt,
  } = row;
  const to = [invitedSpeakerEmail];
  const addrShort =
    addressPhysical.length > 500
      ? `${escapeHtml(addressPhysical.slice(0, 500))}…`
      : escapeHtml(addressPhysical);
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Hotel registration – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Invited speaker hotel registration received</p>
  </div>
  <p>Thank you. We have recorded your hotel stay details for planning purposes.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Your submission</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Reference</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(registrationId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(invitedSpeakerEmail)}</td></tr>
      <tr><td style="padding: 4px 0;">Name (passport)</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(passportName)}</td></tr>
      <tr><td style="padding: 4px 0;">Nationality</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(nationality)}</td></tr>
      <tr><td style="padding: 4px 0;">Guests</td><td style="padding: 4px 0; text-align: right;">${guestCount}</td></tr>
      <tr><td style="padding: 4px 0;">Arrival</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(arrivalDate)}</td></tr>
      <tr><td style="padding: 4px 0;">Departure</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(departureDate)}</td></tr>
      <tr><td style="padding: 4px 0;">Phone</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(submittedAt)}</td></tr>
    </table>
    <p style="margin: 12px 0 0 0; font-size: 0.9rem; color: #555;"><strong>Address on file</strong><br/>${addrShort}</p>
  </div>
  <p>To update your stay details, submit the form again with the same invitation email; your latest submission will replace the previous one.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to,
        subject: "ISIR 2026 – Hotel registration received",
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Speaker hotel confirmation email failed:", res.status, err);
      return false;
    }
    console.log(`Speaker hotel confirmation email sent to ${to.join(", ")}`);
    return true;
  } catch (e) {
    console.error("Speaker hotel confirmation email error:", e);
    return false;
  }
}

async function handleSpeakerHotelRegistration(request, env, corsHeaders) {
  const maxLen = (s, n) => {
    const t = String(s ?? "").trim();
    if (t.length > n) return null;
    return t;
  };
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }
    const data = await request.json();
    const invitedSpeakerEmail = normalizeEmail(
      data?.invitedSpeakerEmail ?? data?.invited_speaker_email ?? "",
    );
    const passportName = maxLen(data?.passportName ?? data?.passport_name, 200);
    const nationality = maxLen(data?.nationality, 120);
    const guestCountRaw = Number(data?.guestCount ?? data?.guest_count);
    const guestCount =
      Number.isFinite(guestCountRaw) &&
      guestCountRaw >= 1 &&
      guestCountRaw <= 50
        ? Math.floor(guestCountRaw)
        : null;
    const addressPhysical = maxLen(data?.addressPhysical ?? data?.address_physical, 2000);
    const phone = maxLen(data?.phone, 80);
    const arrivalDate = String(data?.arrivalDate ?? data?.arrival_date ?? "").trim();
    const departureDate = String(
      data?.departureDate ?? data?.departure_date ?? "",
    ).trim();

    if (!invitedSpeakerEmail) {
      return jsonResponse(
        { success: false, error: "Invited speaker email is required" },
        400,
        corsHeaders,
      );
    }

    const inviteRow = await env.ISIR_DB.prepare(
      `SELECT email FROM speaker_invites WHERE email = ?`,
    )
      .bind(invitedSpeakerEmail)
      .first();
    if (!inviteRow?.email) {
      return jsonResponse(
        {
          success: false,
          error:
            "This email is not on the invited speaker list. Use the same email your invitation was sent to.",
        },
        403,
        corsHeaders,
      );
    }

    if (!passportName || !nationality || !addressPhysical || !phone) {
      return jsonResponse(
        {
          success: false,
          error:
            "Passport name, nationality, physical address, and phone are required",
        },
        400,
        corsHeaders,
      );
    }

    const contactEmail = invitedSpeakerEmail;
    if (guestCount === null) {
      return jsonResponse(
        {
          success: false,
          error: "Number of guests must be between 1 and 50 (include yourself)",
        },
        400,
        corsHeaders,
      );
    }
    if (!isValidSpeakerHotelIsoDate(arrivalDate)) {
      return jsonResponse(
        {
          success: false,
          error: "Arrival date must be a valid date (YYYY-MM-DD)",
        },
        400,
        corsHeaders,
      );
    }
    if (!isValidSpeakerHotelIsoDate(departureDate)) {
      return jsonResponse(
        {
          success: false,
          error: "Departure date must be a valid date (YYYY-MM-DD)",
        },
        400,
        corsHeaders,
      );
    }
    if (departureDate < arrivalDate) {
      return jsonResponse(
        {
          success: false,
          error: "Departure date must be on or after arrival date",
        },
        400,
        corsHeaders,
      );
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    await env.ISIR_DB.prepare(
      `INSERT INTO speaker_hotel_registrations (
        id, invited_speaker_email, passport_name, nationality, guest_count, address_physical,
        contact_email, phone, arrival_date, departure_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(invited_speaker_email) DO UPDATE SET
        passport_name = excluded.passport_name,
        nationality = excluded.nationality,
        guest_count = excluded.guest_count,
        address_physical = excluded.address_physical,
        contact_email = excluded.contact_email,
        phone = excluded.phone,
        arrival_date = excluded.arrival_date,
        departure_date = excluded.departure_date,
        updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        invitedSpeakerEmail,
        passportName,
        nationality,
        guestCount,
        addressPhysical,
        contactEmail,
        phone,
        arrivalDate,
        departureDate,
        now,
        now,
      )
      .run();

    const savedRow = await env.ISIR_DB.prepare(
      `SELECT id FROM speaker_hotel_registrations WHERE invited_speaker_email = ?`,
    )
      .bind(invitedSpeakerEmail)
      .first();
    const registrationId = String(savedRow?.id || id);
    const submittedAt = new Date(now).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const confirmationEmailSent = await sendSpeakerHotelConfirmationEmail(
      env,
      {
        registrationId,
        invitedSpeakerEmail,
        passportName,
        nationality,
        guestCount,
        arrivalDate,
        departureDate,
        phone,
        addressPhysical,
        submittedAt,
      },
    );

    return jsonResponse(
      {
        success: true,
        message: "Hotel registration saved",
        id: registrationId,
        confirmationEmailSent,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Speaker hotel registration error:", error);
    return jsonResponse(
      { success: false, error: "Failed to save hotel registration" },
      500,
      corsHeaders,
    );
  }
}

// Handle trainee letter upload to R2
async function handleTraineeLetterUpload(request, env, corsHeaders) {
  try {
    // Check if R2 bucket is configured
    if (!env.TRAINEE_LETTERS_BUCKET) {
      console.error("R2 bucket not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "File storage not configured. Please contact support.",
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const email = formData.get("email");
    const registrationType = formData.get("registrationType");

    // Validate required fields
    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file uploaded",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email is required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate file type (PDF, JPG, PNG only)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    const fileType = file.type;

    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid file type. Please upload a PDF, JPG, or PNG file.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File size exceeds 5MB limit.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const mimeToExt = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
    };
    const extension = mimeToExt[fileType] || "file";
    const fileName = `trainee-letters/${sanitizedEmail}_${timestamp}_${randomId}.${extension}`;

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.TRAINEE_LETTERS_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: fileType,
      },
      customMetadata: {
        email: email,
        registrationType: registrationType || "trainee",
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "File uploaded successfully",
        fileUrl: fileName,
        fileName: fileName,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to upload file",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

async function safeDeleteR2Object(env, key) {
  if (!key) return;
  try {
    const k = String(key);
    if (k.startsWith("speaker-photos/")) {
      const primary = isR2BucketBinding(env.SPEAKER_PHOTOS_BUCKET)
        ? env.SPEAKER_PHOTOS_BUCKET
        : null;
      const fallback = isR2BucketBinding(env.TRAINEE_LETTERS_BUCKET)
        ? env.TRAINEE_LETTERS_BUCKET
        : null;
      if (primary) await primary.delete(k);
      // Legacy safety: old speaker photos may exist in trainee bucket.
      if (fallback && fallback !== primary) await fallback.delete(k);
      return;
    }
    const bucket = isR2BucketBinding(env.TRAINEE_LETTERS_BUCKET)
      ? env.TRAINEE_LETTERS_BUCKET
      : null;
    if (!bucket) return;
    await bucket.delete(k);
  } catch (e) {
    console.error("R2 delete failed:", key, e);
  }
}

function splitNameParts(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { first_names: "", last_name: "" };
  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { first_names: "", last_name: parts[0] };
  }
  return {
    first_names: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function mapPublicSpeakerRow(r) {
  const sk =
    r.speaker_key != null && String(r.speaker_key).trim() !== ""
      ? String(r.speaker_key).trim()
      : null;
  const name = String(r.display_name || "");
  const { first_names, last_name } = splitNameParts(name);
  return {
    id: r.id,
    key: sk || `speaker-profile-${r.id}`,
    name,
    first_names,
    last_name,
    affiliation: r.affiliation,
    image: r.static_image || null,
    r2_key: r.r2_key || null,
    image_position: r.image_position || null,
  };
}

function sortSpeakersByLastNameAsc(a, b) {
  const byLast = String(a.last_name || "").localeCompare(
    String(b.last_name || ""),
    undefined,
    { sensitivity: "base" },
  );
  if (byLast !== 0) return byLast;
  const byFirst = String(a.first_names || "").localeCompare(
    String(b.first_names || ""),
    undefined,
    { sensitivity: "base" },
  );
  if (byFirst !== 0) return byFirst;
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
    sensitivity: "base",
  });
}

/** @returns {{ ok: true, ext: string, contentType: string } | { ok: false, error: string }} */
function getSpeakerBriefCvTypeAndExt(file) {
  const t = String(file.type || "").toLowerCase();
  if (t === "application/pdf")
    return { ok: true, ext: "pdf", contentType: "application/pdf" };
  if (t === "application/msword" || t === "application/x-msword")
    return { ok: true, ext: "doc", contentType: "application/msword" };
  if (
    t ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return {
      ok: true,
      ext: "docx",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".pdf"))
    return { ok: true, ext: "pdf", contentType: "application/pdf" };
  if (name.endsWith(".docx")) {
    return {
      ok: true,
      ext: "docx",
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  if (name.endsWith(".doc"))
    return { ok: true, ext: "doc", contentType: "application/msword" };
  return { ok: false, error: "Brief CV must be a PDF or Word file (.pdf, .doc, .docx)." };
}

async function handleGetPublicSpeakerProfiles(request, env, corsHeaders) {
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  try {
    const { results } = await env.ISIR_DB.prepare(
      `SELECT id, speaker_key, display_name, affiliation, r2_key, image_position, tier, static_image
       FROM speaker_profile_submissions WHERE status = 'approved'`,
    ).all();
    const plenary = [];
    const congress = [];
    for (const r of results || []) {
      const seed = seedRowBySpeakerKey(r.speaker_key);
      const tierRaw =
        r.tier != null && String(r.tier).trim() !== ""
          ? String(r.tier).trim()
          : null;
      const tier =
        tierRaw === "plenary" || tierRaw === "congress"
          ? tierRaw
          : seed?.tier === "plenary" || seed?.tier === "congress"
            ? seed.tier
            : null;
      const static_image =
        r.static_image != null && String(r.static_image).trim() !== ""
          ? String(r.static_image).trim()
          : seed?.image != null && String(seed.image).trim() !== ""
            ? String(seed.image).trim()
            : null;
      const image_position =
        r.image_position != null && String(r.image_position).trim() !== ""
          ? String(r.image_position).trim()
          : seed?.imagePosition != null &&
              String(seed.imagePosition).trim() !== ""
            ? String(seed.imagePosition).trim()
            : null;
      const merged = { ...r, tier, static_image, image_position };
      const row = mapPublicSpeakerRow(merged);
      if (merged.tier === "plenary") plenary.push(row);
      else congress.push(row);
    }
    plenary.sort(sortSpeakersByLastNameAsc);
    congress.sort(sortSpeakersByLastNameAsc);
    return new Response(
      JSON.stringify({
        success: true,
        plenary,
        congress,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    console.error("handleGetPublicSpeakerProfiles:", e);
    return jsonResponse(
      { success: false, error: "Failed to load speaker profiles" },
      500,
      corsHeaders,
    );
  }
}

async function handleSubmitSpeakerProfile(request, env, corsHeaders) {
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid form data" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const email = normalizeEmail(formData.get("email"));
  const firstName = String(formData.get("first_name") || "").trim();
  const middleName = String(formData.get("middle_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const legacyName = String(formData.get("name") || "").trim();
  const name =
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
    legacyName;
  const normalizedParts = splitNameParts(name);
  const dbFirstName = firstName || normalizedParts.first_names || null;
  const dbMiddleName = middleName || null;
  const dbLastName = lastName || normalizedParts.last_name || null;
  const affiliation = String(formData.get("affiliation") || "").trim();
  const presentationTitleRaw = String(
    formData.get("presentation_title") || "",
  ).trim();
  const file = formData.get("file");
  const wantsUpload = Boolean(
    file && typeof file.size === "number" && file.size > 0,
  );
  const cvFile = formData.get("brief_cv");
  const wantsCvUpload = Boolean(
    cvFile && typeof cvFile.size === "number" && cvFile.size > 0,
  );

  if ((wantsUpload || wantsCvUpload) && !getSpeakerPhotosBucketForWrite(env)) {
    return jsonResponse(
      {
        success: false,
        error:
          "Speaker photo storage is misconfigured. Bind SPEAKER_PHOTOS_BUCKET as an R2 bucket (not a plain env var).",
      },
      500,
      corsHeaders,
    );
  }
  if (!email) {
    return new Response(
      JSON.stringify({ success: false, error: "A valid email is required" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (name.length < 2) {
    return new Response(
      JSON.stringify({ success: false, error: "Please enter your first and last name" }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (affiliation.length < 3) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Please enter your full affiliation or institution",
      }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (affiliation.length > MAX_SPEAKER_AFFILIATION_CHARS) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Affiliation must be ${MAX_SPEAKER_AFFILIATION_CHARS} characters or fewer`,
      }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (!presentationTitleRaw) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Presentation title is required.",
      }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (presentationTitleRaw.length > MAX_SPEAKER_PRESENTATION_TITLE_CHARS) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Presentation title must be ${MAX_SPEAKER_PRESENTATION_TITLE_CHARS} characters or fewer`,
      }),
      { status: 400, headers: jsonHeaders },
    );
  }
  if (!wantsCvUpload) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Brief CV (PDF or Word) is required.",
      }),
      { status: 400, headers: jsonHeaders },
    );
  }
  const presentationTitle = presentationTitleRaw;

  const inviteAccess = await getSpeakerProfileInviteAccess(env, email);
  if (!inviteAccess.ok) {
    const msg =
      "This email is not on the invited speaker list. Use the same address the organizers added for your speaker invite (as for conference registration).";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  let r2Key = null;
  let cvR2Key = null;

  if (wantsUpload) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    const fileType = file.type;
    if (!allowedTypes.includes(fileType)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Photo must be JPEG or PNG.",
        }),
        { status: 400, headers: jsonHeaders },
      );
    }
    if (file.size > SPEAKER_PHOTO_MAX_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Photo is too large. Maximum size is 5 MB (JPEG or PNG).",
        }),
        { status: 400, headers: jsonHeaders },
      );
    }
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 11).toUpperCase();
    const ext = fileType === "image/png" ? "png" : "jpg";
    r2Key = `speaker-photos/nsp-${id.slice(0, 8)}_${timestamp}_${randomId}.${ext}`;
    const fileBuffer = await file.arrayBuffer();
    const speakerBucket = getSpeakerPhotosBucketForWrite(env);
    if (!speakerBucket) {
      return jsonResponse(
        {
          success: false,
          error:
            "Speaker photo storage is misconfigured. Bind SPEAKER_PHOTOS_BUCKET as an R2 bucket.",
        },
        500,
        corsHeaders,
      );
    }
    await speakerBucket.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: fileType },
      customMetadata: {
        email,
        submissionId: id,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  if (wantsCvUpload) {
    const cvResolved = getSpeakerBriefCvTypeAndExt(cvFile);
    if (!cvResolved.ok) {
      if (r2Key) {
        await safeDeleteR2Object(env, r2Key);
      }
      return new Response(
        JSON.stringify({ success: false, error: cvResolved.error }),
        { status: 400, headers: jsonHeaders },
      );
    }
    if (cvFile.size > SPEAKER_CV_MAX_BYTES) {
      if (r2Key) {
        await safeDeleteR2Object(env, r2Key);
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: "Brief CV is too large. Maximum size is 10 MB (PDF or Word).",
        }),
        { status: 400, headers: jsonHeaders },
      );
    }
    const speakerBucketCv = getSpeakerPhotosBucketForWrite(env);
    if (!speakerBucketCv) {
      if (r2Key) {
        await safeDeleteR2Object(env, r2Key);
      }
      return jsonResponse(
        {
          success: false,
          error:
            "Speaker file storage is misconfigured. Bind SPEAKER_PHOTOS_BUCKET as an R2 bucket.",
        },
        500,
        corsHeaders,
      );
    }
    const cvTimestamp = Date.now();
    const cvRandomId = Math.random().toString(36).slice(2, 11).toUpperCase();
    cvR2Key = `speaker-photos/cv-nsp-${id.slice(0, 8)}_${cvTimestamp}_${cvRandomId}.${cvResolved.ext}`;
    const cvBuffer = await cvFile.arrayBuffer();
    await speakerBucketCv.put(cvR2Key, cvBuffer, {
      httpMetadata: { contentType: cvResolved.contentType },
      customMetadata: {
        email,
        submissionId: id,
        kind: "brief-cv",
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  try {
    await env.ISIR_DB.prepare(
      `INSERT INTO speaker_profile_submissions
      (id, speaker_key, email, first_name, middle_name, last_name, display_name, affiliation, r2_key, presentation_title, cv_r2_key, image_position, tier, static_image, sort_order, status, created_at, updated_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'pending', ?, ?)`,
    )
      .bind(
        id,
        email,
        dbFirstName,
        dbMiddleName,
        dbLastName,
        name,
        affiliation,
        r2Key,
        presentationTitle,
        cvR2Key,
        now,
        now,
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Profile submitted. It will appear on the site after the organizers approve it.",
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (e) {
    console.error("handleSubmitSpeakerProfile:", e);
    if (r2Key) {
      await safeDeleteR2Object(env, r2Key);
    }
    if (cvR2Key) {
      await safeDeleteR2Object(env, cvR2Key);
    }
    return new Response(
      JSON.stringify({ success: false, error: "Failed to save submission" }),
      { status: 500, headers: jsonHeaders },
    );
  }
}

async function handleAdminListSpeakerProfiles(request, env, corsHeaders) {
  const auth = ensureAdmin(request, env, corsHeaders);
  if (auth) return auth;
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  try {
    const { results } = await env.ISIR_DB.prepare(
      `SELECT id, speaker_key, email, first_name, middle_name, last_name, display_name, affiliation, r2_key, presentation_title, cv_r2_key, image_position, tier, static_image, sort_order, status, created_at, updated_at
       FROM speaker_profile_submissions ORDER BY updated_at DESC`,
    ).all();
    return jsonResponse(
      { success: true, submissions: results || [] },
      200,
      corsHeaders,
    );
  } catch (e) {
    console.error("handleAdminListSpeakerProfiles:", e);
    return jsonResponse(
      { success: false, error: "Failed to list speaker profiles" },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminSpeakerProfileApprove(request, env, corsHeaders, id) {
  const auth = ensureAdmin(request, env, corsHeaders);
  if (auth) return auth;
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  const now = Date.now();
  try {
    const r = await env.ISIR_DB.prepare(
      `UPDATE speaker_profile_submissions SET status = 'approved', updated_at = ? WHERE id = ? AND status = 'pending'`,
    )
      .bind(now, id)
      .run();
    if (!r.success || (r.meta?.changes || 0) < 1) {
      return jsonResponse(
        {
          success: false,
          error: "No pending submission with that id, or already processed",
        },
        400,
        corsHeaders,
      );
    }
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error("handleAdminSpeakerProfileApprove:", e);
    return jsonResponse(
      { success: false, error: "Approve failed" },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminSpeakerProfileReject(request, env, corsHeaders, id) {
  const auth = ensureAdmin(request, env, corsHeaders);
  if (auth) return auth;
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  const now = Date.now();
  try {
    const row = await env.ISIR_DB.prepare(
      `SELECT id, r2_key, cv_r2_key, status FROM speaker_profile_submissions WHERE id = ?`,
    )
      .bind(id)
      .first();
    if (!row || row.status !== "pending") {
      return jsonResponse(
        { success: false, error: "No pending submission with that id" },
        400,
        corsHeaders,
      );
    }
    if (row.r2_key) {
      await safeDeleteR2Object(env, row.r2_key);
    }
    if (row.cv_r2_key) {
      await safeDeleteR2Object(env, row.cv_r2_key);
    }
    await env.ISIR_DB.prepare(
      `UPDATE speaker_profile_submissions SET
        status = 'rejected', r2_key = NULL, cv_r2_key = NULL, updated_at = ? WHERE id = ?`,
    )
      .bind(now, id)
      .run();
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error("handleAdminSpeakerProfileReject:", e);
    return jsonResponse(
      { success: false, error: "Reject failed" },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminSpeakerProfileDelete(request, env, corsHeaders, id) {
  const auth = ensureAdmin(request, env, corsHeaders);
  if (auth) return auth;
  if (!env.ISIR_DB) {
    return jsonResponse(
      { success: false, error: "Database not configured" },
      500,
      corsHeaders,
    );
  }
  try {
    const row = await env.ISIR_DB.prepare(
      `SELECT id, r2_key, cv_r2_key FROM speaker_profile_submissions WHERE id = ?`,
    )
      .bind(id)
      .first();
    if (!row?.id) {
      return jsonResponse(
        { success: false, error: "No submission with that id" },
        404,
        corsHeaders,
      );
    }
    if (row.r2_key) {
      await safeDeleteR2Object(env, row.r2_key);
    }
    if (row.cv_r2_key) {
      await safeDeleteR2Object(env, row.cv_r2_key);
    }
    const del = await env.ISIR_DB.prepare(
      `DELETE FROM speaker_profile_submissions WHERE id = ?`,
    )
      .bind(id)
      .run();
    if (!del.success || (del.meta?.changes || 0) < 1) {
      return jsonResponse(
        { success: false, error: "Delete failed" },
        500,
        corsHeaders,
      );
    }
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error("handleAdminSpeakerProfileDelete:", e);
    return jsonResponse(
      { success: false, error: "Delete failed" },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminTestPaymentIntent(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!env.STRIPE_SECRET_KEY) {
      return jsonResponse(
        { success: false, error: "Stripe secret key not configured" },
        500,
        corsHeaders,
      );
    }
    const publishableKey =
      String(env.STRIPE_PUBLISHABLE_KEY || "").trim() ||
      String(env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
    if (!publishableKey) {
      return jsonResponse(
        {
          success: false,
          error:
            "Stripe publishable key not configured in worker env (STRIPE_PUBLISHABLE_KEY or VITE_STRIPE_PUBLISHABLE_KEY).",
        },
        500,
        corsHeaders,
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 USD
      currency: "usd",
      metadata: {
        type: "admin_test_payment",
        createdAt: String(Date.now()),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return jsonResponse(
      {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey,
        secretKeyMode: String(env.STRIPE_SECRET_KEY).startsWith("sk_live_")
          ? "live"
          : "test",
        publishableKeyMode: publishableKey.startsWith("pk_live_")
          ? "live"
          : "test",
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin test payment intent error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to create admin test payment intent",
      },
      500,
      corsHeaders,
    );
  }
}

async function handleAdminEnvVars(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    const bindingNames = Object.keys(env || {})
      .filter((name) => typeof name === "string")
      .sort((a, b) => a.localeCompare(b));

    const getString = (name) => String(env?.[name] || "").trim();
    const maskValue = (value) => {
      if (!value) return "";
      if (value.length <= 8) return `${value.slice(0, 2)}***`;
      return `${value.slice(0, 4)}...${value.slice(-4)}`;
    };

    const sensitiveVars = [
      "VITE_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_PUBLISHABLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "ADMIN_ACCESS_TOKEN",
      "ISIR_API_KEY",
      "CONFIRMATION_FROM_EMAIL",
    ];

    const configured = sensitiveVars.map((name) => {
      const value = getString(name);
      return {
        name,
        configured: Boolean(value),
        preview: value ? maskValue(value) : "",
      };
    });

    return jsonResponse(
      {
        success: true,
        availableBindings: bindingNames,
        configured,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Admin env vars error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Failed to read env vars" },
      500,
      corsHeaders,
    );
  }
}

// Handle Stripe payment intent creation
async function handleCreatePaymentIntent(request, env, corsHeaders) {
  try {
    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const data = await request.json();
    const { registrationId, metadata } = data;

    if (!registrationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required field: registrationId",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!env.ISIR_DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    const registration = await env.ISIR_DB.prepare(
      `SELECT id, total_price, country, currency, payment_status, payment_intent_id
       FROM registrations
       WHERE id = ?
       LIMIT 1`,
    )
      .bind(registrationId)
      .first();

    if (!registration?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Registration not found",
        }),
        { status: 404, headers: corsHeaders },
      );
    }

    const baseAmountUsd = Number(registration.total_price || 0);
    if (!Number.isFinite(baseAmountUsd) || baseAmountUsd < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid registration amount",
        }),
        { status: 400, headers: corsHeaders },
      );
    }
    if (baseAmountUsd === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No payment amount for this registration",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const currency = "usd";
    const amount = Math.round(baseAmountUsd * 100); // USD cents

    // Import Stripe (using dynamic import for Cloudflare Workers)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    // Reuse existing intent when clients retry setup.
    if (registration.payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          registration.payment_intent_id,
        );
        if (existingIntent?.client_secret) {
          return new Response(
            JSON.stringify({
              success: true,
              clientSecret: existingIntent.client_secret,
              paymentIntentId: existingIntent.id,
            }),
            { status: 200, headers: corsHeaders },
          );
        }
      } catch (retrieveError) {
        console.error(
          "Failed to retrieve existing payment intent:",
          retrieveError,
        );
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        metadata: {
          registrationId: registrationId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      },
      {
        idempotencyKey: `registration-${registrationId}`,
      },
    );

    await env.ISIR_DB.prepare(
      `UPDATE registrations
       SET payment_intent_id = ?, currency = ?
       WHERE id = ?`,
    )
      .bind(paymentIntent.id, currency.toUpperCase(), registrationId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create payment intent",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// Helper functions for Stripe webhook
function escapeHtml(s) {
  if (s == null) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTicketLabel(slug) {
  if (!slug) return "Conference";
  const labels = {
    "isir-member": "ISIR Member",
    "non-member": "Non-Member",
    "trainee-member": "Trainee (ISIR Member)",
    "trainee-non-member": "Trainee (Non-Member)",
    "korea-day-pass": "Daypass (Korean locals only)",
  };
  return (
    labels[slug] ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const CONGRESS_MEAL_DAY_EMAIL_LABELS = {
  Friday: "Friday (Nov 6, 2026)",
  Saturday: "Saturday (Nov 7, 2026)",
  Sunday: "Sunday (Nov 8, 2026)",
  "Nov 6": "Friday (Nov 6, 2026)",
  "Nov 7": "Saturday (Nov 7, 2026)",
  "Nov 8": "Sunday (Nov 8, 2026)",
};

function formatCongressMealDayListForEmail(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr
    .map((d) => CONGRESS_MEAL_DAY_EMAIL_LABELS[d] || String(d))
    .join(", ");
}

async function sendRegistrationConfirmationEmail(env, registrationId) {
  if (
    !env?.ISIR_DB ||
    !env?.RESEND_API_KEY ||
    !env?.CONFIRMATION_FROM_EMAIL ||
    !registrationId
  ) {
    return {
      success: false,
      error:
        "Email service not configured (missing DB, RESEND_API_KEY, CONFIRMATION_FROM_EMAIL, or registration ID).",
    };
  }

  try {
    const row = await env.ISIR_DB.prepare(
      `SELECT email, first_name, middle_name, last_name, ticket_type, ticket_price, total_price, currency,
       accompanying_count, gala_dinner, gala_dinner_attending, lunch_days, breakfast_days, dinner_days,
       day_pass_days, opening_reception_attending, institution, badge_name, is_invited_speaker
       FROM registrations WHERE id = ?`,
    )
      .bind(registrationId)
      .first();

    if (!row?.email) {
      return { success: false, error: "Registration not found" };
    }

    const name =
      [row.first_name, row.middle_name, row.last_name]
        .filter(Boolean)
        .join(" ") || "Attendee";
    const ticketLabel = formatTicketLabel(row.ticket_type);
    const amount =
      row.total_price != null
        ? `${row.currency || "USD"} ${Number(row.total_price).toFixed(2)}`
        : "";
    const acc = Number(row.accompanying_count) || 0;
    const gala = Number(row.gala_dinner) || 0;
    const galaAttending = Number(row.gala_dinner_attending) === 1;
    const openingReception = Number(row.opening_reception_attending) === 1;
    const lunchDays = (() => {
      try {
        const parsed = JSON.parse(row.lunch_days || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const breakfastDays = (() => {
      try {
        const fromBreakfast = JSON.parse(row.breakfast_days || "[]");
        if (Array.isArray(fromBreakfast) && fromBreakfast.length > 0) {
          return fromBreakfast;
        }
        const legacy = JSON.parse(row.dinner_days || "[]");
        return Array.isArray(legacy) ? legacy : [];
      } catch {
        return [];
      }
    })();
    const invitedSpeaker = Number(row.is_invited_speaker || 0) === 1;
    const dayPassDays = (() => {
      try {
        const parsed = JSON.parse(row.day_pass_days || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const dayPassDisplay =
      dayPassDays.length > 0
        ? formatCongressMealDayListForEmail(dayPassDays)
        : "";
    const lunchDisplay =
      lunchDays.length > 0
        ? formatCongressMealDayListForEmail(lunchDays)
        : "Not selected";
    const breakfastDisplay =
      breakfastDays.length > 0
        ? formatCongressMealDayListForEmail(breakfastDays)
        : "Not selected";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(String(registrationId))}`;
    const paymentLine =
      Number(row.total_price) > 0
        ? "Your payment has been received and your place at the ISIR 2026 World Congress is confirmed."
        : "Your registration is complete and your place at the ISIR 2026 World Congress is confirmed.";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Registration Confirmed – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Registration confirmed</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>${paymentLine}</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Registration summary</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Registration ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(registrationId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Ticket type</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(ticketLabel)}</td></tr>
      ${dayPassDisplay ? `<tr><td style="padding: 4px 0;">Daypass (congress days)</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(dayPassDisplay)}</td></tr>` : ""}
      ${acc > 0 ? `<tr><td style="padding: 4px 0;">Accompanying persons</td><td style="padding: 4px 0; text-align: right;">${acc}</td></tr>` : ""}
      ${gala > 0 ? `<tr><td style="padding: 4px 0;">Award Gala tickets</td><td style="padding: 4px 0; text-align: right;">${gala}</td></tr>` : ""}
      <tr><td colspan="2" style="padding: 10px 0 6px 0; border-top: 1px solid #ddd; font-weight: 600; color: #1a3a6c;">Meal Attendance</td></tr>
      <tr><td style="padding: 4px 0;">Opening reception</td><td style="padding: 4px 0; text-align: right;">${openingReception ? "Attending" : "Not attending"}</td></tr>
      <tr><td style="padding: 4px 0;">Award Gala</td><td style="padding: 4px 0; text-align: right;">${galaAttending ? "Attending" : "Not attending"}</td></tr>
      <tr><td style="padding: 4px 0;">Lunch (Fri-Sun, Nov 6-8)</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(lunchDisplay)}</td></tr>
      <tr><td style="padding: 4px 0;">Breakfast (Fri-Sun, Nov 6-8)</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(breakfastDisplay)}</td></tr>
      <tr><td style="padding: 4px 0;">Invited speaker</td><td style="padding: 4px 0; text-align: right;">${invitedSpeaker ? "Yes" : "No"}</td></tr>
      ${row.badge_name ? `<tr><td style="padding: 4px 0;">Badge name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(row.badge_name)}</td></tr>` : ""}
      ${amount ? `<tr><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd;">Amount paid</td><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd; text-align: right;"><strong>${escapeHtml(amount)}</strong></td></tr>` : ""}
    </table>
  </div>
  <div style="text-align: center; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Badge Check-In QR Code</p>
    <img src="${qrCodeUrl}" alt="Registration check-in QR code" width="220" height="220" style="display: block; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 6px; background: #fff;" />
  </div>
  <p><strong>What happens next</strong></p>
  <ul style="margin: 0 0 20px 0; padding-left: 1.2rem;">
    <li>Keep this email as your confirmation. You may be asked for your registration ID.</li>
    <li>We will send further details (programme, venue, travel) closer to the event.</li>
  </ul>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@isir2026.org" style="color: #1a3a6c;">support@isir2026.org</a>.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.CONFIRMATION_FROM_EMAIL,
        to: [row.email],
        subject: "ISIR 2026 – Registration confirmed",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend email failed:", res.status, err);
      return {
        success: false,
        error: `Resend ${res.status}: ${err || "email send failed"}`,
      };
    } else {
      console.log(`Confirmation email sent to ${row.email}`);
      return { success: true, toEmail: row.email, sentAt: Date.now() };
    }
  } catch (emailError) {
    console.error("Registration confirmation email error:", emailError);
    return {
      success: false,
      error: emailError?.message || "Failed to send registration email",
    };
  }
}

async function handleSendRegistrationConfirmation(
  request,
  env,
  corsHeaders,
  registrationId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!registrationId) {
      return jsonResponse(
        { success: false, error: "Missing registration id" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT id FROM registrations WHERE id = ? LIMIT 1`,
    )
      .bind(registrationId)
      .first();

    if (!row?.id) {
      return jsonResponse(
        { success: false, error: "Registration not found" },
        404,
        corsHeaders,
      );
    }

    const result = await sendRegistrationConfirmationEmail(env, registrationId);
    if (!result?.success) {
      return jsonResponse(
        {
          success: false,
          error: result?.error || "Failed to send registration confirmation",
        },
        500,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        success: true,
        id: registrationId,
        sentTo: result.toEmail,
        sentAt: result.sentAt,
        message: `Registration confirmation sent to ${result.toEmail}`,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Send registration confirmation error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Internal error" },
      500,
      corsHeaders,
    );
  }
}

// Handle Stripe webhook
async function handleStripeWebhook(request, env) {
  try {
    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe not configured");
      return new Response("Stripe not configured", { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    // Import Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const registrationId = paymentIntent.metadata?.registrationId;

        if (registrationId && env.ISIR_DB) {
          try {
            // Update registration payment status
            await env.ISIR_DB.prepare(
              `UPDATE registrations 
               SET payment_status = 'completed',
                   payment_intent_id = ?,
                   payment_date = ?
               WHERE id = ?`,
            )
              .bind(paymentIntent.id, Date.now(), registrationId)
              .run();

            console.log(
              `Payment confirmed for registration: ${registrationId}`,
            );

            // If this was an invited speaker registration, mark invite token as used
            try {
              const inv = await env.ISIR_DB.prepare(
                `SELECT is_invited_speaker, invited_speaker_token FROM registrations WHERE id = ?`,
              )
                .bind(registrationId)
                .first();
              if (
                Number(inv?.is_invited_speaker || 0) === 1 &&
                inv?.invited_speaker_token
              ) {
                await env.ISIR_DB.prepare(
                  `UPDATE speaker_invites
                   SET used_at = ?, used_registration_id = ?
                   WHERE token = ? AND (used_at IS NULL OR used_at = 0)`,
                )
                  .bind(Date.now(), registrationId, inv.invited_speaker_token)
                  .run();
              }
            } catch (e) {
              console.error("Failed to mark speaker invite used:", e);
            }

            await sendRegistrationConfirmationEmail(env, registrationId);
          } catch (dbError) {
            console.error("Database update error:", dbError);
            // Don't fail the webhook - payment succeeded
          }
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        const failedRegistrationId = failedPayment.metadata?.registrationId;

        if (failedRegistrationId && env.ISIR_DB) {
          try {
            await env.ISIR_DB.prepare(
              `UPDATE registrations 
               SET payment_status = 'failed'
               WHERE id = ?`,
            )
              .bind(failedRegistrationId)
              .run();

            console.log(
              `Payment failed for registration: ${failedRegistrationId}`,
            );
          } catch (dbError) {
            console.error("Database update error:", dbError);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}

// Admin endpoint: Get all abstracts
async function handleGetAbstracts(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    // Get all abstracts
    const abstractsResult = await env.ISIR_DB.prepare(
      `SELECT * FROM abstractions ORDER BY submission_date DESC LIMIT 500`,
    ).all();

    const abstracts = abstractsResult.results || [];

    // Get all authors and affiliations for these abstracts
    // (chunked IN queries — D1 allows at most 100 bound params per statement)
    if (abstracts.length > 0) {
      const abstractIds = abstracts.map((a) => a.id);

      const authorRows = await d1AllWhereIn(
        env.ISIR_DB,
        (ph) => `SELECT * FROM authors WHERE abstract_id IN (${ph})`,
        abstractIds,
      );
      const affiliationRows = await d1AllWhereIn(
        env.ISIR_DB,
        (ph) => `SELECT * FROM affiliations WHERE abstract_id IN (${ph})`,
        abstractIds,
      );

      // Group authors and affiliations by abstract_id
      const authorsByAbstract = {};
      const affiliationsByAbstract = {};

      authorRows.forEach((author) => {
        if (!authorsByAbstract[author.abstract_id]) {
          authorsByAbstract[author.abstract_id] = [];
        }
        authorsByAbstract[author.abstract_id].push(author);
      });

      affiliationRows.forEach((aff) => {
        if (!affiliationsByAbstract[aff.abstract_id]) {
          affiliationsByAbstract[aff.abstract_id] = [];
        }
        affiliationsByAbstract[aff.abstract_id].push(aff);
      });

      // Attach authors and affiliations to each abstract
      abstracts.forEach((abstract) => {
        abstract.authors = authorsByAbstract[abstract.id] || [];
        abstract.affiliations = affiliationsByAbstract[abstract.id] || [];
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: abstracts,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Get abstracts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

const TRAINEE_LETTER_STATUSES = ["pending", "approved", "rejected"];

// Admin endpoint: Update trainee verification letter status
async function handleUpdateTraineeLetterStatus(
  request,
  env,
  corsHeaders,
  registrationId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    if (!registrationId) {
      return jsonResponse(
        { success: false, error: "Missing registration id" },
        400,
        corsHeaders,
      );
    }

    const data = await request.json();
    const status = String(data?.status || "")
      .trim()
      .toLowerCase();

    if (!TRAINEE_LETTER_STATUSES.includes(status)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid status. Must be: ${TRAINEE_LETTER_STATUSES.join(", ")}`,
        },
        400,
        corsHeaders,
      );
    }

    const existing = await env.ISIR_DB.prepare(
      `SELECT id, trainee_letter_url, trainee_letter_status
       FROM registrations WHERE id = ? LIMIT 1`,
    )
      .bind(registrationId)
      .first();

    if (!existing?.id) {
      return jsonResponse(
        { success: false, error: "Registration not found" },
        404,
        corsHeaders,
      );
    }

    if (!existing.trainee_letter_url) {
      return jsonResponse(
        {
          success: false,
          error: "No trainee letter uploaded for this registration",
        },
        400,
        corsHeaders,
      );
    }

    await env.ISIR_DB.prepare(
      `UPDATE registrations SET trainee_letter_status = ? WHERE id = ?`,
    )
      .bind(status, registrationId)
      .run();

    return jsonResponse(
      {
        success: true,
        message: `Trainee letter status updated to ${status}`,
        data: {
          id: registrationId,
          trainee_letter_status: status,
        },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Update trainee letter status error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to update trainee letter status",
      },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Update abstract status
async function handleUpdateAbstractStatus(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    const data = await request.json();
    const { status, rejection_reason } = data;

    if (
      !status ||
      !["submitted", "accepted", "rejected", "revision"].includes(status)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Invalid status. Must be: submitted, accepted, rejected, or revision",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Update the abstract status
    await env.ISIR_DB.prepare(
      `UPDATE abstractions SET status = ?, rejection_reason = ?, reviewed_at = ? WHERE id = ?`,
    )
      .bind(status, rejection_reason || null, Date.now(), abstractId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Abstract ${abstractId} status updated to ${status}`,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Update abstract status error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// Admin endpoint: Set whether an abstract is an invited speaker submission
async function handleUpdateAbstractInvitedSpeaker(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!abstractId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing abstract id" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const data = await request.json();
    const raw = data?.isInvitedSpeaker ?? data?.is_invited_speaker;
    if (raw === undefined || raw === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "isInvitedSpeaker is required (true/false or 1/0)",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const isInvitedSpeaker =
      raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0;

    const existing = await env.ISIR_DB.prepare(
      `SELECT id FROM abstractions WHERE id = ?`,
    )
      .bind(abstractId)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: "Abstract not found" }),
        { status: 404, headers: corsHeaders },
      );
    }

    await env.ISIR_DB.prepare(
      `UPDATE abstractions SET is_invited_speaker = ? WHERE id = ?`,
    )
      .bind(isInvitedSpeaker, abstractId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Abstract ${abstractId} invited speaker flag set to ${isInvitedSpeaker}`,
        isInvitedSpeaker,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Update abstract invited speaker error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

function formatAuthorFullName(author) {
  if (!author) return "";
  return `${author.first_name || ""}${
    author.middle_name ? ` ${author.middle_name}` : ""
  } ${author.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

// Admin endpoint: Update presenting and corresponding authors for an abstract
async function handleUpdateAbstractSpeakers(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!abstractId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing abstract id" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const data = await request.json();
    const presenterAuthorId =
      data?.presenterAuthorId || data?.presenter_author_id || null;
    const correspondingAuthorId =
      data?.correspondingAuthorId || data?.corresponding_author_id || null;

    if (!presenterAuthorId || !correspondingAuthorId) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "presenterAuthorId and correspondingAuthorId are required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const existing = await env.ISIR_DB.prepare(
      `SELECT id FROM abstractions WHERE id = ?`,
    )
      .bind(abstractId)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: "Abstract not found" }),
        { status: 404, headers: corsHeaders },
      );
    }

    const authorsResult = await env.ISIR_DB.prepare(
      `SELECT * FROM authors WHERE abstract_id = ? ORDER BY position ASC`,
    )
      .bind(abstractId)
      .all();
    const authors = authorsResult.results || [];

    const presenter = authors.find((a) => a.id === presenterAuthorId);
    const corresponding = authors.find((a) => a.id === correspondingAuthorId);

    if (!presenter) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Presenter author was not found on this abstract",
        }),
        { status: 400, headers: corsHeaders },
      );
    }
    if (!corresponding) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Corresponding author was not found on this abstract",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const presenterEmail = String(presenter.email || "").trim();
    const correspondingEmail = String(corresponding.email || "").trim();
    if (!presenterEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Selected presenting author must have an email address",
        }),
        { status: 400, headers: corsHeaders },
      );
    }
    if (!correspondingEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Selected corresponding author must have an email address",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const presenterName = formatAuthorFullName(presenter);
    const correspondingName = formatAuthorFullName(corresponding);

    const statements = [
      env.ISIR_DB.prepare(
        `UPDATE authors SET is_presenter = 0, is_corresponding = 0 WHERE abstract_id = ?`,
      ).bind(abstractId),
    ];

    if (presenterAuthorId === correspondingAuthorId) {
      statements.push(
        env.ISIR_DB.prepare(
          `UPDATE authors SET is_presenter = 1, is_corresponding = 1 WHERE id = ? AND abstract_id = ?`,
        ).bind(presenterAuthorId, abstractId),
      );
    } else {
      statements.push(
        env.ISIR_DB.prepare(
          `UPDATE authors SET is_presenter = 1 WHERE id = ? AND abstract_id = ?`,
        ).bind(presenterAuthorId, abstractId),
        env.ISIR_DB.prepare(
          `UPDATE authors SET is_corresponding = 1 WHERE id = ? AND abstract_id = ?`,
        ).bind(correspondingAuthorId, abstractId),
      );
    }

    statements.push(
      env.ISIR_DB.prepare(
        `UPDATE abstractions SET
          presenter_name = ?,
          presenter_email = ?,
          presenter_author_id = ?,
          corresponding_name = ?,
          corresponding_email = ?,
          corresponding_author_id = ?
        WHERE id = ?`,
      ).bind(
        presenterName,
        presenterEmail,
        presenterAuthorId,
        correspondingName,
        correspondingEmail,
        correspondingAuthorId,
        abstractId,
      ),
    );

    await env.ISIR_DB.batch(statements);

    const updatedAuthors = authors.map((author) => ({
      ...author,
      is_presenter: author.id === presenterAuthorId ? 1 : 0,
      is_corresponding: author.id === correspondingAuthorId ? 1 : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Abstract ${abstractId} speakers updated`,
        data: {
          presenter_name: presenterName,
          presenter_email: presenterEmail,
          presenter_author_id: presenterAuthorId,
          corresponding_name: correspondingName,
          corresponding_email: correspondingEmail,
          corresponding_author_id: correspondingAuthorId,
          authors: updatedAuthors,
        },
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Update abstract speakers error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// Admin endpoint: Accept all invited speaker abstracts that are not already accepted
async function handleAcceptAllInvitedSpeakerAbstracts(
  request,
  env,
  corsHeaders,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    const pending = await env.ISIR_DB.prepare(
      `SELECT id FROM abstractions
       WHERE is_invited_speaker = 1
         AND LOWER(COALESCE(status, '')) != 'accepted'`,
    ).all();

    const ids = (pending.results || []).map((row) => row.id);
    if (ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          updated: 0,
          message: "All invited speaker abstracts are already accepted",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    const reviewedAt = Date.now();
    await d1RunWhereIn(
      env.ISIR_DB,
      (ph) =>
        `UPDATE abstractions
       SET status = 'accepted', rejection_reason = NULL, reviewed_at = ?
       WHERE id IN (${ph})`,
      ids,
      [reviewedAt],
    );

    return new Response(
      JSON.stringify({
        success: true,
        updated: ids.length,
        ids,
        message: `Accepted ${ids.length} invited speaker abstract${ids.length === 1 ? "" : "s"}`,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Accept all invited speaker abstracts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// Admin endpoint: (Re)send the submission confirmation email for a single abstract.
// Used to retroactively email authors whose abstracts were submitted before
// automatic confirmation emails were enabled, or to resend on request.
async function handleSendAbstractConfirmation(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!abstractId) {
      return jsonResponse(
        { success: false, error: "Missing abstract id" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT * FROM abstractions WHERE id = ?`,
    )
      .bind(abstractId)
      .first();

    if (!row) {
      return jsonResponse(
        { success: false, error: "Abstract not found" },
        404,
        corsHeaders,
      );
    }

    const result = await sendAbstractConfirmationEmail(env, row);
    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Failed to send email" },
        500,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        success: true,
        id: abstractId,
        sentTo: result.toEmail,
        sentAt: result.sentAt,
        message: `Confirmation email sent to ${result.toEmail}`,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Send abstract confirmation error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Internal error" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Bulk (re)send submission confirmation emails for abstracts.
// Body (JSON, all optional):
//   - onlyMissing (boolean, default true): only send to abstracts with no
//     recorded confirmation_sent_at value
//   - abstractIds (string[]): restrict to the provided ids
async function handleBulkSendAbstractConfirmations(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const onlyMissing = body?.onlyMissing !== false; // default true
    const ids = Array.isArray(body?.abstractIds)
      ? body.abstractIds.filter((x) => typeof x === "string" && x.trim())
      : null;

    let rows = [];
    if (ids && ids.length > 0) {
      rows = await d1AllWhereIn(
        env.ISIR_DB,
        (ph) =>
          `SELECT * FROM abstractions WHERE id IN (${ph}) ORDER BY submission_date ASC`,
        ids,
      );
    } else {
      const res = await env.ISIR_DB.prepare(
        `SELECT * FROM abstractions ORDER BY submission_date ASC LIMIT 1000`,
      ).all();
      rows = res.results || [];
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const results = [];

    for (const row of rows) {
      if (onlyMissing && row.confirmation_sent_at) {
        skipped++;
        results.push({
          id: row.id,
          status: "skipped",
          reason: "already sent",
          sentAt: row.confirmation_sent_at,
        });
        continue;
      }

      const r = await sendAbstractConfirmationEmail(env, row);
      if (r.success) {
        sent++;
        results.push({
          id: row.id,
          status: "sent",
          to: r.toEmail,
          sentAt: r.sentAt,
        });
      } else {
        failed++;
        results.push({ id: row.id, status: "failed", error: r.error });
      }
    }

    return jsonResponse(
      {
        success: true,
        total: rows.length,
        sent,
        skipped,
        failed,
        onlyMissing,
        results,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Bulk send abstract confirmations error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Internal error" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Manually send accept/reject decision email for one abstract.
// Does not run automatically when status is updated — admin must trigger it.
async function handleSendAbstractDecision(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!abstractId) {
      return jsonResponse(
        { success: false, error: "Missing abstract id" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT * FROM abstractions WHERE id = ?`,
    )
      .bind(abstractId)
      .first();

    if (!row) {
      return jsonResponse(
        { success: false, error: "Abstract not found" },
        404,
        corsHeaders,
      );
    }

    const result = await sendAbstractDecisionEmail(env, row);
    if (!result.success) {
      return jsonResponse(
        { success: false, error: result.error || "Failed to send email" },
        400,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        success: true,
        id: abstractId,
        decision: result.status,
        sentTo: result.toEmail,
        sentAt: result.sentAt,
        message: `Decision email (${result.status}) sent to ${result.toEmail}`,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Send abstract decision error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Internal error" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Bulk send accept/reject decision emails.
// Body (JSON, all optional):
//   - onlyMissing (boolean, default true): only send when decision_email_sent_at is empty
//   - abstractIds (string[]): restrict to the provided ids
async function handleBulkSendAbstractDecisions(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const onlyMissing = body?.onlyMissing !== false;
    const ids = Array.isArray(body?.abstractIds)
      ? body.abstractIds.filter((x) => typeof x === "string" && x.trim())
      : null;

    let rows = [];
    if (ids && ids.length > 0) {
      rows = await d1AllWhereIn(
        env.ISIR_DB,
        (ph) =>
          `SELECT * FROM abstractions WHERE id IN (${ph}) ORDER BY submission_date ASC`,
        ids,
      );
    } else {
      const res = await env.ISIR_DB.prepare(
        `SELECT * FROM abstractions
         WHERE lower(status) IN ('accepted', 'rejected')
         ORDER BY submission_date ASC
         LIMIT 1000`,
      ).all();
      rows = res.results || [];
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const results = [];

    for (const row of rows) {
      const status = String(row.status || "")
        .trim()
        .toLowerCase();
      if (status !== "accepted" && status !== "rejected") {
        skipped++;
        results.push({
          id: row.id,
          status: "skipped",
          reason: "not accepted or rejected",
        });
        continue;
      }

      if (onlyMissing && row.decision_email_sent_at) {
        skipped++;
        results.push({
          id: row.id,
          status: "skipped",
          reason: "already sent",
          sentAt: row.decision_email_sent_at,
        });
        continue;
      }

      const r = await sendAbstractDecisionEmail(env, row);
      if (r.success) {
        sent++;
        results.push({
          id: row.id,
          status: "sent",
          decision: r.status,
          to: r.toEmail,
          sentAt: r.sentAt,
        });
      } else {
        failed++;
        results.push({ id: row.id, status: "failed", error: r.error });
      }
    }

    return jsonResponse(
      {
        success: true,
        total: rows.length,
        sent,
        skipped,
        failed,
        onlyMissing,
        results,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Bulk send abstract decisions error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Internal error" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Get all visa requests
async function handleGetVisaRequests(request, env, corsHeaders) {
  try {
    const result = await env.ISIR_DB.prepare(
      `SELECT * FROM visa_requests ORDER BY created_at DESC LIMIT 500`,
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        data: result.results,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Get visa requests error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

const VISA_REQUEST_STATUSES = ["pending", "approved", "rejected"];

// Admin endpoint: Update visa request status
async function handleUpdateVisaRequestStatus(
  request,
  env,
  corsHeaders,
  visaRequestId,
) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const data = await request.json();
    const status = String(data?.status || "")
      .trim()
      .toLowerCase();

    if (!VISA_REQUEST_STATUSES.includes(status)) {
      return jsonResponse(
        {
          success: false,
          error: `Invalid status. Must be: ${VISA_REQUEST_STATUSES.join(", ")}`,
        },
        400,
        corsHeaders,
      );
    }

    const existing = await env.ISIR_DB.prepare(
      `SELECT id FROM visa_requests WHERE id = ? LIMIT 1`,
    )
      .bind(visaRequestId)
      .first();

    if (!existing?.id) {
      return jsonResponse(
        { success: false, error: "Visa request not found" },
        404,
        corsHeaders,
      );
    }

    const now = Date.now();
    await env.ISIR_DB.prepare(
      `UPDATE visa_requests SET status = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(status, now, visaRequestId)
      .run();

    return jsonResponse(
      {
        success: true,
        message: `Visa request ${visaRequestId} status updated to ${status}`,
        data: { id: visaRequestId, status, updated_at: now },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Update visa request status error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to update visa request status",
      },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: Delete a visa request
async function handleDeleteVisaRequest(
  request,
  env,
  corsHeaders,
  visaRequestId,
) {
  try {
    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const existing = await env.ISIR_DB.prepare(
      `SELECT id, registration_proof_r2_key FROM visa_requests WHERE id = ? LIMIT 1`,
    )
      .bind(visaRequestId)
      .first();

    if (!existing?.id) {
      return jsonResponse(
        { success: false, error: "Visa request not found" },
        404,
        corsHeaders,
      );
    }

    const del = await env.ISIR_DB.prepare(
      `DELETE FROM visa_requests WHERE id = ?`,
    )
      .bind(visaRequestId)
      .run();

    if (!del.success || (del.meta?.changes || 0) < 1) {
      return jsonResponse(
        { success: false, error: "Delete failed" },
        500,
        corsHeaders,
      );
    }

    if (existing.registration_proof_r2_key) {
      await safeDeleteR2Object(env, existing.registration_proof_r2_key);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("Delete visa request error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to delete visa request",
      },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: invited speaker hotel registrations
async function handleGetSpeakerHotelRegistrations(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    const result = await env.ISIR_DB.prepare(
      `SELECT * FROM speaker_hotel_registrations ORDER BY updated_at DESC LIMIT 500`,
    ).all();

    return jsonResponse(
      { success: true, data: result.results || [] },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Get speaker hotel registrations error:", error);
    return jsonResponse(
      { success: false, error: error.message || "Query failed" },
      500,
      corsHeaders,
    );
  }
}

// Admin endpoint: resend visa reviewer notification emails for existing requests
async function handleResendVisaReviewerEmails(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

    if (!env.ISIR_DB) {
      return jsonResponse(
        { success: false, error: "Database not configured" },
        500,
        corsHeaders,
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // allow empty body
    }

    const visaRequestId = String(body?.visaRequestId || "").trim();
    const limitRaw = Number(body?.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(200, Math.max(1, Math.trunc(limitRaw)))
      : 50;

    const query = visaRequestId
      ? env.ISIR_DB.prepare(
          `SELECT id, email, name, affiliation, country, notes, registration_proof_r2_key, created_at FROM visa_requests WHERE id = ? LIMIT 1`,
        ).bind(visaRequestId)
      : env.ISIR_DB.prepare(
          `SELECT id, email, name, affiliation, country, notes, registration_proof_r2_key, created_at FROM visa_requests ORDER BY created_at DESC LIMIT ?`,
        ).bind(limit);

    const rowsResult = visaRequestId ? await query.first() : await query.all();
    const rows = visaRequestId
      ? rowsResult
        ? [rowsResult]
        : []
      : rowsResult.results || [];

    if (rows.length === 0) {
      return jsonResponse(
        {
          success: false,
          error: visaRequestId
            ? `Visa request not found: ${visaRequestId}`
            : "No visa requests found",
        },
        404,
        corsHeaders,
      );
    }

    let sent = 0;
    let failed = 0;
    const results = [];
    const requestOrigin = new URL(request.url).origin;

    for (const row of rows) {
      const registrationProofUrl = row.registration_proof_r2_key
        ? `${requestOrigin}/${row.registration_proof_r2_key}`
        : null;
      const isInvited = /invited speaker\/chair/i.test(
        String(row.notes || ""),
      );
      const emailResult = await sendVisaReviewerNotificationEmail(env, {
        visaRequestId: row.id,
        name: row.name,
        email: row.email,
        affiliation: row.affiliation || "",
        nationality: row.country || "",
        timestamp: Number(row.created_at) || Date.now(),
        registrationProofUrl,
        isInvited,
      });
      if (emailResult.success) sent += 1;
      else failed += 1;
      results.push({
        visaRequestId: row.id,
        success: Boolean(emailResult.success),
        error: emailResult.success
          ? null
          : emailResult.error || "Failed to send",
      });
    }

    return jsonResponse(
      {
        success: true,
        total: rows.length,
        sent,
        failed,
        reviewerEmails: VISA_NOTIFY_EMAILS,
        results,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Resend visa reviewer emails error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to resend visa emails",
      },
      500,
      corsHeaders,
    );
  }
}
