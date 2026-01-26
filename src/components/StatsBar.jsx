import React from "react";

const StatsBar = () => (
  <div className="bg-gray-50 border-y border-gray-200 flex-shrink-0">
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            30+
          </div>
          <div className="text-gray-600 text-sm">Scientific Sessions</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            4
          </div>
          <div className="text-gray-600 text-sm">Continents Attending</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            400+
          </div>
          <div className="text-gray-600 text-sm">Expected Attendees</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            22+
          </div>
          <div className="text-gray-600 text-sm">Countries Represented</div>
        </div>
        <div>
          <div
            className="text-3xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            4
          </div>
          <div className="text-gray-600 text-sm">Days of Innovation</div>
        </div>
      </div>
    </div>
  </div>
);

export default StatsBar;
