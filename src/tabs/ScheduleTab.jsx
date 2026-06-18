import React, { useState, useRef, useMemo } from "react";

const DAY_END = 21 * 60; // 9:00 PM fallback

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

function formatClock(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
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
    return {
      ...session,
      startMinutes: start,
      endMinutes: Math.max(end, start + 5),
    };
  });
}

function enrichOverlays(overlays) {
  return overlays.map((overlay) => ({
    ...overlay,
    startMinutes: parseTimeToMinutes(overlay.time),
    endMinutes: parseTimeToMinutes(overlay.endTime),
  }));
}

function rowOverlapsOverlay(row, overlay) {
  return (
    row.startMinutes < overlay.endMinutes &&
    row.endMinutes > overlay.startMinutes
  );
}

// Builds the right-hand side column (Public Forum + Poster Session) aligned to
// the table rows. Returns one entry per row:
//   undefined -> render an empty side cell
//   null      -> skip (covered by a rowSpan above)
//   object    -> render a side cell with the given rowSpan
function buildSideColumn(rows, overlays) {
  const side = new Array(rows.length).fill(undefined);

  rows.forEach((row, i) => {
    if (row.forum) {
      side[i] = { kind: "forum", data: row.forum, rowSpan: 1 };
    }
  });

  overlays.forEach((overlay) => {
    let i = 0;
    while (i < rows.length) {
      if (side[i] === undefined && rowOverlapsOverlay(rows[i], overlay)) {
        let j = i;
        while (
          j + 1 < rows.length &&
          side[j + 1] === undefined &&
          rowOverlapsOverlay(rows[j + 1], overlay)
        ) {
          j++;
        }
        side[i] = { kind: "overlay", data: overlay, rowSpan: j - i + 1 };
        for (let k = i + 1; k <= j; k++) side[k] = null;
        i = j + 1;
      } else {
        i++;
      }
    }
  });

  return side;
}

