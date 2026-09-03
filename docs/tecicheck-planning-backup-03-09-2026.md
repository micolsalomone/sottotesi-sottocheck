# Sottotesi / TesiCheck â€” Analysis + Next Flow Plan

## Context

This repo is aÂ **prototype**Â (Figma Make export) that specifies TesiCheck's production UX. CommitÂ `64a54fc`Â built the first real guest checkout. TheÂ **uncommitted diff toÂ **[**docs/tesicheck-canonical-flow.md**](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/docs/tesicheck-canonical-flow.md)**Â (+118 lines) is the spec for the next flow**, adding three things that do not exist yet:

1. **In-checkout login and registration**Â â€” real forms, not a gate;
2. anÂ **email-verification step**Â before payment (`payment_enabled = authenticated account + verified email`);
3. aÂ **persistent order summary**Â across login â†’ registration â†’ verification â†’ payment â†’ redirecting, sticky on desktop, collapsible on mobile, plus a scope rule (no onboarding/profile fields in checkout).

**Confirmed scope:**Â guest standalone only (`/public`Â â†’Â `/public/account`); a small mock session module for identity; and the StrictMode double-create fix. Student, Coach, Public-view and Admin flows are untouched.

---

# Part 1 â€” Analysis

## 1. Current architecture

**Stack.**Â Vite 6 + React 18.3 +Â `react-router`Â 7 (`createBrowserRouter`) + Tailwind v4 + Radix/shadcn primitives. TypeScript, butÂ `npm run build`Â is bareÂ `vite build`Â â€”Â **`tsc`****Â never runs**. No backend, no tests, no linter, no state library.

**Four isolated shells**, each with its own Layout/Header/Sidebar, composed inÂ [routes.tsx](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/routes.tsx):

| PrefixLayoutPages |                                                      |                                            |
| ----------------- | ---------------------------------------------------- | ------------------------------------------ |
| `/`               | `AdminLayout`Â (holds the only two context providers) | `src/pages/admin/`                         |
| `/coach-view`     | `CoachLayout`                                        | `src/pages/coach/`                         |
| `/student-view`   | `StudentLayout`                                      | `src/pages/student/`                       |
| `/public-view`    | `PublicLayout`                                       | `src/pages/public/`Â + reused student pages |
| `/public/*`       | **none**Â â€” flat, unwrapped routes                    | landing, checkout, legacy                  |

`AGENTS.md`Â makes shell separation an invariant and puts the project in "consolidation, cleanup, UI refinement" â€” not feature expansion.

**Three unreconciled persistence layers, no shared model:**

- `sessionStorage['tesicheck-precheck-session-v1']`Â â€”Â [tesicheckPrecheckSession.ts](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/data/tesicheckPrecheckSession.ts), guest checkout session
- `localStorage['public-tesicheck-checks-v1']`Â â€”Â [tesicheckPersistentCheck.ts](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/data/tesicheckPersistentCheck.ts), paid checks (`owner.context: 'standalone' | 'student'`Â only)
- `localStorage['admin-sottocheck-jobs-v1']`Â â€” a third, unrelated schema inÂ `SottocheckAdminPage`

**Report content**Â is one static asset,Â `public/sottocheck-output-preview.html`, embedded viaÂ `<iframe>`Â and parameterised by query string from four different React pages.

## 2. Current flow, analysis/results â†’ payment

Only theÂ **guest standalone**Â journey is wired to the spec:

```
/public  PublicLandingPage
  upload â†’ SottocheckUploadForm validates (pdf/docx, â‰¤50MB)
  â†’ 700ms fake timer â†’ savePrecheckSession({characterCount: 28500, price: 14.9, flowStage:'quote_ready'})
  â†’ "Procedi al pagamento" â†’ setPrecheckFlowStage('checkout_account') â†’ navigate('/public/account')

/public/account  PublicAccountGatePage  â† one page, four internal stages
  checkout_account   â†’ [Accedi] [Crea account]   â† both call the SAME handler
  checkout_payment   â†’ "Vai al pagamento"
  redirecting        â†’ SottocheckPaymentGatewayBoundary (success/failed/cancelled, manual)
  payment_success    â†’ createPersistentCheckFromPaidPrecheck() â†’ clearPrecheckSession()
                     â†’ inline "Pagamento ricevutoâ€¦" â†’ 1200ms â†’ /public-view/report/:checkId

```

