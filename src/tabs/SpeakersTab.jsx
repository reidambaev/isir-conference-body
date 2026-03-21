import React from "react";

const plenarySpeakers = [
  {
    name: "Cheong-Seok Kim",
    affiliation:
      "Center for Collaborative Research on Population and Society at Dongguk University, Seoul.",
    image: "cheong-seok-kim.png",
    imagePosition: "center 10%",
  },
  {
    name: "Melinda Mills",
    affiliation:
      "Professor of Demography and Population Health, University of Oxford; Nuffield College; Director, Leverhulme Centre for Demographic Science",
    image: "melinda-mills.png",
    imagePosition: "center 0%",
  },
  {
    name: "Sam Richards",
    affiliation:
      "Professor at Penn State University and a Distinguished Professor at Konkuk University in Seoul, Korea",
    image: "sam-richards.png",
    imagePosition: "center 22%",
  },
];

const speakers = [
  {
    name: "Ricardo Barini",
    affiliation:
      "Collaborating Professor, University of Campinas (UNICAMP), Brazil",
    image: null,
  },
  {
    name: "Lina Bergman",
    affiliation: "Associate Professor, University of Gothenburg, Sweden",
    image: "lina-bergman.jpg",
  },
  {
    name: "Marcelo Cavalcante",
    affiliation: "Professor, University of Fortaleza (UNIFOR), Brazil",
    image: "marcelo-cavalcante.jpeg",
    imagePosition: "center 20%",
  },
  {
    name: "Brice Gauilliere",
    affiliation: "Professor, Stanford University School of Medicine",
    image: "brice-gauilliere.jpg",
  },
  {
    name: "Nardhy Gomez-Lopez",
    affiliation:
      "Professor, Washington University School of Medicine in St. Louis",
    image: "nardhy-gomez-lopez.jpg",
  },
  {
    name: "Ananth Kumar Kammala",
    affiliation: "The University of Texas Medical Branch at Galveston",
    image: "ananth-kammala.jpeg",
  },
  {
    name: "Shihoko Komine-Aizawa",
    affiliation: "Professor, Nihon University School of Medicine, Tokyo",
    image: "komine-aizawa.jpg",
    imagePosition: "center 30%",
  },
  {
    name: "Maciej Kurpisz",
    affiliation:
      "Institute of Human Genetics Pol. Acad. Sci., Poznan, Poland. Collegium Medicum, President Stanislaw Wojciechowski Calisia University, Kalisz, Poland",
    image: "maciej-kurpisz.jpg",
    imagePosition: "center 15%",
  },
  {
    name: "Ja Young Kwon",
    affiliation: "Professor, Yonsei University College of Medicine, Seoul",
    image: "ja-young-kwon.jpeg",
  },
  {
    name: "Gendie E Lash",
    affiliation:
      "Guangzhou Women and Children's Medical Center, Guangzhou, China",
    image: "gendie-lash.jpg",
    imagePosition: "center 25%",
  },
  {
    name: "Eun-Ju Lee",
    affiliation: "Professor, Chung-Ang University School of Medicine",
    image: "eun-ju-lee.jpg",
  },
  {
    name: "Jae Ho Lee",
    affiliation:
      "Division of Cell Gene & Regenerative medicine, CHA University",
    image: "jae-ho-lee.jpg",
    imagePosition: "center 20%",
  },
  {
    name: "Jung Ryeol Lee",
    affiliation: "Professor, Seoul National University College of Medicine",
    image: "jung-ryeol-lee.jpg",
  },
  {
    name: "Sung Ki Lee",
    affiliation:
      "Konyang University College of Medicine, Myung-Gok Medical Research Institute",
    image: "sung-ki-lee.jpg",
    imagePosition: "center 20%",
  },
  {
    name: "Aihua Liao",
    affiliation: "Huazhong University of Science and Technology",
    image: "aihua-liao.png",
  },
  {
    name: "Ramkumar Menon",
    affiliation: "Professor, University of Texas Medical Branch, Galveston",
    image: "ramkumar-menon.jpg",
    imagePosition: "center 40%",
  },
  {
    name: "Takeshi Nagamatsu",
    affiliation: "International University of Health and Welfare",
    image: null,
  },
  {
    name: "Joon Cheol Park",
    affiliation: "School of Medicine, Kyungpook National University",
    image: "joon-cheol-park.jpg",
    imagePosition: "center 25%",
  },
  {
    name: "Marie-Pierre Piccinni",
    affiliation: "Professor, University of Florence, Italy",
    image: null,
  },
  {
    name: "Trishia Sinha",
    affiliation:
      "Postdoctoral Researcher, University Medical Center Groningen, the Netherlands",
    image: null,
  },
  {
    name: "Anna Stanhewicz",
    affiliation: "Associate Professor, University of Iowa",
    image: "anna-stanhewicz.jpg",
    imagePosition: "center 0%",
  },
  {
    name: "Sayaka Tsuda",
    affiliation: "University of Toyama, Toyama, Japan",
    image: null,
  },
];

function getInitials(name) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
            <p className="text-gray-600">Speakers at ISIR 2026</p>
          </div>
        </div>
      </div>

      {/* Plenary Speakers - separate section */}
      <div className="mb-12">
        <h4
          className="text-xl font-semibold mb-2 flex items-center"
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Plenary Speakers
        </h4>
        <p className="text-gray-600 text-sm mb-6">
          Our distinguished plenary speakers will present keynotes at the
          congress.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plenarySpeakers.map((speaker, index) => (
            <div
              key={`plenary-${index}`}
              className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
              style={{ borderColor: "var(--color-primary)" }}
            >
              {speaker.image ? (
                <img
                  src={`/speakers/${speaker.image}`}
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
                className="text-lg font-bold mb-2 leading-tight"
                style={{ color: "var(--color-primary)" }}
              >
                {speaker.name}
              </h5>
              <p className="text-gray-600 text-sm leading-snug">
                {speaker.affiliation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Speakers */}
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
          {speakers.map((speaker, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow flex flex-col items-center text-center"
            >
              {speaker.image ? (
                <img
                  src={`/speakers/${speaker.image}`}
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
          ))}
        </div>
      </div>

      {/* Call for Abstracts */}
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
