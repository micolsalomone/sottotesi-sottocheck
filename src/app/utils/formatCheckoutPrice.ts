/**
 * Presentation-only formatter for the TesiCheck consumer price.
 *
 * Canonical display format is `€14,90` — euro sign prefix, comma decimal, no
 * space. Shared across the paid-consumer surfaces (checkout summary, landing
 * resume state, pricing preview) so the same amount never renders two ways.
 *
 * This does not compute or round the price; it only formats an existing value.
 */
export function formatCheckoutPrice(price: number): string {
  return `€${price.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
