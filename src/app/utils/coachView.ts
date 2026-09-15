/**
 * Prototype identity shim for the Coach view (`/coach-view`).
 *
 * `COACH_VIEW_COACH_ID` is a TesiCheck OWNERSHIP shim only. It lets
 * path-bound TesiCheck check records (`CoachPathBoundCheck` /
 * `CoachFreeCheck` in `tesicheckCoachCheck.ts`) declare an `owner.id`.
 * Deliberately NOT derived from any real Coach identity and deliberately
 * does NOT follow the Admin `C-XX` id scheme. It is unrelated to the Coach
 * shell's own displayed identity (name/email/phone), which comes from a
 * separate, Coach-view-local prototype fixture
 * (`CoachViewProfileContext`, scoped to `CoachLayout`) — not from this id.
 *
 * Production must replace this with a real id resolved from the
 * authenticated Coach's backend record; see `docs/production-handoff.md` →
 * "Coach Profile/Account" for the intended data/UX contract.
 */
export const COACH_VIEW_COACH_ID = 'coach-view-demo';
