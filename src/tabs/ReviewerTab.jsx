import React, { useEffect, useMemo, useState } from "react";

const SCORE_FIELDS = [
  {
    key: "originality",
    label: "Originality",
    help: "0-2 None • 3-4 Similar to many others • 5-6 Modest number of other similar studies • 7-8 Very few similar studies • 9-10 Unique",
  },
  {
    key: "clarity",
    label: "Clarity of presentation",
    help: "0-2 Unintelligible • 3-4 Difficult to understand • 5-7 Can follow most of the content • 8-10 Clear presentation",
  },
  {
    key: "powerpoint",
    label: "PowerPoint presentation",
    help: "0-2 Unintelligible • 3-4 Difficult to understand • 5-7 Can follow most of the content • 8-10 Clear presentation of content",
  },
  {
    key: "study_design",
    label: "Study design",
    help: "0-3 Poorly designed • 4-6 Some deficiencies but with merit • 7-10 Well designed",
  },
  {
    key: "data_analysis",
    label: "Data analysis and conclusion",
    help: "0-3 Inadequate analysis • 4-6 Deficient analysis; conclusions partially related to data • 7-10 Appropriate analysis; conclusions supported by data",
  },
  {
    key: "significance",
    label: "Study outcome (Significance)",
    help: "0-3 Little, if any significance; does not advance the field • 4-6 Modest contribution to the field; advances the field modestly • 7-10 Important contribution to the field",
  },
];

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
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abstracts, setAbstracts] = useState([]);
  const [selectedAbstractId, setSelectedAbstractId] = useState(null);
  const [reviewsByAbstract, setReviewsByAbstract] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const selectedAbstract = useMemo(() => {
    return abstracts.find((a) => a.id === selectedAbstractId) || null;
  }, [abstracts, selectedAbstractId]);

  const currentReview = useMemo(() => {
    if (!selectedAbstractId) return null;
    return (
      reviewsByAbstract[selectedAbstractId] || {
        coi_mentor_pi: false,
        coi_same_lab: false,
        coi_other: false,
        coi_other_details: "",
        previous_study_notes: "",
        originality: 0,
        clarity: 0,
        powerpoint: 0,
        study_design: 0,
        data_analysis: 0,
        significance: 0,
      }
    );
  }, [reviewsByAbstract, selectedAbstractId]);

  const totalScore = useMemo(() => {
    if (!currentReview) return 0;
    return SCORE_FIELDS.reduce((sum, f) => sum + (Number(currentReview[f.key]) || 0), 0);
  }, [currentReview]);

  const loadAssignments = async (tkn) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/reviewers/abstracts", {
        method: "GET",
        token: tkn,
      });
      setAbstracts(data?.data || []);
      const firstId = data?.data?.[0]?.id || null;
      setSelectedAbstractId((prev) => prev || firstId);
      setReviewsByAbstract((prev) => {
        const next = { ...prev };
        (data?.existingReviews || []).forEach((r) => {
          if (r?.abstract_id) next[r.abstract_id] = r;
        });
        return next;
      });
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await apiFetch("/api/reviewers/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const tkn = data?.token;
      if (!tkn) throw new Error("Login did not return a token");
      setAuthToken(tkn);
      setToken(tkn);
      setPassword("");
    } catch (e2) {
      setAuthError(e2.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setToken(null);
    setAbstracts([]);
    setSelectedAbstractId(null);
    setReviewsByAbstract({});
    setSaveMessage("");
    setError("");
  };

  const updateReviewField = (field, value) => {
    if (!selectedAbstractId) return;
    setReviewsByAbstract((prev) => ({
      ...prev,
      [selectedAbstractId]: {
        ...(prev[selectedAbstractId] || {}),
        [field]: value,
      },
    }));
  };

  const submitReview = async () => {
    if (!token || !selectedAbstractId) return;
    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      const payload = {
        abstract_id: selectedAbstractId,
        ...currentReview,
        total: totalScore,
      };
      const data = await apiFetch("/api/reviewers/reviews", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      setSaveMessage(data?.message || "Saved");
    } catch (e) {
      setError(e.message || "Failed to save review");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(""), 2500);
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
              Log in to review your assigned abstracts (exactly 5).
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
                Use the email and generated password you were provided.
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <h2 className="font-semibold text-slate-900">Assigned abstracts</h2>
                  <button
                    onClick={() => loadAssignments(token)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  You can only review these abstracts.
                </p>

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
                      const hasReview = Boolean(reviewsByAbstract[a.id]?.updated_at || reviewsByAbstract[a.id]?.created_at);
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
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${hasReview ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {selectedAbstract.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {selectedAbstract.word_count} words
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Submitted: {formatDate(selectedAbstract.submission_date)}
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
                        {selectedAbstract.abstract}
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
                          {(selectedAbstract.affiliations || []).map((af, idx) => (
                            <div
                              key={af.id || idx}
                              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <div className="font-medium text-slate-800">
                                {af.author_name}
                              </div>
                              <div className="text-xs text-slate-600">
                                {[af.department, af.institution].filter(Boolean).join(", ")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {[af.city, af.country].filter(Boolean).join(", ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Gusdon Award evaluation
                        </h3>
                        <p className="text-sm text-slate-600">
                          Score each category (0–10). Total updates automatically.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Total
                        </div>
                        <div className="text-3xl font-bold text-slate-900">
                          {totalScore}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                        <div className="font-semibold text-slate-900 mb-3">
                          Conflict of interest
                        </div>
                        <div className="space-y-3 text-sm text-slate-700">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(currentReview.coi_mentor_pi)}
                              onChange={(e) =>
                                updateReviewField("coi_mentor_pi", e.target.checked)
                              }
                            />
                            <span>Are you a mentor, PI or Co-PI of the study?</span>
                          </label>
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(currentReview.coi_same_lab)}
                              onChange={(e) =>
                                updateReviewField("coi_same_lab", e.target.checked)
                              }
                            />
                            <span>
                              Are you working at the same lab or department with a candidate?
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
                            <span>Do you have any other conflict of interest?</span>
                          </label>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              If yes, please write in detail
                            </label>
                            <textarea
                              value={currentReview.coi_other_details || ""}
                              onChange={(e) =>
                                updateReviewField("coi_other_details", e.target.value)
                              }
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Details (optional)"
                            />
                          </div>
                        </div>
                      </div>

                      {SCORE_FIELDS.map((f) => (
                        <div key={f.key} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {f.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {f.help}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Score
                              </div>
                              <div className="text-2xl font-bold text-slate-900">
                                {Number(currentReview[f.key]) || 0}
                              </div>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={Number(currentReview[f.key]) || 0}
                            onChange={(e) => updateReviewField(f.key, Number(e.target.value))}
                            className="w-full mt-4"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0</span>
                            <span>10</span>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="font-semibold text-slate-900">
                          Previous study
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Feel free to write down if you have any concerns (e.g., has this been presented before?).
                        </div>
                        <textarea
                          value={currentReview.previous_study_notes || ""}
                          onChange={(e) =>
                            updateReviewField("previous_study_notes", e.target.value)
                          }
                          rows={4}
                          className="w-full mt-3 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Notes (optional)"
                        />
                      </div>

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
                          {saving ? "Saving..." : "Save review"}
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

