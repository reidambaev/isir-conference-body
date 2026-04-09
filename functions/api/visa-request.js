function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const VISA_NOTIFY_EMAIL = "sklee@kyuh.ac.kr";
const VISA_NOTIFY_NAME = "Sung Ki Lee";

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

    // Send notification email to visa coordinator
    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const safeNotes = notes && String(notes).trim() ? String(notes).trim() : "";
      const submittedAt = new Date(timestamp).toISOString().replace("T", " ").slice(0, 19) + " UTC";
      const html = `
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
            subject: `ISIR 2026 – Visa request from ${name} (${country})`,
            html,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error("Visa notification email failed:", res.status, err);
        } else {
          console.log(`Visa notification email sent to ${VISA_NOTIFY_EMAIL}`);
        }
      } catch (emailError) {
        console.error("Visa notification email error:", emailError);
      }
    }

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
