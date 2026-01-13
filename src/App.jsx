import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import headshots from "./assets/congress_chairs.png";

// ======================================================================
// NOTE ON HEIGHT BROADCASTING:
// The original utility function has been REMOVED and the logic is now
// integrated into the App component using a ResizeObserver.
// This ensures height is sent on expansion AND on shrinkage.
// ======================================================================

// NAVIGATION COMPONENT
const Navigation = ({ activeTab, onTabClick }) => {
  const tabs = [
    { id: "about", label: "About" },
    { id: "committee", label: "Program Committee" },
    // { id: "schedule", label: "Schedule" },
    // { id: "registration", label: "Registration" },
    { id: "deadlines", label: "Deadlines" },
    // { id: "travel", label: "Travel" },
    { id: "sponsors", label: "Sponsors/Exhibits" },
  ];

  return (
    <nav
      style={{ backgroundColor: "var(--color-primary)" }}
      className="rounded-t-lg pl-5"
    >
      <div className="flex flex-wrap" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button text-xl font-medium px-8 py-6 ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => onTabClick(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

// ABOUT TAB COMPONENT
const AboutTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Welcome to ISIR 2026 in Busan
    </h3>
    <p className="text-gray-700 mb-6">
      You are cordially invited to the 16th Congress of the International
      Society for Immunology of Reproduction (ISIR) in the beautiful city of
      Busan, Korea. Join us from September 10-13, 2026, for a "Global Dialog on
      Population Balance and Women's Health through Reproductive Immunology." We
      look forward to welcoming leading researchers, clinicians, and industry
      partners to share the latest advancements in our field.
    </p>

    <div className="space-y-8">
      <div>
        <h4
          className="text-xl font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Location
        </h4>
        <p className="text-gray-700 mb-4">
          The 16th International Society for Immunology of Reproduction (ISIR)
          Congress will be held at{" "}
          <strong className="font-medium">The Westin Josun Busan</strong>, one
          of Korea's premier seafront conference hotels. Overlooking Haeundae
          Beach and located adjacent to Dongbaek Island, the venue provides an
          ideal environment that blends scientific professionalism with
          outstanding natural beauty.
        </p>
      </div>

      <div>
        <h4
          className="text-xl font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Important Dates
        </h4>
        <ul className="list-disc list-inside text-gray-700 space-y-2 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <li>
            <strong>Abstract Submission Opens:</strong> February 1, 2026
          </li>
          <li>
            <strong>Early Bird Registration Opens:</strong> February 1, 2026
          </li>
          <li>
            <strong>Abstract Submission Deadline:</strong> April 30, 2026
          </li>
          <li>
            <strong>Early Bird Registration Deadline:</strong> July 10, 2026
          </li>
          <li>
            <strong>Online Registration Deadline:</strong> August 30, 2026
          </li>
        </ul>
      </div>
    </div>

    <img
      src={headshots}
      alt="Headshots of congress chairs"
      className="p-10 rounded-lg"
    ></img>
  </div>
);

// COMMITTEE TAB COMPONENT (UPDATED)
const CommitteeTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Program Committee
    </h3>
    <img
      src={headshots}
      alt="Headshots of congress chairs"
      className="p-10 rounded-lg"
    ></img>
    <h4
      className="text-xl font-semibold text-blue-800 mt-6 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Scientific Committee Members
    </h4>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700">
        <p>Nardhy Gomez-Lopez (USA)</p>
        <p>Sylvie Girard (USA)</p>
        <p>Petra Arck (Germany)</p>
        <p>David Sharkey (Australia)</p>
        <p>Atsushi Fukui (Japan)</p>
        <p>Sarah Robertson (Australia)</p>
        <p>Satish K Gupta (India)</p>
        <p>Udo Markert (Germany)</p>
        <p>Sandra Blois (Germany)</p>
        <p>Marie Pierre Piccinni (Italy)</p>
        <p>Akitoshi Nakashima (Japan)</p>
        <p>Shigeru Saito (Japan)</p>
        <p>Aihua Liao (China)</p>
        <p>Nathalie Ledee (France)</p>
        <p>Chandrakant Tayade (Canada)</p>
        <p>Jelmer Prins (Netherlands)</p>
        <p>Nandor Gabor Than (Hungary)</p>
        <p>Gendie Lash (China)</p>
        <p>Aleksandar Stanic-Kostic (USA)</p>
        <p>Tamara Tilburgs (USA)</p>
        <p>Lorena Amaral (USA)</p>
        <p>Thanh Luu (USA)</p>
        <p>Haiming Wei (China)</p>
        <p>Meirong Du (China)</p>
        <p>Liang Hui Diao (China)</p>
        <p>Da-Jin Li (China)</p>
        <p>Marcelo Cavalcante (Brazil)</p>
        <p>Conor Harrity (Ireland)</p>
        <p>Deepak Modi (India)</p>
        <p>Mohan Raut (India)</p>
        <p>Mugdha Raut (India)</p>
        <p>Michael Eikmans (Netherlands)</p>
        <p>Brice Gaudilliere (USA)</p>
        <p>Wael Saab (UK)</p>
        <p>Lujain Alsubki (Saudi Arabia)</p>
        <p>Stella Goulopoulou (USA)</p>
        <p>Gus Dekker (Australia)</p>
        <p>Sandra Davidge (Canada)</p>
        <p>Phil Bennett (UK)</p>
        <p>Larry Chamley (New Zealand)</p>
        <p>Cherie Ocampo-Cervantes (Philippines)</p>
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-8 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Local Scientific Committee Members
    </h4>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700">
        <p>Kyung-Joo Hwang (Korea)</p>
        <p>Jae Kwan Lee (Korea)</p>
        <p>Ja Young Kwon (Korea)</p>
        <p>Haeng Seok Song (Korea)</p>
        <p>Joon Cheol Park (Korea)</p>
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-8 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Rep. Cooperation Directors
    </h4>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700">
        <p>Hyejin Cho</p>
        <p>Kuksun Han</p>
        <p>Nayoung Kim</p>
        <p>Aera Han</p>
      </div>
    </div>
  </div>
);

// SCHEDULE TAB COMPONENT (UPDATED)
const ScheduleTab = () => {
  // 1. Define the Master Time Slots (Rows) and their duration
  // I am using the most specific time slot available to define the row.
  const timeSlots = [
    { time: "7:30 am - 8:30 am", className: "h-16" },
    { time: "8:00 am - 9:30 am", className: "h-20" }, // Plenary Sessions start at 8:00
    { time: "10:00 am - 12:00 pm", className: "h-24" },
    { time: "12:00 pm - 1:15 pm", className: "h-16" },
    { time: "1:15 pm - 3:15 pm", className: "h-24" },
    { time: "3:15 pm - 3:45 pm", className: "h-12" },
    { time: "3:45 pm - 5:45 pm", className: "h-24" },
    { time: "5:45 pm - 6:30 pm", className: "h-16" },
    { time: "6:30 pm +", className: "h-16" }, // For evening social events
    // Note: Some events will appear in a cell that starts *before* their defined time (e.g., 8:00 AM event in the 7:30 AM row)
    // This is necessary because of the rigid row structure.
  ];

  // 2. Define the Day Columns (Matching your conference dates/days)
  const days = [
    { key: "day0", label: "SUN Sept 10" }, // This key is temporary for the one Sunday event
    { key: "day1", label: "MON Sept 11" },
    { key: "day2", label: "TUES Sept 12" },
    { key: "day3", label: "WED Sept 13" },
    { key: "day4", label: "THURS Sept 14" }, // Departure day
  ];

  // 3. The Schedule Data, reorganized to match the new image structure
  // Each item's position corresponds to the timeSlots array index (row index)
  const scheduleDataBySlot = [
    // Row 0: 7:30 am - 8:30 am
    {
      day0: null,
      day1: {
        event: "Breakfast",
        style: { backgroundColor: "#e9f5ff", borderLeft: "3px solid #60a5fa" },
      },
      day2: {
        event: "Breakfast",
        style: { backgroundColor: "#e9f5ff", borderLeft: "3px solid #60a5fa" },
      },
      day3: {
        event: "Breakfast",
        style: { backgroundColor: "#e9f5ff", borderLeft: "3px solid #60a5fa" },
      },
      day4: {
        event: "Departures",
        style: { backgroundColor: "#fef3c7", color: "var(--color-primary)" },
      },
    },
    // Row 1: 8:00 am - 9:30 am
    {
      day0: null,
      day1: {
        event: "Plenary Session II: Herr Award Lecture",
        style: {
          backgroundColor: "#f1f5f9",
          borderLeft: "3px solid var(--color-primary)",
        },
      },
      day2: {
        event: "Plenary Session III: AJRI Award Lecture",
        style: {
          backgroundColor: "#f1f5f9",
          borderLeft: "3px solid var(--color-primary)",
        },
      },
      day3: {
        event: "Plenary Session IV: Gusdon Award Talks",
        style: {
          backgroundColor: "#f1f5f9",
          borderLeft: "3px solid var(--color-primary)",
        },
      },
      day4: null,
    },
    // Row 2: 10:00 am - 12:00 pm
    {
      day0: null,
      day1: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day2: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day3: {
        event: "Breakouts 11 & 12",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day4: null,
    },
    // Row 3: 12:00 pm - 1:15 pm
    {
      day0: null,
      day1: {
        event: "Lunch Session",
        style: { backgroundColor: "#f0fdfa", borderLeft: "3px solid #14b8a6" },
      },
      day2: {
        event: "ASRI Bus. Meeting & Lunch",
        style: { backgroundColor: "#f0fdfa", borderLeft: "3px solid #14b8a6" },
      },
      day3: {
        event: "Lunch Session",
        style: { backgroundColor: "#f0fdfa", borderLeft: "3px solid #14b8a6" },
      },
      day4: null,
    },
    // Row 4: 1:15 pm - 3:15 pm
    {
      day0: null,
      day1: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day2: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day3: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day4: null,
    },
    // Row 5: 3:15 pm - 3:45 pm
    {
      day0: null,
      day1: {
        event: "Break",
        style: { backgroundColor: "#e9ecef", color: "#6c757d" },
      },
      day2: {
        event: "Break",
        style: { backgroundColor: "#e9ecef", color: "#6c757d" },
      },
      day3: {
        event: "Break",
        style: { backgroundColor: "#e9ecef", color: "#6c757d" },
      },
      day4: null,
    },
    // Row 6: 3:45 pm - 5:45 pm
    {
      day0: null,
      day1: {
        event: "Poster Session I & Judging",
        style: { backgroundColor: "#f0fdfa", borderLeft: "3px solid #14b8a6" },
      },
      day2: {
        event: "Breakouts",
        style: { backgroundColor: "#fff7ed", borderLeft: "3px solid #f3b72c" },
      },
      day3: {
        event: "Poster Session II",
        style: { backgroundColor: "#f0fdfa", borderLeft: "3px solid #14b8a6" },
      },
      day4: null,
    },
    // Row 7: 5:45 pm - 6:30 pm
    {
      day0: {
        event: "Plenary Session I: Coulam Award Lecture",
        style: {
          backgroundColor: "#f1f5f9",
          borderLeft: "3px solid var(--color-primary)",
        },
      },
      day1: null,
      day2: null,
      day3: null,
      day4: null,
    },
    // Row 8: 6:30 pm +
    {
      day0: {
        event: "Welcome Reception",
        style: { backgroundColor: "#e9f5ff", color: "var(--color-primary)" },
      },
      day1: {
        event: "Trainee Event",
        style: { backgroundColor: "#e9f5ff", color: "var(--color-primary)" },
      },
      day2: {
        event: "AJRI Editorial Board Meeting",
        style: { backgroundColor: "#e9f5ff", color: "var(--color-primary)" },
      },
      day3: {
        event: "Awards Dinner & Dancing",
        style: { backgroundColor: "#e9f5ff", color: "var(--color-primary)" },
      },
      day4: null,
    },
  ];

  // 4. Custom Styles (More compact and visually appealing to match the image)
  const tableStyles = {
    borderCollapse: "collapse",
    width: "100%",
    minWidth: "700px",
    border: "1px solid #dee2e6",
    fontSize: "14px",
  };
  const thStyles = {
    border: "1px solid #dee2e6",
    padding: "8px 4px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    fontWeight: "700",
    color: "var(--color-primary)",
    width: "calc(100% / 6)", // 5 columns + 1 time column
  };
  const timeThStyles = {
    ...thStyles,
    textAlign: "left",
    padding: "8px 10px",
    fontWeight: "500",
    backgroundColor: "#e9ecef",
    width: "100px",
    verticalAlign: "top",
    lineHeight: "1.2",
  };
  const tdStyles = {
    border: "1px solid #dee2e6",
    padding: "0",
    verticalAlign: "middle",
    textAlign: "center",
  };
  const eventBoxStyles = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "4px",
    fontWeight: "500",
    lineHeight: "1.3",
  };

  return (
    <div role="tabpanel">
      <h3
        className="text-2xl font-bold text-blue-900 mb-6"
        style={{ color: "var(--color-primary)" }}
      >
        Full Congress Schedule
      </h3>

      <div className="overflow-x-auto">
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={timeThStyles}>TIME</th>
              {days.map((day) => (
                <th key={day.key} style={thStyles}>
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, rowIndex) => (
              <tr key={slot.time}>
                {/* Time Column */}
                <th
                  style={{
                    ...timeThStyles,
                    height: slot.className.split("-")[1] + "px",
                  }}
                >
                  {slot.time
                    .replace("+", "")
                    .split(" - ")
                    .map((t, i) => (
                      <div key={i}>{t}</div>
                    ))}
                </th>

                {/* Day Columns */}
                {days.map((day) => {
                  const event = scheduleDataBySlot[rowIndex][day.key];
                  const combinedStyle = event
                    ? { ...eventBoxStyles, ...event.style }
                    : eventBoxStyles;

                  // Use Tailwind utility classes for height, defined in the timeSlots array
                  return (
                    <td
                      key={day.key}
                      style={{
                        ...tdStyles,
                        height: slot.className.split("-")[1] + "px",
                      }}
                    >
                      {event ? (
                        <div style={combinedStyle}>{event.event}</div>
                      ) : (
                        <div
                          style={{
                            ...combinedStyle,
                            backgroundColor: "#fcfcfc",
                          }}
                        >
                          {/* Empty Cell */}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// REGISTRATION TAB COMPONENT (UPDATED)
const RegistrationTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Registration & Abstract Submission
    </h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Registration Fees
          </h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Early Bird (by July 10)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard (after July 10)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ISIR Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$350</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$450</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Non-Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$650</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$750</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Trainee / Student Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$150</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$200</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Trainee / Student Non-Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$300</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Accompanying Person
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$350</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            *Trainee/Student rate requires proof of status. Accompanying person
            fee includes Welcome Reception and Gala Dinner only.
          </p>
        </div>

        <div>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Presenting Author Requirements
          </h4>
          <p className="text-gray-700">
            The presenting author of an accepted abstract must register for the
            congress by the early bird deadline (July 10, 2026). Failure to
            register will result in the abstract being withdrawn from the
            program and publication.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Register Now
          </h4>
          <p className="text-gray-700 mb-3">
            Registration and abstract submission are handled through the same
            portal. Portals open February 1, 2026.
          </p>
          <a
            href="https://theisir.org/membership-account/membership-levels/"
            className="px-4 py-2 font-medium rounded-md hover:bg-yellow-600"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Create an Account to Register & Submit Abstracts
          </a>
        </div>

        <div>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Abstract Format Requirements
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              <strong>Title:</strong> Max 150 characters, bold.
            </li>
            <li>
              <strong>Authors:</strong> List all authors and affiliations.
            </li>
            <li>
              <strong>Body:</strong> Max 300 words.
            </li>
            <li>
              <strong>Structure:</strong> Must include Objectives, Methods,
              Results, and Conclusions.
            </li>
            <li>
              <strong>Keywords:</strong> 3-5 keywords.
            </li>
          </ul>
        </div>

        <div>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Types of Presentations
          </h4>
          <h5 className="text-lg font-medium text-gray-800 mb-1">
            Oral Presentations
          </h5>
          <p className="text-gray-700 mb-2">
            Selected authors will be invited for a 9-minute oral presentation
            followed by a 2-minute Q&A.
          </p>
          <h5 className="text-lg font-medium text-gray-800 mb-1">
            Poster Presentations
          </h5>
          <p className="text-gray-700">
            Posters will be displayed in the exhibit hall. Poster dimensions
            must not exceed 90cm wide x 120cm high (portrait orientation).
          </p>
        </div>
      </div>
    </div>
  </div>
);

// DEADLINES TAB COMPONENT
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 mr-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CircleCheckIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const deadlines = [
  {
    date: "Feb 1",
    title: "Registration & Abstract Submissions Open",
    desc: "The portal for both congress registration and abstract submission will be available.",
  },
  {
    date: "Apr 30",
    title: "Abstract Submission Deadline",
    desc: "Final day to submit abstracts for consideration.",
  },
  {
    date: "May 20",
    title: "Notification of Acceptance",
    desc: "Authors will be notified of their abstract status.",
  },
  {
    date: "Jul 10",
    title: "Early Bird Registration Closes",
    desc: "Register by this date to secure the discounted rate. Presenting authors must be registered.",
  },
  {
    date: "Jul 10",
    title: "Hotel Discount Deadline",
    desc: "Last day to book hotel rooms at the early discounted rate.",
  },
  {
    date: "Aug 30",
    title: "Registration Deadline",
    desc: "Final day for advance registration. On-site registration available September 10-13.",
  },
];

const DeadlinesTab = () => {
  // --- Date Processing Logic ---

  // 1. Get today's date, normalized to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Set the conference year to 2026
  let eventYear = 2026;

  // 3. Process deadlines to add full dates and past/future status
  const processedDeadlines = deadlines.map((item) => {
    // Create a date object (e.g., 'Jan 15' -> Jan 15, 2026)
    const deadlineDate = new Date(item.date + ", " + eventYear);

    // 4. Check if the deadline is in the past
    const isPast = deadlineDate < today;

    return { ...item, fullDate: deadlineDate, isPast };
  });

  // 5. Find the index of the *first* deadline that is NOT in the past
  const closestIndex = processedDeadlines.findIndex((d) => !d.isPast);
  // --- End of Logic ---

  return (
    <div role="tabpanel" className="py-4">
      <div className="flex items-center mb-8">
        <span style={{ color: "var(--color-primary)" }}>
          <CalendarIcon />
        </span>
        <h3
          className="text-2xl font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          Important Dates & Deadlines
        </h3>
      </div>

      <div className="space-y-6">
        {processedDeadlines.map((item, index) => {
          const [month, day] = item.date.split(" ");

          const isClosest = closestIndex === index;
          const isPast = item.isPast;

          // The "Housing" deadline's isUrgent flag is respected *unless*
          // another item is closer. The closest non-past item is *always* urgent.
          const isUrgent = (item.isUrgent && !isPast) || isClosest;

          // --- Conditional Classes ---

          const cardClasses = isPast
            ? "opacity-60" // Fade past items
            : `transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isUrgent
                  ? "shadow-red-100/70 ring-2 ring-red-500"
                  : "shadow-gray-100/70"
              }`;

          const dateBlockClasses = isPast
            ? "bg-gray-100 text-gray-400" // Gray if past
            : isUrgent
            ? "bg-red-50 text-red-700" // Red if urgent
            : "bg-indigo-50 text-indigo-700"; // Normal

          const titleClasses = isPast
            ? "text-gray-900 line-through" // Strike-through if past
            : isUrgent
            ? "text-red-900" // Red if urgent
            : "text-gray-900";

          const descClasses = isPast
            ? "text-gray-600 line-through" // Strike-through if past
            : "text-gray-600";

          return (
            <div
              key={item.title}
              className={`flex items-center p-6 bg-white rounded-xl shadow-lg ${cardClasses}`}
            >
              {/* Date Block */}
              <div
                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-lg mr-6 ${dateBlockClasses}`}
              >
                <span className="text-sm font-medium uppercase">{month}</span>
                <span className="text-3xl font-bold">{day}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className={`text-lg font-semibold ${titleClasses}`}>
                  {item.title}
                </h4>
                <p className={`${descClasses} mt-1`}>{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// TRAVEL TAB COMPONENT (UPDATED)
const TravelTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Travel & Accommodation
    </h3>
    <div className="space-y-6">
      <div>
        <h4
          className="text-xl font-semibold text-blue-800 mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Hotel Reservations
        </h4>
        <p className="text-gray-700">
          The congress will be held at{" "}
          <strong className="font-medium">The Westin Josun Busan</strong>,
          overlooking Haeundae Beach. We have secured a block of rooms at a
          discounted rate. Rates are available on a first-come, first-served
          basis and must be booked by August 10, 2026. Book early, as rooms will
          sell out!
        </p>
        <a
          href="#"
          className="mt-2 inline-block px-4 py-2 font-medium rounded-md hover:bg-yellow-600"
          style={{
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-primary)",
          }}
        >
          Book Hotel Now
        </a>
      </div>
      <div>
        <h4
          className="text-xl font-semibold text-blue-800 mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Getting to Busan
        </h4>
        <p className="text-gray-700 mb-2">
          <strong className="font-medium">By Air:</strong> The closest
          international airport is{" "}
          <strong className="font-medium">
            Gimhae International Airport (PUS)
          </strong>
          , which serves many destinations across Asia. For wider international
          access, you may fly into{" "}
          <strong className="font-medium">
            Incheon International Airport (ICN)
          </strong>{" "}
          near Seoul and take a high-speed KTX train directly to Busan (approx.
          2.5 - 3 hours).
        </p>
        <p className="text-gray-700">
          <strong className="font-medium">
            From PUS to The Westin Josun Busan:
          </strong>{" "}
          Taxis and airport limousine buses are readily available. The journey
          to the Haeundae area takes approximately 45-60 minutes.
        </p>
      </div>
      <div>
        <h4
          className="text-xl font-semibold text-blue-800 mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Request a Visa Letter
        </h4>
        <p className="text-gray-700">
          International attendees may require a visa to enter Korea. We
          recommend checking with your local Korean embassy or consulate for the
          latest requirements. Once you have registered and paid for the
          congress, you may request an official Letter of Invitation to support
          your visa application.
        </p>
        <a
          href="#"
          className="mt-2 inline-block px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300"
        >
          Request Visa Letter (Registration Required)
        </a>
      </div>
    </div>

    <hr className="my-8" />

    <div>
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Explore Beautiful Busan
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg overflow-hidden shadow">
          <img
            src="https://placehold.co/400x250/60a5fa/white?text=Haeundae+Beach"
            alt="Haeundae Beach"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h5 className="font-semibold text-lg text-blue-800">
              Haeundae Beach
            </h5>
            <p className="text-sm text-gray-600">
              Enjoy the stunning coastline, just steps from the hotel.
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg overflow-hidden shadow">
          <img
            src="https://placehold.co/400x250/1a3a6c/f3b72c?text=Gamcheon+Village"
            alt="Gamcheon Culture Village"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h5 className="font-semibold text-lg text-blue-800">
              Gamcheon Culture Village
            </h5>
            <p className="text-sm text-gray-600">
              Explore the colorful "Machu Picchu of Busan" with its vibrant art
              and cafes.
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg overflow-hidden shadow">
          <img
            src="https://placehold.co/400x250/f3b72c/1a3a6c?text=Jagalchi+Market"
            alt="Jagalchi Market"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h5 className="font-semibold text-lg text-blue-800">
              Jagalchi Market
            </h5>
            <p className="text-sm text-gray-600">
              Experience Korea's largest seafood market and try fresh local
              delicacies.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// SPONSORS TAB COMPONENT (UPDATED)
const SponsorsTab = () => (
  <div role="tabpanel">
    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Sponsors & Exhibitors
    </h3>
    <p className="text-gray-700 mb-6">
      We are grateful for the support of our sponsors and exhibitors, who make
      this congress possible. Visit their booths in the main exhibit hall to
      learn about the latest technologies and services in reproductive
      immunology.
    </p>

    <h4
      className="text-xl font-semibold text-blue-800 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Supported By
    </h4>
    <ul className="list-disc list-inside text-gray-700 space-y-2 mb-8">
      <li>Korean Society for Reproductive Medicine</li>
      <li>Korean Society for Reproductive Immunology</li>
      <li>Korean Society of Gynecologic Oncology</li>
      <li>Korean Society of Ultrasound in Obstetrics and Gynecology</li>
      <li>Korean College of Obstetrics and Gynecology</li>
    </ul>

    <p className="text-gray-600 italic mt-8">
      Sponsorship opportunities are available. Please contact us for more
      information.
    </p>
  </div>
);

// FOOTER COMPONENT
const Footer = () => (
  <footer className="text-center text-gray-500 text-sm mt-6">
    &copy; 2026 International Society for Immunology of Reproduction. All rights
    reserved. |{" "}
    <a href="#" className="hover:underline">
      Contact Us
    </a>
  </footer>
);

// MAIN APP COMPONENT
export default function App() {
  const [activeTab, setActiveTab] = useState("about");
  // 1. Create a ref to attach to the main container
  const appRef = useRef(null);

  // *** IMPORTANT: REPLACE THE '*' WITH YOUR ACTUAL WORDPRESS DOMAIN ***
  const parentOrigin = "*";

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return <AboutTab />;
      case "committee":
        return <CommitteeTab />;
      case "schedule":
        return <ScheduleTab />;
      case "registration":
        return <RegistrationTab />;
      case "deadlines":
        return <DeadlinesTab />;
      case "travel":
        return <TravelTab />;
      case "sponsors":
        return <SponsorsTab />;
      default:
        return <AboutTab />;
    }
  };

  /**
   * 2. Use a single useEffect hook to handle all height adjustments
   * via a ResizeObserver on the main container element (appRef).
   * This fires on initial load, element size changes (shrink/expand),
   * and window resize.
   */
  useEffect(() => {
    // Function to calculate and send the height
    const broadcastHeight = () => {
      // Exit if not inside an iframe or ref not ready
      if (window.parent === window || !appRef.current) return;

      // Get the full scroll height of the observed element
      const height = appRef.current.scrollHeight;

      window.parent.postMessage({ height: height }, parentOrigin);
      // Optional: console.log("Iframe sending height:", height); for debugging
    };

    // 3. Setup the ResizeObserver
    const observer = new ResizeObserver(broadcastHeight);

    // 4. Start observing the main application container
    if (appRef.current) {
      observer.observe(appRef.current);
    }

    // Also explicitly broadcast the height whenever the tab changes
    // to ensure the instant update is registered (ResizeObserver might have a slight delay)
    broadcastHeight();

    // 5. Cleanup function
    return () => {
      observer.disconnect();
      // No need for a separate window.resize listener now, as ResizeObserver handles that too.
    };
  }, [activeTab]); // Rerun setup when the tab changes to ensure instant update

  return (
    // 6. Attach the ref to the outermost container
    <div ref={appRef} className="bg-white rounded-lg shadow-md">
      <Navigation activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="p-6 md:p-8">{renderTabContent()}</div>
      <Footer />
    </div>
  );
}
