# TesiCheck — Standalone Acquisition + Profile Enrichment (technical handoff)

> **Not a source of truth.** UX/product source of truth stays
> [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md) (§33).
> This file records implementation knowledge that would be expensive for a new
> agent to rediscover. Product rules are referenced, not restated.

Scope: standalone TesiCheck registration → immediate CRM Pipeline
(create/dedupe) → later Profile questionnaire enriches that Pipeline. The
Student questionnaire and any Dashboard/report entry-point cards are **not** in
scope. No consent checkbox copy is added (see §9).

---

## 1. Files

| File | Change |
| --- | --- |
| `src/app/data/tesicheckLeadEnrichment.ts` | **New (grown).** `resolveEnrichmentTarget` + `withTesiCheckSource` + `nextPipelineId` + `buildTesiCheckPipeline` + `ensureTesiCheckPipeline`. |
| `src/app/data/tesicheckAccountSession.ts` | `TesiCheckAccountSession` gains explicit `firstName?`; `registerAccount(firstName, email, password?)` sets it; `getAccountFirstName(session)` added (prefers `firstName`, single-token legacy `name` fallback). `name?` kept for legacy sessions. Adds a prototype-only registered-accounts registry (`tesicheck-registered-accounts-v1`, plaintext password) + `findRegisteredAccount(email)` so `register → logout → login same account` works; `signInAccount` restores `firstName` from it. Logout (`clearAccountSession`) never touches the registry. |
| `src/pages/public/PublicAccountGatePage.tsx` | `RegisterForm` "Nome" field is the explicit first name (`autoComplete="given-name"`, required — unchanged validation). On email verification (`handleConfirmEmail`) calls `ensureTesiCheckPipeline`. Consumes `useLavorazioni` (available: provider is now app-level). Auth form components extracted to `standaloneAuthForms.tsx` (shared with the direct auth page); `RegisterForm.onSubmit` now also carries the password. |
| `src/pages/public/PublicStandaloneAuthPage.tsx` | **New.** Direct landing login/register (`/public/login`, `/public/register`), independent of pre-check/checkout. Its `handleConfirmEmail` calls the same `ensureTesiCheckPipeline` on verification — the acquisition rule is identical, just reached without a fake quote. |
| `src/pages/public/standaloneAuthForms.tsx` | **New.** `EMAIL_PATTERN` + `TextField` + `FormError` + `LoginForm` + `RegisterForm` + `VerifyEmailForm`, moved verbatim from `PublicAccountGatePage` so the direct auth page reuses them without duplication. |
| `src/pages/public/PublicProfilePage.tsx` | Enrichment-first: normal path resolves the already-created Pipeline and updates it. `new_pipeline` kept as **fallback only** (pre-rule accounts) — requires a first name. `Nome` prefilled via `getAccountFirstName`. |
| `src/app/App.tsx` | Single app-level `LavorazioniProvider` (from the previous fix — unchanged here). |
| `src/app/data/LavorazioniContext.tsx` | `AVAILABLE_SOURCES` + `'TesiCheck'`; `Pipeline.academic_data.thesis_topic?`; `ThesisType` + `'esame'`. |
| `src/app/components/PipelineDetailDrawer.tsx`, `CreatePipelineDrawer.tsx`, `DrawerPrimitives.tsx` | Academic **labels/options only** (see §5). |
| `src/app/routes.tsx` | `/public-view/profilo` → `PublicProfilePage`. `/student-view/profilo` unchanged. |
| `docs/tesicheck-canonical-flow.md` | §33 rewritten (acquisition + enrichment + academic vocabulary + consent domains) + §29 bullets. |

### 1.1 Slice A — standalone registration legal state + optional commercial consent

| File | Change |
| --- | --- |
| `src/pages/public/standaloneAuthForms.tsx` | `RegisterForm` gains three separate controls after the password fields, before the CTA: **required** `Accetto i Termini e condizioni` + `Dichiaro di aver preso visione dell'Informativa privacy` (block submit; concise error via the existing `FormError` slot), and an **optional**, visually decoupled `Comunicazioni commerciali` (unchecked default, never blocks). New exported `RegisterSubmitValues` type; `onSubmit` now takes that object (`firstName`, `email`, `password`, `termsAccepted`, `privacyAcknowledged`, `commercialConsent`). New local `ConsentCheckbox` (native checkbox, presentation only). Legal titles are plain text — no link/URL. `LoginForm` / `VerifyEmailForm` untouched. |
| `src/app/data/tesicheckAccountSession.ts` | `RegisteredAccount` + `TesiCheckAccountSession` gain optional `termsAccepted?` / `privacyAcknowledged?`. `registerAccount(firstName, email, password?, legal?)` persists them to the registry **and** mirrors them onto the session. `signInAccount` restores them from the registry. `isAccountSession` accepts them as optional booleans. Absent = "not recorded" (legacy accounts); no retroactive migration. No version/timestamp/audit. |
| `src/app/data/tesicheckLeadEnrichment.ts` | New `withEmailMarketingConsent(map, email, granted)` helper. `ensureTesiCheckPipeline` gains `commercialConsent?: boolean` (writes explicit `marketing_consents[key]` on `created` / `enriched`; key = resolved `pipeline.email`, else verified account email) and now returns `studentId` on `outcome: 'student'` — it stays **Pipeline-oriented**, writing nothing on a Student match. New wrapper `applyStandaloneRegistrationConsent({ …, updateStudent, commercialConsent })`: calls `ensureTesiCheckPipeline`, and on `outcome: 'student'` writes the explicit choice to `Student.marketing_consent` via the shared `updateStudent`. Module + fn docstrings updated. |
| `src/pages/public/PublicStandaloneAuthPage.tsx` | `handleRegister(values: RegisterSubmitValues)` → `registerAccount(..., { termsAccepted, privacyAcknowledged })`, stash `values.commercialConsent` in `pendingCommercialConsent` state. Pulls `updateStudent` from `useLavorazioni`. `handleConfirmEmail` calls `applyStandaloneRegistrationConsent({ …, updateStudent, commercialConsent: pendingCommercialConsent })`. |
| `src/pages/public/PublicAccountGatePage.tsx` | Same as above, in-checkout: `handleRegister` stashes `pendingCommercialConsent` before `advanceAfterAuth(registerAccount(..., { legal }), 'checkout_verify_email')`; pulls `updateStudent`; `handleConfirmEmail` calls `applyStandaloneRegistrationConsent`. Checkout stage machine, payment, gateway, recovery all unchanged. |
| `docs/tesicheck-canonical-flow.md` | §33.5 "Stato prototipo — Slice A" block + §29 bullets. |

