import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ISIR_API_CONFIG } from "../config/constants";
import {
  isKorea,
  getCurrency,
  getFinalPrice,
  formatCurrency,
  getCurrencySymbol,
  applyKoreanTax,
  usdToKrw,
} from "../utils/currency";
import PaymentForm from "../components/PaymentForm";

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// --- Registration Form UI Components ---
const FormSectionHeader = ({ children, icon }) => (
  <div
    className="p-4 border-b flex items-center"
    style={{
      background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
    }}
  >
    {icon && <span className="mr-2">{icon}</span>}
    <h4 className="text-lg font-bold text-white">{children}</h4>
  </div>
);

const FormLabel = ({ required, children, className = "" }) => (
  <label
    className={`block text-sm font-semibold text-gray-700 mb-1.5 ${className}`}
  >
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({
  name,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
  className = "",
  type = "text",
  ...props
}) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    className={`w-full border-2 border-gray-200 p-3 text-sm rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 ${
      readOnly ? "bg-gray-50 cursor-not-allowed" : "bg-white"
    } ${className}`}
    required={required}
    {...props}
  />
);

const FormCheckbox = ({
  name,
  checked,
  onChange,
  label,
  required,
  subLabel,
}) => (
  <label className="flex items-start mb-3 cursor-pointer group">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mt-1 mr-3 h-5 w-5 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500 transition-all"
    />
    <div className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
      {subLabel && <p className="text-xs text-gray-500 mt-1">{subLabel}</p>}
    </div>
  </label>
);

