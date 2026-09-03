/** Oral abstract sessions (YI + N1–N5) used for assignment and speaker letters. */

export const ORAL_SESSIONS = [
  {
    code: "YI",
    title: "Young Investigator Award Competition",
    sessionLine: "Young Investigator Award Competition",
    dateLine: "Friday, November 6, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: true,
  },
  {
    code: "N1",
    roman: "I",
    title:
      "New Research Findings I. Pre-Conception, Fertility & Reproductive Disorders",
    sessionLine:
      "Session N1, New Research Findings I. Pre-Conception, Fertility & Reproductive Disorders",
    dateLine: "Friday, November 6, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: false,
  },
  {
    code: "N2",
    roman: "II",
    title: "New Research Findings II. Early Pregnancy and Implantation",
    sessionLine:
      "Session N2, New Research Findings II. Early Pregnancy and Implantation",
    dateLine: "Friday, November 6, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: false,
  },
  {
    code: "N3",
    roman: "III",
    title: "New Research Findings III. Immune Regulation in Reproduction",
    sessionLine:
      "Session N3, New Research Findings III. Immune Regulation in Reproduction",
    dateLine: "Saturday, November 7, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: false,
  },
  {
    code: "N4",
    roman: "IV",
    title:
      "New Research Findings IV. Immunity, Environment, and Reproductive Fate",
    sessionLine:
      "Session N4, New Research Findings IV. Immunity, Environment, and Reproductive Fate",
    dateLine: "Saturday, November 7, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: false,
  },
  {
    code: "N5",
    roman: "V",
    title:
      "New Research Findings V. Maternal-Fetal Immunology & Gestational Complications",
    sessionLine:
      "Session N5, New Research Findings V. Maternal-Fetal Immunology & Gestational Complications",
    dateLine: "Saturday, November 7, 2026, 4:00 PM – 5:06 PM",
    isYoungInvestigator: false,
  },
];

export const ORAL_SESSION_CODES = ORAL_SESSIONS.map((s) => s.code);

const SESSION_BY_CODE = Object.fromEntries(
  ORAL_SESSIONS.map((s) => [s.code, s]),
);

export function getOralSession(code) {
  const key = String(code || "")
    .trim()
    .toUpperCase();
  return SESSION_BY_CODE[key] || null;
}