Slice A does **not** touch: Profiles, Admin surfaces, `Student.marketing_consent`,
payment behaviour, policy pages, footer links, legacy-account retroactivity.

Untouched (by the original acquisition + enrichment work; see §1.1 for Slice A):
checkout stage machine / payment / gateway boundary / persistent-check
materialization, TesiCheck reports, History, Coach, Admin drawer architecture /
conversion / validation, `StudentProfilePage`, in-app marketing-consent UI,
Pipeline → Student conversion, underlying `thesis_*` field names. The later
"direct landing login/register" slice only extracts the checkout's auth **form
components** into a shared module and forwards the already-collected password into
`registerAccount`; the checkout flow stages are unchanged.

---

## 2. Account-session identity change

`TesiCheckAccountSession`:

```
{ id, email, firstName?, name?  /* legacy */, emailVerified }
```

- `registerAccount(firstName, email)` writes `firstName`, no longer writes
  `name`. `signInAccount(email)` is unchanged (no name — compatible).
- `confirmAccountEmail()` spreads the session, so `firstName` survives verify.
- `getAccountFirstName(session)`: returns `session.firstName` when set; else a
  legacy `session.name` **only if it is a single whitespace-free token** (never
  split a multi-token legacy value).
- `isAccountSession` accepts both `firstName` and `name` as optional strings, so
  pre-rule stored sessions still validate.

Registration form: `RegisterForm` in `PublicAccountGatePage` — the existing
single required **"Nome"** field is the first name (`autoComplete` changed
`name` → `given-name`; internal state `name` → `firstName`). No surname field
added.

---

## 3. Pipeline creation event

