import React from "react";
import heroSkyline from "../assets/hero_skyline.jpg";

const HeroSection = () => {
  const scrollToNav = () => {
    const navElement = document.getElementById("navigation");
    if (navElement) {
      navElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section relative overflow-hidden flex flex-col flex-1">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/85 to-blue-800/75"></div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroSkyline})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
        }}
      ></div>
      <div className="items-center relative max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col justify-center">
        <span
          className="inline-block px-4 py-1 mb-4 text-md font-semibold rounded-full whitespace-nowrap"
          style={{
            backgroundColor: "var(--color-secondary)",
            color: "var(--color-primary)",
          }}
        >
          16th ISIR World Congress
        </span>
        <h2 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
          Global Dialogue on
          <br className="hidden md:block" /> Women's Health
        </h2>
        <p className="text-2xl text-blue-200 mb-6 max-w-2xl mx-auto">
          Join leading researchers and clinicians from around the world
        </p>

        {/* Abstract Deadline Extension Notice */}
        <div
          role="status"
          className="max-w-2xl mx-auto mb-8 flex items-start gap-3 rounded-xl border backdrop-blur-sm px-5 py-4 text-left shadow-lg"
          style={{
            backgroundColor: "rgba(243, 183, 44, 0.18)",
            borderColor: "var(--color-secondary)",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-secondary)" }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>
          <div className="text-white">
            <p
              className="font-bold text-base uppercase tracking-wide"
              style={{ color: "var(--color-secondary)" }}
            >
              Deadline Extended
            </p>
            <p className="text-sm md:text-base text-blue-50">
              The abstract submission deadline has been extended to{" "}
              <strong>August 7, 2026</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={scrollToNav}
            className="px-8 py-3 text-xl font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer inline-flex items-center gap-2"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Learn More
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
