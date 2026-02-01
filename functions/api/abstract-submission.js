/**
 * Cloudflare Pages Function - Abstract Submission API
 * Stores abstract submission data in D1 database
 *
 * Endpoint: /api/abstract-submission
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

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
        // These are JSON fields, check if they're arrays with items
        let fieldData = data[field];
        if (typeof fieldData === "string") {
          try {
            fieldData = JSON.parse(fieldData);
          } catch (e) {
            return new Response(
              JSON.stringify({
                error: `Invalid ${field} format. Must be valid JSON array.`,
              }),
              {
                status: 400,
                headers: corsHeaders,
              },
            );
          }
        }
        if (!Array.isArray(fieldData) || fieldData.length === 0) {
          return new Response(
            JSON.stringify({
              error: `${field} must be a non-empty array`,
            }),
            {
              status: 400,
              headers: corsHeaders,
            },
          );
        }
      } else if (!data[field] || data[field].trim() === "") {
        return new Response(
          JSON.stringify({
            error: `Missing required field: ${field}`,
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.presenterEmail)) {
      return new Response(
        JSON.stringify({
          error: "Invalid presenter email format",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }
    if (!emailRegex.test(data.correspondingEmail)) {
      return new Response(
        JSON.stringify({
          error: "Invalid corresponding author email format",
        }),
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
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Validate presentation preference
    const validPreferences = ["oral", "poster", "either"];
    if (!validPreferences.includes(data.presentationPreference)) {
      return new Response(
        JSON.stringify({
          error: "Invalid presentation preference",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Check submission deadline (April 30, 2026)
    const submissionDeadline = new Date("2026-04-30").getTime();
    const now = Date.now();
    if (now > submissionDeadline) {
      return new Response(
        JSON.stringify({
          error: "Submission deadline has passed",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Check if submission window has opened (March 1, 2026)
    const submissionOpens = new Date("2026-03-01").getTime();
    if (now < submissionOpens) {
      return new Response(
        JSON.stringify({
          error: "Submission window has not opened yet",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Generate unique submission ID
    const submissionId = `ABS-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    const submissionDate = Date.now();

    // Parse affiliations JSON
    let affiliationsData = [];
    try {
      affiliationsData = JSON.parse(data.affiliations);
      if (!Array.isArray(affiliationsData)) {
        affiliationsData = [];
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid affiliations format. Must be valid JSON array.",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Parse authors JSON
    let authorsData = [];
    try {
      authorsData = JSON.parse(data.authors);
      if (!Array.isArray(authorsData)) {
        authorsData = [];
      }
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid authors format. Must be valid JSON array.",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Validate authors have required fields
    for (const author of authorsData) {
      if (!author.firstName || !author.firstName.trim()) {
        return new Response(
          JSON.stringify({
            error: "All authors must have a first name",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }
      if (!author.lastName || !author.lastName.trim()) {
        return new Response(
          JSON.stringify({
            error: "All authors must have a last name",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }
    }

    // Identify corresponding author id (will be used in abstractions table)
    const correspondingAuthorIndex = authorsData.findIndex(
      (author) => author.isCorresponding,
    );

    if (correspondingAuthorIndex === -1) {
      return new Response(
        JSON.stringify({
          error: "A corresponding author must be designated",
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const correspondingAuthorId = `AUTH-${submissionId}-${correspondingAuthorIndex}`;

    // Insert abstract into D1 database
    const abstractResult = await env.ISIR_DB.prepare(
      `
      INSERT INTO abstractions (
        id,
        submission_date,
        title,
        category,
        keywords,
        abstract,
        word_count,
        presentation_preference,
        presenter_name,
        presenter_email,
        corresponding_name,
        corresponding_email,
        corresponding_author_id,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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
        "submitted",
        submissionDate,
      )
      .run();

    // Insert individual authors for easier querying
    for (let i = 0; i < authorsData.length; i++) {
      const author = authorsData[i];
      const authorId = `AUTH-${submissionId}-${i}`;

      await env.ISIR_DB.prepare(
        `
        INSERT INTO authors (
          id,
          abstract_id,
          first_name,
          middle_name,
          last_name,
          email,
          is_presenter,
          is_corresponding,
          position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
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

    // Send confirmation email to corresponding author if Resend is configured
    if (env.RESEND_API_KEY && env.CONFIRMATION_FROM_EMAIL) {
      const toEmail = data.correspondingEmail?.trim();
      if (toEmail) {
        const name = data.correspondingName?.trim() || "Author";
        const title = data.title?.trim() || "";
        const category = data.category?.trim() || "";
        const pref = (data.presentationPreference || "").toLowerCase();
        const prefLabel =
          pref === "oral"
            ? "Oral"
            : pref === "poster"
              ? "Poster"
              : pref === "either"
                ? "Oral or Poster"
                : data.presentationPreference || "";
        const abstractSnippet = (data.abstract?.trim() || "").slice(0, 280);
        const abstractDisplay =
          abstractSnippet + (abstractSnippet.length >= 280 ? "…" : "");
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Abstract Received – ISIR 2026</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.5;">
  <div style="border-bottom: 3px solid #1a3a6c; padding-bottom: 16px; margin-bottom: 24px;">
    <h1 style="color: #1a3a6c; font-size: 1.5rem; margin: 0;">ISIR 2026 World Congress</h1>
    <p style="color: #555; font-size: 0.9rem; margin: 4px 0 0 0;">Abstract submission received</p>
  </div>
  <p>Dear ${escapeHtml(name)},</p>
  <p>Thank you for submitting your abstract to the ISIR 2026 World Congress. We have received your submission and it will be reviewed by the scientific committee.</p>
  <div style="background: #f5f7fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a3a6c;">Submission details</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tr><td style="padding: 4px 0; vertical-align: top;">Submission ID</td><td style="padding: 4px 0; text-align: right;"><strong>${escapeHtml(submissionId)}</strong></td></tr>
      <tr><td style="padding: 4px 0; vertical-align: top;">Title</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(title)}</td></tr>
      <tr><td style="padding: 4px 0;">Category</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(category)}</td></tr>
      <tr><td style="padding: 4px 0;">Presentation preference</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(prefLabel)}</td></tr>
      <tr><td style="padding: 4px 0;">Word count</td><td style="padding: 4px 0; text-align: right;">${wordCount} / 300</td></tr>
    </table>
    ${abstractDisplay ? `<p style="margin: 12px 0 0 0; font-size: 0.9rem; color: #555;"><strong>Abstract (excerpt):</strong><br/>${escapeHtml(abstractDisplay)}</p>` : ""}
  </div>
  <p><strong>What happens next</strong></p>
  <ul style="margin: 0 0 20px 0; padding-left: 1.2rem;">
    <li><strong>Save your Submission ID</strong> (${escapeHtml(submissionId)}) — you may need it when contacting us or checking status.</li>
    <li>Your abstract will be reviewed by the scientific committee. You will be notified of the outcome by email.</li>
  </ul>
  <p>If you have any questions, please contact the organizers at <a href="mailto:support@theisir.org" style="color: #1a3a6c;">support@theisir.org</a> and quote your submission ID.</p>
  <p style="margin-top: 28px;">Best regards,<br/><strong>ISIR 2026 Team</strong></p>
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
              to: [toEmail],
              subject: "ISIR 2026 – Abstract submission received",
              html,
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            console.error(
              "Resend abstract confirmation failed:",
              res.status,
              err,
            );
          } else {
            console.log(`Abstract confirmation email sent to ${toEmail}`);
          }
        } catch (emailError) {
          console.error("Abstract confirmation email error:", emailError);
          // Don't fail the submission
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submissionId,
        message: "Abstract submitted successfully!",
      }),
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Abstract submission error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to submit abstract",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function onRequestOptions(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  return new Response(null, {
    headers: corsHeaders,
  });
}