/** Normalize assigned session: YI | N1–N5 | null (clear). */
export function parseOralSession(raw) {
  if (raw === null || raw === "" || raw === undefined) {
    return { ok: true, value: null };
  }
  const value = String(raw || "")
    .trim()
    .toUpperCase();
  if (value === "CLEAR" || value === "NONE" || value === "UNASSIGNED") {
    return { ok: true, value: null };
  }
  if (SESSION_BY_CODE[value]) {
    return { ok: true, value };
  }
  return { ok: false, value: null };
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeEmail(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

/**
 * Unique recipients: presenting author first, then corresponding author
 * when the email differs.
 */
export function collectOralSessionRecipients(abstract) {
  const recipients = [];
  const seen = new Set();
  const add = (email, name, role) => {
    const key = normalizeEmail(email);
    if (!key || seen.has(key)) return;
    seen.add(key);
    recipients.push({
      email: String(email).trim(),
      name: String(name || "").trim() || "Author",
      role,
    });
  };
  add(abstract?.presenter_email, abstract?.presenter_name, "presenting");
  add(
    abstract?.corresponding_email,
    abstract?.corresponding_name,
    "corresponding",
  );
  return recipients;
}

export function oralSessionGreeting(recipients) {
  if (!recipients || recipients.length === 0) return "Author";
  if (recipients.length === 1) return recipients[0].name;
  const [a, b] = recipients;
  if (a.name === b.name) return a.name;
  return `${a.name} and ${b.name}`;
}

export function formatRecipientList(recipients) {
  if (!recipients || recipients.length === 0) return "";
  return recipients
    .map((r) => `${r.name} <${r.email}>`)
    .join(", ");
}

/** Fisher–Yates shuffle; odd counts give one extra to a randomly chosen side. */
export function splitEquallyAtRandom(ids, sessionCodes = ["P1", "P2"]) {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  const [first, second] = sessionCodes;
  const extraToFirst = Math.random() < 0.5;
  const nFirst = extraToFirst
    ? Math.ceil(shuffled.length / 2)
    : Math.floor(shuffled.length / 2);
  return {
    [first]: shuffled.slice(0, nFirst),
    [second]: shuffled.slice(nFirst),
  };
}

export const POSTER_SESSIONS = [
  {
    code: "P1",
    number: 1,
    title: "Poster Session I",
    sessionLine: "Poster Session I",
    dateLine: "Friday, November 6, 2026, 11:45 AM – 1:30 PM",
    emailReady: true,
  },
  {
    code: "P2",
    number: 2,
    title: "Poster Session II",
    sessionLine: "Poster Session II",
    dateLine: "Saturday, November 7, 2026, 11:45 AM – 1:00 PM",
    emailReady: true,
  },
];

const POSTER_BY_CODE = Object.fromEntries(
  POSTER_SESSIONS.map((s) => [s.code, s]),
);

export function getPosterSession(code) {
  const key = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "");
  if (key === "1") return POSTER_BY_CODE.P1;
  if (key === "2") return POSTER_BY_CODE.P2;
  return POSTER_BY_CODE[key] || null;
}

/** Normalize assigned poster session: P1 | P2 | null (clear). */
export function parsePosterSession(raw) {
  if (raw === null || raw === "" || raw === undefined) {
    return { ok: true, value: null };
  }
  const value = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/^POSTER\s*(SESSION\s*)?/, "")
    .replace(/^#/, "");
  if (value === "CLEAR" || value === "NONE" || value === "UNASSIGNED") {
    return { ok: true, value: null };
  }
  if (value === "1" || value === "P1") return { ok: true, value: "P1" };
  if (value === "2" || value === "P2") return { ok: true, value: "P2" };
  if (POSTER_BY_CODE[value]) return { ok: true, value };
  return { ok: false, value: null };
}

export function posterSessionSubject(session) {
  const label = session?.title || `Poster Session #${session?.number || ""}`;
  return `ISIR 2026 – ${label}`.trim();
}

const POSTER_DIMENSIONS_TEXT = `Dimensions:
Posters must be in portrait orientation (vertical, not landscape). The dimensions are as follows:
Width: 95 cm (37.4 inches)
Height: 120 cm (47.2 inches)`;

const POSTER_DIMENSIONS_HTML = `<p><strong>Dimensions:</strong><br/>
Posters must be in portrait orientation (vertical, not landscape). The dimensions are as follows:<br/>
Width: 95 cm (37.4 inches)<br/>
Height: 120 cm (47.2 inches)</p>`;

/**
 * Alphabetical poster labels P-101, P-102, … (same scheme as abstract extract export).
 * Pass accepted poster abstracts (id + title); order within the list is ignored.
 */
export function assignPosterNumbers(abstracts, { start = 101 } = {}) {
  const posters = [...(abstracts || [])].sort((a, b) =>
    String(a?.title || "").localeCompare(String(b?.title || ""), undefined, {
      sensitivity: "base",
    }),
  );
  const byId = new Map();
  let num = start;
  for (const row of posters) {
    if (row?.id) {
      byId.set(row.id, `P-${num}`);
      num += 1;
    }
  }
  return byId;
}

export function buildPosterSessionLetter(abstract, session, options = {}) {
  if (!session) return null;
  const posterNumber = options.posterNumber || null;
  const recipients = collectOralSessionRecipients(abstract);
  const greeting = oralSessionGreeting(recipients);
  const id = String(abstract?.id || "").trim() || "—";
  const title = String(abstract?.title || "").trim() || "Untitled abstract";
  const subject = posterSessionSubject(session);
  const opening = `Congratulations! Your abstract, ${id}: ${title}, has been assigned to ${session.title} at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;
  const highlighted = `<strong>${escapeHtml(id)}: ${escapeHtml(title)}</strong>`;
  const openingHtml = `Congratulations! Your abstract, ${highlighted}, has been assigned to ${escapeHtml(session.title)} at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;

  const posterNumberLine = posterNumber
    ? `Poster Number: ${posterNumber}`
    : "Poster Number: (assigned when poster list is finalized)";

  const text = `Dear ${greeting},

${opening}

The presenting author is expected to attend Congress in person to present the work. If the presenting author cannot attend, please identify a co-author to present on your behalf.

Your poster is scheduled as follows:
Title: ${title}
${session.sessionLine}
Session Date: ${session.dateLine}
${posterNumberLine}

${POSTER_DIMENSIONS_TEXT}

Withdrawal of Presentations/Failure to Present:
If it becomes necessary to withdraw your abstract, please have the presenting author email ISIR directly with this request at info@isir2026.org We encourage you to identify a named co-author on your abstract to present in your place before considering withdrawal.

Meeting Registration and Housing Reservations:
You must register yourself for the meeting. Online registration, hotel reservations, and the Preliminary Program are available at https://isir2026.org.

We look forward to welcoming you to Busan!

Warm regards,
The Organizing Committee`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.65;">
  <p>Dear ${escapeHtml(greeting)},</p>
  <p>${openingHtml}</p>
  <p>The presenting author is expected to attend Congress in person to present the work. If the presenting author cannot attend, please identify a co-author to present on your behalf.</p>
  <p>Your poster is scheduled as follows:</p>
  <p style="margin: 0 0 4px 0;"><strong>Title:</strong> ${escapeHtml(title)}</p>
  <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(session.sessionLine)}</strong></p>
  <p style="margin: 0 0 4px 0;"><strong>Session Date:</strong> ${escapeHtml(session.dateLine)}</p>
  <p style="margin: 0 0 16px 0;"><strong>Poster Number:</strong> ${escapeHtml(posterNumber || "(assigned when poster list is finalized)")}</p>
  ${POSTER_DIMENSIONS_HTML}
  <p><strong>Withdrawal of Presentations/Failure to Present:</strong><br/>
  If it becomes necessary to withdraw your abstract, please have the presenting author email ISIR directly with this request at <a href="mailto:info@isir2026.org" style="color: #1a3a6c;">info@isir2026.org</a> We encourage you to identify a named co-author on your abstract to present in your place before considering withdrawal.</p>
  <p><strong>Meeting Registration and Housing Reservations:</strong><br/>
  You must register yourself for the meeting. Online registration, hotel reservations, and the Preliminary Program are available at <a href="https://isir2026.org" style="color: #1a3a6c;">https://isir2026.org</a>.</p>
  <p>We look forward to welcoming you to Busan!</p>
  <p style="margin-top: 28px;">Warm regards,<br/>The Organizing Committee</p>
</body>
</html>`;

  return { subject, html, text, recipients, greeting, session, posterNumber };
}

function openingParagraph(abstract, session) {
  const id = String(abstract?.id || "").trim() || "—";
  const title = String(abstract?.title || "").trim() || "Untitled abstract";
  if (session.isYoungInvestigator) {
    return `CONGRATULATIONS! Your abstract, ${id}: ${title}, has been selected for Young Investigator Award Competition at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;
  }
  return `Congratulations! Your abstract, ${id}: ${title}, has been selected for oral presentation at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;
}

function openingParagraphHtml(abstract, session) {
  const id = String(abstract?.id || "").trim() || "—";
  const title = String(abstract?.title || "").trim() || "Untitled abstract";
  const highlighted = `<strong>${escapeHtml(id)}: ${escapeHtml(title)}</strong>`;
  if (session.isYoungInvestigator) {
    return `CONGRATULATIONS! Your abstract, ${highlighted}, has been selected for Young Investigator Award Competition at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;
  }
  return `Congratulations! Your abstract, ${highlighted}, has been selected for oral presentation at the ISIR 2026 Congress, taking place November 5 - 8, 2026, in Busan, Korea.`;
}

