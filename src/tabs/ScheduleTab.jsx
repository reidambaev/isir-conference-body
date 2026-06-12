import React, { useState, useRef, useMemo } from "react";

const DAY_START = 8 * 60; // 8:00 AM
const DAY_END = 21 * 60; // 9:00 PM (Award Gala)
const PX_PER_MIN = 1.05;

function blockHeightMinutes(session) {
  return session.durationMinutes;
}

function forumHeightMinutes(session, forum) {
  if (forum?.endTime) {
    return Math.max(
      parseTimeToMinutes(forum.endTime) - session.startMinutes,
      10,
    );
  }
  return session.durationMinutes;
}

function minutesToTopPx(startMinutes) {
  return (startMinutes - DAY_START) * PX_PER_MIN;
}

function formatTimeLabel(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h24 % 12 || 12;
  const period = h24 >= 12 ? "PM" : "AM";
  return m === 0
    ? `${h12} ${period}`
    : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function computeTimelineHeight(enrichedDays, enrichedOverlays = []) {
  let maxEnd = DAY_START + 60;
  for (const day of enrichedDays) {
    for (const s of day) {
      maxEnd = Math.max(maxEnd, s.endMinutes);
      if (s.forum?.endTime) {
        maxEnd = Math.max(maxEnd, parseTimeToMinutes(s.forum.endTime));
      }
    }
  }
  for (const overlays of enrichedOverlays) {
    for (const o of overlays) {
      maxEnd = Math.max(maxEnd, o.endMinutes);
    }
  }
  return (maxEnd - DAY_START + 5) * PX_PER_MIN;
}

const END_TIME_AXIS_EVENTS = new Set([
  "JRI Editorial Meeting",
  "Award Gala",
  "Trainee Social Event",
]);

function buildTimeLabels(enrichedDays, enrichedOverlays = []) {
  const labels = [];
  const seen = new Set();

  const addLabel = (minutes, isEnd) => {
    const key = `${isEnd ? "e" : "s"}-${minutes}`;
    if (seen.has(key)) return;
    seen.add(key);
    labels.push({
      minutes,
      topPx: minutesToTopPx(minutes),
      isEnd,
    });
  };

  const addEndLabel = (title, endTime) => {
    if (END_TIME_AXIS_EVENTS.has(title) && endTime) {
      addLabel(parseTimeToMinutes(endTime), true);
    }
  };

  for (const day of enrichedDays) {
    for (const s of day) {
      addLabel(s.startMinutes, false);
      addEndLabel(s.title, s.endTime);
    }
  }

  for (const overlays of enrichedOverlays) {
    for (const o of overlays) {
      addLabel(o.startMinutes, false);
      addEndLabel(o.title, o.endTime);
    }
  }

  return labels.sort((a, b) => a.topPx - b.topPx);
}

function parseTimeToMinutes(timeStr) {
  const match = String(timeStr)
    .trim()
    .match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] || "AM").toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function enrichDaySchedule(daySchedule) {
  const sorted = [...daySchedule].sort(
    (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time),
  );
  return sorted.map((session, i) => {
    const start = parseTimeToMinutes(session.time);
    let end;
    if (session.endTime) {
      end = parseTimeToMinutes(session.endTime);
    } else if (i < sorted.length - 1) {
      end = parseTimeToMinutes(sorted[i + 1].time);
    } else {
      end = Math.min(start + 90, DAY_END);
    }
    let duration = end - start;
    if (session.endTime) {
      duration = Math.max(duration, 5);
    } else if (session.type === "break" || session.compact) {
      duration = Math.max(duration, 10);
    } else {
      duration = Math.max(duration, 15);
    }
    return {
      ...session,
      startMinutes: start,
      endMinutes: start + duration,
      durationMinutes: duration,
    };
  });
}

function enrichOverlays(overlays) {
  return overlays.map((overlay) => {
    const start = parseTimeToMinutes(overlay.time);
    const end = parseTimeToMinutes(overlay.endTime);
    const duration = Math.max(end - start, 10);
    return {
      ...overlay,
      startMinutes: start,
      endMinutes: start + duration,
      durationMinutes: duration,
    };
  });
}

