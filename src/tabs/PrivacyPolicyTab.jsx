import React from "react";

const PrivacyPolicyTab = () => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h2>
        <p className="text-sm text-gray-500">Last updated: March 24, 2026</p>
      </header>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">1. Overview</h3>
        <p className="text-gray-700 leading-relaxed">
          ISIR 2026 respects your privacy. This policy explains how we collect,
          use, and protect personal information when you use the conference
          website and register for the event.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          2. Information We Collect
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
          <li>
            Contact details such as your name, email address, institution, and
            country.
          </li>
          <li>
            Registration details, including ticket type, professional role, and
            attendance preferences.
          </li>
          <li>
            Submission details for abstracts, if you submit scientific content.
          </li>
          <li>
            Payment-related metadata processed securely by approved payment
            providers. We do not store full card numbers.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">
          3. How We Use Information
        </h3>
        <p className="text-gray-700 leading-relaxed">
          We use personal information to administer registration, process
          payments, communicate event updates, evaluate abstract submissions,
          and provide support before, during, and after the conference.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">4. Data Sharing</h3>
        <p className="text-gray-700 leading-relaxed">
          We may share necessary data with trusted service providers supporting
          registration, payment processing, email delivery, and on-site event
          operations. We do not sell personal information.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">5. Data Retention</h3>
        <p className="text-gray-700 leading-relaxed">
          We retain records for operational, legal, accounting, and reporting
          purposes for a reasonable period after the event, then securely delete
          or anonymize data where feasible.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">6. Your Rights</h3>
        <p className="text-gray-700 leading-relaxed">
          You may request access to, correction of, or deletion of your personal
          information, subject to applicable law and legitimate administrative
          requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">7. Contact</h3>
        <p className="text-gray-700 leading-relaxed">
          For privacy questions, contact{" "}
          <a
            href="mailto:info@isir2026.org"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            info@isir2026.org
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyTab;
