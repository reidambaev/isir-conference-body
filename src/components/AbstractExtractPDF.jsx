import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Font,
  Link,
} from "@react-pdf/renderer";
import logo from "../assets/logo.png";
import dejavuSerif from "dejavu-fonts-ttf/ttf/DejaVuSerif.ttf";
import dejavuSerifBold from "dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf";
import dejavuSerifItalic from "dejavu-fonts-ttf/ttf/DejaVuSerif-Italic.ttf";
import dejavuSerifBoldItalic from "dejavu-fonts-ttf/ttf/DejaVuSerif-BoldItalic.ttf";

Font.register({ family: "DocSerif", src: dejavuSerif });
Font.register({ family: "DocSerif-Bold", src: dejavuSerifBold });
Font.register({ family: "DocSerif-Italic", src: dejavuSerifItalic });
Font.register({ family: "DocSerif-BoldItalic", src: dejavuSerifBoldItalic });

const TOC_ENTRIES_PER_PAGE = 30;

/** Light cleanup only — Greek and other Unicode stay intact (DocSerif supports them). */
function pdfSafeText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/ {2,}/g, " ");
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "DocSerif",
    color: "#000",
  },
  pageFooter: {
    position: "absolute",
    bottom: 22,
    left: 64,
    right: 64,
    alignItems: "center",
  },
  pageNotice: {
    fontFamily: "DocSerif-Italic",
    fontSize: 8,
    textAlign: "center",
    marginBottom: 3,
  },
  pageNumber: {
    fontFamily: "DocSerif",
    fontSize: 9,
    textAlign: "center",
  },
  coverPage: {
    paddingTop: 72,
    paddingBottom: 64,
    paddingHorizontal: 64,
    fontFamily: "DocSerif",
    color: "#000",
    alignItems: "center",
  },
  coverLogo: {
    width: 96,
    height: 96,
    marginBottom: 28,
    objectFit: "contain",
  },
  coverCongress: {
    fontFamily: "DocSerif",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  coverRule: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    width: 72,
    marginBottom: 18,
  },
  coverTitle: {
    fontFamily: "DocSerif-Bold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  coverSubtitle: {
    fontFamily: "DocSerif-Italic",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 28,
  },
  coverMeta: {
    fontFamily: "DocSerif",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.5,
  },
  tocHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 28,
  },
  tocRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tocTitle: {
    fontFamily: "Helvetica",
    fontSize: 11,
    flexGrow: 1,
    flexShrink: 1,
    lineHeight: 1.35,
    color: "#000",
  },
  tocLink: {
    textDecoration: "none",
    color: "#000",
  },
  abstractNum: {
    fontFamily: "DocSerif-Bold",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "DocSerif-Bold",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.3,
    marginBottom: 4,
  },
  category: {
    fontFamily: "DocSerif-Italic",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 4,
  },
  score: {
    fontFamily: "DocSerif-Bold",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 12,
  },
  yiTag: {
    fontFamily: "DocSerif-Bold",
    fontSize: 9,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  authors: {
    fontFamily: "DocSerif",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 1.35,
    marginBottom: 6,
  },
  super: {
    fontSize: 7,
    fontFamily: "DocSerif",
    verticalAlign: "super",
  },
  affiliation: {
    fontFamily: "DocSerif-Italic",
    fontSize: 8,
    textAlign: "center",
    lineHeight: 1.3,
    marginBottom: 1,
  },
  keywords: {
    fontFamily: "DocSerif",
    fontSize: 9,
    marginTop: 10,
    marginBottom: 8,
    lineHeight: 1.35,
  },
  keywordsLabel: {
    fontFamily: "DocSerif-BoldItalic",
  },
  body: {
    fontFamily: "DocSerif",
    fontSize: 10,
    lineHeight: 1.4,
    textAlign: "justify",
    marginBottom: 6,
  },
  bodyHead: {
    fontFamily: "DocSerif-Bold",
  },
  sectionPage: {
    paddingTop: 64,
    paddingBottom: 64,
    paddingHorizontal: 64,
    justifyContent: "center",
    fontFamily: "DocSerif",
    color: "#000",
  },
  sectionRule: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    width: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "DocSerif-Bold",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 1.35,
  },
});

