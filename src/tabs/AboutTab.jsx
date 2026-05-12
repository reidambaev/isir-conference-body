import React from "react";
import headshots from "../assets/congress_chairs.png";
import beach2 from "../assets/beach2.jpg";
import village from "../assets/village.jpg";
import temple2 from "../assets/temple2.jpg";
import market from "../assets/market.jpg";
import saveTheDate from "../assets/1.png";

const AboutTab = () => (
  <div role="tabpanel">
    {/* Congress Banner */}
    <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
      <img
        src={saveTheDate}
        alt="16th ISIR World Congress - Save the Date - November 5-8, 2026 - Busan, Korea"
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
      Busan, Korea. Join us from November 5-8, 2026, for a "Global Dialog on
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
          About the Location
        </h4>
        <p className="text-gray-700 mb-6">
          The 16th International Society for Immunology of Reproduction (ISIR)
          Congress will be held in{" "}
          <strong className="font-medium">Busan, Korea</strong>, a vibrant
          coastal city renowned for its stunning beaches, rich cultural
          heritage, and world-class hospitality. Busan offers an ideal
          environment that blends scientific professionalism with outstanding
          natural beauty.
        </p>

        {/* Venue Placeholder Card */}
        <div
          className="rounded-xl p-6 border-2 border-dashed flex items-start gap-4"
          style={{
            borderColor: "var(--color-primary)",
            backgroundColor: "rgba(243, 183, 44, 0.08)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p
              className="font-semibold mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              Conference venue details coming soon.
            </p>
            <p className="text-sm text-gray-700">
              Please check back for updates on the official congress venue.
            </p>
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
                <strong>Registration & Abstract Opens:</strong>
                <br />
                March 15, 2026
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
                July 1, 2026
              </div>
            </li>
            <li className="flex items-start">
              <span
                className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                style={{ backgroundColor: "var(--color-secondary)" }}
              ></span>
              <div>
                <strong>Notification of Acceptance:</strong>
                <br />
                August 1, 2026
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
                September 1, 2026
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
                October 30, 2026
              </div>
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
        Busan, Korea's second-largest city, offers a captivating blend of
        stunning beaches, vibrant markets, ancient temples, and modern
        attractions. Take time before or after the congress to explore this
        incredible destination.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src={beach2}
            alt="Haeundae Beach"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Haeundae Beach</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src={village}
            alt="Gamcheon Culture Village"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Gamcheon Village</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src={temple2}
            alt="Traditional Korean Temple"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
            <span className="text-white font-semibold">Haedong Yonggungsa</span>
          </div>
        </div>
        <div className="group relative aspect-square rounded-xl overflow-hidden shadow-lg">
          <img
            src={market}
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

export default AboutTab;
