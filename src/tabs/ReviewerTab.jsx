import React, { useEffect, useMemo, useRef, useState } from "react";

const RATING_SCALE_HELP =
  "1 Poor • 2 Fair • 3 Good • 4 Very good • 5 Excellent";

const AUTO_SAVE_MS = 650;
const DRAFT_STORAGE_PREFIX = "isir_review_draft:";

const SCORE_FIELDS = [
  {
    key: "originality",
    label: "Originality",
    help: RATING_SCALE_HELP,
  },
  {
    key: "clarity",
    label: "Clarity of presentation",
    help: `Do you clearly understand a candidate's presentation? • ${RATING_SCALE_HELP}`,
  },
  {
    key: "study_design",
    label: "Study design",
    help: `Is study design proper? Is statistical analysis correct? • ${RATING_SCALE_HELP}`,
  },
  {
    key: "data_analysis",
    label: "Data analysis and conclusion",
    help: RATING_SCALE_HELP,
  },
  {
    key: "significance",
    label: "Study outcome (Significance)",
    help: `Does the study contribute important finding(s) to the field of reproductive immunology? • ${RATING_SCALE_HELP}`,
  },
];

const ABSTRACT_SECTION_LABELS = [
  { key: "objectives", label: "objectives:" },
  { key: "methods", label: "methods:" },
  { key: "results", label: "results:" },
  { key: "conclusions", label: "conclusions:" },
];

function getDefaultReview() {
  return {
    coi_mentor_pi: false,
    coi_same_lab: false,
    coi_other: false,
    coi_other_details: "",
    previous_study_notes: "",
    originality: 3,
    clarity: 3,
    study_design: 3,
    data_analysis: 3,
    significance: 3,
  };
}

function draftStorageKey(abstractId) {
  return `${DRAFT_STORAGE_PREFIX}${abstractId}`;
}

