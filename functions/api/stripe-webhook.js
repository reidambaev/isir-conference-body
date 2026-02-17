/**
 * Cloudflare Pages Function - Stripe Webhook Handler
 * Handles Stripe webhook events for payment confirmation
 *
 * Endpoint: /api/stripe-webhook
 * Method: POST
 */

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

export async function onRequestPost(context) {
  const { request, env } = context;

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

            // Send confirmation email if Resend is configured (e.g. with Google Workspace domain)
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
