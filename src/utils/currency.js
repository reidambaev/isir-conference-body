/**
 * Currency formatting utilities (registration is charged in USD only).
 */

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = "USD") {
  if (currency === "KRW") {
    return `₩${amount.toLocaleString("ko-KR")}`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

/**
 * Listed prices are USD; no country-based conversion or surcharges.
 */
export function getFinalPrice(usdAmount) {
  return usdAmount;
}

/** Stripe and UI always use USD for new registrations */
export function getCurrency() {
  return "USD";
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency = "USD") {
  return currency === "KRW" ? "₩" : "$";
}
