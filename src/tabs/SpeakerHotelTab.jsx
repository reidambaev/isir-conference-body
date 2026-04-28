import React, { useEffect, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountrySelect } from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import {
  CONFERENCE_HOTEL_STAY_DATE_MAX,
  CONFERENCE_HOTEL_STAY_DATE_MIN,
} from "../config/constants";

function normalizeClientEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function parseIsoDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || "").trim())) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function overlapNightsWithinCongress(arrivalIso, departureIso) {
  const arrival = parseIsoDate(arrivalIso);
  const departure = parseIsoDate(departureIso);
  const congressStart = parseIsoDate(CONFERENCE_HOTEL_STAY_DATE_MIN);
  const congressEnd = parseIsoDate(CONFERENCE_HOTEL_STAY_DATE_MAX);
  if (!arrival || !departure || !congressStart || !congressEnd) return 0;
  if (departure <= arrival) return 0;
  const overlapStart = arrival > congressStart ? arrival : congressStart;
  const overlapEnd = departure < congressEnd ? departure : congressEnd;
  if (overlapEnd <= overlapStart) return 0;
  return Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
}

export default function SpeakerHotelTab() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  /** Same CountrySelect object shape as RegistrationForm (`country`) */
  const [nationalityCountry, setNationalityCountry] = useState(null);
  const [passportName, setPassportName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [addressPhysical, setAddressPhysical] = useState("");
  /** E.164 string or undefined (same pattern as RegistrationForm office/cell phone) */
  const [phone, setPhone] = useState(undefined);
  /** Longest allowed stay within congress dates (Nov 5–8, 2026) */
  const [arrivalDate, setArrivalDate] = useState(
    CONFERENCE_HOTEL_STAY_DATE_MIN,
  );
  const [departureDate, setDepartureDate] = useState(
    CONFERENCE_HOTEL_STAY_DATE_MAX,
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  /** Shown on success screen (confirmation email targets) */
  const [confirmationEmails, setConfirmationEmails] = useState([]);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);
  /** Vite dev only: UI preview without calling the API */
  const [devPreviewBypass, setDevPreviewBypass] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("email");
      if (q) setInviteEmail(q.trim());
    } catch {
      // ignore
    }
  }, []);

  const onVerifyInvite = async (e) => {
    e.preventDefault();
    setVerifyError(null);
    const email = normalizeClientEmail(inviteEmail);
    if (!email) {
      setVerifyError("Enter the email address your invitation was sent to.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/speaker-hotel/check-invite?email=${encodeURIComponent(email)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not verify email");
      }
      if (!data.invited) {
        setVerifyError(
          "No invited speaker record found for that email. Use the same address as in your speaker invitation.",
        );
        setVerifiedEmail(null);
        return;
      }
      setVerifiedEmail(email);
      setDevPreviewBypass(false);
    } catch (err) {
      setVerifyError(
        err?.message ||
          "Could not reach the server. Try again or contact the organizers.",
      );
      setVerifiedEmail(null);
    } finally {
      setVerifying(false);
    }
  };

  const skipVerificationForLocalPreview = () => {
    setVerifyError(null);
    setDevPreviewBypass(true);
    const email =
      normalizeClientEmail(inviteEmail) || "preview-local@dev.invalid";
    setVerifiedEmail(email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!verifiedEmail) {
      setSubmitError("Verify your invited-speaker email first.");
      return;
    }
    const nationalityName = String(nationalityCountry?.name || "").trim();
    const passportNameValue = String(passportName || "").trim();
    if (!passportNameValue || !nationalityName || !addressPhysical.trim()) {
      setSubmitError(
        "Name as on passport, nationality, and physical address are required.",
      );
      return;
    }
    const phoneStr = String(phone || "").trim();
    if (!phoneStr) {
      setSubmitError("Phone number is required.");
      return;
    }
    if (!Number.isFinite(guestCount) || guestCount < 1 || guestCount > 50) {
      setSubmitError(
        "Number of guests must be between 1 and 50 (include yourself).",
      );
      return;
    }
    if (!arrivalDate || !departureDate) {
      setSubmitError("Arrival and departure dates are required.");
      return;
    }
    if (departureDate < arrivalDate) {
      setSubmitError("Departure must be on or after arrival.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/speaker-hotel-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedSpeakerEmail: verifiedEmail,
          passportName: passportNameValue,
          nationality: nationalityName,
          guestCount,
          addressPhysical: addressPhysical.trim(),
          phone: phoneStr,
          arrivalDate,
          departureDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Submission failed. Please check your details.",
        );
      }
      setConfirmationEmails([verifiedEmail]);
      setConfirmationEmailSent(Boolean(data.confirmationEmailSent));
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
              Hotel information received
            </h1>
            <p className="text-blue-100">
              Thank you. This form collects planning information for the
              organizers and does not directly book your hotel room.
            </p>
          </div>
          <div className="p-8 bg-white text-center text-gray-600 text-sm">
            {confirmationEmails.length > 0 && (
              <p className="mb-4 text-gray-700">
                {confirmationEmailSent ? (
                  <>
                    A confirmation email with your submitted hotel information
                    has been
                    sent to{" "}
                    {confirmationEmails.map((em, i) => (
                      <React.Fragment key={em}>
                        {i > 0 && " and "}
                        <strong className="select-all">{em}</strong>
                      </React.Fragment>
                    ))}
                    .
                  </>
                ) : (
                  <>
                    Your hotel information was saved. We could not send a
                    confirmation email (mail not configured or the send failed).
                    You can keep this page or contact the organizers if you need
                    written confirmation.
                  </>
                )}
              </p>
            )}
            <p className="mb-4">
              If you need to change anything, submit this information form again
              with the
              same invited-speaker email; your latest submission will be kept.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2 rounded-xl font-semibold text-white"
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
          Invited speaker — hotel information form
        </h1>
        <p className="text-gray-600 text-sm">
          For ISIR 2026 (Busan). This page is for hotel planning information
          only (not direct hotel booking). You may choose dates outside congress
          week. Lodging support only applies to up to 3 nights during{" "}
          <strong>
            {CONFERENCE_HOTEL_STAY_DATE_MIN} through{" "}
            {CONFERENCE_HOTEL_STAY_DATE_MAX}
          </strong>
          .
        </p>
      </div>

      {!verifiedEmail ? (
        <form
          onSubmit={onVerifyInvite}
          className="space-y-4 p-6 rounded-xl border-2 border-gray-200 bg-gray-50/50"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Step 1 — Confirm your invited-speaker email
          </h2>
          <p className="text-sm text-gray-600">
            We only accept hotel information submissions from addresses listed
            in our invited speaker database (same email your invitation used).
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Invitation email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="name@institution.org"
              required
            />
          </div>
          {verifyError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {verifyError}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={verifying}
              className="px-8 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              {verifying ? "Checking…" : "Verify email"}
            </button>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={skipVerificationForLocalPreview}
                className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100"
              >
                Skip verification (localhost only)
              </button>
            )}
          </div>
          {import.meta.env.DEV && (
            <p className="text-xs text-amber-800/90">
              Dev-only: opens the rest of the form without the worker / D1.
              Submit still calls the API unless you skip filling the form.
            </p>
          )}
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-900">
            {devPreviewBypass && (
              <p className="mb-2 text-amber-900 font-medium text-xs uppercase tracking-wide">
                Localhost preview — not checked against speaker_invites
              </p>
            )}
            <strong>Verified:</strong>{" "}
            <span className="select-all">{verifiedEmail}</span>
            <button
              type="button"
              className="ml-3 text-green-800 underline font-medium"
              onClick={() => {
                setVerifiedEmail(null);
                setDevPreviewBypass(false);
                setSubmitError(null);
                setPassportName("");
                setNationalityCountry(null);
                setPhone(undefined);
                setArrivalDate(CONFERENCE_HOTEL_STAY_DATE_MIN);
                setDepartureDate(CONFERENCE_HOTEL_STAY_DATE_MAX);
              }}
            >
              Use a different email
            </button>
            <p className="mt-2 text-xs text-green-800/90">
              This email is used to match your invited-speaker record and to
              save your hotel information details.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Name as on passport <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={passportName}
              onChange={(e) => setPassportName(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter full name exactly as shown on passport"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nationality <span className="text-red-500">*</span>
            </label>
            <CountrySelect
              onChange={(e) => {
                setNationalityCountry(e);
              }}
              placeHolder="Select Country"
              defaultValue={nationalityCountry}
              containerClassName="w-full"
              inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Number of guests <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Total people in your party, including yourself.
            </p>
            <input
              type="number"
              min={1}
              max={50}
              value={guestCount}
              onChange={(e) =>
                setGuestCount(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full max-w-xs border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Home address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={addressPhysical}
              onChange={(e) => setAddressPhysical(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Street, city, state / province / region, postal code, country"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              international
              defaultCountry="US"
              value={phone}
              onChange={setPhone}
              className="phone-input-custom border-2 border-gray-200 rounded-xl bg-white focus-within:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Arrival date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Departure date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Congress lodging support covers up to <strong>3 nights</strong>{" "}
              during the congress window ({CONFERENCE_HOTEL_STAY_DATE_MIN} to{" "}
              {CONFERENCE_HOTEL_STAY_DATE_MAX}). Extra nights can still be
              requested as information, but may not be covered.
            </p>
            <p className="mt-1">
              Nights within congress window for this selection:{" "}
              <strong>
                {Math.min(3, overlapNightsWithinCongress(arrivalDate, departureDate))}
              </strong>
              .
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-10 py-3 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          >
            {submitting ? "Submitting…" : "Submit hotel registration"}
          </button>
        </form>
      )}
    </div>
  );
}
