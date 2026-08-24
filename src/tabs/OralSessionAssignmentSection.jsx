import { useMemo, useState } from "react";
import {
  ORAL_SESSIONS,
  POSTER_SESSIONS,
  getOralSession,
  getPosterSession,
  parseOralSession,
  parsePosterSession,
  collectOralSessionRecipients,
  formatRecipientList,
  buildOralSessionLetter,
  buildPosterSessionLetter,
  splitEquallyAtRandom,
} from "../config/oralSessions.js";

const SESSION_BADGE = {
  YI: "bg-amber-100 text-amber-900",
  N1: "bg-violet-100 text-violet-800",
  N2: "bg-sky-100 text-sky-800",
  N3: "bg-teal-100 text-teal-800",
  N4: "bg-rose-100 text-rose-800",
  N5: "bg-orange-100 text-orange-800",
  P1: "bg-sky-100 text-sky-800",
  P2: "bg-emerald-100 text-emerald-800",
};

function normalizeFormat(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (value === "oral" || value === "poster") return value;
  return null;
}

function sessionBadge(session, fallbackLabel = "Unassigned") {
  if (!session) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
        {fallbackLabel}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        SESSION_BADGE[session.code] || "bg-gray-100 text-gray-800"
      }`}
    >
      {session.title?.startsWith("Poster")
        ? session.title
        : session.isYoungInvestigator
          ? "YI"
          : session.code}
    </span>
  );
}

function yiMismatchWarning(ids, sessionCode, pool) {
  const session = getOralSession(sessionCode);
  if (!session) return null;
  const rows = pool.filter((a) => ids.includes(a.id));
  if (session.isYoungInvestigator) {
    const nonYi = rows.filter((a) => Number(a.young_investigator) !== 1);
    if (nonYi.length > 0) {
      return `${nonYi.length} selected abstract${
        nonYi.length === 1 ? " is" : "s are"
      } not flagged as Young Investigator. YI is the Young Investigator competition. Continue anyway?`;
    }
    return null;
  }
  const yi = rows.filter((a) => Number(a.young_investigator) === 1);
  if (yi.length > 0) {
    return `${yi.length} selected abstract${
      yi.length === 1 ? " is" : "s are"
    } flagged as Young Investigator. YI is the Young Investigator competition. Assign to ${session.code} anyway?`;
  }
  return null;
}

/**
 * Admin tab: assign oral abstracts to YI / N1–N5 and posters to #1 / #2, then send letters.
 */
export default function OralSessionAssignmentSection({
  abstracts,
  setAbstracts,
  adminToken,
  isLocalDemo,
  formatAbstractText,
  formatDate,
  getAbstractTypeLabel,
  onGoToFormatAssignment,
}) {
  const [track, setTrack] = useState("oral");
  const isPoster = track === "poster";
  const sessions = isPoster ? POSTER_SESSIONS : ORAL_SESSIONS;
  const getSession = isPoster ? getPosterSession : getOralSession;
  const parseSession = isPoster ? parsePosterSession : parseOralSession;
  const sessionField = isPoster ? "poster_session" : "oral_session";
  const assignedAtField = isPoster
    ? "poster_session_assigned_at"
    : "oral_session_assigned_at";
  const emailField = isPoster
    ? "poster_session_email_sent_at"
    : "oral_session_email_sent_at";
  const assignApi = isPoster
    ? "/api/admin/abstracts/poster-session"
    : "/api/admin/abstracts/oral-session";
  const sendOneApi = (id) =>
    isPoster
      ? `/api/admin/abstracts/${id}/send-poster-session-notification`
      : `/api/admin/abstracts/${id}/send-oral-session-notification`;
  const sendBulkApi = isPoster
    ? "/api/admin/abstracts/send-poster-session-notifications"
    : "/api/admin/abstracts/send-oral-session-notifications";
  const sessionBodyKey = isPoster ? "poster_session" : "oral_session";

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("unassigned");
  const [yiFilter, setYiFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkSession, setBulkSession] = useState("N1");
  const [viewingId, setViewingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [message, setMessage] = useState(null);

  const switchTrack = (next) => {
    setTrack(next);
    setSearch("");
    setSessionFilter("unassigned");
    setYiFilter("all");
    setSelectedIds(new Set());
    setBulkSession(next === "poster" ? "P1" : "N1");
    setViewingId(null);
    setMessage(null);
  };

  const pool = useMemo(() => {
    const format = isPoster ? "poster" : "oral";
    return (abstracts || []).filter(
      (a) =>
        String(a.status || "").toLowerCase() === "accepted" &&
        Number(a.is_invited_speaker || 0) !== 1 &&
        normalizeFormat(a.assigned_format) === format,
    );
  }, [abstracts, isPoster]);

  const stats = useMemo(() => {
    const bySession = Object.fromEntries(sessions.map((s) => [s.code, 0]));
    let unassigned = 0;
    let emailPending = 0;
    let yi = 0;
    for (const row of pool) {
      const session = getSession(row[sessionField]);
      if (session) bySession[session.code] += 1;
      else unassigned += 1;
      if (session && !row[emailField]) emailPending += 1;
      if (Number(row.young_investigator) === 1) yi += 1;
    }
    return {
      total: pool.length,
      unassigned,
      emailPending,
      yi,
      bySession,
    };
  }, [pool, sessions, getSession, sessionField, emailField]);

  const filteredRows = useMemo(() => {
    let result = [...pool];
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((a) => {
        const title = String(a.title || "").toLowerCase();
        const id = String(a.id || "").toLowerCase();
        const presenter = String(a.presenter_name || "").toLowerCase();
        const corresponding = String(a.corresponding_name || "").toLowerCase();
        const category = String(a.category || "").toLowerCase();
        return (
          title.includes(query) ||
          id.includes(query) ||
          presenter.includes(query) ||
          corresponding.includes(query) ||
          category.includes(query)
        );
      });
    }
    if (sessionFilter === "unassigned") {
      result = result.filter((a) => !getSession(a[sessionField]));
    } else if (getSession(sessionFilter)) {
      result = result.filter(
        (a) => getSession(a[sessionField])?.code === sessionFilter,
      );
    }
    if (!isPoster && yiFilter === "yi") {
      result = result.filter((a) => Number(a.young_investigator) === 1);
    } else if (!isPoster && yiFilter === "not-yi") {
      result = result.filter((a) => Number(a.young_investigator) !== 1);
    }

    result.sort((a, b) => {
      if (!isPoster) {
        const yiA = Number(a.young_investigator) === 1 ? 0 : 1;
        const yiB = Number(b.young_investigator) === 1 ? 0 : 1;
        if (yiA !== yiB) return yiA - yiB;
      }
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
    return result;
  }, [
    pool,
    search,
    sessionFilter,
    yiFilter,
    isPoster,
    getSession,
    sessionField,
  ]);

  const viewingAbstract = useMemo(() => {
    if (!viewingId) return null;
    return pool.find((a) => a.id === viewingId) || null;
  }, [pool, viewingId]);

  const letterPreview = useMemo(() => {
    if (!viewingAbstract) return null;
    const session = getSession(viewingAbstract[sessionField]);
    if (!session) return null;
    return isPoster
      ? buildPosterSessionLetter(viewingAbstract, session)
      : buildOralSessionLetter(viewingAbstract, session);
  }, [viewingAbstract, getSession, sessionField, isPoster]);

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

  const applyLocalSession = (ids, sessionCode) => {
    const assignedAt = sessionCode ? Date.now() : null;
    const idSet = new Set(ids);
    setAbstracts((prev) =>
      prev.map((a) =>
        idSet.has(a.id)
          ? {
              ...a,
              [sessionField]: sessionCode,
              [assignedAtField]: assignedAt,
              [emailField]: null,
            }
          : a,
      ),
    );
  };

  const applyLocalAssignments = (assignments) => {
    const assignedAt = Date.now();
    const byId = new Map(
      assignments.map((row) => [row.id, row.poster_session]),
    );
    setAbstracts((prev) =>
      prev.map((a) =>
        byId.has(a.id)
          ? {
              ...a,
              [sessionField]: byId.get(a.id),
              [assignedAtField]: assignedAt,
              [emailField]: null,
            }
          : a,
      ),
    );
  };

  const applyLocalEmailSent = (sentAtById) => {
    setAbstracts((prev) =>
      prev.map((a) =>
        sentAtById[a.id] ? { ...a, [emailField]: sentAtById[a.id] } : a,
      ),
    );
  };

  const recipientLabel = (abstract) => {
    const recipients = collectOralSessionRecipients(abstract);
    return formatRecipientList(recipients) || "the authors";
  };

  const assignSession = async (ids, sessionCode, { skipConfirm = false } = {}) => {
    if (!ids.length) return false;
    if (!isLocalDemo && !adminToken) {
      setMessage({ type: "error", text: "Admin access token is missing." });
      return false;
    }

    const parsed = parseSession(sessionCode);
    if (!parsed.ok) {
      setMessage({
        type: "error",
        text: isPoster
          ? "Choose poster session #1 or #2."
          : "Choose a valid session (YI or N1–N5).",
      });
      return false;
    }

    const mismatch =
      !isPoster && parsed.value
        ? yiMismatchWarning(ids, parsed.value, pool)
        : null;
    const session = parsed.value ? getSession(parsed.value) : null;
    const label = session
      ? session.title || session.code
      : "unassigned";
    if (!skipConfirm) {
      const confirmParts = [];
      if (mismatch) confirmParts.push(mismatch);
      confirmParts.push(
        parsed.value
          ? `Assign ${ids.length} abstract${ids.length === 1 ? "" : "s"} to ${label}?`
          : `Clear session assignment for ${ids.length} abstract${
              ids.length === 1 ? "" : "s"
            }?`,
      );
      if (!window.confirm(confirmParts.join("\n\n"))) return false;
    }

    setBusy(true);
    setMessage(null);
    try {
      if (isLocalDemo) {
        applyLocalSession(ids, parsed.value);
        setSelectedIds(new Set());
        setMessage({
          type: "success",
          text: `Updated ${ids.length} abstract${
            ids.length === 1 ? "" : "s"
          } to ${label} (demo).`,
        });
        return true;
      }

      const response = await fetch(assignApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          ids,
          [sessionBodyKey]: parsed.value,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update session");
      }

      applyLocalSession(ids, parsed.value);
      setSelectedIds(new Set());
      const updated = Number(data.updated ?? ids.length);
      const skipped = Number(data.skipped || 0);
      setMessage({
        type: updated > 0 ? "success" : "error",
        text:
          skipped > 0
            ? `Assigned ${updated} to ${label}; skipped ${skipped}.`
            : `Assigned ${updated} abstract${updated === 1 ? "" : "s"} to ${label}.`,
      });
      return true;
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update session.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const randomSplitPosters = async ({ onlyUnassigned = true } = {}) => {
    if (!isPoster) return;
    const candidates = onlyUnassigned
      ? selectedIds.size > 0
        ? pool.filter(
            (a) => selectedIds.has(a.id) && !getPosterSession(a.poster_session),
          )
        : pool.filter((a) => !getPosterSession(a.poster_session))
      : selectedIds.size > 0
        ? pool.filter((a) => selectedIds.has(a.id))
        : pool;

    if (candidates.length === 0) {
      setMessage({
        type: "error",
        text: onlyUnassigned
          ? "No unassigned poster abstracts to split."
          : "No poster abstracts to split.",
      });
      return;
    }

    const split = splitEquallyAtRandom(candidates.map((a) => a.id));
    const n1 = split.P1.length;
    const n2 = split.P2.length;
    const confirmed = window.confirm(
      `Randomly assign ${candidates.length} poster${
        candidates.length === 1 ? "" : "s"
      } equally:\n• Poster Session #1: ${n1}\n• Poster Session #2: ${n2}\n\nContinue?`,
    );
    if (!confirmed) return;

    const assignments = [
      ...split.P1.map((id) => ({ id, poster_session: "P1" })),
      ...split.P2.map((id) => ({ id, poster_session: "P2" })),
    ];

    setBusy(true);
    setMessage(null);
    try {
      if (isLocalDemo) {
        applyLocalAssignments(assignments);
        setSelectedIds(new Set());
        setMessage({
          type: "success",
          text: `Randomly assigned ${n1} to #1 and ${n2} to #2 (demo).`,
        });
        return;
      }

      if (!adminToken) {
        setMessage({ type: "error", text: "Admin access token is missing." });
        return;
      }

      const response = await fetch(assignApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({ assignments }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to assign poster sessions");
      }
      applyLocalAssignments(assignments);
      setSelectedIds(new Set());
      setMessage({
        type: "success",
        text: `Randomly assigned ${n1} to #1 and ${n2} to #2.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to randomly assign posters.",
      });
    } finally {
      setBusy(false);
    }
  };

  const sendSessionNotification = async (abstractId) => {
    if (!isLocalDemo && !adminToken) {
      setMessage({ type: "error", text: "Admin access token is missing." });
      return;
    }

    const abstract = (abstracts || []).find((a) => a.id === abstractId);
    const session = getSession(abstract?.[sessionField]);
    if (!session) {
      setMessage({
        type: "error",
        text: isPoster
          ? "Assign poster session #1 or #2 before sending the letter."
          : "Assign a session (YI or N1–N5) before sending the speaker letter.",
      });
      return;
    }

    const recipient = recipientLabel(abstract);
    const alreadySent = Boolean(abstract?.[emailField]);
    const draftNote =
      isPoster && session.emailReady === false
        ? " This uses a placeholder letter (session date and poster instructions are TBA)."
        : "";
    const confirmed = window.confirm(
      `${alreadySent ? "Resend" : "Send"} ${session.title || session.code} letter to ${recipient}?${draftNote}`,
    );
    if (!confirmed) return;

    setSendingId(abstractId);
    setMessage(null);
    try {
      if (isLocalDemo) {
        const sentAt = Date.now();
        applyLocalEmailSent({ [abstractId]: sentAt });
        setMessage({
          type: "success",
          text: `${session.title || session.code} letter marked sent to ${recipient} (demo).`,
        });
        return;
      }

      const response = await fetch(sendOneApi(abstractId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send session letter");
      }

      applyLocalEmailSent({
        [abstractId]: result.sentAt || Date.now(),
      });
      setMessage({
        type: "success",
        text: `${session.title || session.code} letter sent to ${result.sentTo || recipient}.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to send session letter.",
      });
    } finally {
      setSendingId(null);
    }
  };

  const bulkSendNotifications = async ({
    onlyMissing = true,
    abstractIds = null,
  } = {}) => {
    if (!isLocalDemo && !adminToken) {
      setMessage({ type: "error", text: "Admin access token is missing." });
      return;
    }

    const assigned = pool.filter((a) => getSession(a[sessionField]));
    const candidates = abstractIds
      ? assigned.filter((a) => abstractIds.includes(a.id))
      : assigned;
    const missing = candidates.filter((a) => !a[emailField]);
    const targets = onlyMissing ? missing : candidates;

    if (targets.length === 0) {
      setMessage({
        type: "error",
        text: onlyMissing
          ? "No assigned sessions are missing a letter."
          : "No assigned sessions to email.",
      });
      return;
    }

    const verb = onlyMissing ? "send" : "resend";
    const draftNote = isPoster
      ? " Poster letters are placeholders until the official #1 / #2 copy is provided."
      : "";
    const confirmed = window.confirm(
      `About to ${verb} ${isPoster ? "poster" : "oral"} session letters for ${
        targets.length
      } abstract${targets.length === 1 ? "" : "s"} (presenting and corresponding authors).${draftNote} Continue?`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      if (isLocalDemo) {
        const sentAt = Date.now();
        const sentAtById = {};
        targets.forEach((a) => {
          sentAtById[a.id] = sentAt;
        });
        applyLocalEmailSent(sentAtById);
        setMessage({
          type: "success",
          text: `Marked ${targets.length} letter${
            targets.length === 1 ? "" : "s"
          } as sent (demo).`,
        });
        return;
      }

      const response = await fetch(sendBulkApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          onlyMissing,
          abstractIds: candidates.map((a) => a.id),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send session letters");
      }

      const sentAtById = {};
      (result.results || []).forEach((r) => {
        if (r.status === "sent" && r.sentAt) {
          sentAtById[r.id] = r.sentAt;
        }
      });
      if (Object.keys(sentAtById).length > 0) {
        applyLocalEmailSent(sentAtById);
      }

      setMessage({
        type:
          (result.failed || 0) > 0 && (result.sent || 0) === 0
            ? "error"
            : "success",
        text: `Session letters: ${result.sent || 0} sent, ${
          result.skipped || 0
        } skipped, ${result.failed || 0} failed.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to send session letters.",
      });
    } finally {
      setBusy(false);
    }
  };

  const selectedList = Array.from(selectedIds);
  const unassignedSelectedCount = selectedList.filter((id) => {
    const row = pool.find((a) => a.id === id);
    return row && !getSession(row[sessionField]);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Oral & poster sessions
          </h2>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            {isPoster
              ? "Place each poster abstract into Poster Session #1 or #2. Use random equal split to divide unassigned (or selected) posters evenly. Letters email both presenting and corresponding authors. Official #1 / #2 letter copy is still TBA — previews use a placeholder."
              : "Place each oral abstract into the Young Investigator Award (YI) or a New Research Findings session (N1–N5), then send the speaker letter. YI uses a different opening. Letters email both the presenting and corresponding authors."}
          </p>
        </div>
        {onGoToFormatAssignment ? (
          <button
            type="button"
            onClick={onGoToFormatAssignment}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
          >
            Oral / Poster assignment
          </button>
        ) : null}
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => switchTrack("oral")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
            !isPoster
              ? "bg-white text-violet-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Oral (YI · N1–N5)
        </button>
        <button
          type="button"
          onClick={() => switchTrack("poster")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md ${
            isPoster
              ? "bg-white text-sky-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Posters (#1 / #2)
        </button>
      </div>

      <div
        className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${
          isPoster ? "xl:grid-cols-5" : "xl:grid-cols-9"
        }`}
      >
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {isPoster ? "Poster abstracts" : "Oral abstracts"}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          {!isPoster && stats.yi > 0 ? (
            <p className="text-[11px] text-amber-800 mt-1">{stats.yi} YI</p>
          ) : null}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Unassigned
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {stats.unassigned}
          </p>
        </div>
        {sessions.map((session) => (
          <div
            key={session.code}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {isPoster ? session.title : session.code}
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.bySession[session.code]}
            </p>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Email pending
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            {stats.emailPending}
          </p>
        </div>
      </div>

      {pool.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-sm text-gray-600">
          No {isPoster ? "poster" : "oral"} abstracts yet. Assign accepted
          abstracts as {isPoster ? "poster" : "oral"} in{" "}
          {onGoToFormatAssignment ? (
            <button
              type="button"
              onClick={onGoToFormatAssignment}
              className="font-semibold text-violet-700 hover:underline"
            >
              Oral / Poster assignment
            </button>
          ) : (
            "Oral / Poster assignment"
          )}
          , then return here to place them in{" "}
          {isPoster ? "Poster Session #1 or #2" : "YI or N1–N5"}.
        </div>
      ) : null}

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
              placeholder="Search title, ID, presenter, or corresponding author..."
              className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="all">All sessions</option>
              <option value="unassigned">Unassigned</option>
              {sessions.map((session) => (
                <option key={session.code} value={session.code}>
                  {isPoster ? session.title : session.code}
                  {session.isYoungInvestigator ? " (YI)" : ""}
                </option>
              ))}
            </select>
            {!isPoster ? (
              <select
                value={yiFilter}
                onChange={(e) => setYiFilter(e.target.value)}
                className="min-w-[150px] px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="all">All authors</option>
                <option value="yi">Young Investigator</option>
                <option value="not-yi">Not YI</option>
              </select>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">
              {selectedList.length} selected
              {filteredRows.length !== pool.length
                ? ` · ${filteredRows.length} shown`
                : ""}
            </span>
            <select
              value={bulkSession}
              onChange={(e) => setBulkSession(e.target.value)}
              className="min-w-[220px] px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
            >
              {sessions.map((session) => (
                <option key={session.code} value={session.code}>
                  {isPoster
                    ? session.title
                    : `${session.code} — ${session.title}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || selectedList.length === 0}
              onClick={() => assignSession(selectedList, bulkSession)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Assign selected
            </button>
            <button
              type="button"
              disabled={busy || selectedList.length === 0}
              onClick={() => assignSession(selectedList, null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Clear session
            </button>
            {isPoster ? (
              <button
                type="button"
                disabled={
                  busy ||
                  (selectedList.length > 0
                    ? unassignedSelectedCount === 0
                    : stats.unassigned === 0)
                }
                onClick={() => randomSplitPosters({ onlyUnassigned: true })}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Split unassigned equally at random
                {selectedList.length > 0
                  ? ` (${unassignedSelectedCount} selected)`
                  : ` (${stats.unassigned})`}
              </button>
            ) : null}
            <span className="hidden sm:inline text-gray-300 mx-1">|</span>
            <button
              type="button"
              disabled={
                busy ||
                selectedList.length === 0 ||
                !selectedList.some((id) => {
                  const row = pool.find((a) => a.id === id);
                  return getSession(row?.[sessionField]) && !row?.[emailField];
                })
              }
              onClick={() =>
                bulkSendNotifications({
                  onlyMissing: true,
                  abstractIds: selectedList,
                })
              }
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Email selected
            </button>
            <button
              type="button"
              disabled={busy || stats.emailPending === 0}
              onClick={() => bulkSendNotifications({ onlyMissing: true })}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              Email all pending ({stats.emailPending})
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-500 text-sm">
            No {isPoster ? "poster" : "oral"} abstracts match these filters.
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
                  <th className="px-4 py-3">Authors</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Assign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => {
                  const session = getSession(row[sessionField]);
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
                        </p>
                        {Number(row.young_investigator) === 1 ? (
                          <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900">
                            Young Investigator
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 min-w-[180px]">
                        <p>
                          <span className="text-gray-500">Presenting:</span>{" "}
                          {row.presenter_name || "—"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {row.presenter_email || ""}
                        </p>
                        <p className="mt-1">
                          <span className="text-gray-500">Corresponding:</span>{" "}
                          {row.corresponding_name || "—"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {row.corresponding_email || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        {sessionBadge(session)}
                        {session ? (
                          <p className="text-[11px] text-gray-500 mt-1 max-w-[220px]">
                            {session.dateLine}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {session ? (
                          row[emailField] ? (
                            <div>
                              <p className="text-xs font-semibold text-emerald-700">
                                Sent
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {formatDate ? formatDate(row[emailField]) : ""}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-amber-700">
                              Not sent
                            </p>
                          )
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <select
                            value={session?.code || ""}
                            disabled={busy}
                            onChange={(e) =>
                              assignSession([row.id], e.target.value || null)
                            }
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-50"
                            aria-label={`Assign session for ${row.title || row.id}`}
                          >
                            <option value="">Session…</option>
                            {sessions.map((s) => (
                              <option key={s.code} value={s.code}>
                                {isPoster
                                  ? s.title
                                  : `${s.code}${s.isYoungInvestigator ? " YI" : ""}`}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setViewingId(row.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          >
                            Preview
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
            aria-labelledby="session-view-title"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {isPoster ? "Poster session letter" : "Oral speaker letter"}
                </p>
                <h3
                  id="session-view-title"
                  className="text-lg font-bold text-gray-900 leading-snug mt-0.5"
                >
                  {viewingAbstract.title}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {viewingAbstract.category || "—"}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-100 text-cyan-700">
                    {getAbstractTypeLabel
                      ? getAbstractTypeLabel(viewingAbstract)
                      : "—"}
                  </span>
                  {sessionBadge(getSession(viewingAbstract[sessionField]))}
                  {Number(viewingAbstract.young_investigator) === 1 ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900">
                      Young Investigator
                    </span>
                  ) : null}
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
                    Presenting author
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
                    Corresponding author
                  </p>
                  <p className="font-medium text-gray-900">
                    {viewingAbstract.corresponding_name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {viewingAbstract.corresponding_email || ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Assign session
                </p>
                <select
                  value={
                    getSession(viewingAbstract[sessionField])?.code || ""
                  }
                  disabled={busy}
                  onChange={(e) =>
                    assignSession(
                      [viewingAbstract.id],
                      e.target.value || null,
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {sessions.map((s) => (
                    <option key={s.code} value={s.code}>
                      {isPoster ? s.title : `${s.code} — ${s.title}`}
                    </option>
                  ))}
                </select>
              </div>

              {letterPreview ? (
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800 mb-1">
                    Letter preview
                    {isPoster && letterPreview.session?.emailReady === false
                      ? " (placeholder)"
                      : ""}
                  </p>
                  <p className="text-xs text-violet-900 mb-3">
                    Subject: {letterPreview.subject}
                    <br />
                    To: {formatRecipientList(letterPreview.recipients)}
                  </p>
                  <pre className="whitespace-pre-wrap font-serif text-sm text-gray-800 bg-white border border-violet-100 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {letterPreview.text}
                  </pre>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  Assign a session to preview the letter with this abstract’s
                  name, ID, title, and session details filled in.
                </div>
              )}

              {viewingAbstract.abstract ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Abstract
                  </p>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {formatAbstractText
                      ? formatAbstractText(viewingAbstract.abstract)
                      : viewingAbstract.abstract}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-2">
              {getSession(viewingAbstract[sessionField]) ? (
                <button
                  type="button"
                  disabled={busy || sendingId === viewingAbstract.id}
                  onClick={() => sendSessionNotification(viewingAbstract.id)}
                  className="mr-auto px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sendingId === viewingAbstract.id
                    ? "Sending…"
                    : viewingAbstract[emailField]
                      ? "Resend letter"
                      : "Send letter"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setViewingId(null)}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