`handleConfirmEmail` in `PublicAccountGatePage` (the "account created + email
verified" moment of a **new registration** — sign-in never reaches this stage):

```
confirmAccountEmail() → verifiedAccount
  → ensureTesiCheckPipeline({ accountEmail: verifiedAccount.email,
                              firstName:  verifiedAccount.firstName,
                              students, pipelines, addPipeline, updatePipeline })
  → updateCheckoutStage('checkout_payment')
```

`ensureTesiCheckPipeline` (in `tesicheckLeadEnrichment.ts`) is **idempotent** —
it re-resolves against current CRM data every call:

| Resolver result | Action | `outcome` |
| --- | --- | --- |
| `unavailable` (missing/invalid email) | nothing | `'unavailable'` |
| `student` | nothing — a known Student is never duplicated | `'student'` |
| `pipeline` | if the record lacks `TesiCheck` in `sources`, add it once (`withTesiCheckSource`); no other field touched | `'enriched'` |
| `new_pipeline`, non-empty first name | `addPipeline(buildTesiCheckPipeline(...))` | `'created'` |
| `new_pipeline`, empty first name | nothing — `buildTesiCheckPipeline` returns `null` | `'incomplete_identity'` |

Not creating on abandon: if the user never verifies their email, no Pipeline is
created — verification is the commit point (and the email is only trustworthy
from there).

---

## 4. `buildTesiCheckPipeline` payload (acquisition record)

Invariant: a new TesiCheck Pipeline requires a **valid verified email** and a
**non-empty explicit first name**. `buildTesiCheckPipeline` returns
`Pipeline | null` — `null` when `firstName.trim()` is empty, and the caller
(`ensureTesiCheckPipeline`) then returns `outcome: 'incomplete_identity'` and
creates nothing. `student_name` is the first name — **never the email**.

Grounded / structural fields only:

```
id            = nextPipelineId(pipelines)      // existing PIP-NNN convention
first_name    = registered first name (trimmed, non-empty — else null)
last_name     = ''
student_name  = first name                     // never the email
email         = verified account email (trimmed, original casing)
phone         = ''
sources       = ['TesiCheck']                  // system-assigned, never user-chosen
created_at    = today (yyyy-mm-dd)
lavorazioni_ids = []
```

No `academic_data`, `student_id`, `quotes`, `assigned_to`, `service_link`,
`external_link`, `notes`, `communication_channels`, `marketing_consents`,
`quote_sent`, `linked_existing_student`, `updated_by`, CRM status.

`student_name` / `phone` / `lavorazioni_ids` are set because Admin
`PipelinesPage` reads them non-optionally; `first_name`/`last_name` are always
strings (matches `CreatePipelineDrawer`, avoids the `${first} ${last}` header
"undefined undefined" latent bug).

---

## 5. `PublicProfilePage` role + academic vocabulary

**Role:** enrichment-first. For a post-rule registration the resolver returns
`{ mode: 'pipeline' }` (Pipeline created at verification) → the page loads and
**updates** it. `{ mode: 'new_pipeline' }` is reached only by pre-rule accounts
(verified session, no Pipeline) and is documented fallback compatibility — it
requires a non-empty first name (`fallbackNameError` inline message) and a valid
verified email (resolver guarantee). Its create payload also sets
`student_name = fullName` (first + optional last) — **never the email** (same
invariant as `buildTesiCheckPipeline`).

Merge on the `pipeline` path overwrites only `first_name`, `last_name`, derived
`student_name`, `phone` (`field || existing || ''`), the seven academic fields
(gap-fill — blanks keep the prior value), and `sources` (`withTesiCheckSource`).
Everything else passes through `...pipeline`.

Prefill: `Nome` from `getAccountFirstName(session)` (new_pipeline) or the
Pipeline's `first_name` (pipeline). `Cognome`, `Telefono`, all academic fields
optional.

**Client-approved academic vocabulary** — label/option changes only, no field
rename:

| Was | Now | Field (unchanged) |
| --- | --- | --- |
| `Tipo tesi` / `Tipo di tesi` | `Tipologia` | `thesis_type` |
| `Relatore` / `Relatore tesi` | `Professore` | `thesis_professor` |
| `Materia di tesi` | `Materia` | `thesis_subject` |
| `Oggetto tesi` | `Argomento` | `thesis_topic` |

`thesis_type` options: `Compilativa`, `Sperimentale`, `Esame`. `ThesisType`
widened (`+ 'esame'`) — union widening, no `exam_*` fields, no separate schema.
`Esame` passes through `PipelinesPage.handleConvertToLavorazione` unchanged
(`thesis_type: ad?.thesis_type || ''`). `DrawerAcademicSnippet` (shared
read-mode display) updated once — this also reaches the Student drawers'
read view. `CreateStudentDrawer` (create + edit) academic labels/options were
aligned to the approved vocabulary in a later follow-up (`Tipologia` /
`Professore` / `Materia` / `Argomento` + `Esame` option); no behavioural change.

`thesis_topic` was missing from `Pipeline.academic_data` though drawers +
conversion already used it; one optional field added (mirrors
`StudentAcademicRecord.thesis_topic`). Cleared 5 pre-existing baseline TS errors.

---

## 6. Existing Student exception

Unchanged and preserved at **both** entry points (`ensureTesiCheckPipeline` at
registration, `resolveEnrichmentTarget` in the questionnaire): the email is
matched against `student.email` + every `student.contacts.emails[].email`
(normalized) **before** any Pipeline lookup. A match → no Pipeline create, no
Pipeline update. Student enrichment is a separate, not-yet-implemented flow.

---

## 7. Dedupe

- Registration: `ensureTesiCheckPipeline` re-resolves live; a second verify for
  the same email finds the Pipeline → `enriched`, never a duplicate.
- Questionnaire: after the first save `activePipelineId` is pinned and the
  submit handler re-runs the resolver, so repeated "Salva" updates the same
  record.
- Registration then questionnaire: the questionnaire resolves the
  registration-created Pipeline by email → `pipeline` mode → update.

---

## 8. Provider ownership + CRM persistence limitation

`LavorazioniProvider` is mounted once in `src/app/App.tsx`, wrapping
`<RouterProvider>` — so `/public/account` (registration), `/public-view/profilo`
(enrichment) and Admin `/pipelines` all share **one instance** for the SPA
session. `AdminLayout` keeps only `AreeTematicheProvider`.

Accepted prototype limitation: in-memory only (no `localStorage`, no backend, no
second CRM store). A full browser reload restores the seeded state and drops any
registration/questionnaire writes. SPA navigation (registration → checkout →
`/public-view` → Admin) keeps them.

---

## 9. Consent / legal domains — Slice A implemented

Three distinct domains (canonical §33.5), **no legal wording invented**:

1. Terms & Conditions acceptance;
2. Privacy notice acknowledgement;
3. optional commercial-recontact / marketing consent.

### 9.1 What Slice A added (standalone registration only)

Both standalone registration entry points — direct `/public/register`
(`PublicStandaloneAuthPage`) and in-checkout registration on `/public/account`
(`PublicAccountGatePage`) — render three separate controls in the **shared**
`RegisterForm` (`src/pages/public/standaloneAuthForms.tsx`), never one combined
checkbox:

| Control | Copy (prototype) | Required? | Gating |
| --- | --- | --- | --- |
| Terms | `Accetto i Termini e condizioni` | **yes** | blocks form submit |
| Privacy | `Dichiaro di aver preso visione dell'Informativa privacy` | **yes** | blocks form submit |
| Commercial | `Comunicazioni commerciali` + helper copy | no | never blocks anything |

- Legal titles render as **plain text**, not links — there is no real policy
  page / URL in the prototype. No version, no timestamp, no IP/device, no audit.
- Validation reuses the form's single `FormError` slot (concise message per
  missing acknowledgement); no browser-native `required`.
- `RegisterForm.onSubmit` now passes a `RegisterSubmitValues` object
  (`firstName`, `email`, `password`, `termsAccepted`, `privacyAcknowledged`,
  `commercialConsent`) — explicit names, no generic `consent`.
- `LoginForm` is untouched; existing-account login (direct + checkout) is
  unchanged. No retroactive acceptance is forced on legacy accounts.

### 9.2 Prototype persistence

- **Terms + Privacy** → **ACCOUNT-domain** state, not Profile-domain. Optional
  booleans `termsAccepted` / `privacyAcknowledged` on the **registered-account
  registry** (`RegisteredAccount` in `tesicheckAccountSession.ts`), the
  persistent source of truth so `logout → login → Account page` later still
  knows. `registerAccount(..., { termsAccepted, privacyAcknowledged })` writes
  them; `signInAccount` restores them; both are also **mirrored** onto
  `TesiCheckAccountSession` for convenient reads by a future role-specific
  Account page (`/public-view/account` / `/student-view/account` — see §11).
  Absent (legacy account) = "not recorded in this prototype" — never read as
  accepted, never silently migrated. Production auth/legal storage must replace
  these with versioned + timestamped + audited acceptance.
