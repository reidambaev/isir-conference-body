/**
 * Currency conversion and formatting utilities
 */

// Exchange rate: 1 USD = ~1350 KRW (approximate, should use real-time API in production)
const USD_TO_KRW_RATE = 1350;
const KOREAN_TAX_RATE = 0.1; // 10% Korean tax

/**
 * Check if a country is Korea
 */
export function isKorea(country) {
  if (!country) return false;
  const countryName = typeof country === "string" ? country : country.name;
  return (
    countryName?.toLowerCase().includes("korea") ||
    countryName?.toLowerCase().includes("south korea") ||
    countryName === "KR" ||
    countryName === "KOR"
  );
}

/**
 * Get currency based on country
 */
export function getCurrency(country) {
  return isKorea(country) ? "KRW" : "USD";
}

/**
 * Convert USD to KRW
 */
export function usdToKrw(usdAmount) {
  return Math.round(usdAmount * USD_TO_KRW_RATE);
}

/**
 * Convert KRW to USD
 */
export function krwToUsd(krwAmount) {
  return Math.round((krwAmount / USD_TO_KRW_RATE) * 100) / 100;
}

/**
 * Calculate price with Korean tax (10%)
 */
export function applyKoreanTax(amount) {
  return Math.round(amount * (1 + KOREAN_TAX_RATE));
}

/**
 * Calculate price without tax (for display purposes)
 */
export function removeKoreanTax(amountWithTax) {
  return Math.round(amountWithTax / (1 + KOREAN_TAX_RATE));
}

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
 * Get final price based on country
 * For Koreans: Convert to KRW and apply 10% tax
 * For others: Keep in USD (tax included in base price)
 */
export function getFinalPrice(usdAmount, country) {
  if (isKorea(country)) {
    const krwAmount = usdToKrw(usdAmount);
    return applyKoreanTax(krwAmount);
  }
  return usdAmount;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency = "USD") {
  return currency === "KRW" ? "₩" : "$";
}
