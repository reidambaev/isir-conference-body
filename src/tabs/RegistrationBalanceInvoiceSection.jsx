import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/currency";

function suggestedBalanceUsd(ticketPrice, totalPrice) {
  const ticket = Number(ticketPrice);
  const total = Number(totalPrice);
  if (!Number.isFinite(ticket) || !Number.isFinite(total)) return 550;
  const diff = Math.round((ticket - total) * 100) / 100;
  return diff > 0 ? diff : 550;
}

function paymentLinkFor(invoice, email) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.isir2026.org";
  const url = new URL("/pay-balance", `${origin}/`);
  if (invoice?.registrationId || invoice?.registration_id) {
    url.searchParams.set(
      "id",
      invoice.registrationId || invoice.registration_id,
    );
  }
  if (invoice?.id) url.searchParams.set("invoice", invoice.id);
  if (email) url.searchParams.set("email", email);
  return url.toString();
}

export default function RegistrationBalanceInvoiceSection({
  adminToken,
  registrationId,
  email,
  ticketPrice,
  totalPrice,
}) {
  const defaultAmount = useMemo(
    () => suggestedBalanceUsd(ticketPrice, totalPrice),
    [ticketPrice, totalPrice],
  );
  const [amountInput, setAmountInput] = useState(String(defaultAmount));
  const [reason, setReason] = useState(
    "Remaining registration balance. A discount code was applied as a flat price instead of a reduction.",
  );
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const loadInvoices = useCallback(async () => {
    if (!adminToken || !registrationId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}/balance-invoices`,
        {
          headers: { "X-Admin-Token": adminToken },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load balance invoices");
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (err) {
      setError(err?.message || "Failed to load balance invoices");
    } finally {
      setLoading(false);
    }
  }, [adminToken, registrationId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    setAmountInput(String(defaultAmount));
  }, [defaultAmount]);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const amountUsd = Number(amountInput);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}/balance-invoices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": adminToken,
          },
          body: JSON.stringify({
            amountUsd,
            reason,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create payment link");
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : [data.invoice]);
      const link = data.paymentUrl || paymentLinkFor(data.invoice, email);
      setMessage("Payment link created and copied. Send it to them yourself.");
      try {
        await navigator.clipboard.writeText(link);
        setCopiedId(data.invoice?.id || "created");
      } catch {
        // ignore clipboard failures
      }
    } catch (err) {
      setError(err?.message || "Failed to create payment link");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async (invoiceId) => {
    if (!invoiceId) return;
    setError("");
    setMessage("");
    setCancellingId(invoiceId);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}/balance-invoices/${encodeURIComponent(invoiceId)}/cancel`,
        {
          method: "POST",
          headers: { "X-Admin-Token": adminToken },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel invoice");
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      setMessage("Pending invoice cancelled.");
    } catch (err) {
      setError(err?.message || "Failed to cancel invoice");
    } finally {
      setCancellingId("");
    }
  };

  const copyLink = async (invoice) => {
    const link = paymentLinkFor(invoice, email);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invoice.id);
      setMessage("Payment link copied.");
    } catch {
      setMessage(link);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <h3 className="text-sm font-semibold text-amber-950">
        Remaining balance payment
      </h3>
      <p className="mt-1 text-xs text-amber-900/80">
        Create a Stripe link if this registration was undercharged (for example
        a discount code set the total to a flat price). Suggested amount is the
        ticket price minus the amount already recorded.
      </p>

      <form onSubmit={onCreate} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-gray-700">
          Amount (USD)
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-gray-700 sm:col-span-2">
          Reason shown to the attendee
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving || !adminToken}
            className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create payment link"}
          </button>
        </div>
      </form>

      {(error || message) && (
        <p
          className={`mt-3 text-xs ${error ? "text-red-700" : "text-green-800"}`}
        >
          {error || message}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {loading && (
          <p className="text-xs text-gray-500">Loading invoices…</p>
        )}
        {!loading && invoices.length === 0 && (
          <p className="text-xs text-gray-500">No balance invoices yet.</p>
        )}
        {invoices.map((inv) => {
          const status = String(inv.paymentStatus || inv.payment_status || "");
          const amount = Number(inv.amountUsd ?? inv.amount_usd ?? 0);
          return (
            <div
              key={inv.id}
              className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono">{inv.id}</span>
                <span className="font-semibold">
                  {formatCurrency(amount)} · {status}
                </span>
              </div>
              {inv.reason && <p className="mt-1 text-gray-600">{inv.reason}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => copyLink(inv)}
                      className="rounded-md bg-emerald-600 px-2 py-1 font-medium text-white hover:bg-emerald-700"
                    >
                      {copiedId === inv.id ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancel(inv.id)}
                      disabled={cancellingId === inv.id}
                      className="rounded-md border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {cancellingId === inv.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </>
                )}
                {status === "completed" && (
                  <span className="text-green-700">Paid</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
