/**
 * ISIR Conference Worker
 * Handles static assets + API routes
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Log for debugging
    console.log(`[Worker] Request: ${request.method} ${pathname}`);

    // Handle API routes first
    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, url);
    }

    // For SPA routing, try to fetch the asset first
    let response = await env.ASSETS.fetch(request);

    // If the asset doesn't exist (404) or is redirected (307/301/302), and it's not a file extension, serve index.html
    const hasFileExtension = /\.\w+$/.test(pathname);
    if (
      (response.status === 404 ||
        response.status === 307 ||
        response.status === 301 ||
        response.status === 302) &&
      !hasFileExtension
    ) {
      console.log(
        `[Worker] Serving index.html for SPA route: ${pathname} (original status: ${response.status})`,
      );

      // Try fetching root path first (since index.html might redirect to /)
      const rootRequest = new Request(new URL("/", url.origin).toString(), {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      let indexResponse = await env.ASSETS.fetch(rootRequest);

      // If root also redirects, try index.html
      if (
        indexResponse.status === 307 ||
        indexResponse.status === 301 ||
        indexResponse.status === 302
      ) {
        const redirectLocation = indexResponse.headers.get("Location");
        console.log(
          `[Worker] Root redirects to: ${redirectLocation}, following...`,
        );
        if (redirectLocation) {
          const redirectUrl = new URL(redirectLocation, url.origin);
          indexResponse = await env.ASSETS.fetch(
            new Request(redirectUrl.toString(), rootRequest),
          );
        }
      }

      // If still redirecting, try index.html directly
      if (
        indexResponse.status === 307 ||
        indexResponse.status === 301 ||
        indexResponse.status === 302
      ) {
        const indexRequest = new Request(
          new URL("/index.html", url.origin).toString(),
          rootRequest,
        );
        indexResponse = await env.ASSETS.fetch(indexRequest);

        // Follow redirect if needed
        if (
          indexResponse.status === 307 ||
          indexResponse.status === 301 ||
          indexResponse.status === 302
        ) {
          const redirectLocation = indexResponse.headers.get("Location");
          if (redirectLocation) {
            const redirectUrl = new URL(redirectLocation, url.origin);
            indexResponse = await env.ASSETS.fetch(
              new Request(redirectUrl.toString(), rootRequest),
            );
          }
        }
      }

      // Return the content with 200 status for SPA routes (preserve the original pathname)
      if (indexResponse.status === 200) {
        const body = await indexResponse.text();
        console.log(
          `[Worker] Successfully serving SPA content for ${pathname}`,
        );
        return new Response(body, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=0, must-revalidate",
          },
        });
      } else {
        console.log(
          `[Worker] Failed to get index.html, status: ${indexResponse.status}`,
        );
      }
    }

    console.log(`[Worker] Returning response with status: ${response.status}`);
    return response;
  },
};

async function handleApiRequest(request, env, url) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Test-Email-Secret, stripe-signature",
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

  // GET /api/registrations (admin endpoint)
  if (url.pathname === "/api/registrations" && request.method === "GET") {
    return handleGetRegistrations(env, corsHeaders);
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

  // POST /api/create-payment-intent
  if (
    url.pathname === "/api/create-payment-intent" &&
    request.method === "POST"
  ) {
    return handleCreatePaymentIntent(request, env, corsHeaders);
  }

  // POST /api/stripe-webhook (Stripe sends here; no CORS)
  if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
    return handleStripeWebhook(request, env);
  }

  // POST /api/test-email
  if (url.pathname === "/api/test-email" && request.method === "POST") {
    return handleTestEmail(request, env, corsHeaders);
  }

  // POST /api/resend-confirmation – force-send registration confirmation email (same secret as test-email)
  if (
    url.pathname === "/api/resend-confirmation" &&
    request.method === "POST"
  ) {
    return handleResendConfirmation(request, env, corsHeaders);
  }

  // GET /api/admin/abstracts (admin endpoint)
  if (url.pathname === "/api/admin/abstracts" && request.method === "GET") {
    return handleGetAbstracts(env, corsHeaders);
  }

  // GET /api/admin/visa-requests (admin endpoint)
  if (url.pathname === "/api/admin/visa-requests" && request.method === "GET") {
    return handleGetVisaRequests(env, corsHeaders);
  }

  // GET /api/debug-env – reports which env vars the worker sees (no values). Remove or restrict in production.
  if (url.pathname === "/api/debug-env" && request.method === "GET") {
    const vars = [
      "RESEND_API_KEY",
      "CONFIRMATION_FROM_EMAIL",
      "TEST_EMAIL_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ];
    const status = {};
    for (const name of vars) {
      const v = env[name];
      status[name] =
        v !== undefined && v !== null && String(v).trim() !== ""
          ? "set"
          : "missing";
    }
    return new Response(JSON.stringify(status, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Cache-Control": "no-store" },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

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

async function handleRegistration(request, env, corsHeaders) {
  const CODE_VERSION = "2.1.0-worker-fixed";

  try {
    const rawData = await request.json();

    // Sanitize all data to ensure no objects are passed to D1
    const extractString = (value) => {
      if (!value) return null;
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean")
        return String(value);
      if (typeof value === "object" && value !== null) {
        if (value.name) return String(value.name);
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    };

    const normalizeForD1 = (value) => {
      if (value === undefined || value === null) return null;
      const type = typeof value;
      if (type === "string" || type === "number" || type === "boolean") {
        return value;
      }
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    // Extract city, state, country as strings
    const cityName = extractString(rawData.city);
    const stateName =
      extractString(rawData.state) ||
      extractString(rawData.stateSelect) ||
      extractString(rawData.stateText);
    const countryName = extractString(rawData.country) || "";

    // Normalize membership fields
    const membershipLevel = normalizeForD1(rawData.membershipLevel);
    const membershipStatus = normalizeForD1(rawData.membershipStatus);

    const data = rawData; // Keep original for other fields

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
    };

    const earlyBirdDeadline = new Date("2026-07-10").getTime();
    const isEarlyBird = registrationDate < earlyBirdDeadline;
    const ticketPrice =
      ticketPrices[data.ticketType]?.[isEarlyBird ? "early" : "standard"] || 0;
    const accompanyingPrice =
      (isEarlyBird ? 250 : 350) * (data.accompanyingPersonCount || 0);
    const galaDinnerPrice = 100 * (data.galaDinnerCount || 0);
    const totalPrice = ticketPrice + accompanyingPrice + galaDinnerPrice;

    // Build all parameters with comprehensive sanitization
    const paramNames = [
      "id",
      "registration_date",
      "email",
      "first_name",
      "middle_name",
      "last_name",
      "salutation",
      "suffix",
      "institution",
      "credentials",
      "badge_name",
      "pronouns",
      "department",
      "address1",
      "address2",
      "city",
      "state",
      "zip",
      "country",
      "phone",
      "cell_phone",
      "is_physician",
      "ticket_type",
      "accompanying_count",
      "gala_dinner",
      "ticket_price",
      "total_price",
      "is_early_bird",
      "dietary_vegan",
      "dietary_vegetarian",
      "dietary_gluten_free",
      "dietary_kosher",
      "dietary_other",
      "special_assistance",
      "policy_agreed",
      "privacy_marketing",
      "privacy_app",
      "opt_out_mailing",
      "payment_status",
      "membership_level",
      "membership_status",
    ];

    const paramValues = [
      registrationId,
      registrationDate,
      normalizeForD1(data.email),
      normalizeForD1(data.firstName),
      normalizeForD1(data.middleName),
      normalizeForD1(data.lastName),
      normalizeForD1(data.salutation),
      normalizeForD1(data.suffix),
      normalizeForD1(data.institution),
      normalizeForD1(data.credentials),
      normalizeForD1(data.badgeName),
      normalizeForD1(data.pronouns),
      normalizeForD1(data.department),
      normalizeForD1(data.address1),
      normalizeForD1(data.address2),
      cityName, // SANITIZED
      stateName, // SANITIZED
      normalizeForD1(data.zip),
      countryName || null, // SANITIZED
      normalizeForD1(data.phone),
      normalizeForD1(data.cellPhone),
      normalizeForD1(data.isPhysician),
      normalizeForD1(data.ticketType),
      Number(data.accompanyingPersonCount) || 0,
      Number(data.galaDinnerCount) || 0,
      Number(ticketPrice),
      Number(totalPrice),
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
      "pending",
      membershipLevel, // SANITIZED
      membershipStatus, // SANITIZED
    ];

    // Final safety check - ensure NO objects remain
    const finalParams = paramValues.map((param, index) => {
      const paramType = typeof param;
      if (paramType === "object" && param !== null) {
        console.error(
          `🚨 CRITICAL: ${paramNames[index]} is still an object!`,
          param,
        );
        try {
          return JSON.stringify(param);
        } catch {
          return String(param);
        }
      }
      return param;
    });

    // Check for any remaining objects
    const hasObjects = finalParams.some(
      (p) => typeof p === "object" && p !== null,
    );
    if (hasObjects) {
      const error = new Error(
        "D1_TYPE_ERROR: Objects detected in parameters. Check logs.",
      );
      console.error(
        "FATAL: Cannot proceed with objects:",
        paramNames.filter(
          (name, i) =>
            typeof finalParams[i] === "object" && finalParams[i] !== null,
        ),
      );
      throw error;
    }

    // Insert into D1 database - use sanitized values
    await env.ISIR_DB.prepare(
      `
      INSERT INTO registrations (
        id, registration_date, email, first_name, middle_name, last_name,
        salutation, suffix, institution, credentials, badge_name, pronouns,
        department, address1, address2, city, state, zip, country, phone, cell_phone,
        is_physician, ticket_type, accompanying_count, gala_dinner, ticket_price, total_price,
        is_early_bird, dietary_vegan, dietary_vegetarian, dietary_gluten_free,
        dietary_kosher, dietary_other, special_assistance, policy_agreed,
        privacy_marketing, privacy_app, opt_out_mailing, payment_status,
        membership_level, membership_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(...finalParams)
      .run();

    // Update currency if column exists
    try {
      const isKorean = countryName.toLowerCase().includes("korea");
      const currency = isKorean ? "KRW" : "USD";
      await env.ISIR_DB.prepare(
        `UPDATE registrations SET currency = ? WHERE id = ?`,
      )
        .bind(currency, registrationId)
        .run();
    } catch (_) {
      // Currency column might not exist yet - skip update
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: registrationId,
        totalPrice: totalPrice,
        message: "Registration saved successfully",
        version: CODE_VERSION,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "X-API-Version": CODE_VERSION,
        },
      },
    );
  } catch (error) {
    console.error("=== REGISTRATION ERROR (worker.js) ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // ALWAYS include version - this proves which code is running
    const errorResponse = {
      success: false,
      error: error.message || "Failed to save registration",
      version: CODE_VERSION, // MUST be in response to verify deployment
      timestamp: new Date().toISOString(),
    };

    console.error("Error response being sent:", JSON.stringify(errorResponse));

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function handleGetRegistrations(env, corsHeaders) {
  try {
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
    const submissionOpens = new Date("2026-03-01").getTime();
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

    // Insert abstract
    await env.ISIR_DB.prepare(
      `INSERT INTO abstractions (
        id, submission_date, title, category, keywords, abstract,
        word_count, presentation_preference,
        presenter_name, presenter_email,
        corresponding_name, corresponding_email, corresponding_author_id,
        affiliations, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.correspondingName.trim(),
        data.correspondingEmail.trim(),
        correspondingAuthorId,
        data.affiliations || null,
        "submitted",
        submissionDate,
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

    // Send confirmation email to corresponding author if Resend is configured
    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const toEmail = data.correspondingEmail?.trim();
      if (toEmail) {
        const name = data.correspondingName?.trim() || "Author";
        const title = data.title?.trim() || "";
        const category = data.category?.trim() || "";
        const pref = (data.presentationPreference || "").toLowerCase();
        const prefLabel =
          pref === "oral"
            ? "Oral"
            : pref === "poster"
              ? "Poster"
              : pref === "either"
                ? "Oral or Poster"
                : data.presentationPreference || "";
        const abstractSnippet = (data.abstract?.trim() || "").slice(0, 280);
        const abstractDisplay =
          abstractSnippet + (abstractSnippet.length >= 280 ? "…" : "");
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
            const err = await res.text();
            console.error(
              "Resend abstract confirmation failed:",
              res.status,
              err,
            );
          } else {
            console.log(`Abstract confirmation email sent to ${toEmail}`);
          }
        } catch (emailError) {
          console.error("Abstract confirmation email error:", emailError);
        }
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

async function handleCreatePaymentIntent(request, env, corsHeaders) {
  try {
    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const data = await request.json();
    const { amount, currency, registrationId, metadata } = data;

    if (!amount || !currency || !registrationId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: amount, currency, registrationId",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Import Stripe (using dynamic import for Cloudflare Workers)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in smallest currency unit (cents for USD, won for KRW)
      currency: currency.toLowerCase(),
      metadata: {
        registrationId: registrationId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create payment intent",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

async function handleStripeWebhook(request, env) {
  const jsonHeaders = { "Content-Type": "application/json" };
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe not configured");
      return new Response("Stripe not configured", {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", {
        status: 400,
        headers: jsonHeaders,
      });
    }

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
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400,
        headers: jsonHeaders,
      });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const registrationId = paymentIntent.metadata?.registrationId;

        if (registrationId && env.ISIR_DB) {
          try {
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

            if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
              try {
                let row = null;
                try {
                  row = await env.ISIR_DB.prepare(
                    `SELECT email, first_name, middle_name, last_name, ticket_type, ticket_price, total_price, currency,
                     accompanying_count, gala_dinner, institution, badge_name FROM registrations WHERE id = ?`,
                  )
                    .bind(registrationId)
                    .first();
                } catch (selectErr) {
                  row = await env.ISIR_DB.prepare(
                    `SELECT email, first_name, middle_name, last_name, ticket_type, total_price, currency FROM registrations WHERE id = ?`,
                  )
                    .bind(registrationId)
                    .first();
                }
                if (!row) {
                  console.error(
                    `Registration confirmation: no row found for id=${registrationId}`,
                  );
                } else if (!row.email) {
                  console.error(
                    `Registration confirmation: row found but no email for id=${registrationId}`,
                  );
                } else {
                  const name =
                    [row.first_name, row.middle_name, row.last_name]
                      .filter(Boolean)
                      .join(" ") || "Attendee";
                  const ticketLabel = formatTicketLabel(row.ticket_type);
                  const amount =
                    row.total_price != null
                      ? `${row.currency || "USD"} ${Number(row.total_price).toFixed(2)}`
                      : "";
                  const acc =
                    row.accompanying_count != null
                      ? Number(row.accompanying_count)
                      : 0;
                  const gala =
                    row.gala_dinner != null ? Number(row.gala_dinner) : 0;
                  const badgeName = row.badge_name;
                  let receiptUrl = null;
                  if (paymentIntent.latest_charge) {
                    try {
                      const charge = await stripe.charges.retrieve(
                        paymentIntent.latest_charge,
                      );
                      receiptUrl = charge.receipt_url || null;
                    } catch (_) {}
                  }
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
      ${badgeName ? `<tr><td style="padding: 4px 0;">Badge name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(badgeName)}</td></tr>` : ""}
      ${amount ? `<tr><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd;">Amount paid</td><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd; text-align: right;"><strong>${escapeHtml(amount)}</strong></td></tr>` : ""}
    </table>
  </div>
  ${receiptUrl ? `<p><a href="${escapeHtml(receiptUrl)}" style="color: #1a3a6c; font-weight: 600;">View your payment receipt (Stripe)</a></p>` : ""}
  <p><strong>What happens next</strong></p>
  <ul style="margin: 0 0 20px 0; padding-left: 1.2rem;">
    <li>Keep this email as your confirmation. You may be asked for your registration ID.</li>
    <li>We will send further details (programme, venue, travel) closer to the event.</li>
  </ul>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@theisir.org" style="color: #1a3a6c;">support@theisir.org</a>.</p>
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
              } catch (emailErr) {
                console.error(
                  "Registration confirmation email error:",
                  emailErr,
                );
              }
            }
          } catch (dbError) {
            console.error("Database update error:", dbError);
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object;
        const failedRegistrationId = failedPayment.metadata?.registrationId;
        if (failedRegistrationId && env.ISIR_DB) {
          try {
            await env.ISIR_DB.prepare(
              `UPDATE registrations SET payment_status = 'failed' WHERE id = ?`,
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
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Webhook Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleTestEmail(request, env, corsHeaders) {
  if (!env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Test email is disabled. Set TEST_EMAIL_SECRET (and RESEND_API_KEY, CONFIRMATION_FROM_EMAIL) in env to enable.",
      }),
      { status: 501, headers: corsHeaders },
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const secret = request.headers.get("X-Test-Email-Secret");
  const providedSecret = secret || body.secret;
  if (providedSecret !== env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Invalid or missing secret (use header X-Test-Email-Secret or body.secret).",
      }),
      { status: 401, headers: corsHeaders },
    );
  }

  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Resend not configured. Set RESEND_API_KEY and CONFIRMATION_FROM_EMAIL.",
      }),
      { status: 503, headers: corsHeaders },
    );
  }

  const to = (body.to || "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Valid 'to' email required in request body.",
      }),
      { status: 400, headers: corsHeaders },
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Test Email – ISIR 2026</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 – Test Email</h1>
  </div>
  <p>This is a test confirmation email from the ISIR 2026 system.</p>
  <p>If you received this, Resend and your "from" address are working correctly.</p>
  <p style="color: #666; font-size: 0.9rem;">Sent at ${new Date().toISOString()}</p>
  <p>Best regards,<br/><strong>ISIR 2026 Team</strong></p>
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
        to: [to],
        subject: "ISIR 2026 – Test confirmation email",
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data?.message ||
        data?.msg ||
        (typeof data === "string" ? data : null) ||
        "Resend API error";
      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend API error: ${msg}`,
          status: res.status,
          details: data,
        }),
        { status: 502, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${to}`,
        id: data.id || null,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error("Test email error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to send",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

async function handleResendConfirmation(request, env, corsHeaders) {
  if (!env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Resend confirmation is disabled. Set TEST_EMAIL_SECRET to enable.",
      }),
      { status: 501, headers: corsHeaders },
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const secret = request.headers.get("X-Test-Email-Secret");
  const providedSecret = secret || body.secret;
  if (providedSecret !== env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Invalid or missing secret (use header X-Test-Email-Secret or body.secret).",
      }),
      { status: 401, headers: corsHeaders },
    );
  }

  const registrationId = (
    body.registrationId ||
    body.registration_id ||
    ""
  ).trim();
  if (!registrationId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing registrationId in request body.",
      }),
      { status: 400, headers: corsHeaders },
    );
  }

  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return new Response(
      JSON.stringify({ success: false, error: "Resend not configured." }),
      { status: 503, headers: corsHeaders },
    );
  }

  if (!env.ISIR_DB) {
    return new Response(
      JSON.stringify({ success: false, error: "Database not configured." }),
      { status: 503, headers: corsHeaders },
    );
  }

  try {
    let row = null;
    try {
      row = await env.ISIR_DB.prepare(
        `SELECT email, first_name, middle_name, last_name, ticket_type, ticket_price, total_price, currency,
         accompanying_count, gala_dinner, institution, badge_name, payment_intent_id FROM registrations WHERE id = ?`,
      )
        .bind(registrationId)
        .first();
    } catch (selectErr) {
      row = await env.ISIR_DB.prepare(
        `SELECT email, first_name, middle_name, last_name, ticket_type, total_price, currency FROM registrations WHERE id = ?`,
      )
        .bind(registrationId)
        .first();
    }
    if (!row) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No registration found for id: ${registrationId}`,
        }),
        { status: 404, headers: corsHeaders },
      );
    }
    if (!row.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Registration has no email." }),
        { status: 400, headers: corsHeaders },
      );
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
    const acc =
      row.accompanying_count != null ? Number(row.accompanying_count) : 0;
    const gala = row.gala_dinner != null ? Number(row.gala_dinner) : 0;
    const badgeName = row.badge_name;

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
      ${badgeName ? `<tr><td style="padding: 4px 0;">Badge name</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(badgeName)}</td></tr>` : ""}
      ${amount ? `<tr><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd;">Amount paid</td><td style="padding: 8px 0 4px 0; border-top: 1px solid #ddd; text-align: right;"><strong>${escapeHtml(amount)}</strong></td></tr>` : ""}
    </table>
  </div>
  ${receiptUrl ? `<p><a href="${escapeHtml(receiptUrl)}" style="color: #1a3a6c; font-weight: 600;">View your payment receipt (Stripe)</a></p>` : ""}
  <p><strong>What happens next</strong></p>
  <ul style="margin: 0 0 20px 0; padding-left: 1.2rem;">
    <li>Keep this email as your confirmation. You may be asked for your registration ID.</li>
    <li>We will send further details (programme, venue, travel) closer to the event.</li>
  </ul>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@theisir.org" style="color: #1a3a6c;">support@theisir.org</a>.</p>
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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data?.message ||
        data?.msg ||
        (typeof data === "string" ? data : null) ||
        "Resend API error";
      return new Response(
        JSON.stringify({
          success: false,
          error: `Resend API error: ${msg}`,
          status: res.status,
          details: data,
        }),
        { status: 502, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Confirmation email sent to ${row.email}`,
        registrationId,
        id: data.id || null,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error("Resend confirmation error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to send",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

async function handleGetAbstracts(env, corsHeaders) {
  try {
    // Get all abstracts
    const abstractsResult = await env.ISIR_DB.prepare(
      "SELECT * FROM abstractions ORDER BY submission_date DESC",
    ).all();

    const abstracts = abstractsResult.results || [];

    // For each abstract, fetch authors and affiliations
    const abstractsWithDetails = await Promise.all(
      abstracts.map(async (abstract) => {
        // Get authors for this abstract
        const authorsResult = await env.ISIR_DB.prepare(
          "SELECT * FROM authors WHERE abstract_id = ? ORDER BY position ASC",
        )
          .bind(abstract.id)
          .all();

        // Get affiliations for this abstract
        const affiliationsResult = await env.ISIR_DB.prepare(
          "SELECT * FROM affiliations WHERE abstract_id = ? ORDER BY position ASC",
        )
          .bind(abstract.id)
          .all();

        return {
          ...abstract,
          authors: authorsResult.results || [],
          affiliations: affiliationsResult.results || [],
        };
      }),
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: abstractsWithDetails,
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
        error: error.message || "Failed to fetch abstracts",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

async function handleGetVisaRequests(env, corsHeaders) {
  try {
    const result = await env.ISIR_DB.prepare(
      "SELECT * FROM visa_requests ORDER BY created_at DESC",
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        data: result.results || [],
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
        error: error.message || "Failed to fetch visa requests",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
