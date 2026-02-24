import React, { useState, useEffect, useMemo } from "react";

export default function AdminTab() {
  const [abstracts, setAbstracts] = useState([]);
  const [visaRequests, setVisaRequests] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("abstracts");
  const [error, setError] = useState(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState(new Set());

  // Abstract filtering/sorting state
  const [abstractSearch, setAbstractSearch] = useState("");
  const [abstractCategoryFilter, setAbstractCategoryFilter] = useState("all");
  const [abstractStatusFilter, setAbstractStatusFilter] = useState("all");
  const [abstractSortBy, setAbstractSortBy] = useState("date-desc");
  const [abstractViewMode, setAbstractViewMode] = useState("cards"); // "cards" or "table"

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [abstractsRes, visaRes, registrationsRes] = await Promise.all([
        fetch("/api/admin/abstracts"),
        fetch("/api/admin/visa-requests"),
        fetch("/api/registrations"),
      ]);

      if (!abstractsRes.ok || !visaRes.ok || !registrationsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const abstractsData = await abstractsRes.json();
      const visaData = await visaRes.json();
      const registrationsData = await registrationsRes.json();

      setAbstracts(abstractsData.data || []);
      setVisaRequests(visaData.data || []);
      setRegistrations(registrationsData.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const toggleAbstract = (abstractId) => {
    setExpandedAbstracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(abstractId)) {
        newSet.delete(abstractId);
      } else {
        newSet.add(abstractId);
      }
      return newSet;
    });
  };

  // Get unique categories from abstracts
  const abstractCategories = useMemo(() => {
    const cats = new Set(abstracts.map((a) => a.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [abstracts]);

  // Get unique statuses from abstracts
  const abstractStatuses = useMemo(() => {
    const stats = new Set(abstracts.map((a) => a.status).filter(Boolean));
    return Array.from(stats).sort();
  }, [abstracts]);

  // Filtered and sorted abstracts
  const filteredAbstracts = useMemo(() => {
    let result = [...abstracts];

    // Search filter
    if (abstractSearch.trim()) {
      const search = abstractSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(search) ||
          a.abstract?.toLowerCase().includes(search) ||
          a.presenter_name?.toLowerCase().includes(search) ||
          a.presenter_email?.toLowerCase().includes(search) ||
          a.corresponding_name?.toLowerCase().includes(search) ||
          a.keywords?.toLowerCase().includes(search),
      );
    }

    // Category filter
    if (abstractCategoryFilter !== "all") {
      result = result.filter((a) => a.category === abstractCategoryFilter);
    }

    // Status filter
    if (abstractStatusFilter !== "all") {
      result = result.filter((a) => a.status === abstractStatusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (abstractSortBy) {
        case "date-desc":
          return (b.submission_date || 0) - (a.submission_date || 0);
        case "date-asc":
          return (a.submission_date || 0) - (b.submission_date || 0);
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });

    return result;
  }, [
    abstracts,
    abstractSearch,
    abstractCategoryFilter,
    abstractStatusFilter,
    abstractSortBy,
  ]);

  // Abstract statistics
  const abstractStats = useMemo(() => {
    const byCategory = {};
    const byStatus = {};
    const byPreference = { oral: 0, poster: 0, either: 0 };

    abstracts.forEach((a) => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.presentation_preference) {
        byPreference[a.presentation_preference] =
          (byPreference[a.presentation_preference] || 0) + 1;
      }
    });

    return { byCategory, byStatus, byPreference, total: abstracts.length };
  }, [abstracts]);

  const expandAll = () => {
    setExpandedAbstracts(new Set(filteredAbstracts.map((a) => a.id)));
  };

  const collapseAll = () => {
    setExpandedAbstracts(new Set());
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Category",
      "Status",
      "Presenter",
      "Presenter Email",
      "Corresponding Author",
      "Corresponding Email",
      "Preference",
      "Word Count",
      "Submitted",
    ];
    const rows = filteredAbstracts.map((a) => [
      a.id,
      `"${(a.title || "").replace(/"/g, '""')}"`,
      a.category,
      a.status,
      a.presenter_name,
      a.presenter_email,
      a.corresponding_name,
      a.corresponding_email,
      a.presentation_preference,
      a.word_count,
      formatDate(a.submission_date),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `abstracts-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading admin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-300">
          Manage abstract submissions, visa requests, and registrations
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Abstracts</span>
            <span className="text-white font-bold ml-2">
              {abstracts.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Visa Requests</span>
            <span className="text-white font-bold ml-2">
              {visaRequests.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Registrations</span>
            <span className="text-white font-bold ml-2">
              {registrations.length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-1 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSection("abstracts")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "abstracts"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Abstract Submissions
        </button>
        <button
          onClick={() => setActiveSection("visa")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "visa"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Visa Requests
        </button>
        <button
          onClick={() => setActiveSection("registrations")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "registrations"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Registrations
        </button>
        <button
          onClick={() => setActiveSection("trainees")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "trainees"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Trainee Applications
        </button>
      </div>

      {/* Abstract Submissions Section */}
      {activeSection === "abstracts" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Abstract Submissions
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Review and manage submitted abstracts
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {abstractStats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Submitted
                  </p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    {abstractStats.byStatus?.submitted || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Oral
                  </p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    {abstractStats.byPreference?.oral || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Poster
                  </p>
                  <p className="text-3xl font-bold text-violet-600 mt-1">
                    {abstractStats.byPreference?.poster || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-violet-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Search
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search title, author, keywords..."
                    value={abstractSearch}
                    onChange={(e) => setAbstractSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={abstractCategoryFilter}
                  onChange={(e) => setAbstractCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {abstractCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="min-w-[140px]">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={abstractStatusFilter}
                  onChange={(e) => setAbstractStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  {abstractStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="min-w-[160px]">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Sort By
                </label>
                <select
                  value={abstractSortBy}
                  onChange={(e) => setAbstractSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="category">By Category</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {filteredAbstracts.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">
                  {abstracts.length}
                </span>{" "}
                abstracts
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                  <button
                    onClick={() => setAbstractViewMode("cards")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${abstractViewMode === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <svg
                      className="w-4 h-4 inline-block mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setAbstractViewMode("table")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${abstractViewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <svg
                      className="w-4 h-4 inline-block mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    Table
                  </button>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <button
                  onClick={expandAll}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {filteredAbstracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                No abstracts match your filters
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : abstractViewMode === "table" ? (
            /* Table View */
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Presenter
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Preference
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Words
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAbstracts.map((abstract, idx) => (
                    <tr
                      key={abstract.id}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      onClick={() => {
                        setAbstractViewMode("cards");
                        setExpandedAbstracts(new Set([abstract.id]));
                      }}
                    >
                      <td className="px-5 py-4 text-sm">
                        <div
                          className="font-semibold text-gray-900 max-w-xs truncate"
                          title={abstract.title}
                        >
                          {abstract.title}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {abstract.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {abstract.presenter_name}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {abstract.presenter_email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            abstract.presentation_preference === "oral"
                              ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                              : abstract.presentation_preference === "poster"
                                ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {abstract.presentation_preference}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                          {abstract.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-600">
                        {abstract.word_count}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatDate(abstract.submission_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="space-y-4">
              {filteredAbstracts.map((abstract) => {
                const isExpanded = expandedAbstracts.has(abstract.id);
                return (
                  <div
                    key={abstract.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Collapsed Header - Always Visible */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => toggleAbstract(abstract.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                            {abstract.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                              {abstract.category}
                            </span>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                abstract.presentation_preference === "oral"
                                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                                  : "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                              }`}
                            >
                              {abstract.presentation_preference}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 ring-1 ring-blue-200">
                              {abstract.status}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {abstract.word_count} words
                            </span>
                            <span className="inline-flex items-center text-xs text-gray-400 ml-1">
                              {formatDate(abstract.submission_date)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAbstract(abstract.id);
                          }}
                        >
                          {isExpanded ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content - Conditionally Rendered */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/50">
                        <div className="grid md:grid-cols-2 gap-6 pt-5">
                          {/* Abstract Text */}
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Abstract
                            </h4>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-gray-100">
                              {abstract.abstract}
                            </p>
                          </div>

                          {/* Keywords */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Keywords
                            </h4>
                            <p className="text-gray-600">{abstract.keywords}</p>
                          </div>

                          {/* Contact Info */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-semibold text-gray-700">
                                  Presenter:
                                </span>{" "}
                                {abstract.presenter_name}{" "}
                                <span className="text-gray-400">
                                  ({abstract.presenter_email})
                                </span>
                              </p>
                              <p className="text-gray-600">
                                <span className="font-semibold text-gray-700">
                                  Corresponding:
                                </span>{" "}
                                {abstract.corresponding_name}{" "}
                                <span className="text-gray-400">
                                  ({abstract.corresponding_email})
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Authors */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Authors
                            </h4>
                            <div className="space-y-2">
                              {(abstract.authors || []).map((author, index) => (
                                <div
                                  key={author.id || index}
                                  className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border border-gray-100"
                                >
                                  <span className="font-medium text-gray-800">
                                    {author.first_name}
                                    {author.middle_name
                                      ? ` ${author.middle_name}`
                                      : ""}{" "}
                                    {author.last_name}
                                  </span>
                                  {author.email && (
                                    <span className="text-gray-400 text-xs">
                                      ({author.email})
                                    </span>
                                  )}
                                  {author.is_presenter === 1 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                      Presenter
                                    </span>
                                  )}
                                  {author.is_corresponding === 1 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                      Corresponding
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Affiliations */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Affiliations
                            </h4>
                            <div className="space-y-2">
                              {(abstract.affiliations || []).map(
                                (aff, index) => (
                                  <div
                                    key={aff.id || index}
                                    className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-100"
                                  >
                                    <span className="font-medium text-gray-800">
                                      {aff.author_name}
                                    </span>
                                    {aff.department && (
                                      <span className="text-gray-500">
                                        {" "}
                                        - {aff.department}
                                      </span>
                                    )}
                                    {aff.institution && (
                                      <span className="text-gray-500">
                                        , {aff.institution}
                                      </span>
                                    )}
                                    {aff.city && aff.country && (
                                      <span className="text-gray-400">
                                        {" "}
                                        - {aff.city}, {aff.country}
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Visa Requests Section */}
      {activeSection === "visa" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Visa Requests
          </h2>
          {visaRequests.length === 0 ? (
            <p className="text-gray-500">No visa requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visaRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.notes || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Registrations Section */}
      {activeSection === "registrations" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Registrations
          </h2>
          {registrations.length === 0 ? (
            <p className="text-gray-500">No registrations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reg.first_name} {reg.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {reg.institution || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reg.ticket_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${reg.total_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : reg.payment_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reg.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(reg.registration_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trainee Applications Section */}
      {activeSection === "trainees" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Trainee Applications
          </h2>
          <p className="text-gray-600 text-sm">
            View all trainee/student registrations and their supporting
            documentation status.
          </p>
          {registrations.filter((r) => r.ticket_type?.includes("trainee"))
            .length === 0 ? (
            <p className="text-gray-500">No trainee applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letter Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Letter File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations
                    .filter((r) => r.ticket_type?.includes("trainee"))
                    .map((reg) => (
                      <tr key={reg.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reg.first_name} {reg.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reg.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {reg.institution || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              reg.ticket_type === "trainee-member"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {reg.ticket_type === "trainee-member"
                              ? "Trainee (ISIR Member)"
                              : "Trainee (Non-Member)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reg.trainee_letter_status === "approved"
                                ? "bg-green-100 text-green-800"
                                : reg.trainee_letter_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : reg.trainee_letter_status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {reg.trainee_letter_status || "Not Uploaded"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reg.trainee_letter_url ? (
                            <a
                              href={reg.trainee_letter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              View Letter
                            </a>
                          ) : (
                            <span className="text-gray-400">No file</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reg.payment_status === "completed"
                                ? "bg-green-100 text-green-800"
                                : reg.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {reg.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.registration_date)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
