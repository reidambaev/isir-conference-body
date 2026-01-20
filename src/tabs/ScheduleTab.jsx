import React, { useState, useRef } from "react";

const ScheduleTab = () => {
  const scheduleRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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

  // Color coding for session types
  const sessionColors = {
    plenary: {
      bg: "bg-blue-600",
      text: "text-white",
      border: "border-blue-700",
    },
    symposium: {
      bg: "bg-amber-100",
      text: "text-amber-900",
      border: "border-amber-300",
    },
    oral: {
      bg: "bg-purple-100",
      text: "text-purple-900",
      border: "border-purple-300",
    },
    forum: {
      bg: "bg-teal-100",
      text: "text-teal-900",
      border: "border-teal-300",
    },
    social: {
      bg: "bg-emerald-100",
      text: "text-emerald-900",
      border: "border-emerald-300",
    },
    break: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    },
    meal: {
      bg: "bg-orange-50",
      text: "text-orange-800",
      border: "border-orange-200",
    },
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
              September 10-13, 2026 • The Westin Josun Busan
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
      <div className="flex flex-wrap gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600"></div>
          <span className="text-xs font-medium text-gray-600">Plenary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
          <span className="text-xs font-medium text-gray-600">Symposium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300"></div>
          <span className="text-xs font-medium text-gray-600">
            Oral Presentations
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-teal-200 border border-teal-300"></div>
          <span className="text-xs font-medium text-gray-600">
            Public Forum
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></div>
          <span className="text-xs font-medium text-gray-600">
            Social/Special
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
          <span className="text-xs font-medium text-gray-600">Break</span>
        </div>
      </div>

      {/* Schedule Grid */}
      <div
        ref={scheduleRef}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden text-xs"
      >
        {/* Header Row with Time + Days */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] bg-gray-900 text-white">
          <div className="p-2 text-center border-r border-gray-700">
            <div className="font-bold text-xs">Time</div>
          </div>
          {[
            { day: "Thursday", date: "Sept 10" },
            { day: "Friday", date: "Sept 11" },
            { day: "Saturday", date: "Sept 12" },
            { day: "Sunday", date: "Sept 13" },
          ].map((d, i) => (
            <div
              key={i}
              className="p-2 text-center border-r border-gray-700 last:border-r-0"
            >
              <div className="font-bold text-xs">{d.day}</div>
              <div className="text-[10px] text-gray-400">{d.date}</div>
            </div>
          ))}
        </div>

        {/* Schedule Rows - Each row is a time slot */}
        <div className="divide-y divide-gray-200">
          {/* 7:30 AM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                7:30 AM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.meal.bg} border-l-4 ${sessionColors.meal.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.meal.text}`}
              >
                Breakfast
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.meal.bg} border-l-4 ${sessionColors.meal.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.meal.text}`}
              >
                Breakfast
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-2 gap-1">
                <div
                  className={`p-1 rounded ${sessionColors.meal.bg} border ${sessionColors.meal.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.meal.text} leading-tight`}
                  >
                    Breakfast
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.social.bg} border ${sessionColors.social.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.social.text} leading-tight`}
                  >
                    ISIR Members Business Meeting
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8:30 AM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                8:30 AM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.plenary.bg} border-l-4 ${sessionColors.plenary.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.plenary.text}`}
              >
                Population Insight Lectures 1
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.plenary.bg} border-l-4 ${sessionColors.plenary.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.plenary.text}`}
              >
                Population Insight Lectures 2
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.plenary.bg} border-l-4 ${sessionColors.plenary.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.plenary.text}`}
              >
                Population Insight Lectures 3
              </div>
            </div>
          </div>

          {/* 10:20 AM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                10:20 AM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
          </div>

          {/* 10:35 AM Row - Parallel Sessions */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                10:35 AM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-2 gap-1">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S1: Immune Regulation
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S2: Early Pregnancy
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S3: KI Symposium
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.forum.bg} border ${sessionColors.forum.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.forum.text} leading-tight`}
                  >
                    Public Forum 1
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-2 gap-1">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S8: Immunotherapy
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S9: Environment
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S10: Preeclampsia
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.forum.bg} border ${sessionColors.forum.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.forum.text} leading-tight`}
                  >
                    Public Forum 2
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-2 gap-1">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S15: Immune Reg II
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S16: Preeclampsia II
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S17: T Cell Immunity
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.forum.bg} border ${sessionColors.forum.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.forum.text} leading-tight`}
                  >
                    Public Forum 3
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 12:00 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                12:00 PM
              </span>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Registration Opens
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Poster Session / Lunch
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Poster Session / Lunch
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Lunch Symposium
              </div>
            </div>
          </div>

          {/* 1:30 PM Row - Parallel Sessions */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                1:30 PM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S4: Therapeutic
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S5: Exosomes
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S6: Male Infertility
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S11: Repro Disorders
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S12: Gyn Malig
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S13: Infection/Vacc
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S18: Ovarian Aging
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S19: High Risk OB
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S20: Rheumatic
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2:50 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                2:50 PM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.break.bg} border-l-4 ${sessionColors.break.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.break.text}`}
              >
                Coffee Break
              </div>
            </div>
          </div>

          {/* 3:10 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                3:10 PM
              </span>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                ISIR Council Meeting
              </div>
              <div className="text-[8px] text-gray-500">3:00 PM</div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.oral.bg} border ${sessionColors.oral.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.oral.text} leading-tight`}
                  >
                    Oral I
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.oral.bg} border ${sessionColors.oral.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.oral.text} leading-tight`}
                  >
                    Oral II
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S7: Fetal Outcome
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.plenary.bg} border ${sessionColors.plenary.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.plenary.text} leading-tight`}
                  >
                    NI Awards
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.oral.bg} border ${sessionColors.oral.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.oral.text} leading-tight`}
                  >
                    Oral III
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S14: Hormone
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white">
              <div className="grid grid-cols-3 gap-0.5">
                <div
                  className={`p-1 rounded ${sessionColors.symposium.bg} border ${sessionColors.symposium.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.symposium.text} leading-tight`}
                  >
                    S21: Microbiome
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.oral.bg} border ${sessionColors.oral.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.oral.text} leading-tight`}
                  >
                    Oral IV
                  </div>
                </div>
                <div
                  className={`p-1 rounded ${sessionColors.oral.bg} border ${sessionColors.oral.border}`}
                >
                  <div
                    className={`text-[8px] font-bold ${sessionColors.oral.text} leading-tight`}
                  >
                    Oral V
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5:00 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                5:00 PM
              </span>
            </div>
            <div
              className={`p-3 ${sessionColors.plenary.bg} border-l-4 ${sessionColors.plenary.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.plenary.text}`}
              >
                Welcome Address
              </div>
              <div className="text-[8px] text-blue-200">
                Building on a Legacy
              </div>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.plenary.bg} border-l-4 ${sessionColors.plenary.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.plenary.text}`}
              >
                Closing & Adjourn
              </div>
            </div>
          </div>

          {/* 6:00 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                6:00 PM
              </span>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Trainee Social Event
              </div>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Award Gala
              </div>
              <div className="text-[8px] text-gray-500">
                JRI Editorial Meeting
              </div>
            </div>
            <div className="p-3 bg-gray-50"></div>
          </div>

          {/* 6:30 PM Row */}
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] divide-x divide-gray-200 min-h-[52px]">
            <div className="p-3 bg-gray-50 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-500">
                6:30 PM
              </span>
            </div>
            <div
              className={`p-3 ${sessionColors.social.bg} border-l-4 ${sessionColors.social.border}`}
            >
              <div
                className={`text-[10px] font-bold ${sessionColors.social.text}`}
              >
                Welcome Reception
              </div>
            </div>
            <div className="p-3 bg-gray-50"></div>
            <div className="p-3 bg-gray-50"></div>
            <div className="p-3 bg-gray-50"></div>
          </div>
        </div>
      </div>

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
