import {
  AlignmentType,
  Document,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { getProgramSession } from "../config/programSessions";
import { getOralSession } from "../config/oralSessions";

const PROGRAM_SESSION_LABELS = {
  PS1: "President Symposium I",
  PS2: "President Symposium II",
  PF1: "Public Forum I",
  PF2: "Public Forum II",
  PF3: "Public Forum III",
  POP1:
    "Population Forum I — Population Aging in Korea: Demographic Realities, Societal Change, and Reproductive Health",
  POP2:
    "Population Forum II — Future Direction: What Do We Need to Improve Population Concerns",
  S1: "Immune Regulation in the Endometrium",
  S2: "Gynecologic Malignancies and Immune Abnormalities",
  S3: "Environmental Exposures and Developmental Origins of Disease",
  S4: "KI Symposium",
  S5: "Microbiome and Pregnancy Outcomes",
  S6: "Male Infertility",
  S7: "Immune Mechanisms of Female Reproductive Aging",
  S8: "Preeclampsia and Its Systemic Consequences",
  S9: "Rheumatic Conditions and Reproductive Outcomes",
  S10: "Ovarian Inflammatory Disease and Aging",
  S11: "Preeclampsia and Its Systemic Consequences",
  S12: "Current Immunotherapeutic Options for Reproductive Health",
  S13: "Exosome, Mitochondrial Function, and Cell-Based Therapies",
  S14: "Infection, Inflammation, and Pregnancy",
  S15: "Update on Reproductive Disorders and Management",
  S16: "T Cell Immunity and Pregnancy",
  S17: "Fetal Outcome with Inflammatory Insult",
  S18: "Early Pregnancy and Placental Development",
  S19: "Immune Regulation and Therapeutic Application of Human Reproduction",
  S20: "High Risk OB, 2nd/3rd Trimester Complications",
  S21: "Immunotherapeutic Options for Reproductive Failures",
};

const LEFT = { alignment: AlignmentType.LEFT };
const BODY_SIZE = 24; // half-points (12pt)
const AFFIL_SIZE = 20; // 10pt
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SECTION_HEADINGS =
  "Objectives|Methods|Results|Conclusions|Background|Introduction|Design|Findings|Funding";
const MAX_RUN_CHARS = 1200;

export function getProgramSessionLabel(code) {
  const session = getProgramSession(code);
  if (!session) return null;
  return PROGRAM_SESSION_LABELS[session] || session;
}

/** Strip characters that break WordprocessingML XML. */
function sanitizeDocxText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\u00A0/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[\uFFFE\uFFFF]/g, "");
}

function normalizeFormat(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (value === "oral" || value === "poster") return value;
  return null;
}

function effectiveFormat(row) {
  return (
    normalizeFormat(row?.assigned_format) ||
    normalizeFormat(row?.presentation_preference)
  );
}