function sessionOverlapsOverlay(session, overlay) {
  return (
    session.startMinutes < overlay.endMinutes &&
    session.endMinutes > overlay.startMinutes
  );
}

function sessionHasSideTrack(session, overlays) {
  if (session.forum) return true;
  return overlays.some(
    (o) =>
      sessionOverlapsOverlay(session, o) &&
      o.startMinutes <= session.startMinutes &&
      o.endMinutes >= session.endMinutes,
  );
}

function sessionContainsOverlay(session, overlays) {
  return overlays.some(
    (o) =>
      session.startMinutes <= o.startMinutes &&
      session.endMinutes >= o.endMinutes,
  );
}

const THREE_COL_DAY_INDICES = new Set([1, 2]); // Friday, Saturday
const DAY_GRID_FRACTION = { 0: "1fr", 1: "1.75fr", 2: "1.75fr", 3: "1fr" };

function dayUsesThreeCol(dayIdx, overlays) {
  return THREE_COL_DAY_INDICES.has(dayIdx) && overlays.length > 0;
}

function sessionInThreeColLayout(dayIdx, session, overlays) {
  if (!dayUsesThreeCol(dayIdx, overlays)) return false;
  return (
    !!session.forum ||
    sessionHasSideTrack(session, overlays) ||
    sessionContainsOverlay(session, overlays)
  );
}

function getTrackPositions(dayIdx, session, overlays) {
  if (sessionInThreeColLayout(dayIdx, session, overlays)) {
    return {
      main: { left: "1%", width: "53%" },
      forum: { left: "55%", width: "21%" },
      overlay: { left: "77%", width: "22%" },
    };
  }

  const hasSide =
    sessionHasSideTrack(session, overlays) ||
    sessionContainsOverlay(session, overlays) ||
    !!session.forum;

  if (hasSide) {
    return {
      main: { left: "1%", width: "76%" },
      forum: { left: "78%", width: "21%" },
      overlay: { left: "78%", width: "21%" },
    };
  }

  return {
    main: { left: "1%", width: "98%" },
    forum: { left: "78%", width: "21%" },
    overlay: { left: "78%", width: "21%" },
  };
}

function buildGridCols(dayIndices) {
  if (dayIndices.length === 1) return "64px 1fr";
  return `64px ${dayIndices.map((i) => DAY_GRID_FRACTION[i] || "1fr").join(" ")}`;
}

function formatSessionLabel(s, showSymposiumTitles = false) {
  if (s.type === "symposium" && s.number) {
    return showSymposiumTitles ? `${s.number}: ${s.title}` : s.number;
  }
  if (s.type === "oral") return s.title;
  if (s.number) return `${s.number}: ${s.title}`;
  return s.title;
}

function formatOralGroupLabel(orals) {
  if (orals.length === 0) return "";
  if (orals.length === 1) return orals[0].title;

  const prefix = "Oral Presentation ";
  if (orals.every((o) => o.title.startsWith(prefix))) {
    const suffixes = orals.map((o) => o.title.slice(prefix.length));
    return `${prefix}${suffixes.join(" & ")}`;
  }

  return orals.map((o) => o.title).join(" & ");
}

function formatParallelLines(sessions, showSymposiumTitles = false) {
  const allSymposiumCodes = sessions.every(
    (s) => s.type === "symposium" && s.number,
  );
  if (allSymposiumCodes) {
    if (showSymposiumTitles) {
      return sessions.map((s) => `${s.number}: ${s.title}`);
    }
    return [sessions.map((s) => s.number).join("   ")];
  }

  const orals = sessions.filter((s) => s.type === "oral");
  const nonOrals = sessions.filter((s) => s.type !== "oral");

  if (orals.length > 0 && nonOrals.length > 0) {
    return [
      ...nonOrals.map((s) => formatSessionLabel(s, showSymposiumTitles)),
      formatOralGroupLabel(orals),
    ];
  }

  if (orals.length === sessions.length) {
    return [formatOralGroupLabel(orals)];
  }

  return [
    sessions.map((s) => formatSessionLabel(s, showSymposiumTitles)).join("   "),
  ];
}

