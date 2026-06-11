import React from "react";
import { BEXCO_VENUE } from "../config/constants";

const Footer = ({ onNavigateTab }) => (
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

        {/* Share This Page */}
        <div>
          <h4 className="font-bold text-lg mb-4">Share This Page</h4>
          <p className="text-gray-400 text-sm mb-4">
            Help spread the word about ISIR 2026!
          </p>
          <div className="flex space-x-4 mb-6">
            <a
              href="https://x.com/ISImmunolReprod"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              aria-label="Share on Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/isir-immunology-of-reproduction-855a0435a"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>

          {/* Official ISIR Social Profiles */}
          <h5 className="font-semibold text-sm mb-3 text-white">
            Follow ISIR on Social Media
          </h5>
          <a
            href="https://theisir.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center"
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Visit ISIR Official Website
          </a>
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
                <p>
                  <a
                    href={BEXCO_VENUE.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    BEXCO, Exhibition Center II
                  </a>
                </p>
                <p className="text-sm">Rooms 320–326 &amp; 121–124</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Important Information */}
        <div>
          <h4 className="font-bold text-lg mb-4">Important Information</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400"
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
              <div>
                <p className="font-medium text-white">Congress Dates</p>
                <p>November 5-8, 2026</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400"
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
              <div>
                <p className="font-medium text-white">Early Bird Deadline</p>
                <p>September 1, 2026</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400"
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
              <div>
                <p className="font-medium text-white">Abstract Deadline</p>
                <p>July 1, 2026</p>
              </div>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-white">Location</p>
                <p>Busan, Korea</p>
              </div>
            </li>
          </ul>
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
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("privacy-policy")}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigateTab && onNavigateTab("commerce-disclosure")
              }
              className="hover:text-white transition-colors"
            >
              Commercial Disclosure
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("terms-of-service")}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("accessibility")}
              className="hover:text-white transition-colors"
            >
              Accessibility
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
