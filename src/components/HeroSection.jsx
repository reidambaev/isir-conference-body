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
        <p className="text-2xl text-blue-200 mb-8 max-w-2xl mx-auto">
          Join leading researchers and clinicians from around the world
        </p>

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
