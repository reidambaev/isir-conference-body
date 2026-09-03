// Feature flags: set to true when registration/submission are open
export const REGISTRATION_OPEN = true;
/** General (peer-reviewed) abstract submissions. */
export const SUBMISSION_OPEN = false;
/**
 * When general submission is closed, invited speakers may still submit talk
 * abstracts if this is true. Server also allows invited speakers past the
 * general deadline when this path is used.
 */
export const INVITED_SPEAKER_SUBMISSION_OPEN = true;

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
export const isSubmissionAccessible = () =>
  SUBMISSION_OPEN || INVITED_SPEAKER_SUBMISSION_OPEN || isPreviewMode();

// API Configuration for ISIR Member Verification
export const ISIR_API_CONFIG = {
  endpoint: import.meta.env.VITE_ISIR_API_ENDPOINT || "/api/check-member",
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
  /** Per congress day (Thu–Sun); total = rate × number of days selected. Korean locals only (enforced server-side). */
  "korea-day-pass": {
    early: 200,
    standard: 250,
    label: "Daypass (Korean locals only)",
  },
};

// Early Bird Configuration
export const EARLY_BIRD_DEADLINE = new Date("2026-09-01");
export const isEarlyBirdPeriod = (now = new Date()) =>
  now < EARLY_BIRD_DEADLINE;
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

export const CONGRESS_WEEKEND_MEAL_KEYS = CONGRESS_WEEKEND_MEALS.map(
  (m) => m.key,
);

/** Day-pass ticketable dates (Thu–Sun of congress week). */
export const CONGRESS_DAYPASS_DAYS = [
  { key: "Thursday", date: "Nov 5, 2026" },
  ...CONGRESS_WEEKEND_MEALS,
];

/** Congress day when the opening / welcome reception is held (all day-pass holders may opt in). */
export const DAY_PASS_OPENING_RECEPTION_DAY = "Friday";

/** Congress day when the gala evening is held (all day-pass holders may opt in). */
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
  const row = CONGRESS_DAYPASS_DAYS.find((m) => m.key === dayKey);
  return row ? `${row.key} (${row.date})` : String(dayKey || "");
}

export function formatCongressMealDayList(dayKeys) {
  if (!Array.isArray(dayKeys) || dayKeys.length === 0) return "";
  return dayKeys.map((k) => formatCongressMealDayLabel(k)).join(", ");
}

export function selectedDayPassCongressDayKeys(dayPassDays) {
  return CONGRESS_DAYPASS_DAYS.filter(({ key }) =>
    Boolean(dayPassDays?.[key]),
  ).map(({ key }) => key);
}

/** Fri–Sun breakfast/lunch only apply when that day is on the day pass. */
export function congressMealDayAllowed(ticketType, dayPassDays, mealDayKey) {
  if (ticketType !== "korea-day-pass") return true;
  return Boolean(dayPassDays?.[mealDayKey]);
}

export function effectiveMealDayKeys(mealByDay, ticketType, dayPassDays) {
  return CONGRESS_WEEKEND_MEAL_KEYS.filter(
    (day) =>
      Boolean(mealByDay?.[day]) &&
      congressMealDayAllowed(ticketType, dayPassDays, day),
  );
}

/** Clear meals and events that are not valid for the current ticket / day-pass days. */
export function pruneRegistrationMeals({
  ticketType,
  dayPassDays,
  mealAttendance,
  openingReceptionAttending,
  galaDinnerAttending,
}) {
  const lunch = { ...mealAttendance.lunch };
  const breakfast = { ...mealAttendance.breakfast };
  for (const day of CONGRESS_WEEKEND_MEAL_KEYS) {
    if (!congressMealDayAllowed(ticketType, dayPassDays, day)) {
      lunch[day] = false;
      breakfast[day] = false;
    }
  }
  return {
    mealAttendance: { lunch, breakfast },
    openingReceptionAttending: Boolean(openingReceptionAttending),
    galaDinnerAttending: Boolean(galaDinnerAttending),
  };
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

export const BEXCO_VENUE = {
  website: "https://www.bexco.co.kr/eng/Main.do",
  parking: "https://www.bexco.co.kr/eng/CMS/Contents/Contents.do?mCode=MN023",
  map: "https://www.google.com/maps/search/?api=1&query=BEXCO+Busan",
  photos: [
    {
      href: "https://commons.wikimedia.org/wiki/File:Busan_BEXCO.jpg",
      src: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/92/38/4f/photo0jpg.jpg?w=1400&h=800&s=1",
      alt: "BEXCO exterior, Busan",
    },
    {
      href: "https://commons.wikimedia.org/wiki/File:BEXCO_in_Busan,_South_Korea_(iau2207a).jpg",
      src: "https://upload.wikimedia.org/wikipedia/commons/0/00/BEXCO_in_Busan%2C_South_Korea_%28iau2207a%29.jpg",
      alt: "BEXCO convention center, Busan",
    },
    {
      href: "https://commons.wikimedia.org/wiki/File:BEXCO_and_Plaza.jpg",
      src: "https://aipc.org/wp-content/uploads/2020/08/BEXCO_8-scaled.jpg",
      alt: "BEXCO plaza, Busan",
    },
  ],
  mapEmbed:
    "https://maps.google.com/maps?q=BEXCO+Busan,+55+APEC-ro,+Haeundae-gu,+Busan,+Korea&t=&z=15&ie=UTF8&iwloc=&output=embed",
};
