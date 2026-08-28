import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { getProgramSession } from "../config/programSessions";

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

export function getProgramSessionLabel(code) {
  const session = getProgramSession(code);
  if (!session) return null;
  return PROGRAM_SESSION_LABELS[session] || session;
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
  const regex = /(Objectives|Methods|Results|Conclusions)\s*:/gi;
  const parts = raw.split(regex);
  if (parts.length <= 1) {
    return [{ heading: null, body: raw }];
  }
  const sections = [];
  let pendingHeading = null;
  for (const part of parts) {
    if (!part) continue;
    if (/^(Objectives|Methods|Results|Conclusions)$/i.test(part.trim())) {
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

function assignJournalLabels(abstracts) {
  let oralNum = 101;
  let posterNum = 101;
  return (abstracts || []).map((abstract) => {
    if (Number(abstract.is_invited_speaker || 0) === 1) {
      const session = getProgramSession(abstract.program_session);
      const label =
        getProgramSessionLabel(abstract.program_session) ||
        session ||
        "Unassigned session";
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
    runs.push(new TextRun({ text: block.name, size: BODY_SIZE }));
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
      runs.push(new TextRun({ text: ", ", size: BODY_SIZE }));
    }
  });
  return leftPara(runs, { after: 120 });
}

function buildBodyParagraphs(abstract) {
  const bodyText = String(
    abstract?.abstract || abstract?.abstract_text || "",
  ).trim();
  if (!bodyText) {
    return [leftPara([new TextRun({ text: "No abstract text.", size: BODY_SIZE })])];
  }
  return splitAbstractSections(bodyText).map((section) => {
    const runs = [];
    if (section.heading) {
      runs.push(
        new TextRun({ text: `${section.heading}: `, bold: true, size: BODY_SIZE }),
      );
    }
    runs.push(new TextRun({ text: section.body, size: BODY_SIZE }));
    return leftPara(runs, { after: 120 });
  });
}

function buildAbstractParagraphs({ abstract, label }) {
  const { authorBlocks, unique } = buildAuthorAffiliationBlocks(abstract);
  const title = String(abstract.title || "").trim() || "Untitled";
  const keywords = String(abstract.keywords || "").trim();
  const paragraphs = [
    leftPara(
      [new TextRun({ text: label, bold: true, size: BODY_SIZE })],
      { after: 160 },
    ),
    leftPara(
      [new TextRun({ text: title, bold: true, size: BODY_SIZE })],
      { after: 160 },
    ),
  ];

  const authorsPara = buildAuthorsParagraph(authorBlocks);
  if (authorsPara) paragraphs.push(authorsPara);

  for (const aff of unique) {
    paragraphs.push(
      leftPara(
        [
          new TextRun({
            text: `${aff.n} ${aff.line}`,
            italics: true,
            size: AFFIL_SIZE,
          }),
        ],
        { after: 40 },
      ),
    );
  }

  if (keywords) {
    paragraphs.push(
      leftPara(
        [
          new TextRun({ text: "Keywords: ", bold: true, size: AFFIL_SIZE }),
          new TextRun({ text: keywords, size: AFFIL_SIZE }),
        ],
        { before: 200, after: 160 },
      ),
    );
  }

  paragraphs.push(...buildBodyParagraphs(abstract));
  paragraphs.push(leftPara([], { after: 360 }));
  return paragraphs;
}

export function buildJournalWordDocument(abstracts) {
  const items = assignJournalLabels(abstracts);
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = [
    leftPara(
      [
        new TextRun({
          text: "ISIR 2026 World Congress — Abstracts",
          bold: true,
          size: 36,
        }),
      ],
      { after: 120 },
    ),
    leftPara(
      [
        new TextRun({
          text: `${items.length} abstract${items.length === 1 ? "" : "s"} · ${generatedDate}`,
          size: 22,
        }),
      ],
      { after: 480 },
    ),
  ];

  for (const item of items) {
    children.push(...buildAbstractParagraphs(item));
  }

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

export async function downloadJournalWord(abstracts, filename) {
  const doc = buildJournalWordDocument(abstracts);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `abstracts-journal-${new Date().toISOString().split("T")[0]}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}
