import React, { useState } from "react";

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
      },
    ],
    presenterRole: "",
    affiliations: [],
    category: "",
    keywords: "",
    abstract: "",
    presentationPreference: "oral",
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successId, setSuccessId] = useState("");

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Validate presenter author
    if (!presenter.firstName || !presenter.firstName.trim())
      return "Presenter first name is required";
    if (!presenter.lastName || !presenter.lastName.trim())
      return "Presenter last name is required";
    if (!presenter.email || !presenter.email.trim())
      return "Presenter email is required";

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
    }

    if (
      !Array.isArray(formData.affiliations) ||
      formData.affiliations.length === 0
    ) {
      return "At least one affiliation is required";
    }

    // Validate each affiliation
    for (const aff of formData.affiliations) {
      if (!aff.institution || !aff.institution.trim()) {
        return "Institution is required for all affiliations";
      }
      if (!aff.country || !aff.country.trim()) {
        return "Country is required for all affiliations";
      }
      if (!aff.city || !aff.city.trim()) {
        return "City is required for all affiliations";
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

    if (!formData.presenterRole) {
      return "Please select your role";
    }

    return null;
  };

  const fillExample = () => {
    setFormData({
      title: "Maternal immune tolerance mechanisms in successful pregnancy",
      allAuthors: [
        {
          firstName: "Sarah",
          middleName: "Elizabeth",
          lastName: "Johnson",
          email: "sarah.johnson@university.edu",
          isPresenter: true,
        },
        {
          firstName: "Michael",
          middleName: "",
          lastName: "Chen",
          email: "m.chen@research.org",
          isPresenter: false,
        },
        {
          firstName: "Elena",
          middleName: "",
          lastName: "Rodriguez",
          email: "e.rodriguez@institute.edu",
          isPresenter: false,
        },
      ],
      presenterRole: "phd-student",
      affiliations: [
        {
          institution: "University of Medical Sciences",
          department: "Department of Reproductive Immunology",
          city: "Boston",
          state: "Massachusetts",
          country: "United States",
        },
        {
          institution: "International Research Institute",
          department: "Center for Maternal-Fetal Medicine",
          city: "London",
          state: "",
          country: "United Kingdom",
        },
      ],
      category: "Immune Regulation in Reproduction",
      keywords:
        "maternal tolerance, regulatory T cells, immune adaptation, pregnancy immunology, fetal-maternal interface",
      abstract:
        "Objectives: To investigate the role of regulatory T cells (Tregs) in establishing maternal immune tolerance during early pregnancy and identify key molecular mechanisms involved in immune adaptation at the maternal-fetal interface. Methods: We conducted a prospective study of 120 pregnant women in their first trimester, analyzing peripheral blood and decidual tissue samples. Flow cytometry was used to characterize Treg populations, while RNA sequencing identified differentially expressed genes. Results: Treg populations showed significant expansion (2.3-fold increase, p<0.001) during early pregnancy compared to non-pregnant controls. We identified upregulation of FOXP3, IL-10, and TGF-β pathways, along with novel markers associated with enhanced suppressive function. Women who later experienced pregnancy complications showed reduced Treg expansion and altered gene expression patterns. Conclusions: Our findings demonstrate that successful pregnancy establishment requires robust Treg expansion and specific molecular adaptations. These insights may inform future therapeutic strategies for preventing pregnancy complications related to immune dysregulation.",
      presentationPreference: "oral",
    });
    setAbstractType("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous messages
    setErrorMessage("");
    setSuccessId("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Build authors array
    const authors = formData.allAuthors.map((author) => ({
      firstName: author.firstName.trim(),
      middleName: author.middleName?.trim() || null,
      lastName: author.lastName.trim(),
      email: author.email?.trim() || null,
      isPresenter: author.isPresenter || false,
    }));

    const presenter = formData.allAuthors.find((a) => a.isPresenter);

    setLoading(true);
    setSubmitStatus("submitting");

    try {
      const response = await fetch("/api/abstract-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          authors: JSON.stringify(authors),
          category: formData.category,
          keywords: formData.keywords,
          abstract: formData.abstract,
          presentationPreference: formData.presentationPreference,
          presenterRole: formData.presenterRole,
          presenterName: `${presenter.firstName} ${presenter.lastName}`,
          presenterEmail: presenter.email,
          affiliations: JSON.stringify(formData.affiliations),
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
            },
          ],
          presenterRole: "",
          affiliations: [],
          category: "",
          keywords: "",
          abstract: "",
          presentationPreference: "oral",
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

  return (
    <div role="tabpanel">
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
            <div className="font-bold">February 1, 2026</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-80">Submission Deadline</div>
            <div className="font-bold">April 30, 2026</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-80">Notification of Acceptance</div>
            <div className="font-bold">May 20, 2026</div>
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
              <strong>Title:</strong> Maximum 150 characters, bold format. Only
              the first word should be capitalized.
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
              <strong>Formatting:</strong> Use Times New Roman font, size 12.
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              6
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
              registered for the congress by July 10, 2026 for the abstract to
              be included in the program.
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

        {/* Error Message */}
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
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-1">
                  Submission Failed
                </h3>
                <p className="text-red-800">{errorMessage}</p>
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
              as the presenting author (required). Authors will appear in the
              order shown.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> All correspondence regarding this
                abstract will be sent to the presenting author's email address.
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
                            (_, i) => i !== index
                          );

                          // If we're removing the presenter, make the first author the new presenter
                          if (
                            authorToRemove.isPresenter &&
                            newAuthors.length > 0
                          ) {
                            newAuthors[0].isPresenter = true;
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
                        {author.isPresenter && (
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
                        required={author.isPresenter}
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
                                })
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
                    </div>
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

          {/* I am a */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              I am a: <span className="text-red-500">*</span>
            </label>
            <select
              name="presenterRole"
              value={formData.presenterRole || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              required
            >
              <option value="">Select your role...</option>
              <option value="Post Doc">Post Doc</option>
              <option value="Resident">Resident</option>
              <option value="Graduate Student">Graduate Student</option>
              <option value="Medical Student">Medical Student</option>
              <option value="Clinical Fellow">Clinical Fellow</option>
              <option value="N/A">N/A</option>
            </select>
          </div>

          {/* Affiliations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Affiliations <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add the institutional affiliations for authors. Each affiliation
              includes department, institution, city, and country.
            </p>

            {/* Affiliations List */}
            <div className="space-y-3 mb-4">
              {formData.affiliations.map((aff, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        affiliations: prev.affiliations.filter(
                          (_, i) => i !== index
                        ),
                      }));
                    }}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
                  >
                    ×
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Author Name (optional)
                      </label>
                      <select
                        value={aff.authorName || ""}
                        onChange={(e) => {
                          const newAff = [...formData.affiliations];
                          newAff[index].authorName = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            affiliations: newAff,
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select an author...</option>
                        {formData.allAuthors.map((author, authIdx) => (
                          <option
                            key={authIdx}
                            value={`${author.firstName} ${author.lastName}`.trim()}
                          >
                            {`${author.firstName} ${author.lastName}`.trim()}
                            {author.isPresenter ? " (Presenter)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Department (optional)
                      </label>
                      <input
                        type="text"
                        value={aff.department || ""}
                        onChange={(e) => {
                          const newAff = [...formData.affiliations];
                          newAff[index].department = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            affiliations: newAff,
                          }));
                        }}
                        placeholder="e.g., Department of Biology"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aff.institution || ""}
                        onChange={(e) => {
                          const newAff = [...formData.affiliations];
                          newAff[index].institution = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            affiliations: newAff,
                          }));
                        }}
                        placeholder="e.g., Harvard University"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aff.city || ""}
                        onChange={(e) => {
                          const newAff = [...formData.affiliations];
                          newAff[index].city = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            affiliations: newAff,
                          }));
                        }}
                        placeholder="e.g., Boston"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aff.country || ""}
                        onChange={(e) => {
                          const newAff = [...formData.affiliations];
                          newAff[index].country = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            affiliations: newAff,
                          }));
                        }}
                        placeholder="e.g., United States"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                setFormData((prev) => ({
                  ...prev,
                  affiliations: [
                    ...prev.affiliations,
                    {
                      authorName: "",
                      department: "",
                      institution: "",
                      city: "",
                      country: "",
                    },
                  ],
                }));
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all border border-blue-200"
            >
              <span>+</span>
              Add Another Affiliation
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

          {/* Presentation Preference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Presentation Preference <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="presentationPreference"
                  value="oral"
                  checked={formData.presentationPreference === "oral"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Oral presentation</span>
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
                <span className="ml-2 text-gray-700">Poster presentation</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            {/* Fill Example Button */}
            <button
              type="button"
              onClick={fillExample}
              className="w-full mb-3 py-3 rounded-xl font-semibold text-blue-600 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              Fill Example Data
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
                loading
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
              ) : (
                "Submit Abstract"
              )}
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Submission deadline: April 30, 2026
            </p>
          </div>
        </form>
      </div>

      {/* Contact Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Questions about abstract submission?</strong> Contact us at{" "}
          <a
            href="mailto:abstracts@theisir.org"
            className="underline hover:text-blue-600"
          >
            abstracts@theisir.org
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubmissionTab;
