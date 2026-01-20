import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Component imports
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Navigation from "./components/Navigation";
import StatsBar from "./components/StatsBar";
import Footer from "./components/Footer";

// Tab component imports
import {
  AboutTab,
  CommitteeTab,
  SpeakersTab,
  ScheduleTab,
  SubmissionTab,
  RegistrationTab,
  DeadlinesTab,
  TravelTab,
  SponsorsTab,
  WelcomeTab,
} from "./tabs";

export default function App() {
  const [activeTab, setActiveTab] = useState("about");
  // 1. Create a ref to attach to the main container
  const appRef = useRef(null);

  // *** IMPORTANT: REPLACE THE '*' WITH YOUR ACTUAL WORDPRESS DOMAIN ***
  const parentOrigin = "*";

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return <AboutTab />;
      case "welcome": // <--- UPDATED CASE
        return <WelcomeTab />;
      case "committee":
        return <CommitteeTab />;
      case "speakers":
        return <SpeakersTab />;
      case "schedule":
        return <ScheduleTab />;
      case "submission":
        return <SubmissionTab />;
      case "registration":
        return <RegistrationTab />;
      case "deadlines":
        return <DeadlinesTab onTabChange={setActiveTab} />;
      case "travel":
        return <TravelTab />;
      case "sponsors":
        return <SponsorsTab />;
      default:
        return <AboutTab />;
    }
  };

  /**
   * 2. Use a single useEffect hook to handle all height adjustments
   * via a ResizeObserver on the main container element (appRef).
   * This fires on initial load, element size changes (shrink/expand),
   * and window resize.
   */
  useEffect(() => {
    // Function to calculate and send the height
    const broadcastHeight = () => {
      // Exit if not inside an iframe or ref not ready
      if (window.parent === window || !appRef.current) return;

      // Get the full scroll height of the observed element
      const height = appRef.current.scrollHeight;

      window.parent.postMessage({ height: height }, parentOrigin);
      // Optional: console.log("Iframe sending height:", height); for debugging
    };

    // 3. Setup the ResizeObserver
    const observer = new ResizeObserver(broadcastHeight);

    // 4. Start observing the main application container
    if (appRef.current) {
      observer.observe(appRef.current);
    }

    // Also explicitly broadcast the height whenever the tab changes
    // to ensure the instant update is registered (ResizeObserver might have a slight delay)
    broadcastHeight();

    // 5. Cleanup function
    return () => {
      observer.disconnect();
      // No need for a separate window.resize listener now, as ResizeObserver handles that too.
    };
  }, [activeTab]); // Rerun setup when the tab changes to ensure instant update

  return (
    // 6. Attach the ref to the outermost container
    <div ref={appRef} className="min-h-screen bg-gray-50">
      {/* Hero viewport container - Header, Hero, Stats fill viewport */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Header />

        {/* Hero Section - grows to fill remaining space */}
        <div className="flex-1 flex flex-col">
          <HeroSection
            onRegisterClick={() => {
              setActiveTab("registration");
              setTimeout(() => {
                const navElement = document.getElementById("navigation");
                if (navElement) {
                  navElement.scrollIntoView({ behavior: "smooth" });
                }
              }, 100);
            }}
          />
        </div>

        {/* Stats Bar - at bottom of viewport */}
        <StatsBar />
      </div>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabClick={setActiveTab} />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