function cellStyleFor(session) {
  const type = session.type;
  const title = (session.title || "").toLowerCase();
  if (title.includes("gala")) return { bg: "bg-blue-900", text: "text-white" };
  if (title.includes("transportation"))
    return { bg: "bg-sky-100", text: "text-sky-900" };
  if (title.includes("registration"))
    return { bg: "bg-amber-200", text: "text-amber-950" };
  if (title.includes("reception"))
    return { bg: "bg-orange-300", text: "text-orange-950" };
  switch (type) {
    case "plenary":
      return { bg: "bg-orange-400", text: "text-white" };
    case "population":
      return { bg: "bg-orange-300", text: "text-orange-950" };
    case "symposium":
      return { bg: "bg-amber-200", text: "text-amber-950" };
    case "oral":
      return { bg: "bg-amber-50", text: "text-amber-900" };
    case "forum":
      return { bg: "bg-sky-300", text: "text-sky-950" };
    case "meeting":
      return { bg: "bg-green-200", text: "text-green-950" };
    case "social":
      return { bg: "bg-emerald-200", text: "text-emerald-900" };
    case "break":
      return { bg: "bg-gray-100", text: "text-gray-500" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}

function cellLabel(s, showTitles = false) {
  if (s.type === "symposium" && s.number) {
    return showTitles
      ? `${s.number}: ${s.title}`
      : `Session ${s.number.replace(/^S/i, "")}`;
  }
  return s.title;
}

const dayThemes = {
  0: "Arrivals & Welcome",
  1: "Discovering the Immune Foundations of Reproductive Health",
  2: "Translating Science into Care",
  3: "Shaping Population Health through Reproductive Innovation",
};

const legendItems = [
  { label: "Plenary / Lecture", cls: "bg-orange-400" },
  { label: "Symposium", cls: "bg-amber-200" },
  { label: "Oral Presentations", cls: "bg-amber-50 border border-amber-300" },
  { label: "Public Forum", cls: "bg-sky-300" },
  { label: "Population Forum", cls: "bg-orange-300" },
  { label: "Poster Session", cls: "bg-emerald-50 border border-emerald-300" },
  { label: "Social / Reception", cls: "bg-emerald-200" },
  { label: "Meeting", cls: "bg-green-200" },
  { label: "Award Gala", cls: "bg-blue-900" },
  { label: "Break", cls: "bg-gray-100 border border-gray-300" },
];

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

  const days = [
    { day: "Thursday", date: "Nov 5", index: 0 },
    { day: "Friday", date: "Nov 6", index: 1 },
    { day: "Saturday", date: "Nov 7", index: 2 },
    { day: "Sunday", date: "Nov 8", index: 3 },
  ];

  const scheduleData = {
    0: [
      {
        time: "1:00 PM",
        endTime: "5:00 PM",
        type: "social",
        title: "Registration Open",
      },
      {
        time: "2:30 PM",
        endTime: "4:00 PM",
        type: "meeting",
        title: "ISIR Council Meeting",
      },
      {
        time: "5:00 PM",
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
          endTime: "11:45 AM",
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
        endTime: "2:15 PM",
        type: "population",
        title: "Population & Aging I",
      },
      {
        time: "2:15 PM",
        endTime: "2:30 PM",
        type: "break",
        title: "Break",
      },
      {
        time: "2:30 PM",
        endTime: "3:45 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S4",
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
        time: "3:45 PM",
        endTime: "4:00 PM",
        type: "break",
        title: "Coffee Break",
      },
      {
        time: "4:00 PM",
        endTime: "5:06 PM",
        type: "parallel",
        sessions: [
          {
            type: "oral",
            title: "Young Investigator Session",
          },
          { type: "oral", number: "Oral II", title: "Oral Presentation II" },
          { type: "oral", number: "Oral III", title: "Oral Presentation III" },
        ],
      },
      {
        time: "6:00 PM",
        endTime: "8:00 PM",
        type: "parallel",
        sessions: [
          { type: "meeting", title: "JRI Editorial Meeting" },
          { type: "social", title: "Trainee Social Event" },
        ],
      },
    ],
    2: [
      {
        time: "8:30 AM",
        endTime: "9:50 AM",
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
          endTime: "11:45 AM",
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
          { type: "meeting", title: "Business Meeting" },
        ],
      },
      {
        time: "1:00 PM",
        endTime: "2:15 PM",
        type: "population",
        title: "Population Forum II",
      },
      {
        time: "2:15 PM",
        endTime: "2:30 PM",
        type: "break",
        title: "Ready for Transportation",
      },
      {
        time: "2:30 PM",
        endTime: "6:00 PM",
        type: "social",
        title: "Transportation to the Gala",
      },
      {
        time: "6:00 PM",
        endTime: "9:00 PM",
        type: "social",
        title: "Award Gala",
        subtitle: "Celebration at Busan Cinema Center",
      },
    ],
  };

  const dayOverlays = {
    1: [
      {
        time: "11:45 AM",
        endTime: "1:00 PM",
        type: "social",
        title: "Poster Session I",
      },
    ],
    2: [
      {
        time: "11:45 AM",
        endTime: "1:00 PM",
        type: "social",
        title: "Poster Session II",
      },
    ],
  };

  const enrichedByDay = useMemo(
    () => days.map((d) => enrichDaySchedule(scheduleData[d.index] || [])),
    [],
  );

  const enrichedOverlaysByDay = useMemo(
    () => days.map((d) => enrichOverlays(dayOverlays[d.index] || [])),
    [],
  );

  const renderRowContent = (session, showTitles = false) => {
    if (session.type === "parallel") {
      return (
        <div className="flex gap-0.5 h-full">
          {session.sessions.map((s, idx) => {
            const st = cellStyleFor(s);
            return (
              <div
                key={idx}
                className={`flex-1 min-w-0 rounded-sm ${st.bg} ${st.text} px-1 py-3 text-[10px] font-semibold leading-tight flex items-center justify-center text-center`}
              >
                {cellLabel(s, showTitles)}
              </div>
            );
          })}
        </div>
      );
    }

    if (session.type === "break") {
      return (
        <div className="h-full min-h-[2.75rem] rounded-sm bg-gray-100 text-gray-500 px-1 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-center flex items-center justify-center">
          {session.title}
        </div>
      );
    }

    const st = cellStyleFor(session);
    return (
      <div
        className={`h-full min-h-[2.75rem] rounded-sm ${st.bg} ${st.text} px-1.5 py-3 text-[10px] font-semibold leading-tight flex flex-col justify-center`}
      >
        <div>{session.title}</div>
        {session.subtitle && (
          <div className="text-[8px] font-normal opacity-80 mt-0.5">
            {session.subtitle}
          </div>
        )}
      </div>
    );
  };

  const renderSideCell = (sc) => {
    if (sc.kind === "forum") {
      const st = cellStyleFor({ type: "forum" });
      return (
        <div
          className={`h-full rounded-sm ${st.bg} ${st.text} px-1 py-1 text-[9px] font-semibold leading-tight text-center flex items-center justify-center`}
        >
          {sc.data.title}
        </div>
      );
    }
    return (
      <div className="h-full rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 py-2 text-[10px] font-semibold leading-tight text-center flex items-center justify-center">
        {sc.data.title}
      </div>
    );
  };

  const renderDayTable = (dayIdx, fill = true, showTitles = false) => {
    const rows = enrichedByDay[dayIdx];
    const overlays = enrichedOverlaysByDay[dayIdx];
    const side = buildSideColumn(rows, overlays);
    const hasSideCol = rows.some((r) => r.forum) || overlays.length > 0;

    return (
      <div
        className={`${fill ? "h-full" : ""} border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col`}
      >
        <div className="px-2 py-1.5 border-b border-gray-300 bg-gray-50 text-center">
          <div className="font-bold text-sm text-gray-900">
            {days[dayIdx].date} · {days[dayIdx].day}
          </div>
          <div className="text-[10px] text-gray-500 italic leading-tight mt-0.5">
            {dayThemes[dayIdx]}
          </div>
        </div>
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "32px" }} />
            <col style={{ width: "32px" }} />
            <col />
            {hasSideCol && <col style={{ width: "84px" }} />}
          </colgroup>
          <tbody>
            {rows.map((session, i) => {
              const sc = side[i];
              return (
                <tr key={i} className="align-top">
                  <td className="text-[9px] text-gray-500 tabular-nums text-right px-1 py-1 border-t border-gray-100 whitespace-nowrap">
                    {formatClock(session.startMinutes)}
                  </td>
                  <td className="text-[9px] text-gray-400 tabular-nums text-right px-1 py-1 border-t border-gray-100 whitespace-nowrap">
                    {formatClock(session.endMinutes)}
                  </td>
                  <td className="p-0.5 border-t border-gray-100 h-full">
                    {renderRowContent(session, showTitles)}
                  </td>
                  {hasSideCol &&
                    sc !== null &&
                    (sc === undefined ? (
                      <td className="p-0.5 border-t border-gray-100" />
                    ) : (
                      <td
                        className="p-0.5 border-t border-gray-100 h-full"
                        rowSpan={sc.rowSpan}
                      >
                        {renderSideCell(sc)}
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
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
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 p-4 bg-gray-50 rounded-xl">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${item.cls}`}></div>
            <span className="text-xs font-medium text-gray-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("single")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              viewMode === "single"
                ? "bg-white shadow-sm"
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
                ? "bg-white shadow-sm"
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
                  ? "text-white shadow-lg"
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

      {/* Schedule */}
      <div ref={scheduleRef} className="bg-white">
        {viewMode === "all" ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 items-stretch min-w-[920px]">
              <div className="w-[210px] flex-none flex flex-col justify-end">
                {renderDayTable(0, false)}
              </div>
              <div className="flex-1 min-w-[260px]">{renderDayTable(1)}</div>
              <div className="flex-1 min-w-[260px]">{renderDayTable(2)}</div>
              <div className="flex-1 min-w-[260px]">{renderDayTable(3)}</div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {renderDayTable(selectedDay, true, true)}
          </div>
        )}
      </div>

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
