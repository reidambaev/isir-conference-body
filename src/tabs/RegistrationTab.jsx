import React, { useEffect, useState } from "react";
import RegistrationForm from "../forms/RegistrationForm";
import { REGISTRATION_OPEN, isPreviewMode } from "../config/constants";
import galaImage from "../assets/gala.jpg";

const RegistrationTab = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  // Check on every render to catch URL parameter changes
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const hasInviteLink = Boolean(params?.get("invite"));
  const registrationOpen = REGISTRATION_OPEN || isPreviewMode();
  const inPreviewMode = isPreviewMode();

  useEffect(() => {
    if (hasInviteLink && registrationOpen) setShowRegistrationForm(true);
  }, [hasInviteLink, registrationOpen]);

  if (showRegistrationForm && registrationOpen) {
    return <RegistrationForm onClose={() => setShowRegistrationForm(false)} />;
  }

  return (
    <div role="tabpanel">
      {/* Preview mode indicator */}
      {inPreviewMode && (
        <div className="mb-4 p-3 rounded-lg bg-purple-100 border border-purple-300 text-purple-800 text-sm flex items-center gap-2">
          <span className="font-semibold">🔓 Preview Mode</span> - Registration
          is unlocked for testing
        </div>
      )}

      {/* Registration closed banner */}
      {!registrationOpen && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-800 flex items-center gap-3">
          <svg
            className="w-8 h-8 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <p className="font-semibold">
              Registration is temporarily closed and will be available again
              soon.
            </p>
            <p>
              All details below are for your information. Please check back
              shortly—we'll reopen registration as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* Invite link override banner */}
      {!REGISTRATION_OPEN && !inPreviewMode && registrationOpen && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 flex items-center gap-3">
          <svg
            className="w-8 h-8 flex-shrink-0"
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
          <div>
            <p className="font-semibold">Invited speaker access enabled.</p>
            <p>
              Registration is closed for the public, but this invite link allows
              you to register.
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              className="w-6 h-6 text-white"
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
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Registration
            </h3>
            <p className="text-gray-600">Secure your spot at ISIR 2026</p>
          </div>
        </div>
      </div>

      {/* Membership Info Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-start">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              className="w-5 h-5 text-white"
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
          </div>
          <div>
            <p className="text-gray-700 mb-3">
              Members as well as non-members must register to have access to the
              meeting program. ISIR Members in good standing at the time of
              registration will have the opportunity to register at{" "}
              <strong>strongly reduced registration fees</strong>.
            </p>
            <a
              href="https://theisir.org/benefits/"
              className="inline-flex items-center text-sm font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Find out all about ISIR membership and its many benefits here
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Early Bird Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: "var(--color-secondary)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "var(--color-primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4
                className="text-xl font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                Early Bird Discount!
              </h4>
              <p className="text-gray-700">
                Register by <strong>July 10, 2026</strong> and save up to{" "}
                <strong>$100</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => registrationOpen && setShowRegistrationForm(true)}
            disabled={!registrationOpen}
            className="px-8 py-3 rounded-xl font-bold shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
          >
            {registrationOpen
              ? "Register Now"
              : "Registration temporarily closed"}
          </button>
        </div>
      </div>

      {/* Registration Fees - Full Width */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div
          className="p-5 border-b"
          style={{
            background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
          }}
        >
          <h4 className="text-xl font-bold text-white flex items-center">
            <svg
              className="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Registration Fees
          </h4>
        </div>
        <div className="p-6">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Note:</span> All fees are charged
              per participant in US Dollars ($).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ISIR Member */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900">ISIR Member</h5>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Best Value
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $350
                </span>
                <span className="text-sm text-gray-500 line-through">$450</span>
              </div>
              <p className="text-xs text-gray-500">Early Bird / Standard</p>
            </div>

            {/* Non-Member */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900">Non-Member</h5>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $650
                </span>
                <span className="text-sm text-gray-500 line-through">$750</span>
              </div>
              <p className="text-xs text-gray-500">Early Bird / Standard</p>
            </div>

            {/* Daypass */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900 leading-snug">
                  Daypass{" "}
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    (Korean locals only)
                  </span>
                </h5>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $200
                </span>
                <span className="text-sm text-gray-500 line-through">$250</span>
              </div>
              <p className="text-xs text-gray-500">
                Early Bird / Standard (per selected day)
              </p>
            </div>

            {/* Trainee/Student Member */}
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900">
                  Trainee/Student Member
                </h5>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $150
                </span>
                <span className="text-sm text-gray-500 line-through">$200</span>
              </div>
              <p className="text-xs text-gray-500">Early Bird / Standard*</p>
            </div>

            {/* Trainee/Student Non-Member */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900">
                  Trainee/Student Non-Member
                </h5>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $250
                </span>
                <span className="text-sm text-gray-500 line-through">$300</span>
              </div>
              <p className="text-xs text-gray-500">Early Bird / Standard*</p>
            </div>

            {/* Accompanying Person */}
            <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-5 border-2 border-rose-200 hover:border-rose-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-gray-900">Accompanying Person</h5>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  $250
                </span>
                <span className="text-sm text-gray-500 line-through">$350</span>
              </div>
              <p className="text-xs text-gray-500">Early Bird / Standard**</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">*</span> Trainee/Student rate
              requires proof of current enrollment status.
              <br />
              <span className="font-semibold">**</span> Accompanying person fee
              includes Welcome Reception and the Gala evening only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* What's Included Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="p-4 border-b"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              <h4 className="text-lg font-bold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
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
                What's Included
              </h4>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={galaImage}
                  alt="Gala evening at the Busan Cinema Center"
                  className="w-full h-40 md:h-48 object-cover"
                />
                <div className="p-3 text-sm text-gray-700">
                  <strong>Gala Evening:</strong> All meeting
                  participants are invited to a Gala evening at
                  the iconic Busan Cinema Center, featuring live
                  performances by renowned Korean musicians and artists. Join us
                  for an unforgettable cultural evening in Busan!
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { text: "All Scientific Sessions", icon: "🎓" },
                  { text: "Welcome Reception", icon: "🥂" },
                  { text: "Poster Sessions", icon: "📊" },
                  { text: "Congress Materials", icon: "📚" },
                  { text: "Certificate of Attendance", icon: "🏆" },
                  { text: "Coffee Breaks & Refreshments", icon: "☕" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-xl mr-3">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Steps To Register */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="p-4 border-b"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              <h4 className="text-lg font-bold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Steps To Register
              </h4>
            </div>
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="flex items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-4 shadow-md"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 mb-1">
                    Create an Account
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    Choose either ISIR Member or Non-Member account. Members
                    receive discounted registration rates.
                  </p>
                  <a
                    href="https://theisir.org/membership-account/membership-levels/"
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Create Account
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-gray-200 ml-6 h-4"></div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-4 shadow-md"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 mb-1">
                    Register for the Event
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    Complete your congress registration and select your
                    category. Early bird rates available until September 1,
                    2026.
                  </p>
                  <button
                    onClick={() =>
                      registrationOpen && setShowRegistrationForm(true)
                    }
                    disabled={!registrationOpen}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {registrationOpen
                      ? "Register Now"
                      : "Registration temporarily closed"}
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-10 mb-10">
        <div className="flex items-center mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4
            className="text-xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            Frequently Asked Questions
          </h4>
        </div>

        <div className="space-y-4">
          <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">
                What is included in the registration fee?
              </span>
              <svg
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
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
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              <p className="mb-3">Your registration includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  In-person attendance, whereby participants are physically
                  present in Busan, Korea
                </li>
                <li>
                  Admission to the main scientific programme and the exhibition
                </li>
                <li>Access to the sponsored sessions or booth onsite</li>
                <li>Gala evening</li>
                <li>
                  A certificate of attendance after completion of an evaluation
                </li>
              </ul>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">
                What is the cancellation and refund policy?
              </span>
              <svg
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
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
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              <p>All registration fees are non-refundable.</p>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">
                Can I transfer my registration to someone else?
              </span>
              <svg
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
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
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              <p>No. You cannot transfer your registration to someone else.</p>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">
                Will there be on-site registration available?
              </span>
              <svg
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
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
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              <p>
                Onsite payments are equal to late rate fees and name changes are
                not possible.
              </p>
            </div>
          </details>

          <details className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="font-medium text-gray-800">
                Will I receive a Certificate of Attendance?
              </span>
              <svg
                className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
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
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              <p>
                Yes, if you register and attend the meeting. You need to request
                a certificate to the congress.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Call to Action - Register Now */}
      <div className="mt-10 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-center shadow-xl">
        <h4 className="text-2xl font-bold text-white mb-3">
          Ready to Register?
        </h4>
        <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
          Join leading researchers and clinicians from around the world at the
          16th ISIR World Congress in beautiful Busan, Korea.
        </p>
        <button
          onClick={() => registrationOpen && setShowRegistrationForm(true)}
          disabled={!registrationOpen}
          className="inline-flex items-center px-10 py-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-primary)",
          }}
        >
          <svg
            className="w-6 h-6 mr-2"
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
          {registrationOpen
            ? "Start Registration Now"
            : "Registration temporarily closed"}
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RegistrationTab;
