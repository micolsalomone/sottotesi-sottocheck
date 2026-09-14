/**
 * Transient, narrowly-scoped breadcrumb for the post-payment academic-profile
 * review interstitial. Shared by both standalone paid pages —
 * `PublicPaidSottocheckPage` (authenticated standalone, Slice 1) and
 * `PublicAccountGatePage` (guest checkout, Slice 2) — as the single mechanism
 * that protects post-materialization continuation on a refresh; there is no
 * second, page-specific storage mechanism.
 *
 * It exists ONLY to protect post-materialization continuation: once a paid
 * standalone TesiCheck has been materialized, the optional review interstitial
 * widens the gap before the report navigation. In-memory flow state does not
 * survive a reload — this breadcrumb lets the paid page fall forward to the
 * already-paid report instead of stranding the user. For the guest flow in
 * particular, the pre-check session (`tesicheck-precheck-session-v1`) is
 * already cleared the moment materialization succeeds
 * (`createPersistentCheckFromPaidPrecheck`), so it can no longer serve as a
 * resume mechanism from that point on — this breadcrumb is what does.
 *
 * It stores ONLY the materialized check id. It is NEVER:
 *  - a payment idempotency key (that stays `sourceTemporaryDocumentRef` /
 *    `sourcePaymentReference`, both unaffected by this module);
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
