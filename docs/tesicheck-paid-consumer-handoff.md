# TesiCheck — Paid Consumer Handoff (technical)

> **Not a source of truth.** UX/product source of truth stays [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md).
> This file only preserves the implementation knowledge gathered while building the paid consumer flow, so a new agent chat can resume without re-exploring the repo. Product rules are referenced, not restated.

---

## 1. Scope of the workstream

**Implemented (paid consumer TesiCheck):**

- Guest pre-check on `/public` (upload → validation → character count → price) with a resumable session.
- Account-gated checkout on `/public/account` — the account step is now a real form, not a two-button gate.
- Inline **login / registration** inside the checkout (mode swap, never leaves the page).
- **Email verification** step (OTP) required after registration, before payment.
- Shared **payment gateway boundary** (simulated): minimal Sottotesi-branded interstitial that auto-returns `success` after 1500 ms in normal mode; `?paymentDemo=1` disables the timer and exposes manual success / failed / cancelled.
- Persistent **paid checks** written after verified payment (`owner.context: 'standalone'`).
- Authenticated **standalone report** at `/public-view/report/:checkId` inside `PublicLayout`.
- **Student self-service paid flow** at `/student-view/sottocheck` (`owner.context: 'student'`).
- **Student report** at `/student-view/report/:checkId` inside `StudentLayout`.
- Persistent **order summary** ("Riepilogo TesiCheck") visible across `checkout_account → checkout_verify_email → checkout_payment` (`SottocheckCheckoutSummary`); **not** rendered during `redirecting`. Compact summary precedes the form on mobile.
- Shared **price formatter** `formatCheckoutPrice()` — every paid-consumer amount displays as `€14,90`.
- **Post-payment report recovery** — if persistent-check materialization fails after a (simulated) verified payment, both guest and Student keep the paid state and show a recoverable screen (`Non siamo riusciti a generare il report` + `Riprova a generare il report`); retry re-runs **only** the materialization, never the payment. Idempotency keys differ by origin: guest `sourceTemporaryDocumentRef`, Student `sourcePaymentReference`.

**Also implemented (consumer History redesign — see §12):**

- `/public-view/history` and `/student-view/history` now read the real persistent paid checks; `mockHistory` no longer feeds them.
- `Apri report` into the role-specific report route; expired records stay visible with no action.

**Explicitly NOT part of this workstream:**

- Coach entitlement / coaching-path flow.
- Coach paid vs free "modalità" selector.
- Coach History / Storico redesign — separate future workstream; must **not** reuse the consumer persistent store (canonical §19.1).
- Admin TesiCheck flow.
- `In scadenza` History condition — no threshold defined (canonical §30), not implemented.
- Full expiry / retention redesign (only the 30-day `expiresAt` field + report-page evaluation + History read-time derivation exist).
- Legacy `/public/history` — left on its isolated mock; not wired to the persistent store.
- General legacy cleanup (`/public/sottocheck`, `/public/success`, `getViewBasePath` bug, duplicate report pages, etc.).

---

## 2. Current canonical journey (as implemented)

**Guest** — files: `PublicLandingPage.tsx`, `PublicAccountGatePage.tsx`, `tesicheckPrecheckSession.ts`, `tesicheckAccountSession.ts`, `tesicheckPersistentCheck.ts`

```
/public
  → upload (SottocheckUploadForm: pdf/docx, ≤ 50 MB)
  → validation
  → character count / price (700 ms fake loader → savePrecheckSession, flowStage = quote_ready)
  → "Procedi al pagamento" → flowStage = checkout_account → navigate('/public/account')
  → login  OR  register (inline, same page)
      register → flowStage = checkout_verify_email → OTP → confirmAccountEmail()
      login    → (returning verified account)
  → flowStage = checkout_payment → "Vai al pagamento"
  → flowStage = redirecting → PublicAccountGatePage early-returns a minimal branded page
       (no card chrome, no summary rail) hosting SottocheckPaymentGatewayBoundary
       normal mode: auto onSuccess after 1500 ms
       ?paymentDemo=1: manual success | failed | cancelled buttons
  → success → flowStage = payment_success
  → transient "Pagamento ricevuto / Stiamo generando il report..." (no standalone success page)
  → createPersistentCheckFromPaidPrecheck()  (dedupe by sourceTemporaryDocumentRef)
       success → clearPrecheckSession() → navigate('/public-view/report/:checkId')  (~1200 ms, inside PublicLayout)
       failure → completionError recovery screen → "Riprova a generare il report"
                 → retries materialization only (pre-check session + paid state kept; no re-payment)
```

**Student** — files: `StudentPaidSottocheckPage.tsx`, `StudentReportPage.tsx`, `tesicheckPersistentCheck.ts`, `studentView.ts`

