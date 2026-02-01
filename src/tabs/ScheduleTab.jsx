import React, { useState, useRef } from "react";

const ScheduleTab = () => {
  const scheduleRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1); // Start on Friday (first full day)
  const [viewMode, setViewMode] = useState("single"); // "single" or "all"

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

  // Schedule data organized by day
  const scheduleData = {
    0: [
      // Thursday
      { time: "12:00 PM", type: "social", title: "Registration Opens" },
      { time: "3:00 PM", type: "social", title: "ISIR Council Meeting" },
      {
        time: "5:00 PM",
        type: "plenary",
        title: "Welcome Address",
        subtitle:
          "Building on a Legacy: Generational Foundations and the Evolution of Reproductive Immunology",
      },
      { time: "6:30 PM", type: "social", title: "Welcome Reception" },
    ],
    1: [
      // Friday
      { time: "7:30 AM", type: "break", title: "Breakfast", compact: true },
      {
        time: "8:20 AM",
        type: "social",
        title: "Welcome & Announcements",
        compact: true,
      },
      {
        time: "8:30 AM",
        type: "plenary",
        title: "Population Insight Lectures 1",
      },
      { time: "10:20 AM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "10:35 AM",
        type: "parallel",
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
          { type: "symposium", number: "S3", title: "KI Symposium" },
          { type: "forum", number: "PF1", title: "Public Forum 1" },
        ],
      },
      {
        time: "12:15 PM",
        type: "break",
        title: "Poster Session / Lunch",
        compact: true,
      },
      {
        time: "1:30 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S4",
            title: "Current Therapeutic Options for Reproductive Health",
          },
          {
            type: "symposium",
            number: "S5",
            title: "Exosomes, Mitochondrial Function, and Cell-Based Therapies",
          },
          { type: "symposium", number: "S6", title: "Male Infertility" },
        ],
      },
      { time: "2:50 PM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "3:10 PM",
        type: "parallel",
        sessions: [
          { type: "oral", number: "Oral I", title: "Oral Presentations I" },
          { type: "oral", number: "Oral II", title: "Oral Presentations II" },
          {
            type: "symposium",
            number: "S7",
            title: "Fetal Outcome with Inflammatory Insult",
          },
        ],
      },
      { time: "6:00 PM", type: "social", title: "Trainee Social Event" },
    ],
    2: [
      // Saturday
      { time: "7:30 AM", type: "break", title: "Breakfast", compact: true },
      {
        time: "8:20 AM",
        type: "social",
        title: "Welcome & Announcements",
        compact: true,
      },
      {
        time: "8:30 AM",
        type: "plenary",
        title: "Population Insight Lectures 2",
      },
      { time: "10:20 AM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "10:35 AM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S8",
            title: "Current Immunotherapeutic Options for Reproductive Failure",
          },
          {
            type: "symposium",
            number: "S9",
            title:
              "Environmental Exposures and Developmental Origins of Disease",
          },
          {
            type: "symposium",
            number: "S10",
            title: "Preeclampsia and Its Systemic Consequences",
          },
          { type: "forum", number: "PF2", title: "Public Forum 2" },
        ],
      },
      {
        time: "12:15 PM",
        type: "break",
        title: "Poster Session / Lunch",
        compact: true,
      },
      {
        time: "1:30 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S11",
            title: "Update on Reproductive Disorders and Their Management",
          },
          {
            type: "symposium",
            number: "S12",
            title: "Gynecologic Malignancies and Immune Abnormalities",
          },
          {
            type: "symposium",
            number: "S13",
            title: "Infection, Vaccination, and Pregnancy",
          },
        ],
      },
      { time: "2:50 PM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "3:10 PM",
        type: "parallel",
        sessions: [
          {
            type: "plenary",
            number: "Awards",
            title: "New Investigator Award Session",
          },
          { type: "oral", number: "Oral III", title: "Oral Presentations III" },
          {
            type: "symposium",
            number: "S14",
            title: "Interplay of Hormones and Immune System",
          },
        ],
      },
      {
        time: "6:00 PM",
        type: "social",
        title: "Award Gala",
        subtitle: "JRI Editorial Meeting",
      },
    ],
    3: [
      // Sunday
      {
        time: "7:30 AM",
        type: "parallel",
        sessions: [
          { type: "break", title: "Breakfast" },
          { type: "social", title: "ISIR Member Business Meeting" },
        ],
        compact: true,
      },
      {
        time: "8:20 AM",
        type: "social",
        title: "Welcome & Announcements",
        compact: true,
      },
      {
        time: "8:30 AM",
        type: "plenary",
        title: "Population Insight Lectures 3",
      },
      { time: "10:20 AM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "10:35 AM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S15",
            title: "Immune Regulation in the Endometrium II",
          },
          {
            type: "symposium",
            number: "S16",
            title: "Preeclampsia and Its Systemic Consequences II",
          },
          {
            type: "symposium",
            number: "S17",
            title: "T Cell Immunity and Pregnancy",
          },
          { type: "forum", number: "PF3", title: "Public Forum 3" },
        ],
      },
      {
        time: "12:15 PM",
        type: "symposium",
        title: "Lunch Symposium",
        compact: true,
      },
      {
        time: "1:30 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S18",
            title: "Ovarian Inflammatory Disease and Aging",
          },
          {
            type: "symposium",
            number: "S19",
            title: "High Risk OB: 2nd and 3rd Trimester Complications",
          },
          {
            type: "symposium",
            number: "S20",
            title: "Rheumatic Conditions and Reproductive Outcomes",
          },
        ],
      },
      { time: "2:50 PM", type: "break", title: "Coffee Break", compact: true },
      {
        time: "3:10 PM",
        type: "parallel",
        sessions: [
          {
            type: "symposium",
            number: "S21",
            title: "Microbiome and Pregnancy Outcomes",
          },
          { type: "oral", number: "Oral IV", title: "Oral Presentations IV" },
          { type: "oral", number: "Oral V", title: "Oral Presentations V" },
        ],
      },
      { time: "5:00 PM", type: "plenary", title: "Closing Ceremony & Adjourn" },
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
    };
    return styles[type] || styles.break;
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
            </div>
          </div>
        );
      }
      return (
        <div className={`p-3 ${session.compact ? "py-2" : "py-4"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

  // Get all unique times across all days for "at a glance" view
  const getAllTimes = () => {
    const timeSet = new Set();
    Object.values(scheduleData).forEach((daySchedule) => {
      daySchedule.forEach((session) => {
        timeSet.add(session.time);
      });
    });
    return Array.from(timeSet).sort((a, b) => {
      // Convert time to comparable format
      const parseTime = (timeStr) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return { hours: 0, minutes: 0 };
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        return { hours, minutes };
      };

      const timeA = parseTime(a);
      const timeB = parseTime(b);

      if (timeA.hours !== timeB.hours) {
        return timeA.hours - timeB.hours;
      }
      return timeA.minutes - timeB.minutes;
    });
  };

  const renderAtAGlanceView = () => {
    const allTimes = getAllTimes();

    return (
      <div
        ref={scheduleRef}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        {/* Header Row */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] bg-gray-900 text-white">
          <div className="p-3 text-center border-r border-gray-700">
            <div className="font-bold text-xs">Time</div>
          </div>
          {days.map((day, idx) => (
            <div
              key={idx}
              className="p-3 text-center border-r border-gray-700 last:border-r-0"
            >
              <div className="font-bold text-xs">{day.day}</div>
              <div className="text-[10px] text-gray-400">{day.date}</div>
            </div>
          ))}
        </div>

        {/* Schedule Rows */}
        <div className="divide-y divide-gray-100">
          {allTimes.map((time, timeIdx) => (
            <div
              key={timeIdx}
              className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-100"
            >
              {/* Time Column */}
              <div className="bg-gray-50 flex items-center justify-center p-2 border-r border-gray-100">
                <span className="text-[10px] font-bold text-gray-500">
                  {time}
                </span>
              </div>
              {/* Content for each day */}
              {days.map((day, dayIdx) => {
                const daySchedule = scheduleData[dayIdx] || [];
                const session = daySchedule.find((s) => s.time === time);

                if (!session) {
                  return <div key={dayIdx} className="p-1 bg-gray-50"></div>;
                }

                return (
                  <div key={dayIdx} className="min-w-0">
                    {renderSession(session, true)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentSchedule = scheduleData[selectedDay] || [];

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
              November 5-8, 2026 • The Westin Josun Busan
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
      {viewMode === "all" ? (
        renderAtAGlanceView()
      ) : (
        <div
          ref={scheduleRef}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        >
          {/* Header Row */}
          <div className="bg-gray-900 text-white p-4">
            <div className="font-bold text-lg">{days[selectedDay].day}</div>
            <div className="text-sm text-gray-400">
              {days[selectedDay].date}, 2026
            </div>
          </div>

          {/* Schedule Items */}
          <div className="divide-y divide-gray-100">
            {currentSchedule.map((session, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[80px_1fr] ${session.compact ? "" : ""}`}
              >
                {/* Time Column */}
                <div
                  className={`bg-gray-50 flex items-center justify-center border-r border-gray-100 ${session.compact ? "py-2" : "py-4"}`}
                >
                  <span
                    className={`font-bold text-gray-500 ${session.compact ? "text-[10px]" : "text-xs"}`}
                  >
                    {session.time}
                  </span>
                </div>
                {/* Content Column */}
                <div className="min-w-0">{renderSession(session)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note about schedule */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a preliminary schedule. Session times
          and topics are subject to change. The final program will be available
          closer to the congress date.
        </p>
      </div>
    </div>
  );
};

export default ScheduleTab;
