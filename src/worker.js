/**
 * ISIR Conference Worker
 * Handles static assets + API routes
 */
import bundledSpeakerSeed from "./speakersSeed.js";

const SPEAKER_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB cap for R2 headshots (JPEG/PNG)

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

    // Public reads from R2 (trainee letters + invited speaker headshots)
    if (
      url.pathname.startsWith("/trainee-letters/") ||
      url.pathname.startsWith("/speaker-photos/")
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
function getSpeakerPhotosBucketForWrite(env) {
  return env.SPEAKER_PHOTOS_BUCKET || null;
}

function getSpeakerPhotosBucketForRead(env) {
  return env.SPEAKER_PHOTOS_BUCKET || env.TRAINEE_LETTERS_BUCKET || null;
}

function getBucketForR2Key(env, key) {
  if (String(key || "").startsWith("speaker-photos/")) {
    return getSpeakerPhotosBucketForRead(env);
  }
  return env.TRAINEE_LETTERS_BUCKET || null;
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

  // PATCH /api/admin/abstracts/:id/status - Update abstract status
  const abstractStatusMatch = url.pathname.match(
    /^\/api\/admin\/abstracts\/(\d+)\/status$/,
  );
  if (abstractStatusMatch && request.method === "PATCH") {
    return handleUpdateAbstractStatus(
      request,
      env,
      corsHeaders,
      abstractStatusMatch[1],
    );
  }

  // GET /api/admin/visa-requests
  if (url.pathname === "/api/admin/visa-requests" && request.method === "GET") {
    return handleGetVisaRequests(request, env, corsHeaders);
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

  // POST /api/admin/reviewers/create (generate password + create/update reviewer)
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

async function sha256Hex(input) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders });
}