- **Commercial consent** → the explicit choice is projected, **after** email
  verification and normal acquisition resolution, to whichever identity domain
  resolution resolves. `applyStandaloneRegistrationConsent`
  (`tesicheckLeadEnrichment.ts`) is the single entry point both registration
  paths call:
  - **Pipeline** (`created` / `enriched`) → `ensureTesiCheckPipeline` writes an
    explicit boolean on `Pipeline.marketing_consents[key]`
    (`withEmailMarketingConsent`; key = resolved `existing.email`, else the
    verified account email). Semantics: key present + `true` = granted; key
    present + `false` = asked, not granted; key absent = never collected — **do
    not** collapse absent and `false` with `map[email] || false`.
  - **Existing Student** → `resolveEnrichmentTarget` still checks Student first;
    **no Pipeline** is created/updated (rule preserved). The wrapper then writes
    the explicit choice to `Student.marketing_consent` via the shared
    `updateStudent` (checked → `true`, unchecked → `false` — a direct answer the
    UI asked for, not an inference; tri-state for never-asked legacy Students is
    still deferred). Nothing else on the Student is touched (no contacts, no
    services, no Pipeline).
  - `ensureTesiCheckPipeline` itself stays Pipeline-oriented: on a Student match
    it only reports `outcome: 'student'` + `studentId` and writes nothing. The
    Student-domain write lives in the caller-side wrapper — the smallest clear
    ownership boundary.
- **Transport until verification:** the optional commercial choice rides
  component state (`pendingCommercialConsent`) in `PublicStandaloneAuthPage` /
  `PublicAccountGatePage` from register submit to `handleConfirmEmail`. No new
  persistent store; the account registry is **not** the owner of commercial
  consent. A full page reload during OTP entry loses the whole verify context
  (choice included) — acceptable prototype limitation; production owns real
  transport.

### 9.3 Sequenced slices

See §11 for the Profile vs Account IA. See §12 for the Slice B implementation.

**Slice B — real Account pages + navigation IA — DONE (see §12).**

- `/public-view/account` (`PublicAccountPage`) + `/student-view/account`
  (`student/AccountPage`), role-specific; `/public/account` untouched (checkout
  gate).
- Account pages show account email, password entry, Terms/Privacy **status**
  (read-only). Standalone reads Slice A persistence (registry → session mirror);
  absent → `Stato non registrato nel prototipo`. Student has no legal model →
  both rows render `Stato non disponibile`, nothing fabricated.
- `UserTopbarMenu` prop `profilePath` → `accountPath`; Public/Student point at
  `…/account`, Admin unchanged, Coach interim-points at its Profile (documented).
- `PublicSidebar` `Profilo` moved to the secondary bottom slot (matches
  Student/Admin).
- Profile ↔ Account cross-links (`Gestisci account e privacy` /
  `Vai al profilo personale`); `returnTo` whitelist gains `/public-view/account`.

**Slice C — commercial-consent controls in Profile — DONE (see §13).**

- Editable/revocable `Comunicazioni` section (tri-state explicit choice) in
  `/public-view/profilo` (writes the resolved `Pipeline.marketing_consents[email]`,
  or a matched `Student.marketing_consent`) and `/student-view/profilo` (writes
  `Student.marketing_consent`). Profile-domain, not Account.
- `Pipeline.marketing_consents` type unchanged; Profile read logic is tri-state
  (`readEmailMarketingConsent`). `Student.marketing_consent` widened to
  `boolean | null`. Unknown is never collapsed into `false`.
- Profile still has **no** Terms/Privacy rows — those stay on the Account page.

**Slice D — Admin consent visibility + per-email Student model — DONE (see §14).**

- Pipeline recontact signal: drawer person-level summary line + list/card pill;
  per-contact drawer rows show tri-state (`Consentito` / `Non consentito` /
  `Non richiesto`). Per-contact **editing is preserved** (not made read-only).
- **Student commercial consent is per email** (`contacts.emails[].marketing_consent`),
  edited inside each email card of the Student drawer and persisted by its
  existing `Salva modifiche`; the list/card shows one derived triage summary
  (`deriveStudentRecontactSummary`). The legacy global `Student.marketing_consent`
  is deprecated. Storage/editing models for Pipeline (`Record<string,boolean>`)
  and Student (per-email field on the contact record) are **not** unified — only
  the display vocabulary and `MarketingConsentSelect` are shared.

**Not slice-scoped / backend:**

- Terms/Privacy policy pages, footer legal links, versioning/timestamp/audit.
- Retroactive acceptance for pre-feature registered accounts (separate product
  decision).
- Final checkbox copy, legal basis, controller identity, retention — client/legal.

---

## 11. Profile vs Account — surface responsibilities (product direction)

Profile and Account are **separate surfaces**. Terms/Privacy state is written to
the account registry; commercial consent is Profile-domain and **per email**,
written to the resolved identity — Pipeline `marketing_consents[email]`, or a
matched Student's `contacts.emails[].marketing_consent` for the relevant email
(no global Student value). Slice C implemented the Profile commercial-consent
control; Slice D added Admin visibility and moved the Student model to per-email.

