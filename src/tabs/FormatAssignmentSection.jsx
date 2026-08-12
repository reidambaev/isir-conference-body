import { useMemo, useState } from "react";

function normalizeFormat(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (value === "oral" || value === "poster") return value;
  return null;
}

function formatBadge(format) {
  if (format === "oral") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800">
        Oral
      </span>
    );
  }
  if (format === "poster") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">
        Poster
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
      Unassigned
    </span>
  );
}

function preferenceBadge(pref) {
  const value = String(pref || "").toLowerCase();
  const label =
    value === "oral" ? "Oral" : value === "poster" ? "Poster" : value === "either" ? "Either" : pref || "—";
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
      {label}
    </span>
  );
}

function avgTotalOf(row) {
  const v = row?.review_summary?.avg_total;
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : null;
}

/**
 * Admin tab: scoreboard + bulk oral/poster assignment for accepted abstracts.
 */
export default function FormatAssignmentSection({
  abstracts,
  setAbstracts,
  reviewerAbstractScores,
  adminToken,
  isLocalDemo,
  formatAbstractText,
  formatDate,
  getAbstractTypeLabel,
  onGoToReviewScores,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  /** all | Clinical Studies | Basic Studies | unspecified */
  const [typeFilter, setTypeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("unassigned");
  const [preferenceFilter, setPreferenceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("avg_desc");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [viewingId, setViewingId] = useState(null);
  const [expandedScoreId, setExpandedScoreId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

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
          String(a.status || "").toLowerCase() === "accepted" &&
          Number(a.is_invited_speaker || 0) !== 1,
      )
      .map((abstract) => {
        const scoreRow = scoreById.get(abstract.id);
        return {
          ...abstract,
          assigned_format: normalizeFormat(abstract.assigned_format),
          review_summary: scoreRow?.review_summary || null,
          reviewer_reviews: scoreRow?.reviewer_reviews || [],
        };
      });
  }, [abstracts, scoreById]);

  const categories = useMemo(() => {
    const set = new Set(pool.map((a) => a.category).filter(Boolean));
    return Array.from(set).sort();
  }, [pool]);

  const stats = useMemo(() => {
    let oral = 0;
    let poster = 0;
    let unassigned = 0;
    let withScores = 0;
    for (const row of pool) {
      const fmt = normalizeFormat(row.assigned_format);
      if (fmt === "oral") oral += 1;
      else if (fmt === "poster") poster += 1;
      else unassigned += 1;
      if (Number(row.review_summary?.review_count || 0) > 0) withScores += 1;
    }
    return {
      total: pool.length,
      oral,
      poster,
      unassigned,
      withScores,
    };
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
        return (
          title.includes(query) ||
          id.includes(query) ||
          presenter.includes(query) ||
          category.includes(query)
        );
      });
    }
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((a) => {
        const label = getAbstractTypeLabel
          ? getAbstractTypeLabel(a)
          : String(a.abstract_submission_type || "").trim() || "Not specified";
        if (typeFilter === "unspecified") {
          return label === "Not specified" || !label;
        }
        return label === typeFilter;
      });
    }
    if (preferenceFilter !== "all") {
      result = result.filter(
        (a) =>
          String(a.presentation_preference || "").toLowerCase() ===
          preferenceFilter,
      );
    }
    if (formatFilter === "unassigned") {
      result = result.filter((a) => !normalizeFormat(a.assigned_format));
    } else if (formatFilter === "oral" || formatFilter === "poster") {
      result = result.filter(
        (a) => normalizeFormat(a.assigned_format) === formatFilter,
      );
    }

    const reviewCount = (a) => Number(a.review_summary?.review_count || 0);

    result.sort((a, b) => {
      if (sortBy === "avg_asc" || sortBy === "avg_desc") {
        const aAvg = avgTotalOf(a);
        const bAvg = avgTotalOf(b);
        if (aAvg == null && bAvg == null) {
          return String(a.title || "").localeCompare(String(b.title || ""));
        }
        if (aAvg == null) return 1;
        if (bAvg == null) return -1;
        const diff = sortBy === "avg_desc" ? bAvg - aAvg : aAvg - bAvg;
        if (diff !== 0) return diff;
        return reviewCount(b) - reviewCount(a);
      }
      if (sortBy === "title_asc") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      if (sortBy === "pref_asc") {
        return String(a.presentation_preference || "").localeCompare(
          String(b.presentation_preference || ""),
        );
      }
      return 0;
    });

    return result;
  }, [
    pool,
    search,
    categoryFilter,
    typeFilter,
    preferenceFilter,
    formatFilter,
    sortBy,
    getAbstractTypeLabel,
  ]);

  const viewingAbstract = useMemo(() => {
    if (!viewingId) return null;
    return pool.find((a) => a.id === viewingId) || null;
  }, [pool, viewingId]);

  const visibleIds = filteredRows.map((r) => r.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

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

  const applyLocalFormat = (ids, assignedFormat) => {
    const formatAssignedAt = assignedFormat ? Date.now() : null;
    const idSet = new Set(ids);
    setAbstracts((prev) =>
      prev.map((a) =>
        idSet.has(a.id)
          ? {
              ...a,
              assigned_format: assignedFormat,
              format_assigned_at: formatAssignedAt,
            }
          : a,
      ),
    );
  };

  const assignFormat = async (ids, assignedFormat) => {
    if (!ids.length) return;
    if (!isLocalDemo && !adminToken) {
      setMessage({ type: "error", text: "Admin access token is missing." });
      return;
    }

    const label =
      assignedFormat === "oral"
        ? "oral"
        : assignedFormat === "poster"
          ? "poster"
          : "unassigned";
    const confirmed = window.confirm(
      assignedFormat
        ? `Assign ${ids.length} abstract${ids.length === 1 ? "" : "s"} as ${label}?`
        : `Clear format assignment for ${ids.length} abstract${ids.length === 1 ? "" : "s"}?`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      if (isLocalDemo) {
        applyLocalFormat(ids, assignedFormat);
        setSelectedIds(new Set());
        setMessage({
          type: "success",
          text: `Updated ${ids.length} abstract${ids.length === 1 ? "" : "s"} to ${label} (demo).`,
        });
        return;
      }

      const response = await fetch("/api/admin/abstracts/assigned-format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          ids,
          assigned_format: assignedFormat,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update assigned format");
      }

      applyLocalFormat(ids, assignedFormat);
      setSelectedIds(new Set());
      const updated = Number(data.updated ?? ids.length);
      const skipped = Number(data.skipped || 0);
      setMessage({
        type: updated > 0 ? "success" : "error",
        text:
          skipped > 0
            ? `Assigned ${updated} as ${label}; skipped ${skipped}.`
            : `Assigned ${updated} abstract${updated === 1 ? "" : "s"} as ${label}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update assigned format.",
      });
    } finally {
      setBusy(false);
    }
  };

  const selectedList = Array.from(selectedIds);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Oral / Poster assignment
          </h2>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            After peer review, assign accepted abstracts as oral presentations
            or posters. Author preference is shown for reference and is never
            overwritten. Sort by score, multi-select rows, then bulk-assign —
            or open any abstract to read the full text before deciding.
          </p>
        </div>
        {onGoToReviewScores ? (
          <button
            type="button"
            onClick={onGoToReviewScores}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
          >
            Review scores
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Accepted pool
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Unassigned
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {stats.unassigned}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Oral
          </p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{stats.oral}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Poster
          </p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{stats.poster}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            With scores
          </p>
          <p className="text-2xl font-bold text-teal-700 mt-1">
            {stats.withScores}
          </p>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, ID, presenter, or category..."
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">All formats</option>
              <option value="unassigned">Unassigned</option>
              <option value="oral">Oral</option>
              <option value="poster">Poster</option>
            </select>
            <select
              value={preferenceFilter}
              onChange={(e) => setPreferenceFilter(e.target.value)}
              className="min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">All preferences</option>
              <option value="oral">Pref: oral</option>
              <option value="poster">Pref: poster</option>
              <option value="either">Pref: either</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="min-w-[150px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">All types</option>
              <option value="Clinical Studies">Clinical</option>
              <option value="Basic Studies">Basic</option>
              <option value="unspecified">Not specified</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="avg_desc">Highest avg total</option>
              <option value="avg_asc">Lowest avg total</option>
              <option value="title_asc">Title A–Z</option>
              <option value="pref_asc">Preference A–Z</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">
              {selectedList.length} selected
              {filteredRows.length !== pool.length
                ? ` · ${filteredRows.length} shown`
                : ""}
            </span>
            <button
              type="button"
              disabled={busy || selectedList.length === 0}
              onClick={() => assignFormat(selectedList, "oral")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Assign oral
            </button>
            <button
              type="button"
              disabled={busy || selectedList.length === 0}
              onClick={() => assignFormat(selectedList, "poster")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Assign poster
            </button>
            <button
              type="button"
              disabled={busy || selectedList.length === 0}
              onClick={() => assignFormat(selectedList, null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Clear assignment
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 text-sm">
            No accepted abstracts match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
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
                    />
                  </th>
                  <th className="px-4 py-3">Abstract</th>
                  <th className="px-4 py-3">Preference</th>
                  <th className="px-4 py-3">Avg score</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Assign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const avg = avgTotalOf(row);
                  const reviewCount = Number(
                    row.review_summary?.review_count || 0,
                  );
                  const coiCount = Number(row.review_summary?.coi_count || 0);
                  const scoresOpen = expandedScoreId === row.id;
                  return (
                    <tr key={row.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          aria-label={`Select ${row.title || row.id}`}
                        />
                      </td>
                      <td className="px-4 py-3 min-w-[240px]">
                        <button
                          type="button"
                          onClick={() => setViewingId(row.id)}
                          className="text-left font-semibold text-gray-900 hover:text-violet-700 hover:underline"
                        >
                          {row.title || "Untitled abstract"}
                        </button>
                        <p className="text-[11px] text-gray-500 mt-1">
                          <span className="font-mono">{row.id}</span>
                          {" · "}
                          {row.category || "Uncategorized"}
                          {row.presenter_name
                            ? ` · ${row.presenter_name}`
                            : ""}
                        </p>
                        {scoresOpen && row.review_summary ? (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            {[
                              ["Originality", row.review_summary.avg_originality],
                              ["Clarity", row.review_summary.avg_clarity],
                              [
                                "Study design",
                                row.review_summary.avg_study_design,
                              ],
                              [
                                "Data analysis",
                                row.review_summary.avg_data_analysis,
                              ],
                              [
                                "Significance",
                                row.review_summary.avg_significance,
                              ],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5"
                              >
                                <p className="text-gray-500">{label}</p>
                                <p className="font-semibold text-gray-900">
                                  {value != null && !Number.isNaN(Number(value))
                                    ? Number(value).toFixed(2)
                                    : "—"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {preferenceBadge(row.presentation_preference)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">
                        {avg != null ? avg.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {reviewCount}
                        {coiCount > 0 ? (
                          <span className="text-amber-700 text-xs ml-1">
                            (+{coiCount} COI)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {formatBadge(normalizeFormat(row.assigned_format))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingId(row.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedScoreId((prev) =>
                                prev === row.id ? null : row.id,
                              )
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          >
                            {scoresOpen ? "Hide scores" : "Scores"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => assignFormat([row.id], "oral")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-50 text-violet-800 hover:bg-violet-100 disabled:opacity-50"
                          >
                            Oral
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => assignFormat([row.id], "poster")}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 disabled:opacity-50"
                          >
                            Poster
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingAbstract ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 p-0 sm:p-4"
          onClick={() => setViewingId(null)}
          role="presentation"
        >
          <div
            className="bg-white w-full max-w-2xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="format-assign-view-title"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Abstract detail
                </p>
                <h3
                  id="format-assign-view-title"
                  className="text-lg font-bold text-gray-900 leading-snug mt-0.5"
                >
                  {viewingAbstract.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {viewingAbstract.category || "—"}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-700">
                    {getAbstractTypeLabel(viewingAbstract)}
                  </span>
                  {preferenceBadge(viewingAbstract.presentation_preference)}
                  {formatBadge(normalizeFormat(viewingAbstract.assigned_format))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingId(null)}
                className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Presenter
                  </p>
                  <p className="font-medium text-gray-900">
                    {viewingAbstract.presenter_name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {viewingAbstract.presenter_email || ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Submitted
                  </p>
                  <p className="text-gray-700">
                    {formatDate(viewingAbstract.submission_date)}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {viewingAbstract.id}
                  </p>
                </div>
              </div>

              {viewingAbstract.review_summary ? (
                <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2">
                    Peer review summary
                  </p>
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div>
                      <p className="text-xs text-teal-800/80">Avg total</p>
                      <p className="text-xl font-bold text-teal-900 tabular-nums">
                        {avgTotalOf(viewingAbstract) != null
                          ? avgTotalOf(viewingAbstract).toFixed(2)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-800/80">Scored reviews</p>
                      <p className="text-xl font-bold text-teal-900 tabular-nums">
                        {Number(
                          viewingAbstract.review_summary.review_count || 0,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    {[
                      [
                        "Originality",
                        viewingAbstract.review_summary.avg_originality,
                      ],
                      ["Clarity", viewingAbstract.review_summary.avg_clarity],
                      [
                        "Study design",
                        viewingAbstract.review_summary.avg_study_design,
                      ],
                      [
                        "Data analysis",
                        viewingAbstract.review_summary.avg_data_analysis,
                      ],
                      [
                        "Significance",
                        viewingAbstract.review_summary.avg_significance,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-white border border-teal-100 px-2 py-1.5"
                      >
                        <p className="text-gray-500">{label}</p>
                        <p className="font-semibold text-gray-900">
                          {value != null && !Number.isNaN(Number(value))
                            ? Number(value).toFixed(2)
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  No peer-review scores for this abstract (common for
                  poster-preference submissions).
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Keywords
                </p>
                <p className="text-gray-700 break-words">
                  {viewingAbstract.keywords || "—"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Abstract
                </p>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formatAbstractText(viewingAbstract.abstract) || (
                    <span className="text-gray-400">No abstract text</span>
                  )}
                </div>
              </div>

              {(viewingAbstract.reviewer_reviews || []).length > 0 ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Reviewer notes
                  </p>
                  <ul className="space-y-2">
                    {viewingAbstract.reviewer_reviews.map((review, index) => (
                      <li
                        key={`${review.reviewer_email || index}-${index}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-xs font-semibold text-gray-800">
                          {review.reviewer_email || "Reviewer"}
                          {review.total != null ? (
                            <span className="ml-2 font-normal text-gray-500">
                              total {review.total}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                          {review.previous_study_notes ||
                            (review.has_coi
                              ? "Conflict of interest — scores not counted."
                              : "No notes.")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => assignFormat([viewingAbstract.id], null)}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => assignFormat([viewingAbstract.id], "poster")}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Assign poster
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => assignFormat([viewingAbstract.id], "oral")}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Assign oral
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
