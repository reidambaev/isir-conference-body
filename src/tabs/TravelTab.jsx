import React, { useState } from "react";
import { BEXCO_VENUE } from "../config/constants";
import VisaRequestForm from "../forms/VisaRequestForm";
import TravelHotelsSection from "../components/TravelHotelsSection";
import beach from "../assets/beach.jpg";
import village from "../assets/village.jpg";
import market from "../assets/market.jpg";
import temple2 from "../assets/temple2.jpg";
import beach3 from "../assets/beach3.jpg";
import food from "../assets/food.jpg";
import bexcoFloorplan from "../assets/bexco-floorplan.png";

const TravelTab = () => {
  const [showVisaForm, setShowVisaForm] = useState(false);

  if (showVisaForm) {
    return <VisaRequestForm onClose={() => setShowVisaForm(false)} />;
  }

  return (
    <div role="tabpanel">
      <h3
        className="text-2xl font-bold text-blue-900 mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Travel & Accommodation
      </h3>

      {/* Venue Hero Section */}
      <div className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <img
              src={BEXCO_VENUE.photos[0].src}
              alt={BEXCO_VENUE.photos[0].alt}
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
              Congress Venue
            </span>
            <h4
              className="text-xl font-semibold text-blue-800 mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              BEXCO — Exhibition Center II
            </h4>
            <p className="text-gray-700 mb-4">
              The congress will be held at the{" "}
              <a
                href={BEXCO_VENUE.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Busan Exhibition and Convention Center (BEXCO)
              </a>
              , in the new <strong>Exhibition Center II</strong> building.
              Scientific sessions will take place in Meeting Rooms{" "}
              <strong>320–326</strong> and <strong>121–124</strong>.
            </p>
            <p className="text-sm text-gray-600">
              55 APEC-ro, Haeundae-gu, Busan, Korea
            </p>
          </div>
        </div>
      </div>

      {/* Venue Amenities */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: "🏛️", label: "Exhibition Halls" },
          { icon: "🎤", label: "Meeting Rooms" },
          { icon: "📶", label: "High-Speed WiFi" },
          { icon: "🚇", label: "Metro Access" },
          { icon: "🍽️", label: "On-site Dining" },
          { icon: "♿", label: "Accessibility" },
          { icon: "🅿️", label: "Parking" },
          { icon: "🏖️", label: "Haeundae District" },
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

      {/* Floor Plan & Getting to BEXCO */}
      <div className="mb-10">
        <h4
          className="text-xl font-semibold text-blue-800 mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Getting there / Parking / Directions / Transportation
        </h4>
        <div className="rounded-xl overflow-hidden shadow-lg mb-6 bg-white">
          <img
            src={bexcoFloorplan}
            alt="BEXCO floor plan showing Exhibition Centers I and II, meeting rooms, and parking areas"
            className="w-full h-auto"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-xl">
            <h5
              className="text-lg font-semibold mb-3 flex items-center"
              style={{ color: "var(--color-primary)" }}
            >
              <span className="text-2xl mr-2">🅿️</span>
              Parking
            </h5>
            <p className="text-gray-700">
              BEXCO provides access to on-site parking. The fees start from 400
              KRW per 10 min (
              <a
                href={BEXCO_VENUE.parking}
                target="_blank"
                rel="noopener noreferrer"
              >
                more info here
              </a>
              ).
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl">
            <h5
              className="text-lg font-semibold mb-3 flex items-center"
              style={{ color: "var(--color-primary)" }}
            >
              <span className="text-2xl mr-2">🚇</span>
              Public Transportation
            </h5>
            <p className="text-gray-700 mb-3">
              There are several ways to reach BEXCO:
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800">By subway</p>
                <p className="text-gray-600 text-sm">
                  There are two stations next to the center:{" "}
                  <strong>Centum City</strong> and <strong>BEXCO</strong>.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">By bus</p>
                <p className="text-gray-600 text-sm">
                  The center can be reached by buses № 5-1, 39, 40, 63, 100,
                  100-1, 107, 115, 115-1, 139, 141, 141(심야), 155, 181, 200,
                  307, 1001, 1001(심야), 1002, 1006, 1011, 수영구2-1,
                  해운대구3-1, 해운대구3-2.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TravelHotelsSection />

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
                  Fly into <strong>Incheon Airport (ICN)</strong> and take the
                  KTX high-speed train (2.5-3 hours).
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
                <p className="font-semibold text-gray-800">From PUS to BEXCO</p>
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
            recommend checking with your local Korean embassy or consulate for
            the latest requirements.
          </p>
          <div className="bg-white p-4 rounded-lg border border-yellow-300 mb-4">
            <p className="text-sm text-gray-600 mb-3">
              You may request an invitation letter if you are an invited
              speaker/chair, have registered for the congress, or have had an
              abstract accepted.
            </p>
            <p className="text-sm text-gray-600 mb-3">
              <strong>Need an invitation letter?</strong> Submit the form below
              with your formal name, affiliation, and nationality exactly as they
              should appear on the letter, plus a photo or PDF of your abstract
              acceptance or congress registration confirmation. We use a
              standard template for all attendees—no special wording is needed.
              Our coordinator will prepare and send your letter by email.
            </p>
            <p className="text-sm text-gray-600">
              We do NOT contact or intervene with Embassy and/or Consulate
              matters; obtaining visa approval is the participant&apos;s
              responsibility. If you require a visa or{" "}
              <a
                href="https://www.k-eta.go.kr"
                target="_blank"
                rel="noopener noreferrer"
              >
                K-ETA
              </a>
              , please ensure you allow ample time for the application process,
              including obtaining any necessary documentation.
            </p>
          </div>
          <button
            onClick={() => setShowVisaForm(true)}
            className="inline-block px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-primary)",
            }}
          >
            Request Visa Letter
          </button>
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
                src={beach}
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
                Perfect for morning walks or evening strolls along the
                coastline.
              </p>
            </div>
          </div>
          <div className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="aspect-video overflow-hidden">
              <img
                src={village}
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
                src={market}
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
              src={temple2}
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
              src={beach3}
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
              src={food}
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
};

export default TravelTab;
