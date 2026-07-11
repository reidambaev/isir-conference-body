import React, { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

function statusBadgeClass(status) {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleString();
}

export default function VisaAdminTab() {
  const [visaRequests, setVisaRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchVisaRequests();
  }, []);

  const fetchVisaRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/visa-requests");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || `Failed to load visa requests (HTTP ${res.status})`,
        );
      }
      setVisaRequests(data.data || []);
    } catch (e) {
      setError(e?.message || "Failed to load visa requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visaRequests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const parts = [
        request.name,
        request.email,
        request.affiliation,
        request.country,
        request.status,
        request.id,
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .map((x) => String(x).toLowerCase());
      return parts.some((p) => p.includes(q));
    });
  }, [visaRequests, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const request of visaRequests) {
      const key = String(request.status || "pending").toLowerCase();
      if (key in counts) counts[key] += 1;
    }
    return counts;
  }, [visaRequests]);

  const updateStatus = async (id, status) => {
    if (!id) return;
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/visa-requests/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || `Failed to update status (HTTP ${res.status})`,
        );
      }
      setVisaRequests((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                updated_at: data.data?.updated_at || Date.now(),
              }
            : row,
        ),
      );
    } catch (e) {
      setError(e?.message || "Failed to update status");
    } finally {
      setActionId(null);
    }
  };

  const deleteRequest = async (id, name) => {
    if (!id) return;
    const ok = window.confirm(
      `Delete visa request for ${name || "this person"}? This cannot be undone.`,
    );
    if (!ok) return;

    setActionId(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/visa-requests/${encodeURIComponent(id)}/delete`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || `Failed to delete request (HTTP ${res.status})`,
        );
      }
      setVisaRequests((prev) => prev.filter((row) => row.id !== id));
    } catch (e) {
      setError(e?.message || "Failed to delete request");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading visa requests...</div>
      </div>
    );
  }

  if (error && visaRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          type="button"
          onClick={fetchVisaRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Visa Requests
        </h1>
        <p className="mt-2 text-slate-300">
          Review visa invitation letter requests, update status, or delete
          entries
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Total</span>
            <span className="text-white font-bold ml-2">
              {visaRequests.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Pending</span>
            <span className="text-white font-bold ml-2">
              {statusCounts.pending}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Approved</span>
            <span className="text-white font-bold ml-2">
              {statusCounts.approved}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-slate-300 text-sm">Rejected</span>
            <span className="text-white font-bold ml-2">
              {statusCounts.rejected}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="visa-search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search
          </label>
          <input
            id="visa-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, affiliation, nationality…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600"
          />
        </div>
        <div>
          <label
            htmlFor="visa-status-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="visa-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={fetchVisaRequests}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <p className="text-gray-500">
          {visaRequests.length === 0
            ? "No visa requests yet."
            : "No visa requests match this filter."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affiliation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abstract / registration proof
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const busy = actionId === request.id;
                return (
                  <tr key={request.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {request.affiliation || "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.country || "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`px-2 inline-flex w-fit text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(request.status)}`}
                        >
                          {request.status || "pending"}
                        </span>
                        <select
                          value={request.status || "pending"}
                          disabled={busy}
                          onChange={(e) =>
                            updateStatus(request.id, e.target.value)
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                          aria-label={`Change status for ${request.name}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteRequest(request.id, request.name)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {busy ? "Working…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
