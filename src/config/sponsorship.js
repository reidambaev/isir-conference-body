export const SPONSORSHIP_CONTACT_EMAIL = "info@isir2026.org";

export const SPONSORSHIP_TIERS = [
  { value: "platinum", label: "Platinum Sponsor", price: 30000 },
  { value: "gold", label: "Gold Sponsor", price: 20000 },
  { value: "silver", label: "Silver Sponsor", price: 10000 },
  { value: "bronze", label: "Bronze Sponsor", price: 5000 },
  { value: "exhibitor", label: "Exhibitor", price: 2500 },
];

export const ADDITIONAL_SPONSORSHIP_OPPORTUNITIES = [
  { value: "gala_dinner", label: "Gala Dinner Sponsor", price: 20000 },
  { value: "luncheon_symposium", label: "Luncheon Symposium", price: 15000 },
  { value: "welcome_reception", label: "Welcome Reception Sponsor", price: 10000 },
  { value: "congress_bag", label: "Congress Bag Sponsor", price: 10000 },
  {
    value: "young_investigator_award",
    label: "Young Investigator Award Sponsor",
    price: 7500,
  },
  { value: "lanyard", label: "Lanyard Sponsor", price: 7500 },
  { value: "travel_award", label: "Travel Award Sponsor", price: 5000 },
  { value: "coffee_break", label: "Coffee Break Sponsor", price: 5000 },
  { value: "wifi", label: "Wi-Fi Sponsor", price: 5000 },
  { value: "mobile_app", label: "Mobile Application Sponsor", price: 5000 },
  {
    value: "charging_station",
    label: "Charging Station Sponsor",
    price: 3000,
  },
];

export const SPONSORSHIP_PACKAGE_OPTIONS = [
  ...SPONSORSHIP_TIERS,
  ...ADDITIONAL_SPONSORSHIP_OPPORTUNITIES,
  { value: "custom", label: "Customized package", price: null },
  { value: "not_sure", label: "Not sure yet", price: null },
];

export function formatSponsorshipPrice(price) {
  if (price == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function sponsorshipPackageLabel(option) {
  if (!option) return "—";
  const price = formatSponsorshipPrice(option.price);
  return price ? `${option.label} (${price})` : option.label;
}