```
/student-view/sottocheck   (student already authenticated — no account step, no pre-check session)
  → upload → validation → character count / price (local 700 ms fake loader)
  → StudentFlowStage: form → payment → redirecting   (React state, not sessionStorage)
  → SottocheckPaymentGatewayBoundary (still wrapped in the local GatewayPanel card — visual polish only, see §8)
       same 1500 ms auto-success / ?paymentDemo=1 behaviour as guest
  → success → paymentReferenceRef = createStudentPaymentReference() (minted once) → isProcessing
  → createPersistentStudentCheck({ studentId: STUDENT_VIEW_STUDENT_ID, ..., sourcePaymentReference })  (dedupe by sourcePaymentReference)
       success → navigate('/student-view/report/:checkId')  (~1200 ms, inside StudentLayout)
       failure → isProcessing = false → completionError recovery screen → "Riprova a generare il report"
                 → retries materialization only (document / quote / payment reference kept; no re-payment)
```

---

## 3. Important implementation decisions

- **Pre-check session vs persistent check.** Two distinct objects (canonical §3). Pre-check = temporary, guest-only, `sessionStorage`, thrown away once claimed. Persistent check = paid, owned, `localStorage`, source for the report. Only the guest flow uses a pre-check session; Student creates a persistent check directly.
- **`temporaryDocumentRef`.** Prototype token (`tmp-doc-<ts>-<rand>`) on the pre-check session standing in for a recoverable server-side temporary upload. Also used as the idempotency key (`sourceTemporaryDocumentRef`) when converting to a persistent check.
- **`sourcePaymentReference` (Student).** Student has no guest pre-check, so it cannot reuse `sourceTemporaryDocumentRef`. `createStudentPaymentReference()` (`tesicheckPersistentCheck.ts`) mints a `stu-pay-<ts>-<rand>` token once, when the (simulated) payment succeeds; `StudentPaidSottocheckPage` holds it in `paymentReferenceRef` for the lifetime of the mounted flow so every materialization retry passes the **same** key. It is stored on the Student `PersistentTesiCheck` and is the dedupe key for `createPersistentStudentCheck()`. The two idempotency mechanisms are deliberately **not** unified: guest = `sourceTemporaryDocumentRef` (from the pre-check session), Student = `sourcePaymentReference` (from payment success).
- **`flowStage` lifecycle** (`PrecheckFlowStage`): `quote_ready → checkout_account → checkout_verify_email → checkout_payment → redirecting → payment_success`. `checkout_verify_email` was added in this workstream and must stay in the `isPrecheckFlowStage` guard or stored sessions fail validation. `payment_success` is a latch: it means "paid but persistent check not yet created".
- **Account session** (`tesicheckAccountSession.ts`): `{ id, email, name?, emailVerified }` in `localStorage`. `signInAccount` → `emailVerified: true` (returning user is trusted). `registerAccount` → `emailVerified: false`. `confirmAccountEmail()` flips it. `isPaymentEnabled(session)` = `authenticated && emailVerified` and gates `startRedirect`, not just the button's disabled state.
- **`DEMO_ACCOUNT_ID`** = `'public-account-demo'`, exported from `tesicheckAccountSession.ts`. Single shared prototype identity. Used as `owner.id` for every standalone check **and** as the ownership constant in `PublicReportPage.tsx` — kept as one exported constant so the two never drift.
- **`owner.context`** on `PersistentTesiCheck` is `'standalone' | 'student'` only. No `coach` / `admin` value — those flows are entitlement/privileged and out of scope.
- **30-day `expiresAt`.** `RETENTION_DAYS = 30` in `tesicheckPersistentCheck.ts`; `expiresAt = completedAt + 30d` computed once at creation. Only `PublicReportPage` / `StudentReportPage` evaluate it (expired → redirect to history). No sweep, no "expiring soon", no history-list handling.
- **Storage responsibilities.** `sessionStorage` = the in-progress guest checkout (disposable, per-tab). `localStorage` = things that must outlive the checkout: the account identity and the paid checks. See §4.
- **Why `File` / `Blob` is not persisted.** Web storage holds JSON only. `UploadedDocument` is metadata (`name`, `size`, `format`); the real bytes are represented by `temporaryDocumentRef` / the check `report.reference`. Production must resolve those to real storage.
- **Shared payment gateway boundary.** `SottocheckPaymentGatewayBoundary` — props `onSuccess` / `onFailed` / `onCancelled`; the host page still owns stage transitions and navigation. It renders a minimal Sottotesi brand mark (`SottotesiLogodefDefault`), the `Reindirizzamento al pagamento` heading, a `Reindirizzamento in corso…` status line and a spinner — no topbar, no summary, no fake bank/card UI. It now owns **one** timer: in normal mode it calls `onSuccess` after `SIMULATED_REDIRECT_MS = 1500` (via a ref so the callback stays fresh without resetting the timer; StrictMode double-invoke still fires once). `?paymentDemo=1` (read from `window.location.search`) skips the timer and shows manual **Esito positivo / Esito negativo / Annullato** buttons so every return path stays reproducible on the deployed prototype. Reused by guest and Student; supersedes the earlier "no state / no timers" note.
- **`redirecting` is a system boundary, not a checkout step.** `PublicAccountGatePage` early-returns for `flowStage === 'redirecting'`: a bare `max-w-[440px]` container with no card border and **no `SottocheckCheckoutSummary`** (canonical §5 / §7.2 updated to match). Student wraps the same boundary in its existing `GatewayPanel` card — left as-is, visual polish only (§8).
- **Mobile order-summary placement.** `SottocheckCheckoutSummary` is passed `className="order-first md:order-none"` in `PublicAccountGatePage`; on `grid-cols-1` the compact collapsible summary sits **above** the auth/payment form, on `md+` the sticky right rail keeps source order.
- **Shared price formatting.** `formatCheckoutPrice(n)` in `src/app/utils/formatCheckoutPrice.ts` → `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` = `€14,90`. Presentation only — does not compute or round. Used by `SottocheckCheckoutSummary`, `SottocheckPricingPreview` (total), `PublicLandingPage` resume state, and `StudentPaidSottocheckPage` `PaymentPanel`. The `EUR 0,52/1000cc` rate line in `SottocheckPricingPreview` is deliberately left untouched (different amount + open arithmetic issue, §7).
- **Separate report wrappers.** `PublicReportPage` (guard: `owner.context === 'standalone'` + `DEMO_ACCOUNT_ID`, shell: `PublicLayout`) and `StudentReportPage` (guard: `owner.context === 'student'` + `STUDENT_VIEW_STUDENT_ID`, shell: `StudentLayout`) are deliberately separate wrappers around the **same** static report content (`public/sottocheck-output-preview.html`, `mode=authenticated-public`).
- **StrictMode duplicate-creation guards.** `PublicAccountGatePage` uses `hasCreatedCheckRef` (persistent-check creation effect) and `didResolveAccountRef` (skip-authenticated effect). `StudentPaidSottocheckPage` uses `hasCreatedCheckRef`. Without these the double-invoked effect either double-creates or clears the session mid-run and shows the empty state.
- **Payment success → persistent check conversion.** `returnFromPayment('success')` sets `isCompletingPayment` + `flowStage = payment_success`. An effect then calls `createPersistentCheckFromPaidPrecheck()`, which requires `flowStage === 'payment_success' && claim.status === 'claimed' && claim.accountId`, dedupes by `sourceTemporaryDocumentRef`, builds the `PersistentTesiCheck` (`owner.context: 'standalone'`, `status: 'completed'`, `payment.status: 'paid'`, `report.availability: 'available'`, `expiresAt`), writes it to `public-tesicheck-checks-v1`, and only then `clearPrecheckSession()`.
- **Post-payment materialization recovery.** Materialization can fail after a verified payment (prototype: `saveChecks` / `localStorage` throwing, or `?paymentDemo=reportfail`). Both flows keep the paid state and surface a recoverable screen instead of a dead end:
  - **Guest** (`PublicAccountGatePage`): the pre-check session stays at `flowStage = payment_success`, still claimed; `completionError` renders a full-screen early return ("Non siamo riusciti a generare il report" / "Il pagamento è stato ricevuto. Puoi riprovare senza effettuare un nuovo pagamento." + "Riprova a generare il report"). Retry calls `createPersistentCheckFromPaidPrecheck()` only — no gateway, no new session, no re-claim. `clearPrecheckSession()` still runs only on success.
  - **Student** (`StudentPaidSottocheckPage`): previously hung forever on "Stiamo generando il report..."; on failure it now sets `isProcessing → false` and renders the same semantic recovery screen inside `StudentLayout`. Retry calls `createPersistentStudentCheck({ ..., sourcePaymentReference })` only.
  - Guard: `hasCreatedCheckRef` is reset on a real failure so a retry can run; kept closed on the `?paymentDemo=reportfail` branch so no silent auto-retry / StrictMode re-fire — recovery is the button. `reportFailDemoRef` latches the one-shot demo failure. No path double-creates: guard + per-origin dedupe + `completedCheck` short-circuit + the button unmounts once processing / `completedCheck` takes over.
