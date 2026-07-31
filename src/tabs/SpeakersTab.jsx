import React, { useEffect, useState } from "react";

function getInitials(name) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function speakerImgSrc(speaker) {
  if (speaker.r2_key) return `/${speaker.r2_key}`;
  if (speaker.image) return `/speakers/${speaker.image}`;
  return null;
}

/** Lazy-loads speaker photos; soft placeholder until the image arrives. */
function SpeakerPhoto({
  src,
  alt,
  className,
  style,
  eager = false,
  fallback,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (!src || failed) return fallback;

  const { objectPosition, ...wrapperStyle } = style || {};

  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={wrapperStyle}
    >
      {!loaded && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gray-200"
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={objectPosition ? { objectPosition } : undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function SpeakersTab() {
  const [plenarySpeakers, setPlenarySpeakers] = useState([]);
  const [forumSpeakers, setForumSpeakers] = useState([]);
  const [congressSpeakers, setCongressSpeakers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadPublic = async () => {
      try {
        const res = await fetch("/api/speaker-profiles/public", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data.success) return;
        if (cancelled) return;
        setPlenarySpeakers(Array.isArray(data.plenary) ? data.plenary : []);
        setForumSpeakers(Array.isArray(data.forum) ? data.forum : []);
        setCongressSpeakers(Array.isArray(data.congress) ? data.congress : []);
      } catch {
        if (!cancelled) {
          setPlenarySpeakers([]);
          setForumSpeakers([]);
          setCongressSpeakers([]);
        }
      }
    };

    loadPublic();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadPublic();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const onPageShow = (e) => {
      if (e.persisted) {
        loadPublic();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <div role="tabpanel">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Speakers
            </h3>
            <p className="text-gray-600">Speakers at ISIR 2026</p>
          </div>
        </div>
      </div>

      <div
        className="mb-14 -mx-6 sm:-mx-8 px-6 sm:px-8 py-10 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, #1e3a5f 100%)",
        }}
      >
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-3 bg-white/20 text-white">
            Keynote Presentations
          </span>
          <h4 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Plenary Speakers
          </h4>
          <p className="text-blue-200 text-base max-w-xl mx-auto">
            Our distinguished plenary speakers will present keynotes at the
            congress.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plenarySpeakers.map((speaker) => {
            const imgSrc = speakerImgSrc(speaker);
            return (
              <div
                key={speaker.key}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
                <div
                  className="rounded-full p-1 mb-5"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  }}
                >
                  <SpeakerPhoto
                    src={imgSrc}
                    alt={speaker.name}
                    eager
                    className="w-36 h-36 rounded-full border-4 border-white flex-shrink-0"
                    style={{
                      ...(speaker.image_position && {
                        objectPosition: speaker.image_position,
                      }),
                    }}
                    fallback={
                      <div
                        className="w-36 h-36 rounded-full flex items-center justify-center border-4 border-white text-3xl font-bold text-white flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary)",
                        }}
                      >
                        {getInitials(speaker.name)}
                      </div>
                    }
                  />
                </div>
                <h5
                  className="text-xl font-extrabold mb-2 leading-tight"
                  style={{ color: "var(--color-primary)" }}
                >
                  {speaker.name}
                </h5>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {speaker.affiliation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="mb-14 -mx-6 sm:-mx-8 px-6 sm:px-8 py-9 rounded-2xl border border-sky-200"
        style={{
          background:
            "linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 55%, #f8fafc 100%)",
        }}
      >
        <div className="text-center mb-8">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-3 bg-sky-200/80 text-sky-900">
            Ask the Expert
          </span>
          <h4
            className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            Public Forum Speakers
          </h4>
          <p className="text-sky-900/70 text-sm max-w-xl mx-auto">
            Featured clinicians joining the Public Forum sessions throughout the
            congress.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {forumSpeakers.map((speaker) => {
            const imgSrc = speakerImgSrc(speaker);
            return (
              <div
                key={speaker.key}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden border border-sky-100"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-sky-400" />
                <div className="rounded-full p-0.5 mb-4 bg-sky-200">
                  <SpeakerPhoto
                    src={imgSrc}
                    alt={speaker.name}
                    className="w-28 h-28 rounded-full border-2 border-white flex-shrink-0"
                    style={{
                      ...(speaker.image_position && {
                        objectPosition: speaker.image_position,
                      }),
                    }}
                    fallback={
                      <div className="w-28 h-28 rounded-full flex items-center justify-center border-2 border-white text-2xl font-bold text-white flex-shrink-0 bg-sky-600">
                        {getInitials(speaker.name)}
                      </div>
                    }
                  />
                </div>
                <h5
                  className="text-lg font-bold mb-1.5 leading-tight"
                  style={{ color: "var(--color-primary)" }}
                >
                  {speaker.name}
                </h5>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {speaker.affiliation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-10">
        <h4
          className="text-xl font-semibold mb-6 flex items-center"
          style={{ color: "var(--color-primary)" }}
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
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          Speakers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {congressSpeakers.map((speaker) => {
            const imgSrc = speakerImgSrc(speaker);
            return (
              <div
                key={speaker.key}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
              >
                <SpeakerPhoto
                  src={imgSrc}
                  alt={speaker.name}
                  className="w-28 h-28 rounded-full mb-3 border-2 flex-shrink-0"
                  style={{
                    borderColor: "var(--color-secondary)",
                    ...(speaker.image_position && {
                      objectPosition: speaker.image_position,
                    }),
                  }}
                  fallback={
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center mb-3 border-2 text-2xl font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        borderColor: "var(--color-secondary)",
                      }}
                    >
                      {getInitials(speaker.name)}
                    </div>
                  }
                />
                <h5
                  className="text-base font-bold mb-1.5 leading-tight"
                  style={{ color: "var(--color-primary)" }}
                >
                  {speaker.name}
                </h5>
                <p className="text-gray-600 text-xs leading-snug line-clamp-3">
                  {speaker.affiliation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-center shadow-xl">
        <h4 className="text-2xl font-bold text-white mb-3">
          Share Your Research
        </h4>
        <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
          Submit your abstract and join the speakers at ISIR 2026. Abstract
          submission opens March 15, 2026.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Submit Abstract
          </button>
          <button className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-xl border-2 border-white text-white hover:bg-white/10 transition-all duration-300">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Abstract Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpeakersTab;
