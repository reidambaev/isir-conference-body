import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import headshots from "./assets/congress_chairs.png";
import logo from "./assets/logo.png";
import logo1 from "./assets/logo1.png";
import logo2 from "./assets/logo2.png";
import logo3 from "./assets/logo3.png";
import logo4 from "./assets/logo4.png";
import logo5 from "./assets/logo5.png";

// HEADER COMPONENT - Standalone branding header
const Header = () => (
  <header className="header-gradient text-white">
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
            <img
              src={logo}
              alt="ISIR Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              16th ISIR World Congress
            </h1>
            <p className="text-blue-200 text-sm md:text-base">
              International Society for Immunology of Reproduction
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div
            className="inline-flex items-center px-4 py-2 rounded-lg"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
            <svg
              className="w-5 h-5 mr-2"
              style={{ color: "var(--color-primary)" }}
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
            <span
              className="font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              September 10-13, 2026
            </span>
          </div>
          <p className="text-blue-200 mt-1 text-sm">Busan, South Korea</p>
        </div>
      </div>
    </div>
  </header>
);

// HERO SECTION - Visual banner with conference theme
const HeroSection = () => (
  <section className="hero-section relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/85 to-blue-800/75"></div>
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "url('https://cache.marriott.com/content/dam/marriott-renditions/PUSWI/puswi-view-detail-2081-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=1336px:*')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.25,
      }}
    ></div>
    <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
      <span
        className="inline-block px-4 py-1 mb-4 text-sm font-semibold rounded-full"
        style={{
          backgroundColor: "var(--color-secondary)",
          color: "var(--color-primary)",
        }}
      >
        16th ISIR World Congress
      </span>
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
        Global Dialogue on
        <br className="hidden md:block" /> Women's Health
      </h2>
      <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
        Join leading researchers and clinicians from around the world
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <a
          href="#registration"
          className="px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-primary)",
          }}
        >
          Register Now
        </a>
      </div>

      {/* Photo Gallery Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
          <img
            src="src/assets/busan_skyline.jpg"
            alt="Busan Skyline"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
          <img
            src="src/assets/beach.jpg"
            alt="Haeundae Beach"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
          <img
            src="src/assets/temple.jpg"
            alt="Korean Temple"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="aspect-video rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
          <img
            src="src/assets/conference.jpg"
            alt="Conference Center"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </section>
);

// QUICK STATS BAR
const StatsBar = () => (
  <div className="bg-gray-50 border-y border-gray-200">
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            40+
          </div>
          <div className="text-gray-600 text-sm">Scientific Sessions</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            500+
          </div>
          <div className="text-gray-600 text-sm">Expected Attendees</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            30+
          </div>
          <div className="text-gray-600 text-sm">Countries Represented</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            4
          </div>
          <div className="text-gray-600 text-sm">Days of Innovation</div>
        </div>
      </div>
    </div>
  </div>
);

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
      className="sticky top-0 z-50 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button text-base md:text-lg font-medium px-4 md:px-6 py-4 ${
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
      </div>
    </nav>
  );
};

// ABOUT TAB COMPONENT
const AboutTab = () => (
  <div role="tabpanel">
    {/* Congress Banner */}
    <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
      <img
        src="https://theisir.org/wp-content/uploads/2025/10/1.png"
        alt="16th ISIR World Congress - Save the Date - September 10-13, 2026 - Busan, Korea"
        className="w-full h-auto"
      />
    </div>

    <h3
      className="text-2xl font-bold text-blue-900 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Welcome to ISIR 2026 in Busan
    </h3>
    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
      You are cordially invited to the 16th Congress of the International
      Society for Immunology of Reproduction (ISIR) in the beautiful city of
      Busan, Korea. Join us from September 10-13, 2026, for a "Global Dialog on
      Population Balance and Women's Health through Reproductive Immunology." We
      look forward to welcoming leading researchers, clinicians, and industry
      partners to share the latest advancements in our field.
    </p>

    {/* Venue Photo Gallery */}
    <div className="mb-8">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        The Westin Josun Busan - Our Congress Venue
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://cache.marriott.com/content/dam/marriott-renditions/PUSWI/puswi-exterior-3080-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=1336px:*"
            alt="Luxury Hotel Exterior"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://cache.marriott.com/is/image/marriotts7prod/wi-puswi-ballroom-class-33158:Classic-Hor?wid=1336&fit=constrain"
              alt="Hotel Conference Room"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://cache.marriott.com/is/image/marriotts7prod/wi-puswi-swimming-pool-deck--15722:Classic-Hor?wid=1336&fit=constrain"
              alt="Hotel Outdoor Lounge Area"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
      <p className="text-gray-600 text-sm italic text-center">
        Experience world-class hospitality at The Westin Josun Busan,
        overlooking the stunning Haeundae Beach
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h4
          className="text-xl font-semibold text-blue-800 mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          About the Location
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

        {/* Location Map Placeholder */}
        <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md mb-4">
          <div className="aspect-video relative">
            <img
              src="src/assets/map.png"
              alt="Busan City Map View"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
              <div className="text-white">
                <p className="font-semibold text-lg">The Westin Josun Busan</p>
                <p className="text-sm opacity-90">
                  67 Dongbaek-ro, Haeundae-gu, Busan, South Korea
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
          <h4
            className="text-xl font-semibold text-blue-800 mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Important Dates
          </h4>
          <ul className="text-gray-700 space-y-3">
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-secondary)" }}
              ></span>
              <div>
                <strong>Abstract Submission Opens:</strong>
                <br />
                February 1, 2026
              </div>
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-secondary)" }}
              ></span>
              <div>
                <strong>Abstract Deadline:</strong>
                <br />
                April 30, 2026
              </div>
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-secondary)" }}
              ></span>
              <div>
                <strong>Early Bird Deadline:</strong>
                <br />
                July 10, 2026
              </div>
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-secondary)" }}
              ></span>
              <div>
                <strong>Registration Closes:</strong>
                <br />
                August 30, 2026
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h4
            className="text-lg font-semibold text-blue-800 mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Rep. Cooperation Directors
          </h4>
          <ul className="text-gray-700 space-y-2">
            <li className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  HC
                </span>
              </div>
              Hyejin Cho
            </li>
            <li className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  KH
                </span>
              </div>
              Kuksun Han
            </li>
            <li className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  NK
                </span>
              </div>
              Nayoung Kim
            </li>
            <li className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-primary)" }}
                >
                  AH
                </span>
              </div>
              Aera Han
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Congress Chairs Section */}
    <div className="mt-10">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Congress Leadership
      </h4>
      <img
        src={headshots}
        alt="Headshots of congress chairs"
        className="p-4 md:p-10 rounded-xl bg-white shadow-lg border"
      />
    </div>

    {/* Discover Busan Section */}
    <div className="mt-10">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Discover Beautiful Busan
      </h4>
      <p className="text-gray-700 mb-4">
        Busan, South Korea's second-largest city, offers a captivating blend of
        stunning beaches, vibrant markets, ancient temples, and modern
        attractions. Take time before or after the congress to explore this
        incredible destination.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1596345606939-b8c21a69ee25?w=400&q=80"
            alt="Haeundae Beach"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Haeundae Beach</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1578637387939-43c525550085?w=400&q=80"
            alt="Gamcheon Culture Village"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Gamcheon Village</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80"
            alt="Traditional Korean Temple"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Haedong Yonggungsa</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80"
            alt="Fresh Seafood Market"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Jagalchi Market</span>
          </div>
        </div>
      </div>
    </div>
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
    <p className="text-gray-700 mb-6">
      Our distinguished committee of world-renowned experts in reproductive
      immunology is dedicated to curating an exceptional scientific program that
      addresses the most pressing challenges and opportunities in our field.
    </p>

    {/* Congress Chairs Photo */}
    <div className="mb-8">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Congress Chairs
      </h4>
      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
        <img
          src={headshots}
          alt="Headshots of congress chairs"
          className="rounded-lg shadow-md"
        />
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mt-6 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Scientific Committee Members
    </h4>
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-gray-700 text-sm">
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
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-2 text-gray-700 text-sm">
        <p className="py-1">Kyung-Joo Hwang (Korea)</p>
        <p className="py-1">Jae Kwan Lee (Korea)</p>
        <p className="py-1">Ja Young Kwon (Korea)</p>
        <p className="py-1">Haeng Seok Song (Korea)</p>
        <p className="py-1">Joon Cheol Park (Korea)</p>
      </div>
    </div>

    {/* Past Congress Photos */}
    <div className="mt-10">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Memories from Past Congresses
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80"
            alt="Conference Presentation"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80"
            alt="Scientific Discussion"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&q=80"
            alt="Poster Session"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&q=80"
            alt="Networking Event"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  </div>
);

