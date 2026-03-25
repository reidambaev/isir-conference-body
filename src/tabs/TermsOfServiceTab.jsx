import React from "react";

const TermsOfServiceTab = () => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h2>
        <p className="text-sm text-gray-500">Last updated: March 24, 2026</p>
      </header>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          1. Acceptance of Terms
        </h3>
        <p className="text-gray-700 leading-relaxed">
          By using this website or registering for ISIR 2026, you agree to
          these Terms of Service and any applicable conference policies.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          2. Registration and Eligibility
        </h3>
        <p className="text-gray-700 leading-relaxed">
          You agree to provide accurate, complete information during
          registration. The organizing committee may refuse or cancel
          registrations that contain false or misleading information.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          3. Payment and Refunds
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Registration fees and refund deadlines are published on the conference
          website. Refund requests submitted after the applicable deadline may
          be denied except where required by law.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          4. Participant Conduct
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Participants must maintain professional behavior and comply with venue
          rules, local laws, and conference safety instructions. Harassment,
          discrimination, or disruptive conduct may result in removal from the
          event without refund.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          5. Program Changes
        </h3>
        <p className="text-gray-700 leading-relaxed">
          The organizing committee may update schedules, speakers, session
          formats, or venue logistics when needed. Reasonable efforts will be
          made to communicate major changes in advance.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          6. Intellectual Property
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Website content and conference branding are owned by ISIR or used with
          permission. You may not reproduce or distribute materials for
          commercial purposes without written consent.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          7. Limitation of Liability
        </h3>
        <p className="text-gray-700 leading-relaxed">
          To the extent permitted by law, ISIR 2026 is not liable for indirect,
          incidental, or consequential damages resulting from website use or
          conference participation.
        </p>
      </section>
    </div>
  );
};

export default TermsOfServiceTab;