- **Returning / already-authenticated users skip the forms.** On `/public/account`, if an account session exists: verified → jump to `checkout_payment`; unverified → jump to `checkout_verify_email`. Guarded by `didResolveAccountRef`.

---

## 4. Storage keys

| Key | Store | Contents |
| --- | --- | --- |
| `tesicheck-precheck-session-v1` | **sessionStorage** | `TesiCheckPrecheckSession`: `document` (metadata), `temporaryDocumentRef`, `validationState: 'valid'`, `characterCount`, `price`, `flowStage`, `claim: { status, accountId? }`. Disposable; cleared on claim-to-persistent, on a new upload, or on file clear. |
| `tesicheck-account-session-v1` | **localStorage** | `TesiCheckAccountSession`: `id` (always `DEMO_ACCOUNT_ID`), `email`, `name?`, `emailVerified`. Prototype identity + verification flag. Introduced in this workstream. |
| `public-tesicheck-checks-v1` | **localStorage** | `PersistentTesiCheck[]` (newest first). Paid, owned checks for both `standalone` and `student` contexts. Read by the two report pages via `getPersistentTesiCheck(checkId)`. Each record carries its origin's materialization idempotency key — `sourceTemporaryDocumentRef` (standalone) **or** `sourcePaymentReference` (student); a retry looks up the existing record by that key instead of writing a duplicate. |