| Surface | Owns |
| --- | --- |
| **Profile** (`/public-view/profilo`, `/student-view/profilo`) | identity, contacts, academic info, **commercial communications consent** (per email; standalone: `Comunicazioni` section; Student profile: under the primary email in `Contatti`) |
| **Account** (`/public-view/account`, `/student-view/account`) | account email, password / recovery entry points, **Terms acceptance status**, **Privacy acknowledgement status**, future account-management actions |

Rules:

- Commercial consent is tri-state and **unknown is never collapsed into `false`**:
  `Pipeline.marketing_consents` key-absent = unknown; a Student email's
  `marketing_consent` is `boolean | null` / absent, with `null` / absent = never
  asked. The Profile control leaves an untouched value exactly as stored on save.
- Commercial consent never gates registration, payment, reports or service access,
  and is never required.
- Terms/Privacy are **not** rendered in Profile — Account only.

- `/public/account` is the **paid-checkout account gate** — never reused as the
  authenticated Account/settings page.
- Sidebar: `Profilo` sits in the **secondary bottom** area for BOTH authenticated
  standalone and Student (done in Slice B). Account is **not** in the sidebar.
- Top-right user menu `Informazioni Account` → the role's real `…/account` page,
  **never** Profile (`accountPath` prop).
- Profile ↔ Account cross-link each other (`Gestisci account e privacy` →
  Account; `Vai al profilo personale` → Profile); no duplicated content.
- The Account page shows only what the model supports; no fabricated dates /
  versions / acceptance. Standalone: a legacy account with no recorded state
  renders `Stato non registrato nel prototipo`. Student has no legal-acceptance
  model at all → both rows render `Stato non disponibile`. Production
  legal/account semantics are backend.

## 12. Slice B — Account pages + navigation IA (implementation)

| File | Change |
| --- | --- |
| `src/app/components/account/AccountPrimitives.tsx` | **New.** Presentation-only leaves shared by both Account pages: `AccountInfoRow`, `LegalStatusRow` (label + neutral status + optional `recorded` check), `CrossSurfaceLink`. No role data / auth / legal ownership. |
| `src/pages/public/PublicAccountPage.tsx` | **New.** `/public-view/account`. Sections `Accesso` (email read-only; `Gestisci password` → `/public/password-recovery?returnTo=/public-view/account`) and `Termini e privacy` (read-only status from `findRegisteredAccount(session.email)` ?? session mirror; `true` → `Accettati` / `Presa visione registrata` + check, else `Stato non registrato nel prototipo`; note `Informazioni di sola lettura. Testo, versione e link saranno definiti dal team legale.`). Cross-link → `/public-view/profilo`. Local `PageShell`/`NeutralCard` (same pattern as the Profile page). No editable legal toggles, no invented dates/versions/URLs. |
| `src/pages/student/AccountPage.tsx` | **New.** `/student-view/account`. Resolves the structured `Student` (`STUDENT_VIEW_STUDENT_RECORD_ID`) — same source as the Student Profile; **never** the standalone account registry/session. `Accesso`: structured primary email (read-only) + neutral password row `Gestione password non disponibile da questa area` (no recovery link). `Termini e privacy`: both rows `Stato non disponibile` + note `Lo stato delle accettazioni non è disponibile per questo account.` (no Student legal model; nothing fabricated; no fields added to `Student`; production must supply real state). Cross-link → `/student-view/profilo`. |
| `src/app/components/UserTopbarMenu.tsx` | Prop `profilePath` → **`accountPath`**; handler `handleGoToProfile` → `handleGoToAccount`. Label unchanged ("Informazioni Account"). |
| `src/app/components/public/PublicHeader.tsx` | `accountPath="/public-view/account"`. |
| `src/app/components/student/StudentHeader.tsx` | `accountPath="/student-view/account"`. |
| `src/app/components/AdminHeader.tsx` | `accountPath="/impostazioni/account"` (unchanged target). |
| `src/app/components/coach/CoachHeader.tsx` | `accountPath="/coach-view/profilo"` — **preserved** (no Coach Account page); comment flags the inconsistency for the future Coach workstream. Coach Account is NOT created. |
| `src/app/components/public/PublicSidebar.tsx` | `Profilo` removed from `navItems`, rendered in a `borderTop` bottom slot (mirrors `StudentSidebar`). Collapsed/active behaviour preserved. Account not added to the sidebar. |
| `src/pages/public/PublicProfilePage.tsx` | After the form: `CrossSurfaceLink` → `/public-view/account` ("Gestisci account e privacy"). |
| `src/pages/student/ProfilePage.tsx` | Same cross-link → `/student-view/account`; the stale "Privacy e consensi" placeholder comment corrected (Slice C adds a commercial-consent control only; Terms/Privacy live on Account). |
| `src/pages/public/PublicPasswordRecoveryPage.tsx` | `ALLOWED_RETURN_TO` gains `/public-view/account` (whitelist stays closed); new back-label "Torna all'account". `/public/login` + `/public/account` behaviour unchanged. |
| `src/app/routes.tsx` | `+ { path: 'account', Component: PublicAccountPage }` under `/public-view`; `+ { path: 'account', Component: StudentAccountPage }` under `/student-view`. `/public/account` row untouched. |

Not in Slice B: any commercial-consent control in Profile (Slice C), `Student`
tri-state, Admin visibility (Slice D), policy pages, footer legal links,
production password/auth, Coach Account/Profile.

## 13. Slice C — commercial-communications consent in Profiles (implementation)

Commercial consent (domain 3) is the **only** consent surfaced in Profile;
Terms/Privacy stay on the Account page.

### Model

