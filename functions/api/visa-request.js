export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const { email, name, country, notes } = body;

    // Validate required fields
    if (!email || !name || !country) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, name, and country are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate a unique ID for the visa request
    const visaRequestId = crypto.randomUUID();
    const timestamp = Date.now();

    // Insert visa request into database
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
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Visa request error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit visa request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
