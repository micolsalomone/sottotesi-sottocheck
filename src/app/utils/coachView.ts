/**
 * Prototype identity shim for the Coach view (`/coach-view`).
 *
 * The Coach shell has no auth/session in the prototype — `CoachHeader` only
 * renders hardcoded display strings. This constant gives the Coach a single
 * stable id so path-bound TesiCheck records can declare an owner.
 *
 * It is deliberately NOT derived from "Teresa P." and deliberately does NOT
 * follow the Admin `C-XX` id scheme. Production must replace it with the real
 * authenticated Coach id.
 */
export const COACH_VIEW_COACH_ID = 'coach-view-demo';
