import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";

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
  const [abstractViewMode, setAbstractViewMode] = useState("cards"); // "cards", "table", or "review"

  // Review mode state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Reviewer overview state
  const [reviewerOverview, setReviewerOverview] = useState(null);
  const [reviewerOverviewLoading, setReviewerOverviewLoading] = useState(false);
  const [reviewerOverviewError, setReviewerOverviewError] = useState("");

  const reviewerStats = useMemo(() => {
    const base = {
      completedReviewers: 0,
      reviewersWithPending: 0,
      completedAssignments: 0,
    };
    if (
      !reviewerOverview ||
      !Array.isArray(reviewerOverview.reviewers) ||
      reviewerOverview.reviewers.length === 0
    ) {
      return base;
    }

    let completedReviewers = 0;
    let reviewersWithPending = 0;
    let completedAssignments = 0;

    reviewerOverview.reviewers.forEach((rev) => {
      const assigned = Number(rev.assigned_count || 0);
      const reviewed = Number(rev.reviewed_count || 0);
      if (assigned > 0 && reviewed >= assigned) {
        completedReviewers += 1;
      } else if (assigned > 0 && reviewed < assigned) {
        reviewersWithPending += 1;
      }
      if (assigned > 0 && reviewed > 0) {
        completedAssignments += Math.min(assigned, reviewed);
      }
    });

    return { completedReviewers, reviewersWithPending, completedAssignments };
  }, [reviewerOverview]);

  // Reviewer password generator state
  const [emailFileName, setEmailFileName] = useState("");
  const [emailCount, setEmailCount] = useState(0);
  const [passwordError, setPasswordError] = useState("");
  const [adminToken, setAdminToken] = useState("");

  // Speaker invite link generator state
  const [inviteFileName, setInviteFileName] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlAdminToken = params.get("admin");
      let token =
        (urlAdminToken && String(urlAdminToken).trim()) ||
        (typeof window !== "undefined"
          ? String(localStorage.getItem("isir_admin_token") || "").trim()
          : "");

      if (!token) {
        setLoading(false);
        setError(
          "Admin access token is required. Open this page with ?admin=YOUR_TOKEN in the URL.",
        );
        return;
      }

      // Persist the token so refreshing /admin/* doesn't require re-adding ?admin=
      try {
        localStorage.setItem("isir_admin_token", token);
      } catch {
        // ignore
      }

      // If we're on /admin/* without the query param, repair the URL so reloads/bookmarks work.
      if (!urlAdminToken) {
        try {
          const nextParams = new URLSearchParams(window.location.search);
          nextParams.set("admin", token);
          const nextUrl = `${window.location.pathname}?${nextParams.toString()}${window.location.hash || ""}`;
          window.history.replaceState({}, "", nextUrl);
        } catch {
          // ignore
        }
      }

      setAdminToken(token);
      fetchAllData(token);
    } catch {
      setLoading(false);
      setError("Failed to read admin access token from URL.");
    }
  }, []);

  const fetchAllData = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = {
        "X-Admin-Token": token,
      };

      const [abstractsRes, visaRes, registrationsRes, reviewersRes] =
        await Promise.all([
          fetch("/api/admin/abstracts", { headers: authHeaders }),
          fetch("/api/admin/visa-requests", { headers: authHeaders }),
          fetch("/api/registrations", { headers: authHeaders }),
          fetch("/api/admin/reviewers/overview", { headers: authHeaders }),
        ]);

      const failureDetails = [];
      const addFailure = async (name, res) => {
        if (res.ok) return;
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          bodyText = "";
        }
        const snippet = String(bodyText || "").trim().slice(0, 500);
        failureDetails.push(
          `${name}: HTTP ${res.status}${snippet ? ` — ${snippet}` : ""}`,
        );
      };

      await Promise.all([
        addFailure("GET /api/admin/abstracts", abstractsRes),
        addFailure("GET /api/admin/visa-requests", visaRes),
        addFailure("GET /api/registrations", registrationsRes),
        addFailure("GET /api/admin/reviewers/overview", reviewersRes),
      ]);

      if (failureDetails.length > 0) {
        throw new Error(`Failed to fetch admin data.\n${failureDetails.join("\n")}`);
      }

      const abstractsData = await abstractsRes.json();
      const visaData = await visaRes.json();
      const registrationsData = await registrationsRes.json();
      const reviewersData = await reviewersRes.json();

      setAbstracts(abstractsData.data || []);
      setVisaRequests(visaData.data || []);
      setRegistrations(registrationsData.data || []);
      setReviewerOverview(reviewersData || null);
      setReviewerOverviewError("");
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < length; i += 1) {
      const idx = Math.floor(Math.random() * charset.length);
      pwd += charset.charAt(idx);
    }
    return pwd;
  };

  const handleEmailFileChange = async (event) => {
    setPasswordError("");
    setEmailCount(0);
    const file = event.target.files?.[0];
    if (!file) return;

    setEmailFileName(file.name);

    if (!adminToken.trim()) {
      setPasswordError("Admin access token missing. Open /admin with ?admin=YOUR_TOKEN.");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        setPasswordError("Could not read first sheet from file.");
        return;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) {
        setPasswordError("Sheet is empty.");
        return;
      }

      let emailColumnIndex = 0;
      const headerRow = rows[0];
      if (Array.isArray(headerRow)) {
        const idx = headerRow.findIndex((cell) => {
          if (typeof cell !== "string") return false;
          const val = cell.trim().toLowerCase();
          return val === "email" || val === "emails";
        });
        if (idx >= 0) {
          emailColumnIndex = idx;
        }
      }

      const emails = [];
      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        if (!Array.isArray(row)) continue;
        const raw = row[emailColumnIndex];
        if (!raw) continue;
        const email = String(raw).trim();
        if (!email) continue;
        emails.push(email.toLowerCase());
      }

      if (emails.length === 0) {
        setPasswordError(
          "No emails found. Make sure there is a column with email addresses.",
        );
        return;
      }

      const outputRows = [];

      for (const email of emails) {
        try {
          const res = await fetch("/api/admin/reviewers/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Token": adminToken.trim(),
            },
            body: JSON.stringify({ email }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            outputRows.push({
              Email: email,
              Password: `ERROR (${res.status}): ${text || "create failed"}`,
            });
            continue;
          }

          const json = await res.json().catch(() => null);
          if (!json || json.success !== true) {
            outputRows.push({
              Email: email,
              Password:
                "ERROR: unexpected response while creating reviewer account",
            });
            continue;
          }

          if (json.existing === true && !json.password) {
            outputRows.push({
              Email: email,
              Password: "EXISTS (password unchanged)",
            });
            continue;
          }

          if (!json.password) {
            outputRows.push({
              Email: email,
              Password: "ERROR: no password returned",
            });
            continue;
          }

          outputRows.push({
            Email: email,
            Password: json.password,
          });
        } catch (err) {
          console.error("Error creating reviewer for email:", email, err);
          outputRows.push({
            Email: email,
            Password: "ERROR: network or server error",
          });
        }
      }

      setEmailCount(outputRows.length);

      const outSheet = XLSX.utils.json_to_sheet(outputRows);
      const outWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(outWb, outSheet, "ReviewerPasswords");
      const downloadName =
        "reviewer-passwords-" +
        new Date().toISOString().slice(0, 10) +
        ".xlsx";
      XLSX.writeFile(outWb, downloadName);
    } catch (e) {
      console.error("Error processing email Excel:", e);
      setPasswordError(
        e?.message || "Failed to process file. Please try a different file.",
      );
    }
  };

  const normalizeEmail = (value) => {
    if (!value) return "";
    const str = String(value).trim();
    if (!str) return "";
    const match = str.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return (match ? match[0] : str).trim().toLowerCase();
  };

  const handleInviteFileChange = async (event) => {
    setInviteError("");
    setInviteCount(0);

    const file = event.target.files?.[0];
    if (!file) return;

    setInviteFileName(file.name);

    try {
      if (!adminToken.trim()) {
        setInviteError(
          "Admin token is required to generate speaker invites (stored + validated on the server).",
        );
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        setInviteError("Could not read first sheet from file.");
        return;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!Array.isArray(rows) || rows.length === 0) {
        setInviteError("Sheet is empty.");
        return;
      }

      const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
      const findEmailColIdx = () => {
        const idx = headerRow.findIndex((cell) => {
          if (typeof cell !== "string") return false;
          return cell.trim().toLowerCase().includes("email");
        });
        return idx >= 0 ? idx : 0;
      };
      const emailColIdx = findEmailColIdx();

      let inviteColIdx = headerRow.findIndex((cell) => {
        if (typeof cell !== "string") return false;
        const val = cell.trim().toLowerCase();
        return val === "invite_link" || val === "invite link" || val === "invitelink";
      });
      if (inviteColIdx < 0) {
        inviteColIdx = headerRow.length;
        headerRow.push("invite_link");
      } else {
        headerRow[inviteColIdx] = "invite_link";
      }

      const emailToToken = new Map();
      const base = "https://isir2026.org";

      let generated = 0;
      for (let i = 1; i < rows.length; i += 1) {
        const row = Array.isArray(rows[i]) ? rows[i] : [];
        const email = normalizeEmail(row[emailColIdx]);
        if (!email) continue;

        let token = emailToToken.get(email);
        if (!token) {
          const res = await fetch("/api/admin/speaker-invites/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Token": adminToken.trim(),
            },
            body: JSON.stringify({ email }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json?.success || !json?.token) {
            throw new Error(
              json?.error ||
                `Failed to create invite for ${email} (HTTP ${res.status})`,
            );
          }
          token = String(json.token);
          emailToToken.set(email, token);
        }

        row[inviteColIdx] = `${base}/registration?invite=${encodeURIComponent(token)}`;
        rows[i] = row;
        generated += 1;
      }

      if (generated === 0) {
        setInviteError(
          "No emails found. Make sure there is a column containing 'Email' (or put emails in the first column).",
        );
        return;
      }

      const outWb = XLSX.utils.book_new();
      const outWs = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(outWb, outWs, sheetName || "Sheet1");
      XLSX.writeFile(
        outWb,
        `speaker-invite-links-${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      setInviteCount(generated);
    } catch (err) {
      console.error("Failed to generate invite links:", err);
      setInviteError(err?.message || "Failed to process file.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Format abstract text with highlighted sections
  const formatAbstractText = (text) => {
    if (!text) return null;

    // Define the sections to look for
    const sections = ["Objectives", "Methods", "Results", "Conclusions"];
    const sectionColors = {
      Objectives: "text-blue-700 bg-blue-50",
      Methods: "text-emerald-700 bg-emerald-50",
      Results: "text-amber-700 bg-amber-50",
      Conclusions: "text-violet-700 bg-violet-50",
    };

    // Split text by section headers (case-insensitive)
    const regex = /(Objectives|Methods|Results|Conclusions)\s*:/gi;
    const parts = text.split(regex);

    if (parts.length <= 1) {
      // No sections found, return plain text
      return <span className="text-gray-700">{text}</span>;
    }

    const elements = [];
    let currentSection = null;

    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      const sectionMatch = sections.find(
        (s) => s.toLowerCase() === trimmedPart.toLowerCase(),
      );

      if (sectionMatch) {
        currentSection = sectionMatch;
      } else if (trimmedPart) {
        elements.push(
          <div key={index} className="mb-3 last:mb-0">
            {currentSection && (
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide mb-1 ${sectionColors[currentSection]}`}
              >
                {currentSection}
              </span>
            )}
            <p className="text-gray-700 leading-relaxed pl-0.5">
              {trimmedPart}
            </p>
          </div>,
        );
        currentSection = null;
      }
    });

    return <div className="space-y-2">{elements}</div>;
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

  // Pending review abstracts (submitted status only)
  const pendingReviewAbstracts = useMemo(() => {
    return abstracts.filter((a) => a.status === "submitted");
  }, [abstracts]);

  // Current abstract being reviewed
  const currentReviewAbstract = pendingReviewAbstracts[reviewIndex] || null;

  // Update abstract status
  const updateAbstractStatus = async (abstractId, status, reason = null) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    setReviewUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/abstracts/${abstractId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
          body: JSON.stringify({ status, rejection_reason: reason }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstractId ? { ...a, status, rejection_reason: reason } : a,
        ),
      );

      // Move to next abstract if in review mode
      if (abstractViewMode === "review") {
        // Since the array will shrink, keep the same index (which will show the next item)
        // But if we're at the end, we need to go back
        if (reviewIndex >= pendingReviewAbstracts.length - 1) {
          setReviewIndex(Math.max(0, reviewIndex - 1));
        }
      }

      setRejectionReason("");
      setShowRejectionModal(false);
    } catch (err) {
      console.error("Error updating abstract status:", err);
      alert("Failed to update abstract status");
    } finally {
      setReviewUpdating(false);
    }
  };

  // Start review mode
  const startReviewMode = () => {
    setReviewIndex(0);
    setAbstractViewMode("review");
  };

  // Keyboard navigation for review mode
  useEffect(() => {
    if (abstractViewMode !== "review") return;

    const handleKeyDown = (e) => {
      if (showRejectionModal) return;

      if (e.key === "ArrowLeft" && reviewIndex > 0) {
        setReviewIndex((i) => i - 1);
      } else if (
        e.key === "ArrowRight" &&
        reviewIndex < pendingReviewAbstracts.length - 1
      ) {
        setReviewIndex((i) => i + 1);
      } else if (e.key === "a" && currentReviewAbstract && !reviewUpdating) {
        updateAbstractStatus(currentReviewAbstract.id, "accepted");
      } else if (e.key === "r" && currentReviewAbstract && !reviewUpdating) {
        setShowRejectionModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    abstractViewMode,
    reviewIndex,
    pendingReviewAbstracts.length,
    currentReviewAbstract,
    reviewUpdating,
    showRejectionModal,
  ]);

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
        <button
          onClick={() => setActiveSection("reviewers")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "reviewers"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Reviewers
        </button>
        <button
          onClick={() => setActiveSection("reviewerPasswords")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "reviewerPasswords"
              ? "bg-purple-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Reviewer Passwords
        </button>
        <button
          onClick={() => setActiveSection("speakerInvites")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "speakerInvites"
              ? "bg-fuchsia-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Speaker Invite Links
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
            <div className="flex gap-2">
              {pendingReviewAbstracts.length > 0 && (
                <button
                  onClick={startReviewMode}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 font-medium"
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Review ({pendingReviewAbstracts.length})
                </button>
              )}
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
                    Either
                  </p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    {abstractStats.byPreference?.either || 0}
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

          {/* Review Mode UI */}
          {abstractViewMode === "review" ? (
            <div className="space-y-6">
              {/* Review Mode Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Review Mode</h3>
                    <p className="text-blue-100 mt-1">
                      {pendingReviewAbstracts.length === 0
                        ? "All abstracts have been reviewed!"
                        : `${reviewIndex + 1} of ${pendingReviewAbstracts.length} pending abstracts`}
                    </p>
                  </div>
                  <button
                    onClick={() => setAbstractViewMode("cards")}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Exit Review
                  </button>
                </div>
                {pendingReviewAbstracts.length > 0 && (
                  <div className="mt-4">
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300"
                        style={{
                          width: `${((abstracts.length - pendingReviewAbstracts.length) / abstracts.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-blue-100 text-sm mt-2">
                      {abstracts.length - pendingReviewAbstracts.length} of{" "}
                      {abstracts.length} abstracts reviewed
                    </p>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Hint */}
              {pendingReviewAbstracts.length > 0 && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-center gap-6 text-sm text-gray-600">
                  <span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs">
                      A
                    </kbd>{" "}
                    Accept
                  </span>
                  <span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs">
                      R
                    </kbd>{" "}
                    Reject
                  </span>
                  <span>
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs">
                      &larr;
                    </kbd>{" "}
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs">
                      &rarr;
                    </kbd>{" "}
                    Navigate
                  </span>
                </div>
              )}

              {/* Current Abstract Card */}
              {currentReviewAbstract ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Abstract Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {currentReviewAbstract.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          currentReviewAbstract.presentation_preference ===
                          "oral"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {currentReviewAbstract.presentation_preference}{" "}
                        preference
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {currentReviewAbstract.word_count} words
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                      {currentReviewAbstract.title}
                    </h2>
                  </div>

                  {/* Abstract Content */}
                  <div className="p-6 space-y-6">
                    {/* Abstract Text */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Abstract
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {formatAbstractText(currentReviewAbstract.abstract)}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Keywords
                      </h4>
                      <p className="text-gray-600">
                        {currentReviewAbstract.keywords}
                      </p>
                    </div>

                    {/* Authors & Contact */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                          Authors
                        </h4>
                        <div className="space-y-2">
                          {(currentReviewAbstract.authors || []).map(
                            (author, idx) => (
                              <div
                                key={author.id || idx}
                                className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg"
                              >
                                <span className="font-medium text-gray-800">
                                  {author.first_name}{" "}
                                  {author.middle_name
                                    ? `${author.middle_name} `
                                    : ""}
                                  {author.last_name}
                                </span>
                                {author.is_presenter === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    Presenter
                                  </span>
                                )}
                                {author.is_corresponding === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                    Corresponding
                                  </span>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                          Contact
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-semibold text-gray-700">
                              Presenter:
                            </span>{" "}
                            {currentReviewAbstract.presenter_name}
                            <span className="text-gray-400 block">
                              {currentReviewAbstract.presenter_email}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            <span className="font-semibold text-gray-700">
                              Corresponding:
                            </span>{" "}
                            {currentReviewAbstract.corresponding_name}
                            <span className="text-gray-400 block">
                              {currentReviewAbstract.corresponding_email}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Affiliations */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Affiliations
                      </h4>
                      <div className="space-y-2">
                        {(currentReviewAbstract.affiliations || []).map(
                          (aff, idx) => (
                            <div
                              key={aff.id || idx}
                              className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
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

                  {/* Action Buttons */}
                  <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      {/* Navigation */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setReviewIndex((i) => Math.max(0, i - 1))
                          }
                          disabled={reviewIndex === 0}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setReviewIndex((i) =>
                              Math.min(
                                pendingReviewAbstracts.length - 1,
                                i + 1,
                              ),
                            )
                          }
                          disabled={
                            reviewIndex >= pendingReviewAbstracts.length - 1
                          }
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          Next
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Accept/Reject */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowRejectionModal(true)}
                          disabled={reviewUpdating}
                          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            updateAbstractStatus(
                              currentReviewAbstract.id,
                              "accepted",
                            )
                          }
                          disabled={reviewUpdating}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                        >
                          {reviewUpdating ? (
                            <svg
                              className="w-5 h-5 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* All reviewed state */
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-emerald-600"
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    All Done!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    All abstracts have been reviewed.
                  </p>
                  <button
                    onClick={() => setAbstractViewMode("cards")}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Back to All Abstracts
                  </button>
                </div>
              )}

              {/* Rejection Modal */}
              {showRejectionModal && currentReviewAbstract && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                    <div className="p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900">
                        Reject Abstract
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Provide a reason for rejection (optional)
                      </p>
                    </div>
                    <div className="p-6">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      />
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowRejectionModal(false);
                          setRejectionReason("");
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          updateAbstractStatus(
                            currentReviewAbstract.id,
                            "rejected",
                            rejectionReason,
                          )
                        }
                        disabled={reviewUpdating}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center gap-2"
                      >
                        {reviewUpdating && (
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        )}
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : filteredAbstracts.length === 0 ? (
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
                            <div className="bg-white p-4 rounded-lg border border-gray-100">
                              {formatAbstractText(abstract.abstract)}
                            </div>
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

      {/* Reviewers Section */}
      {activeSection === "reviewers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Reviewer Overview
              </h2>
              <p className="text-gray-600 text-sm mt-1 max-w-2xl">
                See total reviews and assignments, plus each reviewer&apos;s
                workload and progress.
              </p>
            </div>
            <button
              onClick={fetchAllData}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {!reviewerOverview ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-500 text-sm">
              {error
                ? "Could not load reviewer overview."
                : "Loading reviewer overview..."}
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Completed Reviews
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {reviewerOverview.totals?.total_reviews ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Reviewers with Assignments
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {reviewerOverview.totals
                          ?.total_reviewers_with_assignments ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 110-8 4 4 0 010 8zm8 0a4 4 0 100-8 4 4 0 000 8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Total Assignments
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {reviewerOverview.totals?.total_assignments ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
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
                          d="M9 12h6m-6 4h6M9 8h6m2 11H7a2 2 0 01-2-2V7a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Completed Reviewers
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {reviewerStats.completedReviewers}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {reviewerStats.reviewersWithPending} with pending reviews
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-lime-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-reviewer table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Reviewers and assignments
                  </h3>
                  <p className="text-xs text-gray-500">
                    {reviewerOverview.reviewers?.length || 0} reviewers
                  </p>
                </div>
                {reviewerOverview.reviewers &&
                reviewerOverview.reviewers.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {reviewerOverview.reviewers.map((rev) => {
                      const pending =
                        (rev.assigned_count || 0) - (rev.reviewed_count || 0);
                      const isComplete =
                        (rev.assigned_count || 0) > 0 && pending <= 0;
                      return (
                        <details
                          key={rev.reviewer_email}
                          className={`group border-l-4 ${
                            isComplete
                              ? "border-emerald-500"
                              : pending > 0
                              ? "border-amber-400"
                              : "border-gray-200"
                          }`}
                        >
                          <summary className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {rev.reviewer_email}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Assigned {rev.assigned_count || 0} •
                                  Reviewed {rev.reviewed_count || 0} • Pending{" "}
                                  {pending < 0 ? 0 : pending}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                  {isComplete ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                      All reviews complete
                                    </span>
                                  ) : (rev.assigned_count || 0) === 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      No assignments
                                    </span>
                                  ) : pending > 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                      Pending reviews
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  Avg. score
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {rev.avg_score != null
                                    ? rev.avg_score.toFixed(1)
                                    : "—"}
                                </p>
                              </div>
                              <div className="hidden sm:block text-right">
                                <p className="text-xs text-gray-500">
                                  Last review
                                </p>
                                <p className="text-xs text-gray-700">
                                  {rev.last_review_at
                                    ? formatDate(rev.last_review_at)
                                    : "–"}
                                </p>
                              </div>
                              <svg
                                className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
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
                            </div>
                          </summary>
                          <div className="bg-gray-50 px-5 pb-4 pt-2 text-sm">
                            {rev.assignments && rev.assignments.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500 border-b border-gray-200">
                                      <th className="py-2 pr-4">
                                        Abstract ID
                                      </th>
                                      <th className="py-2 pr-4">Title</th>
                                      <th className="py-2 pr-4">Status</th>
                                      <th className="py-2 pr-4">Score</th>
                                      <th className="py-2 pr-4">
                                        Assigned
                                      </th>
                                      <th className="py-2 pr-2">
                                        Last updated
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rev.assignments.map((a) => (
                                      <tr key={a.abstract_id}>
                                        <td className="py-1.5 pr-4 font-mono text-[11px] text-gray-700">
                                          {a.abstract_id}
                                        </td>
                                        <td className="py-1.5 pr-4 text-gray-800 max-w-xs truncate">
                                          {a.title}
                                        </td>
                                        <td className="py-1.5 pr-4">
                                          <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                            {a.status || "submitted"}
                                          </span>
                                        </td>
                                        <td className="py-1.5 pr-4">
                                          {a.review_total != null
                                            ? a.review_total
                                            : "—"}
                                        </td>
                                        <td className="py-1.5 pr-4 text-gray-600">
                                          {a.assigned_at
                                            ? formatDate(a.assigned_at)
                                            : "–"}
                                        </td>
                                        <td className="py-1.5 pr-2 text-gray-600">
                                          {a.review_updated_at
                                            ? formatDate(a.review_updated_at)
                                            : "–"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500">
                                No assignments found for this reviewer.
                              </p>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-sm text-gray-500">
                    No reviewer assignments found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reviewer Passwords Section */}
      {activeSection === "reviewerPasswords" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Reviewer Password Generator
            </h2>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Upload an Excel file that contains a column of email addresses.
              The tool will create or update reviewer accounts on the server and
              generate a new Excel file with each email and the corresponding
              password that is stored in the database.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload email list (Excel)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleEmailFileChange}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: .xlsx, .xls, .csv. The first sheet will be
                used. If there is a header row with a column named{" "}
                <code className="px-1 rounded bg-gray-100 text-[11px]">
                  email
                </code>
                , that column will be used; otherwise the first column will be
                treated as the email column.
              </p>
            </div>

            {emailFileName && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Selected file:</span>{" "}
                <span className="text-gray-600">{emailFileName}</span>
              </div>
            )}

            {emailCount > 0 && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Generated passwords for <strong>{emailCount}</strong> email
                addresses and downloaded an Excel file with the results.
              </div>
            )}

            {passwordError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Speaker Invite Links Section */}
      {activeSection === "speakerInvites" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Speaker Invite Link Generator
            </h2>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Upload your speaker list as an Excel/CSV file. The tool will add an{" "}
              <code className="px-1 rounded bg-gray-100 text-[11px]">
                invite_link
              </code>{" "}
              column (generated per unique email) and download a new Excel file.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload speaker file (Excel/CSV)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInviteFileChange}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">
                The first sheet will be used. The email column is detected by a
                header containing{" "}
                <code className="px-1 rounded bg-gray-100 text-[11px]">
                  email
                </code>
                ; otherwise the first column is used. Email values like{" "}
                <code className="px-1 rounded bg-gray-100 text-[11px]">
                  Name &lt;email@domain.com&gt;
                </code>{" "}
                are supported.
              </p>
            </div>

            {inviteFileName && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Selected file:</span>{" "}
                <span className="text-gray-600">{inviteFileName}</span>
              </div>
            )}

            {inviteCount > 0 && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Generated <strong>{inviteCount}</strong> invite links and
                downloaded an Excel file with the results.
              </div>
            )}

            {inviteError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {inviteError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => fetchAllData(adminToken)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
