import React from "react";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h4
      className="text-lg font-bold mb-3"
      style={{ color: "var(--color-primary)" }}
    >
      {title}
    </h4>
    <div className="space-y-3 text-gray-700">{children}</div>
  </section>
);

const CommerceDisclosureTab = () => {
  return (
    <div role="tabpanel">
      <div className="mb-8">
        <h3
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          Commercial Disclosure (特定商取引法に基づく表記)
        </h3>
        <p className="text-gray-600">
          This page provides required disclosure information under Japanese
          commerce regulations for online payments.
        </p>
      </div>

      <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-900">
        We provide this information to support payment transparency. This page
        is not legal advice and does not guarantee compliance with applicable
        laws.
      </div>

      <Section title="Required Items">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Legal Name</p>
            <p>We will disclose without delay if requested.</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Address</p>
            <p>We will disclose without delay if requested.</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Phone Number</p>
            <p>We will disclose without delay if requested.</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Email Address</p>
            <p>info@isir2026.org</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Head of Operations</p>
            <p>Atsushi Fukui</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
            <p className="font-semibold text-gray-900">Price</p>
            <p>
              Registration fee is shown per category on the Registration page.
              Prices include applicable tax.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <p className="font-semibold text-gray-900">Additional Fees</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>No shipping fee (digital/event registration service).</li>
            <li>Payment provider fees are included in listed registration prices.</li>
            <li>
              Any bank transfer or card issuer charges are the responsibility of
              the customer.
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <p className="font-semibold text-gray-900">Exchanges and Returns Policy</p>
          <div className="mt-2 space-y-2">
            <p>
              No returns or exchanges are accepted for this service after
              payment completion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="font-semibold text-gray-900">Delivery Times</p>
            <p className="mt-2">
              Registration is processed after successful payment confirmation and
              normally reflected immediately or within 3-5 business days.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="font-semibold text-gray-900">Accepted Payment Methods</p>
            <p className="mt-2">Credit cards (Visa, MasterCard, AMEX, Discover).</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="font-semibold text-gray-900">Payment Period</p>
            <p className="mt-2">
              Credit card payments are processed at checkout. Registration is
              confirmed when payment succeeds.
            </p>
          </div>
        </div>
      </Section>

      <Section title="For Checkout or Payment Links Users">
        <p>
          If using Checkout or Payment Links, this page can be registered in your
          Stripe Dashboard under business details so customers can open the
          commerce disclosure link from your payment page.
        </p>
      </Section>

    </div>
  );
};

export default CommerceDisclosureTab;
