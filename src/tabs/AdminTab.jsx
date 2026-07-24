import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";
import {
  CONGRESS_WEEKEND_MEALS,
  CONGRESS_WEEKEND_MEAL_KEYS,
  formatCongressMealDayList,
} from "../config/constants";

const REGISTRATION_TICKET_LABELS = {
  "isir-member": "ISIR Member",
  "non-member": "Non-Member",
  "trainee-member": "Trainee / Student Member",
  "trainee-non-member": "Trainee / Student Non-Member",
  "invited-speaker": "Invited Speaker",
  "korea-day-pass": "Daypass (Korean locals only)",
};

function parseRegistrationDayList(raw) {
  if (raw == null || raw === "") return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Map legacy calendar keys (Thu–Sun congress) to Fri–Sun labels for rollups. */
const LEGACY_MEAL_DAY_TO_WEEKEND = {
  "Nov 6": "Friday",
  "Nov 7": "Saturday",
  "Nov 8": "Sunday",
};

function normalizeWeekendMealDayList(raw) {
  const arr = parseRegistrationDayList(raw);
  const out = [];
  for (const d of arr) {
    if (CONGRESS_WEEKEND_MEAL_KEYS.includes(d)) out.push(d);
    else if (LEGACY_MEAL_DAY_TO_WEEKEND[d])
      out.push(LEGACY_MEAL_DAY_TO_WEEKEND[d]);
  }
  return out;
}

function registrationBreakfastDaysForDisplay(reg) {
  const fromBreakfast = normalizeWeekendMealDayList(reg.breakfast_days);
  if (fromBreakfast.length > 0) return fromBreakfast;
  return normalizeWeekendMealDayList(reg.dinner_days);
}

function registrationPaymentBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "completed") {
    return "bg-green-100 text-green-800";
  }
  if (s === "pending") {
    return "bg-yellow-100 text-yellow-800";
  }
  return "bg-red-100 text-red-800";
}

function getAbstractTypeLabel(abstract) {
  const raw = String(
    abstract?.abstract_submission_type ||
      abstract?.abstractSubmissionType ||
      "",
  ).trim();
  if (!raw) return "Not specified";
  if (raw === "Clinical Research") return "Clinical Studies";
  if (raw === "Basic Research") return "Basic Studies";
  return raw;
}

