import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";
import { formatCurrency } from "../utils/currency";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

function normalizeClientEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function PayBalanceTab() {
  const [email, setEmail] = useState("");
  const [registrationIdInput, setRegistrationIdInput] = useState("");
  const [invoiceIdInput, setInvoiceIdInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const [registration, setRegistration] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const [clientSecret, setClientSecret] = useState(null);
  const [amountUsd, setAmountUsd] = useState(0);
  const [paymentSetupError, setPaymentSetupError] = useState(null);
  const [settingUpPayment, setSettingUpPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [autoLookupDone, setAutoLookupDone] = useState(false);

  const lookupBalance = async ({
    email: emailArg,
    registrationId,
    invoiceId,
  }) => {
    setLookupError(null);
    setRegistration(null);
    setInvoice(null);
    setClientSecret(null);
    setPaymentSetupError(null);

    const normalizedEmail = normalizeClientEmail(emailArg);
    const regId = String(registrationId || "").trim();
    const invId = String(invoiceId || "").trim();
    if (!normalizedEmail) {
      setLookupError("Enter the email used for registration.");
      return;
    }
    if (!regId && !invId) {
      setLookupError("Enter your registration ID or invoice ID.");
      return;
    }

    setLookingUp(true);
    try {
      const res = await fetch("/api/pay-balance/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          registrationId: regId || undefined,
          invoiceId: invId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not find a remaining balance");
      }
      setRegistration(data.registration);
      setInvoice(data.invoice);
      if (data.registration?.id && !regId) {
        setRegistrationIdInput(data.registration.id);
      }
      if (data.invoice?.id && !invId) {
        setInvoiceIdInput(data.invoice.id);
      }
    } catch (err) {
      setLookupError(
        err?.message ||
          "Could not reach the server. Try again or contact support@isir2026.org.",
      );
    } finally {
      setLookingUp(false);
    }
  };

  const onLookup = async (e) => {
    e.preventDefault();
    await lookupBalance({
      email,
      registrationId: registrationIdInput,
      invoiceId: invoiceIdInput,
    });
  };

  useEffect(() => {
    if (autoLookupDone) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const qEmail = params.get("email");
      const qId = params.get("id") || params.get("registrationId");
      const qInvoice = params.get("invoice");
      if (qEmail) setEmail(qEmail.trim());
      if (qId) setRegistrationIdInput(qId.trim());
      if (qInvoice) setInvoiceIdInput(qInvoice.trim());
      setAutoLookupDone(true);
      if (qEmail && (qId || qInvoice)) {
        // Run after state updates by calling lookup with the URL values directly.
        lookupBalance({
          email: qEmail.trim(),
          registrationId: (qId || "").trim(),
          invoiceId: (qInvoice || "").trim(),
        });
      }
    } catch {
      setAutoLookupDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLookupDone]);

  const onStartPayment = async (e) => {
    e.preventDefault();
    setPaymentSetupError(null);
    if (!registration?.id || !invoice?.id) {
      setPaymentSetupError("Look up your remaining balance first.");
      return;
    }
    if (String(invoice.paymentStatus || "").toLowerCase() !== "pending") {
      setPaymentSetupError("This balance is not awaiting payment.");
      return;
    }

    setSettingUpPayment(true);
    try {
      const res = await fetch("/api/pay-balance/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          invoiceId: invoice.id,
          email: normalizeClientEmail(email),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to set up payment");
      }
      setClientSecret(data.clientSecret);
      setAmountUsd(Number(data.amountUsd || invoice.amountUsd || 0));
    } catch (err) {
      setPaymentSetupError(
        err?.message ||
          "There was an error setting up payment. Please try again.",
      );
    } finally {
      setSettingUpPayment(false);
    }
  };

  const resetToLookup = () => {
    setRegistration(null);
    setInvoice(null);
    setClientSecret(null);
    setPaymentSetupError(null);
    setLookupError(null);
  };

  if (submitted) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div
            className="p-8 text-white text-center"
            style={{
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          >
            <h1 className="text-2xl font-bold mb-2">Balance paid</h1>
            <p className="text-blue-100">
              Payment received. The remaining registration balance has been
              applied to{" "}
              <span className="font-mono font-semibold select-all">
                {registration?.id}
              </span>
              .
            </p>
          </div>
          <div className="p-8 bg-white text-center text-gray-600 text-sm space-y-3">
            {invoice?.id && (
              <p>
                Invoice reference:{" "}
                <strong className="font-mono select-all">{invoice.id}</strong>
              </p>
            )}
            <p>
              A confirmation email will be sent to the address on your
              registration. Keep it with your original registration receipt.
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 rounded-xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              Back to conference site
            </a>
          </div>
        </div>
      </div>
    );
  }

  const invoiceStatus = String(invoice?.paymentStatus || "").toLowerCase();
  const canPay = invoiceStatus === "pending";

  return (
    <div className="animate-in fade-in duration-300" role="main">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-primary)" }}
        >
          Pay remaining registration balance
        </h1>
        <p className="text-gray-600 text-sm">
          Use the email and registration ID from your confirmation if you were
          asked to pay a remaining balance on your ISIR 2026 registration.
        </p>
      </div>

      {!registration ? (
        <form
          onSubmit={onLookup}
          className="space-y-4 p-6 rounded-xl border-2 border-gray-200 bg-gray-50/50"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Find your remaining balance
          </h2>
          <p className="text-sm text-gray-600">
            Enter the email from your registration confirmation and your
            registration ID (e.g.{" "}
            <span className="font-mono text-xs">REG-…</span>
            ).
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Registration email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="name@institution.org"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Registration ID
            </label>
            <input
              type="text"
              value={registrationIdInput}
              onChange={(e) => setRegistrationIdInput(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono"
              placeholder="REG-…"
            />
          </div>
          {lookupError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {lookupError}
            </div>
          )}
          <button
            type="submit"
            disabled={lookingUp}
            className="px-8 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          >
            {lookingUp ? "Looking up…" : "Find remaining balance"}
          </button>
        </form>
      ) : !clientSecret ? (
        <form onSubmit={onStartPayment} className="space-y-6">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-900">
            <p className="font-semibold">
              Found: {registration.firstName} {registration.lastName}
            </p>
            <p className="mt-1">
              Registration{" "}
              <span className="font-mono select-all">{registration.id}</span>
              {registration.emailMasked
                ? ` · ${registration.emailMasked}`
                : ""}
            </p>
            <button
              type="button"
              onClick={resetToLookup}
              className="mt-2 text-sm font-medium text-blue-800 underline"
            >
              Use a different registration
            </button>
          </div>

          {!canPay ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              {invoiceStatus === "completed"
                ? "This remaining balance has already been paid. Thank you."
                : "There is no outstanding balance to pay on this registration. Contact "}
              {invoiceStatus !== "completed" && (
                <a
                  href="mailto:support@isir2026.org"
                  className="font-semibold underline"
                >
                  support@isir2026.org
                </a>
              )}
              {invoiceStatus !== "completed" ? " if you need help." : ""}
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200">
                <p className="font-semibold text-gray-800">Remaining balance</p>
                {invoice.reason && (
                  <p className="text-sm text-gray-600 mt-1">{invoice.reason}</p>
                )}
                <p className="mt-4 text-right text-lg font-bold text-gray-900">
                  Amount due: {formatCurrency(Number(invoice.amountUsd || 0))}
                </p>
              </div>

              {paymentSetupError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {paymentSetupError}
                </div>
              )}

              <button
                type="submit"
                disabled={settingUpPayment}
                className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                {settingUpPayment
                  ? "Setting up payment…"
                  : "Continue to payment →"}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <p className="font-semibold">
              Paying remaining balance ·{" "}
              {formatCurrency(amountUsd || Number(invoice?.amountUsd || 0))}
            </p>
            <p className="mt-1 font-mono text-xs">{registration.id}</p>
            <button
              type="button"
              onClick={() => setClientSecret(null)}
              className="mt-2 text-sm font-medium text-blue-800 underline"
              disabled={isProcessingPayment}
            >
              Back
            </button>
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              amount={Math.round((amountUsd || 0) * 100)}
              currency="USD"
              isProcessing={isProcessingPayment}
              setIsProcessing={setIsProcessingPayment}
              onSuccess={() => setSubmitted(true)}
              onError={() => setIsProcessingPayment(false)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