Out of scope but adjacent (do **not** treat as part of this flow): `localStorage['admin-sottocheck-jobs-v1']` (admin only, different schema), `*-sidebar-collapsed` (shell UI state).

---

## 5. Relevant files

- **`src/app/data/tesicheckPrecheckSession.ts`** — guest checkout session model + `sessionStorage` accessors; `PrecheckFlowStage` union and its guard; `claimPrecheckSession`, `setPrecheckFlowStage`, `clearPrecheckSession`.
- **`src/app/data/tesicheckAccountSession.ts`** — prototype account identity + email-verification state in `localStorage`; `signInAccount` / `registerAccount` / `confirmAccountEmail` / `isPaymentEnabled`; exports `DEMO_ACCOUNT_ID`. New in this workstream.
- **`src/app/data/tesicheckPersistentCheck.ts`** — `PersistentTesiCheck` model (incl. optional `sourceTemporaryDocumentRef` / `sourcePaymentReference`), `localStorage` array, `RETENTION_DAYS = 30`; `createPersistentCheckFromPaidPrecheck()` (guest conversion, dedupe by `sourceTemporaryDocumentRef`), `createPersistentStudentCheck()` (student, dedupe by `sourcePaymentReference`), `createStudentPaymentReference()` (mints the Student key), `getPersistentTesiCheck()`.
- **`src/pages/public/PublicLandingPage.tsx`** — `/public` landing + guest upload/validation/pricing; writes the pre-check session; renders the "Hai un TesiCheck in corso" resume state when `flowStage !== 'quote_ready'`.
- **`src/pages/public/PublicAccountGatePage.tsx`** — `/public/account`; single page hosting stages `checkout_account` (inline `LoginForm` / `RegisterForm`), `checkout_verify_email` (`VerifyEmailForm` + OTP), `checkout_payment`, the transient success panel, the `completionError` post-payment recovery early return (retry of `createPersistentCheckFromPaidPrecheck()` only), and the Account / Email / Pagamento checklist. `redirecting` is an **early return** — minimal branded page, no card, no summary. Owns all guest checkout transitions.
- **`src/app/components/SottocheckCheckoutSummary.tsx`** — the persistent "Riepilogo TesiCheck": one `SummaryFields` (document, character count, total via `formatCheckoutPrice`) rendered as a desktop sticky rail and a mobile collapsible `<details>`. Forwards `className` — `PublicAccountGatePage` uses `order-first md:order-none` for mobile placement. Not rendered during `redirecting`. New in this workstream.
- **`src/app/components/SottocheckPaymentGatewayBoundary.tsx`** — minimal Sottotesi-branded gateway interstitial (brand mark + heading + `Reindirizzamento in corso…` + spinner); props `onSuccess` / `onFailed` / `onCancelled`. Owns a single 1500 ms auto-success timer in normal mode; `?paymentDemo=1` disables it and shows manual outcome buttons. Host page owns stage transitions + navigation. Shared by guest and Student.
- **`src/pages/public/PublicReportPage.tsx`** — standalone authenticated report wrapper inside `PublicLayout`; owner guard `standalone` + `DEMO_ACCOUNT_ID`; expired-state redirect; iframe of the demo report.
- **`src/pages/student/StudentPaidSottocheckPage.tsx`** — `/student-view/sottocheck`; local `StudentFlowStage` machine (`form | payment | redirecting`) + `isProcessing` + `completionError`; reuses `SottocheckUploadForm`, `SottocheckPricingPreview`, `SottocheckPaymentGatewayBoundary`. On payment success mints one `sourcePaymentReference` (`paymentReferenceRef`) and creates a `student`-context persistent check. On materialization failure: `isProcessing → false`, `completionError` early return ("Non siamo riusciti a generare il report" + "Riprova a generare il report"), retry re-runs `createPersistentStudentCheck({ ..., sourcePaymentReference })` only. `?paymentDemo=reportfail` forces one materialization failure for testing.
- **`src/pages/student/StudentReportPage.tsx`** — student authenticated report wrapper inside `StudentLayout`; owner guard `student` + `STUDENT_VIEW_STUDENT_ID`; ~90% identical to `PublicReportPage` by intent (different shell + support copy).
- **`src/app/routes.tsx`** — route table. Key rows: `/public/account` → `PublicAccountGatePage`; `/public-view/report/:checkId` → `PublicReportPage` (under `PublicLayout`); `/student-view/sottocheck` → `StudentPaidSottocheckPage`; `/student-view/report/:checkId` → `StudentReportPage` (under `StudentLayout`).
- **`public/sottocheck-output-preview.html`** — static demo report content (~622 lines), parameterised by query string (`mode`, `back`, `documentName`, `completedAt`, repeated `css`). Embedded via `<iframe>` by both report pages with `mode=authenticated-public`.

Supporting (shared primitives, not modified for behaviour this workstream):

