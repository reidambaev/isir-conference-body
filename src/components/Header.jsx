import React from "react";
import logo from "../assets/logo.png";

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

export default Header;