function PageFooter() {
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageNotice}>
        Internal use only — do not share
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function authorName(author) {
  if (!author) return "";
  return pdfSafeText(
    `${author.first_name || author.firstName || ""}${
      author.middle_name || author.middleName
        ? ` ${author.middle_name || author.middleName}`
        : ""
    } ${author.last_name || author.lastName || ""}`
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function affiliationLine(aff) {
  return pdfSafeText(
    [aff?.department, aff?.institution, aff?.city, aff?.country]
      .filter(Boolean)
      .join(", "),
  );
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

function AuthorsLine({ authorBlocks, style }) {
  if (authorBlocks.length === 0) return null;
  return (
    <Text style={[styles.authors, style]}>
      {authorBlocks.map((block, i) => (
        <Text key={`${block.name}-${i}`}>
          {block.name}
          {block.nums.length > 0 ? (
            <Text style={styles.super}>{block.nums.join(",")}</Text>
          ) : null}
          {i < authorBlocks.length - 1 ? ", " : ""}
        </Text>
      ))}
    </Text>
  );
}

function groupByCategory(abstracts) {
  const groups = [];
  const index = new Map();
  for (const abstract of abstracts || []) {
    const category = String(abstract?.category || "").trim() || "Uncategorized";
    if (!index.has(category)) {
      index.set(category, groups.length);
      groups.push({ category, abstracts: [] });
    }
    groups[index.get(category)].abstracts.push(abstract);
  }
  groups.sort((a, b) => a.category.localeCompare(b.category));
  return groups;
}

function buildNumberedList(abstracts, splitByCategory) {
  if (!splitByCategory) {
    return (abstracts || []).map((abstract, i) => ({
      type: "abstract",
      abstract,
      number: i + 1,
    }));
  }
  const items = [];
  let n = 0;
  for (const group of groupByCategory(abstracts)) {
    items.push({ type: "section", category: group.category });
    for (const abstract of group.abstracts) {
      n += 1;
      items.push({ type: "abstract", abstract, number: n });
    }
  }
  return items;
}

function categoryDestId(category) {
  const slug = String(category || "uncategorized")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `section-${slug || "uncategorized"}`;
}

function buildTocEntries(items) {
  return (items || [])
    .filter((item) => item.type === "section")
    .map((item) => ({
      label: pdfSafeText(item.category || "Uncategorized"),
      destId: categoryDestId(item.category),
    }));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out.length > 0 ? out : [[]];
}

/**
 * Heuristic load for Letter fit. Higher = denser page; we tighten type to keep
 * one abstract on one page so layout stays stable (no spill pages).
 */
function abstractFitLevel(abstract) {
  const body = String(abstract?.abstract || abstract?.abstract_text || "");
  const words = body.split(/\s+/).filter(Boolean).length;
  const authors = (abstract?.authors || []).length;
  const affs = (abstract?.affiliations || []).length;
  const titleLen = String(abstract?.title || "").length;
  const load =
    words + authors * 14 + affs * 12 + Math.ceil(titleLen / 6);
  if (load > 480) return 2;
  if (load > 340) return 1;
  return 0;
}

function abstractFitStyles(level) {
  if (level >= 2) {
    return {
      page: {
        paddingTop: 36,
        paddingBottom: 48,
        paddingHorizontal: 44,
      },
      abstractNum: { fontSize: 9, marginBottom: 4 },
      title: { fontSize: 9, lineHeight: 1.2, marginBottom: 2 },
      category: { fontSize: 8, marginBottom: 2 },
      score: { fontSize: 8, marginBottom: 6 },
      yiTag: { fontSize: 8, marginBottom: 6 },
      authors: { fontSize: 8, lineHeight: 1.25, marginBottom: 3 },
      affiliation: { fontSize: 7, lineHeight: 1.2 },
      keywords: { fontSize: 8, marginTop: 6, marginBottom: 4, lineHeight: 1.25 },
      body: { fontSize: 8, lineHeight: 1.28, marginBottom: 3 },
    };
  }
  if (level >= 1) {
    return {
      page: {
        paddingTop: 40,
        paddingBottom: 52,
        paddingHorizontal: 48,
      },
      abstractNum: { fontSize: 9, marginBottom: 6 },
      title: { fontSize: 10, lineHeight: 1.25, marginBottom: 3 },
      category: { fontSize: 9, marginBottom: 3 },
      score: { fontSize: 9, marginBottom: 8 },
      yiTag: { fontSize: 8, marginBottom: 8 },
      authors: { fontSize: 9, lineHeight: 1.3, marginBottom: 4 },
      affiliation: { fontSize: 7.5, lineHeight: 1.25 },
      keywords: { fontSize: 8, marginTop: 8, marginBottom: 6, lineHeight: 1.3 },
      body: { fontSize: 9, lineHeight: 1.32, marginBottom: 4 },
    };
  }
  return {};
}

function TitlePage({ abstractCount, splitByCategory, generatedDate }) {
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <Image src={logo} style={styles.coverLogo} />
      <Text style={styles.coverCongress}>
        International Society for Immunology of Reproduction
      </Text>
      <View style={styles.coverRule} />
      <Text style={styles.coverTitle}>ISIR 2026 World Congress</Text>
      <Text style={styles.coverSubtitle}>Selected Abstracts</Text>
      <Text style={styles.coverMeta}>
        {abstractCount} {abstractCount === 1 ? "abstract" : "abstracts"}
        {splitByCategory ? " - arranged by category" : ""}
      </Text>
      {generatedDate ? (
        <Text style={[styles.coverMeta, { marginTop: 8 }]}>{generatedDate}</Text>
      ) : null}
      <PageFooter />
    </Page>
  );
}

function TocPage({ entries, pageIndex, pageCount }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.tocHeading}>
        Table of Contents{pageCount > 1 ? ` (${pageIndex + 1})` : ""}
      </Text>
      {entries.map((entry, i) => (
        <Link
          key={`${entry.destId}-${i}`}
          src={`#${entry.destId}`}
          style={styles.tocLink}
        >
          <View style={styles.tocRow}>
            <Text style={styles.tocTitle}>{entry.label}</Text>
          </View>
        </Link>
      ))}
      <PageFooter />
    </Page>
  );
}

