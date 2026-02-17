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

    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  },
};

async function handleApiRequest(request, env, url) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

async function handleRegistration(request, env, corsHeaders) {
  try {
    const data = await request.json();

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
    const totalPrice = ticketPrice + accompanyingPrice;

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
        membership_level, membership_status, trainee_letter_url, trainee_letter_status, trainee_letter_uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        registrationId,
        registrationDate,
        data.email,
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
        "pending",
        data.membershipLevel || null,
        data.membershipStatus || null,
        data.traineeLetterUrl || null,
        data.traineeLetterUrl ? "pending" : "not_required",
        data.traineeLetterUrl ? Date.now() : null,
      )
      .run();

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

// Handle Stripe payment intent creation
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
        { status: 400, headers: corsHeaders },
      );
    }

    // Import Stripe (using dynamic import for Cloudflare Workers)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

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
    });

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
