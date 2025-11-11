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
    { id: "schedule", label: "Schedule" },
    { id: "registration", label: "Registration" },
    { id: "deadlines", label: "Deadlines" },
    { id: "travel", label: "Travel" },
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
            className={`tab-button text-base font-medium px-4 py-3 ${
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

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h4
          className="text-xl font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Location
        </h4>
        <p className="text-gray-700 mb-4">
          The congress will be held at the{" "}
          <strong className="font-medium">
            BEXCO (Busan Exhibition and Convention Center)
          </strong>
          , a world-class venue in the heart of Busan. The recommended
          conference hotel is the{" "}
          <strong className="font-medium">Grand Josun, Busan</strong>, offering
          special rates for attendees.
        </p>

        <h4
          className="text-xl font-semibold text-blue-800 mt-6 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Important Deadlines
        </h4>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>
            <strong>Abstract Submission Deadline:</strong> March 15, 2026
          </li>
          <li>
            <strong>Early Bird Registration Closes:</strong> June 1, 2026
          </li>
          <li>
            <strong>Hotel Reservation Deadline:</strong> August 10, 2026
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4
          className="text-lg font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Local Organizers
        </h4>
        <ul className="text-gray-700 space-y-1 mb-4">
          <li>Kyung-Joo Hwang</li>
          <li>Jae Kwan Lee</li>
          <li>Ja Young Kwon</li>
          <li>Haeng Seok Song</li>
          <li>Joon Cheol Park</li>
        </ul>
        <h4
          className="text-lg font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Rep. Cooperation Director
        </h4>
        <p className="text-gray-700 mb-4">Hyejin Cho</p>
        <h4
          className="text-lg font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Supported By
        </h4>
        <ul className="text-gray-700 space-y-1 text-sm">
          <li>Korean Society for Reproductive Medicine</li>
          <li>Korean Society for Reproductive Immunology</li>
          <li>Korean Society of Gynecologic Oncology</li>
          <li>Korean Society of Ultrasound in Obstetrics and Gynecology</li>
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Joanee Kwak-Kim</p>
        <p className="text-sm text-gray-600">
          Rosalind Franklin University of Medicine and Science, USA
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Nardhy Gomez-Lopez</p>
        <p className="text-sm text-gray-600">
          Washington University School of Medicine, USA
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">David Sharkey</p>
        <p className="text-sm text-gray-600">
          University of Adelaide, Australia
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Cherie Ocampo-Cervantes</p>
        <p className="text-sm text-gray-600">
          University of the Philippines College of Medicine - Philippine General
          Hospital, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Renate van der Molen</p>
        <p className="text-sm text-gray-600">
          Radboud University Medical Center, The Netherlands
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Khaliun Dashdeleg</p>
        <p className="text-sm text-gray-600">
          Rosalind Franklin University Health Clinics, USA
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Petra Arck</p>
        <p className="text-sm text-gray-600">
          University Medical Center Hamburg, Germany
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Svetlana Dambaeva</p>
        <p className="text-sm text-gray-600">
          Rosalind Franklin University of Medicine and Science, USA
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Maja Weber</p>
        <p className="text-sm text-gray-600">
          Reprognostics GbR Gaiser-Kuon-Toth, Germany
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Karin Cerna</p>
        <p className="text-sm text-gray-600">GENNET, Czech Republic</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Vikki Abrahams</p>
        <p className="text-sm text-gray-600">Yale University, USA</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Takeshi Nagamatsu</p>
        <p className="text-sm text-gray-600">
          International University of Health and Welfare, Japan
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Johanna Carmina Tagle</p>
        <p className="text-sm text-gray-600">
          De La Salle University Medical Center, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Karol Anne Camonayan-Flor</p>
        <p className="text-sm text-gray-600">
          Baguio General Hospital and Medical Center, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Jelmer Prins</p>
        <p className="text-sm text-gray-600">
          University Medical Center Groningen, The Netherlands
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">John Schjenken</p>
        <p className="text-sm text-gray-600">
          University of Newcastle, Australia, Australia
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Sylvie Girard</p>
        <p className="text-sm text-gray-600">Mayo Clinic, USA</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Ayano Yamaya</p>
        <p className="text-sm text-gray-600">
          SORA no MORI Clinic KURUME, Japan
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Soren Hayrabedyan</p>
        <p className="text-sm text-gray-600">
          Institute of Biology and Immunology of Reproduction, Bulgarian Academy
          of Sciences, Bulgaria
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">
          Krassimira Todorova-Hayrabedyan
        </p>
        <p className="text-sm text-gray-600">
          Institute of Biology and Immunology of Reproduction, Bulgarian Academy
          of Sciences, Bulgaria
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Nathalie Ledee</p>
        <p className="text-sm text-gray-600">
          Maternité Pierre Rouques Les Bluets, France
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Sandra M. Blois</p>
        <p className="text-sm text-gray-600">
          Universitätsklinikum Hamburg-Eppendorf, Germany
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Jenina Maree Tuozo</p>
        <p className="text-sm text-gray-600">
          South Imus Specialist Hospital ; City of Imus Doctors Hospital,
          Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">
          Frances Lorraine Silvestre
        </p>
        <p className="text-sm text-gray-600">
          St. Luke's Medical Center, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Mariana Garcia</p>
        <p className="text-sm text-gray-600">
          Universitätsklinikum Hamburg-Eppendorf, Germany
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Jacqueline Rodolfo</p>
        <p className="text-sm text-gray-600">
          Medical Center Manila, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Maria Rowena Valerio</p>
        <p className="text-sm text-gray-600">
          Philippine Society of Reproductive Immunologists, Philippines
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Kenichiro Motomura</p>
        <p className="text-sm text-gray-600">
          National Center for Child Health and Development, Japan
        </p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold text-gray-800">Antonina Gospodinova</p>
        <p className="text-sm text-gray-600">
          Institute of Biology and Immunology of Reproduction, Bulgaria
        </p>
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
                    Early Bird (by June 1)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard (after June 1)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ISIR Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$650</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$750</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Non-Member
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$800</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$900</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Trainee / Student
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$400</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$500</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Accompanying Person
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">$250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">$250</td>
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
            congress by the early bird deadline (June 1, 2026). Failure to
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
            portal. Portals open December 1, 2025.
          </p>
          <a
            href="#"
            className="px-4 py-2 font-medium rounded-md hover:bg-yellow-600 mr-2"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Register Now (Opens Dec 1)
          </a>
          <a
            href="#"
            className="px-4 py-2 font-medium rounded-md hover:bg-yellow-600"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Submit Abstract (Opens Dec 1)
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
            Selected authors will be invited for a 12-minute oral presentation
            followed by a 3-minute Q&A.
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
    date: "Sept 1",
    title: "Registration & Abstract Submissions Open",
    desc: "The portal for both congress registration and abstract submission will be available.",
  },
  {
    date: "Mar 15",
    title: "Abstract Submission Deadline",
    desc: "Final day to submit abstracts for consideration.",
  },
  {
    date: "May 15",
    title: "Notification of Acceptance",
    desc: "Authors will be notified of their abstract status.",
  },
  {
    date: "Jun 1",
    title: "Early Bird Registration Closes",
    desc: "Register by this date to secure the discounted rate. Presenting authors must be registered.",
  },
  {
    date: "Jul 1",
    title: "Last Day to Withdraw an Abstract",
    desc: "Final day to withdraw an abstract from publication in the congress proceedings.",
  },
  {
    date: "Aug 10",
    title: "Housing Reservation Deadline",
    desc: "Book your hotel reservations early! Rooms at the special congress rate are limited and will sell out.",
  },
];

const DeadlinesTab = () => {
  // --- Date Processing Logic ---

  // 1. Get today's date, normalized to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let eventYear = today.getFullYear();
  let lastMonth = -1; // Use -1 to correctly handle the first month

  // 2. Process deadlines to add full dates and past/future status
  const processedDeadlines = deadlines.map((item) => {
    // Create a date object (e.g., 'Dec 1' -> Dec 1, [CurrentYear])
    const deadlineDate = new Date(item.date);
    const month = deadlineDate.getMonth();

    // 3. Handle year rollover
    // If this month (e.g., 2) is less than last month (e.g., 11),
    // it means we've crossed into the next year.
    if (month < lastMonth) {
      eventYear++;
    }

    deadlineDate.setFullYear(eventYear);
    lastMonth = month;

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
          We have secured a block of rooms at a discounted rate at the{" "}
          <strong className="font-medium">Grand Josun, Busan</strong>. Rates are
          available on a first-come, first-served basis and must be booked by
          August 10, 2026. Book early, as rooms will sell out!
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
          <strong className="font-medium">From PUS to BEXCO:</strong> Taxis and
          airport limousine buses are readily available. The journey to the
          BEXCO/Haeundae area takes approximately 45-60 minutes.
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
              Enjoy the stunning coastline, just steps from the convention
              center.
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
      Platinum Sponsors
    </h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg h-32">
        <img
          src="https://placehold.co/150x50/1a3a6c/f3b72c?text=Pharma+Inc."
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg h-32">
        <img
          src="https://placehold.co/150x50/1a3a6c/f3b72c?text=BioTech+Global"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Gold Sponsors
    </h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg h-32">
        <img
          src="https://placehold.co/140x40/666/eee?text=Repro+Solutions"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg h-32">
        <img
          src="https://placehold.co/140x40/666/eee?text=ImmuneHealth"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
      <div className="flex items-center justify-center p-6 bg-gray-100 rounded-lg h-32">
        <img
          src="https://placehold.co/140x40/666/eee?text=MedLab+Co."
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Silver Sponsors
    </h4>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg h-24">
        <img
          src="https://placehold.co/120x30/999/eee?text=Genetics+Ltd"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg h-24">
        <img
          src="https://placehold.co/120x30/999/eee?text=Innova+Diagnostics"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg h-24">
        <img
          src="https://placehold.co/120x30/999/eee?text=Korea+Pharma"
          alt="Sponsor Logo"
          className="opacity-75"
        />
      </div>
    </div>
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
