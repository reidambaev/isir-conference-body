import React from "react";
import headshot1 from "../assets/headshots/headshot1.jpg";
import headshot2 from "../assets/headshots/headshot2.png";
import headshot3 from "../assets/headshots/headshot3.jpg";
import headshot4 from "../assets/headshots/headshot4.jpg";
import headshot5 from "../assets/headshots/headshot5.jpg";
import headshot6 from "../assets/headshots/headshot6.jpg";
import headshot7 from "../assets/headshots/headshot7.jpg";
import headshot8 from "../assets/headshots/headshot8.jpg";
import headshot9 from "../assets/headshots/headshot9.jpg";

const speakers = [
  {
    name: "Petra Arck",
    affiliation: "University Medical Center Hamburg, Germany",
    image: headshot5,
  },
  {
    name: "Sandra M Blois",
    affiliation: "Universitätsklinikum Hamburg-Eppendorf, Germany",
    image: headshot7,
  },
  {
    name: "Atsushi Fukui",
    affiliation: "Hyogo College of Medicine, Japan",
    image: headshot6,
  },
  {
    name: "Nardhy Gomez-Lopez",
    affiliation: "Washington University School of Medicine, USA",
    image: headshot9,
  },
  {
    name: "Udo Markert",
    affiliation: "Universitätsklinikum Jena, Germany",
    image: headshot3,
  },
  {
    name: "Gil Mor",
    affiliation: "Wayne State University, USA",
    image: headshot2,
  },
  {
    name: "Akitoshi Nakashima",
    affiliation: "University of Toyama, Japan",
    image: headshot8,
  },
  {
    name: "Sarah Robertson",
    affiliation: "The University of Adelaide, Australia",
    image: headshot1,
  },
  {
    name: "David Sharkey",
    affiliation: "The University of Adelaide, Australia",
    image: headshot4,
  },
];

function SpeakersTab() {
  return (
    <div role="tabpanel">
      {/* Header Section */}
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
            <p className="text-gray-600">
              Distinguished experts in reproductive immunology
            </p>
          </div>
        </div>
      </div>

      {/* Speaker Grid */}
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
        <p className="text-gray-600 mb-6">
          Distinguished experts in population studies
        </p>
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mr-4"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4
                  className="text-xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Coming Soon
                </h4>
                <p className="text-gray-700">
                  Distinguished keynote speakers to be announced soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speaker Grid */}
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
        <p className="text-gray-600 mb-6">
          Distinguished experts in reproductive immunology
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col items-center"
            >
              <img
                src={speaker.image}
                alt={speaker.name}
                className="w-28 h-28 rounded-full object-cover mb-4 border-2 border-blue-200"
              />
              <h5
                className="text-lg font-bold mb-1"
                style={{ color: "var(--color-primary)" }}
              >
                {speaker.name}
              </h5>
              <p className="text-gray-600 text-sm text-center mb-2 whitespace-pre-line">
                {speaker.affiliation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Session Topics Preview */}
      {/* <div className="mb-10">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Scientific Topics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Maternal-Fetal Immune Tolerance",
            "Reproductive Autoimmunity",
            "Immunology of Implantation",
            "Recurrent Pregnancy Loss",
            "Immunotherapy in Reproduction",
            "Microbiome & Reproductive Health",
            "Endometriosis & Immune Dysfunction",
            "Male Reproductive Immunology",
          ].map((topic, index) => (
            <div
              key={index}
              className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="text-white text-sm font-bold">
                  {index + 1}
                </span>
              </div>
              <span className="font-medium text-gray-800">{topic}</span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Call for Abstracts */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-center shadow-xl">
        <h4 className="text-2xl font-bold text-white mb-3">
          Share Your Research
        </h4>
        <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
          Submit your abstract and join our distinguished speakers at ISIR 2026.
          Abstract submission opens March 1, 2026.
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
