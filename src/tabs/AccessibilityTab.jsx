import React from "react";

const AccessibilityTab = () => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Accessibility</h2>
        <p className="text-sm text-gray-500">Last updated: March 24, 2026</p>
      </header>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">1. Commitment</h3>
        <p className="text-gray-700 leading-relaxed">
          ISIR 2026 is committed to providing an inclusive experience for all
          participants. We aim to improve website and event accessibility for
          attendees with a wide range of access needs.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          2. Website Accessibility
        </h3>
        <p className="text-gray-700 leading-relaxed">
          We strive to use clear structure, readable text, meaningful headings,
          and keyboard-friendly interactions. We continue reviewing pages and
          forms to identify and fix accessibility issues.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          3. Event Accommodations
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li>Mobility-related venue support where available.</li>
          <li>Assistance with seating or navigation upon request.</li>
          <li>
            Reasonable accommodations for communication and participation needs.
          </li>
          <li>Dietary support coordination where feasible.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          4. How to Request Support
        </h3>
        <p className="text-gray-700 leading-relaxed">
          To request accommodations, please contact us as early as possible at{" "}
          <a
            href="mailto:info@isir2026.org"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            info@isir2026.org
          </a>
          . Include your registration name, contact details, and requested
          support so we can assist effectively.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">5. Feedback</h3>
        <p className="text-gray-700 leading-relaxed">
          If you encounter accessibility barriers on this website or during the
          conference experience, please let us know. Your feedback helps us
          improve access for all participants.
        </p>
      </section>
    </div>
  );
};

export default AccessibilityTab;