export function oralSessionSubject(session) {
  if (session?.isYoungInvestigator) {
    return "ISIR 2026 – Young Investigator Award Competition";
  }
  return `ISIR 2026 – Oral presentation, Session ${session?.code || ""}`.trim();
}

/**
 * Build the oral speaker letter (HTML + plain text) for a given abstract + session.
 */
export function buildOralSessionLetter(abstract, session) {
  if (!session) {
    return null;
  }
  const recipients = collectOralSessionRecipients(abstract);
  const greeting = oralSessionGreeting(recipients);
  const title = String(abstract?.title || "").trim() || "Untitled abstract";
  const subject = oralSessionSubject(session);
  const opening = openingParagraph(abstract, session);

  const text = `Dear ${greeting},

${opening}

The presenting author is expected to attend Congress in person to present the work. If the presenting author cannot attend, please identify a co-author to present on your behalf.

Below are the tentative details of the presentation:

Your presentation is scheduled as follows:
Title: ${title}
${session.sessionLine}
Session Date: ${session.dateLine}

Important Notes and Guidelines:
At the meeting, on the date and time of your presentation above, you will give an 8-minute presentation of your abstract followed by 3 minutes of discussion. Total time of your presentation is 11 min. No virtual/pre-recorded presentation is allowed.

Withdrawal of Presentations/Failure to Present:
If it becomes necessary to withdraw your abstract, please have the presenting author email ISIR directly with this request at info@isir2026.org We encourage you to identify a named co-author on your abstract to present in your place before considering withdrawal.

Meeting Registration and Housing Reservations:
You must register yourself for the meeting. Online registration, hotel reservations, and the Preliminary Program are available at https://isir2026.org.

Once again, congratulations on this achievement. We look forward to seeing you in Busan!

The ISIR 2026 Organizing Committee`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.65;">
  <p>Dear ${escapeHtml(greeting)},</p>
  <p>${openingParagraphHtml(abstract, session)}</p>
  <p>The presenting author is expected to attend Congress in person to present the work. If the presenting author cannot attend, please identify a co-author to present on your behalf.</p>
  <p>Below are the tentative details of the presentation:</p>
  <p>Your presentation is scheduled as follows:</p>
  <p style="margin: 0 0 4px 0;"><strong>Title:</strong> ${escapeHtml(title)}</p>
  <p style="margin: 0 0 4px 0;"><strong>${escapeHtml(session.sessionLine)}</strong></p>
  <p style="margin: 0 0 16px 0;"><strong>Session Date:</strong> ${escapeHtml(session.dateLine)}</p>
  <p><strong>Important Notes and Guidelines:</strong><br/>
  At the meeting, on the date and time of your presentation above, you will give an 8-minute presentation of your abstract followed by 3 minutes of discussion. Total time of your presentation is 11 min. No virtual/pre-recorded presentation is allowed.</p>
  <p><strong>Withdrawal of Presentations/Failure to Present:</strong><br/>
  If it becomes necessary to withdraw your abstract, please have the presenting author email ISIR directly with this request at <a href="mailto:info@isir2026.org" style="color: #1a3a6c;">info@isir2026.org</a> We encourage you to identify a named co-author on your abstract to present in your place before considering withdrawal.</p>
  <p><strong>Meeting Registration and Housing Reservations:</strong><br/>
  You must register yourself for the meeting. Online registration, hotel reservations, and the Preliminary Program are available at <a href="https://isir2026.org" style="color: #1a3a6c;">https://isir2026.org</a>.</p>
  <p>Once again, congratulations on this achievement. We look forward to seeing you in Busan!</p>
  <p style="margin-top: 28px;">The ISIR 2026 Organizing Committee</p>
</body>
</html>`;

  return { subject, html, text, recipients, greeting, session };
}