- **`src/app/components/SottocheckUploadForm.tsx`** — the only real validator (extension whitelist `pdf/docx`, `MAX_FILE_SIZE_BYTES = 50 MB`); emits `UploadedDocument` + status.
- **`src/app/components/SottocheckPricingPreview.tsx`** — pricing/character-count display component (pure); the total uses `formatCheckoutPrice`. The `Costo indicativo: EUR 0,52/1000cc.` rate line is left in its own format (open arithmetic issue, §7).
- **`src/app/utils/formatCheckoutPrice.ts`** — shared presentation-only price formatter → `€14,90`. New in this polish pass. Do **not** move it into `tesicheckPrecheckSession.ts`.
- **`src/app/components/ui/input-otp.tsx`** — shadcn OTP primitive; first real usage is `VerifyEmailForm` in `PublicAccountGatePage`.
- **`src/app/utils/studentView.ts`** — `STUDENT_VIEW_STUDENT_ID = 'S-052'` identity shim used by the Student flow and report guard.
- **`.github/skills/tesicheck-checkout-smoke/SKILL.md`** — manual browser smoke-test checklist for this flow (`disable-model-invocation: true`; run only when explicitly asked).

---

## 6. Shared vs intentionally separate

**Shared (single implementation, reused):**

- Upload + document validation — `SottocheckUploadForm` (guest, Student).
- Pricing / character-count display — `SottocheckPricingPreview`; demo constants `DEMO_CHARACTER_COUNT = 28500` / `DEMO_PRICE = 14.9` (currently duplicated in `PublicLandingPage` and `StudentPaidSottocheckPage` — see §7).
- Price formatting — `formatCheckoutPrice()` (`src/app/utils/formatCheckoutPrice.ts`); guest checkout, landing resume, pricing preview total, Student `PaymentPanel`.
- Payment gateway boundary — `SottocheckPaymentGatewayBoundary` (guest, Student); same 1500 ms auto-success + `?paymentDemo=1` behaviour in both. Guest hosts it bare; Student still wraps it in a card (§8, visual polish only).
- Persistent paid-check infrastructure — `tesicheckPersistentCheck.ts` for both `standalone` and `student` contexts.
- Report content — `public/sottocheck-output-preview.html` (all authenticated report pages).
- Order summary — `SottocheckCheckoutSummary` (guest checkout; available for reuse). Hidden during `redirecting`.

**Intentionally separate (do not merge):**

- **Public shell vs Student shell** — `PublicLayout` / `PublicHeader` / `PublicSidebar` vs `StudentLayout` / `StudentHeader` / `StudentSidebar`. Architecture invariant (`AGENTS.md`, `docs/architecture.md`).
- **Report wrappers** — `PublicReportPage` vs `StudentReportPage`: different shell, ownership context, and role-specific support/actions. Only the *content* is shared.
- **Guest account step** — belongs to the guest checkout only. Student/Coach/Admin are already authenticated and must not render login/registration.
- **Role-specific support / actions / metadata** — canonical §13–15: report content may be shared, shell + support boxes + operational metadata must not.
- **Coach and Admin future flows** — entitlement/quota (Coach coaching path) and privileged (Admin) flows are `payment_required = false`; they must not inherit the guest/Student payment machinery.

Architectural reasons already surfaced: same domain data (a "check") does **not** imply the same page or shell; `/public` (acquisition + guest pre-check) and `/public-view` (authenticated standalone area) are different contexts despite the shared word "public"; a universal TesiCheck component/model would collapse ownership, entitlement and shell differences that are real.

---

## 7. Known prototype limitations

**PROTOTYPE LIMITATION** (by design; do not "fix"):

- **Auth is simulated.** `signInAccount` / `registerAccount` accept any email; no backend, no token. Single identity `DEMO_ACCOUNT_ID`. A later slice added a prototype-only local registered-accounts registry (`tesicheck-registered-accounts-v1`, plaintext password) so `register → logout → login same account` is deterministic in a walkthrough: the **direct** landing login page (`/public/login`) checks the stored password when the email is a known local registration and shows an error on mismatch (unknown emails still sign in); the in-checkout `PublicAccountGatePage` login stays fully permissive. `PublicLayout` now redirects to `/public` when there is no standalone session (prototype guard, `/public-view` only). Production auth is delegated to the real application.
- **Email verification is simulated.** `VerifyEmailForm` accepts any 6-digit string; `confirmAccountEmail()` just flips the flag. "Invia di nuovo il codice" only shows a note.
- **Payment gateway is simulated.** Normal mode: no real redirect, no bank UI (deliberate — canonical §7); `SottocheckPaymentGatewayBoundary` just waits 1500 ms and calls `onSuccess`. Failed / cancelled are only reachable via `?paymentDemo=1`, which also disables the auto-success timer and shows manual **Esito positivo / Esito negativo / Annullato** buttons. Production must verify payment state through a real integration; the client is not source of truth.
- **Report is static.** Both report pages iframe the same fixed `sottocheck-output-preview.html`; no per-check data, scores are hard-coded in the HTML.
- **Pricing / character count are mock.** `DEMO_CHARACTER_COUNT = 28500`, `DEMO_PRICE = 14.9`, applied after a 700 ms `setTimeout`; no real extraction.
- **No `File` / `Blob` persistence.** Only document metadata survives a reload.
- **Student recovery is session-scoped.** The in-progress Student checkout (document, quote, `paymentReferenceRef`, `completionError`) lives only in React state — there is no `sessionStorage` / `localStorage` for the Student flow. A full page reload while on the recovery screen returns to the upload form; the paid state and the `sourcePaymentReference` are lost. (Guest recovery survives reload because the pre-check session is in `sessionStorage`.)