| Concern | Change |
| --- | --- |
| `Pipeline.marketing_consents?: Record<string, boolean>` | **Type unchanged.** Structural tri-state already supported: key absent = unknown, `false` = asked/not granted, `true` = granted. |
| `Student.marketing_consent` | **`boolean` → `boolean \| null`** (`true` granted / `false` declined-revoked / `null` never asked). Seeded `true`/`false` values kept as explicit demo data — not reinterpreted. |
| `tesicheckLeadEnrichment.ts` | New `readEmailMarketingConsent(map, email): boolean \| null` — `hasOwnProperty` check, never `\|\| false`. `withEmailMarketingConsent` (Slice A) reused for writes. |

### Shared UI leaf

`src/app/components/profile/CommercialConsentField.tsx` — presentation only, no
Pipeline/Student/session/CRM knowledge. Reuses the existing shadcn
`RadioGroup`/`RadioGroupItem`. Props: `value: boolean | null`,
`onChange(value: boolean)`, `disabled?`, `idPrefix?`. Two explicit options
(`Sì, desidero…` / `No, non desidero…`); `value === null` → neither selected +
`Preferenza non ancora espressa.`; always shows
`Puoi modificare questa scelta in qualsiasi momento.` Prototype copy — final
wording is client/legal.

### Role pages

| File | Change |
| --- | --- |
| `src/pages/student/ProfilePage.tsx` | New `FormSection "Comunicazioni"` with `CommercialConsentField`. Local `commercialConsent: boolean \| null` + `commercialTouched`. Prefill from `student.marketing_consent ?? null` (reseed resets `touched`). `handleSubmit`'s existing `updateStudent` updater writes `marketing_consent` **only** when `commercialTouched` — untouched `null`/`true`/`false` round-trips via `...prev`. Student-domain only; contacts/records/services/Pipeline/Account untouched. |
| `src/pages/public/PublicProfilePage.tsx` | New `FormSection "Comunicazioni"` before the submit button (main form) **and** in the `student`-match branch (previously a dead-end card) with a `Salva preferenza` button. Prefill: `pipeline` → `readEmailMarketingConsent(pipeline.marketing_consents, pipeline.email ?? accountEmail)`; `student` → matched `student.marketing_consent ?? null`; `new_pipeline` → `null`. Save: `pipeline` → merge `marketing_consents: withEmailMarketingConsent(map, pipeline.email \|\| accountEmail, choice)` into the existing `updatePipeline` updater, only when `commercialTouched && choice !== null` (preserves other keys, never deletes to mean `false`); `new_pipeline` → the created Pipeline carries `marketing_consents: { [accountEmail]: choice }` only if touched (no Pipeline is created just for a preference — the name-required guard still applies first); `student` → `updateStudent(id, s => ({ ...s, marketing_consent: choice }))`, **no Pipeline created**. |

### Admin compatibility (minimum only — Slice D does the real normalization)

| Site | Change |
| --- | --- |
| `PipelinesPage.tsx` (Pipeline→Student conversion) | `!!(map && email && map[email])` → `readEmailMarketingConsent(map, email)` → `null` when the key is absent (was fabricating `false`). |
| `CreateLavorazioneDrawer.tsx` (Pipeline→Student conversion) | `(map && map[email]) \|\| false` → `readEmailMarketingConsent(map, email)`. |
| `CreateStudentDrawer.tsx` | Passthrough state `useState(false)` → `useState<boolean \| null>(null)`; prefill `editStudent.marketing_consent \|\| false` → `?? null`. No consent control in this drawer, so create-mode now writes `null` (not fabricated `false`); edit-mode round-trips the stored value. |
| `StudentiPage.tsx` | `handleToggleMarketing` **unchanged behaviour** — `!s.marketing_consent` maps `null`/`false` → `true`, `true` → `false`; `null` is treated as "not granted" for the explicit Admin toggle + its menu label. Comment added; real read model is Slice D. |
| `CreateLavorazioneDrawer.tsx:58` / `PipelineDetailDrawer` / `CreatePipelineDrawer` / `ContactManager` consent **display** | Untouched — Admin read normalization is Slice D. |

### Known prototype limitation

On the standalone Profile `new_pipeline` fallback, choosing a preference without
also entering a first name shows the existing "Inserisci il tuo nome" error and
does **not** persist the preference (no Pipeline is created solely for consent).

## 14. Slice D — Admin visibility of commercial consent (implementation)

**Pipeline and Student consent administration are intentionally asymmetric.**
Only the *display vocabulary* is shared; storage and editing are not.

### Shared helpers — `src/app/data/marketingConsent.ts` (new)

- `readMarketingConsentForContact(map, contactKey): boolean | null` — the
  generalized (contact-key-neutral) tri-state reader. `tesicheckLeadEnrichment.ts`
  now `export { readMarketingConsentForContact as readEmailMarketingConsent }`
  (Slice C call sites unchanged; `PipelinesPage` / `CreateLavorazioneDrawer`
  switched to the new name).
- `pipelineContactKeys(pipeline)` — primary + additional email(s)/phone(s),
  trimmed, de-blanked.
- `deriveRecontactSummary(map, contactKeys): 'granted' | 'declined' | 'unknown'`
  — any current contact `true` → `granted`; else any `false` → `declined`; else
  `unknown`. Iterates **current** keys only, so stale map keys never drive the
  status.
- `marketingConsentLabel(v)` → `Consentito` / `Non consentito` / `Non richiesto`
  (per-contact **and** per-Student). `recontactSummaryLabel(s)` →
  `Ricontatto consentito` / `Ricontatto non consentito` / `Consenso non richiesto`.
- Badges use `StatusPill variant="neutral"` + explicit text (no brand green as a
  generic success colour).

### Pipeline — per-contact truth + derived person summary

