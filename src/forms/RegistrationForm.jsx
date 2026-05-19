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
import {
  CONGRESS_DAYPASS_DAYS,
  CONGRESS_WEEKEND_MEALS,
  DAY_PASS_GALA_DAY,
  DAY_PASS_OPENING_RECEPTION_DAY,
  effectiveMealDayKeys,
  formatCongressMealDayList,
  ISIR_API_CONFIG,
  isPreviewMode,
  isSouthKoreaResidenceCountry,
  pruneRegistrationMeals,
  selectedDayPassCongressDayKeys,
  PREVIEW_KEY,
  PREVIEW_REGISTRATION_TEST_USD,
} from "../config/constants";
import {
  getCurrency,
  getFinalPrice,
  formatCurrency,
} from "../utils/currency";
import PaymentForm from "../components/PaymentForm";
import { pdf } from "@react-pdf/renderer";
import RegistrationConfirmationPDF from "../components/RegistrationConfirmationPDF";
import TraineeLetterUpload from "../components/TraineeLetterUpload";

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
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
const StepIndicator = ({
  currentStep,
  totalSteps = 5,
  isTraineeFlow = false,
}) => {
  const steps = isTraineeFlow
    ? [
        { num: 1, label: "Verify" },
        { num: 2, label: "Tickets" },
        { num: 3, label: "Letter" },
        { num: 4, label: "Details" },
        { num: 5, label: "Payment" },
        { num: 6, label: "Confirm" },
      ]
    : [
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
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
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
  const [speakerInvite, setSpeakerInvite] = useState({
    token: "",
    email: "",
    status: "idle", // idle | verifying | valid | invalid
    error: "",
  });
  const [speakerEligible, setSpeakerEligible] = useState({
    status: "idle", // idle | checking | eligible | ineligible | error
    error: "",
  });
  const [discountCodeStatus, setDiscountCodeStatus] = useState({
    state: "idle", // idle | checking | valid | invalid | error
    amountUsd: null,
    error: "",
  });
  const isVerifiedMember = React.useMemo(() => {
    if (!membershipData) return false;
    // Only consider verified if is_member is true AND membership_level is not "Non-Member"
    const level = (membershipData.membership_level || "").toLowerCase();
    const isNonMemberLevel =
      level.includes("non-member") ||
      level.includes("non member") ||
      level === "none" ||
      !membershipData.has_membership;

    return membershipData.is_member === true && !isNonMemberLevel;
  }, [membershipData]);
  const isTrainee = React.useMemo(
    () => membershipData?.is_trainee === true,
    [membershipData],
  );

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
    city: "",
    state: null,
    zip: "",
    country: null,
    officePhone: "",
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
    mealAttendance: {
      lunch: {
        Friday: false,
        Saturday: false,
        Sunday: false,
      },
      breakfast: {
        Friday: false,
        Saturday: false,
        Sunday: false,
      },
    },
    dayPassDays: {
      Thursday: false,
      Friday: false,
      Saturday: false,
      Sunday: false,
    },
    openingReceptionAttending: false,
    galaDinnerAttending: false,
    specialAssistance: false,
    policyAgreed: false,
    privacyMarketing: false,
    privacyApp: false,
    optOutMailing: false,
    discountCode: "",
    // Trainee letter upload data
    traineeLetterFile: null,
    traineeLetterUrl: null,
  });

  // Speaker invite: if ?invite=TOKEN is present, verify and enable free speaker flow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = (params.get("invite") || "").trim();
    if (!token) return;

    let cancelled = false;
    (async () => {
      setSpeakerInvite((prev) => ({
        ...prev,
        token,
        status: "verifying",
        error: "",
      }));
      try {
        const res = await fetch(
          `/api/speaker-invites/verify?token=${encodeURIComponent(token)}`,
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success || !json?.email) {
          throw new Error(json?.error || "Invalid invite link");
        }
        const email = String(json.email).trim().toLowerCase();
        if (cancelled) return;

        setSpeakerInvite({ token, email, status: "valid", error: "" });
        setMembershipData({
          email_registered: true,
          has_membership: false,
          is_member: false,
          membership_level: "Invited Speaker",
          membership_status: "N/A",
          api_message: "Invited speaker link verified",
        });
        setFormData((prev) => ({
          ...prev,
          email,
          ticketType: "invited-speaker",
        }));

        // Jump to ticket selection (step 2) when opening an invite link
        setStep(2);
      } catch (e) {
        console.error("Invite verification failed:", e);
        if (cancelled) return;
        setSpeakerInvite((prev) => ({
          ...prev,
          status: "invalid",
          error: e?.message || "Invite verification failed",
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Check if selected ticket is a trainee/student type
  const isTraineeTicket = React.useMemo(() => {
    return (
      formData.ticketType === "trainee-member" ||
      formData.ticketType === "trainee-non-member"
    );
  }, [formData.ticketType]);

  // Calculate total steps based on ticket type
  const totalSteps = isTraineeTicket ? 6 : 5;

  // Map actual step to display step (for non-trainee flow, skip step 3)
  const getDisplayStep = (actualStep) => {
    if (!isTraineeTicket && actualStep >= 3) {
      return actualStep - 1;
    }
    return actualStep;
  };

  const withPrunedMeals = (prev) => ({
    ...prev,
    ...pruneRegistrationMeals({
      ticketType: prev.ticketType,
      dayPassDays: prev.dayPassDays,
      mealAttendance: prev.mealAttendance,
      openingReceptionAttending: prev.openingReceptionAttending,
      galaDinnerAttending: prev.galaDinnerAttending,
    }),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("dayPass_")) {
      const day = name.replace("dayPass_", "");
      setFormData((prev) => {
        const nextDayPass = { ...prev.dayPassDays, [day]: checked };
        const upd = { ...prev, dayPassDays: nextDayPass };
        if (!checked) {
          upd.mealAttendance = {
            ...prev.mealAttendance,
            lunch: { ...prev.mealAttendance.lunch, [day]: false },
            breakfast: { ...prev.mealAttendance.breakfast, [day]: false },
          };
        }
        if (day === DAY_PASS_OPENING_RECEPTION_DAY && !checked) {
          upd.openingReceptionAttending = false;
        }
        if (day === DAY_PASS_GALA_DAY && !checked) {
          upd.galaDinnerAttending = false;
        }
        return withPrunedMeals(upd);
      });
      return;
    }
    if (name.startsWith("dietary_")) {
      const key = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        dietary: { ...prev.dietary, [key]: checked },
      }));
    } else if (name.startsWith("meal_")) {
      const [, mealType, day] = name.split("_");
      if (
        formData.ticketType === "korea-day-pass" &&
        !formData.dayPassDays[day]
      ) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        mealAttendance: {
          ...prev.mealAttendance,
          [mealType]: {
            ...prev.mealAttendance[mealType],
            [day]: checked,
          },
        },
      }));
    } else if (name === "ticketType") {
      setFormData((prev) =>
        withPrunedMeals({
          ...prev,
          ticketType: value,
          accompanyingPersonCount:
            value === "korea-day-pass" ? 0 : prev.accompanyingPersonCount,
          dayPassDays:
            value === "korea-day-pass"
              ? prev.dayPassDays
              : {
                  Thursday: false,
                  Friday: false,
                  Saturday: false,
                  Sunday: false,
                },
        }),
      );
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
    setSpeakerEligible({ status: "checking", error: "" });

    // Declared outside `try` so `catch` can read it (block-scoped `const` in `try` is not visible in `catch`).
    let eligibleByEmail = false;

    try {
      // Check invited-speaker eligibility by email (works without invite link)
      const emailCheck = await fetch(
        `/api/speaker-invites/check?email=${encodeURIComponent(formData.email)}`,
      );
      const emailCheckJson = await emailCheck.json().catch(() => ({}));
      eligibleByEmail = Boolean(
        emailCheckJson?.success && emailCheckJson?.eligible,
      );
      setSpeakerEligible({
        status: eligibleByEmail ? "eligible" : "ineligible",
        error: "",
      });

      const response = await fetch(ISIR_API_CONFIG.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ISIR-API-Key": ISIR_API_CONFIG.apiKey,
        },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      // Persist the entire "data" payload, plus top-level flags we care about.
      // We use `is_member` (active membership + name match) to gate member discounts.
      setMembershipData({
        ...(data.data || {}),
        is_member: Boolean(data.is_member),
        api_message: data.message,
      });

      // Allow both members and non-members to proceed to ticket selection
      // Non-members will see member pricing but won't be able to select member tickets
      if (!data.data.email_registered) {
        if (eligibleByEmail) {
          // Invited speaker can proceed even without ISIR membership account
          setMembershipData({
            email_registered: true,
            has_membership: false,
            is_member: false,
            membership_level: "Invited Speaker",
            membership_status: "N/A",
            api_message: "Invited speaker email verified",
          });
          setFormData((prev) => ({ ...prev, ticketType: "invited-speaker" }));
          // Go to ticket selection so they can confirm accompanying persons
          setStep(2);
        } else {
          setVerificationError(
            "No account found with this email address. Please check your email or register at theisir.org first.",
          );
        }
      } else {
        // Invite-eligible users with existing ISIR accounts should still enter invited-speaker flow.
        if (eligibleByEmail) {
          setFormData((prev) => ({ ...prev, ticketType: "invited-speaker" }));
        }
        // Proceed to ticket selection for both members and non-members
        setStep(2);
      }
    } catch (error) {
      console.error("Verification error:", error);
      // If membership API is down but invite-by-email is eligible, allow speaker flow
      if (eligibleByEmail) {
        setMembershipData({
          email_registered: true,
          has_membership: false,
          is_member: false,
          membership_level: "Invited Speaker",
          membership_status: "N/A",
          api_message: "Invited speaker email verified",
        });
        setFormData((prev) => ({ ...prev, ticketType: "invited-speaker" }));
        // Go to ticket selection even if membership API failed
        setStep(2);
      } else {
        setVerificationError(
          "Unable to verify membership. Please try again or contact support@isir2026.org",
        );
        setSpeakerEligible({ status: "error", error: error?.message || "" });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTicketSelection = (e) => {
    e.preventDefault();
    if (isInvitedSpeakerMode && !formData.ticketType) {
      setFormData((prev) => ({ ...prev, ticketType: "invited-speaker" }));
      setStep(4); // Skip trainee letter step for invited speakers
      return;
    }
    if (!formData.ticketType) {
      alert("Please select a ticket type.");
      return;
    }

    if (formData.ticketType === "korea-day-pass") {
      const dayCount = CONGRESS_DAYPASS_DAYS.filter(
        ({ key }) => formData.dayPassDays[key],
      ).length;
      if (dayCount === 0) {
        alert("Select at least one congress day for your day pass.");
        return;
      }
    }

    // Validate that the selected ticket is allowed for this user
    const memberTicketIds = ["isir-member", "trainee-member"];
    if (!isVerifiedMember && memberTicketIds.includes(formData.ticketType)) {
      alert(
        "ISIR membership is required to select this ticket type. Please join or log in with your member email.",
      );
      return;
    }

    if (membershipData?.ticket_options?.available_tickets) {
      const selectedTicket =
        membershipData.ticket_options.available_tickets.find(
          (ticket) => ticket.id === formData.ticketType,
        );
      if (selectedTicket) {
        const requiresMembership = selectedTicket.requires_membership === true;
        const apiAvailable = selectedTicket.available !== false;
        const finalAvailable =
          apiAvailable && (!requiresMembership || isVerifiedMember);

        if (!finalAvailable) {
          alert(
            selectedTicket.unavailable_reason ||
              (requiresMembership && !isVerifiedMember
                ? "ISIR membership verification required to select this ticket type."
                : "This ticket type is not available for your membership status."),
          );
          return;
        }
      }
    }

    // Check if trainee ticket - go to letter upload step (3)
    // Otherwise skip to details step (4 for trainee flow mapping, but actually 3 for non-trainee)
    const isTraineeType =
      formData.ticketType === "trainee-member" ||
      formData.ticketType === "trainee-non-member";

    if (isTraineeType) {
      setStep(3); // Go to letter upload
    } else {
      setStep(4); // Skip to details (step 4 in trainee flow = step 3 for non-trainee)
    }
  };

  // Handle trainee letter upload step submission
  const handleLetterSubmit = (e) => {
    e.preventDefault();
    if (!formData.traineeLetterUrl) {
      alert(
        "Please upload your trainee/student verification letter to continue.",
      );
      return;
    }
    setStep(4); // Proceed to details
  };

  // Handle trainee letter upload completion
  const handleLetterUploadComplete = (fileData) => {
    setFormData((prev) => ({
      ...prev,
      traineeLetterFile: fileData,
      traineeLetterUrl: fileData?.fileUrl || null,
    }));
  };

  // Handle trainee letter upload error
  const handleLetterUploadError = (error) => {
    console.error("Letter upload error:", error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.ticketType === "korea-day-pass") {
      if (!isSouthKoreaResidenceCountry(formData.country)) {
        alert(
          "Daypass (Korean locals only) requires Country: South Korea. Please update your country or choose another ticket.",
        );
        return;
      }
      const dayCount = CONGRESS_DAYPASS_DAYS.filter(
        ({ key }) => formData.dayPassDays[key],
      ).length;
      if (dayCount === 0) {
        alert("Select at least one congress day for your day pass.");
        return;
      }
    }
    if (!formData.officePhone && !formData.cellPhone) {
      alert("Please provide at least one phone number (office or cell).");
      return;
    }
    if (hasDiscountCodeAttempt && discountCodeStatus.state === "checking") {
      alert("Checking discount code... please wait a moment.");
      return;
    }
    if (hasDiscountCodeAttempt && !hasValidDiscountCode) {
      alert(
        discountCodeStatus.error ||
          "The discount code is invalid. Please correct it or remove it to continue.",
      );
      return;
    }
    console.log("Registration Info:", formData);
    const invitedSpeakerFlow = formData.ticketType === "invited-speaker";
    const totalNow = getTotalPrice();
    const previewFreeRegistration = isPreviewMode() && totalNow === 0;

    // Invited speakers and $0 preview: skip Stripe
    if (
      ((invitedSpeakerFlow && totalNow === 0) || previewFreeRegistration) &&
      !hasDiscountCodeAttempt
    ) {
      (async () => {
        try {
          setIsProcessingPayment(true);
          const registerResponse = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              phone: formData.officePhone,
              ...previewRegisterPayload,
              discountCode: hasValidDiscountCode ? enteredDiscountCode : null,
              inviteToken:
                speakerInvite.status === "valid"
                  ? speakerInvite.token
                  : undefined,
              membershipLevel: membershipData?.membership_level || null,
              membershipStatus: membershipData?.membership_status || null,
              traineeLetterUrl: formData.traineeLetterUrl || null,
            }),
          });
          const registerResult = await registerResponse.json();
          if (!registerResponse.ok || !registerResult.success) {
            throw new Error(
              registerResult.error || "Failed to save registration",
            );
          }
          setRegistrationId(registerResult.registrationId);
          setFormData((prev) => ({
            ...prev,
            registrationId: registerResult.registrationId,
          }));
          setStep(6);
        } catch (err) {
          console.error("Registration completion error:", err);
          alert(
            err?.message ||
              "There was an error completing registration. Please try again or contact support@isir2026.org",
          );
        } finally {
          setIsProcessingPayment(false);
        }
      })();
      return;
    }

    setStep(5); // Go to payment step
  };

  const [registrationId, setRegistrationId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Clear member ticket selection for non-members when entering ticket selection step
  useEffect(() => {
    const verifiedMember = isVerifiedMember;
    const current = formData.ticketType;
    const memberTickets = ["isir-member", "trainee-member"];

    // Determine if current selection should be cleared based on visibility rules
    const isTraineeMemberTicket = current === "trainee-member";
    const isMemberOnlyTicket = memberTickets.includes(current);

    if (step === 2 && membershipData) {
      // Hide trainee tickets from non-trainee users
      if (!isTrainee && isTraineeMemberTicket) {
        setFormData((prev) => ({ ...prev, ticketType: "" }));
        return;
      }
      // Hide member-only tickets if not verified member
      if (!verifiedMember && isMemberOnlyTicket) {
        setFormData((prev) => ({ ...prev, ticketType: "" }));
        return;
      }
    }
  }, [step, membershipData, isTrainee, isVerifiedMember, formData.ticketType]);

  // Create payment intent when entering payment step (step 5 in new flow)
  useEffect(() => {
    if (step === 5 && !clientSecret && formData.country) {
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
          phone: formData.officePhone,
          ...previewRegisterPayload,
          discountCode: hasValidDiscountCode ? enteredDiscountCode : null,
          inviteToken:
            formData.ticketType === "invited-speaker" &&
            speakerInvite.status === "valid"
              ? speakerInvite.token
              : undefined,
          membershipLevel: membershipData?.membership_level || null,
          membershipStatus: membershipData?.membership_status || null,
          traineeLetterUrl: formData.traineeLetterUrl || null,
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
        throw new Error(
          paymentResult.error || "Failed to create payment intent",
        );
      }

      setClientSecret(paymentResult.clientSecret);
    } catch (error) {
      console.error("Payment setup error:", error);
      const msg = String(error?.message || "");
      if (msg.toLowerCase().includes("already exists")) {
        alert(msg);
        return;
      }
      alert(
        "There was an error setting up payment. Please try again or contact support@isir2026.org",
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
      setStep(6); // Go to confirmation step
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        "There was an error processing your payment. Please try again or contact support@isir2026.org",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getTicketLabel = () => {
    if (membershipData?.ticket_options?.available_tickets) {
      const t = membershipData.ticket_options.available_tickets.find(
        (x) => x.id === formData.ticketType,
      );
      return (
        t?.label ||
        ticketPrices[formData.ticketType]?.label ||
        formData.ticketType
      );
    }
    return ticketPrices[formData.ticketType]?.label || formData.ticketType;
  };

  const renderOrderTicketLabel = () => {
    if (formData.ticketType === "korea-day-pass") {
      return (
        <>
          Daypass{" "}
          <span className="text-sm text-gray-600 font-normal">
            (Korean locals only)
          </span>
        </>
      );
    }
    return (
      ticketPrices[formData.ticketType]?.label || formData.ticketType || ""
    );
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const ticketLabel = getTicketLabel();
      const selectedLunchDays = effectiveMealDayKeys(
        formData.mealAttendance.lunch,
        formData.ticketType,
        formData.dayPassDays,
      );
      const selectedBreakfastDays = effectiveMealDayKeys(
        formData.mealAttendance.breakfast,
        formData.ticketType,
        formData.dayPassDays,
      );
      const lunchDisplay =
        selectedLunchDays.length > 0
          ? formatCongressMealDayList(selectedLunchDays)
          : "Not selected";
      const breakfastDisplay =
        selectedBreakfastDays.length > 0
          ? formatCongressMealDayList(selectedBreakfastDays)
          : "Not selected";
      const qrId = registrationId ? String(registrationId).trim() : "";
      const qrCodeUrl = qrId
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrId)}`
        : undefined;
      const doc = (
        <RegistrationConfirmationPDF
          attendeeName={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
          email={formData.email}
          ticketLabel={ticketLabel}
          ticketBadge={isEarlyBirdPeriod ? "Early Bird" : "Standard"}
          ticketPrice={formatCurrency(
            getTicketPrice(formData.ticketType),
            currency,
          )}
          accompanyingLabel={
            formData.accompanyingPersonCount > 0
              ? `Accompanying Person × ${formData.accompanyingPersonCount}`
              : null
          }
          accompanyingPrice={
            formData.accompanyingPersonCount > 0
              ? formatCurrency(
                  getAccompanyingPrice() * formData.accompanyingPersonCount,
                  currency,
                )
              : null
          }
          galaLabel={null}
          galaPrice={null}
          totalLabel="Total Amount Paid"
          totalAmount={formatCurrency(getTotalPrice(), currency)}
          taxNote={null}
          lunchAttendanceLabel={
            lunchDisplay
          }
          breakfastAttendanceLabel={
            breakfastDisplay
          }
          openingReceptionAttendanceLabel={
            formData.ticketType === "korea-day-pass" &&
            !formData.dayPassDays[DAY_PASS_OPENING_RECEPTION_DAY]
              ? "Not applicable"
              : formData.openingReceptionAttending
                ? "Attending"
                : "Not attending"
          }
          galaDinnerAttendanceLabel={
            formData.ticketType === "korea-day-pass" &&
            !formData.dayPassDays[DAY_PASS_GALA_DAY]
              ? "Not applicable"
              : formData.galaDinnerAttending
                ? "Attending"
                : "Not attending"
          }
          qrCodeUrl={qrCodeUrl}
          registrationId={registrationId ?? undefined}
          paymentId={paymentIntent?.id ?? undefined}
          generatedDate={new Date().toLocaleString()}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ISIR-2026-Registration-Confirmation-${formData.lastName || "confirmation"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again or use Print.");
    } finally {
      setIsGeneratingPdf(false);
    }
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
    "invited-speaker": { early: 0, standard: 0, label: "Invited Speaker" },
    "korea-day-pass": {
      early: 150,
      standard: 200,
      label: "Daypass (Korean locals only)",
    },
  };
  const isInvitedSpeakerMode =
    formData.ticketType === "invited-speaker" ||
    speakerInvite.status === "valid" ||
    speakerEligible.status === "eligible";

  const currency = getCurrency();

  /** Matches server: flat test charge when URL has ?preview=PREVIEW_KEY */
  const isPreviewRegistrationTest = isPreviewMode();

  const previewRegisterPayload = isPreviewRegistrationTest
    ? { previewKey: PREVIEW_KEY }
    : {};
  const enteredDiscountCode = (formData.discountCode || "").trim();
  const hasDiscountCodeAttempt = enteredDiscountCode.length > 0;
  const hasValidDiscountCode = discountCodeStatus.state === "valid";
  const verifiedDiscountTotalUsd = Number(discountCodeStatus.amountUsd || 175);

  useEffect(() => {
    if (!hasDiscountCodeAttempt) {
      setDiscountCodeStatus({ state: "idle", amountUsd: null, error: "" });
      return;
    }
    let cancelled = false;
    setDiscountCodeStatus((prev) => ({
      state: "checking",
      amountUsd: prev.amountUsd,
      error: "",
    }));
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/discount-code/verify?code=${encodeURIComponent(enteredDiscountCode)}`,
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Failed to verify discount code");
        }
        if (json.valid) {
          setDiscountCodeStatus({
            state: "valid",
            amountUsd: Number(json.amountUsd || 175),
            error: "",
          });
        } else {
          setDiscountCodeStatus({
            state: "invalid",
            amountUsd: null,
            error: json.error || "Invalid discount code",
          });
        }
      } catch (error) {
        if (cancelled) return;
        setDiscountCodeStatus({
          state: "error",
          amountUsd: null,
          error:
            error?.message ||
            "Could not verify discount code. Please try again.",
        });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enteredDiscountCode, hasDiscountCodeAttempt]);

  const getTicketPrice = (type, inBaseCurrency = false) => {
    if (!type) return 0;
    if (type === "invited-speaker") return 0;

    if (type === "korea-day-pass") {
      const n = CONGRESS_DAYPASS_DAYS.filter(
        ({ key }) => formData.dayPassDays[key],
      ).length;
      if (n === 0) return 0;
      const perDay = isEarlyBirdPeriod
        ? ticketPrices["korea-day-pass"].early
        : ticketPrices["korea-day-pass"].standard;
      const subtotal = n * perDay;
      if (inBaseCurrency) return subtotal;
      return getFinalPrice(subtotal);
    }

    // Try to get price from API data first
    if (membershipData?.ticket_options?.available_tickets) {
      const ticket = membershipData.ticket_options.available_tickets.find(
        (t) => t.id === type,
      );
      if (ticket && ticket.current_price !== undefined) {
        const basePrice = ticket.current_price;
        if (inBaseCurrency) return basePrice;
        return getFinalPrice(basePrice);
      }
    }

    // Fallback to hardcoded prices
    if (!ticketPrices[type]) return 0;
    const basePrice = isEarlyBirdPeriod
      ? ticketPrices[type].early
      : ticketPrices[type].standard;

    if (inBaseCurrency) return basePrice;
    return getFinalPrice(basePrice);
  };

  const getAccompanyingPrice = (inBaseCurrency = false) => {
    // Speakers can still add accompanying persons; those are paid
    // Try to get price from API data first
    if (membershipData?.ticket_options?.accompanying) {
      const basePrice =
        membershipData.ticket_options.accompanying.current_price ||
        (isEarlyBirdPeriod
          ? membershipData.ticket_options.accompanying.early_price
          : membershipData.ticket_options.accompanying.standard_price);
      if (inBaseCurrency) return basePrice;
      return getFinalPrice(basePrice);
    }

    // Fallback to hardcoded prices
    const basePrice = isEarlyBirdPeriod ? 250 : 350;
    if (inBaseCurrency) return basePrice;
    return getFinalPrice(basePrice);
  };

  const getTotalPrice = (inBaseCurrency = false) => {
    if (isPreviewRegistrationTest) {
      if (inBaseCurrency) return PREVIEW_REGISTRATION_TEST_USD;
      return getFinalPrice(PREVIEW_REGISTRATION_TEST_USD);
    }
    // Mirror the server's flat discount pricing so checkout totals are not alarming.
    if (hasValidDiscountCode) {
      if (inBaseCurrency) return verifiedDiscountTotalUsd;
      return getFinalPrice(verifiedDiscountTotalUsd);
    }
    const ticketPrice = getTicketPrice(formData.ticketType, inBaseCurrency);
    const accompanyingPrice =
      getAccompanyingPrice(inBaseCurrency) * formData.accompanyingPersonCount;
    return ticketPrice + accompanyingPrice;
  };

  // Get price for Stripe (USD cents)
  const getStripeAmount = () => {
    const total = getTotalPrice();
    return Math.round(total * 100);
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
                {step === 3 && isTraineeTicket && "Upload Verification Letter"}
                {step === 4 && "Registration Details"}
                {step === 5 && "Secure Payment"}
                {step === 6 && "Registration Complete!"}
              </h3>
              <p className="text-gray-600">ISIR 2026 World Congress</p>
            </div>
          </div>
          {step !== 6 && (
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

        {isPreviewRegistrationTest && (
          <div
            className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-sm leading-relaxed"
            role="status"
          >
            <strong className="font-semibold">Preview mode:</strong>{" "}
            {PREVIEW_REGISTRATION_TEST_USD <= 0 ? (
              <>
                registration completes with no payment. Ticket lines may still
                show list prices for display; your saved registration total is
                $0.
              </>
            ) : (
              <>
                checkout uses a test charge of{" "}
                {formatCurrency(PREVIEW_REGISTRATION_TEST_USD, "USD")}. Ticket
                lines elsewhere may still show list prices; Stripe will only
                charge the test total.
              </>
            )}
          </div>
        )}

        {/* Step Progress */}
        <StepIndicator currentStep={step} isTraineeFlow={isTraineeTicket} />

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
                Please provide your name and email address to verify your
                account or eligibility before continuing to the registration
                form.
              </p>
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
                    readOnly={speakerInvite.status === "valid"}
                    required
                  />
                  {speakerInvite.status === "valid" && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Invited speaker link verified. Email is locked.
                    </p>
                  )}
                  {speakerInvite.status !== "valid" &&
                    speakerEligible.status === "eligible" && (
                      <p className="mt-1 text-xs text-emerald-700">
                        This email is on the invited speaker list. You can
                        register for free.
                      </p>
                    )}
                  {speakerInvite.status === "invalid" &&
                    speakerInvite.error && (
                      <p className="mt-1 text-xs text-red-700">
                        Invite link error: {speakerInvite.error}
                      </p>
                    )}
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
              {/* Early Bird Status */}
              {(() => {
                const apiEarlyBird =
                  membershipData?.ticket_options?.is_early_bird ??
                  isEarlyBirdPeriod;
                const earlyBirdDeadline =
                  membershipData?.ticket_options?.early_bird_deadline ||
                  "July 10, 2026";

                return (
                  <div
                    className={`${
                      apiEarlyBird
                        ? "bg-green-50 border-green-300"
                        : "bg-amber-50 border-amber-300"
                    } border-2 rounded-xl p-5 mb-8`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          apiEarlyBird ? "bg-green-500" : "bg-amber-500"
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
                          {apiEarlyBird
                            ? "🎉 Early Bird Pricing Available!"
                            : "Early Bird Pricing Has Ended"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {apiEarlyBird
                            ? `Register by ${earlyBirdDeadline} to get early bird rates.`
                            : `Standard pricing applies (Early bird ended ${earlyBirdDeadline}).`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handleTicketSelection} className="space-y-8">
                {/* Ticket Type Selection */}
                <div>
                  <FormLabel required className="!text-base mb-4">
                    Select Your Ticket Type
                  </FormLabel>

                  {/* Membership Status Banner */}
                  {membershipData && (
                    <div
                      className={`mb-4 p-4 rounded-xl border-2 ${
                        isVerifiedMember
                          ? "bg-green-50 border-green-300"
                          : "bg-amber-50 border-amber-300"
                      }`}
                    >
                      <div className="flex items-start">
                        {isVerifiedMember ? (
                          <>
                            <svg
                              className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="font-semibold text-green-800 text-sm">
                                ISIR Member Verified
                              </p>
                              <p className="text-green-700 text-xs mt-1">
                                You have access to member pricing.
                                {membershipData.membership_level &&
                                  !membershipData.membership_level
                                    .toLowerCase()
                                    .includes("non-member") &&
                                  ` Membership: ${membershipData.membership_level}`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="font-semibold text-amber-800 text-sm">
                                Non-Member Registration
                              </p>
                              <p className="text-amber-700 text-xs mt-1">
                                Member prices are shown for reference. Verify
                                membership (name + email) to unlock member
                                tickets, or join ISIR to access member pricing.
                              </p>
                              {membershipData.membership_level && (
                                <p className="text-amber-700 text-xs mt-1">
                                  Status: {membershipData.membership_level}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

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
                    {isInvitedSpeakerMode ? (
                      <div className="grid grid-cols-3 bg-blue-100 ring-2 ring-blue-500 ring-inset">
                        <div className="p-5 flex items-center gap-3">
                          <input
                            type="radio"
                            name="ticketType"
                            value="invited-speaker"
                            checked
                            readOnly
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800">
                              Invited Speaker
                            </span>
                            <div className="mt-1 text-xs text-gray-600">
                              Speaker registration is complimentary.
                            </div>
                          </div>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span
                            className="text-xl font-bold"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {formatCurrency(0, getCurrency())}
                          </span>
                        </div>
                        <div className="p-5 text-center flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-500">
                            {formatCurrency(0, getCurrency())}
                          </span>
                        </div>
                      </div>
                    ) : membershipData?.ticket_options?.available_tickets ? (
                      (() => {
                        const filteredApiTickets =
                          membershipData.ticket_options.available_tickets.filter(
                            (ticket) => {
                              if (ticket.id === "trainee-member" && !isTrainee) {
                                return false;
                              }
                              if (
                                isVerifiedMember &&
                                (ticket.id === "non-member" ||
                                  ticket.id === "trainee-non-member")
                              ) {
                                return false;
                              }
                              return true;
                            },
                          );
                        const apiTicketsWithDayPass = filteredApiTickets.some(
                          (t) => t.id === "korea-day-pass",
                        )
                          ? filteredApiTickets
                          : [
                              ...filteredApiTickets,
                              {
                                id: "korea-day-pass",
                                label: "Daypass (Korean locals only)",
                                requires_membership: false,
                                available: true,
                                current_price: 150,
                                early_price: 150,
                                standard_price: 200,
                              },
                            ];
                        return apiTicketsWithDayPass.map((ticket, index) => {
                          const verifiedMember = isVerifiedMember;
                          const requiresMembership =
                            ticket.requires_membership === true;
                          const apiAvailable = ticket.available !== false;
                          const isAvailable =
                            apiAvailable &&
                            (!requiresMembership || verifiedMember);
                          const isSelected = formData.ticketType === ticket.id;

                          return (
                            <div
                              key={ticket.id}
                              className={`grid grid-cols-3 transition-all duration-200 ${
                                isAvailable
                                  ? "cursor-pointer hover:bg-blue-50"
                                  : "cursor-not-allowed opacity-60"
                              } ${
                                isSelected && isAvailable
                                  ? "bg-blue-100 ring-2 ring-blue-500 ring-inset"
                                  : ""
                              } ${
                                index !== apiTicketsWithDayPass.length - 1
                                  ? "border-b border-gray-200"
                                  : ""
                              }`}
                              onClick={() => {
                                if (!isAvailable) return;
                                setFormData((prev) => {
                                  const next = { ...prev, ticketType: ticket.id };
                                  if (ticket.id === "korea-day-pass") {
                                    next.accompanyingPersonCount = 0;
                                  } else {
                                    next.dayPassDays = {
                                      Thursday: false,
                                      Friday: false,
                                      Saturday: false,
                                      Sunday: false,
                                    };
                                  }
                                  return withPrunedMeals(next);
                                });
                              }}
                            >
                              <div className="p-5 flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="ticketType"
                                  value={ticket.id}
                                  checked={isSelected}
                                  onChange={handleChange}
                                  disabled={!isAvailable}
                                  className="w-5 h-5 text-blue-600 disabled:cursor-not-allowed"
                                />
                                <div className="flex-1 min-w-0">
                                  {ticket.id === "korea-day-pass" ? (
                                    <span
                                      className={
                                        isAvailable
                                          ? "text-gray-800"
                                          : "text-gray-500"
                                      }
                                    >
                                      <span className="font-semibold">
                                        Daypass{" "}
                                      </span>
                                      <span className="text-xs sm:text-sm text-gray-600 font-normal">
                                        (Korean locals only)
                                      </span>
                                    </span>
                                  ) : (
                                    <span
                                      className={`font-semibold ${
                                        isAvailable
                                          ? "text-gray-800"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {ticket.label}
                                    </span>
                                  )}
                                  {!isAvailable && (
                                    <div className="mt-1 text-xs text-amber-600">
                                      <p>
                                        {ticket.unavailable_reason ||
                                          (requiresMembership && !verifiedMember
                                            ? "ISIR membership verification required to select this ticket."
                                            : "This ticket is not available for your membership status.")}
                                      </p>
                                      <a
                                        href="https://theisir.org/membership-account/membership-levels/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline font-semibold mt-1 inline-block"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Join ISIR →
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="p-5 text-center flex items-center justify-center">
                                <span
                                  className={`text-xl font-bold ${
                                    isAvailable ? "" : "text-gray-400"
                                  }`}
                                  style={
                                    isAvailable
                                      ? { color: "var(--color-primary)" }
                                      : {}
                                  }
                                >
                                  {formatCurrency(
                                    getFinalPrice(
                                      ticket.current_price ||
                                        ticket.early_price,
                                    ),
                                    getCurrency(),
                                  )}
                                </span>
                              </div>
                              <div className="p-5 text-center flex items-center justify-center">
                                <span
                                  className={`text-xl font-bold ${
                                    isAvailable
                                      ? "text-gray-500"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {formatCurrency(
                                    getFinalPrice(ticket.standard_price),
                                    getCurrency(),
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      // Fallback to hardcoded prices if API data not available
                      Object.entries(ticketPrices)
                        .filter(([value]) => {
                          if (value === "trainee-member" && !isTrainee) {
                            return false;
                          }
                          return true;
                        })
                        .map(
                          ([value, { early, standard, label }], index, arr) => (
                            <label
                              key={value}
                              className={`grid grid-cols-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                                formData.ticketType === value
                                  ? "bg-blue-100 ring-2 ring-blue-500 ring-inset"
                                  : ""
                              } ${
                                index !== arr.length - 1
                                  ? "border-b border-gray-200"
                                  : ""
                              }`}
                            >
                              <div className="p-5 flex items-center gap-3">
                                {(() => {
                                  const isMemberTicket =
                                    value === "isir-member" ||
                                    value === "trainee-member";
                                  const isAvailable =
                                    !isMemberTicket || isVerifiedMember;
                                  return (
                                    <>
                                      <input
                                        type="radio"
                                        name="ticketType"
                                        value={value}
                                        checked={formData.ticketType === value}
                                        onChange={handleChange}
                                        disabled={!isAvailable}
                                        className="w-5 h-5 text-blue-600 disabled:cursor-not-allowed"
                                      />
                                      {value === "korea-day-pass" ? (
                                        <span
                                          className={
                                            isAvailable
                                              ? "text-gray-800"
                                              : "text-gray-500"
                                          }
                                        >
                                          <span className="font-semibold">
                                            Daypass{" "}
                                          </span>
                                          <span className="text-xs sm:text-sm text-gray-600 font-normal">
                                            (Korean locals only)
                                          </span>
                                        </span>
                                      ) : (
                                        <span
                                          className={`font-semibold ${
                                            isAvailable
                                              ? "text-gray-800"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      )}
                                      {!isAvailable && (
                                        <span className="ml-2 text-xs text-amber-600">
                                          ISIR membership required.{" "}
                                          <a
                                            href="https://theisir.org/membership-account/membership-levels/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline font-semibold"
                                          >
                                            Join ISIR →
                                          </a>
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="p-5 text-center flex items-center justify-center">
                                <span
                                  className="text-xl font-bold"
                                  style={{ color: "var(--color-primary)" }}
                                >
                                  {formatCurrency(
                                    getFinalPrice(early),
                                    getCurrency(),
                                  )}
                                </span>
                              </div>
                              <div className="p-5 text-center flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-500">
                                  {formatCurrency(
                                    getFinalPrice(standard),
                                    getCurrency(),
                                  )}
                                </span>
                              </div>
                            </label>
                          ),
                        )
                    )}
                  </div>
                  {formData.ticketType === "korea-day-pass" && (
                    <div className="mt-6 p-5 rounded-xl border-2 border-purple-200 bg-purple-50/80">
                      <p className="text-sm font-semibold text-gray-800 mb-2">
                        Select your congress days
                      </p>
                      <p className="text-xs text-gray-600 mb-4">
                        Price is per day (early / standard as shown above).
                        Korean locals only — set Country to South Korea on the
                        details step. Thursday has no breakfast/lunch service.
                        Opening reception if you attend Friday; gala dinner if
                        you attend Saturday.
                      </p>
                      <div className="space-y-2">
                        {CONGRESS_DAYPASS_DAYS.map(({ key, date }) => (
                          <label
                            key={`daypass-step2-${key}`}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              name={`dayPass_${key}`}
                              checked={formData.dayPassDays[key]}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-800">
                              {key}{" "}
                              <span className="text-gray-500">({date})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3 italic">
                    *Trainee/Student rate requires proof of status.
                    <br />
                    <span className="font-semibold">†</span>{" "}
                    <span className="font-semibold">Daypass</span>{" "}
                    <span className="text-[11px] text-gray-600">
                      (Korean locals only)
                    </span>
                    : per selected day; South Korea required as country on the
                    registration form.
                  </p>
                </div>

                {/* Accompanying Person Tickets */}
                {formData.ticketType !== "korea-day-pass" && (
                <div className="border-t-2 border-gray-100 pt-8">
                  <FormLabel className="!text-base mb-3">
                    Accompanying Person Tickets
                  </FormLabel>
                  <p className="text-sm text-gray-600 mb-5">
                    Accompanying person fee includes Welcome Reception and the
                    complimentary Gala evening (dinner and live performances at
                    Busan Cinema Center).
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
                            getCurrency(),
                          )}{" "}
                          each (
                          {(membershipData?.ticket_options?.is_early_bird ??
                          isEarlyBirdPeriod)
                            ? "Early Bird"
                            : "Standard"}
                          )
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
                                prev.accompanyingPersonCount - 1,
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
                                prev.accompanyingPersonCount + 1,
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
                )}

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
                      {formatCurrency(
                        getTotalPrice(),
                        getCurrency(),
                      )}
                    </span>
                  </div>
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

        {/* STEP 3: TRAINEE LETTER UPLOAD (only for trainee tickets) */}
        {step === 3 && isTraineeTicket && (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            >
              Upload Verification Letter
            </FormSectionHeader>
            <div className="p-8">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-amber-800">
                      Student/Trainee Verification Required
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      To qualify for the trainee/student rate, please upload an
                      official document verifying your current student or
                      trainee status. This will be reviewed by our team.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLetterSubmit} className="space-y-6">
                <TraineeLetterUpload
                  email={formData.email}
                  registrationType={formData.ticketType}
                  onUploadComplete={handleLetterUploadComplete}
                  onUploadError={handleLetterUploadError}
                  uploadedFile={formData.traineeLetterFile}
                />

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.traineeLetterUrl}
                    className="px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: formData.traineeLetterUrl
                        ? "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)"
                        : "#9ca3af",
                    }}
                  >
                    Continue to Registration →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4: REGISTRATION FORM */}
        {step === 4 && (
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
                      placeholder="Jr., Sr., III, etc."
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
                        setStateid(0);
                        setCityid(0);
                        setFormData((prev) => {
                          const next = {
                            ...prev,
                            country: e,
                            state: null,
                            city: "",
                          };
                          if (
                            prev.ticketType === "korea-day-pass" &&
                            !isSouthKoreaResidenceCountry(e)
                          ) {
                            next.ticketType = "";
                            next.dayPassDays = {
                              Thursday: false,
                              Friday: false,
                              Saturday: false,
                              Sunday: false,
                            };
                          }
                          return withPrunedMeals(next);
                        });
                      }}
                      placeHolder="Select Country"
                      defaultValue={formData.country}
                      containerClassName="w-full"
                      inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <FormLabel>State/Province</FormLabel>
                    <StateSelect
                      countryid={countryid}
                      onChange={(e) => {
                        setStateid(e.id);
                        setFormData((prev) => ({ ...prev, state: e }));
                        // Reset city when state changes
                        setCityid(0);
                        setFormData((prev) => ({ ...prev, city: "" }));
                      }}
                      placeHolder="Select State (Optional)"
                      defaultValue={formData.state}
                      containerClassName="w-full"
                      inputClassName="w-full border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <FormLabel required>City</FormLabel>
                    <FormInput
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="City"
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
                    <FormLabel>Office Phone</FormLabel>
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={formData.officePhone}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, officePhone: value }))
                      }
                      className="phone-input-custom border-2 border-gray-200 rounded-xl bg-white focus-within:border-blue-500"
                    />
                  </div>
                  <div>
                    <FormLabel>Cell Phone</FormLabel>
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

                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border-2 border-emerald-200 mt-8">
                  <h5 className="font-bold text-gray-800 mb-4">
                    Meal Attendance
                  </h5>
                  <p className="text-sm text-gray-600 mb-5">
                    {formData.ticketType === "korea-day-pass"
                      ? `Your congress days: ${formatCongressMealDayList(
                          CONGRESS_DAYPASS_DAYS.filter(
                            ({ key }) => formData.dayPassDays[key],
                          ).map(({ key }) => key),
                        )}. Breakfast/lunch choices are Fri-Sun only (no Thursday breakfast/lunch). Opening reception applies to Friday; gala dinner to Saturday.`
                      : "Indicate welcome events and which days you will attend lunch and breakfast (Friday–Sunday, Nov 6–8, 2026)."}
                  </p>
                  {(formData.ticketType !== "korea-day-pass" ||
                    formData.dayPassDays[DAY_PASS_OPENING_RECEPTION_DAY]) && (
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Opening / Welcome Reception
                    </p>
                    <select
                      name="openingReceptionAttending"
                      value={formData.openingReceptionAttending ? "yes" : "no"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          openingReceptionAttending: e.target.value === "yes",
                        }))
                      }
                      className="w-full md:w-72 border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="no">No, I will not attend</option>
                      <option value="yes">Yes, I will attend</option>
                    </select>
                  </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Breakfast
                      </p>
                      <div className="space-y-2">
                        {CONGRESS_WEEKEND_MEALS.map(({ key, date }) => {
                          const dayAllowed =
                            formData.ticketType !== "korea-day-pass" ||
                            formData.dayPassDays[key];
                          return (
                          <label
                            key={`breakfast-${key}`}
                            className={`flex items-center gap-2 ${!dayAllowed ? "opacity-40 pointer-events-none" : ""}`}
                          >
                            <input
                              type="checkbox"
                              name={`meal_breakfast_${key}`}
                              checked={
                                dayAllowed &&
                                formData.mealAttendance.breakfast[key]
                              }
                              onChange={handleChange}
                              disabled={!dayAllowed}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {key}{" "}
                              <span className="text-gray-500">({date})</span>
                            </span>
                          </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Lunch
                      </p>
                      <div className="space-y-2">
                        {CONGRESS_WEEKEND_MEALS.map(({ key, date }) => {
                          const dayAllowed =
                            formData.ticketType !== "korea-day-pass" ||
                            formData.dayPassDays[key];
                          return (
                          <label
                            key={`lunch-${key}`}
                            className={`flex items-center gap-2 ${!dayAllowed ? "opacity-40 pointer-events-none" : ""}`}
                          >
                            <input
                              type="checkbox"
                              name={`meal_lunch_${key}`}
                              checked={
                                dayAllowed && formData.mealAttendance.lunch[key]
                              }
                              onChange={handleChange}
                              disabled={!dayAllowed}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {key}{" "}
                              <span className="text-gray-500">({date})</span>
                            </span>
                          </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {(formData.ticketType !== "korea-day-pass" ||
                    formData.dayPassDays[DAY_PASS_GALA_DAY]) && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Gala Dinner
                    </p>
                    <select
                      name="galaDinnerAttending"
                      value={formData.galaDinnerAttending ? "yes" : "no"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          galaDinnerAttending: e.target.value === "yes",
                        }))
                      }
                      className="w-full md:w-72 border-2 border-gray-200 p-3 text-sm rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="no">No, I will not attend</option>
                      <option value="yes">Yes, I will attend</option>
                    </select>
                  </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border-2 border-indigo-200 mt-8">
                  <h5 className="font-bold text-gray-800 mb-2">
                    Discount Code (Optional)
                  </h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your code exactly as provided. If valid, your final
                    registration total is adjusted at checkout.
                  </p>
                  <FormInput
                    name="discountCode"
                    value={formData.discountCode}
                    onChange={handleChange}
                    placeholder="Enter discount code"
                    autoComplete="off"
                  />
                  {hasDiscountCodeAttempt && discountCodeStatus.state === "checking" && (
                    <p className="mt-2 text-sm text-blue-700">
                      Verifying discount code...
                    </p>
                  )}
                  {hasDiscountCodeAttempt && discountCodeStatus.state === "valid" && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Discount code verified. Total will be{" "}
                      {formatCurrency(getTotalPrice(), currency)}.
                    </p>
                  )}
                  {hasDiscountCodeAttempt &&
                    (discountCodeStatus.state === "invalid" ||
                      discountCodeStatus.state === "error") && (
                      <p className="mt-2 text-sm text-red-700">
                        {discountCodeStatus.error || "Invalid discount code."}
                      </p>
                    )}
                </div>

                {/* Preferences Section */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-200 mt-8">
                  <h5 className="font-bold text-gray-800 mb-4">
                    Communication Preferences
                  </h5>
                  <FormCheckbox
                    name="privacyMarketing"
                    checked={formData.privacyMarketing}
                    onChange={handleChange}
                    label="I agree to share my contact information with ISIR for marketing and promotions."
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-between p-6 bg-gray-50 border-t-2 border-gray-200">
                <button
                  type="button"
                  className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                  onClick={() => setStep(isTraineeTicket ? 3 : 2)}
                >
                  ← Back {isTraineeTicket ? "to Letter Upload" : "to Tickets"}
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

        {/* STEP 5: PAYMENT */}
        {step === 5 && (
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
                  {isPreviewRegistrationTest ? (
                    <div className="text-base py-2 text-gray-700">
                      <p className="mb-2">
                        {PREVIEW_REGISTRATION_TEST_USD <= 0
                          ? "Preview registration: no charge (not your selected list prices)."
                          : "Preview test charge (flat amount — not your selected list prices):"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {hasDiscountCodeAttempt &&
                        discountCodeStatus.state === "checking" && (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                            Verifying discount code...
                          </div>
                        )}
                      {hasDiscountCodeAttempt &&
                        discountCodeStatus.state === "valid" && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            Discount code verified. Discounted total is applied.
                          </div>
                        )}
                      {hasDiscountCodeAttempt &&
                        (discountCodeStatus.state === "invalid" ||
                          discountCodeStatus.state === "error") && (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                            {discountCodeStatus.error ||
                              "Discount code could not be verified."}
                          </div>
                        )}
                      <div className="flex justify-between text-base py-3 border-b border-gray-200">
                        <span className="text-gray-700">
                          {renderOrderTicketLabel()}{" "}
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
                          {formatCurrency(
                            getTicketPrice(formData.ticketType),
                            currency,
                          )}
                        </span>
                      </div>
                      {formData.accompanyingPersonCount > 0 && (
                        <div className="flex justify-between text-base py-3 border-b border-gray-200">
                          <span className="text-gray-700">
                            Accompanying Person ×{" "}
                            {formData.accompanyingPersonCount}
                          </span>
                          <span className="font-bold text-lg">
                            {formatCurrency(
                              getAccompanyingPrice() *
                                formData.accompanyingPersonCount,
                              currency,
                            )}
                          </span>
                        </div>
                      )}
                    </>
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
                      onSuccess={(intent) => {
                        console.log("Payment succeeded:", intent);
                        setPaymentIntent(intent);
                        setIsProcessingPayment(false);
                        setStep(6);
                      }}
                      onError={(error) => {
                        console.error("Payment error:", error);
                        setIsProcessingPayment(false);
                        alert(
                          error.message ||
                            "Payment failed. Please try again or contact support@isir2026.org",
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
                    <p className="text-gray-600">
                      Setting up secure payment...
                    </p>
                  </div>
                )}

                <div className="flex justify-start pt-8 mt-6 border-t-2 border-gray-200">
                  <button
                    type="button"
                    className="px-8 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl shadow-md hover:bg-gray-50 font-bold text-base transition-all"
                    onClick={() => setStep(4)}
                  >
                    ← Back to Registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CONFIRMATION */}
        {step === 6 && (
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
                          {renderOrderTicketLabel()}{" "}
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
                            currency,
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
                              currency,
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
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-500 mb-3">
                      Meal Attendance
                    </p>
                    <div className="space-y-1 text-sm text-gray-700">
                      {formData.ticketType === "korea-day-pass" && (
                        <p>
                          Congress days:{" "}
                          {formatCongressMealDayList(
                            selectedDayPassCongressDayKeys(formData.dayPassDays),
                          ) || "None selected"}
                        </p>
                      )}
                      <p>
                        Lunch (Fri–Sun, Nov 6–8):{" "}
                        {formatCongressMealDayList(
                          effectiveMealDayKeys(
                            formData.mealAttendance.lunch,
                            formData.ticketType,
                            formData.dayPassDays,
                          ),
                        ) || "None selected"}
                      </p>
                      <p>
                        Breakfast (Fri–Sun, Nov 6–8):{" "}
                        {formatCongressMealDayList(
                          effectiveMealDayKeys(
                            formData.mealAttendance.breakfast,
                            formData.ticketType,
                            formData.dayPassDays,
                          ),
                        ) || "None selected"}
                      </p>
                      {(formData.ticketType !== "korea-day-pass" ||
                        formData.dayPassDays[DAY_PASS_OPENING_RECEPTION_DAY]) && (
                        <p>
                          Opening reception:{" "}
                          {formData.openingReceptionAttending
                            ? "Attending"
                            : "Not attending"}
                        </p>
                      )}
                      {(formData.ticketType !== "korea-day-pass" ||
                        formData.dayPassDays[DAY_PASS_GALA_DAY]) && (
                        <p>
                          Gala dinner:{" "}
                          {formData.galaDinnerAttending
                            ? "Attending"
                            : "Not attending"}
                        </p>
                      )}
                    </div>
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
                    className="px-8 py-4 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
                    }}
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5 mr-2"
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
                        Generating PDF...
                      </>
                    ) : (
                      <>
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
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download Confirmation
                      </>
                    )}
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
