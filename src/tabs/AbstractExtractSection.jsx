import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import AbstractExtractPDF from "../components/AbstractExtractPDF";

function avgTotalOf(row) {
  const v = row?.review_summary?.avg_total;
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : null;
}

function yiSortKey(abstract) {
  if (Number(abstract?.young_investigator) === 1) return 0;
  if (Number(abstract?.possible_young_investigator) === 1) return 1;
  return 2;
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

function formatLabel(row) {
  const assigned = normalizeFormat(row?.assigned_format);
  if (assigned) return assigned === "oral" ? "Oral" : "Poster";
  const pref = String(row?.presentation_preference || "").toLowerCase();
  if (pref === "oral") return "Oral (pref)";
  if (pref === "poster") return "Poster (pref)";
  if (pref === "either") return "Either";
  return "—";
}

function compareRows(key, a, b) {
  const reviewCount = (row) => Number(row.review_summary?.review_count || 0);
  switch (key) {
    case "avg_desc":
    case "avg_asc": {
      const aAvg = avgTotalOf(a);
      const bAvg = avgTotalOf(b);
      if (aAvg == null && bAvg == null) {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      if (aAvg == null) return 1;
      if (bAvg == null) return -1;
      const diff = key === "avg_desc" ? bAvg - aAvg : aAvg - bAvg;
      if (diff !== 0) return diff;
      return reviewCount(b) - reviewCount(a);
    }
    case "title_asc":
      return String(a.title || "").localeCompare(String(b.title || ""));
    case "title_desc":
      return String(b.title || "").localeCompare(String(a.title || ""));
    case "name_asc":
      return String(a.presenter_name || "").localeCompare(
        String(b.presenter_name || ""),
      );
    case "name_desc":
      return String(b.presenter_name || "").localeCompare(
        String(a.presenter_name || ""),
      );
    case "category":
      return String(a.category || "").localeCompare(String(b.category || ""));
    case "format":
      return formatLabel(a).localeCompare(formatLabel(b));
    case "yi_first": {
      const diff = yiSortKey(a) - yiSortKey(b);
      if (diff !== 0) return diff;
      const aAvg = avgTotalOf(a) ?? -1;
      const bAvg = avgTotalOf(b) ?? -1;
      return bAvg - aAvg;
    }
    case "date_desc":
      return (b.submission_date || 0) - (a.submission_date || 0);
    case "date_asc":
      return (a.submission_date || 0) - (b.submission_date || 0);
    default:
      return 0;
  }
}

const SORT_PILLS = [
  { value: "avg_desc", label: "Rank" },
  { value: "name_asc", label: "Name" },
  { value: "title_asc", label: "Title" },
  { value: "category", label: "Category" },
  { value: "yi_first", label: "YI" },
];

/**
 * Admin: pick abstracts (with sort + top-N select) and extract to PDF/CSV.
 */
export default function AbstractExtractSection({
  abstracts,
  reviewerAbstractScores,
  getAbstractTypeLabel,
  onGoToSubmissions,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  /** all | Clinical Studies | Basic Studies | unspecified */
  const [typeFilter, setTypeFilter] = useState("all");
  const [yiFilter, setYiFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("both");
  const [sortBy, setSortBy] = useState("avg_desc");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [topNInput, setTopNInput] = useState("50");
  const [message, setMessage] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [splitByCategory, setSplitByCategory] = useState(false);

  const typeLabelOf = (abstract) => {
    if (typeof getAbstractTypeLabel === "function") {
      return getAbstractTypeLabel(abstract);
    }
    const raw = String(
      abstract?.abstract_submission_type ||
        abstract?.abstractSubmissionType ||
        "",
    ).trim();
    if (!raw) return "Not specified";
    if (raw === "Clinical Research") return "Clinical Studies";
    if (raw === "Basic Research") return "Basic Studies";
    return raw;
  };

  const scoreById = useMemo(() => {
    const map = new Map();
    for (const row of reviewerAbstractScores || []) {
      if (row?.id) map.set(row.id, row);
    }
    return map;
  }, [reviewerAbstractScores]);

  const pool = useMemo(() => {
    return (abstracts || [])
      .filter(
        (a) =>
          Number(a.is_invited_speaker || 0) !== 1 &&
          String(a.status || "").toLowerCase() === "accepted",
      )
      .map((abstract) => {
        const scoreRow = scoreById.get(abstract.id);
        return {
          ...abstract,
          review_summary: scoreRow?.review_summary || null,
        };
      });
  }, [abstracts, scoreById]);

  const categories = useMemo(() => {
    const set = new Set(pool.map((a) => a.category).filter(Boolean));
    return Array.from(set).sort();
  }, [pool]);

  const filteredRows = useMemo(() => {
    let result = [...pool];
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((a) => {
        const title = String(a.title || "").toLowerCase();
        const id = String(a.id || "").toLowerCase();
        const presenter = String(a.presenter_name || "").toLowerCase();
        const category = String(a.category || "").toLowerCase();
        const keywords = String(a.keywords || "").toLowerCase();
        const body = String(a.abstract || a.abstract_text || "").toLowerCase();
        return (
          title.includes(query) ||
          id.includes(query) ||
          presenter.includes(query) ||
          category.includes(query) ||
          keywords.includes(query) ||
          body.includes(query)
        );
      });
    }
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((a) => {
        const label = typeLabelOf(a);
        if (typeFilter === "unspecified") {
          return label === "Not specified";
        }
        return label === typeFilter;
      });
    }
    if (yiFilter === "yes") {
      result = result.filter((a) => Number(a.young_investigator) === 1);
    } else if (yiFilter === "possible") {
      result = result.filter(
        (a) => Number(a.possible_young_investigator) === 1,
      );
    } else if (yiFilter === "no") {
      result = result.filter(
        (a) =>
          Number(a.young_investigator) !== 1 &&
          Number(a.possible_young_investigator) !== 1,
      );
    }
    if (formatFilter === "oral" || formatFilter === "poster") {
      result = result.filter((a) => effectiveFormat(a) === formatFilter);
    }

    result.sort((a, b) => {
      const primary = compareRows(sortBy, a, b);
      if (primary !== 0) return primary;
      if (sortBy === "avg_desc" || sortBy === "avg_asc") {
        return compareRows("name_asc", a, b);
      }
      return compareRows("avg_desc", a, b);
    });

    return result;
  }, [
    pool,
    search,
    categoryFilter,
    typeFilter,
    yiFilter,
    formatFilter,
    sortBy,
    getAbstractTypeLabel,
  ]);

  const visibleIds = filteredRows.map((r) => r.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const selectedList = Array.from(selectedIds);
  const selectedRows = useMemo(() => {
    const idSet = selectedIds;
    return filteredRows.filter((r) => idSet.has(r.id));
  }, [filteredRows, selectedIds]);

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectTopN = () => {
    const n = Math.floor(Number(topNInput));
    if (!Number.isFinite(n) || n < 1) {
      setMessage({
        type: "error",
        text: "Enter a positive number for top-N select.",
      });
      return;
    }
    const take = Math.min(n, filteredRows.length);
    setSelectedIds(new Set(filteredRows.slice(0, take).map((r) => r.id)));
    setMessage({
      type: "ok",
      text: `Selected top ${take} of ${filteredRows.length} (current sort).`,
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setMessage(null);
  };

  const exportSelectedPdf = async () => {
    if (selectedRows.length === 0) {
      setMessage({ type: "error", text: "Select at least one abstract." });
      return;
    }
    setPdfBusy(true);
    setMessage(null);
    try {
      const doc = (
        <AbstractExtractPDF
          abstracts={selectedRows}
          splitByCategory={splitByCategory}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `abstracts-extract-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({
        type: "ok",
        text: `Exported ${selectedRows.length} abstract${selectedRows.length === 1 ? "" : "s"} to PDF${splitByCategory ? ", split by category" : ""}.`,
      });
    } catch (err) {
      console.error("Abstract extract PDF failed:", err);
      setMessage({
        type: "error",
        text: err.message || "Could not generate PDF.",
      });
    } finally {
      setPdfBusy(false);
    }
  };

  const exportSelectedCsv = () => {
    const rowsToExport =
      selectedRows.length > 0 ? selectedRows : filteredRows;
    if (rowsToExport.length === 0) {
      setMessage({ type: "error", text: "Nothing to export." });
      return;
    }
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const num = (v) =>
      v != null && !Number.isNaN(Number(v)) ? Number(v).toFixed(2) : "";
    const headers = [
      "Rank",
      "ID",
      "Title",
      "Category",
      "Abstract Type",
      "Presenter",
      "Presenter Email",
      "Corresponding Author",
      "Corresponding Email",
      "Format",
      "Preference",
      "Assigned Format",
      "Young Investigator",
      "Possibly YI",
      "Avg Total",
      "# of Reviews",
      "Avg Originality",
      "Avg Clarity",
      "Avg Study Design",
      "Avg Data Analysis",
      "Avg Significance",
      "Status",
    ];
    const csvRows = rowsToExport.map((a, index) => {
      const summary = a.review_summary || {};
      return [
        index + 1,
        a.id,
        esc(a.title),
        esc(a.category),
        esc(typeLabelOf(a)),
        esc(a.presenter_name),
        esc(a.presenter_email),
        esc(a.corresponding_name),
        esc(a.corresponding_email),
        esc(formatLabel(a)),
        esc(a.presentation_preference),
        esc(a.assigned_format || ""),
        Number(a.young_investigator) === 1 ? "Yes" : "No",
        Number(a.possible_young_investigator) === 1 ? "Yes" : "No",
        num(summary.avg_total),
        Number(summary.review_count || 0),
        num(summary.avg_originality),
        num(summary.avg_clarity),
        num(summary.avg_study_design),
        num(summary.avg_data_analysis),
        num(summary.avg_significance),
        esc(a.status),
      ];
    });
    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `abstracts-extract-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({
      type: "ok",
      text: `Exported ${rowsToExport.length} abstract${rowsToExport.length === 1 ? "" : "s"} to CSV${selectedRows.length > 0 ? " (selection)" : " (all matching filters)"}.`,
    });
  };

  const pillClass = (active) =>
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
      active
        ? "bg-slate-800 text-white"
        : "bg-white text-slate-600 hover:bg-white hover:text-slate-900 border border-gray-200"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Extract abstracts</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Accepted abstracts only. Filter oral / poster / clinical / basic,
            pick a sort, select the top N, and export PDF or CSV (category,
            names, scores).
          </p>
        </div>
        {onGoToSubmissions ? (
          <button
            type="button"
            onClick={onGoToSubmissions}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
          >
            Back to submissions
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            In pool
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pool.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Matching filters
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {filteredRows.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Selected
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {selectedList.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            With scores
          </p>
          <p className="text-2xl font-bold text-teal-700 mt-1">
            {
              filteredRows.filter(
                (a) => Number(a.review_summary?.review_count || 0) > 0,
              ).length
            }
          </p>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                Format
              </span>
              <button
                type="button"
                onClick={() => setFormatFilter("oral")}
                className={pillClass(formatFilter === "oral")}
              >
                Oral
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("poster")}
                className={pillClass(formatFilter === "poster")}
              >
                Poster
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("both")}
                className={pillClass(formatFilter === "both")}
              >
                Both
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                Type
              </span>
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={pillClass(typeFilter === "all")}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("Clinical Studies")}
                className={pillClass(typeFilter === "Clinical Studies")}
              >
                Clinical
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("Basic Studies")}
                className={pillClass(typeFilter === "Basic Studies")}
              >
                Basic
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
                Sort
              </span>
              {SORT_PILLS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={pillClass(sortBy === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, ID, presenter, category, abstract text…"
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={yiFilter}
              onChange={(e) => setYiFilter(e.target.value)}
              className="min-w-[140px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">YI: all</option>
              <option value="yes">YI only</option>
              <option value="possible">Possibly YI</option>
              <option value="no">Not YI</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">
              {selectedList.length} selected
              {filteredRows.length !== pool.length
                ? ` · ${filteredRows.length} shown`
                : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="extract-top-n"
                className="text-xs font-medium text-gray-600"
              >
                Top
              </label>
              <input
                id="extract-top-n"
                type="number"
                min={1}
                max={9999}
                value={topNInput}
                onChange={(e) => setTopNInput(e.target.value)}
                className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={selectTopN}
                disabled={filteredRows.length === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Select top N
              </button>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedList.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Clear selection
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSplitByCategory((on) => !on)}
              className={pillClass(splitByCategory)}
            >
              Split by category
            </button>
            <button
              type="button"
              onClick={exportSelectedCsv}
              disabled={filteredRows.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {selectedList.length > 0
                ? `Extract CSV (${selectedList.length})`
                : "Extract CSV"}
            </button>
            <button
              type="button"
              onClick={exportSelectedPdf}
              disabled={selectedList.length === 0 || pdfBusy}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {pdfBusy ? "Building PDF…" : "Extract PDF"}
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 text-sm">
            No abstracts match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            someVisibleSelected && !allVisibleSelected;
                        }
                      }}
                      onChange={toggleSelectAllVisible}
                      aria-label="Select all visible"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abstract
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presenter
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YI
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviews
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRows.map((row, index) => {
                  const avg = avgTotalOf(row);
                  const reviews = Number(row.review_summary?.review_count || 0);
                  const checked = selectedIds.has(row.id);
                  const fmt = formatLabel(row);
                  return (
                    <tr
                      key={row.id}
                      className={checked ? "bg-amber-50/60" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select ${row.title || row.id}`}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-gray-500 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 max-w-md">
                        <p className="font-medium text-gray-900 line-clamp-2">
                          {row.title || "Untitled"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {row.id}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {row.presenter_name || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 max-w-[10rem]">
                        <span className="line-clamp-2">
                          {row.category || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {(() => {
                          const label = typeLabelOf(row);
                          if (label === "Clinical Studies") return "Clinical";
                          if (label === "Basic Studies") return "Basic";
                          return "—";
                        })()}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                          {fmt}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {Number(row.young_investigator) === 1 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white">
                            YI
                          </span>
                        ) : Number(row.possible_young_investigator) === 1 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 ring-1 ring-amber-300">
                            Possible
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {avg != null ? avg.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                        {reviews > 0 ? reviews : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
