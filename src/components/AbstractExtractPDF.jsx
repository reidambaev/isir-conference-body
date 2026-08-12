import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Font,
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
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 64,
    fontSize: 11,
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
    fontSize: 22,
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
  tocHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  tocPageHeader: {
    fontFamily: "Helvetica",
    fontSize: 11,
    textDecoration: "underline",
    width: 56,
    textAlign: "right",
  },
  tocCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 16,
    lineHeight: 1.35,
  },
  tocCategoryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    marginBottom: 6,
  },
  tocRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tocTitle: {
    fontFamily: "Helvetica",
    fontSize: 11,
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 16,
    lineHeight: 1.35,
  },
  tocPage: {
    fontFamily: "Helvetica",
    fontSize: 11,
    width: 56,
    textAlign: "right",
  },
  abstractNum: {
    fontFamily: "DocSerif-Bold",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "DocSerif-Bold",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 1.35,
    marginBottom: 6,
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
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.45,
    marginBottom: 8,
  },
  super: {
    fontSize: 7,
    fontFamily: "DocSerif",
    verticalAlign: "super",
  },
  affiliation: {
    fontFamily: "DocSerif-Italic",
    fontSize: 9,
    textAlign: "center",
    lineHeight: 1.4,
    marginBottom: 2,
  },
  keywords: {
    fontFamily: "DocSerif",
    fontSize: 10,
    marginTop: 14,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  keywordsLabel: {
    fontFamily: "DocSerif-BoldItalic",
  },
  body: {
    fontFamily: "DocSerif",
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: "justify",
    marginBottom: 8,
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
    fontSize: 16,
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

function AuthorsLine({ authorBlocks }) {
  if (authorBlocks.length === 0) return null;
  return (
    <Text style={styles.authors}>
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

function buildTocEntries(itemsWithPages) {
  const hasSections = itemsWithPages.some((item) => item.type === "section");

  if (hasSections) {
    const entries = [];
    for (let i = 0; i < itemsWithPages.length; i += 1) {
      const item = itemsWithPages[i];
      if (item.type !== "section") continue;
      let endPage = item.page;
      for (let j = i + 1; j < itemsWithPages.length; j += 1) {
        if (itemsWithPages[j].type === "section") break;
        endPage = itemsWithPages[j].page;
      }
      entries.push({
        label: pdfSafeText(item.category || "Uncategorized"),
        pageLabel:
          endPage && endPage !== item.page
            ? `${item.page} - ${endPage}`
            : String(item.page || ""),
      });
    }
    return entries;
  }

  // Flat extract: group by category for TOC ranges only
  const byCategory = new Map();
  for (const item of itemsWithPages) {
    if (item.type !== "abstract") continue;
    const label =
      pdfSafeText(String(item.abstract?.category || "").trim()) ||
      "Uncategorized";
    const page = Number(item.page) || 0;
    if (!byCategory.has(label)) {
      byCategory.set(label, { label, start: page, end: page });
    } else {
      const row = byCategory.get(label);
      row.start = Math.min(row.start, page);
      row.end = Math.max(row.end, page);
    }
  }

  return Array.from(byCategory.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((row) => ({
      label: row.label,
      pageLabel:
        row.end && row.end !== row.start
          ? `${row.start} - ${row.end}`
          : String(row.start || ""),
    }));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out.length > 0 ? out : [[]];
}

function assignPages(items, tocPageCount) {
  // Page 1 = title, then TOC pages, then content (1 page per content item)
  let page = 1 + tocPageCount + 1;
  return items.map((item) => {
    const withPage = { ...item, page };
    page += 1;
    return withPage;
  });
}

/** Estimate TOC page count from the eventual entry list shape. */
function estimateTocPageCount(items) {
  const entryCount = buildTocEntries(
    items.map((item, i) => ({ ...item, page: i + 1 })),
  ).length;
  return Math.max(1, Math.ceil(Math.max(entryCount, 1) / TOC_ENTRIES_PER_PAGE));
}

function TitlePage({ abstractCount, splitByCategory, generatedDate }) {
  return (
    <Page size="A4" style={styles.coverPage}>
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
    <Page size="A4" style={styles.page}>
      <Text style={styles.tocHeading}>
        Table of Contents{pageCount > 1 ? ` (${pageIndex + 1})` : ""}
      </Text>
      <View style={styles.tocHeaderRow}>
        <Text style={styles.tocPageHeader}>Page</Text>
      </View>
      {entries.map((entry, i) => (
        <View key={`${entry.label}-${i}`} style={styles.tocRow}>
          <Text style={styles.tocTitle}>{entry.label}</Text>
          <Text style={styles.tocPage}>{entry.pageLabel}</Text>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}

function AbstractPage({ abstract, number, showCategory = true }) {
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
  const isYi = Number(abstract?.young_investigator) === 1;
  const afterTitleBits = [
    showCategory && category,
    scoreLabel,
    isYi,
  ].filter(Boolean).length;
  const title = pdfSafeText(
    String(abstract.title || "").trim() || "Untitled",
  );

  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.abstractNum}>{number}</Text>
      <Text style={styles.title}>{title}</Text>
      {showCategory && category ? (
        <Text
          style={[
            styles.category,
            afterTitleBits === 1 ? { marginBottom: 12 } : null,
          ]}
        >
          {category}
        </Text>
      ) : null}
      {scoreLabel ? (
        <Text
          style={[
            styles.score,
            isYi ? { marginBottom: 4 } : null,
          ]}
        >
          Score {scoreLabel}
        </Text>
      ) : null}
      {isYi ? (
        <Text style={styles.yiTag}>Young Investigator Competition</Text>
      ) : null}

      <AuthorsLine authorBlocks={authorBlocks} />

      {unique.map((aff) => (
        <Text key={aff.n} style={styles.affiliation}>
          {`${aff.n} ${aff.line}`}
        </Text>
      ))}

      {keywords ? (
        <Text style={styles.keywords}>
          <Text style={styles.keywordsLabel}>Keywords: </Text>
          {keywords}
        </Text>
      ) : null}

      {sections.length === 0 || !String(bodyText).trim() ? (
        <Text style={styles.body}>No abstract text.</Text>
      ) : (
        sections.map((section, i) => (
          <Text key={`${section.heading || "body"}-${i}`} style={styles.body}>
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
  return (
    <Page size="A4" style={styles.sectionPage}>
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
  const tocPageCount = estimateTocPageCount(items);
  const itemsWithPages = assignPages(items, tocPageCount);
  const tocEntries = buildTocEntries(itemsWithPages);
  const tocChunks = chunk(tocEntries, TOC_ENTRIES_PER_PAGE);

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

  itemsWithPages.forEach((item, index) => {
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
