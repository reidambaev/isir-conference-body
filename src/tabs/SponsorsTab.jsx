import React from "react";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";
import logo5 from "../assets/logo5.png";
import logo6 from "../assets/logo6.jpg";

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

    {/* Tier 1 Main Sponsor - Kang Wha, Inc */}
    <div className="mb-10">
      <div className="text-center mb-4">
        <span className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-bold rounded-full text-lg shadow-lg">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          TIER 1 SPONSOR
        </span>
      </div>
      <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-8 rounded-2xl border-4 border-amber-400 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logo Section */}
          <div className="w-full bg-white rounded-xl p-8 shadow-inner border border-amber-200 flex items-center justify-center min-h-[300px]">
            <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-amber-300 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sponsor Logo</span>
            </div>
          </div>

          {/* Text Section */}
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <h4 className="text-3xl font-bold text-gray-800 mb-1">
                강화 (주)
              </h4>
              <p className="text-xl text-gray-600 mb-4">Kang Wha, Inc</p>
            </div>
            <h4
              className="text-2xl font-bold mb-3"
              style={{ color: "var(--color-primary)" }}
            >
              Principal Sponsor
            </h4>
            <p className="text-gray-700 text-lg mb-4">
              We extend our deepest gratitude to Kang Wha, Inc for their
              exceptional support as our Tier 1 Principal Sponsor for ISIR 2026.
            </p>
          </div>
        </div>
      </div>
    </div>

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
      className="text-xl font-semibold text-blue-800 mb-6"
      style={{ color: "var(--color-primary)" }}
    >
      Supported By
    </h4>
    {/* First Row - Logos 1, 2, 3 */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
      {[
        {
          name: "Korean Society for Reproductive Medicine",
          logo: logo1,
        },
        {
          name: "Korean Society for Reproductive Immunology",
          logo: logo2,
        },
        {
          name: "Korean Society of Gynecologic Oncology",
          logo: logo3,
        },
      ].map((org, index) => (
        <div
          key={index}
          className="h-48 flex items-center justify-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <img
            src={org.logo}
            alt={org.name}
            className="w-full h-full object-contain"
            title={org.name}
          />
        </div>
      ))}
    </div>

    {/* Second Row - Logos 4, 5, 6 */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
      {[
        {
          name: "Korean Society of Ultrasound in Obstetrics and Gynecology",
          logo: logo4,
        },
        {
          name: "Korean College of Obstetrics and Gynecology",
          logo: logo5,
        },
        {
          name: "Korean Society of Obstetrics and Gynecology",
          logo: logo6,
        },
      ].map((org, index) => (
        <div
          key={index}
          className="h-48 flex items-center justify-center p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <img
            src={org.logo}
            alt={org.name}
            className="w-full h-full object-contain"
            title={org.name}
          />
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

export default SponsorsTab;
