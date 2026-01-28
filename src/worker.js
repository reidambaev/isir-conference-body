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

    // For SPA routing, try to fetch the asset first
    let response = await env.ASSETS.fetch(request);
    
    // If the asset doesn't exist (404) and it's not a file extension, serve index.html
    if (response.status === 404) {
      const pathname = url.pathname;
      // Check if it's a route (no file extension) - serve index.html for SPA routing
      const hasFileExtension = /\.\w+$/.test(pathname);
      if (!hasFileExtension) {
        // Create a new request for index.html
        const indexRequest = new Request(new URL("/index.html", url.origin).toString(), request);
        response = await env.ASSETS.fetch(indexRequest);
      }
    }

    return response;
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

  // POST /api/create-payment-intent
  if (
    url.pathname === "/api/create-payment-intent" &&
    request.method === "POST"
  ) {
    return handleCreatePaymentIntent(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: corsHeaders,
  });
}

async function handleRegistration(request, env, corsHeaders) {
  const CODE_VERSION = "2.1.0-worker-fixed";
  
  try {
    console.error("=== REGISTRATION API CALLED (worker.js) ===");
    console.error("Version:", CODE_VERSION);
    
    const rawData = await request.json();
    console.error("Raw data received:", JSON.stringify(rawData, null, 2));
    
    // Sanitize all data to ensure no objects are passed to D1
    const extractString = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (typeof value === 'object' && value !== null) {
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
    const stateName = extractString(rawData.state) || extractString(rawData.stateSelect) || extractString(rawData.stateText);
    const countryName = extractString(rawData.country) || '';
    
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
      'id', 'registration_date', 'email', 'first_name', 'middle_name', 'last_name',
      'salutation', 'suffix', 'institution', 'credentials', 'badge_name', 'pronouns',
      'department', 'address1', 'address2', 'city', 'state', 'zip', 'country', 'phone', 'cell_phone',
      'is_physician', 'ticket_type', 'accompanying_count', 'gala_dinner', 'ticket_price', 'total_price',
      'is_early_bird', 'dietary_vegan', 'dietary_vegetarian', 'dietary_gluten_free',
      'dietary_kosher', 'dietary_other', 'special_assistance', 'policy_agreed',
      'privacy_marketing', 'privacy_app', 'opt_out_mailing', 'payment_status',
      'membership_level', 'membership_status'
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
      membershipStatus // SANITIZED
    ];
    
    // Final safety check - ensure NO objects remain
    const finalParams = paramValues.map((param, index) => {
      const paramType = typeof param;
      if (paramType === 'object' && param !== null) {
        console.error(`🚨 CRITICAL: ${paramNames[index]} is still an object!`, param);
        try {
          return JSON.stringify(param);
        } catch {
          return String(param);
        }
      }
      return param;
    });
    
    // Log all parameters before binding
    console.error("Final parameters to bind:", JSON.stringify(
      paramNames.map((name, i) => ({
        name,
        value: finalParams[i],
        type: typeof finalParams[i],
        isObject: typeof finalParams[i] === 'object' && finalParams[i] !== null
      })),
      null,
      2
    ));
    
    // Check for any remaining objects
    const hasObjects = finalParams.some(p => typeof p === 'object' && p !== null);
    if (hasObjects) {
      const error = new Error("D1_TYPE_ERROR: Objects detected in parameters. Check logs.");
      console.error("FATAL: Cannot proceed with objects:", paramNames.filter((name, i) => 
        typeof finalParams[i] === 'object' && finalParams[i] !== null
      ));
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
    `
    )
      .bind(...finalParams)
      .run();

    // Update currency if column exists
    try {
      const isKorean = countryName.toLowerCase().includes("korea");
      const currency = isKorean ? "KRW" : "USD";
      await env.ISIR_DB.prepare(
        `UPDATE registrations SET currency = ? WHERE id = ?`
      )
        .bind(currency, registrationId)
        .run();
    } catch (err) {
      // Currency column might not exist yet - that's okay
      console.error("Currency column not available, skipping update");
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
      }
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
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

async function handleGetRegistrations(env, corsHeaders) {
  try {
    const result = await env.ISIR_DB.prepare(
      "SELECT * FROM registrations ORDER BY registration_date DESC LIMIT 100"
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        data: result.results,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
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
      }
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
              { status: 400, headers: corsHeaders }
            );
          }
        }
        if (!Array.isArray(fieldData) || fieldData.length === 0) {
          return new Response(
            JSON.stringify({ error: `${field} must be a non-empty array` }),
            { status: 400, headers: corsHeaders }
          );
        }
      } else if (!data[field] || data[field].trim() === "") {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: corsHeaders }
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
        }
      );
    }

    // Validate word count (max 300 words)
    const wordCount = data.abstract.split(/\s+/).filter((w) => w).length;
    if (wordCount > 300) {
      return new Response(
        JSON.stringify({
          error: `Abstract exceeds 300 word limit (current: ${wordCount} words)`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate presentation preference
    const validPreferences = ["oral", "poster", "either"];
    if (!validPreferences.includes(data.presentationPreference)) {
      return new Response(
        JSON.stringify({ error: "Invalid presentation preference" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check submission window
    const submissionDeadline = new Date("2026-04-30").getTime();
    const submissionOpens = new Date("2026-01-15").getTime();
    const now = Date.now();

    if (now > submissionDeadline) {
      return new Response(
        JSON.stringify({ error: "Submission deadline has passed" }),
        { status: 400, headers: corsHeaders }
      );
    }
    if (now < submissionOpens) {
      return new Response(
        JSON.stringify({ error: "Submission window has not opened yet" }),
        { status: 400, headers: corsHeaders }
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
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Determine corresponding author id for linkage
    const correspondingIdx = authorsData.findIndex(
      (author) => author.isCorresponding
    );
    if (correspondingIdx === -1) {
      return new Response(
        JSON.stringify({ error: "A corresponding author must be designated" }),
        { status: 400, headers: corsHeaders }
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        submissionDate
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          i
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            affId,
            submissionId,
            aff.authorName?.trim() || null,
            aff.department?.trim() || null,
            aff.institution?.trim() || null,
            aff.city?.trim() || null,
            aff.country?.trim() || null,
            i
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
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Abstract submission error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit abstract" }),
      { status: 500, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate unique ID
    const visaRequestId = crypto.randomUUID();
    const timestamp = Date.now();

    // Insert visa request
    await env.ISIR_DB.prepare(
      `INSERT INTO visa_requests (id, email, name, country, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
      .bind(
        visaRequestId,
        email,
        name,
        country,
        notes || null,
        timestamp,
        timestamp
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        visaRequestId: visaRequestId,
        message: "Visa request submitted successfully",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Visa request error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit visa request",
      }),
      { status: 500, headers: corsHeaders }
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
        }
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
      }
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
      }
    );
  }
}
