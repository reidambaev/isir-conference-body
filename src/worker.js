/**
 * ISIR Conference Worker
 * Handles static assets + API routes
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API routes first
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, url);
    }

    // Serve trainee letters from R2 storage
    if (url.pathname.startsWith("/trainee-letters/")) {
      return handleTraineeLetterGet(request, env, url);
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

// Handle GET requests for trainee letters from R2
async function handleTraineeLetterGet(request, env, url) {
  const key = url.pathname.slice(1); // Remove leading slash

  try {
    const object = await env.TRAINEE_LETTERS_BUCKET.get(key);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "application/octet-stream",
    );
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Error fetching trainee letter:", error);
    return new Response("Error fetching file", { status: 500 });
  }
}

async function handleApiRequest(request, env, url) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token",
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

  // GET /api/admin/reviewers/overview
  if (
    url.pathname === "/api/admin/reviewers/overview" &&
    request.method === "GET"
  ) {
    return handleAdminReviewerOverview(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders,
  });
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
      return jsonResponse({ success: false, error: "Database not configured" }, 500, corsHeaders);
    }

    const data = await request.json();
    const email = normalizeEmail(data?.email);
    if (!email) {
      return jsonResponse({ success: false, error: "Email is required" }, 400, corsHeaders);
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
      return jsonResponse({ success: false, error: "Database not configured" }, 500, corsHeaders);
    }
    const token = (url.searchParams.get("token") || "").trim();
    if (!token) {
      return jsonResponse({ success: false, error: "token is required" }, 400, corsHeaders);
    }

    const now = Date.now();
    const row = await env.ISIR_DB.prepare(
      `SELECT token, email, expires_at, used_at FROM speaker_invites WHERE token = ?`,
    )
      .bind(token)
      .first();

    if (!row?.email) {
      return jsonResponse({ success: false, error: "Invalid invite token" }, 404, corsHeaders);
    }
    if (Number(row.expires_at || 0) <= now) {
      return jsonResponse({ success: false, error: "Invite token expired" }, 410, corsHeaders);
    }
    if (row.used_at != null && Number(row.used_at) > 0) {
      return jsonResponse({ success: false, error: "Invite token already used" }, 409, corsHeaders);
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
      return jsonResponse({ success: false, error: "email is required" }, 400, corsHeaders);
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
    return jsonResponse({ success: false, error: "Unauthorized" }, 401, corsHeaders);
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
      return jsonResponse({ success: false, error: "Email is required" }, 400, corsHeaders);
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

    return jsonResponse({ success: true, email, password, existing: false }, 200, corsHeaders);
  } catch (error) {
    console.error("Create reviewer error:", error);
    return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
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
      return jsonResponse({ success: false, error: "Invalid credentials" }, 401, corsHeaders);
    }

    const hashed = await sha256Hex(password);
    if (hashed !== row.password_hash) {
      return jsonResponse({ success: false, error: "Invalid credentials" }, 401, corsHeaders);
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
      return jsonResponse({ success: false, error: "Unauthorized" }, 401, corsHeaders);
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
      return jsonResponse({ success: true, data: [], existingReviews: [] }, 200, corsHeaders);
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
      { success: true, data: ordered, existingReviews: existingReviews.results || [] },
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
      return jsonResponse({ success: false, error: "Unauthorized" }, 401, corsHeaders);
    }

    const data = await request.json();
    const abstractId = (data?.abstract_id || "").trim();
    if (!abstractId) {
      return jsonResponse({ success: false, error: "abstract_id is required" }, 400, corsHeaders);
    }

    // Ensure this abstract is assigned to reviewer
    const assignment = await env.ISIR_DB.prepare(
      `SELECT 1 FROM reviewer_assignments WHERE reviewer_email = ? AND abstract_id = ?`,
    )
      .bind(reviewer.email, abstractId)
      .first();
    if (!assignment) {
      return jsonResponse({ success: false, error: "Abstract not assigned to reviewer" }, 403, corsHeaders);
    }

    const originality = clampInt(data?.originality, 0, 10);
    const clarity = clampInt(data?.clarity, 0, 10);
    const powerpoint = clampInt(data?.powerpoint, 0, 10);
    const study_design = clampInt(data?.study_design, 0, 10);
    const data_analysis = clampInt(data?.data_analysis, 0, 10);
    const significance = clampInt(data?.significance, 0, 10);
    const total =
      originality + clarity + powerpoint + study_design + data_analysis + significance;

    const coi_mentor_pi = data?.coi_mentor_pi ? 1 : 0;
    const coi_same_lab = data?.coi_same_lab ? 1 : 0;
    const coi_other = data?.coi_other ? 1 : 0;
    const coi_other_details = (data?.coi_other_details || "").trim() || null;
    const previous_study_notes = (data?.previous_study_notes || "").trim() || null;
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
      `SELECT id, payment_status FROM registrations WHERE lower(trim(email)) = ? LIMIT 1`,
    )
      .bind(normalizedEmail)
      .first();
    if (existingRegistration?.id) {
      const existingPaymentStatus = String(
        existingRegistration.payment_status || "",
      ).toLowerCase();

      // Allow retries for failed payments: remove stale failed record, then create a fresh one.
      if (existingPaymentStatus === "failed") {
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
        return jsonResponse({ success: false, error: "Invalid invite token" }, 400, corsHeaders);
      }
      if (normalizeEmail(invite.email) !== email) {
        return jsonResponse({ success: false, error: "Invite token does not match email" }, 400, corsHeaders);
      }
      if (Number(invite.expires_at || 0) <= now) {
        return jsonResponse({ success: false, error: "Invite token expired" }, 410, corsHeaders);
      }
      if (invite.used_at != null && Number(invite.used_at) > 0) {
        return jsonResponse({ success: false, error: "Invite token already used" }, 409, corsHeaders);
      }

      // Enforce free ticket price; accompanying is still paid (if any)
      isInvitedSpeaker = 1;
      invitedSpeakerToken = String(invite.token);
      // Speakers register for free; accompanying persons are still paid
      totalPrice = accompanyingPrice;
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
        is_physician, ticket_type, accompanying_count, ticket_price, total_price,
        is_early_bird, dietary_vegan, dietary_vegetarian, dietary_gluten_free,
        dietary_kosher, dietary_other, special_assistance, policy_agreed,
        privacy_marketing, privacy_app, opt_out_mailing, payment_status,
        is_invited_speaker, invited_speaker_token,
        membership_level, membership_status, trainee_letter_url, trainee_letter_status, trainee_letter_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        isInvitedSpeaker && totalPrice === 0 ? "completed" : "pending",
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

    // Insert abstract
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
        console.error("Failed to retrieve existing payment intent:", retrieveError);
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      metadata: {
        registrationId: registrationId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      idempotencyKey: `registration-${registrationId}`,
    });

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

            // Send confirmation email if Resend is configured
            if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
              const row = await env.ISIR_DB.prepare(
                `SELECT email, first_name, middle_name, last_name, ticket_type, ticket_price, total_price, currency,
                 accompanying_count, gala_dinner, institution, badge_name FROM registrations WHERE id = ?`,
              )
                .bind(registrationId)
                .first();

              if (row?.email) {
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
  <p>Thank you for registering. Your payment has been received and your place at the ISIR 2026 World Congress is confirmed.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Registration summary</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0;">Registration ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(registrationId)}</strong></td></tr>
      <tr><td style="padding: 4px 0;">Ticket type</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(ticketLabel)}</td></tr>
      ${acc > 0 ? `<tr><td style="padding: 4px 0;">Accompanying persons</td><td style="padding: 4px 0; text-align: right;">${acc}</td></tr>` : ""}
      ${gala > 0 ? `<tr><td style="padding: 4px 0;">Gala dinner tickets</td><td style="padding: 4px 0; text-align: right;">${gala}</td></tr>` : ""}
      ${row.badge_name ? `<tr><td style="padding: 4px 0;">Badge name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(row.badge_name)}</td></tr>` : ""}
      ${amount ? `<tr><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd;">Amount paid</td><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd; text-align: right;"><strong>${escapeHtml(amount)}</strong></td></tr>` : ""}
    </table>
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
                } else {
                  console.log(`Confirmation email sent to ${row.email}`);
                }
              }
            }
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