function AbstractPage({ abstract, number, showCategory = true }) {
  const fit = abstractFitStyles(abstractFitLevel(abstract));
  const { authorBlocks, unique } = buildAuthorAffiliationBlocks(abstract);
  const category = pdfSafeText(String(abstract?.category || "").trim());
  const keywords = pdfSafeText(String(abstract?.keywords || "").trim());
  const bodyText = pdfSafeText(
    abstract?.abstract || abstract?.abstract_text || "",
  );
  const sections = splitAbstractSections(bodyText);
  const avg = abstract?.review_summary?.avg_total;
  const scoreLabel =
    avg != null && !Number.isNaN(Number(avg))
      ? Number(avg).toFixed(2)
      : null;
  const reviewCount = Number(abstract?.review_summary?.review_count || 0);
  const isYi = Number(abstract?.young_investigator) === 1;
  const afterTitleBits = [
    showCategory && category,
    scoreLabel || reviewCount > 0,
    isYi,
  ].filter(Boolean).length;
  const title = pdfSafeText(
    String(abstract.title || "").trim() || "Untitled",
  );

  return (
    <Page size="LETTER" style={[styles.page, fit.page]}>
      <Text style={[styles.abstractNum, fit.abstractNum]}>
        {`Abstract #${number}`}
      </Text>
      <Text style={[styles.title, fit.title]}>{title}</Text>
      {showCategory && category ? (
        <Text
          style={[
            styles.category,
            fit.category,
            afterTitleBits === 1 ? { marginBottom: 12 } : null,
          ]}
        >
          {category}
        </Text>
      ) : null}
      {scoreLabel || reviewCount > 0 ? (
        <Text
          style={[
            styles.score,
            fit.score,
            isYi ? { marginBottom: 4 } : null,
          ]}
        >
          {scoreLabel ? `Score ${scoreLabel}` : "Score —"}
          {reviewCount > 0
            ? ` · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
            : ""}
        </Text>
      ) : null}
      {isYi ? (
        <Text style={[styles.yiTag, fit.yiTag]}>
          Young Investigator Competition
        </Text>
      ) : null}

      <AuthorsLine authorBlocks={authorBlocks} style={fit.authors} />

      {unique.map((aff) => (
        <Text key={aff.n} style={[styles.affiliation, fit.affiliation]}>
          {`${aff.n} ${aff.line}`}
        </Text>
      ))}

      {keywords ? (
        <Text style={[styles.keywords, fit.keywords]}>
          <Text style={styles.keywordsLabel}>Keywords: </Text>
          {keywords}
        </Text>
      ) : null}

      {sections.length === 0 || !String(bodyText).trim() ? (
        <Text style={[styles.body, fit.body]}>No abstract text.</Text>
      ) : (
        sections.map((section, i) => (
          <Text
            key={`${section.heading || "body"}-${i}`}
            style={[styles.body, fit.body]}
          >
            {section.heading ? (
              <Text style={styles.bodyHead}>
                {pdfSafeText(section.heading)}:{" "}
              </Text>
            ) : null}
            {pdfSafeText(section.body)}
          </Text>
        ))
      )}
      <PageFooter />
    </Page>
  );
}

function CategorySectionPage({ category }) {
  const destId = categoryDestId(category);
  return (
    <Page size="LETTER" style={styles.sectionPage}>
      {/* Anchor so TOC links land on this section page */}
      <Text id={destId} style={{ fontSize: 1, color: "#fff", height: 1 }}>
        {" "}
      </Text>
      <View style={styles.sectionRule} />
      <Text style={styles.sectionTitle}>
        {pdfSafeText(category || "Uncategorized")}
      </Text>
      <View style={[styles.sectionRule, { marginTop: 16, marginBottom: 0 }]} />
      <PageFooter />
    </Page>
  );
}

export default function AbstractExtractPDF({
  abstracts,
  splitByCategory = false,
}) {
  const list = abstracts || [];
  const items = buildNumberedList(list, splitByCategory);
  const tocEntries = splitByCategory ? buildTocEntries(items) : [];
  const tocChunks = splitByCategory
    ? chunk(tocEntries, TOC_ENTRIES_PER_PAGE)
    : [];

  const abstractCount = items.filter((i) => i.type === "abstract").length;
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pages = [
    <TitlePage
      key="title"
      abstractCount={abstractCount}
      splitByCategory={splitByCategory}
      generatedDate={generatedDate}
    />,
  ];

  tocChunks.forEach((entries, index) => {
    pages.push(
      <TocPage
        key={`toc-${index}`}
        entries={entries}
        pageIndex={index}
        pageCount={tocChunks.length}
      />,
    );
  });

  items.forEach((item, index) => {
    if (item.type === "section") {
      pages.push(
        <CategorySectionPage
          key={`section-${item.category}-${index}`}
          category={item.category}
        />,
      );
      return;
    }
    pages.push(
      <AbstractPage
        key={item.abstract.id || `abs-${item.number}`}
        abstract={item.abstract}
        number={item.number}
        showCategory={!splitByCategory}
      />,
    );
  });

  return <Document>{pages}</Document>;
}
