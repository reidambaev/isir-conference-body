import React from "react";
import {
  BEXCO_AREA_MAP,
  HAEUNDAE_HOTELS,
  HOTEL_CATEGORIES,
} from "../config/hotels";

const TAG_LABELS = {
  speaker: "Speaker hotel",
  office: "Congress office",
  luxury: "Luxury",
  convenient: "Near subway",
  budget: "Budget-friendly",
  bexco: "Near BEXCO",
};

function mapsSearchUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function telHref(phone) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

const TravelHotelsSection = () => (
  <div className="mb-10">
    <h4
      className="text-xl font-semibold mb-4"
      style={{ color: "var(--color-primary)" }}
    >
      Hotels &amp; Transportation to BEXCO
    </h4>

    <p className="text-gray-700 mb-6 leading-relaxed">
      Located adjacent to BEXCO, Haeundae is Busan&apos;s premier convention and
      tourism district, known for its scenic beachfront, picturesque Dongbaek
      Island, world-class hotels, shopping centers, seafood restaurants, and easy
      access to major attractions throughout the city.
    </p>
    <p className="text-gray-700 mb-6 leading-relaxed">
      The following hotels are listed in order of proximity to{" "}
      <strong>Haeundae</strong> and <strong>Dongbaek</strong> Stations (Busan
      Metro Line 2), although there are many other choices you may find. These
      stations provide direct subway access to BEXCO.
    </p>
    <p className="text-sm text-gray-600 mb-8">
      <strong>Invited speakers:</strong> please continue to submit your hotel
      stay details on the{" "}
      <a
        href="/speaker-hotel"
        className="text-blue-700 font-semibold hover:underline"
      >
        invited speaker hotel registration
      </a>{" "}
      page.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      {Object.values(HOTEL_CATEGORIES).map((category) => (
        <div
          key={category.label}
          className="rounded-xl p-5 border border-blue-100 bg-gradient-to-br from-blue-50 to-white"
        >
          <h5
            className="text-sm font-bold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            {category.label}
          </h5>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {category.hotelIds.map((id) => {
              const hotel = HAEUNDAE_HOTELS.find((h) => h.id === id);
              return hotel ? (
                <li key={id} className="flex items-start">
                  <span className="mr-2 text-blue-600">•</span>
                  {hotel.name}
                </li>
              ) : null;
            })}
          </ul>
        </div>
      ))}
    </div>

    <div className="space-y-6 mb-12">
      {HAEUNDAE_HOTELS.map((hotel) => (
        <article
          key={hotel.id}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <h5
                className="text-lg font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                {hotel.name}
              </h5>
              <div className="flex flex-wrap gap-2">
                {hotel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: "rgba(243, 183, 44, 0.25)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {TAG_LABELS[tag] || tag}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">{hotel.address}</p>
            <p className="text-sm mb-4">
              <a
                href={telHref(hotel.phone)}
                className="text-blue-700 font-medium hover:underline"
              >
                {hotel.phone}
              </a>
              <span className="mx-2 text-gray-300">|</span>
              <a
                href={mapsSearchUrl(hotel.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-medium hover:underline"
              >
                View on map
              </a>
            </p>

            <ul className="space-y-1.5 mb-4">
              {hotel.highlights.map((item) => (
                <li key={item} className="flex items-start text-sm text-gray-700">
                  <span className="mr-2 mt-0.5 text-blue-600 flex-shrink-0">●</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-sm text-gray-600">
              <strong className="text-gray-800">Metro access:</strong>{" "}
              {hotel.stationAccess}
            </p>
          </div>
        </article>
      ))}
    </div>

    <div className="mb-10">
      <h5
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        How to Get to BEXCO from Your Hotel
      </h5>
      <p className="text-gray-700 mb-6 leading-relaxed">
        <strong>Haeundae Station</strong> (Metro Line 2) or{" "}
        <strong>Dongbaek Station</strong> (Metro Line 2) are the most convenient
        subway stations for ISIR attendees. Most hotels listed above are within a
        2–10-minute walk of the station and offer easy access to both the congress
        venue and major attractions in Busan.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-xl">
          <h6
            className="text-base font-semibold mb-3 flex items-center"
            style={{ color: "var(--color-primary)" }}
          >
            <span className="text-2xl mr-2">🚇</span>
            From Dongbaek Station
          </h6>
          <p className="text-gray-700 text-sm leading-relaxed">
            Route: <strong>Dongbaek → BEXCO</strong>. BEXCO Station is the first
            stop. Attendees staying at The Westin Josun Busan would take Line 2
            from Dongbaek Station and get off at BEXCO Station for Exhibition Hall
            2.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-xl">
          <h6
            className="text-base font-semibold mb-3 flex items-center"
            style={{ color: "var(--color-primary)" }}
          >
            <span className="text-2xl mr-2">🚇</span>
            From Haeundae Station
          </h6>
          <p className="text-gray-700 text-sm leading-relaxed">
            Route: <strong>Haeundae → Dongbaek → BEXCO</strong>. Dongbaek Station
            is the first stop, and BEXCO Station is the second stop. Attendees
            staying at Grand Josun Busan would take Line 2 from Haeundae Station,
            pass Dongbaek Station, and get off at BEXCO Station for Exhibition Hall
            2.
          </p>
        </div>
      </div>
    </div>

    <div
      className="rounded-xl p-6 mb-10 border"
      style={{
        borderColor: "var(--color-primary)",
        backgroundColor: "rgba(243, 183, 44, 0.08)",
      }}
    >
      <h5
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        Transportation Tip for International Participants
      </h5>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Foreign-issued credit cards are accepted at most hotels, restaurants, and
        stores in Busan. However, public transportation still operates most
        smoothly with a rechargeable transportation card (T-money, Cashbee, or
        EZL card). Participants are encouraged to obtain a transportation card
        upon arrival at the airport or a convenience store.
      </p>
      <p className="text-gray-700 mb-3 font-medium">
        For conference participants, the following is recommended:
      </p>
      <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
        <li>
          Purchase a T-money/Cashbee card at the airport or a convenience store.
        </li>
        <li>Load it with about 20,000–30,000 KRW cash.</li>
        <li>
          Use it for all subway rides, buses, taxis, and convenience-store
          purchases during the meeting.
        </li>
      </ol>
    </div>

    <div>
      <h5
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--color-primary)" }}
      >
        BEXCO and Haeundae Area Map
      </h5>
      <p className="text-gray-600 mb-4 text-sm">
        Expand the map to find more hotels in the area.
      </p>
      <a
        href={BEXCO_AREA_MAP}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
        style={{
          backgroundColor: "var(--color-secondary)",
          color: "var(--color-primary)",
        }}
      >
        Open area map in Google Maps
      </a>
    </div>
  </div>
);

export default TravelHotelsSection;
