/**
 * Cloudflare Pages Function - Test Email
 * Sends a test confirmation email (for debugging). Protected by TEST_EMAIL_SECRET.
 *
 * Endpoint: /api/test-email
 * Method: POST
 * Body: { to: "your@email.com", secret: "your-test-secret" }
 *   Or send secret in header: X-Test-Email-Secret
 *
 * Env: RESEND_API_KEY, CONFIRMATION_FROM_EMAIL, TEST_EMAIL_SECRET (required to enable)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Test-Email-Secret",
  "Content-Type": "application/json",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Test email is disabled. Set TEST_EMAIL_SECRET (and RESEND_API_KEY, CONFIRMATION_FROM_EMAIL) in env to enable.",
      }),
      { status: 501, headers: corsHeaders }
    );
  }

  const secret = request.headers.get("X-Test-Email-Secret");
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    // optional body
  }
  const providedSecret = secret || body.secret;
  if (providedSecret !== env.TEST_EMAIL_SECRET) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or missing secret (use header X-Test-Email-Secret or body.secret)." }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!env.RESEND_API_KEY || !env.CONFIRMATION_FROM_EMAIL) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Resend not configured. Set RESEND_API_KEY and CONFIRMATION_FROM_EMAIL.",
      }),
      { status: 503, headers: corsHeaders }
    );
  }

  const to = (body.to || "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return new Response(
      JSON.stringify({ success: false, error: "Valid 'to' email required in request body." }),
      { status: 400, headers: corsHeaders }
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
  <p>If you received this, Resend and your “from” address are working correctly.</p>
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "Resend API error",
          status: res.status,
          details: data,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${to}`,
        id: data.id || null,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Test email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to send" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
