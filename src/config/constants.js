// API Configuration for ISIR Member Verification
export const ISIR_API_CONFIG = {
  endpoint:
    import.meta.env.VITE_ISIR_API_ENDPOINT ||
    "https://theisir.org/wp-json/isir/v1/check-member",
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
export const EARLY_BIRD_DEADLINE = new Date("2026-07-10");
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
  isEarlyBird
) => {
  const ticketPrice = getTicketPrice(ticketType, isEarlyBird);
  const accompanyingPrice =
    getAccompanyingPrice(isEarlyBird) * accompanyingCount;
  const galaDinnerPrice = galaDinner ? GALA_DINNER_PRICE : 0;
  return ticketPrice + accompanyingPrice + galaDinnerPrice;
};
