import React, { useRef, useState } from "react";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const VisaRequestForm = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isInvited, setIsInvited] = useState(false);
  const [registrationProof, setRegistrationProof] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    affiliation: "",
    nationality: "",
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInvitedToggle = () => {
    setIsInvited((prev) => {
      const next = !prev;
      if (next) {
        setRegistrationProof(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return next;
    });
    setError(null);
  };

  const validateFile = (file) => {
    if (!file) {
      return "Please upload a photo or PDF of your abstract acceptance or congress registration.";
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a PDF, JPG, or PNG file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit.";
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setRegistrationProof(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setRegistrationProof(file);
  };

  const handleRemoveFile = () => {
    setRegistrationProof(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.name ||
      !formData.affiliation ||
      !formData.nationality
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isInvited) {
      const fileError = validateFile(registrationProof);
      if (fileError) {
        setError(fileError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("email", formData.email.trim());
      body.append("name", formData.name.trim());
      body.append("affiliation", formData.affiliation.trim());
      body.append("nationality", formData.nationality.trim());
      body.append("isInvited", isInvited ? "true" : "false");
      if (!isInvited && registrationProof) {
        body.append("registrationProof", registrationProof);
      }

      const response = await fetch("/api/visa-request", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit visa request");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Visa request error:", err);
      setError(
        err?.message || "Failed to submit visa request. Please try again.",
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
            <h3 className="text-3xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-green-100 text-lg">
              Your information has been forwarded to our visa coordinator
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6">
              A confirmation email will be sent to{" "}
              <strong>{formData.email}</strong>. Ms. Lee will prepare your
              invitation letter using the standard template and follow up if
              needed.
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
                Visa Invitation Letter Request
              </h2>
              <p className="text-gray-600 text-sm">ISIR 2026 World Congress</p>
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
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900 leading-relaxed">
              You may request an invitation letter if you are an invited
              speaker/chair, have registered for the congress, or have had an
              abstract accepted.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Please enter your details exactly as they should appear on your visa
            invitation letter
            {isInvited
              ? ". As an invited speaker/chair, no proof upload is required."
              : ". You must also upload a photo or PDF of your abstract acceptance or congress registration confirmation."}{" "}
            Our coordinator will prepare your letter from this information.
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  I am an invited speaker/chair
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Turn this on to skip the abstract/registration proof upload
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isInvited}
                onClick={handleInvitedToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isInvited ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isInvited ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Formal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Full legal name as on passport"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Affiliation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="affiliation"
                value={formData.affiliation}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Institution or organization"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nationality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="e.g. United States, Japan, Germany"
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
              <p className="text-xs text-gray-500 mt-1">
                Used to send your invitation letter and any follow-up
              </p>
            </div>

            {!isInvited ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Abstract / Registration Proof{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload a photo or PDF of your abstract acceptance or congress
                  registration confirmation (PDF, JPG, or PNG, max 5MB).
                </p>

                {!registrationProof ? (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-gray-50 cursor-pointer transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={handleFileSelect}
                      className="hidden"
                      required={!isInvited}
                    />
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload abstract or registration proof
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, JPG, or PNG · max 5MB
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {registrationProof.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(registrationProof.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Proof upload skipped — you indicated you are an invited
                speaker/chair.
              </div>
            )}

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
