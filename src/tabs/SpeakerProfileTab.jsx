import React, { useEffect, useState } from "react";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MiB
const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MiB
const MAX_AFFILIATION_CHARS = 90;
const MAX_PRESENTATION_TITLE_CHARS = 300;

export default function SpeakerProfileTab() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [presentationTitle, setPresentationTitle] = useState("");
  const [briefCv, setBriefCv] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    if (f && f.size > MAX_PHOTO_BYTES) {
      setError("Please choose an image under 5 MB (JPEG or PNG).");
    }
  };

  const onBriefCvChange = (e) => {
    const f = e.target.files?.[0];
    setBriefCv(f || null);
    setError(null);
    if (f && f.size > MAX_CV_BYTES) {
      setError("Brief CV must be under 10 MB (PDF or Word).");
    }
  };

  const clearBriefCv = () => {
    setBriefCv(null);
    setError(null);
  };

  const clearPhoto = () => {
    setFile(null);
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (
      !email.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !affiliation.trim()
    ) {
      setError("Email, first name, last name, and affiliation are required.");
      return;
    }
    if (file && file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be under 5 MB (JPEG or PNG).");
      return;
    }
    if (affiliation.trim().length > MAX_AFFILIATION_CHARS) {
      setError(`Affiliation must be ${MAX_AFFILIATION_CHARS} characters or fewer.`);
      return;
    }
    if (!presentationTitle.trim()) {
      setError("Title of presentation is required.");
      return;
    }
    if (presentationTitle.trim().length > MAX_PRESENTATION_TITLE_CHARS) {
      setError(
        `Presentation title must be ${MAX_PRESENTATION_TITLE_CHARS} characters or fewer.`,
      );
      return;
    }
    if (!briefCv) {
      setError("Brief CV (PDF or Word) is required.");
      return;
    }
    if (briefCv.size > MAX_CV_BYTES) {
      setError("Brief CV must be under 10 MB (PDF or Word).");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("email", email.trim());
      fd.set("first_name", firstName.trim());
      fd.set("middle_name", middleName.trim());
      fd.set("last_name", lastName.trim());
      fd.set("affiliation", affiliation.trim());
      fd.set("presentation_title", presentationTitle.trim());
      if (file) {
        fd.set("file", file);
      }
      fd.set("brief_cv", briefCv);

      const res = await fetch("/api/speaker-profiles/submit", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(
          data.error || "Submission failed. Try again or contact support.",
        );
        return;
      }
      setMessage(data.message || "Submitted successfully.");
      setFile(null);
      setBriefCv(null);
      setPresentationTitle("");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="tabpanel" className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Speaker profile
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Enter your first, middle (optional), and last name plus affiliation as
          they should appear in the program. A presentation title and brief CV
          (for organizer reference only; not shown on the public site) are
          required. You may add an optional headshot. Submissions are reviewed
          before they go live. Photos may be up to 5 MB (JPEG or PNG). CVs may
          be up to 10 MB (PDF or Word).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              First name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Last name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Middle name (optional)
          </label>
          <input
            type="text"
            autoComplete="additional-name"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="Middle name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="you@institution.org"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Affiliation / institution <span className="text-red-600">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            maxLength={MAX_AFFILIATION_CHARS}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="Department, organization, city, country"
          />
          <p className="mt-1 text-xs text-gray-500">
            {affiliation.length}/{MAX_AFFILIATION_CHARS} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Title of presentation{" "}
            <span className="text-red-600">*</span>{" "}
            <span className="text-gray-500 font-normal">(organizer reference only)</span>
          </label>
          <input
            type="text"
            required
            value={presentationTitle}
            onChange={(e) => setPresentationTitle(e.target.value)}
            maxLength={MAX_PRESENTATION_TITLE_CHARS}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="Working title of your talk"
          />
          <p className="mt-1 text-xs text-gray-500">
            Not shown on the public website. {presentationTitle.length}/
            {MAX_PRESENTATION_TITLE_CHARS}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Brief CV (PDF or Word) <span className="text-red-600">*</span>{" "}
            <span className="text-gray-500 font-normal">(organizer reference only)</span>
          </label>
          <input
            type="file"
            required
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onBriefCvChange}
            className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-50 file:text-slate-800"
          />
          <p className="mt-1 text-xs text-gray-500">
            Max 10 MB. Stored for organizers; not published on the site.
          </p>
          {briefCv && briefCv.size <= MAX_CV_BYTES && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-medium">Selected:</span> {briefCv.name} (
              {(briefCv.size / 1024).toFixed(1)} KB)
              <button
                type="button"
                onClick={clearBriefCv}
                className="ml-3 text-red-700 font-medium hover:underline"
              >
                Remove file
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Headshot (optional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={onFileChange}
            className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-800"
          />
          <p className="mt-1 text-xs text-gray-500">
            JPEG or PNG, max 5 MB. Without a photo, approved entries show
            initials in the same style as other speakers.
          </p>
          {previewUrl && file && file.size <= MAX_PHOTO_BYTES && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Same avatar frame as main Speakers grid (SpeakersTab): w-28 + border-2 secondary */}
              <div className="flex-shrink-0 mx-auto sm:mx-0 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Headshot preview"
                  className="w-28 h-28 rounded-full object-cover border-2 flex-shrink-0"
                  style={{
                    borderColor: "var(--color-secondary)",
                  }}
                />
              </div>
              <div className="flex-1 text-sm text-gray-600 pt-1">
                <p className="font-medium text-gray-800 mb-1">Preview</p>
                <p className="text-xs mb-3">
                  {(file.size / 1024).toFixed(1)} KB.
                </p>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-sm text-red-700 font-medium hover:underline"
                >
                  Remove photo
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white shadow-md disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {submitting ? "Submitting…" : "Submit profile"}
        </button>
      </form>
    </div>
  );
}
