/**
 * Cloudflare Pages Function - Registration API
 * Stores registration data in D1 database
 *
 * Endpoint: /api/register
 * Method: POST
 * Version: 2.1.0 - Enhanced logging with console.error + detailed bind error handling
 */

// Static version for deployment verification (change this when deploying)
const CODE_VERSION_STATIC = "2.1.0-enhanced-logging";
const CODE_VERSION = CODE_VERSION_STATIC + "-" + Date.now();

export async function onRequestPost(context) {
  // VERSION HEADER - always set this first
  const versionHeader = { "X-API-Version": CODE_VERSION_STATIC };
  
  try {
    const { request, env } = context;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // IMMEDIATE VERSION CHECK - return version in response headers too
    const responseHeaders = {
      ...corsHeaders,
      ...versionHeader,
    };
    console.error("=== REGISTRATION API CALLED ===");
    console.error("Static Version:", CODE_VERSION_STATIC);
    console.error("Full Version:", CODE_VERSION);
    console.error("This code was deployed at:", new Date().toISOString());
    
    // Parse request body
    let rawData;
    try {
      rawData = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          version: CODE_VERSION_STATIC,
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }
    
    // Log incoming data to identify objects - THIS IS CRITICAL FOR DEBUGGING
    console.error("Raw data received:", JSON.stringify(rawData, null, 2));
    
    // Check for objects in raw data immediately
    for (const [key, value] of Object.entries(rawData)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && key !== 'dietary') {
        console.error(`⚠️ OBJECT DETECTED in rawData.${key}:`, JSON.stringify(value));
      }
    }
    
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
          console.error(`Sanitized ${key}:`, JSON.stringify(value), '->', sanitized);
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

    // Force extract country/city/state as strings - handle ALL cases
    const extractString = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (typeof value === 'object' && value !== null) {
        // Try to extract name property first
        if (value.name) return String(value.name);
        // Otherwise stringify
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    };
    
    const countryName = extractString(data.country) || '';
    const cityName = extractString(data.city);
    const stateName = extractString(data.state) || extractString(data.stateSelect) || extractString(data.stateText);
    
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
    
    // Ensure all values are primitives before building params
    const safeNumber = (val) => {
      if (val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    
    const safeBoolean = (val) => {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val ? 1 : 0;
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        return (lower === 'true' || lower === '1' || lower === 'yes') ? 1 : 0;
      }
      return val ? 1 : 0;
    };
    
    const safeString = (val) => {
      if (val === null || val === undefined) return null;
      return extractString(val);
    };
    
    // Extract dietary values safely
    const dietary = data.dietary || {};
    const dietaryVegan = safeBoolean(dietary.vegan || dietary.vegan === true);
    const dietaryVegetarian = safeBoolean(dietary.vegetarian || dietary.vegetarian === true);
    const dietaryGlutenFree = safeBoolean(dietary.glutenFree || dietary.gluten_free || dietary.glutenFree === true);
    const dietaryKosher = safeBoolean(dietary.kosher || dietary.kosher === true);
    const dietaryOther = safeBoolean(dietary.other || dietary.other === true);
    
    const paramValues = [
      registrationId, // string
      registrationDate, // number
      safeString(data.email),
      safeString(data.firstName),
      safeString(data.middleName),
      safeString(data.lastName),
      safeString(data.salutation),
      safeString(data.suffix),
      safeString(data.institution),
      safeString(data.credentials),
      safeString(data.badgeName),
      safeString(data.pronouns),
      safeString(data.department),
      safeString(data.address1),
      safeString(data.address2),
      cityName, // already extracted as string
      stateName, // already extracted as string
      safeString(data.zip),
      countryName || null, // already extracted as string
      safeString(data.phone),
      safeString(data.cellPhone),
      safeString(data.isPhysician),
      safeString(data.ticketType),
      safeNumber(data.accompanyingPersonCount),
      safeNumber(data.galaDinnerCount),
      safeNumber(ticketPrice),
      safeNumber(totalPrice),
      isEarlyBird ? 1 : 0,
      dietaryVegan,
      dietaryVegetarian,
      dietaryGlutenFree,
      dietaryKosher,
      dietaryOther,
      safeBoolean(data.specialAssistance),
      safeBoolean(data.policyAgreed),
      safeBoolean(data.privacyMarketing),
      safeBoolean(data.privacyApp),
      safeBoolean(data.optOutMailing),
      "pending", // payment_status - hardcoded string
      membershipLevel, // already normalized
      membershipStatus, // already normalized
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

    // Final safety check: ensure NO objects remain - this should NEVER happen
    const finalParams = normalizedParams.map((param, index) => {
      const paramType = typeof param;
      if (paramType === 'object' && param !== null) {
        const errorMsg = `🚨 CRITICAL ERROR: ${paramNames[index]} is still an object after all normalization! Value: ${JSON.stringify(param)}`;
        console.error(errorMsg);
        // Force convert to string
        try {
          return JSON.stringify(param);
        } catch {
          return String(param);
        }
      }
      // Double-check: ensure it's a valid D1 type
      if (paramType !== 'string' && paramType !== 'number' && paramType !== 'boolean' && param !== null) {
        console.warn(`⚠️ Unexpected type for ${paramNames[index]}: ${paramType}, value: ${param}`);
        return String(param);
      }
      return param;
    });
    
    // Log all parameters before binding to catch any remaining objects
    const paramLog = paramNames.map((name, i) => {
      const val = finalParams[i];
      const type = typeof val;
      const isObject = type === 'object' && val !== null;
      if (isObject) {
        console.error(`❌ OBJECT FOUND: ${name} =`, val);
      }
      return { name, value: val, type, isObject };
    });
    console.error("Final parameters to bind:", JSON.stringify(paramLog, null, 2));
    
    // One more check - if ANY object remains, throw error before binding
    const hasObjects = finalParams.some(p => typeof p === 'object' && p !== null);
    if (hasObjects) {
      const error = new Error("D1_TYPE_ERROR: Objects detected in parameters after normalization. Check logs for details.");
      console.error("FATAL: Cannot proceed with objects in parameters:", paramLog.filter(p => p.isObject));
      throw error;
    }
    
    // Try to bind with detailed error reporting
    let result;
    try {
      result = await stmt.bind(...finalParams).run();
    } catch (bindError) {
      // If bind fails, try to identify which parameter is the problem
      console.error("D1 bind error:", bindError.message);
      console.error("Parameter count:", finalParams.length);
      console.error("Parameter types:", finalParams.map((p, i) => ({
        index: i,
        name: paramNames[i],
        type: typeof p,
        value: p,
        isObject: typeof p === 'object' && p !== null,
        stringified: typeof p === 'object' ? JSON.stringify(p) : p
      })));
      
      // Try binding one parameter at a time to find the culprit
      for (let i = 0; i < finalParams.length; i++) {
        const param = finalParams[i];
        if (typeof param === 'object' && param !== null) {
          console.error(`🚨 FOUND OBJECT at index ${i} (${paramNames[i]}):`, param);
          console.error(`   Type: ${typeof param}, Value:`, JSON.stringify(param));
        }
      }
      
      throw bindError;
    }

    // Update currency if column exists (for new schema)
    try {
      await env.ISIR_DB.prepare(
        `UPDATE registrations SET currency = ? WHERE id = ?`
      )
        .bind(normalizeForD1(currency), normalizeForD1(registrationId))
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
        version: CODE_VERSION_STATIC, // Static version for deployment verification
        timestamp: Date.now(), // When this request was processed
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("=== REGISTRATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    
    // Ensure we have headers even if error happened early
    const errorHeaders = responseHeaders || {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
      "X-API-Version": CODE_VERSION_STATIC,
    };
    
    // Include more details in response for debugging
    const errorDetails = {
      message: error.message,
      name: error.name,
    };
    
    // In development or if error contains useful info, include it
    if (error.message.includes('D1_TYPE_ERROR') || error.message.includes('object')) {
      errorDetails.hint = "An object was passed to D1. Check Cloudflare logs for parameter details.";
    }
    
    // ALWAYS include version in error response - THIS PROVES CODE IS DEPLOYED
    const errorResponse = {
      success: false,
      error: error.message || "Failed to save registration",
      version: CODE_VERSION_STATIC, // Static version - MUST be in every response
      ...errorDetails,
    };
    
    console.error("Sending error response:", JSON.stringify(errorResponse));
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: errorHeaders,
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