// Step Progress Indicator
const StepIndicator = ({ currentStep, totalSteps = 5 }) => {
  const steps = [
    { num: 1, label: "Verify" },
    { num: 2, label: "Tickets" },
    { num: 3, label: "Details" },
    { num: 4, label: "Payment" },
    { num: 5, label: "Confirm" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full -z-10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          />
        </div>

        {steps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col items-center relative z-10"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
                step.num < currentStep
                  ? "bg-green-500 text-white"
                  : step.num === currentStep
                  ? "text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
              style={
                step.num === currentStep
                  ? {
                      background:
                        "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                    }
                  : {}
              }
            >
              {step.num < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                step.num === currentStep ? "text-blue-800" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RegistrationForm = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [membershipData, setMembershipData] = useState(null);

  // Auto-detect early bird period (before July 10, 2026)
  const earlyBirdDeadline = new Date("2026-07-10");
  const currentDate = new Date();
  const isEarlyBirdPeriod = currentDate < earlyBirdDeadline;

  // State for country, state, and city selectors
  const [countryid, setCountryid] = useState(233); // Default to United States
  const [stateid, setStateid] = useState(0);
  const [cityid, setCityid] = useState(0);

  const [formData, setFormData] = useState({
    ticketType: "",
    accompanyingPersonCount: 0,
    galaDinnerCount: 0,
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    billingZip: "",
    salutation: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    institution: "",
    credentials: "",
    badgeName: "",
    pronouns: "",
    department: "",
    address1: "",
    address2: "",
    city: null,
    state: null,
    zip: "",
    country: null,
    phone: "",
    cellPhone: "",
    email: "",
    isPhysician: null,
    dietary: {
      vegan: false,
      vegetarian: false,
      glutenFree: false,
      kosher: false,
      other: false,
    },
    specialAssistance: false,
    policyAgreed: false,
    privacyMarketing: false,
    privacyApp: false,
    optOutMailing: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("dietary_")) {
      const key = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        dietary: { ...prev.dietary, [key]: checked },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Please enter your email to verify.");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch(ISIR_API_CONFIG.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ISIR-API-Key": ISIR_API_CONFIG.apiKey,
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setMembershipData(data.data);

      if (data.is_member) {
        // Member verified - proceed to ticket selection
        setStep(2);
      } else {
        // Not a member - show appropriate message
        if (!data.data.email_registered) {
          setVerificationError(
            "No account found with this email address. Please check your email or register at theisir.org first."
          );
        } else if (!data.data.has_membership) {
          setVerificationError(
            data.message ||
              "No active ISIR membership found. Please renew your membership at theisir.org to access member pricing."
          );
        } else {
          setVerificationError(
            "Verification failed. Please contact support@theisir.org for assistance."
          );
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError(
        "Unable to verify membership. Please try again or contact support@theisir.org"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTicketSelection = (e) => {
    e.preventDefault();
    if (!formData.ticketType) {
      alert("Please select a ticket type.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.policyAgreed) {
      alert("You must agree to the ISIR Event Policies to proceed.");
      return;
    }
    console.log("Registration Info:", formData);
    setStep(4);
  };

  const [registrationId, setRegistrationId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  // Create payment intent when entering payment step
  useEffect(() => {
    if (step === 4 && !clientSecret && formData.country) {
      createPaymentIntent();
    }
  }, [step, formData.country]);

  const createPaymentIntent = async () => {
    try {
      // First, save registration to get registration ID
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          membershipLevel: membershipData?.membership_level || null,
          membershipStatus: membershipData?.membership_status || null,
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok || !registerResult.success) {
        throw new Error(registerResult.error || "Failed to save registration");
      }

      setRegistrationId(registerResult.registrationId);
      setFormData((prev) => ({
        ...prev,
        registrationId: registerResult.registrationId,
      }));

      // Create payment intent
      const paymentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: getStripeAmount(),
          currency: currency.toLowerCase(),
          registrationId: registerResult.registrationId,
          metadata: {
            ticketType: formData.ticketType,
            email: formData.email,
          },
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(paymentResult.error || "Failed to create payment intent");
      }

      setClientSecret(paymentResult.clientSecret);
    } catch (error) {
      console.error("Payment setup error:", error);
      alert(
        "There was an error setting up payment. Please try again or contact support@theisir.org"
      );
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    try {
      if (!clientSecret) {
        await createPaymentIntent();
        return;
      }

      // Payment will be handled by Stripe Elements component
      // This is just a placeholder - actual payment confirmation happens in PaymentForm component
      setStep(5);
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        "There was an error processing your payment. Please try again or contact support@theisir.org"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fillExampleData = () => {
    // Set country/state/city IDs for Massachusetts, USA
    setCountryid(233); // United States
    setStateid(1433); // Massachusetts
    setCityid(0); // Will need to be set based on available cities

    setFormData({
      ...formData,
      salutation: "Dr.",
      firstName: "Jane",
      middleName: "Marie",
      lastName: "Smith",
      suffix: "MD",
      institution: "University Medical Center",
      credentials: "MD, PhD",
      badgeName: "Dr. Jane Smith",
      pronouns: "she/her",
      department: "Obstetrics & Gynecology",
      address1: "123 Medical Plaza",
      address2: "Suite 456",
      city: { id: 0, name: "Boston" },
      state: { id: 1433, name: "Massachusetts" },
      zip: "02115",
      country: { id: 233, name: "United States" },
      phone: "(617) 555-0100",
      cellPhone: "(617) 555-0101",
      isPhysician: "physician",
      dietary: {
        vegan: false,
        vegetarian: true,
        glutenFree: false,
        kosher: false,
        other: false,
      },
      policyAgreed: true,
      privacyMarketing: true,
      privacyApp: true,
    });
  };

  const ticketPrices = {
    "isir-member": { early: 350, standard: 450, label: "ISIR Member" },
    "non-member": { early: 650, standard: 750, label: "Non-Member" },
    "trainee-member": {
      early: 150,
      standard: 200,
      label: "Trainee / Student Member",
    },
    "trainee-non-member": {
      early: 250,
      standard: 300,
      label: "Trainee / Student Non-Member",
    },
  };

  // Get currency based on country
  const currency = getCurrency(formData.country);
  const isKoreanCustomer = isKorea(formData.country);

  const getTicketPrice = (type, inBaseCurrency = false) => {
    if (!type || !ticketPrices[type]) return 0;
    const basePrice = isEarlyBirdPeriod
      ? ticketPrices[type].early
      : ticketPrices[type].standard;
    
    if (inBaseCurrency) return basePrice;
    return getFinalPrice(basePrice, formData.country);
  };

  const getAccompanyingPrice = (inBaseCurrency = false) => {
    const basePrice = isEarlyBirdPeriod ? 250 : 350;
    if (inBaseCurrency) return basePrice;
    return getFinalPrice(basePrice, formData.country);
  };

  const getGalaDinnerPrice = (inBaseCurrency = false) => {
    const basePrice = 100;
    if (inBaseCurrency) return basePrice;
    return getFinalPrice(basePrice, formData.country);
  };

  const getTotalPrice = (inBaseCurrency = false) => {
    const ticketPrice = getTicketPrice(formData.ticketType, inBaseCurrency);
    const accompanyingPrice =
      getAccompanyingPrice(inBaseCurrency) * formData.accompanyingPersonCount;
    const galaDinnerPrice = getGalaDinnerPrice(inBaseCurrency) * formData.galaDinnerCount;
    return ticketPrice + accompanyingPrice + galaDinnerPrice;
  };

  // Get price for Stripe (in smallest currency unit)
  const getStripeAmount = () => {
    const total = getTotalPrice();
    // Stripe amounts are in smallest currency unit (cents for USD, won for KRW)
    return currency === "KRW" ? total : Math.round(total * 100);
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="animate-in fade-in duration-300">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
            }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h3
              className="text-2xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {step === 1 && "Attendee Verification"}
              {step === 2 && "Select Your Tickets"}
              {step === 3 && "Registration Details"}
              {step === 4 && "Secure Payment"}
              {step === 5 && "Registration Complete!"}
            </h3>
            <p className="text-gray-600">ISIR 2026 World Congress</p>
          </div>
        </div>
        {step !== 5 && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Cancel Registration"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Step Progress */}
      <StepIndicator currentStep={step} />

      {/* STEP 1: VERIFICATION */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <FormSectionHeader
            icon={
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            }
          >
            Verify Your Information
          </FormSectionHeader>
          <div className="p-8">
            <p className="text-gray-600 mb-6 pb-6 border-b border-gray-200">
              Please provide your name and email address to verify your account
              or eligibility before continuing to the registration form.
            </p>
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: "Jane",
                    lastName: "Smith",
                    email: "jane.smith@example.com",
                  }))
                }
                className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                🔧 Fill Example
              </button>
            </div>
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <FormLabel required>First Name</FormLabel>
                <FormInput
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <FormLabel required>Last Name</FormLabel>
                <FormInput
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <FormLabel required>Email Address</FormLabel>
                <FormInput
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Verification Error Message */}
              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-red-700 font-medium text-sm">
                        {verificationError}
                      </p>
                      <a
                        href="https://theisir.org/membership/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 underline text-sm mt-2 inline-block hover:text-red-800"
                      >
                        Join or renew ISIR membership →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full font-bold py-4 px-6 rounded-xl mt-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg text-white"
                style={{
                  background: isVerifying
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue →"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: TICKET SELECTION */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <FormSectionHeader
            icon={
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            }
          >
            Select Your Tickets
          </FormSectionHeader>
          <div className="p-8">
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    ticketType: "isir-member",
                    accompanyingPersonCount: 1,
                    galaDinnerCount: 1,
                  }))
                }
                className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "var(--color-primary)",
                }}
              >
                🔧 Fill Example
              </button>
            </div>

            {/* Early Bird Status */}
            <div
              className={`${
                isEarlyBirdPeriod
                  ? "bg-green-50 border-green-300"
                  : "bg-amber-50 border-amber-300"
              } border-2 rounded-xl p-5 mb-8`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isEarlyBirdPeriod ? "bg-green-500" : "bg-amber-500"
                  }`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {isEarlyBirdPeriod
                      ? "🎉 Early Bird Pricing Available!"
                      : "Early Bird Pricing Has Ended"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isEarlyBirdPeriod
                      ? "Register by July 10, 2026 to get early bird rates."
                      : "Standard pricing applies (Early bird ended July 10, 2026)."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleTicketSelection} className="space-y-8">
              {/* Ticket Type Selection */}
              <div>
                <FormLabel required className="!text-base mb-4">
                  Select Your Ticket Type
                </FormLabel>
                <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                  {/* Table Header */}
                  <div
                    className="grid grid-cols-3 border-b-2 border-gray-200 items-center"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <div className="p-4 font-bold text-sm text-white">
                      CATEGORY
                    </div>
                    <div className="p-4 font-bold text-sm text-white text-center flex flex-col items-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs mb-1"
                        style={{
                          backgroundColor: "var(--color-secondary)",
                          color: "var(--color-primary)",
                        }}
                      >
                        SAVE!
                      </span>
                      EARLY BIRD
                    </div>
                    <div className="p-4 font-bold text-sm text-white text-center">
                      STANDARD
                    </div>
                  </div>
                  {Object.entries(ticketPrices).map(
                    ([value, { early, standard, label }], index) => (
                      <label
                        key={value}
                        className={`grid grid-cols-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                          formData.ticketType === value
                            ? "bg-blue-100 ring-2 ring-blue-500 ring-inset"
                            : ""
                        } ${
                          index !== Object.keys(ticketPrices).length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <div className="p-5 flex items-center gap-3">
                          <input
                            type="radio"
                            name="ticketType"
                            value={value}
                            checked={formData.ticketType === value}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="font-semibold text-gray-800">
                            {label}
                          </span>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span
                            className="text-xl font-bold"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {formatCurrency(
                              getFinalPrice(early, formData.country),
                              getCurrency(formData.country)
                            )}
                          </span>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-500">
                            {formatCurrency(
                              getFinalPrice(standard, formData.country),
                              getCurrency(formData.country)
                            )}
                          </span>
                        </div>
                      </label>
                    )
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  *Trainee/Student rate requires proof of status.
                </p>
              </div>

              {/* Accompanying Person Tickets */}
              <div className="border-t-2 border-gray-100 pt-8">
                <FormLabel className="!text-base mb-3">
                  Accompanying Person Tickets
                </FormLabel>
                <p className="text-sm text-gray-600 mb-2">
                  Accompanying person fee includes breakfast, lunch, and welcome reception.
                </p>
                <p className="text-sm text-amber-600 font-medium mb-5">
                  Note: Accompanying person tickets do NOT include gala dinner. Gala dinner tickets must be purchased separately below.
                </p>

                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-5 border-2 border-amber-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Accompanying Person
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(
                          getAccompanyingPrice(),
                          getCurrency(formData.country)
                        )}{" "}
                        each ({isEarlyBirdPeriod ? "Early Bird" : "Standard"})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            accompanyingPersonCount: Math.max(
                              0,
                              prev.accompanyingPersonCount - 1
                            ),
                          }))
                        }
                        className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                      >
                        −
                      </button>
                      <span
                        className="w-14 text-center font-bold text-2xl"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {formData.accompanyingPersonCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            accompanyingPersonCount: Math.min(
                              10,
                              prev.accompanyingPersonCount + 1
                            ),
                          }))
                        }
                        className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gala Dinner Tickets */}
                <div className="border-t-2 border-gray-100 pt-8 mt-8">
                  <FormLabel className="!text-base mb-3">
                    Gala Dinner Tickets (Optional)
                  </FormLabel>
                  <p className="text-sm text-gray-600 mb-5">
                    Join us for an elegant evening celebration. You can purchase multiple gala dinner tickets.
                  </p>

                  <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-5 border-2 border-yellow-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Gala Dinner Ticket
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(
                            getGalaDinnerPrice(),
                            getCurrency(formData.country)
                          )}{" "}
                          each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              galaDinnerCount: Math.max(
                                0,
                                prev.galaDinnerCount - 1
                              ),
                            }))
                          }
                          className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                        >
                          −
                        </button>
                        <span
                          className="w-14 text-center font-bold text-2xl"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {formData.galaDinnerCount}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              galaDinnerCount: Math.min(
                                20,
                                prev.galaDinnerCount + 1
                              ),
                            }))
                          }
                          className="w-10 h-10 border-2 border-gray-300 rounded-xl bg-white hover:bg-gray-100 font-bold text-xl shadow-sm transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div
                className="rounded-2xl p-6 shadow-lg text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">TOTAL:</span>
                  <span className="text-4xl font-bold">
                    {formatCurrency(getTotalPrice(), getCurrency(formData.country))}
                  </span>
                </div>
                {isKorea(formData.country) && (
                  <p className="text-sm text-blue-100 mt-2 italic">
                    * Includes 10% Korean tax
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                  }}
                >
                  Continue to Registration →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: REGISTRATION FORM */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSubmit}>
            <FormSectionHeader
              icon={
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              Enter Registrant Details
            </FormSectionHeader>
            <div className="p-8">
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={fillExampleData}
                  className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-primary)",
                  }}
                >
                  🔧 Fill Example Data
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <FormLabel>Salutation</FormLabel>
                  <FormInput
                    name="salutation"
                    value={formData.salutation}
                    onChange={handleChange}
                    placeholder="Dr., Mr., Ms., etc."
                  />
                </div>
                <div>
                  <FormLabel>Suffix</FormLabel>
                  <FormInput
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                    placeholder="MD, PhD, etc."
                  />
                </div>
                <div>
                  <FormLabel required>First Name</FormLabel>
                  <FormInput
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel>Middle Name</FormLabel>
                  <FormInput
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <FormLabel required>Last Name</FormLabel>
                  <FormInput
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel required>Institution</FormLabel>
                  <FormInput
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <FormLabel>Department</FormLabel>
                  <FormInput
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Obstetrics & Gynecology"
                  />
                </div>
                <div>
                  <FormLabel>Credentials</FormLabel>
                  <FormInput
                    name="credentials"
                    value={formData.credentials}
                    onChange={handleChange}
                    placeholder="MD, PhD, etc."
                  />
                </div>
                <div>
                  <FormLabel>Badge Name</FormLabel>
                  <FormInput
                    name="badgeName"
                    value={formData.badgeName}
                    onChange={handleChange}
                    placeholder="Name to display on badge"
                  />
                </div>
                <div>
                  <FormLabel>Pronouns</FormLabel>
                  <select
                    name="pronouns"
                    value={formData.pronouns}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">Please select...</option>
                    <option value="he/him">he/him</option>
                    <option value="she/her">she/her</option>
                    <option value="they/them">they/them</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-gray-100 my-8"></div>

              <h5 className="font-bold text-gray-800 mb-5 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Address Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="md:col-span-2">
                  <FormLabel required>Address Line 1</FormLabel>
                  <FormInput
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <FormLabel>Address Line 2</FormLabel>
                  <FormInput
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <FormLabel required>Country</FormLabel>
                  <CountrySelect
                    onChange={(e) => {
                      setCountryid(e.id);
                      setFormData((prev) => ({ ...prev, country: e }));
                      // Reset state and city when country changes
                      setStateid(0);
                      setCityid(0);
                      setFormData((prev) => ({
                        ...prev,
                        state: null,
                        city: null,
                      }));
                    }}
                    placeHolder="Select Country"
                    defaultValue={formData.country}
                    containerClassName="w-full"
                    inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <FormLabel required>State/Province</FormLabel>
                  <StateSelect
                    countryid={countryid}
                    onChange={(e) => {
                      setStateid(e.id);
                      setFormData((prev) => ({ ...prev, state: e }));
                      // Reset city when state changes
                      setCityid(0);
                      setFormData((prev) => ({ ...prev, city: null }));
                    }}
                    placeHolder="Select State"
                    defaultValue={formData.state}
                    containerClassName="w-full"
                    inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <FormLabel required>City</FormLabel>
                  <CitySelect
                    countryid={countryid}
                    stateid={stateid}
                    onChange={(e) => {
                      setCityid(e.id);
                      setFormData((prev) => ({ ...prev, city: e }));
                    }}
                    placeHolder="Select City"
                    defaultValue={formData.city}
                    containerClassName="w-full"
                    inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <FormLabel required>Zip/Postal Code</FormLabel>
                  <FormInput
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="border-t-2 border-gray-100 my-8"></div>

              <h5 className="font-bold text-gray-800 mb-5 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Contact Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <FormLabel>Phone</FormLabel>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={formData.phone}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, phone: value }))
                    }
                    className="phone-input-custom border-2 border-gray-200 rounded-xl bg-white focus-within:border-blue-500"
                  />
                </div>
                <div>
                  <FormLabel required>Cell Phone</FormLabel>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={formData.cellPhone}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, cellPhone: value }))
                    }
                    className="phone-input-custom border-2 border-gray-200 rounded-xl bg-white focus-within:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <FormLabel required>Email</FormLabel>
                  <FormInput
                    name="email"
                    value={formData.email}
                    readOnly
                    className="!bg-gray-100"
                  />
                </div>
              </div>

              {/* Policies Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-200 mt-8">
                <h5 className="font-bold text-gray-800 mb-4">
                  ISIR Event Policies
                </h5>
                <FormCheckbox
                  name="policyAgreed"
                  checked={formData.policyAgreed}
                  onChange={handleChange}
                  required
                  label={
                    <span>
                      I have reviewed and agree to the{" "}
                      <a
                        href="#"
                        className="text-blue-600 underline font-semibold hover:text-blue-800"
                      >
                        ISIR Event Policies
                      </a>
                    </span>
                  }
                />
                <FormCheckbox
                  name="privacyMarketing"
                  checked={formData.privacyMarketing}
                  onChange={handleChange}
                  label="I agree to share my contact information with ISIR for marketing and promotions."
                />
                <FormCheckbox
                  name="privacyApp"
                  checked={formData.privacyApp}
                  onChange={handleChange}
                  label="I would like to appear on the 2026 attendee list on the event website and app."
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between p-6 bg-gray-50 border-t-2 border-gray-200">
              <button
                type="button"
                className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                onClick={() => setStep(2)}
              >
                ← Back to Tickets
              </button>
              <button
                type="submit"
                className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                }}
              >
                Continue to Payment →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: PAYMENT */}
      {step === 4 && (
        <div className="animate-in slide-in-from-right duration-300 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <FormSectionHeader
              icon={
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
            >
              Order Summary
            </FormSectionHeader>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-base py-3 border-b border-gray-200">
                  <span className="text-gray-700">
                    {ticketPrices[formData.ticketType]?.label}{" "}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isEarlyBirdPeriod
                          ? "#dcfce7"
                          : "#fef3c7",
                        color: isEarlyBirdPeriod ? "#166534" : "#92400e",
                      }}
                    >
                      {isEarlyBirdPeriod ? "Early Bird" : "Standard"}
                    </span>
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(getTicketPrice(formData.ticketType), currency)}
                  </span>
                </div>
                {formData.accompanyingPersonCount > 0 && (
                  <div className="flex justify-between text-base py-3 border-b border-gray-200">
                    <span className="text-gray-700">
                      Accompanying Person × {formData.accompanyingPersonCount}
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        getAccompanyingPrice() * formData.accompanyingPersonCount,
                        currency
                      )}
                    </span>
                  </div>
                )}
                {formData.galaDinnerCount > 0 && (
                  <div className="flex justify-between text-base py-3 border-b border-gray-200">
                    <span className="text-gray-700">
                      Gala Dinner × {formData.galaDinnerCount}
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        getGalaDinnerPrice() * formData.galaDinnerCount,
                        currency
                      )}
                    </span>
                  </div>
                )}
                {isKoreanCustomer && (
                  <div className="text-xs text-gray-500 italic pt-2">
                    * Prices include 10% Korean tax
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-4 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">
                      TOTAL
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {formatCurrency(getTotalPrice(), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <FormSectionHeader
              icon={
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              }
            >
              Payment Information
            </FormSectionHeader>
            <div className="p-8">
              {clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                    },
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={getStripeAmount()}
                    currency={currency}
                    onSuccess={(paymentIntent) => {
                      console.log("Payment succeeded:", paymentIntent);
                      setIsProcessingPayment(false);
                      setStep(5);
                    }}
                    onError={(error) => {
                      console.error("Payment error:", error);
                      setIsProcessingPayment(false);
                      alert(
                        error.message ||
                          "Payment failed. Please try again or contact support@theisir.org"
                      );
                    }}
                    isProcessing={isProcessingPayment}
                    setIsProcessing={setIsProcessingPayment}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-600">Setting up secure payment...</p>
                </div>
              )}

              <div className="flex justify-start pt-8 mt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                  onClick={() => setStep(3)}
                >
                  ← Back to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRMATION */}
      {step === 5 && (
        <div className="animate-in fade-in zoom-in duration-500">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-10 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">
                Registration Successful!
              </h3>
              <p className="text-green-100 text-lg">
                Thank you for registering for the ISIR 2026 World Congress
              </p>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 space-y-5">
                <h4 className="font-bold text-xl text-gray-800 border-b-2 border-gray-200 pb-3">
                  Registration Summary
                </h4>

                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Attendee
                  </p>
                  <p className="text-gray-800 font-medium text-lg">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-gray-600">{formData.email}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-500 mb-3">
                    Ticket Details
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {ticketPrices[formData.ticketType]?.label}{" "}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isEarlyBirdPeriod
                              ? "#dcfce7"
                              : "#fef3c7",
                            color: isEarlyBirdPeriod ? "#166534" : "#92400e",
                          }}
                        >
                          {isEarlyBirdPeriod ? "Early Bird" : "Standard"}
                        </span>
                      </span>
                      <span className="font-bold">
                        {formatCurrency(
                          getTicketPrice(formData.ticketType),
                          currency
                        )}
                      </span>
                    </div>
                    {formData.accompanyingPersonCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Accompanying Person ×{" "}
                          {formData.accompanyingPersonCount}
                        </span>
                        <span className="font-bold">
                          {formatCurrency(
                            getAccompanyingPrice() *
                              formData.accompanyingPersonCount,
                            currency
                          )}
                        </span>
                      </div>
                    )}
                    {formData.galaDinnerCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          Gala Dinner × {formData.galaDinnerCount}
                        </span>
                        <span className="font-bold">
                          {formatCurrency(
                            getGalaDinnerPrice() * formData.galaDinnerCount,
                            currency
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">
                      Total Amount Paid
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {formatCurrency(getTotalPrice(), currency)}
                    </span>
                  </div>
                  {isKoreanCustomer && (
                    <p className="text-xs text-gray-500 italic mt-2">
                      * Includes 10% Korean tax
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <p className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Next Steps
                </p>
                <ul className="text-gray-700 space-y-3 ml-7 list-disc">
                  <li>
                    A confirmation email has been sent to{" "}
                    <strong>{formData.email}</strong>
                  </li>
                  <li>Your payment has been processed successfully</li>
                  <li>Your registration is now confirmed</li>
                  <li>You will receive additional event details via email</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button
                  type="button"
                  className="px-8 py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                  }}
                  onClick={() => window.print()}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Confirmation
                </button>
                <button
                  type="button"
                  className="px-8 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold transition-all text-base"
                  onClick={onClose}
                >
                  Return to Registration Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </Elements>
  );
};

export default RegistrationForm;
