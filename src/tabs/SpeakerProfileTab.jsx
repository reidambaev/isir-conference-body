import React, { useState } from "react";

const MAX_PHOTO_BYTES = 800 * 1024;

export default function SpeakerProfileTab() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [imagePosition, setImagePosition] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    if (f && f.size > MAX_PHOTO_BYTES) {
      setError(
        `Please choose an image under ${Math.floor(MAX_PHOTO_BYTES / 1024)} KB (JPEG or PNG).`,
      );
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim() || !name.trim() || !affiliation.trim()) {
      setError("Email, name, and affiliation are required.");
      return;
    }
    if (file && file.size > MAX_PHOTO_BYTES) {
      setError(
        `Photo must be under ${Math.floor(MAX_PHOTO_BYTES / 1024)} KB (JPEG or PNG).`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("email", email.trim());
      fd.set("name", name.trim());
      fd.set("affiliation", affiliation.trim());
      if (imagePosition.trim()) {
        fd.set("imagePosition", imagePosition.trim());
      }
      if (file) {
        fd.set("file", file);
      }

      const res = await fetch("/api/speaker-profiles/submit", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || "Submission failed. Try again or contact support.");
        return;
      }
      setMessage(data.message || "Submitted successfully.");
      setFile(null);
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
          New speaker registration
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Enter your name and affiliation as they should appear in the
          program. You may add an optional headshot. Submissions are reviewed
          before they go live. Photos are limited to{" "}
          {Math.floor(MAX_PHOTO_BYTES / 1024)} KB (JPEG or PNG).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Name (as it should appear) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="Your full name"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            placeholder="Department, organization, city, country"
          />
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
            JPEG or PNG, max {Math.floor(MAX_PHOTO_BYTES / 1024)} KB. Without a
            photo, approved entries show initials in the same style as other
            speakers.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1.5">
            Image crop (optional)
          </label>
          <input
            type="text"
            value={imagePosition}
            onChange={(e) => setImagePosition(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono"
            placeholder="e.g. center 20% (CSS object-position)"
          />
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