**BUG / OPEN ISSUE** (observed, out of scope here — log for later):

- `tsc --noEmit` baseline: **47 errors across 16 files** (e.g. `import.meta.env` typing in `PublicReportPage.tsx:69`, `PublicOutputPreviewPage`, `SottocheckOutputPreviewPage`; missing `figma:asset` / `*.png` module declarations; `thesis_topic` / `CoachPayout.status` in admin). Pre-existing; **not introduced by this workstream**. `vite build` does not typecheck.
- Vite build warning: main JS chunk > 500 kB (~1.6 MB raw / ~367 kB gzip). Pre-existing.
- `getViewBasePath` (`src/pages/coach/viewBasePath.ts`) checks `startsWith('/public')` before `/public-view`, so the `/public-view` branch is dead; success CTAs on `/public-view/sottocheck` can navigate out of `PublicLayout`.
- **RESOLVED — consumer Storico wired to the persistent store (see §12).** `/public-view/history` and `/student-view/history` now read `public-tesicheck-checks-v1` filtered by owner; a just-paid check appears in History. Legacy `/public/history` still renders `mockHistory` by design (isolated, not in scope).
- **OPEN PRODUCT ISSUE — pricing arithmetic mismatch.** `SottocheckPricingPreview.tsx` advertises `EUR 0,52/1000cc` (→ 14.82 for 28 500 cc) which does not reconcile with the mock total `DEMO_PRICE = 14.9`. The polish pass deliberately did **not** touch this line or invent a price — it needs a product decision on the real rate/total relationship.
- **RESOLVED — post-payment report recovery (guest + Student).** Materialization failure after a verified (simulated) payment no longer dead-ends. Guest: `PublicAccountGatePage` keeps the paid pre-check session and shows a recoverable `completionError` screen with "Riprova a generare il report" that re-runs `createPersistentCheckFromPaidPrecheck()` only. Student: `StudentPaidSottocheckPage` previously hung forever on "Stiamo generando il report..."; it now clears `isProcessing`, shows the same recovery screen, and retries `createPersistentStudentCheck({ ..., sourcePaymentReference })` only. Neither retry re-runs payment. Idempotency is per-origin and **not** unified — guest `sourceTemporaryDocumentRef`, Student `sourcePaymentReference` — so a retry reuses an already-written record rather than duplicating. `?paymentDemo=reportfail` simulates one materialization failure in **both** flows.
- `DEMO_CHARACTER_COUNT` / `DEMO_PRICE` duplicated in `PublicLandingPage.tsx` and `StudentPaidSottocheckPage.tsx`.
- Legacy `/public/sottocheck` (renders `student/SottocheckPage`, fake `setTimeout` payment, writes nothing) and orphaned `/public/success` still routed.

---

## 8. Known UX polish

**Resolved in the polish pass:**

- **Payment redirect branding** — `SottocheckPaymentGatewayBoundary` now shows a minimal `SottotesiLogodefDefault` mark, no topbar, no summary. Boundary reads clearly.
- **Developer-facing outcome `<details>`** — removed from the primary UI; manual success / failed / cancelled now live behind `?paymentDemo=1` only.
- **Mobile summary placement** — the compact `SottocheckCheckoutSummary` now precedes the form on mobile (`order-first md:order-none`).
- **Price format inconsistency** — all paid-consumer amounts go through `formatCheckoutPrice()` → `€14,90`.
- **Post-payment report recovery** — the guest `completionError` dead-end is now a recoverable retry screen, and the Student infinite "Stiamo generando il report..." hang is fixed with the same recovery state. Retry re-runs materialization only (guest key `sourceTemporaryDocumentRef`, Student key `sourcePaymentReference`), never re-payment. `?paymentDemo=reportfail` covers both.

**Still open:**

- **Checkout visual refinement** — spacing/rhythm of the left column vs the summary rail; the Account / Email / Pagamento checklist placement (sits below the form behind a `border-t`, reads like a footer) was deliberately not moved, pending visual inspection.
- **Student gateway card wrapper** — `StudentPaidSottocheckPage`'s `GatewayPanel` still wraps the shared boundary in a bordered `max-w-[760px]` card, so the Student interstitial looks more "card-like" than the bare guest one. Visual polish only — no flow/state difference; not changed to keep the Student view out of scope.
- **Terse copy** — the no-session fallback ("Inizia un nuovo check") block is minimal.
- **Landing header** — "Accedi" / "Registrati" still link to `sottotesi.it` (external marketing), not the in-app checkout; intentional for now, worth revisiting.

Do not resolve the open items here — they are the next workstream (§11).

---

## 9. Testing / verification status

