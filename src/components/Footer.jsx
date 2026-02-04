import React from "react";

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

        {/* Share This Page */}
        <div>
          <h4 className="font-bold text-lg mb-4">Share This Page</h4>
          <p className="text-gray-400 text-sm mb-4">
            Help spread the word about ISIR 2026!
          </p>
          <div className="flex space-x-4 mb-6">
            <a
              href="https://twitter.com/intent/tweet?url=https://isir2026.org&text=Join%20us%20at%20the%2016th%20ISIR%20World%20Congress%20in%20Busan%2C%20Korea!%20November%205-8%2C%202026"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              aria-label="Share on X (Twitter)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/shareArticle?mini=true&url=https://isir2026.org&title=16th%20ISIR%20World%20Congress&summary=Join%20us%20in%20Busan%2C%20Korea%20for%20the%2016th%20ISIR%20World%20Congress%20on%20Reproductive%20Immunology.%20November%205-8%2C%202026."
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https://isir2026.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              aria-label="Share on Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              aria-label="Follow on Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
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
                <p>The Westin Josun Busan</p>
                <p className="text-sm">67 Dongbaek-ro, Haeundae-gu</p>
                <p className="text-sm">Busan, Korea</p>
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
                <p>July 10, 2026</p>
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
                <p>April 30, 2026</p>
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

export default Footer;
