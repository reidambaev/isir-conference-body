import React, { useEffect, useMemo, useState } from "react";

function suggestedBalanceUsd(ticketPrice, totalPrice) {
  const ticket = Number(ticketPrice);
  const total = Number(totalPrice);
  if (!Number.isFinite(ticket) || !Number.isFinite(total)) return 550;
  const diff = Math.round((ticket - total) * 100) / 100;
  return diff > 0 ? diff : 550;
}

function paymentLinkFor(invoice, email) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.isir2026.org";
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
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(String(defaultAmount));
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAmountInput(String(defaultAmount));
  }, [defaultAmount]);

  const onCopyLink = async () => {
    if (!adminToken || busy) return;
    const amountUsd = Number(amountInput);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      alert("Enter an amount greater than 0.");
      return;
    }
    setBusy(true);
    setCopied(false);
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
            reason: "Remaining registration balance.",
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create payment link");
      }
      const link = data.paymentUrl || paymentLinkFor(data.invoice, email);
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        window.prompt("Copy this payment link:", link);
      }
      setCopied(true);
    } catch (err) {
      alert(err?.message || "Failed to create payment link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-600 text-white hover:bg-amber-700"
      >
        Balance
      </button>
      {open && (
        <>
          <label className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600">
            $
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountInput}
              onChange={(e) => {
                setCopied(false);
                setAmountInput(e.target.value);
              }}
              className="w-20 rounded-md border border-amber-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-800"
            />
          </label>
          <button
            type="button"
            onClick={onCopyLink}
            disabled={busy || !adminToken}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Creating…" : copied ? "Copied" : "Copy link"}
          </button>
        </>
      )}
    </span>
  );
}
