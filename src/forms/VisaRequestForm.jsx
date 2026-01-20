import React, { useState } from "react";

const VisaRequestForm = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    country: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.name || !formData.country) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/visa-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit visa request");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Visa request error:", error);
      setError("Failed to submit visa request. Please try again.");
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
            <h3 className="text-3xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-green-100 text-lg">
              We will contact you shortly with visa support documents
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              You will receive a confirmation email at{" "}
              <strong>{formData.email}</strong>
            </p>
            <button
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                Visa Support Request
              </h2>
              <p className="text-gray-600 text-sm">
                For ISIR 2026 World Congress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter your full name"
              />
            </div>

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
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Your country of residence"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Any special requirements or additional information..."
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisaRequestForm;
