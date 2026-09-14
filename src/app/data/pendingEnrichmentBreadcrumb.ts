/**
 * Transient, narrowly-scoped breadcrumb for the authenticated-standalone
 * post-payment enrichment interstitial.
 *
 * It exists ONLY to protect post-materialization continuation: once a paid
 * standalone TesiCheck has been materialized, the optional enrichment
 * questionnaire widens the gap before the report navigation. In-memory flow
 * state does not survive a reload — this breadcrumb lets the paid page fall
 * forward to the already-paid report instead of stranding the user on the upload
 * form.
 *
 * It stores ONLY the materialized check id. It is NEVER:
 *  - a payment idempotency key (that stays `sourcePaymentReference`);
 *  - a place for questionnaire answers;
 *  - a trigger to re-run payment or re-materialize a check.
 *
 * It is cleared on every exit from the interstitial (save, skip, automatic
 * forward) and immediately after it is consumed on mount.
 */
const STORAGE_KEY = 'tesicheck-pending-enrichment-v1';

export function writePendingEnrichmentCheckId(checkId: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ checkId }));
  } catch {
    // Prototype-only breadcrumb; storage may be unavailable.
  }
}

export function readPendingEnrichmentCheckId(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { checkId?: unknown };
    return typeof parsed.checkId === 'string' && parsed.checkId ? parsed.checkId : null;
  } catch {
    return null;
  }
}

export function clearPendingEnrichmentCheckId() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
