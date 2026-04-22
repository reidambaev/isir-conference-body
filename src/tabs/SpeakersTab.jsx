import React, { useEffect, useMemo, useState } from "react";
import {
  plenarySpeakers as plenaryCatalog,
  invitedCongressSpeakers as congressCatalog,
} from "../invitedSpeakersCatalog";

function getInitials(name) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SpeakersTab() {
  const [approvedMap, setApprovedMap] = useState(() => new Map());
  const [additionalSpeakers, setAdditionalSpeakers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/speaker-profiles/approved");
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.approved)) return;
        const m = new Map();
        const extra = [];
        for (const row of data.approved) {
          const k = row.speaker_key != null ? String(row.speaker_key).trim() : "";
          if (k) {
            m.set(k, {
              display_name: String(row.display_name || ""),
              affiliation: String(row.affiliation || ""),
              r2_key: row.r2_key || null,
              image_position: row.image_position || null,
            });
          } else {
            extra.push({
              id: String(row.id || ""),
              name: String(row.display_name || ""),
              affiliation: String(row.affiliation || ""),
              r2_key: row.r2_key || null,
              image_position: row.image_position || null,
            });
          }
        }
        if (!cancelled) {
          setApprovedMap(m);
          setAdditionalSpeakers(extra);
        }
      } catch {
        // public page: keep static data if API fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plenarySpeakers = useMemo(() => {
    return plenaryCatalog.map((s) => {
      const o = approvedMap.get(s.key);
      return {
        ...s,
        name: o?.display_name || s.name,
        affiliation: o?.affiliation || s.affiliation,
        customPhotoKey: o?.r2_key || null,
        imagePosition: o?.image_position || s.imagePosition,
      };
    });
  }, [approvedMap]);

  const speakers = useMemo(() => {
    const fromCatalog = congressCatalog.map((s) => {
      const o = approvedMap.get(s.key);
      return {
        ...s,
        name: o?.display_name || s.name,
        affiliation: o?.affiliation || s.affiliation,
        customPhotoKey: o?.r2_key || null,
        imagePosition: o?.image_position || s.imagePosition,
      };
    });
    const fromProfiles = additionalSpeakers.map((a) => ({
      key: `speaker-profile-${a.id}`,
      name: a.name,
      affiliation: a.affiliation,
      image: null,
      customPhotoKey: a.r2_key,
      imagePosition: a.image_position || undefined,
    }));
    return [...fromCatalog, ...fromProfiles];
  }, [approvedMap, additionalSpeakers]);

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
            const imgSrc = speaker.customPhotoKey
              ? `/${speaker.customPhotoKey}`
              : speaker.image
                ? `/speakers/${speaker.image}`
                : null;
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
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={speaker.name}
                      className="w-36 h-36 rounded-full object-cover border-4 border-white flex-shrink-0"
                      style={{
                        ...(speaker.imagePosition && {
                          objectPosition: speaker.imagePosition,
                        }),
                      }}
                    />
                  ) : (
                    <div
                      className="w-36 h-36 rounded-full flex items-center justify-center border-4 border-white text-3xl font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor: "var(--color-primary)",
                      }}
                    >
                      {getInitials(speaker.name)}
                    </div>
                  )}
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
          {speakers.map((speaker) => {
            const imgSrc = speaker.customPhotoKey
              ? `/${speaker.customPhotoKey}`
              : speaker.image
                ? `/speakers/${speaker.image}`
                : null;
            return (
              <div
                key={speaker.key}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={speaker.name}
                    className="w-28 h-28 rounded-full object-cover mb-3 border-2 flex-shrink-0"
                    style={{
                      borderColor: "var(--color-secondary)",
                      ...(speaker.imagePosition && {
                        objectPosition: speaker.imagePosition,
                      }),
                    }}
                  />
                ) : (
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center mb-3 border-2 text-2xl font-bold text-white flex-shrink-0"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      borderColor: "var(--color-secondary)",
                    }}
                  >
                    {getInitials(speaker.name)}
                  </div>
                )}
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
