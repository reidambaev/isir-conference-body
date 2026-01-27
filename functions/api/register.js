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
    const galaDinnerPrice = 100 * (data.galaDinnerCount || 0);
    const totalPrice = ticketPrice + accompanyingPrice + galaDinnerPrice;

    // Insert into D1 database
    const result = await env.ISIR_DB.prepare(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
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
        data.department || null,
        data.address1 || null,
        data.address2 || null,
        data.city || null,
        data.stateSelect || data.stateText || null,
        data.zip || null,
        data.country || null,
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
        data.membershipLevel || null,
        data.membershipStatus || null
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