`flowStage`Â survives reload, and the landing shows aÂ **"Hai un TesiCheck in corso" resume state**Â pastÂ `quote_ready`. Failed/cancelled return toÂ `checkout_payment`Â with the session intact and no check created. This part matches the canonical spec well â€” including the order summary, which already persists across account â†’ payment â†’ redirecting.

**The other entry points do not follow it:**

- `/student-view/sottocheck`Â â†’Â [StudentPaidSottocheckPage.tsx](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/pages/student/StudentPaidSottocheckPage.tsx)Â is aÂ **second, parallel implementation**Â with its own stage union, notices, summary markup, pricing constants and redirect. React state only, so no resume.
- `/public-view/sottocheck`Â andÂ `/public/sottocheck`Â â†’Â [student/SottocheckPage.tsx](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/pages/student/SottocheckPage.tsx)Â is aÂ **legacy fake flow**:Â `setTimeout`Â "payment",Â `SottocheckPricingPreview`Â rendered with no props (permanent placeholder), ends onÂ `SottocheckSuccessPanel`,Â **writes nothing to any store**. This is what the authenticated standalone dashboard links to.
- Coach is entitlement-based (`MAX_FREE_CHECK_CREDITS = 100`), Admin is privileged; neither has payment, both still end on theÂ `SottocheckSuccessPanel`Â the spec retires.

## 3. Where authentication and registration happen today

**They do not exist.**Â Verified absent acrossÂ `src/`: no auth context/provider/store, no route guard, noÂ `<Navigate>`, noÂ `/login`Â orÂ `/register`Â route, noÂ `<input type="password">`, no credential form, no token, no backend call.

What stands in for identity:

