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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
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
               WHERE id = ?`
            )
              .bind(
                paymentIntent.id,
                Date.now(),
                registrationId
              )
              .run();

            console.log(`Payment confirmed for registration: ${registrationId}`);

            // Send confirmation email if Resend is configured (e.g. with Google Workspace domain)
            if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
              const row = await env.ISIR_DB.prepare(
                `SELECT email, first_name, middle_name, last_name, ticket_type, total_price, currency FROM registrations WHERE id = ?`
              )
                .bind(registrationId)
                .first();
              if (row?.email) {
                const name = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ") || "Attendee";
                const ticketLabel = row.ticket_type || "Conference";
                const amount = row.total_price != null ? `${row.currency || "USD"} ${Number(row.total_price).toFixed(2)}` : "";
                const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Registration Confirmed</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a3a6c;">Registration confirmed</h2>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Your payment has been received and your registration for ISIR 2026 is confirmed.</p>
  <ul>
    <li><strong>Ticket:</strong> ${escapeHtml(ticketLabel)}</li>
    ${amount ? `<li><strong>Amount paid:</strong> ${escapeHtml(amount)}</li>` : ""}
  </ul>
  <p>You will receive further event details by email. If you have any questions, please contact the organizers.</p>
  <p>Best regards,<br/>ISIR 2026 Team</p>
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
               WHERE id = ?`
            )
              .bind(failedRegistrationId)
              .run();

            console.log(`Payment failed for registration: ${failedRegistrationId}`);
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