New shared leaf `src/app/components/MarketingConsentSelect.tsx` — compact
tri-state `<select>` (`Non richiesto` / `Consentito` / `Non consentito`), props
`value: boolean | null` + `onChange(value: boolean | null)`. Presentation only;
the caller maps `null` onto its storage (for a Pipeline map: **remove the key**).

| File | Change |
| --- | --- |
| `PipelineDetailDrawer.tsx` | Only `ConsentRow` changed: the editor is now a `MarketingConsentSelect` (instead of a checkbox) inside the drawer's **unchanged** click-to-edit → editor → inline **Save-icon** pattern. `setContactConsent(key, value)` updates the local `marketingConsents` map (`null` removes the key); the existing **`saveConsent`** persists it (`updatePipeline`, the same per-contact save mechanism as before). Read view shows `Consentito` / `Non consentito` / `Non richiesto`. Added a read-only `Ricontatto commerciale` line under `DrawerMetaRow` (derived). **No footer Save added; no other field's inline save touched; close/cancel semantics unchanged.** |
| `CreatePipelineDrawer.tsx` | Only `MarketingConsentRow` changed: checkbox → `MarketingConsentSelect` inside the **unchanged** click-to-edit → editor → confirm pattern. `handleConsentChange(key, value)` sets/deletes the key in local `marketingConsents`; persistence is the drawer's existing "Crea" submit. No interaction/architecture change. |
| `CreateLavorazioneDrawer.tsx` | `ContactBlock.consentBadge` read-only per-contact display → tri-state label (this drawer converts, it does not edit Pipeline consent). Conversion write already tri-state (§13). |
| `PipelinesPage.tsx` | Desktop row + mobile card: a compact `recontactSummaryLabel(...)` `StatusPill` appended to the **existing `sources` cell** (no new column, no filter). Conversion read → `readMarketingConsentForContact`. |

- **Key deletion is correct only for `Non richiesto`** (returns the state to
  unknown). `Non consentito` stores an explicit `false` — never a deletion.
- **No auto-save; no drawer-architecture change.** Each drawer keeps its
  established persist pattern: `PipelineDetailDrawer` = per-contact `saveConsent`
  (its existing per-field save mechanism); `CreatePipelineDrawer` /
  `CreateStudentDrawer` = the existing "Crea" / `Salva modifiche` submit. An
  earlier Slice-D pass that added a global `Salva modifiche` footer to
  `PipelineDetailDrawer` and removed its inline saves was **reverted**.
- Mixed values example (documented): email `true` + phone `false` → person summary
  `Ricontatto consentito`, but the drawer still shows email `Consentito` / phone
  `Non consentito`. The summary answers "is any recontact channel permitted?",
  not "are all channels permitted?".

### Student — commercial consent PER EMAIL, editing in the drawer only

> **Domain correction (supersedes the earlier "one global person-level value"
> direction).** Student commercial consent is **per email**:
> `Student.contacts.emails[].marketing_consent?: boolean | null`
> (`true` granted / `false` declined / `null` or absent = not required). Consent
> belongs to the email channel, independent of `purposes` / service access. The
> legacy global `Student.marketing_consent` is **deprecated** — no canonical
> UI / read / write uses it; `migrateLegacyStudentConsent` (in
> `LavorazioniContext.tsx`) moves a seeded global value onto the **primary email
> only** at module load (a Student with no primary email keeps none — documented
> limitation). Three separate domains still never visually combine:
> **contact data**, **service access** (owned by `TimelineDrawer`),
> **commercial consent** (now per-email).