function authorName(author) {
  if (!author) return "";
  return `${author.first_name || author.firstName || ""}${
    author.middle_name || author.middleName
      ? ` ${author.middle_name || author.middleName}`
      : ""
  } ${author.last_name || author.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function affiliationLine(aff) {
  return [aff?.department, aff?.institution, aff?.city, aff?.country]
    .filter(Boolean)
    .join(", ");
}

function affiliationKey(aff) {
  return affiliationLine(aff).toLowerCase();
}

function namesMatch(affName, author) {
  const left = String(affName || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!left) return false;
  const full = authorName(author).toLowerCase();
  const noMiddle = `${author.first_name || author.firstName || ""} ${
    author.last_name || author.lastName || ""
  }`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return left === full || left === noMiddle;
}

function buildAuthorAffiliationBlocks(abstract) {
  const authors = [...(abstract.authors || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const rawAffiliations = [...(abstract.affiliations || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const unique = [];
  const indexByKey = new Map();
  for (const aff of rawAffiliations) {
    const key = affiliationKey(aff);
    if (!key || indexByKey.has(key)) continue;
    indexByKey.set(key, unique.length + 1);
    unique.push({ n: unique.length + 1, line: affiliationLine(aff) });
  }

  const authorBlocks = authors.map((author) => {
    const nums = [];
    for (const aff of rawAffiliations) {
      if (!namesMatch(aff.author_name, author)) continue;
      const n = indexByKey.get(affiliationKey(aff));
      if (n && !nums.includes(n)) nums.push(n);
    }
    return { name: authorName(author) || "Unnamed author", nums };
  });

  return { authorBlocks, unique };
}

function splitAbstractSections(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const regex = new RegExp(`(${SECTION_HEADINGS})\\s*:`, "gi");
  const parts = raw.split(regex);
  if (parts.length <= 1) {
    const paragraphs = raw
      .split(/\n\s*\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (paragraphs.length <= 1) {
      return [{ heading: null, body: raw }];
    }
    return paragraphs.map((body) => ({ heading: null, body }));
  }
  const sections = [];
  let pendingHeading = null;
  for (const part of parts) {
    if (!part) continue;
    if (new RegExp(`^(${SECTION_HEADINGS})$`, "i").test(part.trim())) {
      pendingHeading = part.trim();
      continue;
    }
    const body = part.trim();
    if (!body && !pendingHeading) continue;
    sections.push({ heading: pendingHeading, body });
    pendingHeading = null;
  }
  return sections.length > 0 ? sections : [{ heading: null, body: raw }];
}

function isYiSessionAbstract(abstract) {
  const session = getOralSession(abstract?.oral_session);
  return session?.code === "YI";
}

function compareByTitle(a, b) {
  return String(a?.title || "").localeCompare(String(b?.title || ""));
}

/** Invited speakers, then YI session (oral_session YI), then oral, then poster. */
export function sortForJournalExport(abstracts) {
  const invited = [];
  const youngInvestigator = [];
  const oral = [];
  const poster = [];
  const other = [];

  for (const abstract of abstracts || []) {
    if (Number(abstract.is_invited_speaker || 0) === 1) {
      invited.push(abstract);
      continue;
    }
    if (isYiSessionAbstract(abstract)) {
      youngInvestigator.push(abstract);
      continue;
    }
    const fmt = effectiveFormat(abstract);
    if (fmt === "oral") oral.push(abstract);
    else if (fmt === "poster") poster.push(abstract);
    else other.push(abstract);
  }

  invited.sort((a, b) => {
    const sessionA = getProgramSession(a.program_session) || "ZZZ";
    const sessionB = getProgramSession(b.program_session) || "ZZZ";
    const diff = sessionA.localeCompare(sessionB, undefined, { numeric: true });
    return diff !== 0 ? diff : compareByTitle(a, b);
  });
  youngInvestigator.sort(compareByTitle);
  oral.sort(compareByTitle);
  poster.sort(compareByTitle);
  other.sort(compareByTitle);

  return [...invited, ...youngInvestigator, ...oral, ...poster, ...other];
}

function assignJournalLabels(abstracts) {
  let yiNum = 1;
  let oralNum = 101;
  let posterNum = 101;
  return (abstracts || []).map((abstract) => {
    if (Number(abstract.is_invited_speaker || 0) === 1) {
      const session = getProgramSession(abstract.program_session);
      return {
        abstract,
        label: session || "Unassigned session",
      };
    }
    if (isYiSessionAbstract(abstract)) {
      const label = `YI-${yiNum}`;
      yiNum += 1;
      return { abstract, label };
    }
    const fmt = effectiveFormat(abstract);
    if (fmt === "oral") {
      const label = `O-${oralNum}`;
      oralNum += 1;
      return { abstract, label };
    }
    if (fmt === "poster") {
      const label = `P-${posterNum}`;
      posterNum += 1;
      return { abstract, label };
    }
    return { abstract, label: abstract.id || "Untitled" };
  });
}

function textRuns(text, options = {}) {
  const clean = sanitizeDocxText(text);
  if (!clean) return [new TextRun({ text: "", size: BODY_SIZE, ...options })];
  const runs = [];
  for (let i = 0; i < clean.length; i += MAX_RUN_CHARS) {
    runs.push(
      new TextRun({
        text: clean.slice(i, i + MAX_RUN_CHARS),
        size: BODY_SIZE,
        ...options,
      }),
    );
  }
  return runs;
}

function leftPara(children, spacing = {}) {
  return new Paragraph({
    ...LEFT,
    spacing,
    children,
  });
}

function buildAuthorsParagraph(authorBlocks) {
  if (authorBlocks.length === 0) return null;
  const runs = [];
  authorBlocks.forEach((block, i) => {
    runs.push(...textRuns(block.name));
    if (block.nums.length > 0) {
      runs.push(
        new TextRun({
          text: block.nums.join(","),
          superScript: true,
          size: BODY_SIZE,
        }),
      );
    }
    if (i < authorBlocks.length - 1) {
      runs.push(...textRuns(", "));
    }
  });
  return leftPara(runs, { after: 120 });
}

function buildBodyParagraphs(abstract) {
  const bodyText = sanitizeDocxText(
    abstract?.abstract || abstract?.abstract_text || "",
  ).trim();
  if (!bodyText) {
    return [leftPara(textRuns("No abstract text."))];
  }
  return splitAbstractSections(bodyText).map((section) => {
    const runs = [];
    if (section.heading) {
      runs.push(...textRuns(`${section.heading}: `, { bold: true }));
    }
    runs.push(...textRuns(section.body));
    return leftPara(runs, { after: 120 });
  });
}

function buildAbstractParagraphs({ abstract, label }, { pageBreakBefore = false }) {
  const { authorBlocks, unique } = buildAuthorAffiliationBlocks(abstract);
  const title = sanitizeDocxText(abstract.title || "").trim() || "Untitled";
  const paragraphs = [];

  if (pageBreakBefore) {
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
  }

  paragraphs.push(
    leftPara(textRuns(label, { bold: true }), {
      after: 160,
      ...(pageBreakBefore ? {} : {}),
    }),
    leftPara(textRuns(title, { bold: true }), { after: 160 }),
  );

  const authorsPara = buildAuthorsParagraph(authorBlocks);
  if (authorsPara) paragraphs.push(authorsPara);

  for (const aff of unique) {
    paragraphs.push(
      leftPara(
        textRuns(`${aff.n} ${aff.line}`, { italics: true, size: AFFIL_SIZE }),
        { after: 40 },
      ),
    );
  }

  paragraphs.push(...buildBodyParagraphs(abstract));
  paragraphs.push(leftPara(textRuns(" "), { after: 240 }));
  return paragraphs;
}

export function buildJournalWordDocument(abstracts) {
  const sorted = sortForJournalExport(abstracts);
  const items = assignJournalLabels(sorted);
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = [
    leftPara(textRuns("ISIR 2026 World Congress — Abstracts", { bold: true, size: 36 }), {
      after: 120,
    }),
    leftPara(
      textRuns(
        `${items.length} abstract${items.length === 1 ? "" : "s"} · ${generatedDate}`,
        { size: 22 },
      ),
      { after: 480 },
    ),
  ];

  items.forEach((item, index) => {
    children.push(
      ...buildAbstractParagraphs(item, { pageBreakBefore: index > 0 }),
    );
  });

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

export async function downloadJournalWord(abstracts, filename) {
  const doc = buildJournalWordDocument(abstracts);
  const buffer = await Packer.toArrayBuffer(doc);
  const blob = new Blob([buffer], { type: DOCX_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `abstracts-journal-${new Date().toISOString().split("T")[0]}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
