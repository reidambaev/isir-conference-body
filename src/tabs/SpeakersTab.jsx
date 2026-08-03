import React, { useEffect, useRef, useState } from "react";
import { getSpeakerBio } from "../speakerBios";

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

function sameSpeaker(a, b) {
  if (!a || !b) return false;
  if (a.id != null && b.id != null) return String(a.id) === String(b.id);
  return a.key === b.key;
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

function BioSection({ label, children, tone = "default" }) {
  const labelClass =
    tone === "forum"
      ? "text-sky-800/70"
      : tone === "onDark"
        ? "text-gray-500"
        : "text-gray-500";
  return (
    <div className="text-left">
      <p
        className={`text-[11px] font-semibold tracking-wider uppercase mb-1.5 ${labelClass}`}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/** Layout C: Who / Focus / Why / At ISIR — shown inside an expanded card. */
function SpeakerBioExpand({ bio, tone = "plenary" }) {
  const chipClass =
    tone === "forum"
      ? "bg-sky-50 text-sky-900 border-sky-200"
      : "bg-slate-50 text-slate-800 border-slate-200";
  const atIsirClass =
    tone === "forum" ? "bg-sky-50/80 border-sky-200" : "border-amber-200/80";

  return (
    <div className="w-full mt-5 pt-5 border-t border-gray-100 space-y-4 text-left">
      <BioSection label="Who" tone={tone}>
        <p className="text-sm text-gray-700 leading-relaxed">{bio.who}</p>
      </BioSection>

      <BioSection label="Focus" tone={tone}>
        <div className="flex flex-wrap gap-1.5">
          {bio.focus.map((item) => (
            <span
              key={item}
              className={`inline-block text-xs px-2.5 py-1 rounded-md border ${chipClass}`}
            >
              {item}
            </span>
          ))}
        </div>
      </BioSection>

      <BioSection label="Why it matters" tone={tone}>
        <p className="text-sm text-gray-700 leading-relaxed">{bio.why}</p>
      </BioSection>

      {bio.atIsir && (
        <div
          className={`rounded-xl border px-3.5 py-3 ${atIsirClass}`}
          style={
            tone === "forum"
              ? undefined
              : {
                  backgroundColor:
                    "color-mix(in srgb, var(--color-secondary) 12%, white)",
                }
          }
        >
          <p
            className="text-[11px] font-semibold tracking-wider uppercase mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            At ISIR 2026
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{bio.atIsir}</p>
        </div>
      )}
    </div>
  );
}

function interactiveProps(speaker, selected, onSelect) {
  const isSelected = sameSpeaker(selected, speaker);
  return {
    role: "button",
    tabIndex: 0,
    "aria-expanded": isSelected,
    "aria-label": `${isSelected ? "Hide" : "Show"} biography for ${speaker.name}`,
    onClick: () => onSelect(speaker),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(speaker);
      }
    },
  };
}

function SpeakersTab() {
  const [plenarySpeakers, setPlenarySpeakers] = useState([]);
  const [forumSpeakers, setForumSpeakers] = useState([]);
  const [congressSpeakers, setCongressSpeakers] = useState([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const expandRef = useRef(null);

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

  useEffect(() => {
    if (!selectedSpeaker) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedSpeaker(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedSpeaker]);

  useEffect(() => {
    if (selectedSpeaker && expandRef.current) {
      expandRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedSpeaker]);

  const toggleSpeaker = (speaker) => {
    setSelectedSpeaker((prev) =>
      sameSpeaker(prev, speaker) ? null : speaker,
    );
  };

  const plenaryHasBios = plenarySpeakers.some((s) => getSpeakerBio(s));
  const forumHasBios = forumSpeakers.some((s) => getSpeakerBio(s));

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
            {plenaryHasBios && (
              <>
                {" "}
                <span className="text-blue-100/90">
                  Select a speaker to learn more.
                </span>
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plenarySpeakers.map((speaker) => {
            const imgSrc = speakerImgSrc(speaker);
            const bio = getSpeakerBio(speaker);
            const interactive = Boolean(bio);
            const isSelected = sameSpeaker(selectedSpeaker, speaker);
            return (
              <div
                key={speaker.key}
                ref={isSelected ? expandRef : undefined}
                className={`bg-white rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden ${
                  isSelected
                    ? "md:col-span-3 items-stretch text-left"
                    : "items-center text-center"
                } ${
                  interactive
                    ? `cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-secondary)] ${
                        isSelected
                          ? "ring-2 ring-[var(--color-secondary)] ring-offset-2"
                          : "hover:bg-slate-50"
                      }`
                    : ""
                }`}
                {...(interactive
                  ? interactiveProps(speaker, selectedSpeaker, toggleSpeaker)
                  : {})}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: "var(--color-secondary)" }}
                />
                <div
                  className={`flex w-full ${
                    isSelected
                      ? "flex-col sm:flex-row sm:items-start gap-5"
                      : "flex-col items-center"
                  }`}
                >
                  <SpeakerPhoto
                    src={imgSrc}
                    alt={speaker.name}
                    eager
                    className={`rounded-full border-2 flex-shrink-0 ${
                      isSelected ? "w-28 h-28" : "w-36 h-36 mb-5"
                    }`}
                    style={{
                      borderColor: "var(--color-secondary)",
                      ...(speaker.image_position && {
                        objectPosition: speaker.image_position,
                      }),
                    }}
                    fallback={
                      <div
                        className={`rounded-full flex items-center justify-center border-2 font-bold text-white flex-shrink-0 ${
                          isSelected
                            ? "w-28 h-28 text-2xl"
                            : "w-36 h-36 mb-5 text-3xl"
                        }`}
                        style={{
                          backgroundColor: "var(--color-primary)",
                          borderColor: "var(--color-secondary)",
                        }}
                      >
                        {getInitials(speaker.name)}
                      </div>
                    }
                  />
                  <div
                    className={`min-w-0 ${
                      isSelected ? "text-left flex-1" : "text-center"
                    }`}
                  >
                    <h5
                      className={`font-extrabold mb-2 leading-tight ${
                        isSelected ? "text-2xl" : "text-xl"
                      }`}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: interactive ? "underline" : undefined,
                        textDecorationColor: interactive
                          ? "color-mix(in srgb, var(--color-secondary) 55%, transparent)"
                          : undefined,
                        textDecorationThickness: interactive ? "1px" : undefined,
                        textUnderlineOffset: interactive ? "4px" : undefined,
                      }}
                    >
                      {speaker.name}
                    </h5>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {speaker.affiliation}
                    </p>
                    {isSelected && bio && (
                      <SpeakerBioExpand bio={bio} tone="plenary" />
                    )}
                  </div>
                </div>
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
            {forumHasBios && (
              <>
                {" "}
                <span className="text-sky-900/55">
                  Select a speaker to learn more.
                </span>
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {forumSpeakers.map((speaker) => {
            const imgSrc = speakerImgSrc(speaker);
            const bio = getSpeakerBio(speaker);
            const interactive = Boolean(bio);
            const isSelected = sameSpeaker(selectedSpeaker, speaker);
            return (
              <div
                key={speaker.key}
                ref={isSelected ? expandRef : undefined}
                className={`bg-white rounded-xl p-6 shadow-md flex flex-col relative overflow-hidden border border-sky-100 ${
                  isSelected
                    ? "sm:col-span-2 lg:col-span-3 items-stretch text-left"
                    : "items-center text-center"
                } ${
                  interactive
                    ? `cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400 ${
                        isSelected
                          ? "ring-2 ring-sky-400 ring-offset-2"
                          : "hover:bg-sky-50/80"
                      }`
                    : ""
                }`}
                {...(interactive
                  ? interactiveProps(speaker, selectedSpeaker, toggleSpeaker)
                  : {})}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-sky-400" />
                <div
                  className={`flex w-full ${
                    isSelected
                      ? "flex-col sm:flex-row sm:items-start gap-4"
                      : "flex-col items-center"
                  }`}
                >
                  <SpeakerPhoto
                    src={imgSrc}
                    alt={speaker.name}
                    className={`rounded-full border-2 flex-shrink-0 ${
                      isSelected ? "w-24 h-24" : "w-28 h-28 mb-4"
                    }`}
                    style={{
                      borderColor: "var(--color-secondary)",
                      ...(speaker.image_position && {
                        objectPosition: speaker.image_position,
                      }),
                    }}
                    fallback={
                      <div
                        className={`rounded-full flex items-center justify-center border-2 font-bold text-white flex-shrink-0 ${
                          isSelected
                            ? "w-24 h-24 text-xl"
                            : "w-28 h-28 mb-4 text-2xl"
                        }`}
                        style={{
                          backgroundColor: "var(--color-primary)",
                          borderColor: "var(--color-secondary)",
                        }}
                      >
                        {getInitials(speaker.name)}
                      </div>
                    }
                  />
                  <div
                    className={`min-w-0 ${
                      isSelected ? "text-left flex-1" : "text-center"
                    }`}
                  >
                    <h5
                      className={`font-bold mb-1.5 leading-tight ${
                        isSelected ? "text-xl" : "text-lg"
                      }`}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: interactive ? "underline" : undefined,
                        textDecorationColor: interactive
                          ? "rgba(56, 189, 248, 0.7)"
                          : undefined,
                        textDecorationThickness: interactive ? "1px" : undefined,
                        textUnderlineOffset: interactive ? "4px" : undefined,
                      }}
                    >
                      {speaker.name}
                    </h5>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {speaker.affiliation}
                    </p>
                    {isSelected && bio && (
                      <SpeakerBioExpand bio={bio} tone="forum" />
                    )}
                  </div>
                </div>
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
            const bio = getSpeakerBio(speaker);
            const interactive = Boolean(bio);
            const isSelected = sameSpeaker(selectedSpeaker, speaker);
            return (
              <div
                key={speaker.key}
                ref={isSelected ? expandRef : undefined}
                className={`bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 flex flex-col ${
                  isSelected
                    ? "md:col-span-2 lg:col-span-3 xl:col-span-4 items-stretch text-left"
                    : "items-center text-center"
                } ${
                  interactive
                    ? `cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-secondary)] ${
                        isSelected
                          ? "ring-2 ring-[var(--color-secondary)] ring-offset-2"
                          : "hover:bg-white"
                      }`
                    : ""
                }`}
                {...(interactive
                  ? interactiveProps(speaker, selectedSpeaker, toggleSpeaker)
                  : {})}
              >
                <div
                  className={`flex w-full ${
                    isSelected
                      ? "flex-col sm:flex-row sm:items-start gap-4"
                      : "flex-col items-center"
                  }`}
                >
                  <SpeakerPhoto
                    src={imgSrc}
                    alt={speaker.name}
                    className={`rounded-full border-2 flex-shrink-0 ${
                      isSelected ? "w-24 h-24" : "w-28 h-28 mb-3"
                    }`}
                    style={{
                      borderColor: "var(--color-secondary)",
                      ...(speaker.image_position && {
                        objectPosition: speaker.image_position,
                      }),
                    }}
                    fallback={
                      <div
                        className={`rounded-full flex items-center justify-center border-2 font-bold text-white flex-shrink-0 ${
                          isSelected
                            ? "w-24 h-24 text-xl"
                            : "w-28 h-28 mb-3 text-2xl"
                        }`}
                        style={{
                          backgroundColor: "var(--color-primary)",
                          borderColor: "var(--color-secondary)",
                        }}
                      >
                        {getInitials(speaker.name)}
                      </div>
                    }
                  />
                  <div
                    className={`min-w-0 ${
                      isSelected ? "text-left flex-1" : "text-center"
                    }`}
                  >
                    <h5
                      className={`font-bold mb-1.5 leading-tight ${
                        isSelected ? "text-lg" : "text-base"
                      }`}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: interactive ? "underline" : undefined,
                        textDecorationColor: interactive
                          ? "color-mix(in srgb, var(--color-secondary) 50%, transparent)"
                          : undefined,
                        textDecorationThickness: interactive ? "1px" : undefined,
                        textUnderlineOffset: interactive ? "3px" : undefined,
                      }}
                    >
                      {speaker.name}
                    </h5>
                    <p
                      className={`text-gray-600 leading-snug ${
                        isSelected
                          ? "text-sm"
                          : "text-xs line-clamp-3"
                      }`}
                    >
                      {speaker.affiliation}
                    </p>
                    {isSelected && bio && (
                      <SpeakerBioExpand bio={bio} tone="plenary" />
                    )}
                  </div>
                </div>
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