- **Route prefix = role.**Â Anyone can type any URL and get any shell.
- **Hardcoded names per header**:Â `"Francesca"`Â (Admin),Â `"Teresa P."`Â (Coach),Â `"Cliente Sottocheck"`Â (Public); Student resolves to mock recordÂ `S-052`Â viaÂ [studentView.ts](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/utils/studentView.ts).
- **Logout isÂ ****`navigate('/')`**Â with no state clear â€” so logging out of coach/student/public lands you in theÂ **admin dashboard**.
- **The account step is the two-button gate the spec forbids.**Â [PublicAccountGatePage.tsx:139-155](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/pages/public/PublicAccountGatePage.tsx#L139-L155): both buttons areÂ `onClick={continueToPayment}`, which stamps a hardcodedÂ `DEMO_PUBLIC_ACCOUNT_ID = 'public-account-demo'`. The doc calls this out at line 208:Â *"La schermata account non deve essere un semplice gate con due bottoni."*
- **`claimPrecheckSession(accountId)`**Â accepts any string with no verification â€” the only ownership mechanism.
- **Email verification: nothing.**Â TheÂ `input-otp`Â dependency andÂ `ui/input-otp.tsx`Â primitive both exist and areÂ **imported nowhere**.

## 4. Debt and inconsistencies relevant to the next flow

**Blocking**

1. **No identity primitive.**Â `emailVerified`Â and "skip the account step if already authenticated" cannot be expressed. The account id is a magic string duplicated inÂ `PublicAccountGatePage.tsx:15`Â andÂ `PublicReportPage.tsx:6`; if they drift, report ownership silently fails.
2. **`PrecheckFlowStage`****Â cannot represent verification**Â â€” the union has no verify stage, and the session has noÂ `emailVerified`.
3. **The order summary is hand-rolled and triplicated**Â (`PublicAccountGatePage.tsx:230-246`,Â `PublicLandingPage.tsx:425-430`,Â `StudentPaidSottocheckPage.tsx:215-218`). The spec now makes it a first-class element with sticky/collapsible behaviour.

**Real bugs (adjacent)**

4. **StrictMode double-create**Â â€”Â `PublicAccountGatePage.tsx:28-42`Â runs twice; run 1 creates the check and clears the session, run 2 sees staleÂ `completedCheck === null`, re-calls the creator, hits the null-session guard and setsÂ `completionError`Â â€” replacing "Pagamento ricevuto" with the empty state for \~1.2s.Â `StudentPaidSottocheckPage`Â avoids this withÂ `hasCreatedCheckRef`.Â **In scope.**
5. `getViewBasePath`Â precedence bug â€”Â `/public`Â matchesÂ `/public-view/...`Â first, soÂ `/public-view/sottocheck`Â success CTAs navigate users out ofÂ `PublicLayout`.Â *Out of scope, logged.*
6. Storico never readsÂ `public-tesicheck-checks-v1`, so a just-paid check never appears; history rows carryÂ `pagesSelected`Â while checkout carriesÂ `characterCount`.Â *Out of scope, logged.*

**Spec violations already present**Â (all out of scope, logged):Â `In elaborazione`Â is a stable history status andÂ `Scaduto`/`In scadenza`Â do not exist; retention is written but only evaluated in the two report pages; Coach has no modalitÃ  selector;Â `/public/success`Â +Â `showEmailCapture`Â (the retired email-recovery pattern) is still routed but orphaned.

**Ambient**

7. **47 pre-existing TypeScript errors**Â across 16 files, includingÂ `PublicLandingPage`Â andÂ `PublicReportPage`.Â `vite build`Â does not typecheck.Â **`tsc --noEmit`****Â cannot be a pass/fail gate â€” only "noÂ *****new*****Â errors" is meaningful.**
8. `StudentReportPage`Â â‰ˆÂ `PublicReportPage`Â (\~90% identical);Â `DocumentStatus`Â redeclared in 5 files; pricing constants duplicated and internally inconsistent (`28500 / 1000 Ã— 0.52 = 14.82`, notÂ `14.90`).
9. Doc drift:Â `docs/architecture.md`'s route map omitsÂ `/public/account`,Â `/public/success`Â and the threeÂ `*/output-preview`Â mounts.

---

# Part 2 â€” Implementation plan

## New file â€”Â `src/app/data/tesicheckAccountSession.ts`

The identity primitive. Mirror the defensive idiom ofÂ [tesicheckPrecheckSession.ts](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/data/tesicheckPrecheckSession.ts): module-levelÂ `STORAGE_KEY`, every read shape-validated, every accessorÂ `try/catch`-wrapped, no React context.

```ts
export interface TesiCheckAccountSession { id: string; email: string; name?: string; emailVerified: boolean }
const STORAGE_KEY = 'tesicheck-account-session-v1';       // localStorage â€” outlives the checkout, matches where paid checks live
export const DEMO_ACCOUNT_ID = 'public-account-demo';     // KEEP this value: already-stored checks carry it as owner.id

getAccountSession(): TesiCheckAccountSession | null
signInAccount(email): TesiCheckAccountSession             // existing account â†’ emailVerified: true
registerAccount(name, email): TesiCheckAccountSession     // new account     â†’ emailVerified: false
confirmAccountEmail(): TesiCheckAccountSession | null     // flips emailVerified â†’ true
clearAccountSession(): void
isPaymentEnabled(session): boolean                        // authenticated && emailVerified

```

Carry a comment, asÂ `tesicheckPersistentCheck.ts:42`Â does, that production must own identity and verification server-side.

## Edit â€”Â `src/app/data/tesicheckPrecheckSession.ts`

AddÂ `'checkout_verify_email'`Â to theÂ `PrecheckFlowStage`Â union (betweenÂ `checkout_account`Â andÂ `checkout_payment`)Â **and**Â to theÂ `isPrecheckFlowStage`Â guard â€” the guard is what rejects a stored session, so missing it silently drops the checkout. No other field changes: login-vs-register is transient UI state, and verification lives in the account session.

## New file â€”Â `src/app/components/SottocheckCheckoutSummary.tsx`

PropsÂ `{ documentName, characterCount, price }`. Lift the existing markup out ofÂ `PublicAccountGatePage.tsx:230-246`Â so desktop output is visually unchanged. Sits besideÂ `SottocheckPaymentGatewayBoundary`Â /Â `SottocheckPricingPreview`Â in the existingÂ `Sottocheck*`Â vocabulary.

- Title alwaysÂ **"Riepilogo TesiCheck"**Â â€” never "riepilogo pagamento" (spec Â§5).
- One innerÂ `SummaryFields`Â (document,Â `characterCount.toLocaleString('it-IT')`, total) rendered by both branches so there is a single source of content.
- Desktop:Â `md:sticky md:top-[24px]`. The parent grid already setsÂ `md:items-start`, so this works with no layout change.
- Mobile: nativeÂ `<details>`Â â€” summary rowÂ `Riepilogo TesiCheck Â· EUR 14,90`Â + "Mostra dettagli". NativeÂ `<details>`Â is keyboard-accessible and already used inÂ `SottocheckPaymentGatewayBoundary.tsx:30`.

## Edit â€”Â `src/pages/public/PublicAccountGatePage.tsx`Â (the bulk)

1. DropÂ `DEMO_PUBLIC_ACCOUNT_ID`Â /Â `DEMO_PUBLIC_ACCOUNT_LABEL`; read identity from the new module.
2. AddÂ `authMode: 'login' | 'register'`, defaultÂ `'login'`.
3. **Replace the two-button block with real forms**Â in the same main column, summary untouched:
   - *Login*: Email, Password â†’ CTAÂ **`Accedi e continua`**; "Password dimenticata?"; footer "Non hai ancora un account?Â **Crea account**" â†’Â `setAuthMode('register')`Â (stays on the page â€” spec:Â `Crea account`Â must not leave the checkout).
   - *Registration*: Nome, Email, Password, Conferma password â†’ CTAÂ **`Crea account e continua`**; footer "Hai giÃ  un account?Â **Accedi**".
   - **No universitÃ  / corso di laurea / interessi / preferenze**Â â€” spec scope rule.
   - Markup idiom: nativeÂ `<label>`Â +Â `<input>`Â withÂ `border-[var(--border)]`,Â `bg-[var(--background)]`,Â `borderRadius: 'var(--radius)'`Â and inline font CSS vars, perÂ [SottocheckSuccessPanel.tsx:96-124](vscode-webview://05vplcpeqfk624f1g0s8ffbscmnsvfgq0f8oaqilo4gdp9ilhp92/src/app/components/SottocheckSuccessPanel.tsx#L96-L124). The shadcnÂ `ui/input`/`ui/label`Â primitives are admin-only â€” do not introduce them here. Add the existing sharedÂ `control-focus-ring`Â class (`src/styles/dashboard.css:416`) forÂ `:focus-visible`.
   - Validation inline inÂ `--destructive`: required fields, email regex (reuse the pattern atÂ `SottocheckSuccessPanel.tsx:28`), password confirmation match.
4. Submit handlers:
   - login â†’Â `signInAccount`Â â†’Â `claimPrecheckSession(account.id)`Â â†’Â `setPrecheckFlowStage('checkout_payment')`
   - register â†’Â `registerAccount`Â â†’Â `claimPrecheckSession(account.id)`Â â†’Â `setPrecheckFlowStage('checkout_verify_email')`
5. **New verify stage**: "Verifica la tua email" / "Abbiamo inviato un codice a {email}" /Â `InputOTP maxLength={6}`Â with sixÂ `InputOTPSlot`s (first use of the existingÂ `ui/input-otp.tsx`) / CTAÂ **`Conferma email`**Â + "Invia di nuovo il codice". Simulated â€” accept any 6-digit code, with a comment that production must verify server-side. On success â†’Â `confirmAccountEmail()`Â â†’Â `checkout_payment`.Â **No standalone "Account confermato" page.**
6. **Skip for authenticated users**: on mount, if a session exists and is verified while the stage isÂ `checkout_account`/`quote_ready`, claim and jump straight toÂ `checkout_payment`.
7. **Gate payment**Â onÂ `isPaymentEnabled(...)`Â â€” guardÂ `startRedirect`, not just the button's disabled state.
8. Turn the checklist at lines 208-227 into three rows â€” Account / Email verificata / Pagamento â€” driven by the account session rather thanÂ `claim.status`Â alone.
9. Swap the inlineÂ `<aside>`Â forÂ `<SottocheckCheckoutSummary />`.
10. **StrictMode fix**: addÂ `hasCreatedCheckRef = useRef(false)`Â around the creation effect, mirroringÂ `StudentPaidSottocheckPage.tsx:29,38,50`.

## Edit â€”Â `src/pages/public/PublicReportPage.tsx`

Replace the duplicatedÂ `CURRENT_PUBLIC_ACCOUNT_ID`Â literal with the shared constant from the new module. Behaviour is unchanged for already-stored checks becauseÂ `DEMO_ACCOUNT_ID`Â keeps the same value.

## Docs

Add theÂ `/public/account`Â row (and its checkout stages) to the route map inÂ `docs/architecture.md`, which currently omits it. PerÂ `AGENTS.md`, flag rather than silently fix the other drift listed in Â§4.9.

## Explicitly out of scope

Student / Coach / Public-view / Admin flows; theÂ `getViewBasePath`Â fix; wiring history to the store; theÂ `Scaduto`Â /Â `In scadenza`Â statuses; retiringÂ `/public/sottocheck`Â andÂ `/public/success`. All logged in Part 1.

---

## Verification

RunÂ `npm run dev`Â and walk the flow atÂ `/public`:

1. **New account**Â â€” upload a PDF â†’ price appears â†’Â *Procedi al pagamento*Â â†’ registration form â†’ OTP â†’ payment â†’ gateway â†’ success â†’ lands onÂ `/public-view/report/:checkId`.
2. **Existing account**Â â€” login form â†’Â **straight to payment, no OTP**.
3. **Already authenticated**Â â€” after completing (1), start a second check fromÂ `/public`: the account step is skipped entirely.
4. **Payment gate**Â â€” register but skip verification; confirm payment cannot be reached, by button stateÂ *and*Â by directÂ `startRedirect`.
5. **Resume**Â â€” reload atÂ `checkout_account`,Â `checkout_verify_email`,Â `checkout_payment`; confirm the landing shows "Hai un TesiCheck in corso" and each stage restores. Confirm an old session stored without the new stage value degrades toÂ `null`Â rather than crashing.
6. **Failure paths**Â â€” gatewayÂ *esito negativo*Â andÂ *annulla*: session preserved, no check created, CTA flips to "Riprova pagamento".
7. **StrictMode**Â â€” confirm "Pagamento ricevuto" no longer flashes the "Inizia un nuovo check" empty state in dev.
8. **Responsive**Â â€” desktop: summary sticky through account â†’ verify â†’ payment â†’ redirecting. Mobile: collapsed "Riepilogo TesiCheck Â· EUR 14,90" row that expands.
9. **Accessibility**Â â€” tab through both forms and the OTP;Â `control-focus-ring`Â visible on every control; labels bound viaÂ `htmlFor`/`id`; errors announced next to their field.
10. **Typecheck**Â â€”Â `npx tsc --noEmit`; compare against theÂ **47-error baseline**Â and confirm no new errors in the touched files. Do not treat a clean run as achievable.