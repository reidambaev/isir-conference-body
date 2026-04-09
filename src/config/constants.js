// Feature flags: set to true when registration/submission are open
export const REGISTRATION_OPEN = true;
export const SUBMISSION_OPEN = true;

// Secret preview key for testing (add ?preview=YOUR_SECRET_KEY to URL)
// Keep in sync with worker: `env.PREVIEW_KEY` or default in handleRegistration.
export const PREVIEW_KEY = "isir2026test"; // Change this to your own secret

/** When `?preview=PREVIEW_KEY` is active, registration can charge this flat USD test amount (see worker + RegistrationForm). */
export const PREVIEW_REGISTRATION_TEST_USD = 1;

// Check if preview mode is enabled via URL parameter
export const isPreviewMode = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === PREVIEW_KEY;
};

// Use these in components instead of the raw flags
export const isRegistrationAccessible = () =>
  REGISTRATION_OPEN || isPreviewMode();
export const isSubmissionAccessible = () => SUBMISSION_OPEN || isPreviewMode();

// API Configuration for ISIR Member Verification
export const ISIR_API_CONFIG = {
  endpoint:
    import.meta.env.VITE_ISIR_API_ENDPOINT || "/api/check-member",
  apiKey: import.meta.env.VITE_ISIR_API_KEY || "",
};

// Ticket Prices Configuration
export const TICKET_PRICES = {
  "isir-member": { early: 350, standard: 450, label: "ISIR Member" },
  "non-member": { early: 650, standard: 750, label: "Non-Member" },
  "trainee-member": {
    early: 150,
    standard: 200,
    label: "Trainee (ISIR Member)",
  },
  "trainee-non-member": {
    early: 250,
    standard: 300,
    label: "Trainee (Non-Member)",
  },
};

// Early Bird Configuration
export const EARLY_BIRD_DEADLINE = new Date("2026-07-31");
export const GALA_DINNER_PRICE = 100;

// Utility Functions
export const getAccompanyingPrice = (isEarlyBird) => (isEarlyBird ? 250 : 350);

export const getTicketPrice = (ticketType, isEarlyBird) => {
  const priceKey = isEarlyBird ? "early" : "standard";
  return TICKET_PRICES[ticketType]?.[priceKey] || 0;
};

export const calculateTotalPrice = (
  ticketType,
  accompanyingCount,
  galaDinner,
  isEarlyBird,
) => {
  const ticketPrice = getTicketPrice(ticketType, isEarlyBird);
  const accompanyingPrice =
    getAccompanyingPrice(isEarlyBird) * accompanyingCount;
  const galaDinnerPrice = galaDinner ? GALA_DINNER_PRICE : 0;
  return ticketPrice + accompanyingPrice + galaDinnerPrice;
};
