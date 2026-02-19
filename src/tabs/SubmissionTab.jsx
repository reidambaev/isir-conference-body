import React, { useState, useMemo } from "react";
import { SUBMISSION_OPEN, isPreviewMode } from "../config/constants";

const SubmissionTab = () => {
  const [abstractType, setAbstractType] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    allAuthors: [
      {
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        isPresenter: true,
        isCorresponding: true,
        affiliations: [
          {
            institution: "",
            department: "",
            city: "",
            country: "",
          },
        ],
      },
    ],
    category: "",
    keywords: "",
    abstract: "",
    presentationPreference: "oral",
    isInvitedSpeaker: false,
    youngInvestigator: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successId, setSuccessId] = useState("");

  const handleCloseError = () => {
    setSubmitStatus(null);
    setErrorMessage("");
  };

  const categories = [
    "Immune Regulation in Reproduction",
    "Early Pregnancy and Implantation",
    "Placental Development and Function",
    "Preeclampsia and Pregnancy Complications",
    "Recurrent Pregnancy Loss",
    "Male Reproductive Immunology",
    "Endometriosis and Reproductive Disorders",
    "ART and Fertility Treatment",
    "Infection and Vaccination in Pregnancy",
    "Autoimmune Conditions and Pregnancy",
    "Microbiome and Reproduction",
    "Novel Technologies and Methods",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrorMessage("");
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.title.trim()) return "Abstract title is required";
    if (formData.title.length > 150) {
      return `Title exceeds 150 character limit (current: ${formData.title.length} characters)`;
    }

    // Find presenter
    const presenter = formData.allAuthors.find((a) => a.isPresenter);
    if (!presenter) return "A presenting author must be designated";

    // Find corresponding author
    const corresponding = formData.allAuthors.find((a) => a.isCorresponding);
    if (!corresponding) return "A corresponding author must be designated";

    // Validate presenter author
    if (!presenter.firstName || !presenter.firstName.trim())
      return "Presenter first name is required";
    if (!presenter.lastName || !presenter.lastName.trim())
      return "Presenter last name is required";
    if (!presenter.email || !presenter.email.trim())
      return "Presenter email is required";

    // Validate corresponding author
    if (!corresponding.firstName || !corresponding.firstName.trim())
      return "Corresponding author first name is required";
    if (!corresponding.lastName || !corresponding.lastName.trim())
      return "Corresponding author last name is required";
    if (!corresponding.email || !corresponding.email.trim())
      return "Corresponding author email is required";

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(presenter.email)) {
      return "Invalid presenter email format";
    }

    // Validate all authors
    for (const author of formData.allAuthors) {
      if (!author.firstName || !author.firstName.trim()) {
        return "First name is required for all authors";
      }
      if (!author.lastName || !author.lastName.trim()) {
        return "Last name is required for all authors";
      }
      if (!author.affiliations || author.affiliations.length === 0) {
        return "Each author must have at least one affiliation";
      }
      // Validate each affiliation
      for (const aff of author.affiliations) {
        if (!aff.institution || !aff.institution.trim()) {
          return "Institution is required for all affiliations";
        }
        if (!aff.city || !aff.city.trim()) {
          return "City is required for all affiliations";
        }
        if (!aff.country || !aff.country.trim()) {
          return "Country is required for all affiliations";
        }
      }
    }

    if (!formData.category) return "Category selection is required";
    if (!formData.keywords.trim()) return "Keywords are required";
    if (!formData.abstract.trim()) return "Abstract text is required";

    // Check word count
    const wordCount = formData.abstract.split(/\s+/).filter((w) => w).length;
    if (wordCount > 300) {
      return `Abstract exceeds 300 word limit (current: ${wordCount} words)`;
    }
    if (wordCount < 50) {
      return "Abstract must be at least 50 words";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous messages
    setErrorMessage("");
    setSuccessId("");
    setSubmitStatus(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSubmitStatus("error");
      return;
    }

    // Build authors array with affiliations
    const authors = formData.allAuthors.map((author, authorIndex) => ({
      firstName: author.firstName.trim(),
      middleName: author.middleName?.trim() || null,
      lastName: author.lastName.trim(),
      email: author.email?.trim() || null,
      isPresenter: author.isPresenter || false,
      isCorresponding: author.isCorresponding || false,
      affiliations: author.affiliations.map((aff) => ({
        institution: aff.institution.trim(),
        department: aff.department?.trim() || null,
        city: aff.city.trim(),
        country: aff.country.trim(),
      })),
    }));

    const presenter = formData.allAuthors.find((a) => a.isPresenter);
    const corresponding = formData.allAuthors.find((a) => a.isCorresponding);

    setLoading(true);
    setSubmitStatus("submitting");

    try {
      // Flatten affiliations from authors for API payload
      const affiliations = authors.flatMap((author) =>
        (author.affiliations || []).map((aff) => ({
          authorName: `${author.firstName} ${author.lastName}`.trim(),
          department: aff.department?.trim() || "",
          institution: aff.institution.trim(),
          city: aff.city.trim(),
          country: aff.country.trim(),
        })),
      );

      const response = await fetch("/api/abstract-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          authors: JSON.stringify(authors),
          affiliations: JSON.stringify(affiliations),
          category: formData.category,
          keywords: formData.keywords,
          abstract: formData.abstract,
          presentationPreference: formData.presentationPreference,
          youngInvestigator: formData.youngInvestigator,
          presenterName: `${presenter.firstName} ${presenter.lastName}`,
          presenterEmail: presenter.email,
          correspondingName: `${corresponding.firstName} ${corresponding.lastName}`,
          correspondingEmail: corresponding.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitStatus("error");
        setErrorMessage(result.error || "Failed to submit abstract");
      } else {
        setSubmitStatus("success");
        setSuccessId(result.submissionId);
        // Reset form
        setFormData({
          title: "",
          allAuthors: [
            {
              firstName: "",
              middleName: "",
              lastName: "",
              email: "",
              isPresenter: true,
              isCorresponding: true,
              affiliations: [
                {
                  institution: "",
                  department: "",
                  city: "",
                  country: "",
                },
              ],
            },
          ],
          category: "",
          keywords: "",
          abstract: "",
          presentationPreference: "oral",
          youngInvestigator: false,
        });
        setAbstractType("");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Check submission access on every render to catch URL parameter changes
  const submissionOpen = SUBMISSION_OPEN || isPreviewMode();
  const inPreviewMode = isPreviewMode();

  return (
    <div role="tabpanel">
      {/* Preview mode indicator */}
      {inPreviewMode && (
        <div className="mb-4 p-3 rounded-lg bg-purple-100 border border-purple-300 text-purple-800 text-sm flex items-center gap-2">
          <span className="font-semibold">🔓 Preview Mode</span> - Submission is
          unlocked for testing
        </div>
      )}

      {/* Submission closed banner */}
      {!submissionOpen && (
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
            <strong>Abstract submission is currently closed.</strong> All
            details below are for your information. Please check back when
            submission opens on March 15th, 2026.
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="mb-8">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Abstract Submission
            </h3>
            <p className="text-gray-500">Submit your research for ISIR 2026</p>
          </div>
        </div>
      </header>

      {/* Important Dates Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
        <h4 className="font-bold text-lg mb-3">Important Submission Dates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-80">Submission Opens</div>
            <div className="font-bold">March 15, 2026</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-80">Submission Deadline</div>
            <div className="font-bold">July 1, 2026</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-80">Notification of Acceptance</div>
            <div className="font-bold">August 1, 2026</div>
          </div>
        </div>
      </div>

      {/* Submission Guidelines */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h4
          className="text-xl font-bold mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Abstract Format Requirements
        </h4>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              1
            </div>
            <div>
              <strong>Title:</strong> Maximum 150 characters. Only the first
              word should be capitalized.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              2
            </div>
            <div>
              <strong>Authors:</strong> First name, Last name, and affiliation
              (marked with numerical index such as 1, 2, 3).
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              3
            </div>
            <div>
              <strong>Body:</strong> Maximum 300 words.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              4
            </div>
            <div>
              <strong>Structure:</strong> Include Objectives, Methods, Results,
              and Conclusions sections in your abstract.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              5
            </div>
            <div>
              <strong>Presentation Type:</strong> Select oral or poster
              presentation preference.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              7
            </div>
            <div>
              <strong>Registration:</strong> The presenting author must be
              registered for the congress by September 1, 2026 for the abstract
              to be included in the program.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              8
            </div>
            <div>
              <strong>No Edits After Submission:</strong> Once you submit your
              abstract, you cannot edit it. Please review carefully before
              submitting.
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h4
              className="font-bold text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              Oral Presentation
            </h4>
          </div>
          <p className="text-gray-700 text-sm">
            9-minute oral presentation followed by a 2-minute Q&A session.
            Selected abstracts will be scheduled in parallel sessions.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4
              className="font-bold text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              Poster Presentation
            </h4>
          </div>
          <p className="text-gray-700 text-sm">
            Poster dimensions: TBD. Posters will be displayed during designated
            poster sessions.
          </p>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div
          className="p-4 border-b"
          style={{
            background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
          }}
        >
          <h4 className="text-lg font-bold text-white">Submit Your Abstract</h4>
        </div>

        {/* Success Message */}
        {submitStatus === "success" && (
          <div className="p-6 bg-green-50 border-b-2 border-green-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
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
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-1">
                  Submission Successful!
                </h3>
                <p className="text-green-800 mb-2">
                  Your abstract has been submitted successfully. You will
                  receive a confirmation email shortly.
                </p>
                <p className="text-sm text-green-700 font-mono">
                  Submission ID: {successId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {submitStatus === "error" && (
          <div className="p-6 bg-red-50 border-b-2 border-red-500">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  Submission Failed
                </h3>
                <p className="text-red-800">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseError}
                className="text-red-700 hover:text-red-900 font-semibold"
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error Modal Overlay */}
        {submitStatus === "error" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-[90%] p-6 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 mb-2">
                    Submission Failed
                  </h3>
                  <p className="text-red-800 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseError}
                  className="text-red-700 hover:text-red-900 font-semibold text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseError}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
          style={{ display: submitStatus === "success" ? "none" : "block" }}
        >
          {/* Abstract Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Abstract Title <span className="text-red-500">*</span>
              <span className="font-normal text-gray-500 ml-2">
                (Maximum 150 characters, only first word capitalized)
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter your abstract title"
              maxLength={150}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            <p
              className={`text-xs mt-1 text-right font-medium ${
                formData.title.length > 150 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {formData.title.length} / 150 characters
            </p>
          </div>

          {/* All Authors */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Authors <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              List all authors. Use the ↑↓ buttons to reorder. Mark one author
              as the presenting author and one as the corresponding author (both
              required). Authors will appear in the order shown.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> All correspondence regarding this
                abstract will be sent to the corresponding author's email
                address. The presenting author will deliver the presentation at
                the conference.
              </p>
            </div>

            {/* Authors List */}
            <div className="space-y-3 mb-4">
              {formData.allAuthors.map((author, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border relative transition-all ${
                    author.isPresenter
                      ? "bg-blue-50 border-blue-300 border-2"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* Move Up Button */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAuthors = [...formData.allAuthors];
                          [newAuthors[index - 1], newAuthors[index]] = [
                            newAuthors[index],
                            newAuthors[index - 1],
                          ];
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {/* Move Down Button */}
                    {index < formData.allAuthors.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAuthors = [...formData.allAuthors];
                          [newAuthors[index], newAuthors[index + 1]] = [
                            newAuthors[index + 1],
                            newAuthors[index],
                          ];
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    {/* Remove Button */}
                    {formData.allAuthors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const authorToRemove = formData.allAuthors[index];
                          const newAuthors = formData.allAuthors.filter(
                            (_, i) => i !== index,
                          );

                          // If we're removing the presenter, make the first author the new presenter
                          if (
                            authorToRemove.isPresenter &&
                            newAuthors.length > 0
                          ) {
                            newAuthors[0].isPresenter = true;
                          }

                          // If we're removing the corresponding author, make the first author the new corresponding author
                          if (
                            authorToRemove.isCorresponding &&
                            newAuthors.length > 0
                          ) {
                            newAuthors[0].isCorresponding = true;
                          }

                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 text-lg"
                        title="Remove author"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600">
                      Author #{index + 1}
                    </span>
                    {author.isPresenter && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        PRESENTING AUTHOR
                      </span>
                    )}
                    {author.isCorresponding && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                        CORRESPONDING AUTHOR
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author.firstName || ""}
                        onChange={(e) => {
                          const newAuthors = [...formData.allAuthors];
                          newAuthors[index].firstName = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        placeholder="e.g., Jane"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Middle Name (optional)
                      </label>
                      <input
                        type="text"
                        value={author.middleName || ""}
                        onChange={(e) => {
                          const newAuthors = [...formData.allAuthors];
                          newAuthors[index].middleName = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        placeholder="e.g., Marie"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={author.lastName || ""}
                        onChange={(e) => {
                          const newAuthors = [...formData.allAuthors];
                          newAuthors[index].lastName = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        placeholder="e.g., Doe"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Email{" "}
                        {(author.isPresenter || author.isCorresponding) && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={author.email || ""}
                        onChange={(e) => {
                          const newAuthors = [...formData.allAuthors];
                          newAuthors[index].email = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            allAuthors: newAuthors,
                          }));
                        }}
                        placeholder="author@example.com"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={author.isPresenter || author.isCorresponding}
                      />
                    </div>

                    <div className="flex gap-4 items-end md:col-span-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="presenterAuthor"
                          checked={author.isPresenter || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newAuthors = formData.allAuthors.map(
                                (a, i) => ({
                                  ...a,
                                  isPresenter: i === index,
                                }),
                              );
                              setFormData((prev) => ({
                                ...prev,
                                allAuthors: newAuthors,
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700 font-semibold">
                          Presenting Author
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="correspondingAuthor"
                          checked={author.isCorresponding || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newAuthors = formData.allAuthors.map(
                                (a, i) => ({
                                  ...a,
                                  isCorresponding: i === index,
                                }),
                              );
                              setFormData((prev) => ({
                                ...prev,
                                allAuthors: newAuthors,
                              }));
                            }
                          }}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-gray-700 font-semibold">
                          Corresponding Author
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Affiliations for this author */}
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Affiliations <span className="text-red-500">*</span>
                      <span className="font-normal text-gray-500 ml-1">
                        (at least one required)
                      </span>
                    </label>

                    <div className="space-y-2">
                      {(author.affiliations || []).map((aff, affIndex) => (
                        <div
                          key={affIndex}
                          className="p-3 bg-white rounded-lg border border-gray-300 relative"
                        >
                          {author.affiliations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newAuthors = [...formData.allAuthors];
                                newAuthors[index].affiliations = newAuthors[
                                  index
                                ].affiliations.filter((_, i) => i !== affIndex);
                                setFormData((prev) => ({
                                  ...prev,
                                  allAuthors: newAuthors,
                                }));
                              }}
                              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg"
                              title="Remove affiliation"
                            >
                              ×
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-6">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Institution{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={aff.institution || ""}
                                onChange={(e) => {
                                  const newAuthors = [...formData.allAuthors];
                                  newAuthors[index].affiliations[
                                    affIndex
                                  ].institution = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    allAuthors: newAuthors,
                                  }));
                                }}
                                placeholder="e.g., Harvard University"
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Department (optional)
                              </label>
                              <input
                                type="text"
                                value={aff.department || ""}
                                onChange={(e) => {
                                  const newAuthors = [...formData.allAuthors];
                                  newAuthors[index].affiliations[
                                    affIndex
                                  ].department = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    allAuthors: newAuthors,
                                  }));
                                }}
                                placeholder="e.g., Department of Biology"
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                City <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={aff.city || ""}
                                onChange={(e) => {
                                  const newAuthors = [...formData.allAuthors];
                                  newAuthors[index].affiliations[
                                    affIndex
                                  ].city = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    allAuthors: newAuthors,
                                  }));
                                }}
                                placeholder="e.g., Boston"
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Country <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={aff.country || ""}
                                onChange={(e) => {
                                  const newAuthors = [...formData.allAuthors];
                                  newAuthors[index].affiliations[
                                    affIndex
                                  ].country = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    allAuthors: newAuthors,
                                  }));
                                }}
                                placeholder="e.g., United States"
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Affiliation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newAuthors = [...formData.allAuthors];
                        if (!newAuthors[index].affiliations) {
                          newAuthors[index].affiliations = [];
                        }
                        newAuthors[index].affiliations.push({
                          institution: "",
                          department: "",
                          city: "",
                          country: "",
                        });
                        setFormData((prev) => ({
                          ...prev,
                          allAuthors: newAuthors,
                        }));
                      }}
                      className="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded hover:bg-green-100 transition-all border border-green-200"
                    >
                      <span>+</span>
                      Add Another Affiliation
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Author Button */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  allAuthors: [
                    ...prev.allAuthors,
                    {
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      email: "",
                      isPresenter: false,
                      isCorresponding: false,
                      affiliations: [
                        {
                          institution: "",
                          department: "",
                          city: "",
                          country: "",
                        },
                      ],
                    },
                  ],
                }));
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all border border-blue-200"
            >
              <span>+</span>
              Add Another Author
            </button>
          </div>

          {/* Category and Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Keywords <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="3-5 keywords, separated by commas"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Abstract Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Abstract <span className="text-red-500">*</span>
              <span className="font-normal text-gray-500 ml-2">
                (Maximum 300 words)
              </span>
            </label>
            <textarea
              name="abstract"
              value={formData.abstract}
              onChange={handleInputChange}
              placeholder="Objectives:&#10;&#10;Methods:&#10;&#10;Results:&#10;&#10;Conclusions:"
              rows={10}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
              required
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Include Objectives, Methods, Results, and Conclusions sections.
              </p>
              <p
                className={`text-xs font-medium ${
                  formData.abstract.split(/\s+/).filter((w) => w).length > 300
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {formData.abstract.split(/\s+/).filter((w) => w).length} / 300
                words
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isInvitedSpeaker"
                checked={formData.isInvitedSpeaker}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isInvitedSpeaker: e.target.checked,
                    // Optional: Auto-set preference to Oral if invited
                    presentationPreference: e.target.checked
                      ? "oral"
                      : prev.presentationPreference,
                  }))
                }
                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
              />
              <div>
                <span className="font-bold text-gray-900">
                  Invited Speaker Submission
                </span>
                <div className="text-sm text-gray-700 mt-1 space-y-1">
                  <p>Please only check this box if:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      You have received an <strong>official invitation</strong>{" "}
                      from ISIR to speak.
                    </li>
                    <li>
                      This submission is an abstract of your{" "}
                      <strong>TALK</strong> (you may submit additional abstracts
                      separately).
                    </li>
                  </ul>
                </div>
              </div>
            </label>
          </div>

          {/* Presentation Preference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Presentation Preference <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="presentationPreference"
                  value="oral"
                  checked={formData.presentationPreference === "oral"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">
                  Oral presentation only
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="presentationPreference"
                  value="either"
                  checked={formData.presentationPreference === "either"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">
                  Oral preferred, but willing to present as poster
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="presentationPreference"
                  value="poster"
                  checked={formData.presentationPreference === "poster"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">
                  Poster presentation only
                </span>
              </label>
            </div>
          </div>

          {/* Young Investigator Competition */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="youngInvestigator"
                checked={formData.youngInvestigator}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 mt-0.5 rounded"
              />
              <div className="ml-3">
                <span className="font-semibold text-gray-800 block">
                  Enter the Young Investigator Competition
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  I would like to enter the Young Investigator Competition.
                  Eligibility: Trainees (graduate students, postdocs, medical
                  residents/fellows) who are the presenting author of their
                  abstract.
                </p>
                <div className="mt-2 text-xs text-gray-600 bg-blue-100 rounded-lg p-2">
                  <strong>Note:</strong> Winners will be announced during the
                  conference and receive awards. You must be registered and
                  present your work in person to be eligible.
                </div>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || !submissionOpen}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
                loading || !submissionOpen
                  ? "bg-blue-400 cursor-not-allowed opacity-75"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : !submissionOpen ? (
                "Submission Closed"
              ) : (
                "Submit Abstract"
              )}
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Submission deadline: July 1, 2026
            </p>
          </div>
        </form>
      </div>

      {/* Contact Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Questions about abstract submission?</strong> Contact us at{" "}
          <a
            href="mailto:abstracts@isir2026.org"
            className="underline hover:text-blue-600"
          >
            abstracts@isir2026.org
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubmissionTab;