- **`npm run build`**: last run **succeeded** (Vite v6.4.2, 1809 modules, ~18 s, no errors) after the polish pass **and** the post-payment recovery fixes (guest `completionError` retry, Student `sourcePaymentReference` + recovery screen, `?paymentDemo=reportfail`).
- **`tsc --noEmit`**: **47-error pre-change baseline unchanged**; no typed code added beyond the `formatCheckoutPrice` / `createStudentPaymentReference` helpers, the optional `sourcePaymentReference` field, and JSX/handler swaps.
- **`git diff --check`**: clean (exit 0). Working tree is **not clean** — uncommitted: the polish-pass changes (+ new `src/app/utils/formatCheckoutPrice.ts`), the `docs/tesicheck-canonical-flow.md` §5/§7.2/§29 realignment, the post-payment recovery fixes (`PublicAccountGatePage.tsx`, `StudentPaidSottocheckPage.tsx`, `tesicheckPersistentCheck.ts`), and this handoff. The earlier inline-account-checkout work is committed as `6bf4422`.
- **Runtime / browser walkthrough**: **NOT performed.** Dev server boots clean (`:5174`), `/` and `/public/account` return 200, and every changed module transforms (200), but no interactive click-through (upload, form submit, OTP, gateway, report) was executed. **No step of the flow has been confirmed PASS in a browser.**
- **Automated browser tests**: **none in the repo** (no vitest / jest / playwright / cypress; `package.json` scripts are only `dev`, `build`, `preview`). A manual checklist exists at `.github/skills/tesicheck-checkout-smoke/SKILL.md`.

---

## 10. Important invariants for future agents

(Product rationale: see [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md) §29–§31.)

- No guest payment without a persistent identity to own the check.
- Registration requires email verification **before** payment is enabled (`isPaymentEnabled = authenticated && emailVerified`).
- No standalone success pages between payment and report — only a transient inline processing state.
- During `redirecting` the checkout summary is **not** rendered; the interstitial is a minimal Sottotesi-branded system boundary (canonical §5 / §7.2 / §29).
- Paid-consumer amounts render only via `formatCheckoutPrice()` → `€14,90`; never re-introduce ad-hoc `EUR ${n.toFixed(2)}`.
- `SottocheckPaymentGatewayBoundary` owns exactly one timer (1500 ms auto-success, normal mode); `?paymentDemo=1` is the only way to reach failed / cancelled. Do not move stage transitions or navigation into the boundary.
- Post-payment materialization failure must stay **recoverable without repeating payment**: keep the paid state, show the recovery screen, retry the persistent-check creation only.
- Keep the two materialization idempotency keys separate — guest `sourceTemporaryDocumentRef`, Student `sourcePaymentReference`. Do not unify them.
- Student self-service TesiCheck is **paid** (`payment_required = true`).
- Student must **not** consume the coaching TesiCheck quota; that quota is Coach-only.
- Coach / Admin rules must not be inferred from the Student / Public flow.
- The payment gateway appears **only** where `payment_required = true`.
- `/public` and `/public-view` stay separate contexts.
- Same domain data does not imply the same shell or page.
- Do not create a universal TesiCheck component/model without a demonstrated shared responsibility.
- Keep `checkout_verify_email` in both the `PrecheckFlowStage` union and `isPrecheckFlowStage`.
- Keep `DEMO_ACCOUNT_ID` a single exported constant shared by the account session and the report ownership check.
- Consumer History reads `public-tesicheck-checks-v1` through `getPersistentTesiChecksForOwner`, filtered by the same owner guard as the matching report page; it never mutates records and derives availability from `expiresAt` at render time.
- Consumer History primary action is `Apri report` into the role-specific report route — never `Scarica report`, no download action, no disabled button on expired records.
- Consumer History shows no price / pages / character count / internal refs / scores; `In scadenza` stays unimplemented until a threshold is approved (canonical §30).
- Legacy `/public/history` stays on its isolated mock (`HistoryPage` with no `context` prop) — do not wire it to the persistent store.
- Coach History is a separate workstream and must not reuse the consumer persistent store or its report routes (canonical §19.1).

---

## 11. Recommended next work

**Workstream: TesiCheck paid consumer final polish.**

Done: payment redirect branding, mobile summary order, `?paymentDemo=1`, shared price format, `redirecting` early-return, post-payment report recovery (guest + Student, `?paymentDemo=reportfail`).

Priority order for what remains:

1. Checkout visual / interaction polish (`PublicAccountGatePage`, `SottocheckCheckoutSummary`) — left-column spacing/rhythm vs the summary rail, Account / Email / Pagamento checklist placement, no-session fallback copy.
2. Pricing arithmetic decision (§7) — real rate vs total.
3. Student `GatewayPanel` card wrapper — decide whether the Student interstitial should match the bare guest one (§8).
4. Final paid-consumer browser walkthrough (run `.github/skills/tesicheck-checkout-smoke/SKILL.md` end to end; guest + returning + resume + responsive; verify `?paymentDemo=1` reaches failed/cancelled and `?paymentDemo=reportfail` reaches the recovery screen in both flows).
5. Only after the above: move to Coach entitlement flow. (Consumer History is done — see §12. Coach History is its own workstream and is blocked on a Coach persistent-check model + Coach report route + free-check mode.)

Do not implement these now.

---

## 12. Consumer History / Storico — implementation state

