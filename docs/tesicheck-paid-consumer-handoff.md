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

**Explicitly NOT part of this workstream:**

- Coach entitlement / coaching-path flow.
- Coach paid vs free "modalità" selector.
- Admin TesiCheck flow.
- History / Storico redesign (`In scadenza`, `Scaduto`, wiring lists to the persistent store).
- Full expiry / retention redesign (only the 30-day `expiresAt` field + report-page evaluation exist).
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
  → createPersistentCheckFromPaidPrecheck() → clearPrecheckSession()
  → navigate('/public-view/report/:checkId')   (after ~1200 ms, inside PublicLayout)
```

**Student** — files: `StudentPaidSottocheckPage.tsx`, `StudentReportPage.tsx`, `tesicheckPersistentCheck.ts`, `studentView.ts`

```
/student-view/sottocheck   (student already authenticated — no account step, no pre-check session)
  → upload → validation → character count / price (local 700 ms fake loader)
  → StudentFlowStage: form → payment → redirecting   (React state, not sessionStorage)
  → SottocheckPaymentGatewayBoundary (still wrapped in the local GatewayPanel card — visual polish only, see §8)
       same 1500 ms auto-success / ?paymentDemo=1 behaviour as guest
  → success → isProcessing → createPersistentStudentCheck({ studentId: STUDENT_VIEW_STUDENT_ID, ... })
  → navigate('/student-view/report/:checkId')   (after ~1200 ms, inside StudentLayout)
