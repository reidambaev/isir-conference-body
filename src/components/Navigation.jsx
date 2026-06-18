import React from "react";

// NAVIGATION COMPONENT
const Navigation = ({ activeTab, onTabClick }) => {
  const tabs = [
    { id: "about", label: "About" },
    { id: "welcome", label: "Welcome" },
    { id: "committee", label: "Committee" },
    { id: "speakers", label: "Speakers" },
    { id: "schedule", label: "Schedule" },
    { id: "submission", label: "Submission" },
    { id: "registration", label: "Registration" },
    { id: "deadlines", label: "Deadlines" },
    { id: "travel", label: "Travel" },
    { id: "sponsors", label: "Sponsors" },
  ];

  return (
    <nav
      id="navigation"
      className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-[#1a3a6c] to-[#2d5a9e]"
    >
      <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
        <div
          className="flex flex-wrap justify-center gap-1 sm:gap-2"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`
                relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium
                transition-all duration-200 ease-out
                ${
                  activeTab === tab.id
                    ? "bg-white text-[#1a3a6c] shadow-md scale-[1.02]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }
              `}
              onClick={() => onTabClick(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#f3b72c] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
