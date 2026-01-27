/**
 * Cloudflare Pages Function - Registration API
 * Stores registration data in D1 database
 *
 * Endpoint: /api/register
 * Method: POST
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const rawData = await request.json();
    
    // Log incoming data to identify objects
    console.log("Raw data received:", JSON.stringify(rawData, null, 2));
    
    // Deep sanitize all data to ensure no objects/arrays are passed to D1
    const sanitizeForD1 = (value) => {
      if (value === undefined || value === null) return null;
      const type = typeof value;
      if (type === "string" || type === "number" || type === "boolean") {
        return value;
      }
      if (type === "object") {
        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
        // For objects, try to extract useful string values
        if (value.name) return String(value.name);
        if (value.id) return String(value.id);
        // Otherwise stringify
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    };
    
    // Sanitize the entire data object - ensure no objects remain
    const data = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (key === 'dietary' && typeof value === 'object' && value !== null) {
        // Keep dietary as object temporarily, we'll extract individual boolean fields
        data[key] = value;
      } else {
        const sanitized = sanitizeForD1(value);
        data[key] = sanitized;
        // Log if we sanitized an object
        if (typeof value === 'object' && value !== null && typeof sanitized === 'string') {
          console.log(`Sanitized ${key}:`, JSON.stringify(value), '->', sanitized);
        }
      }
    }
    
    // Ensure dietary is an object with boolean properties, not a string
    if (data.dietary && typeof data.dietary !== 'object') {
      console.warn('dietary was sanitized to string, attempting to parse:', data.dietary);
      try {
        data.dietary = JSON.parse(data.dietary);
      } catch {
        data.dietary = { vegan: false, vegetarian: false, glutenFree: false, kosher: false, other: false };
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
    };

    const earlyBirdDeadline = new Date("2026-07-10").getTime();
    const isEarlyBird = registrationDate < earlyBirdDeadline;
    const ticketPrice =
      ticketPrices[data.ticketType]?.[isEarlyBird ? "early" : "standard"] || 0;
    const accompanyingPrice =
      (isEarlyBird ? 250 : 350) * (data.accompanyingPersonCount || 0);
    const galaDinnerPrice = 100 * (data.galaDinnerCount || 0);
    
    // Generic normalizer to ensure no raw objects/arrays are passed to D1
    const normalizeForD1 = (value) => {
      if (value === undefined || value === null) return null;
      const type = typeof value;
      if (type === "string" || type === "number" || type === "boolean") {
        return value;
      }
      // Convert objects/arrays/Dates to a JSON/string representation
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    // Extract country name as string (handle both object and string formats)
    let countryName = '';
    if (data.country) {
      if (typeof data.country === 'object' && data.country !== null) {
        countryName = data.country.name || JSON.stringify(data.country);
      } else {
        countryName = String(data.country);
      }
    }
    
    // Determine currency and apply Korean tax if applicable
    const isKorean = countryName.toLowerCase().includes("korea");
    let totalPrice = ticketPrice + accompanyingPrice + galaDinnerPrice;
    let currency = "USD";
    
    if (isKorean) {
      // Convert to KRW and apply 10% tax
      const usdToKrwRate = 1350; // Should use real-time rate in production
      totalPrice = Math.round(totalPrice * usdToKrwRate * 1.1);
      currency = "KRW";
    }
    
    // Extract city and state as strings (handle both object and string formats)
    let cityName = null;
    if (data.city) {
      if (typeof data.city === 'object' && data.city !== null) {
        cityName = data.city.name || JSON.stringify(data.city);
      } else {
        cityName = String(data.city);
      }
    }
    
    let stateName = null;
    if (data.state) {
      if (typeof data.state === 'object' && data.state !== null) {
        stateName = data.state.name || JSON.stringify(data.state);
      } else {
        stateName = String(data.state);
      }
    }
    if (!stateName && (data.stateSelect || data.stateText)) {
      stateName = String(data.stateSelect || data.stateText);
    }

    // Normalize membership fields explicitly (they can sometimes be objects)
    const membershipLevel = normalizeForD1(data.membershipLevel);
    const membershipStatus = normalizeForD1(data.membershipStatus);

    // Insert into D1 database
    const stmt = env.ISIR_DB.prepare(
      `
      INSERT INTO registrations (
        id,
        registration_date,
        email,
        first_name,
        middle_name,
        last_name,
        salutation,
        suffix,
        institution,
        credentials,
        badge_name,
        pronouns,
        department,
        address1,
        address2,
        city,
        state,
        zip,
        country,
        phone,
        cell_phone,
        is_physician,
        ticket_type,
        accompanying_count,
        gala_dinner,
        ticket_price,
        total_price,
        is_early_bird,
        dietary_vegan,
        dietary_vegetarian,
        dietary_gluten_free,
        dietary_kosher,
        dietary_other,
        special_assistance,
        policy_agreed,
        privacy_marketing,
        privacy_app,
        opt_out_mailing,
        payment_status,
        membership_level,
        membership_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    );

    // Build parameter list and normalize every value for D1 safety
    const paramNames = [
      'registrationId', 'registrationDate', 'email', 'firstName', 'middleName',
      'lastName', 'salutation', 'suffix', 'institution', 'credentials',
      'badgeName', 'pronouns', 'department', 'address1', 'address2',
      'city', 'state', 'zip', 'country', 'phone', 'cellPhone', 'isPhysician',
      'ticketType', 'accompanyingPersonCount', 'galaDinnerCount',
      'ticketPrice', 'totalPrice', 'isEarlyBird',
      'dietary_vegan', 'dietary_vegetarian', 'dietary_glutenFree', 'dietary_kosher', 'dietary_other',
      'specialAssistance', 'policyAgreed', 'privacyMarketing', 'privacyApp', 'optOutMailing',
      'payment_status', 'membershipLevel', 'membershipStatus'
    ];
    
    const paramValues = [
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
      data.department || null,
      data.address1 || null,
      data.address2 || null,
      cityName,
      stateName,
      data.zip || null,
      countryName || null,
      data.phone || null,
      data.cellPhone || null,
      data.isPhysician || null,
      data.ticketType,
      data.accompanyingPersonCount || 0,
      data.galaDinnerCount || 0,
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
      "pending", // payment_status
      membershipLevel,
      membershipStatus,
    ];

    // Validate and normalize all parameters before binding
    const normalizedParams = paramValues.map((value, index) => {
      const normalized = normalizeForD1(value);
      // Log if we're converting an object to help debug
      if (typeof value === 'object' && value !== null && typeof normalized === 'string') {
        console.log(`⚠️ Normalized object for ${paramNames[index]}:`, JSON.stringify(value), '->', normalized);
      }
      // Double-check: if normalized is still an object, that's a problem
      if (typeof normalized === 'object' && normalized !== null) {
        console.error(`❌ ERROR: ${paramNames[index]} is still an object after normalization!`, normalized);
        return JSON.stringify(normalized);
      }
      return normalized;
    });

    // Final safety check: ensure NO objects remain
    const finalParams = normalizedParams.map((param, index) => {
      if (typeof param === 'object' && param !== null) {
        console.error(`🚨 CRITICAL: ${paramNames[index]} is still an object!`, param);
        return JSON.stringify(param);
      }
      return param;
    });
    
    // Log all parameters before binding to catch any remaining objects
    console.log("Final parameters to bind:", paramNames.map((name, i) => ({ 
      name, 
      value: finalParams[i], 
      type: typeof finalParams[i],
      isObject: typeof finalParams[i] === 'object' && finalParams[i] !== null
    })));
    
    const result = await stmt.bind(...finalParams).run();

    // Update currency if column exists (for new schema)
    try {
      await env.ISIR_DB.prepare(
        `UPDATE registrations SET currency = ? WHERE id = ?`
      )
        .bind(normalizeForD1(currency), normalizeForD1(registrationId))
        .run();
    } catch (err) {
      // Currency column might not exist yet - that's okay
      console.log("Currency column not available, skipping update");
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
      }
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
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