function normalizeEmail(value) {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  const m = s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (m ? m[0] : s).trim().toLowerCase();
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
    const expiresInDaysRaw = Number(data?.expires_in_days);
    const expiresInDays =
      Number.isFinite(expiresInDaysRaw) && expiresInDaysRaw > 0
        ? Math.min(365, Math.floor(expiresInDaysRaw))
        : 120;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

    // Return existing active token if present
    const existing = await env.ISIR_DB.prepare(
      `SELECT token, expires_at, used_at FROM speaker_invites WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (
      existing?.token &&
      Number(existing.used_at || 0) === 0 &&
      Number(existing.expires_at || 0) > now
    ) {
      return jsonResponse(
        {
          success: true,
          token: existing.token,
          email,
          expires_at: Number(existing.expires_at),
          reused: true,
        },
        200,
        corsHeaders,
      );
    }

    const token = crypto.randomUUID();
    await env.ISIR_DB.prepare(
      `INSERT INTO speaker_invites (token, email, created_at, expires_at, used_at, used_registration_id)
       VALUES (?, ?, ?, ?, NULL, NULL)
       ON CONFLICT(email) DO UPDATE SET
         token = excluded.token,
         created_at = excluded.created_at,
         expires_at = excluded.expires_at,
         used_at = NULL,
         used_registration_id = NULL`,
    )
      .bind(token, email, now, expiresAt)
      .run();

    return jsonResponse(
      { success: true, token, email, expires_at: expiresAt, reused: false },
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

    const now = Date.now();
    const row = await env.ISIR_DB.prepare(
      `SELECT token, email, expires_at, used_at FROM speaker_invites WHERE token = ?`,
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
    if (Number(row.expires_at || 0) <= now) {
      return jsonResponse(
        { success: false, error: "Invite token expired" },
        410,
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
      { success: true, email: row.email, expires_at: Number(row.expires_at) },
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

    const now = Date.now();
    const row = await env.ISIR_DB.prepare(
      `SELECT token, email, expires_at, used_at FROM speaker_invites WHERE email = ?`,
    )
      .bind(email)
      .first();

    const eligible =
      Boolean(row?.token) &&
      Number(row.expires_at || 0) > now &&
      (row.used_at == null || Number(row.used_at) === 0);

    return jsonResponse(
      {
        success: true,
        eligible,
        email,
        expires_at: row?.expires_at != null ? Number(row.expires_at) : null,
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
  const now = Date.now();
  const row = await env.ISIR_DB.prepare(
    `SELECT email, expires_at FROM speaker_invites WHERE email = ?`,
  )
    .bind(email)
    .first();
  if (!row?.email) {
    return { ok: false, code: "not_in_list" };
  }
  if (Number(row.expires_at || 0) <= now) {
    return { ok: false, code: "expired" };
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
    const email = (data?.email || "").trim().toLowerCase();
    if (!email) {
      return jsonResponse(
        { success: false, error: "Email is required" },
        400,
        corsHeaders,
      );
    }
    const now = Date.now();

    // If reviewer already has a password, do NOT overwrite it.
    const existing = await env.ISIR_DB.prepare(
      `SELECT email, password_hash FROM reviewers WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (existing?.email && existing?.password_hash) {
      return jsonResponse(
        { success: true, email, existing: true },
        200,
        corsHeaders,
      );
    }

    // Create or set password (only if missing)
    const password = randomPassword(14);
    const password_hash = await sha256Hex(password);

    if (existing?.email) {
      await env.ISIR_DB.prepare(
        `UPDATE reviewers
         SET password_hash = ?, active = 1, updated_at = ?
         WHERE email = ?`,
      )
        .bind(password_hash, now, email)
        .run();
    } else {
      await env.ISIR_DB.prepare(
        `INSERT INTO reviewers (email, password_hash, active, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?)`,
      )
        .bind(email, password_hash, now, now)
        .run();
    }

    return jsonResponse(
      { success: true, email, password, existing: false },
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
    const email = (data?.email || "").trim().toLowerCase();
    const password = String(data?.password || "");
    if (!email || !password) {
      return jsonResponse(
        { success: false, error: "Email and password are required" },
        400,
        corsHeaders,
      );
    }

    const row = await env.ISIR_DB.prepare(
      `SELECT email, password_hash, active FROM reviewers WHERE email = ?`,
    )
      .bind(email)
      .first();

    if (!row || !row.password_hash || Number(row.active) !== 1) {
      return jsonResponse(
        { success: false, error: "Invalid credentials" },
        401,
        corsHeaders,
      );
    }

    const hashed = await sha256Hex(password);
    if (hashed !== row.password_hash) {
      return jsonResponse(
        { success: false, error: "Invalid credentials" },
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

    // Ensure exactly 5 assigned abstracts (persisted)
    const existing = await env.ISIR_DB.prepare(
      `SELECT abstract_id FROM reviewer_assignments WHERE reviewer_email = ?`,
    )
      .bind(reviewer.email)
      .all();

    let assignedIds = (existing.results || []).map((r) => r.abstract_id);

    if (assignedIds.length < 5) {
      const allAbstracts = await env.ISIR_DB.prepare(
        `SELECT id FROM abstractions WHERE status = 'submitted' ORDER BY submission_date DESC LIMIT 1000`,
      ).all();

      const pool = (allAbstracts.results || [])
        .map((r) => r.id)
        .filter((id) => !assignedIds.includes(id));

      shuffleInPlace(pool);
      const toAdd = pool.slice(0, 5 - assignedIds.length);

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

    // If there are more than 5 (legacy/manual), only return first 5 by assigned time
    if (assignedIds.length > 5) {
      const five = await env.ISIR_DB.prepare(
        `SELECT abstract_id FROM reviewer_assignments WHERE reviewer_email = ? ORDER BY assigned_at ASC LIMIT 5`,
      )
        .bind(reviewer.email)
        .all();
      assignedIds = (five.results || []).map((r) => r.abstract_id);
    }

    if (assignedIds.length === 0) {
      return jsonResponse(
        { success: true, data: [], existingReviews: [] },
        200,
        corsHeaders,
      );
    }

    const placeholders = assignedIds.map(() => "?").join(",");
    const abstractsResult = await env.ISIR_DB.prepare(
      `SELECT * FROM abstractions WHERE id IN (${placeholders})`,
    )
      .bind(...assignedIds)
      .all();

    const abstracts = abstractsResult.results || [];

    // Attach authors/affiliations
    const authorsResult = await env.ISIR_DB.prepare(
      `SELECT * FROM authors WHERE abstract_id IN (${placeholders})`,
    )
      .bind(...assignedIds)
      .all();
    const affiliationsResult = await env.ISIR_DB.prepare(
      `SELECT * FROM affiliations WHERE abstract_id IN (${placeholders})`,
    )
      .bind(...assignedIds)
      .all();

    const authorsBy = {};
    (authorsResult.results || []).forEach((au) => {
      if (!authorsBy[au.abstract_id]) authorsBy[au.abstract_id] = [];
      authorsBy[au.abstract_id].push(au);
    });

    const affBy = {};
    (affiliationsResult.results || []).forEach((af) => {
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

    const existingReviews = await env.ISIR_DB.prepare(
      `SELECT * FROM reviews WHERE reviewer_email = ? AND abstract_id IN (${placeholders})`,
    )
      .bind(reviewer.email, ...assignedIds)
      .all();

    return jsonResponse(
      {
        success: true,
        data: ordered,
        existingReviews: existingReviews.results || [],
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

    // Calculate total price
    const ticketPrices = {
      "isir-member": { early: 350, standard: 450 },
      "non-member": { early: 650, standard: 750 },
      "trainee-member": { early: 150, standard: 200 },
      "trainee-non-member": { early: 250, standard: 300 },
      "invited-speaker": { early: 0, standard: 0 },
    };

    const earlyBirdDeadline = new Date("2026-07-10").getTime();
    const isEarlyBird = registrationDate < earlyBirdDeadline;
    const ticketPrice =
      ticketPrices[data.ticketType]?.[isEarlyBird ? "early" : "standard"] || 0;
    const accompanyingCount = Number(data.accompanyingPersonCount || 0);
    const galaDinnerAttending = data.galaDinnerAttending ? 1 : 0;
    const openingReceptionAttending = data.openingReceptionAttending ? 1 : 0;
    const lunchDays = Object.entries(data.mealAttendance?.lunch || {})
      .filter(([, attending]) => Boolean(attending))
      .map(([day]) => day);
    const breakfastDays = Object.entries(data.mealAttendance?.breakfast || {})
      .filter(([, attending]) => Boolean(attending))
      .map(([day]) => day);
    let accompanyingPrice = (isEarlyBird ? 250 : 350) * accompanyingCount;
    let totalPrice = ticketPrice + accompanyingPrice;

    // Speaker invite override: enforce free base ticket and validate token
    let isInvitedSpeaker = 0;
    let invitedSpeakerToken = null;
    if (data.ticketType === "invited-speaker") {
      const email = normalizedEmail;
      const now = Date.now();
      const token = (data.inviteToken || data.invitedSpeakerToken || "").trim();

      let invite = null;
      if (token) {
        invite = await env.ISIR_DB.prepare(
          `SELECT token, email, expires_at, used_at FROM speaker_invites WHERE token = ?`,
        )
          .bind(token)
          .first();
      } else {
        // Email-only flow (no link): look up invite by email
        invite = await env.ISIR_DB.prepare(
          `SELECT token, email, expires_at, used_at FROM speaker_invites WHERE email = ?`,
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
      if (Number(invite.expires_at || 0) <= now) {
        return jsonResponse(
          { success: false, error: "Invite token expired" },
          410,
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
    const expectedFlatDiscountCode =
      typeof env.REGISTRATION_FLAT_DISCOUNT_CODE === "string"
        ? env.REGISTRATION_FLAT_DISCOUNT_CODE.trim()
        : "";
    const flatDiscountUsd = Number(
      env.REGISTRATION_FLAT_DISCOUNT_AMOUNT_USD || 175,
    );
    const hasFlatDiscountConfigured =
      expectedFlatDiscountCode.length > 0 &&
      Number.isFinite(flatDiscountUsd) &&
      flatDiscountUsd >= 0;
    const hasValidFlatDiscountCode =
      hasFlatDiscountConfigured &&
      discountCodeRaw.length > 0 &&
      discountCodeRaw.toLowerCase() === expectedFlatDiscountCode.toLowerCase();
    if (hasValidFlatDiscountCode) {
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
        lunch_days, breakfast_days, opening_reception_attending, ticket_price, total_price,
        is_early_bird, dietary_vegan, dietary_vegetarian, dietary_gluten_free,
        dietary_kosher, dietary_other, special_assistance, policy_agreed,
        privacy_marketing, privacy_app, opt_out_mailing, payment_status,
        is_invited_speaker, invited_speaker_token,
        membership_level, membership_status, trainee_letter_url, trainee_letter_status, trainee_letter_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.accompanyingPersonCount || 0,
        galaDinnerAttending,
        galaDinnerAttending,
        JSON.stringify(lunchDays),
        JSON.stringify(breakfastDays),
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
      "SELECT * FROM registrations ORDER BY registration_date DESC LIMIT 100",
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

    // Check submission window
    const submissionDeadline = new Date("2026-04-30").getTime();
    const submissionOpens = new Date("2026-01-15").getTime();
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

const VISA_NOTIFY_EMAIL = "sklee@kyuh.ac.kr";
const VISA_NOTIFY_NAME = "Sung Ki Lee";

function formatVisaSubmittedAt(timestamp) {
  return (
    new Date(timestamp).toISOString().replace("T", " ").slice(0, 19) + " UTC"
  );
}

function buildVisaReviewerNotificationHtml({
  visaRequestId,
  name,
  email,
  country,
  notes,
  timestamp,
}) {
  const safeNotes = notes && String(notes).trim() ? String(notes).trim() : "";
  const submittedAt = formatVisaSubmittedAt(timestamp);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Visa Request – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">New visa support request</p>
  </div>
  <p>Dear ${escapeHtml(VISA_NOTIFY_NAME)},</p>
  <p>A new visa support request has been submitted for the ISIR 2026 World Congress.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Request details</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Request ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(visaRequestId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding: 4px 0;">Country</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(country)}</td></tr>
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
    <p style="margin: 12px 0 0 0; font-size: 0.9rem; color: #555;"><strong>Additional notes:</strong><br/>${safeNotes ? escapeHtml(safeNotes) : "None provided"}</p>
  </div>
  <p>Please review and process this request at your earliest convenience.</p>
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
        to: [VISA_NOTIFY_EMAIL],
        subject: `ISIR 2026 – Visa request from ${visaRequest.name} (${visaRequest.country})`,
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

    console.log(`Visa notification email sent to ${VISA_NOTIFY_EMAIL}`);
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
  try {
    const data = await request.json();
    const { email, name, country, notes } = data;

    // Validate required fields
    if (!email || !name || !country) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, name, and country are required",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate unique ID
    const visaRequestId = crypto.randomUUID();
    const timestamp = Date.now();

    // Insert visa request
    await env.ISIR_DB.prepare(
      `INSERT INTO visa_requests (id, email, name, country, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
      .bind(
        visaRequestId,
        email,
        name,
        country,
        notes || null,
        timestamp,
        timestamp,
      )
      .run();

    // Send notification and requester confirmation emails
    // (Non-blocking: DB insert succeeds even if email fails)
    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const safeNotes =
        notes && String(notes).trim() ? String(notes).trim() : "";
      await sendVisaReviewerNotificationEmail(env, {
        visaRequestId,
        name,
        email,
        country,
        notes: safeNotes,
        timestamp,
      });

      const requesterHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Visa Request Received – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Visa support request received</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Thank you for submitting your visa support request. We have received your request and our team will follow up with you.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Your request summary</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Request ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(visaRequestId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 4px 0;">Email</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding: 4px 0;">Country</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(country)}</td></tr>
      <tr><td style="padding: 4px 0;">Submitted</td><td style="padding: 4px 0; text-align: right;">${submittedAt}</td></tr>
    </table>
    <p style="margin: 12px 0 0 0; font-size: 0.9rem; color: #555;"><strong>Additional notes:</strong><br/>${safeNotes ? escapeHtml(safeNotes) : "None provided"}</p>
  </div>
  <p>If you need to update anything, please reply to this email or contact the organizers.</p>
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
            subject: "ISIR 2026 – Visa support request received",
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
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit visa request",
      }),
      { status: 500, headers: corsHeaders },
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
      const primary = env.SPEAKER_PHOTOS_BUCKET || null;
      const fallback = env.TRAINEE_LETTERS_BUCKET || null;
      if (primary) await primary.delete(k);
      // Legacy safety: old speaker photos may exist in trainee bucket.
      if (fallback && fallback !== primary) await fallback.delete(k);
      return;
    }
    const bucket = env.TRAINEE_LETTERS_BUCKET || null;
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
  const file = formData.get("file");
  const wantsUpload = Boolean(
    file && typeof file.size === "number" && file.size > 0,
  );

  if (wantsUpload && !getSpeakerPhotosBucketForWrite(env)) {
    return jsonResponse(
      {
        success: false,
        error:
          "File storage is not configured. Photo upload requires SPEAKER_PHOTOS_BUCKET.",
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

  const inviteAccess = await getSpeakerProfileInviteAccess(env, email);
  if (!inviteAccess.ok) {
    const msg =
      inviteAccess.code === "expired"
        ? "The speaker invite for this email has expired. Contact the organizers."
        : "This email is not on the invited speaker list. Use the same address the organizers added for your speaker invite (as for conference registration).";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  let r2Key = null;

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
          error: "Speaker photo bucket is not configured.",
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

  try {
    await env.ISIR_DB.prepare(
      `INSERT INTO speaker_profile_submissions
      (id, speaker_key, email, first_name, middle_name, last_name, display_name, affiliation, r2_key, image_position, tier, static_image, sort_order, status, created_at, updated_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'pending', ?, ?)`,
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
      `SELECT id, speaker_key, email, first_name, middle_name, last_name, display_name, affiliation, r2_key, image_position, tier, static_image, sort_order, status, created_at, updated_at
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
      `SELECT id, r2_key, status FROM speaker_profile_submissions WHERE id = ?`,
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
    await env.ISIR_DB.prepare(
      `UPDATE speaker_profile_submissions SET
        status = 'rejected', r2_key = NULL, updated_at = ? WHERE id = ?`,
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
      `SELECT id, r2_key FROM speaker_profile_submissions WHERE id = ?`,
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

    const countryValue = String(registration.country || "").toLowerCase();
    const isKoreanCustomer = countryValue.includes("korea");
    const currency = isKoreanCustomer ? "krw" : "usd";
    const amount = isKoreanCustomer
      ? Math.round(baseAmountUsd * 1350 * 1.1) // KRW + 10% Korean VAT
      : Math.round(baseAmountUsd * 100); // USD cents

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
       opening_reception_attending, institution, badge_name, is_invited_speaker
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
      ${acc > 0 ? `<tr><td style="padding: 4px 0;">Accompanying persons</td><td style="padding: 4px 0; text-align: right;">${acc}</td></tr>` : ""}
      ${gala > 0 ? `<tr><td style="padding: 4px 0;">Gala dinner tickets</td><td style="padding: 4px 0; text-align: right;">${gala}</td></tr>` : ""}
      <tr><td colspan="2" style="padding: 10px 0 6px 0; border-top: 1px solid #ddd; font-weight: 600; color: #1a3a6c;">Meal Attendance</td></tr>
      <tr><td style="padding: 4px 0;">Opening reception</td><td style="padding: 4px 0; text-align: right;">${openingReception ? "Attending" : "Not attending"}</td></tr>
      <tr><td style="padding: 4px 0;">Gala dinner</td><td style="padding: 4px 0; text-align: right;">${galaAttending ? "Attending" : "Not attending"}</td></tr>
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
    if (abstracts.length > 0) {
      const abstractIds = abstracts.map((a) => a.id);
      const placeholders = abstractIds.map(() => "?").join(",");

      // Get authors
      const authorsResult = await env.ISIR_DB.prepare(
        `SELECT * FROM authors WHERE abstract_id IN (${placeholders})`,
      )
        .bind(...abstractIds)
        .all();

      // Get affiliations
      const affiliationsResult = await env.ISIR_DB.prepare(
        `SELECT * FROM affiliations WHERE abstract_id IN (${placeholders})`,
      )
        .bind(...abstractIds)
        .all();

      // Group authors and affiliations by abstract_id
      const authorsByAbstract = {};
      const affiliationsByAbstract = {};

      (authorsResult.results || []).forEach((author) => {
        if (!authorsByAbstract[author.abstract_id]) {
          authorsByAbstract[author.abstract_id] = [];
        }
        authorsByAbstract[author.abstract_id].push(author);
      });

      (affiliationsResult.results || []).forEach((aff) => {
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

// Admin endpoint: Update abstract status
async function handleUpdateAbstractStatus(
  request,
  env,
  corsHeaders,
  abstractId,
) {
  try {
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
      const placeholders = ids.map(() => "?").join(",");
      const res = await env.ISIR_DB.prepare(
        `SELECT * FROM abstractions WHERE id IN (${placeholders}) ORDER BY submission_date ASC`,
      )
        .bind(...ids)
        .all();
      rows = res.results || [];
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

// Admin endpoint: Get all visa requests
async function handleGetVisaRequests(request, env, corsHeaders) {
  try {
    const auth = ensureAdmin(request, env, corsHeaders);
    if (auth) return auth;

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
          `SELECT id, email, name, country, notes, created_at FROM visa_requests WHERE id = ? LIMIT 1`,
        ).bind(visaRequestId)
      : env.ISIR_DB.prepare(
          `SELECT id, email, name, country, notes, created_at FROM visa_requests ORDER BY created_at DESC LIMIT ?`,
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

    for (const row of rows) {
      const emailResult = await sendVisaReviewerNotificationEmail(env, {
        visaRequestId: row.id,
        name: row.name,
        email: row.email,
        country: row.country,
        notes: row.notes || "",
        timestamp: Number(row.created_at) || Date.now(),
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
        reviewerEmail: VISA_NOTIFY_EMAIL,
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
