/**
 * Cloudflare Pages Function - Abstract Submission API
 * Stores abstract submission data in D1 database
 *
 * Endpoint: /api/abstract-submission
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
      "conflictOfInterest",
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
              }
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
            }
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
          }
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
        }
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
        {
          status: 400,
          headers: corsHeaders,
        }
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
        }
      );
    }

    // Validate conflict of interest
    const validConflict = ["yes", "no"];
    if (!validConflict.includes(data.conflictOfInterest)) {
      return new Response(
        JSON.stringify({
          error: "Invalid conflict of interest value",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
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
        }
      );
    }

    // Check if submission window has opened (January 15, 2026)
    const submissionOpens = new Date("2026-01-15").getTime();
    if (now < submissionOpens) {
      return new Response(
        JSON.stringify({
          error: "Submission window has not opened yet",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
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
        }
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
        }
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
          }
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
          }
        );
      }
    }

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
        conflict_of_interest,
        conflict_details,
        presenter_name,
        presenter_email,
        corresponding_name,
        corresponding_email,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
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
        data.conflictOfInterest,
        data.conflictOfInterest === "yes" ? data.conflictDetails?.trim() : null,
        data.presenterName.trim(),
        data.presenterEmail.trim(),
        data.correspondingName.trim(),
        data.correspondingEmail.trim(),
        "submitted",
        submissionDate
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
      `
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

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submissionId,
        message: "Abstract submitted successfully!",
      }),
      {
        status: 201,
        headers: corsHeaders,
      }
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
      }
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