function formatAuthorDisplayName(author) {
  if (!author) return "";
  return `${author.first_name || ""}${
    author.middle_name ? ` ${author.middle_name}` : ""
  } ${author.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function getAbstractAuthorId(abstract, role) {
  const authors = abstract?.authors || [];
  if (role === "presenter") {
    return (
      abstract?.presenter_author_id ||
      authors.find((a) => Number(a.is_presenter) === 1)?.id ||
      ""
    );
  }
  return (
    abstract?.corresponding_author_id ||
    authors.find((a) => Number(a.is_corresponding) === 1)?.id ||
    ""
  );
}

function AbstractSpeakerControls({ abstract, onSave, saving }) {
  const authors = [...(abstract?.authors || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const presenterId = getAbstractAuthorId(abstract, "presenter");
  const correspondingId = getAbstractAuthorId(abstract, "corresponding");

  if (authors.length === 0) {
    return <p className="text-sm text-gray-500">No authors listed.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <label className="block">
        <span className="font-semibold text-gray-700">Presenter</span>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 disabled:opacity-60"
          value={presenterId}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value;
            if (!next || next === presenterId) return;
            onSave(abstract.id, next, correspondingId || next);
          }}
        >
          {!presenterId && <option value="">Select presenter</option>}
          {authors.map((author) => (
            <option
              key={author.id}
              value={author.id}
              disabled={!String(author.email || "").trim()}
            >
              {formatAuthorDisplayName(author)}
              {author.email
                ? ` (${author.email})`
                : " — no email (cannot select)"}
            </option>
          ))}
        </select>
        {presenterId && (
          <span className="mt-1 block text-xs text-gray-400">
            {abstract.presenter_email}
          </span>
        )}
      </label>
      <label className="block">
        <span className="font-semibold text-gray-700">Corresponding</span>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 disabled:opacity-60"
          value={correspondingId}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value;
            if (!next || next === correspondingId) return;
            onSave(abstract.id, presenterId || next, next);
          }}
        >
          {!correspondingId && (
            <option value="">Select corresponding author</option>
          )}
          {authors.map((author) => (
            <option
              key={author.id}
              value={author.id}
              disabled={!String(author.email || "").trim()}
            >
              {formatAuthorDisplayName(author)}
              {author.email
                ? ` (${author.email})`
                : " — no email (cannot select)"}
            </option>
          ))}
        </select>
        {correspondingId && (
          <span className="mt-1 block text-xs text-gray-400">
            {abstract.corresponding_email}
          </span>
        )}
      </label>
      {saving && (
        <p className="text-xs text-amber-700">Updating speakers…</p>
      )}
    </div>
  );
}

export default function AdminTab() {
  const [abstracts, setAbstracts] = useState([]);
  const [visaRequests, setVisaRequests] = useState([]);
  const [speakerHotelRegistrations, setSpeakerHotelRegistrations] = useState(
    [],
  );
  /** null = original order, "asc"/"desc" = sorted by passport name */
  const [speakerHotelNameSort, setSpeakerHotelNameSort] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("abstracts");
  const [error, setError] = useState(null);
  const [speakerProfileSubmissions, setSpeakerProfileSubmissions] = useState(
    [],
  );
  const [speakerProfileActionId, setSpeakerProfileActionId] = useState(null);
  const [traineeLetterActionId, setTraineeLetterActionId] = useState(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState(new Set());

  // Abstract filtering/sorting state
  const [abstractSearch, setAbstractSearch] = useState("");
  const [abstractCategoryFilter, setAbstractCategoryFilter] = useState("all");
  const [abstractStatusFilter, setAbstractStatusFilter] = useState("all");
  const [abstractSortBy, setAbstractSortBy] = useState("date-desc");
  const [abstractViewMode, setAbstractViewMode] = useState("cards"); // "cards", "table", or "review"
  const [invitedAbstractSearch, setInvitedAbstractSearch] = useState("");
  const [expandedInvitedAbstracts, setExpandedInvitedAbstracts] = useState(
    new Set(),
  );

  const [registrationSearch, setRegistrationSearch] = useState("");
  const [speakerProfileSearch, setSpeakerProfileSearch] = useState("");
  const [expandedRegistrationIds, setExpandedRegistrationIds] = useState(
    new Set(),
  );

  // Review mode state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  /** Which queue review mode uses: general submissions or invited speakers (never mixed). */
  const [reviewPool, setReviewPool] = useState("general"); // "general" | "invited"

  // Confirmation-email sending state (retroactive single + bulk)
  const [sendingConfirmationId, setSendingConfirmationId] = useState(null);
  const [
    sendingRegistrationConfirmationId,
    setSendingRegistrationConfirmationId,
  ] = useState(null);
  const [bulkSendingConfirmations, setBulkSendingConfirmations] =
    useState(false);
  const [confirmationSendSummary, setConfirmationSendSummary] = useState(null);
  const [sendingDecisionId, setSendingDecisionId] = useState(null);
  const [bulkSendingDecisions, setBulkSendingDecisions] = useState(false);
  const [decisionSendSummary, setDecisionSendSummary] = useState(null);
  const [updatingInvitedSpeakerId, setUpdatingInvitedSpeakerId] =
    useState(null);
  const [updatingSpeakersId, setUpdatingSpeakersId] = useState(null);
  const [acceptingAllInvitedSpeakers, setAcceptingAllInvitedSpeakers] =
    useState(false);

  // Reviewer overview state
  const [reviewerOverview, setReviewerOverview] = useState(null);
  const [abstractsPerReviewerInput, setAbstractsPerReviewerInput] =
    useState("");
  const [savingAbstractsPerReviewer, setSavingAbstractsPerReviewer] =
    useState(false);
  const [abstractsPerReviewerMessage, setAbstractsPerReviewerMessage] =
    useState(null); // { type: "success" | "error", text }

  // Per-reviewer assignment targets (Add Reviewers screen)
  const [reviewerAccounts, setReviewerAccounts] = useState([]);
  const [reviewerAccountsDefault, setReviewerAccountsDefault] = useState(5);
  const [reviewerTargetInputs, setReviewerTargetInputs] = useState({});
  const [savingReviewerTargetEmail, setSavingReviewerTargetEmail] =
    useState(null);
  const [reviewerTargetMessage, setReviewerTargetMessage] = useState(null); // { email, type, text }
  const [reviewerOverviewLoading, setReviewerOverviewLoading] = useState(false);
  const [reviewerOverviewError, setReviewerOverviewError] = useState("");
  const [reviewerAbstractScores, setReviewerAbstractScores] = useState([]);
  const [reviewerAbstractSearch, setReviewerAbstractSearch] = useState("");
  const [reviewerAbstractCategoryFilter, setReviewerAbstractCategoryFilter] =
    useState("all");

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

  const reviewerAbstractCategories = useMemo(() => {
    const categories = new Set(
      (reviewerAbstractScores || []).map((a) => a.category).filter(Boolean),
    );
    return Array.from(categories).sort();
  }, [reviewerAbstractScores]);

  const filteredReviewerAbstractScores = useMemo(() => {
    let result = [...(reviewerAbstractScores || [])];
    const query = reviewerAbstractSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((a) => {
        const title = String(a.title || "").toLowerCase();
        const id = String(a.id || "").toLowerCase();
        const category = String(a.category || "").toLowerCase();
        return (
          title.includes(query) ||
          id.includes(query) ||
          category.includes(query)
        );
      });
    }
    if (reviewerAbstractCategoryFilter !== "all") {
      result = result.filter(
        (a) => a.category === reviewerAbstractCategoryFilter,
      );
    }
    return result;
  }, [
    reviewerAbstractScores,
    reviewerAbstractSearch,
    reviewerAbstractCategoryFilter,
  ]);

  const abstractReviewRollupStats = useMemo(() => {
    const list = reviewerAbstractScores || [];
    const withReviews = list.filter(
      (a) => Number(a.review_summary?.review_count || 0) > 0,
    ).length;
    return { total: list.length, withReviews };
  }, [reviewerAbstractScores]);

  const registrationTotals = useMemo(() => {
    const list = Array.isArray(registrations) ? registrations : [];
    const weekendDays = CONGRESS_WEEKEND_MEAL_KEYS;
    const parseDayList = (raw) => {
      if (raw == null || raw === "") return [];
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const isPaymentConfirmed = (status) => {
      const s = String(status || "").toLowerCase();
      return s === "completed" || s === "paid";
    };

    const byStatus = {};
    const byTicket = {};
    let accompanyingSum = 0;
    let openingReceptionYes = 0;
    let galaAttendingYes = 0;
    let revenueAll = 0;
    let revenueConfirmed = 0;
    let confirmedCount = 0;
    const lunchByDay = Object.fromEntries(weekendDays.map((d) => [d, 0]));
    const breakfastByDay = Object.fromEntries(weekendDays.map((d) => [d, 0]));

    for (const r of list) {
      const status = String(r.payment_status || "unknown").toLowerCase();
      byStatus[status] = (byStatus[status] || 0) + 1;
      const tt = r.ticket_type || "unknown";
      byTicket[tt] = (byTicket[tt] || 0) + 1;
      accompanyingSum += Number(r.accompanying_count || 0);
      if (Number(r.opening_reception_attending || 0) === 1) {
        openingReceptionYes += 1;
      }
      if (Number(r.gala_dinner_attending || 0) === 1) {
        galaAttendingYes += 1;
      }
      const tp = Number(r.total_price);
      const amt = Number.isFinite(tp) ? tp : 0;
      revenueAll += amt;
      if (isPaymentConfirmed(r.payment_status)) {
        revenueConfirmed += amt;
        confirmedCount += 1;
      }
      for (const d of normalizeWeekendMealDayList(r.lunch_days)) {
        if (d in lunchByDay) lunchByDay[d] += 1;
      }
      const breakfastParsed = parseDayList(r.breakfast_days);
      if (breakfastParsed.length > 0) {
        for (const d of normalizeWeekendMealDayList(r.breakfast_days)) {
          if (d in breakfastByDay) breakfastByDay[d] += 1;
        }
      } else {
        for (const d of normalizeWeekendMealDayList(r.dinner_days)) {
          if (d in breakfastByDay) breakfastByDay[d] += 1;
        }
      }
    }

    const invitedSpeakers = list.filter(
      (r) => Number(r.is_invited_speaker || 0) === 1,
    ).length;

    const ticketRows = Object.entries(byTicket)
      .map(([id, count]) => ({
        id,
        label: REGISTRATION_TICKET_LABELS[id] || id,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const statusRows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

    return {
      total: list.length,
      byStatus,
      statusRows,
      ticketRows,
      accompanyingSum,
      openingReceptionYes,
      galaAttendingYes,
      revenueAll,
      revenueConfirmed,
      confirmedCount,
      lunchByDay,
      breakfastByDay,
      invitedSpeakers,
    };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const list = Array.isArray(registrations) ? registrations : [];
    const q = registrationSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const parts = [
        r.id,
        r.first_name,
        r.middle_name,
        r.last_name,
        r.email,
        r.institution,
        r.badge_name,
        r.ticket_type,
        r.payment_status,
        r.city,
        r.country,
        r.phone,
        r.cell_phone,
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .map((x) => String(x).toLowerCase());
      return parts.some((p) => p.includes(q));
    });
  }, [registrations, registrationSearch]);

  // Reviewer account generator state
  const [emailFileName, setEmailFileName] = useState("");
  const [emailCount, setEmailCount] = useState(0);
  const [reviewerCreateError, setReviewerCreateError] = useState("");
  const [singleReviewerEmail, setSingleReviewerEmail] = useState("");
  const [singleReviewerCount, setSingleReviewerCount] = useState("");
  const [singleReviewerMessage, setSingleReviewerMessage] = useState("");
  const [singleReviewerLoading, setSingleReviewerLoading] = useState(false);
  const [adminToken, setAdminToken] = useState("");

  // Speaker invite link generator state
  const [inviteFileName, setInviteFileName] = useState("");
  const [inviteCount, setInviteCount] = useState(0);
  const [inviteError, setInviteError] = useState("");
  const [singleInviteEmail, setSingleInviteEmail] = useState("");
  const [singleInviteLink, setSingleInviteLink] = useState("");
  const [singleInviteLoading, setSingleInviteLoading] = useState(false);
  const [envVarsLoading, setEnvVarsLoading] = useState(false);
  const [envVarsError, setEnvVarsError] = useState("");
  const [envBindingNames, setEnvBindingNames] = useState([]);
  const [envConfiguredVars, setEnvConfiguredVars] = useState([]);
  const [discountAdmin, setDiscountAdmin] = useState(null);
  const [discountLimitInput, setDiscountLimitInput] = useState("");
  const [discountAdminLoading, setDiscountAdminLoading] = useState(false);
  const [discountAdminSaving, setDiscountAdminSaving] = useState(false);
  const [discountAdminError, setDiscountAdminError] = useState("");
  const [discountAdminSaveMessage, setDiscountAdminSaveMessage] = useState("");
  const [showTestPaymentModal, setShowTestPaymentModal] = useState(false);
  const [testPaymentClientSecret, setTestPaymentClientSecret] = useState("");
  const [testPaymentLoading, setTestPaymentLoading] = useState(false);
  const [testPaymentProcessing, setTestPaymentProcessing] = useState(false);
  const [testPaymentError, setTestPaymentError] = useState("");
  const [testPaymentSuccessId, setTestPaymentSuccessId] = useState("");
  const [testPublishableKey, setTestPublishableKey] = useState("");
  const [testStripeModeInfo, setTestStripeModeInfo] = useState(null);

  const testStripePromise = useMemo(() => {
    if (!testPublishableKey) return null;
    return loadStripe(testPublishableKey);
  }, [testPublishableKey]);

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

      const [
        abstractsRes,
        visaRes,
        speakerHotelRes,
        registrationsRes,
        reviewersRes,
        reviewerAbstractScoresRes,
        speakerProfilesRes,
      ] = await Promise.all([
        fetch("/api/admin/abstracts", { headers: authHeaders }),
        fetch("/api/admin/visa-requests", { headers: authHeaders }),
        fetch("/api/admin/speaker-hotel-registrations", {
          headers: authHeaders,
        }),
        fetch("/api/registrations", { headers: authHeaders }),
        fetch("/api/admin/reviewers/overview", { headers: authHeaders }),
        fetch("/api/admin/reviewers/abstract-scores", { headers: authHeaders }),
        fetch("/api/admin/speaker-profiles", { headers: authHeaders }),
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
        const snippet = String(bodyText || "")
          .trim()
          .slice(0, 500);
        failureDetails.push(
          `${name}: HTTP ${res.status}${snippet ? ` — ${snippet}` : ""}`,
        );
      };

      await Promise.all([
        addFailure("GET /api/admin/abstracts", abstractsRes),
        addFailure("GET /api/admin/visa-requests", visaRes),
        addFailure(
          "GET /api/admin/speaker-hotel-registrations",
          speakerHotelRes,
        ),
        addFailure("GET /api/registrations", registrationsRes),
        addFailure("GET /api/admin/reviewers/overview", reviewersRes),
        addFailure(
          "GET /api/admin/reviewers/abstract-scores",
          reviewerAbstractScoresRes,
        ),
        addFailure("GET /api/admin/speaker-profiles", speakerProfilesRes),
      ]);

      if (failureDetails.length > 0) {
        throw new Error(
          `Failed to fetch admin data.\n${failureDetails.join("\n")}`,
        );
      }

      const abstractsData = await abstractsRes.json();
      const visaData = await visaRes.json();
      const speakerHotelData = await speakerHotelRes.json();
      const registrationsData = await registrationsRes.json();
      const reviewersData = await reviewersRes.json();
      const reviewerAbstractScoresData = await reviewerAbstractScoresRes.json();
      const speakerProfilesData = await speakerProfilesRes.json();

      setAbstracts(abstractsData.data || []);
      setVisaRequests(visaData.data || []);
      setSpeakerHotelRegistrations(speakerHotelData.data || []);
      setRegistrations(registrationsData.data || []);
      setReviewerOverview(reviewersData || null);
      if (reviewersData?.abstracts_per_reviewer != null) {
        setAbstractsPerReviewerInput(
          String(reviewersData.abstracts_per_reviewer),
        );
      }
      fetchReviewerAccounts(token);
      setReviewerAbstractScores(reviewerAbstractScoresData?.data || []);
      setSpeakerProfileSubmissions(speakerProfilesData.submissions || []);
      setReviewerOverviewError("");
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewerAccounts = async (token) => {
    try {
      const res = await fetch("/api/admin/reviewers/list", {
        headers: { "X-Admin-Token": token || adminToken },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return;
      setReviewerAccounts(data.reviewers || []);
      if (data.default_target != null) {
        setReviewerAccountsDefault(data.default_target);
      }
      const inputs = {};
      (data.reviewers || []).forEach((r) => {
        inputs[r.email] =
          r.abstracts_target != null ? String(r.abstracts_target) : "";
      });
      setReviewerTargetInputs(inputs);
    } catch (err) {
      console.error("Failed to load reviewer accounts:", err);
    }
  };

  const saveReviewerTarget = async (email) => {
    const raw = String(reviewerTargetInputs[email] ?? "").trim();
    let target = null;
    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        setReviewerTargetMessage({
          email,
          type: "error",
          text: "Enter a whole number between 1 and 100, or leave blank to use the default.",
        });
        return;
      }
      target = n;
    }
    setSavingReviewerTargetEmail(email);
    setReviewerTargetMessage(null);
    try {
      const res = await fetch("/api/admin/reviewers/target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({ email, abstracts_per_reviewer: target }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setReviewerAccounts((prev) =>
        prev.map((r) =>
          r.email === email ? { ...r, abstracts_target: target } : r,
        ),
      );
      setReviewerTargetMessage({
        email,
        type: "success",
        text:
          target == null
            ? `Cleared — uses the default (${reviewerAccountsDefault}).`
            : `Saved — ${target} abstract${target === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      setReviewerTargetMessage({
        email,
        type: "error",
        text: err.message || "Failed to save.",
      });
    } finally {
      setSavingReviewerTargetEmail(null);
    }
  };

  const saveAbstractsPerReviewer = async () => {
    const n = Number(abstractsPerReviewerInput);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      setAbstractsPerReviewerMessage({
        type: "error",
        text: "Enter a whole number between 1 and 100.",
      });
      return;
    }
    setSavingAbstractsPerReviewer(true);
    setAbstractsPerReviewerMessage(null);
    try {
      const res = await fetch("/api/admin/reviewers/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({ abstracts_per_reviewer: n }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setReviewerOverview((prev) =>
        prev ? { ...prev, abstracts_per_reviewer: n } : prev,
      );
      setAbstractsPerReviewerMessage({
        type: "success",
        text: `Saved. Reviewers will now be assigned ${n} abstract${n === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      setAbstractsPerReviewerMessage({
        type: "error",
        text: err.message || "Failed to save setting.",
      });
    } finally {
      setSavingAbstractsPerReviewer(false);
    }
  };

  const pendingSpeakerProfileCount = useMemo(() => {
    const list = Array.isArray(speakerProfileSubmissions)
      ? speakerProfileSubmissions
      : [];
    return list.filter((s) => String(s.status || "") === "pending").length;
  }, [speakerProfileSubmissions]);

  const filteredSpeakerProfileSubmissions = useMemo(() => {
    const list = Array.isArray(speakerProfileSubmissions)
      ? speakerProfileSubmissions
      : [];
    const q = speakerProfileSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => {
      const parts = [
        row.id,
        row.speaker_key,
        row.status,
        row.email,
        row.display_name,
        row.affiliation,
        row.first_name,
        row.middle_name,
        row.last_name,
        row.presentation_title,
        row.r2_key,
        row.cv_r2_key,
        row.image_position,
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .map((x) => String(x).toLowerCase());
      return parts.some((p) => p.includes(q));
    });
  }, [speakerProfileSubmissions, speakerProfileSearch]);

  const runSpeakerProfileAction = async (id, action) => {
    if (!adminToken?.trim() || !id) return;
    if (action === "delete") {
      const ok = window.confirm(
        "Delete this speaker from the website and remove their stored headshot and brief CV (if any) from file storage? This cannot be undone.",
      );
      if (!ok) return;
    }
    setSpeakerProfileActionId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/speaker-profiles/${encodeURIComponent(id)}/${action}`,
        {
          method: "POST",
          headers: { "X-Admin-Token": adminToken },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(
          data.error || `Failed to ${action} speaker profile (HTTP ${res.status})`,
        );
        return;
      }
      await fetchAllData(adminToken);
    } catch (e) {
      setError(e?.message || `Failed to ${action}`);
    } finally {
      setSpeakerProfileActionId(null);
    }
  };

  const updateTraineeLetterStatus = async (registrationId, status) => {
    if (!adminToken?.trim() || !registrationId || !status) return;
    setTraineeLetterActionId(registrationId);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}/trainee-letter-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(
          data.error ||
            `Failed to update trainee letter status (HTTP ${res.status})`,
        );
        return;
      }
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === registrationId
            ? { ...reg, trainee_letter_status: status }
            : reg,
        ),
      );
    } catch (e) {
      setError(e?.message || "Failed to update trainee letter status");
    } finally {
      setTraineeLetterActionId(null);
    }
  };

  const openTestPaymentModal = async () => {
    if (!adminToken.trim()) {
      setTestPaymentError(
        "Admin access token missing. Open /admin with ?admin=YOUR_TOKEN.",
      );
      return;
    }

    setShowTestPaymentModal(true);
    setTestPaymentLoading(true);
    setTestPaymentProcessing(false);
    setTestPaymentError("");
    setTestPaymentSuccessId("");
    setTestPaymentClientSecret("");
    setTestPublishableKey("");
    setTestStripeModeInfo(null);

    try {
      const res = await fetch("/api/admin/test-payment-intent", {
        method: "POST",
        headers: {
          "X-Admin-Token": adminToken,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.clientSecret) {
        throw new Error(data?.error || "Failed to create $1 test payment.");
      }
      if (!data?.publishableKey) {
        throw new Error("Server did not return a publishable key.");
      }
      setTestPaymentClientSecret(data.clientSecret);
      setTestPublishableKey(data.publishableKey);
      setTestStripeModeInfo({
        secretKeyMode: data.secretKeyMode || "unknown",
        publishableKeyMode: data.publishableKeyMode || "unknown",
      });
    } catch (err) {
      setTestPaymentError(
        err?.message || "Failed to start $1 test payment. Please try again.",
      );
    } finally {
      setTestPaymentLoading(false);
    }
  };

  const fetchEnvVars = useCallback(async () => {
    if (!adminToken.trim()) return;
    setEnvVarsLoading(true);
    setEnvVarsError("");
    try {
      const res = await fetch("/api/admin/env-vars", {
        method: "GET",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load environment variables.");
      }
      setEnvBindingNames(
        Array.isArray(data.availableBindings) ? data.availableBindings : [],
      );
      setEnvConfiguredVars(
        Array.isArray(data.configured) ? data.configured : [],
      );
    } catch (err) {
      setEnvVarsError(err?.message || "Failed to load environment variables.");
    } finally {
      setEnvVarsLoading(false);
    }
  }, [adminToken]);

  const fetchDiscountAdmin = useCallback(async () => {
    if (!adminToken.trim()) return;
    setDiscountAdminLoading(true);
    setDiscountAdminError("");
    try {
      const res = await fetch("/api/admin/discount-code", {
        method: "GET",
        headers: {
          "X-Admin-Token": adminToken,
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load discount settings.");
      }
      const discount = data?.discount || null;
      setDiscountAdmin(discount);
      setDiscountLimitInput(
        discount?.maxUses == null ? "" : String(discount.maxUses),
      );
    } catch (err) {
      setDiscountAdminError(err?.message || "Failed to load discount settings.");
    } finally {
      setDiscountAdminLoading(false);
    }
  }, [adminToken]);

  const saveDiscountUsageLimit = useCallback(async () => {
    if (!adminToken.trim()) return;
    setDiscountAdminSaving(true);
    setDiscountAdminError("");
    setDiscountAdminSaveMessage("");
    try {
      const payload = {
        maxUses:
          discountLimitInput.trim() === ""
            ? null
            : Number(discountLimitInput.trim()),
      };
      const res = await fetch("/api/admin/discount-code", {
        method: "PATCH",
        headers: {
          "X-Admin-Token": adminToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save discount settings.");
      }
      const discount = data?.discount || null;
      setDiscountAdmin(discount);
      setDiscountLimitInput(
        discount?.maxUses == null ? "" : String(discount.maxUses),
      );
      setDiscountAdminSaveMessage("Discount usage limit updated.");
    } catch (err) {
      setDiscountAdminError(err?.message || "Failed to save discount settings.");
    } finally {
      setDiscountAdminSaving(false);
    }
  }, [adminToken, discountLimitInput]);

  useEffect(() => {
    if (activeSection === "environment") {
      fetchEnvVars();
    }
    if (activeSection === "discount") {
      fetchDiscountAdmin();
    }
  }, [activeSection, fetchEnvVars, fetchDiscountAdmin]);

  const createReviewerAccount = async (email, abstractsCount) => {
    const body = { email };
    if (abstractsCount != null) {
      body.abstracts_per_reviewer = abstractsCount;
    }
    const res = await fetch("/api/admin/reviewers/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": adminToken.trim(),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.success !== true) {
      throw new Error(
        json?.error || `create failed (HTTP ${res.status})`,
      );
    }
    return json;
  };

  const handleGenerateSingleReviewer = async () => {
    setReviewerCreateError("");
    setSingleReviewerMessage("");
    setEmailCount(0);
    setEmailFileName("");

    const email = normalizeEmail(singleReviewerEmail);
    if (!email) {
      setReviewerCreateError("Enter a valid reviewer email address.");
      return;
    }

    let abstractsCount = null;
    const rawCount = String(singleReviewerCount).trim();
    if (rawCount !== "") {
      const n = Number(rawCount);
      if (!Number.isInteger(n) || n < 1 || n > 100) {
        setReviewerCreateError(
          "Number of abstracts must be a whole number between 1 and 100 (or leave it blank for the default).",
        );
        return;
      }
      abstractsCount = n;
    }

    if (!adminToken.trim()) {
      setReviewerCreateError(
        "Admin access token missing. Open /admin with ?admin=YOUR_TOKEN.",
      );
      return;
    }

    setSingleReviewerLoading(true);
    try {
      const json = await createReviewerAccount(email, abstractsCount);
      const countNote =
        abstractsCount != null
          ? ` They will be assigned ${abstractsCount} abstract${abstractsCount === 1 ? "" : "s"}.`
          : "";
      setSingleReviewerMessage(
        json.existing
          ? `${email} was already a reviewer (reactivated if needed). They can sign in with this email.${countNote}`
          : `${email} added as a reviewer. They can sign in with this email.${countNote}`,
      );
      setSingleReviewerEmail("");
      setSingleReviewerCount("");
      fetchReviewerAccounts();
    } catch (err) {
      console.error("Failed to create reviewer:", err);
      setReviewerCreateError(err?.message || "Failed to create reviewer.");
    } finally {
      setSingleReviewerLoading(false);
    }
  };

  const handleEmailFileChange = async (event) => {
    setReviewerCreateError("");
    setSingleReviewerMessage("");
    setEmailCount(0);
    const file = event.target.files?.[0];
    if (!file) return;

    setEmailFileName(file.name);

    if (!adminToken.trim()) {
      setReviewerCreateError(
        "Admin access token missing. Open /admin with ?admin=YOUR_TOKEN.",
      );
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        setReviewerCreateError("Could not read first sheet from file.");
        return;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) {
        setReviewerCreateError("Sheet is empty.");
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
        setReviewerCreateError(
          "No emails found. Make sure there is a column with email addresses.",
        );
        return;
      }

      const outputRows = [];
      let created = 0;

      for (const email of emails) {
        try {
          const json = await createReviewerAccount(email);
          outputRows.push({
            Email: email,
            Status: json.existing ? "Already existed (reactivated)" : "Created",
          });
          created += 1;
        } catch (err) {
          console.error("Error creating reviewer for email:", email, err);
          outputRows.push({
            Email: email,
            Status: `ERROR: ${err?.message || "network or server error"}`,
          });
        }
      }

      setEmailCount(created);
      fetchReviewerAccounts();

      const outSheet = XLSX.utils.json_to_sheet(outputRows);
      const outWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(outWb, outSheet, "Reviewers");
      const downloadName =
        "reviewers-" + new Date().toISOString().slice(0, 10) + ".xlsx";
      XLSX.writeFile(outWb, downloadName);
    } catch (e) {
      console.error("Error processing email Excel:", e);
      setReviewerCreateError(
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
    setSingleInviteLink("");

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
        return (
          val === "invite_link" || val === "invite link" || val === "invitelink"
        );
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

        row[inviteColIdx] =
          `${base}/registration?invite=${encodeURIComponent(token)}`;
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

  const handleGenerateSingleInvite = async () => {
    setInviteError("");
    setInviteCount(0);
    setInviteFileName("");
    setSingleInviteLink("");

    const email = normalizeEmail(singleInviteEmail);
    if (!email) {
      setInviteError("Enter a valid speaker email address.");
      return;
    }
    if (!adminToken.trim()) {
      setInviteError(
        "Admin token is required to generate speaker invites (stored + validated on the server).",
      );
      return;
    }

    setSingleInviteLoading(true);
    try {
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
          json?.error || `Failed to create invite for ${email} (HTTP ${res.status})`,
        );
      }

      const base = "https://isir2026.org";
      setSingleInviteLink(
        `${base}/registration?invite=${encodeURIComponent(String(json.token))}`,
      );
    } catch (err) {
      console.error("Failed to generate single invite link:", err);
      setInviteError(err?.message || "Failed to generate invite link.");
    } finally {
      setSingleInviteLoading(false);
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

  const toggleInvitedAbstract = (abstractId) => {
    setExpandedInvitedAbstracts((prev) => {
      const next = new Set(prev);
      if (next.has(abstractId)) {
        next.delete(abstractId);
      } else {
        next.add(abstractId);
      }
      return next;
    });
  };

  const toggleRegistrationExpanded = (registrationId) => {
    setExpandedRegistrationIds((prev) => {
      const next = new Set(prev);
      if (next.has(registrationId)) {
        next.delete(registrationId);
      } else {
        next.add(registrationId);
      }
      return next;
    });
  };

  // Get unique categories from abstracts
  const generalAbstracts = useMemo(() => {
    return abstracts.filter((a) => Number(a.is_invited_speaker || 0) !== 1);
  }, [abstracts]);

  const abstractCategories = useMemo(() => {
    const cats = new Set(
      generalAbstracts.map((a) => a.category).filter(Boolean),
    );
    return Array.from(cats).sort();
  }, [generalAbstracts]);

  // Get unique statuses from abstracts
  const abstractStatuses = useMemo(() => {
    const stats = new Set(
      generalAbstracts.map((a) => a.status).filter(Boolean),
    );
    return Array.from(stats).sort();
  }, [generalAbstracts]);

  // Filtered and sorted abstracts (general submissions only — no invited speakers)
  const filteredAbstracts = useMemo(() => {
    let result = [...generalAbstracts];

    // Search filter
    if (abstractSearch.trim()) {
      const search = abstractSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(search) ||
          a.abstract?.toLowerCase().includes(search) ||
          getAbstractTypeLabel(a).toLowerCase().includes(search) ||
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
    generalAbstracts,
    abstractSearch,
    abstractCategoryFilter,
    abstractStatusFilter,
    abstractSortBy,
  ]);

  // Invited speaker abstracts
  const invitedSpeakerAbstracts = useMemo(() => {
    let result = abstracts.filter(
      (a) => Number(a.is_invited_speaker || 0) === 1,
    );

    if (invitedAbstractSearch.trim()) {
      const search = invitedAbstractSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(search) ||
          a.abstract?.toLowerCase().includes(search) ||
          getAbstractTypeLabel(a).toLowerCase().includes(search) ||
          a.presenter_name?.toLowerCase().includes(search) ||
          a.presenter_email?.toLowerCase().includes(search) ||
          a.corresponding_name?.toLowerCase().includes(search) ||
          a.keywords?.toLowerCase().includes(search),
      );
    }

    result.sort(
      (a, b) => (b.submission_date || 0) - (a.submission_date || 0),
    );
    return result;
  }, [abstracts, invitedAbstractSearch]);

  // Abstract statistics (general submissions only)
  const abstractStats = useMemo(() => {
    const byCategory = {};
    const byStatus = {};
    const byPreference = { oral: 0, poster: 0, either: 0 };

    generalAbstracts.forEach((a) => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.presentation_preference) {
        byPreference[a.presentation_preference] =
          (byPreference[a.presentation_preference] || 0) + 1;
      }
    });

    return {
      byCategory,
      byStatus,
      byPreference,
      total: generalAbstracts.length,
    };
  }, [generalAbstracts]);

  // Pending review abstracts — one pool at a time (general XOR invited)
  const allInvitedAbstracts = useMemo(() => {
    return abstracts.filter((a) => Number(a.is_invited_speaker || 0) === 1);
  }, [abstracts]);

  const pendingGeneralReviewAbstracts = useMemo(() => {
    return generalAbstracts.filter((a) => a.status === "submitted");
  }, [generalAbstracts]);

  const pendingInvitedReviewAbstracts = useMemo(() => {
    return allInvitedAbstracts.filter((a) => a.status === "submitted");
  }, [allInvitedAbstracts]);

  const pendingReviewAbstracts = useMemo(() => {
    return reviewPool === "invited"
      ? pendingInvitedReviewAbstracts
      : pendingGeneralReviewAbstracts;
  }, [
    reviewPool,
    pendingInvitedReviewAbstracts,
    pendingGeneralReviewAbstracts,
  ]);

  const reviewPoolAbstracts =
    reviewPool === "invited" ? allInvitedAbstracts : generalAbstracts;

  // Current abstract being reviewed
  const currentReviewAbstract = pendingReviewAbstracts[reviewIndex] || null;

  const currentReviewScoreData = useMemo(() => {
    if (!currentReviewAbstract?.id) return null;
    return (
      (reviewerAbstractScores || []).find(
        (item) => item.id === currentReviewAbstract.id,
      ) || null
    );
  }, [currentReviewAbstract, reviewerAbstractScores]);

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

  const updateAbstractInvitedSpeaker = async (abstractId, isInvitedSpeaker) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    const nextValue = isInvitedSpeaker ? 1 : 0;
    const confirmMsg = isInvitedSpeaker
      ? "Mark this abstract as an invited speaker submission? It will move to Invited Speakers Abstracts."
      : "Remove invited speaker status? This abstract will move back to Abstract Submissions.";
    if (!window.confirm(confirmMsg)) return;

    setUpdatingInvitedSpeakerId(abstractId);
    try {
      const response = await fetch(
        `/api/admin/abstracts/${abstractId}/invited-speaker`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
          body: JSON.stringify({ isInvitedSpeaker: nextValue }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to update invited speaker status",
        );
      }

      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstractId
            ? { ...a, is_invited_speaker: nextValue }
            : a,
        ),
      );
    } catch (err) {
      console.error("Error updating invited speaker status:", err);
      alert(err.message || "Failed to update invited speaker status");
    } finally {
      setUpdatingInvitedSpeakerId(null);
    }
  };

  const updateAbstractSpeakers = async (
    abstractId,
    presenterAuthorId,
    correspondingAuthorId,
  ) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    if (!presenterAuthorId || !correspondingAuthorId) {
      alert("Both presenting and corresponding authors are required.");
      return;
    }

    setUpdatingSpeakersId(abstractId);
    try {
      const response = await fetch(
        `/api/admin/abstracts/${abstractId}/speakers`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
          body: JSON.stringify({
            presenterAuthorId,
            correspondingAuthorId,
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to update abstract speakers");
      }

      const updated = result.data || {};
      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstractId
            ? {
                ...a,
                presenter_name: updated.presenter_name ?? a.presenter_name,
                presenter_email: updated.presenter_email ?? a.presenter_email,
                presenter_author_id:
                  updated.presenter_author_id ?? a.presenter_author_id,
                corresponding_name:
                  updated.corresponding_name ?? a.corresponding_name,
                corresponding_email:
                  updated.corresponding_email ?? a.corresponding_email,
                corresponding_author_id:
                  updated.corresponding_author_id ?? a.corresponding_author_id,
                authors: updated.authors || a.authors,
              }
            : a,
        ),
      );
    } catch (err) {
      console.error("Error updating abstract speakers:", err);
      alert(err.message || "Failed to update abstract speakers");
    } finally {
      setUpdatingSpeakersId(null);
    }
  };

  const acceptAllInvitedSpeakerAbstracts = async () => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }

    const pending = abstracts.filter(
      (a) =>
        Number(a.is_invited_speaker || 0) === 1 &&
        String(a.status || "").toLowerCase() !== "accepted",
    );

    if (pending.length === 0) {
      alert("All invited speaker abstracts are already accepted.");
      return;
    }

    if (
      !window.confirm(
        `Accept all ${pending.length} invited speaker abstract${
          pending.length === 1 ? "" : "s"
        } that are not already accepted? This does not send decision emails.`,
      )
    ) {
      return;
    }

    setAcceptingAllInvitedSpeakers(true);
    try {
      const response = await fetch(
        "/api/admin/abstracts/accept-invited-speakers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to accept invited speaker abstracts",
        );
      }

      const updatedIds = new Set(result.ids || pending.map((a) => a.id));
      setAbstracts((prev) =>
        prev.map((a) =>
          updatedIds.has(a.id)
            ? { ...a, status: "accepted", rejection_reason: null }
            : a,
        ),
      );

      alert(
        result.message ||
          `Accepted ${result.updated ?? pending.length} invited speaker abstract(s).`,
      );
    } catch (err) {
      console.error("Error accepting invited speaker abstracts:", err);
      alert(err.message || "Failed to accept invited speaker abstracts");
    } finally {
      setAcceptingAllInvitedSpeakers(false);
    }
  };

  // Send (or resend) confirmation email for a single abstract. Used both for
  // one-off resends and for retroactively sending confirmations to authors
  // who submitted before automatic confirmation emails were enabled.
  const sendAbstractConfirmation = async (abstractId) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    setSendingConfirmationId(abstractId);
    try {
      const response = await fetch(
        `/api/admin/abstracts/${abstractId}/send-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send confirmation email");
      }

      const sentAt = result.sentAt || Date.now();
      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstractId ? { ...a, confirmation_sent_at: sentAt } : a,
        ),
      );
      alert(`Confirmation email sent to ${result.sentTo || "author"}.`);
    } catch (err) {
      console.error("Error sending confirmation email:", err);
      alert(err.message || "Failed to send confirmation email");
    } finally {
      setSendingConfirmationId(null);
    }
  };

  const decidedAbstractsNeedingEmail = useMemo(() => {
    return generalAbstracts.filter((a) => {
      const s = String(a.status || "").toLowerCase();
      return (
        (s === "accepted" || s === "rejected") && !a.decision_email_sent_at
      );
    });
  }, [generalAbstracts]);

  // Manually notify author of accept/reject (not automatic on status change).
  const sendAbstractDecision = async (abstractId) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    const abstract = abstracts.find((a) => a.id === abstractId);
    const status = String(abstract?.status || "").toLowerCase();
    if (status !== "accepted" && status !== "rejected") {
      alert("Mark the abstract as accepted or rejected before sending.");
      return;
    }
    if (
      !window.confirm(
        status === "accepted"
          ? `Send acceptance email to ${
              abstract?.corresponding_email ||
              abstract?.presenter_email ||
              "the author"
            }?`
          : `Send rejection email to ${
              abstract?.corresponding_email ||
              abstract?.presenter_email ||
              "the author"
            }?`,
      )
    ) {
      return;
    }

    setSendingDecisionId(abstractId);
    try {
      const response = await fetch(
        `/api/admin/abstracts/${abstractId}/send-decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send decision email");
      }

      const sentAt = result.sentAt || Date.now();
      setAbstracts((prev) =>
        prev.map((a) =>
          a.id === abstractId ? { ...a, decision_email_sent_at: sentAt } : a,
        ),
      );
      alert(
        status === "accepted"
          ? `Acceptance email sent to ${result.sentTo || "author"}.`
          : `Rejection email sent to ${result.sentTo || "author"}.`,
      );
    } catch (err) {
      console.error("Error sending decision email:", err);
      alert(err.message || "Failed to send decision email");
    } finally {
      setSendingDecisionId(null);
    }
  };

  const bulkSendAbstractDecisions = async (onlyMissing = true) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    const decided = generalAbstracts.filter((a) => {
      const s = String(a.status || "").toLowerCase();
      return s === "accepted" || s === "rejected";
    });
    const missingCount = decided.filter((a) => !a.decision_email_sent_at)
      .length;
    const targetCount = onlyMissing ? missingCount : decided.length;

    if (targetCount === 0) {
      alert(
        onlyMissing
          ? "All accepted/rejected abstracts already have a decision email on record."
          : "There are no accepted/rejected abstracts to email.",
      );
      return;
    }

    const verb = onlyMissing ? "send" : "resend";
    const noun = onlyMissing
      ? `the ${missingCount} accepted/rejected abstract${
          missingCount === 1 ? "" : "s"
        } missing a decision email`
      : `all ${decided.length} accepted/rejected abstract${
          decided.length === 1 ? "" : "s"
        }`;
    if (
      !window.confirm(
        `About to ${verb} decision emails to ${noun}. Continue?`,
      )
    ) {
      return;
    }

    setBulkSendingDecisions(true);
    setDecisionSendSummary(null);
    try {
      const response = await fetch("/api/admin/abstracts/send-decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          onlyMissing,
          abstractIds: decided.map((a) => a.id),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send decision emails");
      }

      const sentAtById = {};
      (result.results || []).forEach((r) => {
        if (r.status === "sent" && r.sentAt) {
          sentAtById[r.id] = r.sentAt;
        }
      });
      if (Object.keys(sentAtById).length > 0) {
        setAbstracts((prev) =>
          prev.map((a) =>
            sentAtById[a.id]
              ? { ...a, decision_email_sent_at: sentAtById[a.id] }
              : a,
          ),
        );
      }

      setDecisionSendSummary({
        sent: result.sent || 0,
        skipped: result.skipped || 0,
        failed: result.failed || 0,
        failedIds: (result.results || [])
          .filter((r) => r.status === "failed")
          .map((r) => r.id),
      });
      alert(
        `Decision emails: ${result.sent || 0} sent, ${
          result.skipped || 0
        } skipped, ${result.failed || 0} failed.`,
      );
    } catch (err) {
      console.error("Error bulk sending decision emails:", err);
      alert(err.message || "Failed to send decision emails");
    } finally {
      setBulkSendingDecisions(false);
    }
  };

  // Retroactively send confirmation emails to abstracts that have not yet
  // received one. When onlyMissing is false, resends to every abstract.
  const bulkSendAbstractConfirmations = async (onlyMissing = true) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    const missingCount = generalAbstracts.filter(
      (a) => !a.confirmation_sent_at,
    ).length;
    const targetCount = onlyMissing ? missingCount : generalAbstracts.length;

    if (targetCount === 0) {
      alert(
        onlyMissing
          ? "All abstracts already have a confirmation email on record."
          : "There are no abstracts to send to.",
      );
      return;
    }

    const verb = onlyMissing ? "send" : "resend";
    const noun = onlyMissing
      ? `the ${missingCount} abstract${missingCount === 1 ? "" : "s"} missing a confirmation`
      : `all ${generalAbstracts.length} abstract${generalAbstracts.length === 1 ? "" : "s"}`;
    if (
      !window.confirm(
        `About to ${verb} confirmation emails to ${noun}. Continue?`,
      )
    ) {
      return;
    }

    setBulkSendingConfirmations(true);
    setConfirmationSendSummary(null);
    try {
      const response = await fetch("/api/admin/abstracts/send-confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          onlyMissing,
          abstractIds: generalAbstracts.map((a) => a.id),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send confirmation emails");
      }

      const sentMap = new Map();
      (result.results || []).forEach((r) => {
        if (r.status === "sent" && r.sentAt) {
          sentMap.set(r.id, r.sentAt);
        }
      });
      if (sentMap.size > 0) {
        setAbstracts((prev) =>
          prev.map((a) =>
            sentMap.has(a.id)
              ? { ...a, confirmation_sent_at: sentMap.get(a.id) }
              : a,
          ),
        );
      }

      setConfirmationSendSummary({
        sent: result.sent || 0,
        skipped: result.skipped || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        onlyMissing,
        failures: (result.results || [])
          .filter((r) => r.status === "failed")
          .slice(0, 20),
      });
    } catch (err) {
      console.error("Bulk confirmation send error:", err);
      alert(err.message || "Failed to send confirmation emails");
    } finally {
      setBulkSendingConfirmations(false);
    }
  };

  // Send (or resend) confirmation email for a single registration.
  const sendRegistrationConfirmation = async (registrationId) => {
    if (!adminToken) {
      alert("Admin access token is missing.");
      return;
    }
    setSendingRegistrationConfirmationId(registrationId);
    try {
      const response = await fetch(
        `/api/admin/registrations/${registrationId}/send-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Failed to send registration confirmation email",
        );
      }
      alert(
        `Registration confirmation email sent to ${result.sentTo || "attendee"}.`,
      );
    } catch (err) {
      console.error("Error sending registration confirmation email:", err);
      alert(err.message || "Failed to send registration confirmation email");
    } finally {
      setSendingRegistrationConfirmationId(null);
    }
  };

  const openRegistrationQrGenerator = (registrationId) => {
    if (!registrationId) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      String(registrationId),
    )}`;
    window.open(qrUrl, "_blank", "noopener,noreferrer");
  };

  // Start review mode for one pool only (general or invited)
  const startReviewMode = (pool = "general") => {
    const nextPool = pool === "invited" ? "invited" : "general";
    setReviewPool(nextPool);
    setReviewIndex(0);
    setAbstractViewMode("review");
    setActiveSection(
      nextPool === "invited" ? "invitedSpeakerAbstracts" : "abstracts",
    );
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
      "Abstract Type",
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
      getAbstractTypeLabel(a),
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

  const exportSpeakerHotelToCSV = () => {
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = [
      "invited_speaker_email",
      "passport_name",
      "nationality",
      "guest_count",
      "address_physical",
      "contact_email",
      "phone",
      "arrival_date",
      "departure_date",
      "created_at",
      "updated_at",
    ];

    const rows = (
      speakerHotelNameSort
        ? [...speakerHotelRegistrations].sort((a, b) => {
            const cmp = String(a.passport_name || "").localeCompare(
              String(b.passport_name || ""),
              undefined,
              { sensitivity: "base" },
            );
            return speakerHotelNameSort === "asc" ? cmp : -cmp;
          })
        : speakerHotelRegistrations
    ).map((row) =>
      [
        row.invited_speaker_email,
        row.passport_name,
        row.nationality,
        row.guest_count,
        row.address_physical,
        row.contact_email,
        row.phone,
        row.arrival_date,
        row.departure_date,
        formatDate(row.created_at),
        formatDate(row.updated_at),
      ].map(esc),
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `speaker-hotel-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          Manage submissions, reviewer scores, visa and speaker hotel requests,
          and registrations
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Abstracts</span>
            <span className="text-white font-bold ml-2">
              {generalAbstracts.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Invited abstracts</span>
            <span className="text-white font-bold ml-2">
              {abstracts.length - generalAbstracts.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Visa Requests</span>
            <span className="text-white font-bold ml-2">
              {visaRequests.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Speaker hotel</span>
            <span className="text-white font-bold ml-2">
              {speakerHotelRegistrations.length}
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
          onClick={() => {
            setActiveSection("abstracts");
            if (abstractViewMode === "review" && reviewPool === "invited") {
              setAbstractViewMode("cards");
            }
          }}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "abstracts" &&
            !(abstractViewMode === "review" && reviewPool === "invited")
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Abstract Submissions
        </button>
        <button
          onClick={() => {
            setActiveSection("invitedSpeakerAbstracts");
            if (abstractViewMode === "review" && reviewPool === "general") {
              setAbstractViewMode("cards");
            }
          }}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "invitedSpeakerAbstracts" ||
            (abstractViewMode === "review" && reviewPool === "invited")
              ? "bg-orange-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Invited Speakers Abstracts
        </button>
        <button
          onClick={() => setActiveSection("abstractReviewScores")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "abstractReviewScores"
              ? "bg-teal-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Abstract review scores
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
          onClick={() => setActiveSection("speakerHotel")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "speakerHotel"
              ? "bg-cyan-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Speaker hotel
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
          onClick={() => setActiveSection("registrationTotals")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "registrationTotals"
              ? "bg-amber-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Totals
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
          onClick={() => setActiveSection("addReviewers")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "addReviewers"
              ? "bg-purple-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Add Reviewers
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
        <button
          onClick={() => setActiveSection("speakerProfiles")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "speakerProfiles"
              ? "bg-rose-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Speaker profile queue
          {pendingSpeakerProfileCount > 0 ? (
            <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-white/25 px-1.5 text-xs">
              {pendingSpeakerProfileCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveSection("discount")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "discount"
              ? "bg-lime-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Discount
        </button>
        <button
          onClick={() => setActiveSection("environment")}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeSection === "environment"
              ? "bg-slate-700 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Environment
        </button>
      </div>

      {/* Abstract Submissions Section (+ invited review mode reuses review UI) */}
      {(activeSection === "abstracts" ||
        (activeSection === "invitedSpeakerAbstracts" &&
          abstractViewMode === "review" &&
          reviewPool === "invited")) && (
        <div className="space-y-6">
          {!(abstractViewMode === "review" && reviewPool === "invited") && (
          <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Abstract Submissions
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                General abstract submissions only (invited speaker talks are
                under{" "}
                <button
                  type="button"
                  onClick={() => setActiveSection("invitedSpeakerAbstracts")}
                  className="text-orange-700 font-semibold hover:underline"
                >
                  Invited Speakers Abstracts
                </button>
                ). Browse full text, keywords, and author details; update
                acceptance status; export a list. For Gusdon reviewer scores,
                category averages, notes, and COI details, open{" "}
                <button
                  type="button"
                  onClick={() => setActiveSection("abstractReviewScores")}
                  className="text-teal-700 font-semibold hover:underline"
                >
                  Abstract review scores
                </button>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSection("abstractReviewScores")}
                className="px-4 py-2.5 bg-white border border-teal-200 text-teal-800 rounded-lg hover:bg-teal-50 transition-colors shadow-sm flex items-center gap-2 font-medium"
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Reviewer scores ({abstractReviewRollupStats.withReviews}/
                {abstractReviewRollupStats.total})
              </button>
              {pendingGeneralReviewAbstracts.length > 0 && (
                <button
                  onClick={() => startReviewMode("general")}
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
                  Review general ({pendingGeneralReviewAbstracts.length})
                </button>
              )}
              <button
                onClick={() => bulkSendAbstractConfirmations(true)}
                disabled={bulkSendingConfirmations}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                title="Send confirmation emails retroactively to every abstract that doesn't have one yet"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 11H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z"
                  />
                </svg>
                {bulkSendingConfirmations
                  ? "Sending…"
                  : `Send missing confirmations (${
                      generalAbstracts.filter((a) => !a.confirmation_sent_at)
                        .length
                    })`}
              </button>
              <button
                onClick={() => bulkSendAbstractDecisions(true)}
                disabled={bulkSendingDecisions}
                className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                title="Manually email authors whose abstracts are accepted or rejected and have not yet received a decision email"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 11H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z"
                  />
                </svg>
                {bulkSendingDecisions
                  ? "Sending decisions…"
                  : `Send missing decisions (${decidedAbstractsNeedingEmail.length})`}
              </button>
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

          {confirmationSendSummary && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 text-sm text-indigo-900">
                <p className="font-semibold">
                  Confirmation email batch complete
                </p>
                <p className="mt-1">
                  Sent <strong>{confirmationSendSummary.sent}</strong>, skipped{" "}
                  <strong>{confirmationSendSummary.skipped}</strong>, failed{" "}
                  <strong>{confirmationSendSummary.failed}</strong> out of{" "}
                  {confirmationSendSummary.total}
                  {confirmationSendSummary.onlyMissing
                    ? " (only those missing a prior confirmation)"
                    : " (all abstracts)"}
                  .
                </p>
                {confirmationSendSummary.failures?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Show failures ({confirmationSendSummary.failures.length})
                    </summary>
                    <ul className="mt-2 text-xs list-disc pl-5 space-y-1">
                      {confirmationSendSummary.failures.map((f) => (
                        <li key={f.id}>
                          <span className="font-mono">{f.id}</span>: {f.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <button
                type="button"
                onClick={() => setConfirmationSendSummary(null)}
                className="text-indigo-600 hover:text-indigo-800"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {decisionSendSummary && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 text-sm text-orange-900">
                <p className="font-semibold">Decision email batch complete</p>
                <p className="mt-1">
                  Sent <strong>{decisionSendSummary.sent}</strong>, skipped{" "}
                  <strong>{decisionSendSummary.skipped}</strong>, failed{" "}
                  <strong>{decisionSendSummary.failed}</strong>.
                </p>
                {decisionSendSummary.failedIds?.length > 0 && (
                  <p className="mt-1 text-xs font-mono">
                    Failed: {decisionSendSummary.failedIds.join(", ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDecisionSendSummary(null)}
                className="text-orange-600 hover:text-orange-800"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

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
                  {generalAbstracts.length}
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

          </>
          )}

          {/* Review Mode UI */}
          {abstractViewMode === "review" ? (
            <div className="space-y-6">
              {/* Review Mode Header */}
              <div
                className={`rounded-xl p-6 text-white ${
                  reviewPool === "invited"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
                }`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-xl font-bold">
                      Review Mode —{" "}
                      {reviewPool === "invited"
                        ? "Invited speakers"
                        : "General submissions"}
                    </h3>
                    <p
                      className={`mt-1 ${
                        reviewPool === "invited"
                          ? "text-orange-100"
                          : "text-blue-100"
                      }`}
                    >
                      {pendingReviewAbstracts.length === 0
                        ? `All ${
                            reviewPool === "invited" ? "invited" : "general"
                          } abstracts have been reviewed!`
                        : `${reviewIndex + 1} of ${pendingReviewAbstracts.length} pending ${
                            reviewPool === "invited" ? "invited" : "general"
                          } abstracts`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-lg overflow-hidden border border-white/30 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewPool("general");
                          setReviewIndex(0);
                          setActiveSection("abstracts");
                        }}
                        className={`px-3 py-2 font-medium transition-colors ${
                          reviewPool === "general"
                            ? "bg-white text-blue-700"
                            : "bg-white/15 hover:bg-white/25 text-white"
                        }`}
                      >
                        General ({pendingGeneralReviewAbstracts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewPool("invited");
                          setReviewIndex(0);
                          setActiveSection("invitedSpeakerAbstracts");
                        }}
                        className={`px-3 py-2 font-medium transition-colors ${
                          reviewPool === "invited"
                            ? "bg-white text-orange-700"
                            : "bg-white/15 hover:bg-white/25 text-white"
                        }`}
                      >
                        Invited ({pendingInvitedReviewAbstracts.length})
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setAbstractViewMode("cards");
                        if (reviewPool === "invited") {
                          setActiveSection("invitedSpeakerAbstracts");
                        }
                      }}
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
                </div>
                {pendingReviewAbstracts.length > 0 && (
                  <div className="mt-4">
                    <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300"
                        style={{
                          width: `${
                            reviewPoolAbstracts.length > 0
                              ? ((reviewPoolAbstracts.length -
                                  pendingReviewAbstracts.length) /
                                  reviewPoolAbstracts.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p
                      className={`text-sm mt-2 ${
                        reviewPool === "invited"
                          ? "text-orange-100"
                          : "text-blue-100"
                      }`}
                    >
                      {reviewPoolAbstracts.length -
                        pendingReviewAbstracts.length}{" "}
                      of {reviewPoolAbstracts.length}{" "}
                      {reviewPool === "invited" ? "invited" : "general"}{" "}
                      abstracts reviewed
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
                      {reviewPool === "invited" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 ring-1 ring-orange-200">
                          Invited speaker
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {currentReviewAbstract.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">
                        {getAbstractTypeLabel(currentReviewAbstract)}
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
                        <AbstractSpeakerControls
                          abstract={currentReviewAbstract}
                          onSave={updateAbstractSpeakers}
                          saving={
                            updatingSpeakersId === currentReviewAbstract.id
                          }
                        />
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

                    {/* Reviewer scores */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Reviewer scores
                      </h4>
                      {(() => {
                        const summary =
                          currentReviewScoreData?.review_summary || {};
                        const reviewCount = Number(summary.review_count || 0);
                        const avgValue = (v) =>
                          v != null && !Number.isNaN(Number(v))
                            ? Number(v).toFixed(2)
                            : "—";
                        if (reviewCount === 0) {
                          return (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                              No reviewer scores submitted for this abstract
                              yet.
                            </p>
                          );
                        }
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                              <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-3">
                                <p className="text-indigo-600 font-medium">
                                  Reviews
                                </p>
                                <p className="text-lg font-bold text-indigo-900 mt-1">
                                  {reviewCount}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <p className="text-gray-500">Originality</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">
                                  {avgValue(summary.avg_originality)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <p className="text-gray-500">Clarity</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">
                                  {avgValue(summary.avg_clarity)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <p className="text-gray-500">Study design</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">
                                  {avgValue(summary.avg_study_design)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                <p className="text-gray-500">Data analysis</p>
                                <p className="text-base font-semibold text-gray-900 mt-1">
                                  {avgValue(summary.avg_data_analysis)}
                                </p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-3">
                                <p className="text-emerald-700 font-medium">
                                  Avg total
                                </p>
                                <p className="text-lg font-bold text-emerald-900 mt-1">
                                  {avgValue(summary.avg_total)}
                                </p>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <thead className="bg-gray-100 text-gray-600">
                                  <tr>
                                    <th className="text-left px-3 py-2">
                                      Reviewer
                                    </th>
                                    <th className="text-left px-3 py-2">
                                      Scores
                                    </th>
                                    <th className="text-left px-3 py-2">
                                      Notes
                                    </th>
                                    <th className="text-left px-3 py-2">
                                      COI
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(
                                    currentReviewScoreData?.reviewer_reviews ||
                                    []
                                  ).map((rev, idx) => {
                                    const coiFlags = [];
                                    if (rev.coi_mentor_pi)
                                      coiFlags.push("Mentor/PI");
                                    if (rev.coi_same_lab)
                                      coiFlags.push("Same lab");
                                    if (rev.coi_other)
                                      coiFlags.push("Other COI");
                                    return (
                                      <tr
                                        key={`${currentReviewAbstract.id}-${rev.reviewer_email}-${idx}`}
                                        className="border-t border-gray-100 align-top"
                                      >
                                        <td className="px-3 py-2 text-gray-800">
                                          {rev.reviewer_email}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                          O:{rev.originality ?? "—"} C:
                                          {rev.clarity ?? "—"} SD:
                                          {rev.study_design ?? "—"} DA:
                                          {rev.data_analysis ?? "—"} S:
                                          {rev.significance ?? "—"}{" "}
                                          <span className="font-semibold">
                                            T:{rev.total ?? "—"}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 max-w-sm whitespace-pre-wrap">
                                          {rev.previous_study_notes || "—"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 max-w-xs whitespace-pre-wrap">
                                          {coiFlags.length > 0
                                            ? coiFlags.join(", ")
                                            : "None"}
                                          {rev.coi_other_details
                                            ? `\n${rev.coi_other_details}`
                                            : ""}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
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
                    All{" "}
                    {reviewPool === "invited" ? "invited speaker" : "general"}{" "}
                    abstracts have been reviewed.
                    {reviewPool === "general" &&
                    pendingInvitedReviewAbstracts.length > 0
                      ? ` ${pendingInvitedReviewAbstracts.length} invited abstract${
                          pendingInvitedReviewAbstracts.length === 1
                            ? ""
                            : "s"
                        } still pending — switch pools above to review them.`
                      : reviewPool === "invited" &&
                          pendingGeneralReviewAbstracts.length > 0
                        ? ` ${pendingGeneralReviewAbstracts.length} general abstract${
                            pendingGeneralReviewAbstracts.length === 1
                              ? ""
                              : "s"
                          } still pending — switch pools above to review them.`
                        : ""}
                  </p>
                  <button
                    onClick={() => {
                      setAbstractViewMode("cards");
                      if (reviewPool === "invited") {
                        setActiveSection("invitedSpeakerAbstracts");
                      }
                    }}
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
                      Type
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
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
                          {getAbstractTypeLabel(abstract)}
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
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200">
                              {getAbstractTypeLabel(abstract)}
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
                            <AbstractSpeakerControls
                              abstract={abstract}
                              onSave={updateAbstractSpeakers}
                              saving={updatingSpeakersId === abstract.id}
                            />
                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-semibold text-gray-700">
                                      Confirmation email:
                                    </span>{" "}
                                    {abstract.confirmation_sent_at ? (
                                      <span className="text-emerald-700">
                                        Sent{" "}
                                        {formatDate(
                                          abstract.confirmation_sent_at,
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-amber-700">
                                        Not sent
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendAbstractConfirmation(abstract.id);
                                    }}
                                    disabled={
                                      sendingConfirmationId === abstract.id
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {sendingConfirmationId === abstract.id
                                      ? "Sending…"
                                      : abstract.confirmation_sent_at
                                        ? "Resend confirmation"
                                        : "Send confirmation"}
                                  </button>
                                </div>
                              </div>
                              {(String(abstract.status || "").toLowerCase() ===
                                "accepted" ||
                                String(abstract.status || "").toLowerCase() ===
                                  "rejected") && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="text-xs text-gray-600">
                                      <span className="font-semibold text-gray-700">
                                        {String(
                                          abstract.status || "",
                                        ).toLowerCase() === "accepted"
                                          ? "Acceptance email:"
                                          : "Rejection email:"}
                                      </span>{" "}
                                      {abstract.decision_email_sent_at ? (
                                        <span className="text-emerald-700">
                                          Sent{" "}
                                          {formatDate(
                                            abstract.decision_email_sent_at,
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-amber-700">
                                          Not sent
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendAbstractDecision(abstract.id);
                                      }}
                                      disabled={
                                        sendingDecisionId === abstract.id
                                      }
                                      className={`px-3 py-1.5 text-xs font-medium rounded-md text-white disabled:opacity-60 disabled:cursor-not-allowed ${
                                        String(
                                          abstract.status || "",
                                        ).toLowerCase() === "accepted"
                                          ? "bg-emerald-600 hover:bg-emerald-700"
                                          : "bg-red-600 hover:bg-red-700"
                                      }`}
                                    >
                                      {sendingDecisionId === abstract.id
                                        ? "Sending…"
                                        : String(
                                              abstract.status || "",
                                            ).toLowerCase() === "accepted"
                                          ? abstract.decision_email_sent_at
                                            ? "Resend acceptance email"
                                            : "Send acceptance email"
                                          : abstract.decision_email_sent_at
                                            ? "Resend rejection email"
                                            : "Send rejection email"}
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-semibold text-gray-700">
                                      Invited speaker:
                                    </span>{" "}
                                    <span className="text-gray-500">No</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateAbstractInvitedSpeaker(
                                        abstract.id,
                                        true,
                                      );
                                    }}
                                    disabled={
                                      updatingInvitedSpeakerId === abstract.id
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {updatingInvitedSpeakerId === abstract.id
                                      ? "Updating…"
                                      : "Mark as invited speaker"}
                                  </button>
                                </div>
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

      {/* Invited Speakers Abstracts */}
      {activeSection === "invitedSpeakerAbstracts" &&
        !(abstractViewMode === "review" && reviewPool === "invited") && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Invited Speakers Abstracts
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                Abstracts marked as invited speaker talks. Use{" "}
                <span className="font-medium text-gray-700">Review</span> to
                accept or reject them one by one (with reviewer scores), or{" "}
                <span className="font-medium text-gray-700">
                  Accept all invited speakers
                </span>{" "}
                to mark every non-accepted one as accepted.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => startReviewMode("invited")}
                disabled={pendingInvitedReviewAbstracts.length === 0}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                title={
                  pendingInvitedReviewAbstracts.length === 0
                    ? "No submitted invited abstracts to review"
                    : "Review invited speaker abstracts only"
                }
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
                Review ({pendingInvitedReviewAbstracts.length})
              </button>
              <button
                type="button"
                onClick={acceptAllInvitedSpeakerAbstracts}
                disabled={
                  acceptingAllInvitedSpeakers ||
                  abstracts.filter(
                    (a) =>
                      Number(a.is_invited_speaker || 0) === 1 &&
                      String(a.status || "").toLowerCase() !== "accepted",
                  ).length === 0
                }
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {acceptingAllInvitedSpeakers
                  ? "Accepting…"
                  : "Accept all invited speakers"}
              </button>
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">
                  {invitedSpeakerAbstracts.length}
                </span>{" "}
                invited abstract
                {invitedSpeakerAbstracts.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Search
            </label>
            <input
              type="search"
              value={invitedAbstractSearch}
              onChange={(e) => setInvitedAbstractSearch(e.target.value)}
              placeholder="Title, presenter, keywords…"
              className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
              Loading abstracts…
            </div>
          ) : invitedSpeakerAbstracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">
                {invitedAbstractSearch.trim()
                  ? "No invited speaker abstracts match your search"
                  : "No invited speaker abstracts yet"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Abstracts marked as invited speaker submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitedSpeakerAbstracts.map((abstract) => {
                const isExpanded = expandedInvitedAbstracts.has(abstract.id);
                return (
                  <div
                    key={abstract.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => toggleInvitedAbstract(abstract.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                            {abstract.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 ring-1 ring-orange-200">
                              Invited speaker
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                              {abstract.category}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200">
                              {getAbstractTypeLabel(abstract)}
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
                          <p className="text-sm text-gray-500 mt-3">
                            {abstract.presenter_name}
                            {abstract.presenter_email ? (
                              <span className="text-gray-400">
                                {" "}
                                ({abstract.presenter_email})
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleInvitedAbstract(abstract.id);
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

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/50">
                        <div className="grid md:grid-cols-2 gap-6 pt-5">
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Abstract
                            </h4>
                            <div className="bg-white p-4 rounded-lg border border-gray-100">
                              {formatAbstractText(abstract.abstract)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Keywords
                            </h4>
                            <p className="text-gray-600">{abstract.keywords}</p>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                              Contact Information
                            </h4>
                            <AbstractSpeakerControls
                              abstract={abstract}
                              onSave={updateAbstractSpeakers}
                              saving={updatingSpeakersId === abstract.id}
                            />
                          </div>

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

                          <div className="md:col-span-2">
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="text-xs text-gray-600">
                                  <span className="font-semibold text-gray-700">
                                    Invited speaker:
                                  </span>{" "}
                                  <span className="text-orange-700">Yes</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateAbstractInvitedSpeaker(
                                      abstract.id,
                                      false,
                                    );
                                  }}
                                  disabled={
                                    updatingInvitedSpeakerId === abstract.id
                                  }
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {updatingInvitedSpeakerId === abstract.id
                                    ? "Updating…"
                                    : "Move to general submissions"}
                                </button>
                              </div>
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

      {/* Abstract review scores (Gusdon reviewer averages & notes) */}
      {activeSection === "abstractReviewScores" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Abstract review scores
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                Average scores by category across reviewers, per-abstract
                totals, reviewer notes, and conflict-of-interest flags.
                Submissions (accept/reject, full text) stay under{" "}
                <button
                  type="button"
                  onClick={() => setActiveSection("abstracts")}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Abstract Submissions
                </button>
                ; reviewer workload lives under{" "}
                <button
                  type="button"
                  onClick={() => setActiveSection("reviewers")}
                  className="text-indigo-700 font-semibold hover:underline"
                >
                  Reviewers
                </button>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("abstracts")}
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            >
              Back to submissions
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Abstracts listed
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {abstractReviewRollupStats.total}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                With at least one review
              </p>
              <p className="text-2xl font-bold text-teal-700 mt-1">
                {abstractReviewRollupStats.withReviews}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pending reviewer data
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.max(
                  0,
                  abstractReviewRollupStats.total -
                    abstractReviewRollupStats.withReviews,
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                Scoring summary by abstract
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Expand a row for category averages and each reviewer&apos;s
                scores, notes, and COI details.
              </p>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={reviewerAbstractSearch}
                  onChange={(e) => setReviewerAbstractSearch(e.target.value)}
                  placeholder="Search abstract title, ID, or category..."
                  className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <select
                  value={reviewerAbstractCategoryFilter}
                  onChange={(e) =>
                    setReviewerAbstractCategoryFilter(e.target.value)
                  }
                  className="min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All categories</option>
                  {reviewerAbstractCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredReviewerAbstractScores.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredReviewerAbstractScores.map((item) => {
                  const summary = item.review_summary || {};
                  const reviewCount = Number(summary.review_count || 0);
                  const hasReviews = reviewCount > 0;
                  const avgValue = (v) =>
                    v != null && !Number.isNaN(Number(v))
                      ? Number(v).toFixed(2)
                      : "—";
                  return (
                    <details key={item.id} className="group">
                      <summary className="px-5 py-4 cursor-pointer hover:bg-gray-50 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.title || "Untitled abstract"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="font-mono">{item.id}</span> •{" "}
                            {item.category || "Uncategorized"} •{" "}
                            {item.status || "submitted"}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Reviews</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {reviewCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg total</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {avgValue(summary.avg_total)}
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

                      <div className="px-5 pb-5 bg-gray-50 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Originality</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_originality)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Clarity</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_clarity)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Study design</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_study_design)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Data analysis</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_data_analysis)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Significance</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_significance)}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-gray-500">Total</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {avgValue(summary.avg_total)}
                            </p>
                          </div>
                        </div>

                        {!hasReviews ? (
                          <p className="text-sm text-gray-500">
                            No reviews submitted for this abstract yet.
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                  <th className="text-left px-3 py-2">
                                    Reviewer
                                  </th>
                                  <th className="text-left px-3 py-2">
                                    Scores
                                  </th>
                                  <th className="text-left px-3 py-2">
                                    Additional notes
                                  </th>
                                  <th className="text-left px-3 py-2">
                                    COI / flags
                                  </th>
                                  <th className="text-left px-3 py-2">
                                    Updated
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(item.reviewer_reviews || []).map(
                                  (rev, idx) => {
                                    const coiFlags = [];
                                    if (rev.coi_mentor_pi)
                                      coiFlags.push("Mentor/PI");
                                    if (rev.coi_same_lab)
                                      coiFlags.push("Same lab");
                                    if (rev.coi_other)
                                      coiFlags.push("Other COI");
                                    return (
                                      <tr
                                        key={`${item.id}-${rev.reviewer_email}-${idx}`}
                                        className="border-t border-gray-100 align-top"
                                      >
                                        <td className="px-3 py-2 text-gray-800">
                                          {rev.reviewer_email}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                          O:{rev.originality ?? "—"} C:
                                          {rev.clarity ?? "—"} SD:
                                          {rev.study_design ?? "—"} DA:
                                          {rev.data_analysis ?? "—"} S:
                                          {rev.significance ?? "—"} T:
                                          {rev.total ?? "—"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 max-w-md whitespace-pre-wrap">
                                          {rev.previous_study_notes || "—"}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 max-w-xs whitespace-pre-wrap">
                                          {coiFlags.length > 0
                                            ? coiFlags.join(", ")
                                            : "None"}
                                          {rev.coi_other_details
                                            ? `\n${rev.coi_other_details}`
                                            : ""}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                          {rev.updated_at
                                            ? formatDate(rev.updated_at)
                                            : "—"}
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">
                No abstracts match this filter.
              </div>
            )}
          </div>
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
                      Affiliation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nationality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abstract / registration proof
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.affiliation || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.registration_proof_r2_key ? (
                          <a
                            href={`/${request.registration_proof_r2_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-700 font-medium hover:underline"
                          >
                            {request.registration_proof_filename || "View file"}
                          </a>
                        ) : /invited speaker\/chair/i.test(
                            String(request.notes || ""),
                          ) ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Invited speaker/chair
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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

      {/* Speaker hotel registrations */}
      {activeSection === "speakerHotel" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Invited speaker — hotel registrations
              </h2>
              <p className="text-sm text-gray-600 max-w-3xl mt-1">
                Submissions from{" "}
                <a
                  href="/speaker-hotel"
                  className="text-cyan-700 font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  /speaker-hotel
                </a>
                . One row per invitation email (latest update wins).
              </p>
            </div>
            <button
              type="button"
              onClick={exportSpeakerHotelToCSV}
              disabled={speakerHotelRegistrations.length === 0}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          {speakerHotelRegistrations.length === 0 ? (
            <p className="text-gray-500">No speaker hotel registrations yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invitation email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() =>
                          setSpeakerHotelNameSort((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          )
                        }
                        className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-gray-700"
                        title="Sort by name"
                      >
                        Name (passport)
                        <span aria-hidden="true">
                          {speakerHotelNameSort === "asc"
                            ? "▲"
                            : speakerHotelNameSort === "desc"
                              ? "▼"
                              : "↕"}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nationality
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrival
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(speakerHotelNameSort
                    ? [...speakerHotelRegistrations].sort((a, b) => {
                        const cmp = String(a.passport_name || "").localeCompare(
                          String(b.passport_name || ""),
                          undefined,
                          { sensitivity: "base" },
                        );
                        return speakerHotelNameSort === "asc" ? cmp : -cmp;
                      })
                    : speakerHotelRegistrations
                  ).map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[10rem] break-all">
                        {row.invited_speaker_email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.passport_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.nationality}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.guest_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.arrival_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.departure_date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {row.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <span
                          className="line-clamp-3"
                          title={row.address_physical}
                        >
                          {row.address_physical}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(row.updated_at)}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">
              Registrations
            </h2>
            <button
              onClick={openTestPaymentModal}
              disabled={testPaymentLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {testPaymentLoading ? "Preparing..." : "Make $1 Test Payment"}
            </button>
          </div>
          {registrations.length === 0 ? (
            <p className="text-gray-500">No registrations yet.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                <label className="block flex-1 min-w-0 max-w-xl">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Search
                  </span>
                  <input
                    type="search"
                    value={registrationSearch}
                    onChange={(e) => setRegistrationSearch(e.target.value)}
                    placeholder="Name, email, institution, ticket, phone, country…"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </label>
                <p className="text-sm text-gray-500 pb-1">
                  Showing {filteredRegistrations.length} of{" "}
                  {registrations.length}
                </p>
              </div>
              {filteredRegistrations.length === 0 ? (
                <p className="text-gray-500">
                  No registrations match your search.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <span className="sr-only">Expand</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Institution
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          +Guests
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRegistrations.map((reg) => {
                        const isOpen = expandedRegistrationIds.has(reg.id);
                        const ticketLabel =
                          REGISTRATION_TICKET_LABELS[reg.ticket_type] ||
                          reg.ticket_type;
                        const lunchDays = normalizeWeekendMealDayList(
                          reg.lunch_days,
                        );
                        const breakfastDays =
                          registrationBreakfastDaysForDisplay(reg);
                        const dietaryBits = [];
                        if (Number(reg.dietary_vegan) === 1) {
                          dietaryBits.push("Vegan");
                        }
                        if (Number(reg.dietary_vegetarian) === 1) {
                          dietaryBits.push("Vegetarian");
                        }
                        if (Number(reg.dietary_gluten_free) === 1) {
                          dietaryBits.push("Gluten-free");
                        }
                        if (Number(reg.dietary_kosher) === 1) {
                          dietaryBits.push("Kosher");
                        }
                        if (Number(reg.dietary_other) === 1) {
                          dietaryBits.push("Other dietary");
                        }
                        const fullName = [
                          reg.salutation,
                          reg.first_name,
                          reg.middle_name,
                          reg.last_name,
                          reg.suffix,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        const cur = reg.currency || "USD";
                        const fmtMoney = (n) =>
                          `${cur} ${Number(n || 0).toFixed(2)}`;

                        return (
                          <React.Fragment key={reg.id}>
                            <tr className="hover:bg-gray-50/80">
                              <td className="px-3 py-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleRegistrationExpanded(reg.id)
                                  }
                                  aria-expanded={isOpen}
                                  aria-label={
                                    isOpen
                                      ? "Hide registration details"
                                      : "Show registration details"
                                  }
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                >
                                  {isOpen ? (
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
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {reg.first_name} {reg.last_name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {reg.email}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-[14rem] truncate">
                                {reg.institution || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                <span className="font-medium text-gray-800">
                                  {ticketLabel}
                                </span>
                                {reg.ticket_type &&
                                  ticketLabel !== reg.ticket_type && (
                                    <span className="block text-xs text-gray-400 mt-0.5">
                                      {reg.ticket_type}
                                    </span>
                                  )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                                {Number(reg.accompanying_count || 0)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                                {fmtMoney(reg.total_price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${registrationPaymentBadgeClass(
                                    reg.payment_status,
                                  )}`}
                                >
                                  {reg.payment_status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(reg.registration_date)}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-gray-50">
                                <td
                                  colSpan={9}
                                  className="px-4 py-4 text-sm text-gray-700 border-t border-gray-100"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                                    <dl className="space-y-2">
                                      <div className="grid grid-cols-[8.5rem_1fr] gap-x-2 gap-y-1">
                                        <dt className="text-gray-500">
                                          Registration ID
                                        </dt>
                                        <dd className="font-mono text-xs break-all flex flex-wrap items-center gap-2">
                                          <span>{reg.id}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openRegistrationQrGenerator(reg.id)
                                            }
                                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                                            title="Generate QR code for this registration ID"
                                          >
                                            QR
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              sendRegistrationConfirmation(
                                                reg.id,
                                              )
                                            }
                                            disabled={
                                              sendingRegistrationConfirmationId ===
                                              reg.id
                                            }
                                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            {sendingRegistrationConfirmationId ===
                                            reg.id
                                              ? "Sending…"
                                              : "Resend confirmation"}
                                          </button>
                                        </dd>
                                        <dt className="text-gray-500">
                                          Full name
                                        </dt>
                                        <dd>{fullName || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Badge name
                                        </dt>
                                        <dd>{reg.badge_name || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Pronouns
                                        </dt>
                                        <dd>{reg.pronouns || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Credentials
                                        </dt>
                                        <dd>{reg.credentials || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Department
                                        </dt>
                                        <dd>{reg.department || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Address
                                        </dt>
                                        <dd>
                                          {[
                                            reg.address1,
                                            reg.address2,
                                            [reg.city, reg.state, reg.zip]
                                              .filter(Boolean)
                                              .join(", "),
                                            reg.country,
                                          ]
                                            .filter(
                                              (line) =>
                                                line &&
                                                String(line).trim() !== "",
                                            )
                                            .join(", ") || "—"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Office phone
                                        </dt>
                                        <dd>{reg.phone || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Cell phone
                                        </dt>
                                        <dd>{reg.cell_phone || "—"}</dd>
                                        <dt className="text-gray-500">
                                          Physician
                                        </dt>
                                        <dd>
                                          {reg.is_physician
                                            ? String(reg.is_physician)
                                            : "—"}
                                        </dd>
                                      </div>
                                    </dl>
                                    <dl className="space-y-2">
                                      <div className="grid grid-cols-[8.5rem_1fr] gap-x-2 gap-y-1">
                                        <dt className="text-gray-500">
                                          Ticket (detail)
                                        </dt>
                                        <dd>{ticketLabel}</dd>
                                        {reg.ticket_type === "korea-day-pass" &&
                                          (() => {
                                            const d = normalizeWeekendMealDayList(
                                              reg.day_pass_days,
                                            );
                                            return d.length ? (
                                              <>
                                                <dt className="text-gray-500">
                                                  Daypass days
                                                </dt>
                                                <dd>
                                                  {formatCongressMealDayList(d)}
                                                </dd>
                                              </>
                                            ) : null;
                                          })()}
                                        <dt className="text-gray-500">
                                          Ticket price
                                        </dt>
                                        <dd className="tabular-nums">
                                          {fmtMoney(reg.ticket_price)}
                                        </dd>
                                        <dt className="text-gray-500">Total</dt>
                                        <dd className="tabular-nums font-medium">
                                          {fmtMoney(reg.total_price)}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Early bird
                                        </dt>
                                        <dd>
                                          {Number(reg.is_early_bird) === 1
                                            ? "Yes"
                                            : "No"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Accompanying (count)
                                        </dt>
                                        <dd className="tabular-nums">
                                          {Number(reg.accompanying_count || 0)}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Opening reception
                                        </dt>
                                        <dd>
                                          {Number(
                                            reg.opening_reception_attending ||
                                              0,
                                          ) === 1
                                            ? "Attending"
                                            : "Not attending"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Gala dinner
                                        </dt>
                                        <dd>
                                          {Number(
                                            reg.gala_dinner_attending || 0,
                                          ) === 1
                                            ? "Attending"
                                            : "Not attending"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Lunch (Fri–Sun, Nov 6–8)
                                        </dt>
                                        <dd>
                                          {lunchDays.length
                                            ? formatCongressMealDayList(
                                                lunchDays,
                                              )
                                            : "Not selected"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Breakfast (Fri–Sun, Nov 6–8)
                                        </dt>
                                        <dd>
                                          {breakfastDays.length
                                            ? formatCongressMealDayList(
                                                breakfastDays,
                                              )
                                            : "Not selected"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Dietary
                                        </dt>
                                        <dd>
                                          {dietaryBits.length
                                            ? dietaryBits.join(", ")
                                            : "None noted"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Special assistance
                                        </dt>
                                        <dd>
                                          {Number(
                                            reg.special_assistance || 0,
                                          ) === 1
                                            ? "Yes"
                                            : "No"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Invited speaker
                                        </dt>
                                        <dd>
                                          {Number(
                                            reg.is_invited_speaker || 0,
                                          ) === 1
                                            ? "Yes"
                                            : "No"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Membership
                                        </dt>
                                        <dd>
                                          {reg.membership_level ||
                                          reg.membership_status
                                            ? `${reg.membership_level || "—"} (${reg.membership_status || "—"})`
                                            : "—"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Trainee letter
                                        </dt>
                                        <dd className="break-all text-xs">
                                          {reg.trainee_letter_status ||
                                            "not_required"}
                                          {reg.trainee_letter_url
                                            ? ` · ${reg.trainee_letter_url}`
                                            : ""}
                                          {reg.trainee_letter_uploaded_at
                                            ? ` · ${formatDate(reg.trainee_letter_uploaded_at)}`
                                            : ""}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Payment date
                                        </dt>
                                        <dd>{formatDate(reg.payment_date)}</dd>
                                        <dt className="text-gray-500">
                                          Payment ref.
                                        </dt>
                                        <dd className="font-mono text-xs break-all">
                                          {reg.payment_id || "—"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Payment intent
                                        </dt>
                                        <dd className="font-mono text-xs break-all">
                                          {reg.payment_intent_id || "—"}
                                        </dd>
                                        <dt className="text-gray-500">
                                          Privacy / policy
                                        </dt>
                                        <dd className="text-xs leading-relaxed">
                                          Policy agreed:{" "}
                                          {Number(reg.policy_agreed || 0) === 1
                                            ? "Yes"
                                            : "No"}
                                          {" · "}Marketing:{" "}
                                          {Number(
                                            reg.privacy_marketing || 0,
                                          ) === 1
                                            ? "Yes"
                                            : "No"}
                                          {" · "}App:{" "}
                                          {Number(reg.privacy_app || 0) === 1
                                            ? "Yes"
                                            : "No"}
                                          {" · "}Opt out mailing:{" "}
                                          {Number(reg.opt_out_mailing || 0) ===
                                          1
                                            ? "Yes"
                                            : "No"}
                                        </dd>
                                      </div>
                                    </dl>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Registration totals / rollups */}
      {activeSection === "registrationTotals" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Registration totals
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-3xl">
                Rollups from the registration list loaded in this session (API
                returns up to the 100 most recent). Revenue uses{" "}
                <code className="text-xs bg-gray-100 px-1 rounded">
                  total_price
                </code>{" "}
                and counts payments with status{" "}
                <span className="font-medium">completed</span> or{" "}
                <span className="font-medium">paid</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchAllData(adminToken)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Refresh data
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Registrations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {registrationTotals.total}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Confirmed payment: {registrationTotals.confirmedCount}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Revenue (confirmed)
              </p>
              <p className="text-3xl font-bold text-amber-700 mt-1">
                $
                {registrationTotals.revenueConfirmed.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                All rows (any status): $
                {registrationTotals.revenueAll.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Accompanying persons
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {registrationTotals.accompanyingSum}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Sum of accompanying_count
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Other admin data
              </p>
              <p className="text-sm text-gray-700 mt-2 space-y-1">
                <span className="block">
                  Abstracts: <strong>{abstracts.length}</strong>
                </span>
                <span className="block">
                  Visa requests: <strong>{visaRequests.length}</strong>
                </span>
                <span className="block">
                  Speaker hotel forms:{" "}
                  <strong>{speakerHotelRegistrations.length}</strong>
                </span>
                <span className="block">
                  Invited speaker registrations:{" "}
                  <strong>{registrationTotals.invitedSpeakers}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <p className="text-sm font-medium text-emerald-800">
                Opening / welcome reception
              </p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {registrationTotals.openingReceptionYes}
                <span className="text-base font-normal text-emerald-700">
                  {" "}
                  attending
                </span>
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
              <p className="text-sm font-medium text-purple-800">Gala dinner</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {registrationTotals.galaAttendingYes}
                <span className="text-base font-normal text-purple-700">
                  {" "}
                  attending
                </span>
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-700">
                Payment status (this batch)
              </p>
              <ul className="mt-2 text-sm text-slate-800 space-y-1">
                {registrationTotals.statusRows.length === 0 ? (
                  <li className="text-slate-500">No data</li>
                ) : (
                  registrationTotals.statusRows.map(([st, n]) => (
                    <li key={st} className="flex justify-between gap-4">
                      <span className="capitalize">{st}</span>
                      <strong>{n}</strong>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  Ticket type breakdown
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {registrationTotals.ticketRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-5 py-4 text-sm text-gray-500"
                      >
                        No registrations in this batch.
                      </td>
                    </tr>
                  ) : (
                    registrationTotals.ticketRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-3 text-sm text-gray-800">
                          {row.label}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">
                          {row.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  Meal attendance by day
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Count of registrants who selected each day (Friday–Sunday, Nov
                  6–8, 2026) for lunch or breakfast.
                </p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Day
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Lunch
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Breakfast
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {CONGRESS_WEEKEND_MEALS.map(({ key, date }) => (
                    <tr key={key}>
                      <td className="px-5 py-3 text-sm text-gray-800">
                        <span className="font-medium">{key}</span>
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">
                          {date}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">
                        {registrationTotals.lunchByDay[key] ?? 0}
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">
                        {registrationTotals.breakfastByDay[key] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trainee Applications Section */}
      {activeSection === "trainees" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Trainee Applications
          </h2>
          <p className="text-gray-600 text-sm">
            Review trainee/student registrations and accept or reject their
            verification letters.
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
                      Review
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
                    .map((reg) => {
                      const letterBusy = traineeLetterActionId === reg.id;
                      const hasLetter = Boolean(reg.trainee_letter_url);
                      return (
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
                          {hasLetter ? (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasLetter ? (
                            <div className="flex flex-col gap-1.5">
                              {reg.trainee_letter_status !== "approved" ? (
                                <button
                                  type="button"
                                  disabled={letterBusy}
                                  onClick={() =>
                                    updateTraineeLetterStatus(reg.id, "approved")
                                  }
                                  className="px-2.5 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                  {letterBusy ? "…" : "Accept"}
                                </button>
                              ) : null}
                              {reg.trainee_letter_status !== "rejected" ? (
                                <button
                                  type="button"
                                  disabled={letterBusy}
                                  onClick={() =>
                                    updateTraineeLetterStatus(reg.id, "rejected")
                                  }
                                  className="px-2.5 py-1 rounded border border-red-300 text-red-800 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              ) : null}
                              {reg.trainee_letter_status !== "pending" ? (
                                <button
                                  type="button"
                                  disabled={letterBusy}
                                  onClick={() =>
                                    updateTraineeLetterStatus(reg.id, "pending")
                                  }
                                  className="px-2.5 py-1 rounded border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Reset to pending
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
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
                    );
                    })}
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
                workload and progress. For average scores and notes{" "}
                <em>per abstract</em>, open{" "}
                <button
                  type="button"
                  onClick={() => setActiveSection("abstractReviewScores")}
                  className="text-teal-700 font-semibold hover:underline"
                >
                  Abstract review scores
                </button>
                .
              </p>
            </div>
          </div>

          {/* Assignment settings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800">
              Default abstracts per reviewer
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Used for reviewers without an individual number. To set the
              number for a specific reviewer, open{" "}
              <button
                type="button"
                onClick={() => setActiveSection("addReviewers")}
                className="text-teal-700 font-semibold hover:underline"
              >
                Add Reviewers
              </button>
              . Assignment prefers abstracts with the fewest reviewers so far,
              and changes apply the next time a reviewer opens their portal.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={abstractsPerReviewerInput}
                onChange={(e) => setAbstractsPerReviewerInput(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={saveAbstractsPerReviewer}
                disabled={savingAbstractsPerReviewer}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAbstractsPerReviewer ? "Saving..." : "Save"}
              </button>
              {reviewerOverview?.abstracts_per_reviewer != null && (
                <span className="text-xs text-gray-500">
                  Current: {reviewerOverview.abstracts_per_reviewer}
                </span>
              )}
            </div>
            {abstractsPerReviewerMessage && (
              <p
                className={`mt-2 text-xs ${
                  abstractsPerReviewerMessage.type === "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {abstractsPerReviewerMessage.text}
              </p>
            )}
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
                        {reviewerStats.reviewersWithPending} with pending
                        reviews
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
                                  Assigned {rev.assigned_count || 0} • Reviewed{" "}
                                  {rev.reviewed_count || 0} • Pending{" "}
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
                                      <th className="py-2 pr-4">Abstract ID</th>
                                      <th className="py-2 pr-4">Title</th>
                                      <th className="py-2 pr-4">Status</th>
                                      <th className="py-2 pr-4">Score</th>
                                      <th className="py-2 pr-4">Assigned</th>
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

      {/* Add Reviewers Section */}
      {activeSection === "addReviewers" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Add Reviewers
            </h2>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Create reviewer accounts by email. Reviewers sign in to the
              portal with that email only—no password.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-4 space-y-3">
              <p className="text-sm font-medium text-purple-900">
                Add one reviewer from an email
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                  type="email"
                  value={singleReviewerEmail}
                  onChange={(e) => setSingleReviewerEmail(e.target.value)}
                  placeholder="reviewer@institution.edu"
                  className="w-full sm:max-w-md border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-purple-900 whitespace-nowrap">
                    Abstracts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={singleReviewerCount}
                    onChange={(e) => setSingleReviewerCount(e.target.value)}
                    placeholder={`${reviewerAccountsDefault}`}
                    title={`Number of abstracts to assign (default ${reviewerAccountsDefault})`}
                    className="w-20 border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSingleReviewer}
                  disabled={singleReviewerLoading}
                  className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 disabled:opacity-60"
                >
                  {singleReviewerLoading ? "Adding..." : "Add reviewer"}
                </button>
              </div>
              {singleReviewerMessage && (
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {singleReviewerMessage}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or upload an email list (Excel)
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
                Processed <strong>{emailCount}</strong> reviewer account
                {emailCount === 1 ? "" : "s"} and downloaded a status Excel
                file.
              </div>
            )}

            {reviewerCreateError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {reviewerCreateError}
              </div>
            )}
          </div>

          {/* Per-reviewer abstract counts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                Abstracts per reviewer
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Set how many abstracts each reviewer is assigned. Leave the
                field blank to use the default ({reviewerAccountsDefault}).
                Changes apply the next time the reviewer opens their portal;
                extra abstracts are picked from the ones with the fewest
                reviewers so far.
              </p>
            </div>
            {reviewerAccounts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {reviewerAccounts.map((acct) => (
                  <div
                    key={acct.email}
                    className="px-5 py-3 flex flex-wrap items-center gap-3"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {acct.email}
                        {!acct.active && (
                          <span className="ml-2 inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px]">
                            inactive
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Currently assigned: {acct.assigned_count} • Target:{" "}
                        {acct.abstracts_target != null
                          ? acct.abstracts_target
                          : `default (${reviewerAccountsDefault})`}
                      </p>
                      {reviewerTargetMessage?.email === acct.email && (
                        <p
                          className={`mt-1 text-xs ${
                            reviewerTargetMessage.type === "success"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {reviewerTargetMessage.text}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={reviewerTargetInputs[acct.email] ?? ""}
                      placeholder={`${reviewerAccountsDefault}`}
                      onChange={(e) =>
                        setReviewerTargetInputs((prev) => ({
                          ...prev,
                          [acct.email]: e.target.value,
                        }))
                      }
                      className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => saveReviewerTarget(acct.email)}
                      disabled={savingReviewerTargetEmail === acct.email}
                      className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingReviewerTargetEmail === acct.email
                        ? "Saving..."
                        : "Save"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">
                No reviewer accounts yet. Add reviewers above to set their
                abstract counts.
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
            <p className="mt-3 text-sm text-fuchsia-900 bg-fuchsia-50 border border-fuchsia-200 rounded-lg px-3 py-2 max-w-2xl">
              <span className="font-semibold">Speaker profile:</span>{" "}
              send the public link{" "}
              <code className="text-xs break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /speaker-profile
              </code>{" "}
              for speakers to type their name, affiliation, and optional
              headshot (max 1 MB). Approve submissions under{" "}
              <button
                type="button"
                onClick={() => setActiveSection("speakerProfiles")}
                className="font-semibold text-fuchsia-800 underline"
              >
                Speaker profile queue
              </button>
              .
            </p>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Upload your speaker list as an Excel/CSV file. The tool will add
              an{" "}
              <code className="px-1 rounded bg-gray-100 text-[11px]">
                invite_link
              </code>{" "}
              column (generated per unique email) and download a new Excel file.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/40 p-4 space-y-3">
              <p className="text-sm font-medium text-fuchsia-900">
                Generate one invite link from just an email
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                  type="email"
                  value={singleInviteEmail}
                  onChange={(e) => setSingleInviteEmail(e.target.value)}
                  placeholder="speaker@institution.edu"
                  className="w-full sm:max-w-md border border-fuchsia-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400"
                />
                <button
                  type="button"
                  onClick={handleGenerateSingleInvite}
                  disabled={singleInviteLoading}
                  className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-fuchsia-700 text-white text-sm font-semibold hover:bg-fuchsia-800 disabled:opacity-60"
                >
                  {singleInviteLoading ? "Generating..." : "Generate invite link"}
                </button>
              </div>
              {singleInviteLink && (
                <div className="text-sm text-fuchsia-900">
                  <span className="font-semibold">Invite link:</span>{" "}
                  <a
                    href={singleInviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="underline break-all"
                  >
                    {singleInviteLink}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100" />

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

      {activeSection === "speakerProfiles" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Speaker profile queue
            </h2>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              Speaker profiles (free-text name) from{" "}
              <code className="text-xs">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /speaker-profile
              </code>
              . Approve to add them to the main Speakers grid on the Speakers
              page. The Speaker key column is for legacy rows only; new rows
              show (new). Presentation title and brief CV are for organizer
              reference only and are not shown on the public site. Rejecting
              removes a pending headshot and CV from storage.
            </p>
            <p className="text-sm mt-2 font-medium text-gray-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-2xl">
              For <strong>approved</strong> or <strong>rejected</strong> rows, use
              the red <strong>Delete from site</strong> button in the{" "}
              <strong>Actions</strong> column (not shown for pending rows).
            </p>

            {speakerProfileSubmissions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between max-w-2xl">
                <label className="block flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Search
                  </span>
                  <input
                    type="search"
                    value={speakerProfileSearch}
                    onChange={(e) => setSpeakerProfileSearch(e.target.value)}
                    placeholder="Name, email, title, affiliation, status…"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </label>
                <p className="text-sm text-gray-500 pb-1">
                  Showing {filteredSpeakerProfileSubmissions.length} of{" "}
                  {speakerProfileSubmissions.length}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Speaker key</th>
                  <th className="px-3 py-2">Name / affiliation</th>
                  <th className="px-3 py-2 min-w-[10rem]">
                    Presentation (reference)
                  </th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Photo</th>
                  <th className="px-3 py-2">Brief CV</th>
                  <th className="px-3 py-2 min-w-[9rem]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSpeakerProfileSubmissions.map((row) => {
                  const statusNorm = String(row.status || "")
                    .trim()
                    .toLowerCase();
                  const isPending = statusNorm === "pending";
                  const isApproved = statusNorm === "approved";
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            isPending
                              ? "bg-amber-100 text-amber-900"
                              : isApproved
                                ? "bg-green-100 text-green-900"
                                : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {statusNorm || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">
                        {row.speaker_key ? row.speaker_key : (
                          <span className="text-gray-500 italic">(new)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-sm">
                        <div className="font-medium text-gray-900">
                          {row.display_name}
                        </div>
                        <div className="text-gray-600 text-xs mt-0.5">
                          {row.affiliation}
                        </div>
                        {row.image_position ? (
                          <div className="text-gray-500 text-xs mt-1 font-mono">
                            {row.image_position}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 max-w-[14rem] text-gray-800 text-sm">
                        {row.presentation_title ? (
                          <span className="line-clamp-3" title={row.presentation_title}>
                            {row.presentation_title}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-800 break-all">
                        {row.email}
                      </td>
                      <td className="px-3 py-2">
                        {row.r2_key ? (
                          <a
                            href={`/${row.r2_key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={`/${row.r2_key}`}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.cv_r2_key ? (
                          <a
                            href={`/${row.cv_r2_key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline font-medium"
                          >
                            Open file
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isPending ? (
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              disabled={speakerProfileActionId === row.id}
                              onClick={() => runSpeakerProfileAction(row.id, "approve")}
                              className="px-2.5 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                              {speakerProfileActionId === row.id
                                ? "…"
                                : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={speakerProfileActionId === row.id}
                              onClick={() => runSpeakerProfileAction(row.id, "reject")}
                              className="px-2.5 py-1 rounded border border-red-300 text-red-800 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={speakerProfileActionId === row.id}
                            onClick={() => runSpeakerProfileAction(row.id, "delete")}
                            className="px-2.5 py-1.5 rounded-md border-2 border-red-300 bg-red-50 text-red-900 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                          >
                            {speakerProfileActionId === row.id
                              ? "…"
                              : "Delete from site"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!speakerProfileSubmissions ||
                  speakerProfileSubmissions.length === 0) && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      No speaker profile submissions yet.
                    </td>
                  </tr>
                )}
                {speakerProfileSubmissions.length > 0 &&
                  filteredSpeakerProfileSubmissions.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-gray-500"
                      >
                        No rows match your search.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discount Section */}
      {activeSection === "discount" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Discount Controls
              </h2>
              <p className="text-gray-600 text-sm mt-1 max-w-2xl">
                View current discount availability and enforce a usage limit.
              </p>
            </div>
            <button
              onClick={fetchDiscountAdmin}
              disabled={discountAdminLoading || discountAdminSaving}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {discountAdminLoading ? "Loading..." : "Refresh Discount"}
            </button>
          </div>

          {(discountAdminError || discountAdminSaveMessage) && (
            <div
              className={`text-sm rounded-lg px-3 py-2 border ${
                discountAdminError
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              }`}
            >
              {discountAdminError || discountAdminSaveMessage}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Discount code usage
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Track redemptions and set an optional maximum number of uses.
                </p>
              </div>
            </div>

            {!discountAdmin ? (
              <p className="text-sm text-gray-500">
                {discountAdminLoading
                  ? "Loading discount settings..."
                  : "Discount settings are unavailable."}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-gray-500">Code configured</div>
                    <div className="mt-1 font-mono text-xs text-gray-800">
                      {discountAdmin.code || "-"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-gray-500">Discount amount (USD)</div>
                    <div className="mt-1 font-semibold text-gray-900">
                      {Number(discountAdmin.amountUsd || 0)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-gray-500">Times used</div>
                    <div className="mt-1 font-semibold text-gray-900">
                      {Number(discountAdmin.usedCount || 0)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-gray-500">Uses remaining</div>
                    <div className="mt-1 font-semibold text-gray-900">
                      {discountAdmin.maxUses == null
                        ? "Unlimited"
                        : Number(discountAdmin.remainingUses || 0)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm text-gray-700">
                    Usage limit (blank = unlimited)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountLimitInput}
                      onChange={(e) => setDiscountLimitInput(e.target.value)}
                      className="mt-1 w-56 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block"
                      disabled={discountAdminSaving || !discountAdmin.enabled}
                    />
                  </label>
                  <button
                    onClick={saveDiscountUsageLimit}
                    disabled={
                      discountAdminSaving ||
                      discountAdminLoading ||
                      !discountAdmin.enabled
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {discountAdminSaving ? "Saving..." : "Save limit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environment Section */}
      {activeSection === "environment" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Environment Variables
              </h2>
              <p className="text-gray-600 text-sm mt-1 max-w-2xl">
                Admin-only view of available Worker bindings and masked status
                of important keys.
              </p>
            </div>
            <button
              onClick={fetchEnvVars}
              disabled={envVarsLoading}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {envVarsLoading ? "Loading..." : "Refresh Environment"}
            </button>
          </div>

          {envVarsError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {envVarsError}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Key configuration status
            </h3>
            {envConfiguredVars.length === 0 ? (
              <p className="text-sm text-gray-500">
                No configuration data yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-4">Variable</th>
                      <th className="py-2 pr-4">Configured</th>
                      <th className="py-2 pr-2">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envConfiguredVars.map((item) => (
                      <tr key={item.name} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {item.name}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.configured
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.configured ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-2 pr-2 font-mono text-xs text-gray-600">
                          {item.preview || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Available bindings
            </h3>
            {envBindingNames.length === 0 ? (
              <p className="text-sm text-gray-500">No bindings loaded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {envBindingNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex px-2.5 py-1 rounded-md text-xs font-mono bg-gray-100 text-gray-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTestPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  $1 Stripe Test Payment
                </h3>
                <p className="text-gray-500 mt-1 text-sm">
                  Run a real USD 1.00 payment using your admin session.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTestPaymentModal(false);
                  setTestPaymentError("");
                  setTestPaymentSuccessId("");
                  setTestPaymentClientSecret("");
                  setTestPublishableKey("");
                  setTestStripeModeInfo(null);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              {testPaymentLoading && (
                <div className="text-sm text-gray-600">
                  Creating payment intent...
                </div>
              )}

              {testPaymentError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {testPaymentError}
                </div>
              )}

              {testPaymentSuccessId && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  Payment succeeded. PaymentIntent:{" "}
                  <code className="px-1 rounded bg-emerald-100">
                    {testPaymentSuccessId}
                  </code>
                </div>
              )}

              {testStripeModeInfo && (
                <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Stripe key modes: publishable ={" "}
                  <strong>{testStripeModeInfo.publishableKeyMode}</strong>,
                  secret = <strong>{testStripeModeInfo.secretKeyMode}</strong>
                </div>
              )}

              {!testPaymentLoading &&
                testPaymentClientSecret &&
                !testPaymentSuccessId &&
                testStripePromise && (
                  <Elements stripe={testStripePromise}>
                    <PaymentForm
                      clientSecret={testPaymentClientSecret}
                      amount={100}
                      currency="USD"
                      isProcessing={testPaymentProcessing}
                      setIsProcessing={setTestPaymentProcessing}
                      onSuccess={(intent) => {
                        setTestPaymentSuccessId(intent?.id || "unknown");
                        setTestPaymentError("");
                        setTestPaymentProcessing(false);
                      }}
                      onError={(err) => {
                        setTestPaymentError(
                          err?.message || "Payment failed. Please try again.",
                        );
                        setTestPaymentProcessing(false);
                      }}
                    />
                  </Elements>
                )}
            </div>
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
