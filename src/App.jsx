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
  ProgramTab,
  SubmissionTab,
  RegistrationTab,
  DeadlinesTab,
  TravelTab,
  SponsorsTab,
  WelcomeTab,
  CommerceDisclosureTab,
  PrivacyPolicyTab,
  TermsOfServiceTab,
  AccessibilityTab,
  AdminTab,
  VisaAdminTab,
  ReviewerTab,
  CheckinTab,
} from "./tabs";
import SpeakerProfileTab from "./tabs/SpeakerProfileTab";
import SpeakerHotelTab from "./tabs/SpeakerHotelTab";
import AccompanyingTab from "./tabs/AccompanyingTab";
import { isAdminLocalhost } from "./tabs/adminLocalDemoData";

function hasAdminAccessToken() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (String(params.get("admin") || "").trim()) return true;
    return Boolean(
      String(localStorage.getItem("isir_admin_token") || "").trim(),
    );
  } catch {
    return false;
  }
}
export default function App() {
  const [activeTab, setActiveTab] = useState("about");
  // 1. Create a ref to attach to the main container
  const appRef = useRef(null);

  // *** IMPORTANT: REPLACE THE '*' WITH YOUR ACTUAL WORDPRESS DOMAIN ***
  const parentOrigin = "*";

  // Check if we're on the admin page - use state to track pathname changes
  const [isAdminPage, setIsAdminPage] = useState(() => {
    // Check both window.location and document.location
    const pathname = window.location.pathname || document.location.pathname;
    const isAdmin =
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname.startsWith("/admin");
    console.log("Initial pathname check:", {
      pathname,
      windowLocation: window.location.pathname,
      documentLocation: document.location.pathname,
      href: window.location.href,
      isAdmin,
    });
    return isAdmin;
  });

  // Check if we're on the reviewer page - separate from main and admin
  const [isReviewerPage, setIsReviewerPage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/reviewer" ||
      pathname === "/reviewer/" ||
      pathname.startsWith("/reviewer")
    );
  });
  const [isCheckinPage, setIsCheckinPage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/checkin" ||
      pathname === "/checkin/" ||
      pathname.startsWith("/checkin")
    );
  });
  const [isSpeakerProfilePage, setIsSpeakerProfilePage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/speaker-profile" ||
      pathname === "/speaker-profile/" ||
      pathname.startsWith("/speaker-profile")
    );
  });
  const [isSpeakerHotelPage, setIsSpeakerHotelPage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/speaker-hotel" ||
      pathname === "/speaker-hotel/" ||
      pathname.startsWith("/speaker-hotel")
    );
  });
  const [isAccompanyingPage, setIsAccompanyingPage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/accompanying" ||
      pathname === "/accompanying/" ||
      pathname.startsWith("/accompanying")
    );
  });
  const [isVisaPage, setIsVisaPage] = useState(() => {
    const pathname = window.location.pathname || document.location.pathname;
    return (
      pathname === "/visa" ||
      pathname === "/visa/" ||
      pathname.startsWith("/visa")
    );
  });

  // Update admin page state when pathname changes
  useEffect(() => {
    const checkPath = () => {
      // Use a small delay to ensure pathname is set correctly
      setTimeout(() => {
        const pathname = window.location.pathname || document.location.pathname;
        const isAdmin =
          pathname === "/admin" ||
          pathname === "/admin/" ||
          pathname.startsWith("/admin");
        console.log("Pathname check:", {
          pathname,
          windowLocation: window.location.pathname,
          documentLocation: document.location.pathname,
          href: window.location.href,
          isAdmin,
        });
        setIsAdminPage(isAdmin);
        const isReviewer =
          pathname === "/reviewer" ||
          pathname === "/reviewer/" ||
          pathname.startsWith("/reviewer");
        setIsReviewerPage(isReviewer);
        const isCheckin =
          pathname === "/checkin" ||
          pathname === "/checkin/" ||
          pathname.startsWith("/checkin");
        setIsCheckinPage(isCheckin);
        const isSpeakerProfile =
          pathname === "/speaker-profile" ||
          pathname === "/speaker-profile/" ||
          pathname.startsWith("/speaker-profile");
        setIsSpeakerProfilePage(isSpeakerProfile);
        const isSpeakerHotel =
          pathname === "/speaker-hotel" ||
          pathname === "/speaker-hotel/" ||
          pathname.startsWith("/speaker-hotel");
        setIsSpeakerHotelPage(isSpeakerHotel);
        const isAccompanying =
          pathname === "/accompanying" ||
          pathname === "/accompanying/" ||
          pathname.startsWith("/accompanying");
        setIsAccompanyingPage(isAccompanying);
        const isVisa =
          pathname === "/visa" ||
          pathname === "/visa/" ||
          pathname.startsWith("/visa");
        setIsVisaPage(isVisa);
      }, 0);
    };

    // Check immediately and after a short delay
    checkPath();
    const timeout = setTimeout(checkPath, 100);

    // Listen for popstate events (back/forward button)
    window.addEventListener("popstate", checkPath);

    // Also listen for hashchange in case URL changes
    window.addEventListener("hashchange", checkPath);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("popstate", checkPath);
      window.removeEventListener("hashchange", checkPath);
    };
  }, []);

  // Auto-jump to Registration tab for invite links / direct registration URLs
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const hasInvite = Boolean(url.searchParams.get("invite"));
      const wantsRegistration =
        hasInvite ||
        url.pathname === "/registration" ||
        url.pathname === "/registration/";
      const wantsDisclosure =
        url.pathname === "/commercial-disclosure" ||
        url.pathname === "/commercial-disclosure/";
      const wantsPrivacyPolicy =
        url.pathname === "/privacy-policy" ||
        url.pathname === "/privacy-policy/";
      const wantsTermsOfService =
        url.pathname === "/terms-of-service" ||
        url.pathname === "/terms-of-service/";
      const wantsAccessibility =
        url.pathname === "/accessibility" || url.pathname === "/accessibility/";
      const wantsSchedule =
        url.pathname === "/schedule" || url.pathname === "/schedule/";
      const wantsProgram =
        url.pathname === "/program" || url.pathname === "/program/";
      const wantsTravel =
        url.pathname === "/travel" ||
        url.pathname === "/travel/" ||
        url.pathname === "/hotel" ||
        url.pathname === "/hotel/" ||
        url.pathname === "/travel-v2" ||
        url.pathname === "/travel-v2/";
      const wantsSubmission =
        url.pathname === "/abstract" ||
        url.pathname === "/abstract/" ||
        url.pathname === "/submission" ||
        url.pathname === "/submission/";

      if (wantsDisclosure) {
        setActiveTab("commerce-disclosure");
      } else if (wantsPrivacyPolicy) {
        setActiveTab("privacy-policy");
      } else if (wantsTermsOfService) {
        setActiveTab("terms-of-service");
      } else if (wantsAccessibility) {
        setActiveTab("accessibility");
      } else if (wantsSchedule) {
        setActiveTab("schedule");
      } else if (wantsProgram) {
        setActiveTab("program");
      } else if (wantsTravel) {
        setActiveTab("travel");
      } else if (wantsSubmission) {
        setActiveTab("submission");
      } else if (wantsRegistration) {
        setActiveTab("registration");
      } else {
        return;
      }

      // Scroll to navigation so the registration panel is visible
      setTimeout(() => {
        const navElement = document.getElementById("navigation");
        if (navElement) {
          navElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch {
      // ignore
    }
  }, []);

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
      case "program":
        return <ProgramTab />;
      case "submission":
        return <SubmissionTab />;
      case "registration":
        return <RegistrationTab />;
      case "commerce-disclosure":
        return <CommerceDisclosureTab />;
      case "privacy-policy":
        return <PrivacyPolicyTab />;
      case "terms-of-service":
        return <TermsOfServiceTab />;
      case "accessibility":
        return <AccessibilityTab />;
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

  // Prevent navigation away from /admin if we're on admin page
  useEffect(() => {
    if (isAdminPage) {
      const preventNav = (e) => {
        const pathname = window.location.pathname;
        if (!pathname.startsWith("/admin")) {
          console.warn(
            "Attempted navigation away from /admin detected, pathname:",
            pathname,
          );
          // Don't prevent default, but log it for debugging
        }
      };

      // Monitor for navigation attempts
      window.addEventListener("beforeunload", preventNav);

      return () => {
        window.removeEventListener("beforeunload", preventNav);
      };
    }
  }, [isAdminPage]);

  // Render admin page if on /admin route.
  // Localhost: always allowed (sample mode or ?admin=TOKEN).
  // Online: only with an admin token — otherwise show a token-required error.
  if (isAdminPage) {
    if (!isAdminLocalhost() && !hasAdminAccessToken()) {
      return (
        <div ref={appRef} className="min-h-screen bg-gray-50">
          <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin access required
              </h1>
              <p className="mt-3 text-gray-600">
                An admin token is needed to view this page. Open it with{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-800">
                  ?admin=YOUR_TOKEN
                </code>{" "}
                in the URL.
              </p>
            </div>
          </main>
        </div>
      );
    }
    console.log("Rendering admin page");
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <AdminTab />
          </div>
        </main>
      </div>
    );
  }

  // Render visa admin page if on /visa route
  if (isVisaPage) {
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <VisaAdminTab />
          </div>
        </main>
      </div>
    );
  }

  // Render reviewer page if on /reviewer route
  if (isReviewerPage) {
    console.log("Rendering reviewer page");
    return <ReviewerTab />;
  }

  // Render check-in page if on /checkin route
  if (isCheckinPage) {
    console.log("Rendering check-in page");
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <CheckinTab />
          </div>
        </main>
      </div>
    );
  }

  if (isSpeakerProfilePage) {
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <SpeakerProfileTab />
          </div>
        </main>
      </div>
    );
  }

  if (isSpeakerHotelPage) {
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <SpeakerHotelTab />
          </div>
        </main>
      </div>
    );
  }

  if (isAccompanyingPage) {
    return (
      <div ref={appRef} className="min-h-screen bg-gray-50">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
            <AccompanyingTab />
          </div>
        </main>
      </div>
    );
  }

  console.log("Rendering main app, pathname:", window.location.pathname);

  return (
    // 6. Attach the ref to the outermost container
    <div ref={appRef} className="min-h-screen bg-gray-50">
      {/* Hero viewport container - Header, Hero, Stats fill viewport */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <Header />

        {/* Hero Section - grows to fill remaining space */}
        <div className="flex-1 flex flex-col">
          <HeroSection />
        </div>

        {/* Stats Bar - at bottom of viewport */}
        <StatsBar />
      </div>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabClick={setActiveTab} />

      {/* Main Content Area */}
      <main
        className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${activeTab === "schedule" || activeTab === "program" ? "max-w-screen-2xl" : "max-w-6xl"}`}
      >
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <Footer
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          setTimeout(() => {
            const navElement = document.getElementById("navigation");
            if (navElement) {
              navElement.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }}
      />
    </div>
  );
}
