import React, { useState } from "react";
import {
  ADDITIONAL_SPONSORSHIP_OPPORTUNITIES,
  SPONSORSHIP_CONTACT_EMAIL,
  SPONSORSHIP_TIERS,
  sponsorshipPackageLabel,
} from "../config/sponsorship";

const INTEREST_OPTIONS = [
  { value: "sponsorship", label: "Sponsorship package" },
  { value: "exhibition", label: "Exhibition / Booth" },
  { value: "both", label: "Sponsorship & Exhibition" },
  { value: "undecided", label: "Not sure yet — I'd like to learn more" },
];
const SponsorshipContactForm = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    interest: "",
    packageInterest: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.company || !formData.name || !formData.email || !formData.interest) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sponsorship-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit inquiry");
      }

      setIsSubmitted(true);
    } catch (submitError) {
      console.error("Sponsorship inquiry error:", submitError);
      setError(
        submitError.message || "Failed to submit inquiry. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-2">Inquiry Submitted!</h3>
            <p className="text-green-100 text-lg">
              Thank you for your interest in sponsoring ISIR 2026
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              A confirmation email will be sent to{" "}
              <strong>{formData.email}</strong>. The ISIR 2026 Organizing
              Committee will review your inquiry and respond within 2–3 business
              days at{" "}
              <a
                href={`mailto:${SPONSORSHIP_CONTACT_EMAIL}`}
                className="text-blue-600 hover:underline"
              >
                {SPONSORSHIP_CONTACT_EMAIL}
              </a>
              .
            </p>            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                Sponsorship Inquiry
              </h2>
              <p className="text-gray-600 text-sm">
                ISIR 2026 · November 5–8, BEXCO, Busan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
            aria-label="Close form"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Partner with ISIR 2026 and connect with global leaders in
            reproductive immunology, women&apos;s health, and reproductive
            medicine. Tell us about your organization and we&apos;ll follow up
            with package details from the sponsorship prospectus.
          </p>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company / Organization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Your company or organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="your.email@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                I am interested in <span className="text-red-500">*</span>
              </label>
              <select
                name="interest"
                value={formData.interest}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">Select an option</option>
                {INTEREST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Package of Interest
              </label>
              <select
                name="packageInterest"
                value={formData.packageInterest}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">Select a package (optional)</option>
                <optgroup label="Sponsorship levels">
                  {SPONSORSHIP_TIERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {sponsorshipPackageLabel(option)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Additional opportunities">
                  {ADDITIONAL_SPONSORSHIP_OPPORTUNITIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {sponsorshipPackageLabel(option)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  <option value="custom">Customized package</option>
                  <option value="not_sure">Not sure yet</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                See the{" "}
                <a
                  href="/ISIR-2026-Sponsorship-Prospectus.pdf"
                  download="ISIR-2026-Sponsorship-Prospectus.pdf"
                  className="text-blue-600 hover:underline"
                >
                  sponsorship prospectus
                </a>{" "}
                for full benefit details.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y"
                placeholder="Tell us about your goals, questions, or any specific requirements..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorshipContactForm;
