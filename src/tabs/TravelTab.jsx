import React, { useState } from "react";
import VisaRequestForm from "../forms/VisaRequestForm";
import beach from "../assets/beach.jpg";
import village from "../assets/village.jpg";
import market from "../assets/market.jpg";
import temple2 from "../assets/temple2.jpg";
import beach3 from "../assets/beach3.jpg";
import food from "../assets/food.jpg";

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

      {/* Hotel Hero Section */}
      <div className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <img
              src={
                "https://cache.marriott.com/content/dam/marriott-renditions/PUSWI/puswi-exterior-3080-hor-clsc.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=1336px:*"
              }
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
            <p className="text-sm text-gray-600 mb-4">
              <strong>Invited speakers:</strong> submit your hotel stay details
              (dates and contact information) on the{" "}
              <a
                href="/speaker-hotel"
                className="text-blue-700 font-semibold hover:underline"
              >
                invited speaker hotel registration
              </a>{" "}
              page.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                disabled
                className="inline-block px-6 py-3 font-semibold rounded-lg opacity-60 cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                Discounted Registration Coming Soon
              </button>
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
            recommend checking with your local Korean embassy or consulate for
            the latest requirements.
          </p>
          <div className="bg-white p-4 rounded-lg border border-yellow-300 mb-4">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Need an invitation letter?</strong> We offer an invitation
              letter per request. Please click here (available soon).
            </p>
            <p className="text-sm text-gray-600">
              We do NOT contact or intervene with Embassy and/or Consulate
              matters as this is the responsibility of the participant to obtain
              their VISA approval to travel. If you require a visa or{" "}
              <a
                href="https://www.k-eta.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
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