function getBlockTypography(blockHeight) {
  if (blockHeight < 20) {
    return {
      text: "text-[7px]",
      leading: "leading-none",
      pad: "px-0.5 py-0",
      gap: "gap-0",
    };
  }
  if (blockHeight < 36) {
    return {
      text: "text-[7px]",
      leading: "leading-none",
      pad: "px-0.5 py-0",
      gap: "gap-0",
    };
  }
  if (blockHeight < 56) {
    return {
      text: "text-[8px]",
      leading: "leading-tight",
      pad: "px-0.5 py-0",
      gap: "gap-0",
    };
  }
  return {
    text: "text-[9px]",
    leading: "leading-tight",
    pad: "px-1 py-0",
    gap: "gap-0",
  };
}

function renderTrackLabel({
  style,
  blockHeight,
  label,
  sublabel,
  bold = false,
  clamp = "line-clamp-2",
  lightSublabel = false,
}) {
  const t = getBlockTypography(blockHeight);
  return (
    <div
      className={`h-full w-full ${style.bg} border ${style.border} rounded-sm flex flex-col justify-center items-center overflow-hidden ${t.pad}`}
    >
      <span
        className={`${t.text} ${t.leading} ${bold ? "font-bold" : "font-semibold"} ${style.text} text-center w-full ${clamp}`}
      >
        {label}
      </span>
      {sublabel && blockHeight >= 40 && (
        <span
          className={`text-[7px] leading-none mt-px text-center line-clamp-1 w-full ${lightSublabel ? "text-white/75" : `opacity-75 ${style.text}`}`}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

const ScheduleTab = () => {
  const scheduleRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState("all"); // "single" or "all"

  const handleDownloadPNG = async () => {
    if (!scheduleRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(scheduleRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "ISIR-2026-Schedule.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to generate PNG:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Days configuration
  const days = [
    { day: "Thursday", date: "Nov 5", index: 0 },
    { day: "Friday", date: "Nov 6", index: 1 },
    { day: "Saturday", date: "Nov 7", index: 2 },
    { day: "Sunday", date: "Nov 8", index: 3 },
  ];

  // ISIR 2026 program at a glance (official schedule)
  const scheduleData = {
    0: [
      { time: "1:00 PM", endTime: "2:15 PM", type: "social", title: "Registration Opens" },
      {
        time: "2:15 PM",
        endTime: "3:45 PM",
        type: "meeting",
        title: "ISIR Council Meeting",
      },
      {
        time: "5:00 PM",
        endTime: "5:30 PM",
        type: "plenary",
        title: "Welcome Address",
      },
      {
        time: "5:30 PM",
        endTime: "6:00 PM",
        type: "plenary",
        title: "President Lecture",
      },
      {
        time: "6:00 PM",
        endTime: "8:00 PM",
        type: "social",
        title: "Welcome Reception",
      },
    ],
    1: [
      {
        time: "8:30 AM",
        endTime: "9:50 AM",
        type: "plenary",
        title: "President Symposium I",
      },
      {
        time: "9:50 AM",
        endTime: "10:05 AM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "10:05 AM",
        endTime: "11:45 AM",
        type: "parallel",
        forum: {
          type: "forum",
          number: "PF I",
          title: "Public Forum I",
          endTime: "11:20 AM",
        },
        sessions: [
          {
            type: "symposium",
            number: "S1",
            title: "Immune Regulation in the Endometrium",
          },
          {
            type: "symposium",
            number: "S2",
            title: "Early Pregnancy and Placental Development",
          },
          {
            type: "symposium",
            number: "S3",
            title:
              "Environmental Exposures and Developmental Origins of Disease",
          },
        ],
      },
      {
        time: "11:45 AM",
        endTime: "1:00 PM",
        type: "break",
        title: "Lunch",
      },
      {
        time: "1:00 PM",
        endTime: "2:00 PM",
        type: "population",
        title: "Population Forum I",
      },
      {
        time: "2:00 PM",
        endTime: "2:15 PM",
        type: "break",
        title: "Intermission",
      },
      {
        time: "2:15 PM",
        endTime: "3:30 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            title: "KAI/KSRI Joint Symposium",
          },
          {
            type: "symposium",
            number: "S5",
            title: "Microbiome and Pregnancy",
          },
          { type: "symposium", number: "S6", title: "Male Infertility" },
        ],
      },
      {
        time: "3:30 PM",
        endTime: "3:45 PM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "3:45 PM",
        endTime: "4:51 PM",
        type: "parallel",
        sessions: [
          {
            type: "plenary",
            number: "Awards",
            title: "New Investigator Award Session",
          },
          { type: "oral", number: "Oral II", title: "Oral Presentation II" },
          { type: "oral", number: "Oral III", title: "Oral Presentation III" },
        ],
      },
      {
        time: "5:30 PM",
        endTime: "8:00 PM",
        type: "social",
        title: "Trainee Social Event",
      },
    ],
    2: [
      {
        time: "8:30 AM",
        endTime: "9:45 AM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S7",
            title: "Ovarian Inflammatory Disease and Aging",
          },
          {
            type: "symposium",
            number: "S8",
            title: "Current Therapeutic Options for Reproductive Health",
          },
          {
            type: "symposium",
            number: "S9",
            title: "Preeclampsia and Its Systemic Consequences",
          },
        ],
      },
      {
        time: "9:50 AM",
        endTime: "10:05 AM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "10:05 AM",
        endTime: "11:45 AM",
        type: "parallel",
        forum: {
          type: "forum",
          number: "PF II",
          title: "Public Forum II",
          endTime: "11:20 AM",
        },
        sessions: [
          {
            type: "symposium",
            number: "S10",
            title: "Fetal Outcome with Inflammatory Insult",
          },
          {
            type: "symposium",
            number: "S11",
            title: "T Cell Immunity and Pregnancy",
          },
          {
            type: "symposium",
            number: "S12",
            title: "Gynecologic Malignancies and Immune Abnormalities",
          },
        ],
      },
      {
        time: "11:45 AM",
        endTime: "1:00 PM",
        type: "break",
        title: "Lunch",
      },
      {
        time: "1:00 PM",
        endTime: "2:15 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S13",
            title:
              "Immune Regulation and Therapeutic Application of Human Reproduction",
          },
          {
            type: "symposium",
            number: "S14",
            title: "High Risk OB: 2nd and 3rd Trimester Complications",
          },
          {
            type: "symposium",
            number: "S15",
            title:
              "Current Immunotherapeutic Options for Reproductive Failure",
          },
        ],
      },
      {
        time: "2:15 PM",
        endTime: "3:55 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S16",
            title:
              "Exosomes, Mitochondrial Function, and Cell-Based Therapies",
          },
          {
            type: "symposium",
            number: "S17",
            title: "Preeclampsia and Its Systemic Consequences",
          },
          {
            type: "symposium",
            number: "S18",
            title: "Rheumatic Conditions and Reproductive Outcomes",
          },
        ],
      },
      {
        time: "3:55 PM",
        endTime: "4:05 PM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "4:05 PM",
        endTime: "5:00 PM",
        type: "parallel",
        sessions: [
          { type: "oral", number: "Oral IV", title: "Oral Presentation IV" },
          { type: "oral", number: "Oral V", title: "Oral Presentation V" },
          { type: "oral", number: "Oral VI", title: "Oral Presentation VI" },
        ],
      },
    ],
    3: [
      {
        time: "8:30 AM",
        endTime: "9:50 AM",
        type: "plenary",
        title: "President Symposium II",
      },
      {
        time: "9:50 AM",
        endTime: "10:05 AM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "10:05 AM",
        endTime: "11:45 AM",
        type: "parallel",
        forum: {
          type: "forum",
          number: "PF III",
          title: "Public Forum III",
          endTime: "11:20 AM",
        },
        sessions: [
          {
            type: "symposium",
            number: "S19",
            title: "Update on Reproductive Disorders and Their Management",
          },
          {
            type: "symposium",
            number: "S20",
            title:
              "Interplay Between Hormones, Immune System and Vascular Dysfunction in Women's Health",
          },
          {
            type: "symposium",
            number: "S21",
            title: "Infection, Vaccination, and Pregnancy",
          },
        ],
      },
      {
        time: "11:45 AM",
        endTime: "1:00 PM",
        type: "parallel",
        sessions: [
          { type: "break", title: "Lunch" },
          { type: "meeting", title: "ISIR Business Meeting" },
        ],
      },
      {
        time: "1:00 PM",
        endTime: "2:00 PM",
        type: "population",
        title: "Population Forum II",
      },
      {
        time: "2:15 PM",
        endTime: "5:00 PM",
        type: "social",
        title: "Transportation to Gala",
      },
      {
        time: "6:00 PM",
        endTime: "8:00 PM",
        type: "social",
        title: "Award Gala",
        subtitle: "Celebration at Busan Cinema Center",
      },
    ],
  };

  const dayOverlays = {
    1: [
      {
        time: "10:05 AM",
        endTime: "8:00 PM",
        type: "social",
        title: "Poster Session I",
      },
    ],
    2: [
      {
        time: "8:30 AM",
        endTime: "5:00 PM",
        type: "social",
        title: "Poster Session II",
      },
    ],
  };

  // Style configurations
  const getSessionStyle = (type) => {
    const styles = {
      plenary: {
        bg: "bg-gradient-to-r from-blue-600 to-blue-700",
        text: "text-white",
        border: "border-blue-800",
        cardBg: "bg-blue-600",
      },
      symposium: {
        bg: "bg-gradient-to-r from-amber-50 to-amber-100",
        text: "text-amber-900",
        border: "border-amber-300",
        cardBg: "bg-amber-100",
        accent: "bg-amber-500",
      },
      oral: {
        bg: "bg-gradient-to-r from-purple-50 to-purple-100",
        text: "text-purple-900",
        border: "border-purple-300",
        cardBg: "bg-purple-100",
        accent: "bg-purple-500",
      },
      forum: {
        bg: "bg-gradient-to-r from-teal-50 to-teal-100",
        text: "text-teal-900",
        border: "border-teal-300",
        cardBg: "bg-teal-100",
        accent: "bg-teal-500",
      },
      social: {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        cardBg: "bg-emerald-100",
      },
      break: {
        bg: "bg-gray-50",
        text: "text-gray-500",
        border: "border-gray-200",
        cardBg: "bg-gray-100",
      },
      population: {
        bg: "bg-gradient-to-r from-indigo-50 to-indigo-100",
        text: "text-indigo-900",
        border: "border-indigo-300",
        cardBg: "bg-indigo-100",
        accent: "bg-indigo-500",
      },
      meeting: {
        bg: "bg-gradient-to-r from-violet-100 to-violet-200",
        text: "text-violet-950",
        border: "border-violet-400",
        cardBg: "bg-violet-200",
        accent: "bg-violet-600",
      },
    };
    return styles[type] || styles.break;
  };

  const renderForumCard = (forum, compact = false) => {
    const fStyle = getSessionStyle(forum.type);
    if (compact) {
      return (
        <div
          className={`text-[9px] px-1.5 py-0.5 rounded ${fStyle.cardBg} ${fStyle.text} border ${fStyle.border} font-medium shrink-0`}
        >
          {forum.number || forum.title}
        </div>
      );
    }
    return (
      <div
        className={`rounded-lg border ${fStyle.border} ${fStyle.cardBg} overflow-hidden min-w-[140px] shrink-0`}
      >
        {fStyle.accent && <div className={`h-1 ${fStyle.accent}`} />}
        <div className="p-3">
          {forum.number && (
            <div
              className={`text-xs font-bold ${fStyle.text} opacity-75 mb-1`}
            >
              {forum.number}
            </div>
          )}
          <div className={`font-semibold text-sm ${fStyle.text}`}>
            {forum.title}
          </div>
        </div>
      </div>
    );
  };

  const renderSession = (session, compact = false) => {
    const style = getSessionStyle(session.type);

    if (session.type === "parallel") {
      if (compact) {
        // Compact view for "at a glance" - show abbreviated info
        return (
          <div className="p-1.5">
            <div className="flex flex-wrap gap-1">
              {session.sessions.map((s, idx) => {
                const sStyle = getSessionStyle(s.type);
                return (
                  <div
                    key={idx}
                    className={`text-[9px] px-1.5 py-0.5 rounded ${sStyle.cardBg} ${sStyle.text} border ${sStyle.border} font-medium`}
                  >
                    {s.number || s.title.substring(0, 20)}
                  </div>
                );
              })}
              {session.forum && renderForumCard(session.forum, true)}
            </div>
          </div>
        );
      }
      return (
        <div className={`p-3 ${session.compact ? "py-2" : "py-4"}`}>
          <div
            className={`flex flex-col gap-3 ${session.forum ? "lg:flex-row lg:items-start" : ""}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 flex-1">
            {session.sessions.map((s, idx) => {
              const sStyle = getSessionStyle(s.type);
              const isSymposium = s.type === "symposium";
              return (
                <div
                  key={idx}
                  className={`rounded-lg border ${sStyle.border} ${sStyle.cardBg} overflow-hidden ${
                    isSymposium
                      ? "shadow-md hover:shadow-lg transition-shadow"
                      : ""
                  }`}
                >
                  {/* Accent bar for symposiums */}
                  {sStyle.accent && (
                    <div className={`h-1 ${sStyle.accent}`}></div>
                  )}
                  <div className={`p-3 ${isSymposium ? "p-4" : ""}`}>
                    {s.number && (
                      <div
                        className={`text-xs font-bold ${sStyle.text} opacity-75 mb-1`}
                      >
                        {s.number}
                      </div>
                    )}
                    <div
                      className={`font-semibold ${sStyle.text} ${isSymposium ? "text-sm leading-snug" : "text-xs"}`}
                    >
                      {s.title}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
            {session.forum && renderForumCard(session.forum)}
          </div>
        </div>
      );
    }

    if (session.compact || compact) {
      return (
        <div className={`px-2 py-1 ${style.bg} flex items-center`}>
          <div className={`text-[10px] ${style.text} truncate`}>
            {session.title}
          </div>
        </div>
      );
    }

    if (session.type === "plenary") {
      return (
        <div className={`p-4 ${style.bg}`}>
          <div className={`font-bold ${style.text} text-sm`}>
            {session.title}
          </div>
          {session.subtitle && (
            <div className="text-white/80 text-xs mt-1 leading-relaxed">
              {session.subtitle}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`p-3 ${style.bg} border-l-4 ${style.border}`}>
        <div className={`text-sm font-semibold ${style.text}`}>
          {session.title}
        </div>
        {session.subtitle && (
          <div className="text-xs text-gray-500 mt-0.5">{session.subtitle}</div>
        )}
      </div>
    );
  };

  const enrichedByDay = useMemo(
    () => days.map((d) => enrichDaySchedule(scheduleData[d.index] || [])),
    [],
  );

  const enrichedOverlaysByDay = useMemo(
    () => days.map((d) => enrichOverlays(dayOverlays[d.index] || [])),
    [],
  );

  const renderTimelineBlockContent = (
    session,
    blockHeight,
    showSymposiumTitles = false,
  ) => {
    const t = getBlockTypography(blockHeight);

    if (session.type === "parallel") {
      const blockType = session.sessions.some((s) => s.type === "plenary")
        ? "plenary"
        : session.sessions.some((s) => s.type === "oral")
          ? "oral"
          : session.sessions.some((s) => s.type === "meeting")
            ? "meeting"
            : session.sessions.some((s) => s.type === "break")
              ? "break"
              : "symposium";
      const style = getSessionStyle(blockType);
      const lines = formatParallelLines(session.sessions, showSymposiumTitles);
      const allSymposiumCodes = session.sessions.every(
        (s) => s.type === "symposium" && s.number,
      );
      const showSymposiumDetail = showSymposiumTitles && allSymposiumCodes;

      return (
        <div
          className={`h-full w-full ${style.bg} border ${style.border} rounded-sm ${t.pad} overflow-hidden flex flex-col ${showSymposiumDetail ? "items-start justify-start" : "items-center justify-center"} ${t.gap}`}
        >
          {lines.map((line, idx) => (
            <p
              key={idx}
              className={`${t.text} ${t.leading} font-semibold ${style.text} m-0 w-full px-0.5 break-words whitespace-normal ${showSymposiumDetail ? "text-left line-clamp-2" : "text-center"} ${allSymposiumCodes && !showSymposiumTitles ? "whitespace-nowrap" : ""}`}
            >
              {line}
            </p>
          ))}
        </div>
      );
    }

    const style = getSessionStyle(session.type);
    const isPlenary = session.type === "plenary";

    return renderTrackLabel({
      style,
      blockHeight,
      label: session.title,
      sublabel: session.subtitle,
      bold: isPlenary,
      lightSublabel: isPlenary,
      clamp: session.subtitle ? "line-clamp-2" : "line-clamp-3",
    });
  };

  const renderTimelineDayColumn = (
    daySchedule,
    dayIdx,
    timelineHeight,
    timeLabels,
    overlays = [],
    isWide = false,
    showSymposiumTitles = false,
  ) => {
    const threeCol = dayUsesThreeCol(dayIdx, overlays);
    const columnMinW = isWide
      ? threeCol
        ? "min-w-[360px]"
        : "min-w-[280px]"
      : threeCol
        ? "min-w-[220px]"
        : "min-w-[140px] flex-1";

    return (
      <div
        key={dayIdx}
        className={`relative border-l border-gray-200 ${columnMinW}`}
        style={{ height: timelineHeight }}
      >
        {timeLabels.map(({ minutes, topPx, isEnd }) => (
          <div
            key={`grid-${isEnd ? "end" : "start"}-${minutes}`}
            className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
            style={{ top: topPx }}
          />
        ))}

        {daySchedule.map((session, idx) => {
          const top = minutesToTopPx(session.startMinutes);
          const height = blockHeightMinutes(session) * PX_PER_MIN;
          const tracks = getTrackPositions(dayIdx, session, overlays);
          const forumHeightPx = session.forum
            ? forumHeightMinutes(session, session.forum) * PX_PER_MIN
            : height;

          return (
            <React.Fragment key={`${session.time}-${idx}`}>
              <div
                className="absolute z-10 overflow-hidden"
                style={{
                  top,
                  height,
                  left: tracks.main.left,
                  width: tracks.main.width,
                }}
              >
                {renderTimelineBlockContent(
                  session,
                  height,
                  showSymposiumTitles,
                )}
              </div>
              {session.forum && (
                <div
                  className="absolute z-10 overflow-hidden"
                  style={{
                    top,
                    height: forumHeightPx,
                    left: tracks.forum.left,
                    width: tracks.forum.width,
                  }}
                >
                  {renderTrackLabel({
                    style: getSessionStyle("forum"),
                    blockHeight: forumHeightPx,
                    label: session.forum.title,
                    clamp: "line-clamp-3",
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {overlays.map((overlay, idx) => {
          const top = minutesToTopPx(overlay.startMinutes);
          const height = overlay.durationMinutes * PX_PER_MIN;
          const overlayZ = overlay.type === "meeting" ? "z-20" : "z-[5]";
          const overlayPos = threeCol
            ? { left: "77%", width: "22%" }
            : { left: "78%", width: "21%" };

          return (
            <div
              key={`overlay-${idx}`}
              className={`absolute ${overlayZ} overflow-hidden`}
              style={{ top, height, ...overlayPos }}
            >
              {renderTrackLabel({
                style: getSessionStyle(overlay.type),
                blockHeight: height,
                label: overlay.title,
                clamp: "line-clamp-4",
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimelineView = (dayIndices, showSymposiumTitles = false) => {
    const cols = dayIndices.length;
    const gridCols = buildGridCols(dayIndices);
    const gridMinW = cols >= 4 ? "min-w-[960px]" : cols === 1 ? "min-w-[640px]" : "min-w-[720px]";
    const daysForView = dayIndices.map((i) => enrichedByDay[i]);
    const overlaysForView = dayIndices.map((i) => enrichedOverlaysByDay[i]);
    const timelineHeight = computeTimelineHeight(daysForView, overlaysForView);
    const timeLabels = buildTimeLabels(daysForView, overlaysForView);

    return (
      <div
        ref={scheduleRef}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        <div
          className="grid bg-gray-900 text-white border-b border-gray-700"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="p-2 border-r border-gray-700" />
          {dayIndices.map((dayIdx) => (
            <div
              key={dayIdx}
              className="p-2 text-center border-r border-gray-700 last:border-r-0"
            >
              <div className="font-bold text-xs">{days[dayIdx].day}</div>
              <div className="text-[10px] text-gray-400">
                {days[dayIdx].date}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[min(85vh,900px)]">
          <div
            className={`grid ${gridMinW}`}
            style={{ gridTemplateColumns: gridCols }}
          >
            <div
              className="relative bg-gray-50 border-r border-gray-200"
              style={{ height: timelineHeight }}
            >
              {timeLabels.map(({ minutes, topPx, isEnd }) => (
                <div
                  key={`axis-${isEnd ? "end" : "start"}-${minutes}`}
                  className={`absolute right-0.5 text-[9px] font-medium text-gray-500 tabular-nums leading-none text-right pr-0.5 ${isEnd ? "-translate-y-full" : "-translate-y-1/2"}`}
                  style={{ top: topPx }}
                >
                  {formatTimeLabel(minutes)}
                </div>
              ))}
            </div>

            {dayIndices.map((dayIdx) =>
              renderTimelineDayColumn(
                enrichedByDay[dayIdx],
                dayIdx,
                timelineHeight,
                timeLabels,
                enrichedOverlaysByDay[dayIdx],
                cols === 1,
                showSymposiumTitles,
              ),
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div role="tabpanel">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Congress Schedule
            </h3>
            <p className="text-gray-500 text-sm">
              November 5-8, 2026 • Busan, Korea
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadPNG}
          disabled={isExporting}
          className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {isExporting ? "Exporting..." : "Download PNG"}
        </button>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600"></div>
          <span className="text-sm font-medium text-gray-700">
            Plenary/Lectures
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-200 border-2 border-amber-400"></div>
          <span className="text-sm font-medium text-gray-700">Symposium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-200 border-2 border-purple-400"></div>
          <span className="text-sm font-medium text-gray-700">
            Oral Presentations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-200 border-2 border-teal-400"></div>
          <span className="text-sm font-medium text-gray-700">
            Public Forum
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-200 border-2 border-emerald-300"></div>
          <span className="text-sm font-medium text-gray-700">
            Social/Special
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-200 border-2 border-indigo-400"></div>
          <span className="text-sm font-medium text-gray-700">
            Population Forum
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-violet-300 border-2 border-violet-500"></div>
          <span className="text-sm font-medium text-gray-700">Meetings</span>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("single")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === "single"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              viewMode === "single" ? { color: "var(--color-primary)" } : {}
            }
          >
            Single Day
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={viewMode === "all" ? { color: "var(--color-primary)" } : {}}
          >
            At a Glance
          </button>
        </div>
      </div>

      {/* Day Selector Tabs - Only show in single day mode */}
      {viewMode === "single" && (
        <div className="mb-6 flex flex-wrap gap-2">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                selectedDay === index
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
              style={
                selectedDay === index
                  ? { backgroundColor: "var(--color-primary)" }
                  : {}
              }
            >
              <div className="font-bold">{day.day}</div>
              <div className="text-xs opacity-90">{day.date}</div>
            </button>
          ))}
        </div>
      )}

      {/* Schedule Grid */}
      {viewMode === "all"
        ? renderTimelineView([0, 1, 2, 3], false)
        : renderTimelineView([selectedDay], true)}

      {/* Note about schedule */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Program at a glance — session times and topics
          may be updated. Check back for the detailed final program.
        </p>
      </div>
    </div>
  );
};

export default ScheduleTab;