// SCHEDULE TAB COMPONENT (UPDATED)
const ScheduleTab = () => {
  const scheduleRef = useRef(null);

  const handleDownloadPNG = async () => {
    if (!scheduleRef.current) return;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(scheduleRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = "ISIR2026-Schedule.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to generate PNG:", error);
      alert("Failed to download PNG. Please try again.");
    }
  };

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
    { key: "day0", label: "THU Sept 10" },
    { key: "day1", label: "FRI Sept 11" },
    { key: "day2", label: "SAT Sept 12" },
    { key: "day3", label: "SUN Sept 13" },
    { key: "day4", label: "MON Sept 14" }, // Departure day
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
    borderCollapse: "separate",
    borderSpacing: "0",
    width: "100%",
    minWidth: "700px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    fontSize: "14px",
  };
  const thStyles = {
    padding: "12px 8px",
    textAlign: "center",
    backgroundColor: "#1a3a6c",
    fontWeight: "700",
    color: "white",
    width: "calc(100% / 6)",
    borderBottom: "2px solid #f3b72c",
  };
  const timeThStyles = {
    ...thStyles,
    textAlign: "left",
    padding: "12px 14px",
    fontWeight: "600",
    backgroundColor: "#0f2847",
    width: "110px",
    verticalAlign: "top",
    lineHeight: "1.3",
    fontSize: "13px",
  };
  const tdStyles = {
    border: "1px solid #e5e7eb",
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
    padding: "8px 4px",
    fontWeight: "500",
    lineHeight: "1.3",
    transition: "all 0.2s ease",
  };

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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Full Congress Schedule
            </h3>
            <p className="text-gray-600">
              September 10-14, 2026 • The Westin Josun Busan
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Container for PNG Export */}
      <div ref={scheduleRef} className="bg-white p-4 rounded-xl">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded mr-2"
              style={{
                backgroundColor: "#f1f5f9",
                borderLeft: "3px solid var(--color-primary)",
              }}
            ></div>
            <span className="text-sm text-gray-600">Plenary Sessions</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded mr-2"
              style={{
                backgroundColor: "#fff7ed",
                borderLeft: "3px solid #f3b72c",
              }}
            ></div>
            <span className="text-sm text-gray-600">Breakout Sessions</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded mr-2"
              style={{
                backgroundColor: "#f0fdfa",
                borderLeft: "3px solid #14b8a6",
              }}
            ></div>
            <span className="text-sm text-gray-600">Networking & Posters</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: "#e9f5ff" }}
            ></div>
            <span className="text-sm text-gray-600">Social Events</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl">
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
                <tr key={slot.time} className="hover:bg-gray-50/50">
                  {/* Time Column */}
                  <th
                    style={{
                      ...timeThStyles,
                      height: slot.className.split("-")[1] + "px",
                      background: "#f8fafc",
                      color: "var(--color-primary)",
                      borderRight: "2px solid #e5e7eb",
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
                          <div
                            style={combinedStyle}
                            className="hover:scale-[1.02] cursor-default"
                          >
                            {event.event}
                          </div>
                        ) : (
                          <div
                            style={{
                              ...combinedStyle,
                              backgroundColor: "#fafafa",
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

      {/* Download Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleDownloadPNG}
          className="inline-flex items-center px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Schedule (PNG)
        </button>
      </div>
    </div>
  );
};

// --- Registration Form UI Components ---
const FormSectionHeader = ({ children, icon }) => (
  <div
    className="p-4 border-b flex items-center"
    style={{
      background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
    }}
  >
    {icon && <span className="mr-2">{icon}</span>}
    <h4 className="text-lg font-bold text-white">{children}</h4>
  </div>
);

const FormLabel = ({ required, children, className = "" }) => (
  <label
    className={`block text-sm font-semibold text-gray-700 mb-1.5 ${className}`}
  >
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({
  name,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
  className = "",
  type = "text",
  ...props
}) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full border-2 border-gray-200 p-3 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 ${
      readOnly ? "bg-gray-50 cursor-not-allowed" : "bg-white"
    } ${className}`}
    required={required}
    {...props}
  />
);

const FormCheckbox = ({
  name,
  checked,
  onChange,
  label,
  required,
  subLabel,
}) => (
  <label className="flex items-start mb-3 cursor-pointer group">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-1 mr-3 h-5 w-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 transition-all"
    />
    <div className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
      {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
    </div>
  </label>
);

// Step Progress Indicator
const StepIndicator = ({ currentStep, totalSteps = 5 }) => {
  const steps = [
    { num: 1, label: "Verify" },
    { num: 2, label: "Tickets" },
    { num: 3, label: "Details" },
    { num: 4, label: "Payment" },
    { num: 5, label: "Confirm" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full -z-10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          />
        </div>

        {steps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col items-center relative z-10"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
                step.num < currentStep
                  ? "bg-green-500 text-white"
                  : step.num === currentStep
                  ? "text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
              style={
                step.num === currentStep
                  ? {
                      background:
                        "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                    }
                  : {}
              }
            >
              {step.num < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                step.num === currentStep ? "text-blue-800" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// REGISTRATION FORM COMPONENT - Multi-step registration process
const RegistrationForm = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Auto-detect early bird period (before July 10, 2026)
  const earlyBirdDeadline = new Date("2026-07-10");
  const currentDate = new Date();
  const isEarlyBirdPeriod = currentDate < earlyBirdDeadline;

  const [formData, setFormData] = useState({
    ticketType: "",
    accompanyingPersonCount: 0,
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    billingZip: "",
    salutation: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    institution: "",
    credentials: "",
    badgeName: "",
    pronouns: "",
    address1: "",
    address2: "",
    city: "",
    stateSelect: "",
    stateText: "",
    zip: "",
    country: "United States",
    phone: "",
    cellPhone: "",
    email: "",
    isPhysician: null,
    dietary: {
      vegan: false,
      vegetarian: false,
      glutenFree: false,
      kosher: false,
      other: false,
    },
    specialAssistance: false,
    policyAgreed: false,
    privacyMarketing: false,
    privacyApp: false,
    optOutMailing: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("dietary_")) {
      const key = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        dietary: { ...prev.dietary, [key]: checked },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert("Please enter Name and Email to verify.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep(2);
    }, 1000);
  };

  const handleTicketSelection = (e) => {
    e.preventDefault();
    if (!formData.ticketType) {
      alert("Please select a ticket type.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.policyAgreed) {
      alert("You must agree to the ISIR Event Policies to proceed.");
      return;
    }
    console.log("Registration Info:", formData);
    setStep(4);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      console.log("Payment Successful:", formData);
      setStep(5);
    }, 2000);
  };

  const fillExampleData = () => {
    setFormData({
      ...formData,
      salutation: "Dr.",
      firstName: "Jane",
      middleName: "Marie",
      lastName: "Smith",
      suffix: "MD",
      institution: "University Medical Center",
      credentials: "MD, PhD",
      badgeName: "Dr. Jane Smith",
      pronouns: "she/her",
      address1: "123 Medical Plaza",
      address2: "Suite 456",
      city: "Boston",
      stateSelect: "MA",
      stateText: "",
      zip: "02115",
      country: "United States",
      phone: "(617) 555-0100",
      cellPhone: "(617) 555-0101",
      isPhysician: "physician",
      dietary: {
        vegan: false,
        vegetarian: true,
        glutenFree: false,
        kosher: false,
        other: false,
      },
      policyAgreed: true,
      privacyMarketing: true,
      privacyApp: true,
    });
  };

  const ticketPrices = {
    "isir-member": { early: 350, standard: 450, label: "ISIR Member" },
    "non-member": { early: 650, standard: 750, label: "Non-Member" },
    "trainee-member": {
      early: 150,
      standard: 200,
      label: "Trainee / Student Member",
    },
    "trainee-non-member": {
      early: 250,
      standard: 300,
      label: "Trainee / Student Non-Member",
    },
  };

  const getTicketPrice = (type) => {
    if (!type || !ticketPrices[type]) return 0;
    return isEarlyBirdPeriod
      ? ticketPrices[type].early
      : ticketPrices[type].standard;
  };

  const getAccompanyingPrice = () => (isEarlyBirdPeriod ? 250 : 350);

  const getTotalPrice = () => {
    const ticketPrice = getTicketPrice(formData.ticketType);
    const accompanyingPrice =
      getAccompanyingPrice() * formData.accompanyingPersonCount;
    return ticketPrice + accompanyingPrice;
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {step === 1 && "Attendee Verification"}
              {step === 2 && "Select Your Tickets"}
              {step === 3 && "Registration Details"}
              {step === 4 && "Secure Payment"}
              {step === 5 && "Registration Complete!"}
            </h3>
            <p className="text-gray-600">ISIR 2026 World Congress</p>
          </div>
        </div>
        {step !== 5 && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancel Registration"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Step Progress */}
      <StepIndicator currentStep={step} />

      {/* STEP 1: VERIFICATION */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <FormSectionHeader
            icon={
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          >
            Verify Your Information
          </FormSectionHeader>
          <div className="p-8">
            <p className="text-gray-600 mb-6 pb-6 border-b border-gray-200">
              Please provide your name and email address to verify your account
              or eligibility before continuing to the registration form.
            </p>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: "Jane",
                    lastName: "Smith",
                    email: "jane.smith@example.com",
                  }))
                }
                className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                🔧 Fill Example
              </button>
            </div>
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <FormLabel required>First Name</FormLabel>
                <FormInput
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <FormLabel required>Last Name</FormLabel>
                <FormInput
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <FormLabel required>Email Address</FormLabel>
                <FormInput
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full font-bold py-4 px-6 rounded-xl mt-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg text-white"
                style={{
                  background: isVerifying
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue →"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: TICKET SELECTION */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <FormSectionHeader
            icon={
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            }
          >
            Select Your Tickets
          </FormSectionHeader>
          <div className="p-8">
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    ticketType: "isir-member",
                    accompanyingPersonCount: 1,
                  }))
                }
                className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                🔧 Fill Example
              </button>
            </div>

            {/* Early Bird Status */}
            <div
              className={`${
                isEarlyBirdPeriod
                  ? "bg-green-50 border-green-300"
                  : "bg-amber-50 border-amber-300"
              } border-2 rounded-xl p-5 mb-8`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isEarlyBirdPeriod ? "bg-green-500" : "bg-amber-500"
                  }`}
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {isEarlyBirdPeriod
                      ? "🎉 Early Bird Pricing Available!"
                      : "Early Bird Pricing Has Ended"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isEarlyBirdPeriod
                      ? "Register by July 10, 2026 to get early bird rates."
                      : "Standard pricing applies (Early bird ended July 10, 2026)."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleTicketSelection} className="space-y-8">
              {/* Ticket Type Selection */}
              <div>
                <FormLabel required className="!text-base mb-4">
                  Select Your Ticket Type
                </FormLabel>
                <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                  {/* Table Header */}
                  <div
                    className="grid grid-cols-3 border-b-2 border-gray-200 items-center"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <div className="p-4 font-bold text-sm text-white">
                      CATEGORY
                    </div>
                    <div className="p-4 font-bold text-sm text-white text-center flex flex-col items-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs mb-1"
                        style={{
                          backgroundColor: "var(--color-secondary)",
                          color: "var(--color-primary)",
                        }}
                      >
                        SAVE!
                      </span>
                      EARLY BIRD
                    </div>
                    <div className="p-4 font-bold text-sm text-white text-center">
                      STANDARD
                    </div>
                  </div>
                  {Object.entries(ticketPrices).map(
                    ([value, { early, standard, label }], index) => (
                      <label
                        key={value}
                        className={`grid grid-cols-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                          formData.ticketType === value
                            ? "bg-blue-100 ring-2 ring-blue-500 ring-inset"
                            : ""
                        } ${
                          index !== Object.keys(ticketPrices).length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <div className="p-5 flex items-center gap-3">
                          <input
                            type="radio"
                            name="ticketType"
                            value={value}
                            checked={formData.ticketType === value}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="font-semibold text-gray-800">
                            {label}
                          </span>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span
                            className="text-xl font-bold"
                            style={{ color: "var(--color-primary)" }}
                          >
                            ${early}
                          </span>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-500">
                            ${standard}
                          </span>
                        </div>
                      </label>
                    )
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  *Trainee/Student rate requires proof of status.
                </p>
              </div>

              {/* Accompanying Person Tickets */}
              <div className="border-t-2 border-gray-100 pt-8">
                <FormLabel className="!text-base mb-3">
                  Accompanying Person Tickets
                </FormLabel>
                <p className="text-sm text-gray-600 mb-5">
                  Accompanying person fee includes Welcome Reception and Gala
                  Dinner.
                </p>

                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Accompanying Person
                      </p>
                      <p className="text-sm text-gray-600">
                        ${getAccompanyingPrice()} each (
                        {isEarlyBirdPeriod ? "Early Bird" : "Standard"})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            accompanyingPersonCount: Math.max(
                              0,
                              prev.accompanyingPersonCount - 1
                            ),
                          }))
                        }
                        className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                      >
                        −
                      </button>
                      <span
                        className="w-14 text-center font-bold text-2xl"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {formData.accompanyingPersonCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            accompanyingPersonCount: Math.min(
                              10,
                              prev.accompanyingPersonCount + 1
                            ),
                          }))
                        }
                        className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div
                className="rounded-2xl p-6 shadow-lg text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">TOTAL:</span>
                  <span className="text-4xl font-bold">${getTotalPrice()}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                  }}
                >
                  Continue to Registration →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: REGISTRATION FORM */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSubmit}>
            <FormSectionHeader
              icon={
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              Enter Registrant Details
            </FormSectionHeader>
            <div className="p-8">
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={fillExampleData}
                  className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  🔧 Fill Example Data
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <FormLabel>Salutation</FormLabel>
                  <FormInput
                    name="salutation"
                    value={formData.salutation}
                    onChange={handleChange}
                    placeholder="Dr., Mr., Ms., etc."
                  />
                </div>
                <div>
                  <FormLabel>Suffix</FormLabel>
                  <FormInput
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                    placeholder="MD, PhD, etc."
                  />
                </div>
                <div>
                  <FormLabel required>First Name</FormLabel>
                  <FormInput
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel>Middle Name</FormLabel>
                  <FormInput
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <FormLabel required>Last Name</FormLabel>
                  <FormInput
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel required>Institution</FormLabel>
                  <FormInput
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel>Credentials</FormLabel>
                  <FormInput
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleChange}
                    placeholder="MD, PhD, etc."
                  />
                </div>
                <div>
                  <FormLabel>Badge Name</FormLabel>
                  <FormInput
                    name="badgeName"
                    value={formData.badgeName}
                    onChange={handleChange}
                    placeholder="Name to display on badge"
                  />
                </div>
                <div>
                  <FormLabel>Pronouns</FormLabel>
                  <select
                    name="pronouns"
                    value={formData.pronouns}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">Please select...</option>
                    <option value="he/him">he/him</option>
                    <option value="she/her">she/her</option>
                    <option value="they/them">they/them</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-gray-100 my-8"></div>

              <h5 className="font-bold text-gray-800 mb-5 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Address Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="md:col-span-2">
                  <FormLabel required>Address Line 1</FormLabel>
                  <FormInput
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <FormLabel>Address Line 2</FormLabel>
                  <FormInput
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <FormLabel required>City</FormLabel>
                  <FormInput
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel required>State/Province</FormLabel>
                  <div className="flex gap-2">
                    <select
                      name="stateSelect"
                      value={formData.stateSelect}
                      onChange={handleChange}
                      className="border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="CA">CA</option>
                      <option value="IL">IL</option>
                      <option value="MA">MA</option>
                      <option value="NY">NY</option>
                      <option value="TX">TX</option>
                    </select>
                    <span className="flex items-center text-gray-400 font-medium">
                      or
                    </span>
                    <FormInput
                      name="stateText"
                      value={formData.stateText}
                      onChange={handleChange}
                      placeholder="Type state..."
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <FormLabel required>Zip/Postal Code</FormLabel>
                  <FormInput
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel required>Country</FormLabel>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-gray-100 my-8"></div>

              <h5 className="font-bold text-gray-800 mb-5 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Contact Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <FormLabel>Phone</FormLabel>
                  <FormInput
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                  />
                </div>
                <div>
                  <FormLabel required>Cell Phone</FormLabel>
                  <FormInput
                    name="cellPhone"
                    value={formData.cellPhone}
                    onChange={handleChange}
                    required
                    type="tel"
                  />
                </div>
                <div className="md:col-span-2">
                  <FormLabel required>Email</FormLabel>
                  <FormInput
                    name="email"
                    value={formData.email}
                    readOnly
                    className="!bg-gray-100"
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-100 my-8"></div>

              {/* Physician Radio */}
              <div className="mb-6">
                <FormLabel required>Are you a physician?</FormLabel>
                <div className="flex gap-6 mt-3">
                  {["physician", "non-physician"].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="isPhysician"
                        value={opt}
                        checked={formData.isPhysician === opt}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {opt.replace("-", "-")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div className="mb-6">
                <FormLabel>Dietary Restrictions</FormLabel>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    "Vegan",
                    "Vegetarian",
                    "Gluten free",
                    "Kosher",
                    "Other",
                  ].map((diet) => (
                    <label
                      key={diet}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        name={`dietary_${diet.toLowerCase().replace(" ", "")}`}
                        onChange={handleChange}
                        className="w-4 h-4"
                      />
                      {diet}
                    </label>
                  ))}
                </div>
              </div>

              {/* Policies Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-200 mt-8">
                <h5 className="font-bold text-gray-800 mb-4">
                  ISIR Event Policies
                </h5>
                <FormCheckbox
                  name="policyAgreed"
                  checked={formData.policyAgreed}
                  onChange={handleChange}
                  required
                  label={
                    <span>
                      I have reviewed and agree to the{" "}
                      <a
                        href="#"
                        className="text-blue-600 underline font-semibold hover:text-blue-800"
                      >
                        ISIR Event Policies
                      </a>
                    </span>
                  }
                />
                <FormCheckbox
                  name="privacyMarketing"
                  checked={formData.privacyMarketing}
                  onChange={handleChange}
                  label="I agree to share my contact information with ISIR for marketing and promotions."
                />
                <FormCheckbox
                  name="privacyApp"
                  checked={formData.privacyApp}
                  onChange={handleChange}
                  label="I would like to appear on the 2026 attendee list on the event website and app."
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between p-6 bg-gray-50 border-t-2 border-gray-200">
              <button
                type="button"
                className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                onClick={() => setStep(2)}
              >
                ← Back to Tickets
              </button>
              <button
                type="submit"
                className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                Continue to Payment →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {step === 4 && (
        <div className="animate-in slide-in-from-right duration-300 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <FormSectionHeader
              icon={
                <svg
                  className="w-5 h-5 text-white"
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
              }
            >
              Order Summary
            </FormSectionHeader>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-base py-3 border-b border-gray-200">
                  <span className="text-gray-700">
                    {ticketPrices[formData.ticketType]?.label}{" "}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isEarlyBirdPeriod
                          ? "#dcfce7"
                          : "#fef3c7",
                        color: isEarlyBirdPeriod ? "#166534" : "#92400e",
                      }}
                    >
                      {isEarlyBirdPeriod ? "Early Bird" : "Standard"}
                    </span>
                  </span>
                  <span className="font-bold text-lg">
                    ${getTicketPrice(formData.ticketType)}
                  </span>
                </div>
                {formData.accompanyingPersonCount > 0 && (
                  <div className="flex justify-between text-base py-3 border-b border-gray-200">
                    <span className="text-gray-700">
                      Accompanying Person × {formData.accompanyingPersonCount}
                    </span>
                    <span className="font-bold text-lg">
                      $
                      {getAccompanyingPrice() *
                        formData.accompanyingPersonCount}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-4 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">
                      TOTAL
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ${getTotalPrice()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <form onSubmit={handlePayment}>
              <FormSectionHeader
                icon={
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                }
              >
                Payment Information
              </FormSectionHeader>
              <div className="p-8">
                <div className="mb-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        cardNumber: "4532 1234 5678 9010",
                        cardName: "Jane Smith",
                        expiryMonth: "12",
                        expiryYear: "2028",
                        cvv: "123",
                        billingZip: "02115",
                      }))
                    }
                    className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    🔧 Fill Example
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <FormLabel required>Card Number</FormLabel>
                    <FormInput
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\s/g, "")
                          .replace(/\D/g, "");
                        const formatted =
                          value.match(/.{1,4}/g)?.join(" ") || value;
                        setFormData((prev) => ({
                          ...prev,
                          cardNumber: formatted,
                        }));
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>

                  <div>
                    <FormLabel required>Cardholder Name</FormLabel>
                    <FormInput
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      placeholder="Name as it appears on card"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FormLabel required>Exp. Month</FormLabel>
                      <select
                        name="expiryMonth"
                        value={formData.expiryMonth}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = String(i + 1).padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <FormLabel required>Exp. Year</FormLabel>
                      <select
                        name="expiryYear"
                        value={formData.expiryYear}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        required
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <FormLabel required>CVV</FormLabel>
                      <FormInput
                        name="cvv"
                        value={formData.cvv}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          setFormData((prev) => ({ ...prev, cvv: value }));
                        }}
                        placeholder="123"
                        maxLength="4"
                        type="password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel required>Billing Zip Code</FormLabel>
                    <div className="w-full md:w-48">
                      <FormInput
                        name="billingZip"
                        value={formData.billingZip}
                        onChange={handleChange}
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Secure Payment</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your payment information is encrypted and secure. We
                        accept Visa, MasterCard, American Express, and Discover.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8 mt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                    onClick={() => setStep(3)}
                  >
                    ← Back to Registration
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    style={{
                      background: isProcessingPayment
                        ? "#9ca3af"
                        : "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                    }}
                  >
                    {isProcessingPayment ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Complete Payment →"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRMATION */}
      {step === 5 && (
        <div className="animate-in fade-in zoom-in duration-500">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-10 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">
                Registration Successful!
              </h3>
              <p className="text-green-100 text-lg">
                Thank you for registering for the ISIR 2026 World Congress
              </p>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 space-y-5">
                <h4 className="font-bold text-xl text-gray-800 border-b-2 border-gray-200 pb-3">
                  Registration Summary
                </h4>

                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Attendee
                  </p>
                  <p className="text-gray-800 font-medium text-lg">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-gray-600">{formData.email}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-500 mb-3">
                    Ticket Details
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {ticketPrices[formData.ticketType]?.label}{" "}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isEarlyBirdPeriod
                              ? "#dcfce7"
                              : "#fef3c7",
                            color: isEarlyBirdPeriod ? "#166534" : "#92400e",
                          }}
                        >
                          {isEarlyBirdPeriod ? "Early Bird" : "Standard"}
                        </span>
                      </span>
                      <span className="font-bold">
                        ${getTicketPrice(formData.ticketType)}
                      </span>
                    </div>
                    {formData.accompanyingPersonCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Accompanying Person ×{" "}
                          {formData.accompanyingPersonCount}
                        </span>
                        <span className="font-bold">
                          $
                          {getAccompanyingPrice() *
                            formData.accompanyingPersonCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">
                      Total Amount Paid
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      ${getTotalPrice()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <p className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
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
                  Next Steps
                </p>
                <ul className="text-gray-700 space-y-3 ml-7 list-disc">
                  <li>
                    A confirmation email has been sent to{" "}
                    <strong>{formData.email}</strong>
                  </li>
                  <li>Your payment has been processed successfully</li>
                  <li>Your registration is now confirmed</li>
                  <li>You will receive additional event details via email</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button
                  type="button"
                  className="px-8 py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                  }}
                  onClick={() => window.print()}
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Confirmation
                </button>
                <button
                  type="button"
                  className="px-8 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold transition-all text-base"
                  onClick={onClose}
                >
                  Return to Registration Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// REGISTRATION TAB COMPONENT (UPDATED)
const RegistrationTab = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  if (showRegistrationForm) {
    return <RegistrationForm onClose={() => setShowRegistrationForm(false)} />;
  }

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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Registration & Abstract Submission
            </h3>
            <p className="text-gray-600">Secure your spot at ISIR 2026</p>
          </div>
        </div>
      </div>

      {/* Early Bird Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
              style={{ backgroundColor: "var(--color-secondary)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "var(--color-primary)" }}
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
                Early Bird Discount!
              </h4>
              <p className="text-gray-700">
                Register by <strong>July 10, 2026</strong> and save up to{" "}
                <strong>$100</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
          >
            Register Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Registration Fees Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="p-4 border-b"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              <h4 className="text-lg font-bold text-white flex items-center">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Registration Fees
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs mb-1"
                          style={{
                            backgroundColor: "var(--color-secondary)",
                            color: "var(--color-primary)",
                          }}
                        >
                          SAVE!
                        </span>
                        Early Bird
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Standard
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      ISIR Member
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        $350
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      $450
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Non-Member
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        $650
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      $750
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Trainee / Student Member
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        $150
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      $200
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Trainee / Student Non-Member
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        $250
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      $300
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      Accompanying Person
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        $250
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      $350
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <p className="text-xs text-gray-500 italic">
                *Trainee/Student rate requires proof of status. Accompanying
                person fee includes Welcome Reception and Gala Dinner only.
              </p>
            </div>
          </div>

          {/* What's Included Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
            <h4
              className="text-lg font-bold mb-4"
              style={{ color: "var(--color-primary)" }}
            >
              What's Included
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                "All Scientific Sessions",
                "Welcome Reception",
                "Daily Coffee Breaks",
                "Poster Sessions",
                "Gala Dinner",
                "Congress Materials",
                "Certificate of Attendance",
                "Networking Events",
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Abstract Requirements Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="p-4 border-b"
              style={{
                background: "linear-gradient(135deg, #f3b72c 0%, #f59e0b 100%)",
              }}
            >
              <h4
                className="text-lg font-bold flex items-center"
                style={{ color: "var(--color-primary)" }}
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
                Abstract Format Requirements
              </h4>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Title", value: "Max 150 characters, bold" },
                {
                  label: "Authors",
                  value: "List all authors and affiliations",
                },
                { label: "Body", value: "Max 300 words" },
                {
                  label: "Structure",
                  value: "Objectives, Methods, Results, Conclusions",
                },
                { label: "Keywords", value: "3-5 keywords" },
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="w-24 text-sm font-semibold text-gray-500 flex-shrink-0">
                    {item.label}
                  </span>
                  <span className="text-sm text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Steps To Register */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div
              className="p-4 border-b"
              style={{
                background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
              }}
            >
              <h4 className="text-lg font-bold text-white flex items-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Steps To Register
              </h4>
            </div>
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="flex items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-4 shadow-md"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 mb-1">
                    Create an Account
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    Choose either ISIR Member or Non-Member account. Members
                    receive discounted registration rates.
                  </p>
                  <a
                    href="https://theisir.org/membership-account/membership-levels/"
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Create Account
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-gray-200 ml-6 h-4"></div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-4 shadow-md"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 mb-1">
                    Register for the Event
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    Complete your congress registration and select your
                    category. Early bird rates available until July 10, 2026.
                  </p>
                  <button
                    onClick={() => setShowRegistrationForm(true)}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Register Now
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-gray-200 ml-6 h-4"></div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-4 shadow-md"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-900 mb-1">
                    Submit an Abstract{" "}
                    <span className="text-xs font-normal text-gray-500">
                      (Optional)
                    </span>
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    If you wish to present your research, submit an abstract by
                    April 30, 2026. Not required for attendance.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Submit Abstract (Opens Feb 1)
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Presentation Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 border border-blue-100 hover:shadow-lg transition-shadow">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h5 className="font-bold text-gray-900 mb-2">
                Oral Presentations
              </h5>
              <p className="text-sm text-gray-600">
                Selected authors will be invited for a <strong>9-minute</strong>{" "}
                oral presentation followed by a <strong>2-minute</strong> Q&A
                session.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 hover:shadow-lg transition-shadow">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: "var(--color-secondary)" }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: "var(--color-primary)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
              <h5 className="font-bold text-gray-900 mb-2">
                Poster Presentations
              </h5>
              <p className="text-sm text-gray-600">
                Posters displayed in the exhibit hall. Dimensions:{" "}
                <strong>90cm wide × 120cm high</strong> (portrait orientation).
              </p>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-bold text-red-800">
                  Presenting Author Requirements
                </h4>
                <p className="mt-1 text-sm text-red-700">
                  The presenting author of an accepted abstract must register by
                  the early bird deadline (July 10, 2026). Failure to register
                  will result in the abstract being withdrawn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action - Register Now */}
      <div className="mt-10 bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-center shadow-xl">
        <h4 className="text-2xl font-bold text-white mb-3">
          Ready to Register?
        </h4>
        <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
          Join leading researchers and clinicians from around the world at the
          16th ISIR World Congress in beautiful Busan, South Korea.
        </p>
        <button
          onClick={() => setShowRegistrationForm(true)}
          className="inline-flex items-center px-10 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          style={{
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-primary)",
          }}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Start Registration Now
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              Important Dates & Deadlines
            </h3>
            <p className="text-gray-600">
              Mark your calendar for these key milestones
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 rounded-full hidden md:block"></div>

        <div className="space-y-6">
          {processedDeadlines.map((item, index) => {
            const [month, day] = item.date.split(" ");

            const isClosest = closestIndex === index;
            const isPast = item.isPast;

            // The "Housing" deadline's isUrgent flag is respected *unless*
            // another item is closer. The closest non-past item is *always* urgent.
            const isUrgent = (item.isUrgent && !isPast) || isClosest;

            // Icon based on status
            const getIcon = () => {
              if (isPast) {
                return (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              } else if (isUrgent) {
                return (
                  <svg
                    className="w-5 h-5 text-red-500 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              } else {
                return (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              }
            };

            return (
              <div
                key={item.title + index}
                className={`relative flex items-stretch transition-all duration-300 ${
                  isPast ? "opacity-70" : "hover:-translate-y-1"
                }`}
              >
                {/* Timeline Node */}
                <div className="hidden md:flex flex-col items-center mr-6">
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg ${
                      isPast
                        ? "bg-gray-100 text-gray-400"
                        : isUrgent
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {month}
                    </span>
                    <span className="text-2xl font-black">{day}</span>
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-2xl shadow-lg overflow-hidden ${
                    isPast
                      ? "bg-gray-50 border border-gray-200"
                      : isUrgent
                      ? "bg-gradient-to-r from-red-50 to-white border-2 border-red-300 ring-4 ring-red-100"
                      : "bg-white border border-gray-200 hover:shadow-xl"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Mobile Date Badge */}
                        <div className="md:hidden mb-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              isPast
                                ? "bg-gray-200 text-gray-500"
                                : isUrgent
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {month} {day}
                          </span>
                        </div>

                        <div className="flex items-center mb-2">
                          {getIcon()}
                          <h4
                            className={`ml-2 text-lg font-bold ${
                              isPast
                                ? "text-gray-500 line-through"
                                : isUrgent
                                ? "text-red-800"
                                : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </h4>
                        </div>
                        <p
                          className={`${
                            isPast
                              ? "text-gray-400 line-through"
                              : "text-gray-600"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="hidden sm:block ml-4">
                        {isPast ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Completed
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Coming Up!
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for upcoming urgent items */}
                  {isUrgent && !isPast && (
                    <div className="h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-400 animate-pulse"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add to Calendar CTA */}
      <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-center">
        <h4 className="text-xl font-bold text-white mb-2">
          Never Miss a Deadline
        </h4>
        <p className="text-blue-200 mb-4">
          Add all important dates to your calendar
        </p>
        <button
          className="inline-flex items-center px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Add to Calendar
        </button>
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

    {/* Hotel Hero Section */}
    <div className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
            alt="The Westin Josun Busan"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <span
            className="inline-block px-3 py-1 text-sm font-semibold rounded-full mb-3 w-fit"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Official Conference Hotel
          </span>
          <h4
            className="text-xl font-semibold text-blue-800 mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            The Westin Josun Busan
          </h4>
          <p className="text-gray-700 mb-4">
            Experience world-class hospitality at The Westin Josun Busan,
            overlooking Haeundae Beach. We have secured a block of rooms at a
            discounted rate. Rates are available on a first-come, first-served
            basis and must be booked by August 10, 2026. Book early, as rooms
            will sell out!
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#"
              className="inline-block px-6 py-3 font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              style={{
                backgroundColor: "var(--color-secondary)",
                color: "var(--color-primary)",
              }}
            >
              Book Hotel Now
            </a>
            <a
              href="#"
              className="inline-block px-6 py-3 font-semibold rounded-lg border-2 hover:bg-gray-50 transition-all duration-300"
              style={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
              }}
            >
              View Room Options
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Hotel Amenities */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      {[
        { icon: "🏖️", label: "Beachfront Location" },
        { icon: "🍽️", label: "Fine Dining" },
        { icon: "💆", label: "Spa & Wellness" },
        { icon: "🏊", label: "Indoor Pool" },
        { icon: "🏋️", label: "Fitness Center" },
        { icon: "📶", label: "High-Speed WiFi" },
        { icon: "🚗", label: "Valet Parking" },
        { icon: "🛎️", label: "Concierge Service" },
      ].map((amenity, index) => (
        <div
          key={index}
          className="flex items-center p-4 bg-gray-50 rounded-xl"
        >
          <span className="text-2xl mr-3">{amenity.icon}</span>
          <span className="text-sm font-medium text-gray-700">
            {amenity.label}
          </span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      {/* Getting to Busan */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
        <h4
          className="text-xl font-semibold text-blue-800 mb-4 flex items-center"
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Getting to Busan
        </h4>
        <div className="space-y-4">
          <div className="flex items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="text-white text-sm">✈️</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">By Air - Direct</p>
              <p className="text-gray-600 text-sm">
                Fly into <strong>Gimhae International Airport (PUS)</strong>,
                serving destinations across Asia.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="text-white text-sm">🚄</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Via Seoul</p>
              <p className="text-gray-600 text-sm">
                Fly into <strong>Incheon Airport (ICN)</strong> and take the KTX
                high-speed train (2.5-3 hours).
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <span className="text-white text-sm">🚕</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800">From PUS to Hotel</p>
              <p className="text-gray-600 text-sm">
                Taxi or airport limousine bus to Haeundae (45-60 minutes).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visa Information */}
      <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl border border-yellow-200">
        <h4
          className="text-xl font-semibold text-blue-800 mb-4 flex items-center"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Visa Information
        </h4>
        <p className="text-gray-700 mb-4">
          International attendees may require a visa to enter Korea. We
          recommend checking with your local Korean embassy or consulate for the
          latest requirements.
        </p>
        <div className="bg-white p-4 rounded-lg border border-yellow-300 mb-4">
          <p className="text-sm text-gray-600">
            <strong>Need an invitation letter?</strong> Once registered and
            paid, you may request an official Letter of Invitation to support
            your visa application.
          </p>
        </div>
        <a
          href="#"
          className="inline-block px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Request Visa Letter
        </a>
      </div>
    </div>

    <hr className="my-8" />

    {/* Explore Busan Section */}
    <div>
      <h4
        className="text-xl font-semibold text-blue-800 mb-2"
        style={{ color: "var(--color-primary)" }}
      >
        Explore Beautiful Busan
      </h4>
      <p className="text-gray-600 mb-6">
        Extend your stay and discover why Busan is one of Asia's most exciting
        destinations. From stunning beaches to vibrant markets and ancient
        temples, there's something for everyone.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="aspect-video overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1596345606939-b8c21a69ee25?w=400&q=80"
              alt="Haeundae Beach"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="p-5">
            <h5
              className="font-semibold text-lg mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              Haeundae Beach
            </h5>
            <p className="text-sm text-gray-600">
              Korea's most famous beach, just steps from the conference venue.
              Perfect for morning walks or evening strolls along the coastline.
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="aspect-video overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1578637387939-43c525550085?w=400&q=80"
              alt="Gamcheon Culture Village"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="p-5">
            <h5
              className="font-semibold text-lg mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              Gamcheon Culture Village
            </h5>
            <p className="text-sm text-gray-600">
              Explore the colorful "Machu Picchu of Busan" with its vibrant
              street art, quirky galleries, and charming cafes.
            </p>
          </div>
        </div>
        <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          <div className="aspect-video overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80"
              alt="Jagalchi Market"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="p-5">
            <h5
              className="font-semibold text-lg mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              Jagalchi Fish Market
            </h5>
            <p className="text-sm text-gray-600">
              Experience Korea's largest seafood market. Choose your catch and
              have it prepared fresh at one of the many on-site restaurants.
            </p>
          </div>
        </div>
      </div>

      {/* Additional attractions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=300&q=80"
            alt="Haedong Yonggungsa Temple"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-sm">
              Haedong Yonggungsa
            </span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300&q=80"
            alt="Busan Tower"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-sm">
              Busan Tower
            </span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=80"
            alt="Gwangalli Beach"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-sm">
              Gwangalli Beach
            </span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&q=80"
            alt="Korean Cuisine"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-sm">
              Local Cuisine
            </span>
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

    {/* Sponsorship Tiers */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-400 shadow-lg">
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 bg-yellow-400 text-yellow-900 font-bold rounded-full text-sm">
            PLATINUM
          </span>
        </div>
        <div className="aspect-video bg-white rounded-lg flex items-center justify-center mb-4 shadow-inner">
          <span className="text-gray-400 text-sm">Your Logo Here</span>
        </div>
        <p className="text-center text-gray-700 text-sm">
          Premium visibility and exclusive benefits
        </p>
      </div>

      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-xl border-2 border-gray-400 shadow-lg">
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 bg-gray-400 text-white font-bold rounded-full text-sm">
            GOLD
          </span>
        </div>
        <div className="aspect-video bg-white rounded-lg flex items-center justify-center mb-4 shadow-inner">
          <span className="text-gray-400 text-sm">Your Logo Here</span>
        </div>
        <p className="text-center text-gray-700 text-sm">
          Enhanced exposure and networking opportunities
        </p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-300 shadow-lg">
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 bg-orange-400 text-white font-bold rounded-full text-sm">
            BRONZE
          </span>
        </div>
        <div className="aspect-video bg-white rounded-lg flex items-center justify-center mb-4 shadow-inner">
          <span className="text-gray-400 text-sm">Your Logo Here</span>
        </div>
        <p className="text-center text-gray-700 text-sm">
          Valuable brand presence and recognition
        </p>
      </div>
    </div>

    <h4
      className="text-xl font-semibold text-blue-800 mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Supported By
    </h4>
    {/* Row 1: Logos 1, 2, 3 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {[
        { name: "Korean Society for Reproductive Medicine", logo: logo1, size: 'w-48 h-16' },
        { name: "Korean Society for Reproductive Immunology", logo: logo2, size: 'w-28 h-28' },
        { name: "Korean Society of Gynecologic Oncology", logo: logo3, size: 'w-48 h-16' },
      ].map((org, index) => (
        <div
          key={index}
          className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className={`${org.size} rounded-lg flex items-center justify-center mr-4 flex-shrink-0 bg-white border border-gray-100 p-1 overflow-hidden`}>
            <img
              src={org.logo}
              alt={org.name}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-gray-700 font-medium">{org.name}</span>
        </div>
      ))}
    </div>
    {/* Row 2: Logos 4, 5 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {[
        { name: "Korean Society of Ultrasound in Obstetrics and Gynecology", logo: logo4, size: 'w-64 h-24' },
        { name: "Korean College of Obstetrics and Gynecology", logo: logo5, size: 'w-64 h-24' },
      ].map((org, index) => (
        <div
          key={index}
          className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className={`${org.size} rounded-lg flex items-center justify-center mr-4 flex-shrink-0 bg-white border border-gray-100 p-1 overflow-hidden`}>
            <img
              src={org.logo}
              alt={org.name}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-gray-700 font-medium">{org.name}</span>
        </div>
      ))}
    </div>

    {/* Exhibit Hall Preview */}
    <div className="mt-10">
      <h4
        className="text-xl font-semibold text-blue-800 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Exhibit Hall
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"
            alt="Exhibition Hall"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h5 className="text-lg font-semibold text-gray-800 mb-3">
            Join Our Exhibition
          </h5>
          <p className="text-gray-700 mb-4">
            Showcase your products and services to over 500 researchers,
            clinicians, and industry professionals from around the world. Our
            exhibit hall offers prime visibility during all coffee breaks and
            poster sessions.
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Premium booth locations available
            </li>
            <li className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Complimentary exhibitor registrations
            </li>
            <li className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Logo placement in congress materials
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="mt-10 bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-8 text-center text-white">
      <h4 className="text-2xl font-bold mb-3">Become a Sponsor</h4>
      <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
        Partner with ISIR 2026 and gain unparalleled exposure to the global
        reproductive immunology community. Multiple sponsorship packages
        available to fit your goals.
      </p>
      <a
        href="mailto:sponsors@isir2026.org"
        className="inline-block px-8 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        style={{
          backgroundColor: "var(--color-secondary)",
          color: "var(--color-primary)",
        }}
      >
        Contact Us for Sponsorship
      </a>
    </div>
  </div>
);

// FOOTER COMPONENT - Comprehensive standalone footer
const Footer = () => (
  <footer className="bg-gray-900 text-white">
    {/* Main Footer Content */}
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* About ISIR */}
        <div>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3">
              <span
                className="text-lg font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                ISIR
              </span>
            </div>
            <div>
              <h4 className="font-bold text-lg">ISIR 2026</h4>
              <p className="text-gray-400 text-sm">Busan, Korea</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            The International Society for Immunology of Reproduction brings
            together researchers and clinicians worldwide to advance our
            understanding of reproductive immunology.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-lg mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-400">
            <li>
              <a href="#about" className="hover:text-white transition-colors">
                About the Congress
              </a>
            </li>
            <li>
              <a
                href="#registration"
                className="hover:text-white transition-colors"
              >
                Registration
              </a>
            </li>
            <li>
              <a
                href="#schedule"
                className="hover:text-white transition-colors"
              >
                Schedule
              </a>
            </li>
            <li>
              <a
                href="#deadlines"
                className="hover:text-white transition-colors"
              >
                Important Dates
              </a>
            </li>
            <li>
              <a
                href="https://theisir.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                ISIR Main Website
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="font-bold text-lg mb-4">Contact Us</h4>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm">General Inquiries</p>
                <a
                  href="mailto:info@isir2026.org"
                  className="hover:text-white transition-colors"
                >
                  info@isir2026.org
                </a>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-sm">Venue</p>
                <p>The Westin Josun Busan</p>
                <p className="text-sm">67 Dongbaek-ro, Haeundae-gu</p>
                <p className="text-sm">Busan, South Korea</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Social & Newsletter */}
        <div>
          <h4 className="font-bold text-lg mb-4">Stay Connected</h4>
          <p className="text-gray-400 text-sm mb-4">
            Follow us for the latest updates and announcements about ISIR 2026.
          </p>
          <div className="flex space-x-4 mb-6">
            <a
              href="#"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Subscribe for updates:</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-gray-700 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                className="px-4 py-2 rounded-r-lg font-medium text-sm"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Bar */}
    <div className="border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>
            &copy; 2026 International Society for Immunology of Reproduction.
            All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </div>
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
    <div ref={appRef} className="min-h-screen bg-gray-50">
      {/* Standalone Header */}
      <Header />

      {/* Hero Section with Photos */}
      <HeroSection />

      {/* Stats Bar */}
      <StatsBar />

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabClick={setActiveTab} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