```

---

## 3. Important implementation decisions

- **Pre-check session vs persistent check.** Two distinct objects (canonical §3). Pre-check = temporary, guest-only, `sessionStorage`, thrown away once claimed. Persistent check = paid, owned, `localStorage`, source for the report. Only the guest flow uses a pre-check session; Student creates a persistent check directly.
- **`temporaryDocumentRef`.** Prototype token (`tmp-doc-<ts>-<rand>`) on the pre-check session standing in for a recoverable server-side temporary upload. Also used as the idempotency key (`sourceTemporaryDocumentRef`) when converting to a persistent check.
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
- **Returning / already-authenticated users skip the forms.** On `/public/account`, if an account session exists: verified → jump to `checkout_payment`; unverified → jump to `checkout_verify_email`. Guarded by `didResolveAccountRef`.

---

## 4. Storage keys

| Key | Store | Contents |
| --- | --- | --- |
| `tesicheck-precheck-session-v1` | **sessionStorage** | `TesiCheckPrecheckSession`: `document` (metadata), `temporaryDocumentRef`, `validationState: 'valid'`, `characterCount`, `price`, `flowStage`, `claim: { status, accountId? }`. Disposable; cleared on claim-to-persistent, on a new upload, or on file clear. |
| `tesicheck-account-session-v1` | **localStorage** | `TesiCheckAccountSession`: `id` (always `DEMO_ACCOUNT_ID`), `email`, `name?`, `emailVerified`. Prototype identity + verification flag. Introduced in this workstream. |
| `public-tesicheck-checks-v1` | **localStorage** | `PersistentTesiCheck[]` (newest first). Paid, owned checks for both `standalone` and `student` contexts. Read by the two report pages via `getPersistentTesiCheck(checkId)`. |

Out of scope but adjacent (do **not** treat as part of this flow): `localStorage['admin-sottocheck-jobs-v1']` (admin only, different schema), `*-sidebar-collapsed` (shell UI state).

---

## 5. Relevant files

- **`src/app/data/tesicheckPrecheckSession.ts`** — guest checkout session model + `sessionStorage` accessors; `PrecheckFlowStage` union and its guard; `claimPrecheckSession`, `setPrecheckFlowStage`, `clearPrecheckSession`.
- **`src/app/data/tesicheckAccountSession.ts`** — prototype account identity + email-verification state in `localStorage`; `signInAccount` / `registerAccount` / `confirmAccountEmail` / `isPaymentEnabled`; exports `DEMO_ACCOUNT_ID`. New in this workstream.
- **`src/app/data/tesicheckPersistentCheck.ts`** — `PersistentTesiCheck` model, `localStorage` array, `RETENTION_DAYS = 30`; `createPersistentCheckFromPaidPrecheck()` (guest conversion), `createPersistentStudentCheck()` (student), `getPersistentTesiCheck()`.
- **`src/pages/public/PublicLandingPage.tsx`** — `/public` landing + guest upload/validation/pricing; writes the pre-check session; renders the "Hai un TesiCheck in corso" resume state when `flowStage !== 'quote_ready'`.
- **`src/pages/public/PublicAccountGatePage.tsx`** — `/public/account`; single page hosting stages `checkout_account` (inline `LoginForm` / `RegisterForm`), `checkout_verify_email` (`VerifyEmailForm` + OTP), `checkout_payment`, plus the transient success panel and the Account / Email / Pagamento checklist. `redirecting` is an **early return** — minimal branded page, no card, no summary. Owns all guest checkout transitions.
- **`src/app/components/SottocheckCheckoutSummary.tsx`** — the persistent "Riepilogo TesiCheck": one `SummaryFields` (document, character count, total via `formatCheckoutPrice`) rendered as a desktop sticky rail and a mobile collapsible `<details>`. Forwards `className` — `PublicAccountGatePage` uses `order-first md:order-none` for mobile placement. Not rendered during `redirecting`. New in this workstream.
- **`src/app/components/SottocheckPaymentGatewayBoundary.tsx`** — minimal Sottotesi-branded gateway interstitial (brand mark + heading + `Reindirizzamento in corso…` + spinner); props `onSuccess` / `onFailed` / `onCancelled`. Owns a single 1500 ms auto-success timer in normal mode; `?paymentDemo=1` disables it and shows manual outcome buttons. Host page owns stage transitions + navigation. Shared by guest and Student.
- **`src/pages/public/PublicReportPage.tsx`** — standalone authenticated report wrapper inside `PublicLayout`; owner guard `standalone` + `DEMO_ACCOUNT_ID`; expired-state redirect; iframe of the demo report.
- **`src/pages/student/StudentPaidSottocheckPage.tsx`** — `/student-view/sottocheck`; local `StudentFlowStage` machine (`form | payment | redirecting`) + `isProcessing`; reuses `SottocheckUploadForm`, `SottocheckPricingPreview`, `SottocheckPaymentGatewayBoundary`; creates a `student`-context persistent check.
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

- **Auth is simulated.** `signInAccount` / `registerAccount` accept any email; password is collected but never checked; no backend, no token, no route guard. Single identity `DEMO_ACCOUNT_ID`.
- **Email verification is simulated.** `VerifyEmailForm` accepts any 6-digit string; `confirmAccountEmail()` just flips the flag. "Invia di nuovo il codice" only shows a note.
- **Payment gateway is simulated.** Normal mode: no real redirect, no bank UI (deliberate — canonical §7); `SottocheckPaymentGatewayBoundary` just waits 1500 ms and calls `onSuccess`. Failed / cancelled are only reachable via `?paymentDemo=1`, which also disables the auto-success timer and shows manual **Esito positivo / Esito negativo / Annullato** buttons. Production must verify payment state through a real integration; the client is not source of truth.
- **Report is static.** Both report pages iframe the same fixed `sottocheck-output-preview.html`; no per-check data, scores are hard-coded in the HTML.
- **Pricing / character count are mock.** `DEMO_CHARACTER_COUNT = 28500`, `DEMO_PRICE = 14.9`, applied after a 700 ms `setTimeout`; no real extraction.
- **No `File` / `Blob` persistence.** Only document metadata survives a reload.

**BUG / OPEN ISSUE** (observed, out of scope here — log for later):

- `tsc --noEmit` baseline: **47 errors across 16 files** (e.g. `import.meta.env` typing in `PublicReportPage.tsx:69`, `PublicOutputPreviewPage`, `SottocheckOutputPreviewPage`; missing `figma:asset` / `*.png` module declarations; `thesis_topic` / `CoachPayout.status` in admin). Pre-existing; **not introduced by this workstream**. `vite build` does not typecheck.
- Vite build warning: main JS chunk > 500 kB (~1.6 MB raw / ~367 kB gzip). Pre-existing.
- `getViewBasePath` (`src/pages/coach/viewBasePath.ts`) checks `startsWith('/public')` before `/public-view`, so the `/public-view` branch is dead; success CTAs on `/public-view/sottocheck` can navigate out of `PublicLayout`.
- Storico (`src/pages/student/HistoryPage.tsx`, mounted at `/public/history`, `/student-view/history`, `/public-view/history`) renders `mockHistory` and never reads `public-tesicheck-checks-v1` — a just-paid check does not appear in history.
- **OPEN PRODUCT ISSUE — pricing arithmetic mismatch.** `SottocheckPricingPreview.tsx` advertises `EUR 0,52/1000cc` (→ 14.82 for 28 500 cc) which does not reconcile with the mock total `DEMO_PRICE = 14.9`. The polish pass deliberately did **not** touch this line or invent a price — it needs a product decision on the real rate/total relationship.
- **OPEN ISSUE — `completionError` has no recovery path.** If `createPersistentCheckFromPaidPrecheck()` returns null after a successful (simulated) payment, `PublicAccountGatePage` shows the `completionError` block ("Non è stato possibile preparare il report.") with no CTA and dead-end copy ("Riprova ad aprire il checkout"). Left unresolved on purpose: wiring a retry button to the creation effect risks a double check or an accidental second charge. Needs a deliberate post-payment recovery behaviour.
- `DEMO_CHARACTER_COUNT` / `DEMO_PRICE` duplicated in `PublicLandingPage.tsx` and `StudentPaidSottocheckPage.tsx`.
- Legacy `/public/sottocheck` (renders `student/SottocheckPage`, fake `setTimeout` payment, writes nothing) and orphaned `/public/success` still routed.

---

## 8. Known UX polish

**Resolved in the polish pass:**

- **Payment redirect branding** — `SottocheckPaymentGatewayBoundary` now shows a minimal `SottotesiLogodefDefault` mark, no topbar, no summary. Boundary reads clearly.
- **Developer-facing outcome `<details>`** — removed from the primary UI; manual success / failed / cancelled now live behind `?paymentDemo=1` only.
- **Mobile summary placement** — the compact `SottocheckCheckoutSummary` now precedes the form on mobile (`order-first md:order-none`).
- **Price format inconsistency** — all paid-consumer amounts go through `formatCheckoutPrice()` → `€14,90`.

**Still open:**

- **Checkout visual refinement** — spacing/rhythm of the left column vs the summary rail; the Account / Email / Pagamento checklist placement (sits below the form behind a `border-t`, reads like a footer) was deliberately not moved, pending visual inspection.
- **Student gateway card wrapper** — `StudentPaidSottocheckPage`'s `GatewayPanel` still wraps the shared boundary in a bordered `max-w-[760px]` card, so the Student interstitial looks more "card-like" than the bare guest one. Visual polish only — no flow/state difference; not changed to keep the Student view out of scope.
- **`completionError`** — unresolved post-payment recovery issue (see §7).
- **Terse copy** — the no-session fallback ("Inizia un nuovo check") block is minimal.
- **Landing header** — "Accedi" / "Registrati" still link to `sottotesi.it` (external marketing), not the in-app checkout; intentional for now, worth revisiting.

Do not resolve the open items here — they are the next workstream (§11).

---

## 9. Testing / verification status

- **`npm run build`**: last run **succeeded** (Vite v6.4.2, 1809 modules, ~13 s, no errors) after the polish pass (branded redirect + auto-success timer + `?paymentDemo=1`, `redirecting` early-return, mobile summary order, `formatCheckoutPrice`).
- **`tsc --noEmit`**: **47-error pre-change baseline unchanged**; the polish pass added no typed code beyond the small `formatCheckoutPrice` helper and JSX swaps.
- **`git diff --check`**: clean (exit 0). Working tree is **not clean** — the polish-pass changes (7 files + new `src/app/utils/formatCheckoutPrice.ts`, plus `docs/tesicheck-canonical-flow.md` §5/§7.2/§29 realignment and this handoff) are **uncommitted**. The earlier inline-account-checkout work is committed as `6bf4422`.
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
- Student self-service TesiCheck is **paid** (`payment_required = true`).
- Student must **not** consume the coaching TesiCheck quota; that quota is Coach-only.
- Coach / Admin rules must not be inferred from the Student / Public flow.
- The payment gateway appears **only** where `payment_required = true`.
- `/public` and `/public-view` stay separate contexts.
- Same domain data does not imply the same shell or page.
- Do not create a universal TesiCheck component/model without a demonstrated shared responsibility.
- Keep `checkout_verify_email` in both the `PrecheckFlowStage` union and `isPrecheckFlowStage`.
- Keep `DEMO_ACCOUNT_ID` a single exported constant shared by the account session and the report ownership check.

---

## 11. Recommended next work

**Workstream: TesiCheck paid consumer final polish.**

Done in the polish pass: payment redirect branding, mobile summary order, `?paymentDemo=1`, shared price format, `redirecting` early-return.

Priority order for what remains:

1. Checkout visual / interaction polish (`PublicAccountGatePage`, `SottocheckCheckoutSummary`) — left-column spacing/rhythm vs the summary rail, Account / Email / Pagamento checklist placement, no-session fallback copy.
2. `completionError` post-payment recovery behaviour (§7) — needs a deliberate design before wiring any retry.
3. Pricing arithmetic decision (§7) — real rate vs total.
4. Student `GatewayPanel` card wrapper — decide whether the Student interstitial should match the bare guest one (§8).
5. Final paid-consumer browser walkthrough (run `.github/skills/tesicheck-checkout-smoke/SKILL.md` end to end; guest + returning + resume + responsive; verify `?paymentDemo=1` still reaches failed/cancelled).
6. Only after the above: move to Coach entitlement flow and History redesign.

Do not implement these now.
