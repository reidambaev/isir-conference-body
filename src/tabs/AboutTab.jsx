import React from "react";
import headshots from "../assets/congress_chairs.png";
import map from "../assets/map.png";
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
              src={map}
              alt="Busan City Map View"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
              <div className="text-white">
                <p className="font-semibold text-lg">The Westin Josun Busan</p>
                <p className="text-sm opacity-90">
                  67 Dongbaek-ro, Haeundae-gu, Busan, Korea
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
                March 1, 2026
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