function readLocalDraft(abstractId) {
  try {
    const raw = localStorage.getItem(draftStorageKey(abstractId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(abstractId, review) {
  try {
    localStorage.setItem(
      draftStorageKey(abstractId),
      JSON.stringify({
        ...review,
        abstract_id: abstractId,
        updated_at: Date.now(),
      }),
    );
  } catch {
    // ignore quota / private mode
  }
}

function normalizeReview(raw) {
  const base = getDefaultReview();
  if (!raw || typeof raw !== "object") return base;
  const scoreOrDefault = (value, fallback) => {
    if (value == null || value === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    ...base,
    coi_mentor_pi: Boolean(Number(raw.coi_mentor_pi)),
    coi_same_lab: Boolean(Number(raw.coi_same_lab)),
    coi_other: Boolean(Number(raw.coi_other)),
    coi_other_details: raw.coi_other_details || "",
    previous_study_notes: raw.previous_study_notes || "",
    originality: scoreOrDefault(raw.originality, base.originality),
    clarity: scoreOrDefault(raw.clarity, base.clarity),
    study_design: scoreOrDefault(raw.study_design, base.study_design),
    data_analysis: scoreOrDefault(raw.data_analysis, base.data_analysis),
    significance: scoreOrDefault(raw.significance, base.significance),
    total: raw.total != null ? Number(raw.total) : undefined,
    updated_at: raw.updated_at != null ? Number(raw.updated_at) : undefined,
  };
}

function computeTotalScore(review) {
  if (!review) return 0;
  return SCORE_FIELDS.reduce((sum, f) => sum + (Number(review[f.key]) || 0), 0);
}

function hasSavedReview(review) {
  return Boolean(review?.updated_at || review?.created_at);
}

function reviewHasCoi(review) {
  return Boolean(
    review?.coi_mentor_pi || review?.coi_same_lab || review?.coi_other,
  );
}

function parseAbstractSections(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const found = [];
  ABSTRACT_SECTION_LABELS.forEach((section) => {
    const idx = lower.indexOf(section.label);
    if (idx !== -1) {
      found.push({
        key: section.key,
        label: section.label,
        start: idx,
      });
    }
  });

  if (found.length === 0) return null;

  found.sort((a, b) => a.start - b.start);

  const sections = {};
  for (let i = 0; i < found.length; i += 1) {
    const { key, label, start } = found[i];
    const nextStart = i + 1 < found.length ? found[i + 1].start : text.length;
    const sectionText = text.slice(start + label.length, nextStart).trim();
    if (sectionText) {
      sections[key] = sectionText;
    }
  }

  return Object.keys(sections).length > 0 ? sections : null;
}

function formatDate(ts) {
  if (!ts) return "N/A";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function getAuthToken() {
  try {
    return localStorage.getItem("isir_reviewer_token");
  } catch {
    return null;
  }
}

function setAuthToken(token) {
  try {
    if (!token) localStorage.removeItem("isir_reviewer_token");
    else localStorage.setItem("isir_reviewer_token", token);
  } catch {
    // ignore
  }
}

async function apiFetch(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...options, headers });
  const bodyText = await res.text();
  let json = null;
  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = json?.error || json?.message || bodyText || "Request failed";
    throw new Error(msg);
  }
  return json;
}

export default function ReviewerTab() {
  const [token, setToken] = useState(() => getAuthToken());
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abstracts, setAbstracts] = useState([]);
  const [selectedAbstractId, setSelectedAbstractId] = useState(null);
  const [reviewsByAbstract, setReviewsByAbstract] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const autoSaveTimerRef = useRef(null);
  const saveMessageTimerRef = useRef(null);
  const latestReviewsRef = useRef({});
  const tokenRef = useRef(token);
  const saveInFlightRef = useRef(new Set());
  const pendingSaveIdsRef = useRef(new Set());

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    latestReviewsRef.current = reviewsByAbstract;
  }, [reviewsByAbstract]);

  const selectedAbstract = useMemo(() => {
    return abstracts.find((a) => a.id === selectedAbstractId) || null;
  }, [abstracts, selectedAbstractId]);

  const currentReview = useMemo(() => {
    if (!selectedAbstractId) return null;
    const base = getDefaultReview();
    const existing = reviewsByAbstract[selectedAbstractId];
    return existing ? { ...base, ...existing } : base;
  }, [reviewsByAbstract, selectedAbstractId]);

  const abstractSections = useMemo(() => {
    if (!selectedAbstract?.abstract) return null;
    return parseAbstractSections(selectedAbstract.abstract);
  }, [selectedAbstract?.abstract]);

  const totalScore = useMemo(
    () => computeTotalScore(currentReview),
    [currentReview],
  );

  const hasConflictOfInterest = useMemo(
    () => reviewHasCoi(currentReview),
    [currentReview],
  );

  const reviewProgress = useMemo(() => {
    const total = abstracts.length;
    const saved = abstracts.reduce(
      (count, a) =>
        count + (hasSavedReview(reviewsByAbstract[a.id]) ? 1 : 0),
      0,
    );
    return {
      total,
      saved,
      complete: total > 0 && saved >= total,
    };
  }, [abstracts, reviewsByAbstract]);

  const showSaveStatus = (message, clearMs = 2500) => {
    if (saveMessageTimerRef.current) {
      clearTimeout(saveMessageTimerRef.current);
      saveMessageTimerRef.current = null;
    }
    setSaveMessage(message);
    if (clearMs != null) {
      saveMessageTimerRef.current = setTimeout(() => {
        setSaveMessage("");
        saveMessageTimerRef.current = null;
      }, clearMs);
    }
  };

  const persistReview = async (
    abstractId,
    review,
    { showStatus = true } = {},
  ) => {
    const tkn = tokenRef.current;
    if (!tkn || !abstractId || !review) return null;

    if (saveInFlightRef.current.has(abstractId)) {
      pendingSaveIdsRef.current.add(abstractId);
      return null;
    }

    saveInFlightRef.current.add(abstractId);
    setSaving(true);
    if (showStatus) showSaveStatus("Saving…", null);
    setError("");
    try {
      const declaredCoi = reviewHasCoi(review);
      const payload = {
        abstract_id: abstractId,
        ...review,
        total: declaredCoi ? null : computeTotalScore(review),
      };
      const data = await apiFetch("/api/reviewers/reviews", {
        method: "POST",
        token: tkn,
        body: JSON.stringify(payload),
      });
      const now = Date.now();
      const latestLocal = latestReviewsRef.current[abstractId] || review;
      const serverTotal =
        typeof data?.total === "number"
          ? data.total
          : reviewHasCoi(latestLocal)
            ? null
            : computeTotalScore(latestLocal);
      const savedReview = {
        ...normalizeReview(latestLocal),
        total: serverTotal,
        updated_at: now,
      };
      latestReviewsRef.current = {
        ...latestReviewsRef.current,
        [abstractId]: savedReview,
      };
      setReviewsByAbstract((prev) => ({
        ...prev,
        [abstractId]: savedReview,
      }));
      writeLocalDraft(abstractId, savedReview);
      if (showStatus) {
        showSaveStatus(
          data?.message ||
            (declaredCoi
              ? "Conflict of interest saved — scores not counted"
              : "Progress saved"),
        );
      }
      return data;
    } catch (e) {
      setError(e.message || "Failed to save review");
      if (showStatus) showSaveStatus("Save failed — draft kept locally", 4000);
      throw e;
    } finally {
      saveInFlightRef.current.delete(abstractId);
      setSaving(false);
      if (pendingSaveIdsRef.current.has(abstractId)) {
        pendingSaveIdsRef.current.delete(abstractId);
        const latest = latestReviewsRef.current[abstractId];
        if (latest) {
          void persistReview(abstractId, latest, { showStatus });
        }
      }
    }
  };

  const scheduleAutoSave = (abstractId) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      const review = latestReviewsRef.current[abstractId];
      if (!review) return;
      void persistReview(abstractId, review, { showStatus: true });
    }, AUTO_SAVE_MS);
  };

  const loadAssignments = async (tkn) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/reviewers/abstracts", {
        method: "GET",
        token: tkn,
      });
      const list = data?.data || [];
      setAbstracts(list);
      const firstId = list[0]?.id || null;
      setSelectedAbstractId((prev) => prev || firstId);

      const next = {};
      const draftsToSync = [];
      (data?.existingReviews || []).forEach((r) => {
        if (!r?.abstract_id) return;
        next[r.abstract_id] = normalizeReview(r);
      });

      // Prefer a newer local draft (e.g. reload before server round-trip finished)
      list.forEach((abstract) => {
        const id = abstract?.id;
        if (!id) return;
        const draft = readLocalDraft(id);
        if (!draft) return;
        const serverUpdated = Number(next[id]?.updated_at || 0);
        const draftUpdated = Number(draft.updated_at || 0);
        if (!next[id] || draftUpdated > serverUpdated) {
          next[id] = normalizeReview(draft);
          draftsToSync.push(id);
        }
      });

      latestReviewsRef.current = next;
      setReviewsByAbstract(next);
      draftsToSync.forEach((id) => scheduleAutoSave(id));
    } catch (e) {
      setError(e.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAssignments(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Flush pending autosave when leaving the page
  useEffect(() => {
    const flush = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      const id = selectedAbstractId;
      const review = id ? latestReviewsRef.current[id] : null;
      if (id && review) writeLocalDraft(id, review);
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [selectedAbstractId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await apiFetch("/api/reviewers/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const tkn = data?.token;
      if (!tkn) throw new Error("Login did not return a token");
      setAuthToken(tkn);
      setToken(tkn);
    } catch (e2) {
      setAuthError(e2.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setAuthToken(null);
    setToken(null);
    setAbstracts([]);
    setSelectedAbstractId(null);
    setReviewsByAbstract({});
    latestReviewsRef.current = {};
    setSaveMessage("");
    setError("");
  };

  const updateReviewField = (field, value) => {
    if (!selectedAbstractId) return;
    setReviewsByAbstract((prev) => {
      const existing = prev[selectedAbstractId];
      const base = existing || getDefaultReview();
      const nextReview = {
        ...base,
        [field]: value,
        updated_at: Date.now(),
      };
      const next = {
        ...prev,
        [selectedAbstractId]: nextReview,
      };
      latestReviewsRef.current = next;
      writeLocalDraft(selectedAbstractId, nextReview);
      scheduleAutoSave(selectedAbstractId);
      return next;
    });
  };

  const submitReview = async () => {
    if (!token || !selectedAbstractId || !currentReview) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    try {
      await persistReview(selectedAbstractId, currentReview, {
        showStatus: true,
      });
    } catch {
      // error already surfaced
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Reviewer Portal
            </h1>
            <p className="text-slate-600 mt-1">
              Log in to review your assigned abstracts.
            </p>
          </div>
          {token && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </div>

        {!token ? (
          <div className="max-w-xl">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Reviewer sign-in
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Enter the email address that was registered for you as a
                reviewer.
              </p>
              {authError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  {authError}
                </div>
              )}
              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                >
                  {authLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    Assigned abstracts
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  You can only review these abstracts.
                </p>

                {!loading && !error && abstracts.length > 0 && (
                  <div
                    className={`mt-4 rounded-xl border px-3 py-3 ${
                      reviewProgress.complete
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {reviewProgress.complete ? (
                      <>
                        <div className="text-sm font-semibold text-emerald-800">
                          All reviews complete — thank you
                        </div>
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                          You can still change any review until the deadline.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-800">
                            {reviewProgress.saved} of {reviewProgress.total}{" "}
                            reviews saved
                          </div>
                          <div className="text-xs font-medium text-slate-500 tabular-nums">
                            {reviewProgress.total - reviewProgress.saved}{" "}
                            remaining
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${
                                reviewProgress.total > 0
                                  ? (reviewProgress.saved /
                                      reviewProgress.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Saved reviews can be changed until the deadline.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="py-6 text-slate-600">Loading…</div>
                ) : error ? (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                    {error}
                  </div>
                ) : abstracts.length === 0 ? (
                  <div className="py-6 text-slate-600">
                    No abstracts assigned yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {abstracts.map((a) => {
                      const selected = a.id === selectedAbstractId;
                      const hasReview = hasSavedReview(
                        reviewsByAbstract[a.id],
                      );
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedAbstractId(a.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            selected
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                                {a.title}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {a.category} • {a.word_count} words
                              </div>
                              {Number(a.young_investigator) === 1 && (
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-white"
                                    aria-hidden
                                  />
                                  Young Investigator
                                </div>
                              )}
                            </div>
                            <div
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${hasReview ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                            >
                              {hasReview ? "Saved" : "Not saved"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              {!selectedAbstract ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-slate-600">
                  Select an abstract to begin reviewing.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Number(selectedAbstract.young_investigator) === 1 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-white"
                            aria-hidden
                          />
                          Young Investigator Competition
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {selectedAbstract.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {selectedAbstract.word_count} words
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Submitted:{" "}
                        {formatDate(selectedAbstract.submission_date)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {selectedAbstract.title}
                    </h2>
                    <div className="mt-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Abstract
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {abstractSections ? (
                          <div className="space-y-3">
                            {ABSTRACT_SECTION_LABELS.map((section) => {
                              const content = abstractSections[section.key];
                              if (!content) return null;
                              const heading =
                                section.label.charAt(0).toUpperCase() +
                                section.label.slice(1, -1);
                              return (
                                <div key={section.key}>
                                  <div className="font-semibold text-slate-900 mb-1">
                                    {heading}
                                  </div>
                                  <div>{content}</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          selectedAbstract.abstract
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Authors
                        </div>
                        <div className="space-y-2">
                          {(selectedAbstract.authors || []).map((au, idx) => (
                            <div
                              key={au.id || idx}
                              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <div className="font-medium text-slate-800">
                                {au.first_name}{" "}
                                {au.middle_name ? `${au.middle_name} ` : ""}
                                {au.last_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {au.email || ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Affiliations
                        </div>
                        <div className="space-y-2">
                          {(selectedAbstract.affiliations || []).map(
                            (af, idx) => (
                              <div
                                key={af.id || idx}
                                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                              >
                                <div className="font-medium text-slate-800">
                                  {af.author_name}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {[af.department, af.institution]
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {[af.city, af.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Abstract evaluation
                      </h3>
                      <p className="text-sm text-slate-600">
                        {hasConflictOfInterest
                          ? "Conflict of interest declared — your response will be saved, but scores will not be counted."
                          : "Score each category (1–5). Changes save automatically as you go."}
                      </p>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                        <div className="font-semibold text-slate-900 mb-3">
                          Conflict of interest
                        </div>
                        {hasConflictOfInterest ? (
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                            Declaring a conflict saves your response without
                            counting scores toward averages.
                          </p>
                        ) : null}
                        <div className="space-y-3 text-sm text-slate-700">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(currentReview.coi_mentor_pi)}
                              onChange={(e) =>
                                updateReviewField(
                                  "coi_mentor_pi",
                                  e.target.checked,
                                )
                              }
                            />
                            <span>
                              Are you a mentor, PI or Co-PI of the study?
                            </span>
                          </label>
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(currentReview.coi_same_lab)}
                              onChange={(e) =>
                                updateReviewField(
                                  "coi_same_lab",
                                  e.target.checked,
                                )
                              }
                            />
                            <span>
                              Are you working at the same lab or department with
                              a candidate?
                            </span>
                          </label>
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(currentReview.coi_other)}
                              onChange={(e) =>
                                updateReviewField("coi_other", e.target.checked)
                              }
                            />
                            <span>
                              Do you have any other conflict of interest?
                            </span>
                          </label>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              If yes, please write in detail
                            </label>
                            <textarea
                              value={currentReview.coi_other_details || ""}
                              onChange={(e) =>
                                updateReviewField(
                                  "coi_other_details",
                                  e.target.value,
                                )
                              }
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Details (optional)"
                            />
                          </div>
                        </div>
                      </div>

                      {!hasConflictOfInterest ? (
                        <>
                          {SCORE_FIELDS.map((f) => {
                            const hasNotes =
                              f.help &&
                              f.help !== RATING_SCALE_HELP &&
                              f.help.includes(RATING_SCALE_HELP);
                            const helpNoteText = hasNotes
                              ? f.help.replace(` • ${RATING_SCALE_HELP}`, "")
                              : null;
                            const helpRatingText = hasNotes
                              ? RATING_SCALE_HELP
                              : f.help;

                            return (
                              <div
                                key={f.key}
                                className="rounded-xl border border-slate-200 p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {f.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {helpNoteText && <div>{helpNoteText}</div>}
                                      <div>{helpRatingText}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      Score
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                      {Number(currentReview[f.key]) || 3}
                                    </div>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={Number(currentReview[f.key]) || 3}
                                  onChange={(e) =>
                                    updateReviewField(
                                      f.key,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full mt-4"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                  <span>1</span>
                                  <span>5</span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : null}

                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="font-semibold text-slate-900">
                          Additional notes
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {hasConflictOfInterest
                            ? "Optional notes for the selection committee (scores are not counted)."
                            : "Any additional comments to help the selection committee interpret your scores (optional)."}
                        </div>
                        <textarea
                          value={currentReview.previous_study_notes || ""}
                          onChange={(e) =>
                            updateReviewField(
                              "previous_study_notes",
                              e.target.value,
                            )
                          }
                          rows={4}
                          className="w-full mt-3 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Additional notes (optional)"
                        />
                      </div>

                      {!hasConflictOfInterest ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Final score
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              Sum of all category scores (updates
                              automatically).
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-slate-900">
                            {totalScore}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="text-sm text-slate-600">
                          {saveMessage ? (
                            <span className="text-emerald-700 font-semibold">
                              {saveMessage}
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={submitReview}
                          disabled={saving || loading}
                          className="px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {saving
                            ? "Saving..."
                            : hasConflictOfInterest
                              ? "Save conflict of interest"
                              : "Save now"}
                        </button>
                      </div>
                      {error && (
                        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