**Scope:** authenticated standalone `/public-view/history` and Student `/student-view/history` only. Coach, Admin, checkout, payment, recovery, report content, retention duration, pricing and legacy-route cleanup were not touched.

**Data source.** Both routes render from the real persistent paid checks in `public-tesicheck-checks-v1`, via a read-only accessor `getPersistentTesiChecksForOwner(context, ownerId)` (`tesicheckPersistentCheck.ts`): validates each record with `isPersistentTesiCheck`, exact `owner.context` + `owner.id` match, newest `completedAt` first. No schema change, no migration, no expiry-driven mutation.

**Ownership filtering (mirrors the report-page guards).**

- `/public-view/history` → `context="standalone"` → `owner.context === 'standalone' && owner.id === DEMO_ACCOUNT_ID`.
- `/student-view/history` → `context="student"` → `owner.context === 'student' && owner.id === STUDENT_VIEW_STUDENT_ID`.
- Each list requires both an exact context and an exact id match, so checks never leak between contexts.

**Per-item information shown.**

- Primary: document name (`document.name`); availability status badge (`Completato` / `Scaduto`); explicit expiry line — `Disponibile fino al {d MMMM yyyy}` when available, `Scaduto il {d MMMM yyyy}` when expired (Italian long date, same format as the report pages), always visible, never a tooltip.
- Primary action (available only): `Apri report` → `/public-view/report/:checkId` or `/student-view/report/:checkId` (role-specific route; label is exactly `Apri report`, never `Scarica report`; no download action in History).
- Secondary: `Completato il {d MMMM yyyy}` (from `completedAt`).
- **Not shown:** price, character count, pages, internal id, `payment.reference`, `sourceTemporaryDocumentRef` / `sourcePaymentReference`, plagiarism / AI scores.

**Availability / expiry.** Derived at render time: `new Date(check.expiresAt).getTime() <= Date.now()`. The stored record is never mutated. Available → `Completato` badge + `Disponibile fino al …` + `Apri report`. Expired → `Scaduto` badge + `Scaduto il …` + **no action element at all** (not a disabled button). Expired records stay in the list.

**`In scadenza`.** Not implemented. No canonical threshold is defined (canonical §30). Only the explicit expiry date is shown; no “X days remaining” logic.

**Empty state.** Shared structure/copy — heading `Nessun TesiCheck nello storico`, body `I TesiCheck completati compariranno qui insieme alla data di disponibilità del report.` Student CTA `Nuovo TesiCheck` → `/student-view/sottocheck`. Standalone CTA **omitted** — `/public-view/sottocheck` still renders the legacy `SottocheckPage` (fake payment, writes nothing, `getViewBasePath` bug §7), so it is not a safe entry point; not fixed here.

**Legacy `/public/history`.** Unchanged. `HistoryPage` takes an optional `context` prop; with no prop it renders `LegacyPublicHistory` — the previous `mockHistory` implementation verbatim (mock price / pages / `.txt` download / `In elaborazione`). It is deliberately **not** connected to `public-tesicheck-checks-v1`. Route and component binding untouched.

**Status badge.** `SottocheckHistoryStatusBadge` gained an additive `'expired'` member → `Scaduto`, restrained neutral styling (`--muted` / `--muted-foreground`, no danger colour). `processing` / `error` remain in the union but the redesigned consumer History never emits them. The component is also used by `src/pages/coach/ArchivioPage.tsx` (Coach + Student Archivio); it passes only `completed`, so that surface is unaffected. A component-reuse audit confirmed no existing generic/visual badge primitive fits without duplicating styling, and every semantic status component belongs to another domain — so `SottocheckHistoryStatusBadge` is kept.

**Files changed for this piece:** `src/app/data/tesicheckPersistentCheck.ts` (accessor), `src/app/components/SottocheckHistoryStatusBadge.tsx` (`expired`), `src/pages/student/HistoryPage.tsx` (redesign + legacy split), `src/app/routes.tsx` (pass `context` to the two in-scope mounts). `npm run build` succeeds; `git diff --check` clean; `tsc --noEmit` at the unchanged 47-error baseline. Committed as `256a948` — *feat(tesicheck): connect consumer history to paid checks*.

### Coach History (not done)

Coach TesiCheck History (`src/pages/coach/ArchivioPage.tsx`, mounted at `/coach-view/history` and `/coach-view/archivio`) still renders a 2-item `mockHistory` (`{ id, documentName, pagesSelected, status, createdAt }`). The Coach check flow (`src/pages/coach/SottocheckPage.tsx`) persists nothing. To reach canonical Coach History (§19.1) the following do not exist yet and must be built as a separate workstream: a Coach persistent-check model (with Student, coaching path, credits-used-by-this-check, free-check price, `completedAt`, `expiresAt`, report ref, and a path-bound / `Check libero` discriminator), a `/coach-view/report/:checkId` route, and the Coach free-check mode. Coach History must **not** reuse `public-tesicheck-checks-v1`. No `TesiCheckHistoryItem` leaf was extracted — with standalone + Student already sharing one implementation and Coach having no data, extraction is not yet demonstrated duplication reduction.
