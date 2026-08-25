import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";
import { formatCurrency } from "../utils/currency";
import {
  EARLY_BIRD_DEADLINE,
  getAccompanyingPrice,
} from "../config/constants";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

function normalizeClientEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function AccompanyingTab() {
  const [email, setEmail] = useState("");
  const [registrationIdInput, setRegistrationIdInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const [registration, setRegistration] = useState(null);
  const [pricing, setPricing] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [guestNames, setGuestNames] = useState([""]);

  const [clientSecret, setClientSecret] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);
  const [amountUsd, setAmountUsd] = useState(0);
  const [paymentSetupError, setPaymentSetupError] = useState(null);
  const [settingUpPayment, setSettingUpPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const isEarlyBirdFallback = Date.now() < EARLY_BIRD_DEADLINE.getTime();
  const displayUnitPrice =
    pricing?.unitPriceUsd ?? getAccompanyingPrice(isEarlyBirdFallback);
  const displayIsEarlyBird = pricing?.isEarlyBird ?? isEarlyBirdFallback;
  const remaining = registration?.remainingSlots ?? 0;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qEmail = params.get("email");
      const qId = params.get("id") || params.get("registrationId");
      if (qEmail) setEmail(qEmail.trim());
      if (qId) setRegistrationIdInput(qId.trim());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setGuestNames((prev) => {
      const next = [...prev];
      while (next.length < quantity) next.push("");
      return next.slice(0, quantity);
    });
  }, [quantity]);

  const onLookup = async (e) => {
    e.preventDefault();
    setLookupError(null);
    setRegistration(null);
    setPricing(null);
    setClientSecret(null);
    setPurchaseId(null);
    setPaymentSetupError(null);

    const normalizedEmail = normalizeClientEmail(email);
    const regId = String(registrationIdInput || "").trim();
    if (!normalizedEmail && !regId) {
      setLookupError(
        "Enter the email used for registration, or your registration ID.",
      );
      return;
    }

    setLookingUp(true);
    try {
      const res = await fetch("/api/accompanying/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail || undefined,
          registrationId: regId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not find your registration");
      }
      setRegistration(data.registration);
      setPricing(data.pricing);
      const slots = Number(data.registration?.remainingSlots || 0);
      setQuantity(slots > 0 ? 1 : 0);
      if (slots <= 0) {
        setLookupError(
          "This registration already has the maximum number of accompanying persons.",
        );
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

  const onStartPayment = async (e) => {
    e.preventDefault();
    setPaymentSetupError(null);
    if (!registration?.id) {
      setPaymentSetupError("Look up your registration first.");
      return;
    }
    if (quantity < 1 || quantity > remaining) {
      setPaymentSetupError(
        remaining > 0
          ? `Choose between 1 and ${remaining} accompanying person(s).`
          : "No remaining accompanying person slots on this registration.",
      );
      return;
    }

    setSettingUpPayment(true);
    try {
      const res = await fetch("/api/accompanying/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          email: normalizeClientEmail(email),
          quantity,
          guestNames: guestNames.map((n) => n.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to set up payment");
      }
      setClientSecret(data.clientSecret);
      setPurchaseId(data.purchaseId);
      setAmountUsd(Number(data.amountUsd || 0));
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
    setPricing(null);
    setClientSecret(null);
    setPurchaseId(null);
    setPaymentSetupError(null);
    setLookupError(null);
    setQuantity(1);
    setGuestNames([""]);
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
            <h1 className="text-2xl font-bold mb-2">
              Accompanying person confirmed
            </h1>
            <p className="text-blue-100">
              Payment received. Your accompanying person(s) have been added to
              registration{" "}
              <span className="font-mono font-semibold select-all">
                {registration?.id}
              </span>
              .
            </p>
          </div>
          <div className="p-8 bg-white text-center text-gray-600 text-sm space-y-3">
            {purchaseId && (
              <p>
                Purchase reference:{" "}
                <strong className="font-mono select-all">{purchaseId}</strong>
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

  return (
    <div className="animate-in fade-in duration-300" role="main">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-primary)" }}
        >
          Add accompanying person
        </h1>
        <p className="text-gray-600 text-sm">
          Already registered? Add accompanying persons here (
          {formatCurrency(displayUnitPrice)} each
          {displayIsEarlyBird ? ", Early Bird" : ", Standard"}
          ). Fee includes Welcome Reception and the Gala evening.
        </p>
      </div>

      {!registration ? (
        <form
          onSubmit={onLookup}
          className="space-y-4 p-6 rounded-xl border-2 border-gray-200 bg-gray-50/50"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Step 1 — Find your registration
          </h2>
          <p className="text-sm text-gray-600">
            Use the email from your registration confirmation. You can also
            enter your registration ID (e.g.{" "}
            <span className="font-mono text-xs">REG-…</span>).
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
              Registration ID{" "}
              <span className="font-normal text-gray-500">(optional)</span>
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
            {lookingUp ? "Looking up…" : "Find registration"}
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
            <p className="mt-1 text-green-800">
              Current accompanying persons:{" "}
              <strong>{registration.accompanyingCount}</strong>
              {" · "}
              Slots remaining: <strong>{remaining}</strong>
            </p>
            <button
              type="button"
              onClick={resetToLookup}
              className="mt-2 text-sm font-medium text-blue-800 underline"
            >
              Use a different registration
            </button>
          </div>

          {remaining <= 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              This registration already has the maximum number of accompanying
              persons. Contact{" "}
              <a
                href="mailto:support@isir2026.org"
                className="font-semibold underline"
              >
                support@isir2026.org
              </a>{" "}
              if you need help.
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Accompanying Person
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(displayUnitPrice)} each (
                      {displayIsEarlyBird ? "Early Bird" : "Standard"})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.max(1, q - 1))
                      }
                      className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm"
                    >
                      −
                    </button>
                    <span
                      className="w-14 text-center font-bold text-2xl"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(remaining, q + 1))
                      }
                      className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-right text-lg font-bold text-gray-900">
                  Total: {formatCurrency(displayUnitPrice * quantity)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Guest names{" "}
                  <span className="font-normal text-gray-500">(optional)</span>
                </h3>
                <div className="space-y-2">
                  {guestNames.map((name, i) => (
                    <input
                      key={i}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const next = [...guestNames];
                        next[i] = e.target.value;
                        setGuestNames(next);
                      }}
                      className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder={`Accompanying person ${i + 1} name`}
                    />
                  ))}
                </div>
              </div>

              {paymentSetupError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {paymentSetupError}
                </div>
              )}

              <button
                type="submit"
                disabled={settingUpPayment || quantity < 1}
                className="w-full sm:w-auto px-8 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                {settingUpPayment
                  ? "Setting up payment…"
                  : `Continue to payment →`}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <p className="font-semibold">
              Paying for {quantity} accompanying person
              {quantity === 1 ? "" : "s"} ·{" "}
              {formatCurrency(amountUsd || displayUnitPrice * quantity)}
            </p>
            <p className="mt-1 font-mono text-xs">{registration.id}</p>
            <button
              type="button"
              onClick={() => {
                setClientSecret(null);
                setPurchaseId(null);
              }}
              className="mt-2 text-sm font-medium text-blue-800 underline"
              disabled={isProcessingPayment}
            >
              Change quantity
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
