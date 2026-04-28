// Feature flags: set to true when registration/submission are open
export const REGISTRATION_OPEN = true;
export const SUBMISSION_OPEN = true;

// Secret preview key for testing (add ?preview=YOUR_SECRET_KEY to URL)
// Keep in sync with worker: `env.PREVIEW_KEY` or default in handleRegistration.
export const PREVIEW_KEY = "isir2026test"; // Change this to your own secret

/** When `?preview=PREVIEW_KEY` is active, registration uses this flat USD total (0 = free; see worker + RegistrationForm). */
export const PREVIEW_REGISTRATION_TEST_USD = 0;

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
  /** Per congress day (Fri–Sun); total = rate × number of days selected. Korean citizens only (enforced server-side). */
  "korea-day-pass": {
    early: 150,
    standard: 200,
    label: "Daypass (Korean citizens only)",
  },
};

// Early Bird Configuration
export const EARLY_BIRD_DEADLINE = new Date("2026-07-31");
export const GALA_DINNER_PRICE = 100;

/** Inclusive ISO dates for the on-site congress (invited speaker hotel dates must fall in this range). */
export const CONFERENCE_HOTEL_STAY_DATE_MIN = "2026-11-05";
export const CONFERENCE_HOTEL_STAY_DATE_MAX = "2026-11-08";

export function isDateWithinConferenceHotelStay(isoDate) {
  return (
    typeof isoDate === "string" &&
    isoDate >= CONFERENCE_HOTEL_STAY_DATE_MIN &&
    isoDate <= CONFERENCE_HOTEL_STAY_DATE_MAX
  );
}

/** Fri–Sun of congress week (Nov 5–8, 2026); stored JSON uses `key` only. */
export const CONGRESS_WEEKEND_MEALS = [
  { key: "Friday", date: "Nov 6, 2026" },
  { key: "Saturday", date: "Nov 7, 2026" },
  { key: "Sunday", date: "Nov 8, 2026" },
];

export const CONGRESS_WEEKEND_MEAL_KEYS = CONGRESS_WEEKEND_MEALS.map((m) => m.key);

/** Opening / welcome reception is offered for day-pass holders attending Friday. */
export const DAY_PASS_OPENING_RECEPTION_DAY = "Friday";

/** Gala dinner is offered for day-pass holders attending Saturday. */
export const DAY_PASS_GALA_DAY = "Saturday";

/** Country must match for Korean local day pass (name from react-country-state-city / registration form). */
export function isSouthKoreaResidenceCountry(country) {
  const name =
    typeof country === "object" && country != null
      ? String(country.name || "").trim()
      : String(country || "").trim();
  const n = name.toLowerCase();
  return (
    n === "south korea" ||
    n === "republic of korea" ||
    n === "korea, republic of" ||
    n === "korea (south)" ||
    n === "korea, south"
  );
}

export function formatCongressMealDayLabel(dayKey) {
  const row = CONGRESS_WEEKEND_MEALS.find((m) => m.key === dayKey);
  return row ? `${row.key} (${row.date})` : String(dayKey || "");
}

export function formatCongressMealDayList(dayKeys) {
  if (!Array.isArray(dayKeys) || dayKeys.length === 0) return "";
  return dayKeys.map((k) => formatCongressMealDayLabel(k)).join(", ");
}

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