| File | Change |
| --- | --- |
| `LavorazioniContext.tsx` | `ContactEmail` gains optional `marketing_consent?: boolean \| null` (tri-state, doc comment). `Student.marketing_consent` → **optional + `@deprecated`**. `migrateLegacyStudentConsent` maps each seed's legacy global value onto its primary email (only when that email has no explicit value) and strips the top-level field; `INITIAL_STUDENTS` is `[...].map(migrateLegacyStudentConsent)`. |
| `marketingConsent.ts` | Header rewritten (Student is per-email now). New: `readStudentEmailConsent(emails, email)` (case-insensitive, tri-state, never `false` on miss), `deriveStudentRecontactSummary(emails)` (any `true`→granted; else any `false`→declined; else unknown), `withStudentEmailConsent(emails, email, consent, createIfMissing?)` (returns a new array with ONE email's consent set / `null` cleared; appends a minimal contact when missing + a source is given; never touches other emails or other fields). Pipeline helpers unchanged. |
| `ContactManager.tsx` | `showContactTaxonomyUI = mode !== 'student'` (unchanged — hides `purposes` / `Accesso servizi` / `service_access` for student; Coach keeps full UI). NEW: for `mode='student'`, a compact `MarketingConsentSelect` ("Comunicazioni commerciali") rendered **inside every email card**, under the address (primary + additional). `setEmailConsent(email, value)` maps just that entry via `onUpdateEmails` — deletes the key on `null`, sets `true`/`false` otherwise; never touches `purposes` / `is_primary` / other emails. `marketingConsent` / `onUpdateMarketingConsent` props **restored to their pre-Slice-D signature** (`boolean` / `(boolean)=>void`); the pre-existing `mode='pipeline'` block and its `editingMarketingConsent` state are **restored** (not removed). No global consent block between Email and `Telefoni`. |
| `CreateStudentDrawer.tsx` | Global `marketingConsent` / `consentTouched` state, its prefill and its `marketing_consent` submit write **removed**. Per-email consent rides on the `emails` state: the non-lossy contact migration spreads each entry (so `marketing_consent` is preserved) and overlays each email's `marketing_consent` from the **shared** `useLavorazioni().students` record so a Profile change in the same session is reflected. `<ContactManager>` no longer receives `marketingConsent` / `onUpdateMarketingConsent`. Persisted by the existing `Salva modifiche` (`contacts.emails`); no separate section, no separate save, no auto-save. |
| `StudentiPage.tsx` | `resolveStudentConsent` → `resolveStudentRecontact(id): RecontactSummary` via `deriveStudentRecontactSummary(shared.contacts?.emails)`. List + mobile card show one read-only triage pill `recontactSummaryLabel(...)` (`Ricontatto consentito` / `Ricontatto non consentito` / `Consenso non richiesto`). `marketingConsentLabel` import replaced. Still no kebab toggle. |
| `PipelinesPage.tsx` / `CreateLavorazioneDrawer.tsx` | Pipeline→Student conversion: each built email carries `marketing_consent: readMarketingConsentForContact(pipeline.marketing_consents, thatEmail)`; the top-level `newStudent.marketing_consent` is dropped. Per-contact, never collapsed. |
| `tesicheckLeadEnrichment.ts` | `applyStandaloneRegistrationConsent` Student-match branch writes `withStudentEmailConsent(student.contacts?.emails, verifiedEmail, granted, { source: 'tesicheck-registration' })` — the verified email contact only, never a global value, never other emails. Module + fn docstrings updated. |
| `student/ProfilePage.tsx` | The standalone `Comunicazioni` `FormSection` is **removed**. `CommercialConsentField` now sits **inside `Contatti`, under the email**, with caption `Riferito all'indirizzo <email>.` Prefill via `readStudentEmailConsent(student.contacts?.emails, primaryEmail)`; `handleSubmit` writes the primary email's `marketing_consent` via `withStudentEmailConsent` (guarded by `commercialTouched`). No global field written. |
| `PublicProfilePage.tsx` | `target.mode === 'student'` branch: prefill via `readStudentEmailConsent(matched?.contacts?.emails, accountEmail)`; `saveStudentConsent` writes `withStudentEmailConsent(s.contacts?.emails, accountEmail, choice, { source: 'tesicheck-standalone-profile' })` — the verified matching email only, no Pipeline, no global value. `pipeline` / `new_pipeline` branches unchanged. |

### Authoritative service-access surface (audit)

`TimelineDrawer.tsx` — rendered by `src/pages/admin/TimelinePage.tsx`, route
`/coaching/timeline`, section **"Accesso al servizio"**. Writes
`StudentService.coaching_access_enabled` + `invite_status` / `invite_email` /
`invite_sent_at` (via `updateService`) and sets `service_access` on the selected
invite email, removing it from all others (radio, via `updateStudent`). The
Student/email is chosen in its "Email di accesso" selector (defaults to the
current `service_access` email → first email); the Student is resolved by
`student.studentId`. Pipeline / Lavorazione expose **no** competing access
*control* — only a one-time `service_access` default on the primary email at
Pipeline→Student conversion (which `TimelineDrawer` can then change).

### Pipeline → Student conversion

**Per contact.** Every email built from the Pipeline carries
`marketing_consent = readMarketingConsentForContact(pipeline.marketing_consents,
thatEmail)`: key `true` → email `true`, `false` → `false`, absent → `null`. No
channel aggregation, no collapse to one Student value, never `!!map[email]`.
After conversion each email owns its own consent; later changes to the Student's
service-access email do not alter it.

### Hard invariant

- Student drawer contact edits → do **not** grant/revoke timeline access, do
  **not** alter `purposes` (non-lossy migration), do **not** move consent
  between email records.
- Setting another email as primary → does **not** transfer `marketing_consent`
  to a different record.
- `TimelineDrawer` access flow → does **not** alter `marketing_consent`.
- Commercial-consent edits (Profile or Admin drawer) → do **not** alter access,
  `purposes`, `is_primary`, or any other email's consent.

## 10. Verification performed

- `npm run build` — passes.
- `git diff --check` — clean.
- `npx tsc --noEmit` — baseline 47 pre-existing errors; after this work 42
  (the `thesis_topic` type addition clears 5). No new errors in touched files.

Manual code trace (seed data in `LavorazioniContext`):

- **Registration, email = existing Student** (`giulia.verdi@email.com` →
  `STU-445`): `ensureTesiCheckPipeline` → resolver `student` → outcome
  `'student'`, no Pipeline created or updated.
- **Registration, email = existing Pipeline, no Student**: resolver `pipeline` →
  outcome `'enriched'`; `TesiCheck` ensured once in `sources`, nothing else
  changed. (Seed note: every seeded Pipeline email also has a seeded Student, so
  a live test needs Pipeline-only test data.)
- **Registration, fresh valid verified email + first name**: resolver
  `new_pipeline` → `buildTesiCheckPipeline` → one Pipeline, `first_name` =
  `student_name` = registered name (never the email), `email` = verified email,
  `sources === ['TesiCheck']`, no quote/owner/service.
- **Registration, valid email but empty first name** (defensive — the register
  form blocks this): `buildTesiCheckPipeline` → `null`, outcome
  `'incomplete_identity'`, no Pipeline created.
- **Registration then Profile questionnaire**: questionnaire resolves the
  registration Pipeline by email → `pipeline` mode → `updatePipeline` merges
  anagrafica/phone/academic. No duplicate.
- **Repeated registration verify / repeated Profile save**: idempotent — re-resolve
  finds the record → enrich, never duplicate.
- **Profile, pre-rule account (verified, no Pipeline)**: `new_pipeline` fallback
  — requires a first name (`fallbackNameError` if blank), then creates one
  Pipeline with `sources: ['TesiCheck']` + whatever the user typed.
- **No session / unverified / malformed email**: resolver `unavailable` →
  neutral state, no Pipeline, no checkout redirect.
