# TesiCheck — Standalone Acquisition + Profile Enrichment (technical handoff)

> **Not a source of truth.** UX/product source of truth stays
> [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md) (§33).
> This file records implementation knowledge that would be expensive for a new
> agent to rediscover. Product rules are referenced, not restated.

Scope: standalone TesiCheck registration → immediate CRM Pipeline
(create/dedupe) → later Profile questionnaire enriches that Pipeline. The
Student questionnaire is **not** in scope. No consent checkbox copy is added
(see §9).

> **Dashboard/report entry-point cards were later brought into scope — see
> §20.** The original post-payment academic-review interstitial (§15–§17, §19)
> was superseded by a post-**registration** onboarding modal
> (`StandaloneProfileCompletionModal`) hosted on the Dashboard and the Report
> page, plus a non-blocking Dashboard reminder card. Read §20 first for the
> current architecture; §15–§19 remain for historical trace only.

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

> **Commercial-consent ownership corrected — see §21.** This section
> originally placed commercial-communications consent on Profile (implemented
> by Slice C/D below). Product direction later corrected this: account email
> and the commercial-communications preference both belong to **Account**, on
> both the standalone and Student surfaces — Profile owns only identity,
> contacts (phone) and academic info. The table and rules immediately below
> are kept for historical trace of the Slice C/D implementation; §21 is the
> current, authoritative IA.

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

Rules (historical — see §21 for the current split):

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

> **Surface moved — see §21.** This slice put the commercial-consent control
> on Profile. It has since moved to Account (both standalone and Student) —
> the *model* this slice built (tri-state, per-email, `CommercialConsentField`)
> is still exactly what Account now uses; only which page renders/writes it
> changed. Kept for historical trace of the model's origin.

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
| `student/ProfilePage.tsx` | The standalone `Comunicazioni` `FormSection` is **removed**. `CommercialConsentField` now sits **inside `Contatti`, under the email**, with caption `Riferito all'indirizzo <email>.` Prefill via `readStudentEmailConsent(student.contacts?.emails, primaryEmail)`; `handleSubmit` writes the primary email's `marketing_consent` via `withStudentEmailConsent` (guarded by `commercialTouched`). No global field written. **Superseded by §21** — the email row and this consent block have since moved off Profile entirely, onto `student/AccountPage.tsx`. |
| `PublicProfilePage.tsx` | `target.mode === 'student'` branch: prefill via `readStudentEmailConsent(matched?.contacts?.emails, accountEmail)`; `saveStudentConsent` writes `withStudentEmailConsent(s.contacts?.emails, accountEmail, choice, { source: 'tesicheck-standalone-profile' })` — the verified matching email only, no Pipeline, no global value. `pipeline` / `new_pipeline` branches unchanged. **Superseded twice over**: §19 replaced this CRM-branching shape with `standaloneProfile.ts`-only reads/writes, and §21 then moved consent off Profile onto `PublicAccountPage.tsx` entirely. |

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

---

## 15. Slice 1 — post-payment ACADEMIC-PROFILE REVIEW interstitial (authenticated standalone only)

> **FULLY SUPERSEDED — see §20.** §15–§16 describe a post-**payment**
> academic-review interstitial (`PostPaymentEnrichmentInterstitial`,
> `pendingEnrichmentBreadcrumb.ts`) inserted between materialization and the
> report. That interstitial, its breadcrumb, and the CRM-coupled resolver it
> originally used (later repointed to `standaloneProfile.ts` by §19) have all
> been **deleted**. Academic-profile completion moved to **registration
> onboarding**: a one-time modal shown over the Dashboard or the Report
> (`StandaloneProfileCompletionModal`), plus a persistent, non-blocking
> Dashboard reminder card. The paid flow (`PublicPaidSottocheckPage`,
> `PublicAccountGatePage`) now navigates straight to the report after
> materialization, with no academic step in between. §15–§17 are kept for
> historical trace only — none of the components/files/functions they name
> still exist. Read §20 for the current architecture.

Scope: the authenticated-standalone paid flow **only** —
`/public-view/sottocheck` (`PublicPaidSottocheckPage`). The Student paid flow
(`StudentPaidSottocheckPage`) is a later slice, not touched here.

> **Guest `/public/account` (`PublicAccountGatePage`) now shares this same
> post-payment academic-profile review — see §16 (Slice 2).** Both pages reuse
> `PostPaymentEnrichmentInterstitial` and the `resolvePostPaymentAcademicReview`
> / `applyPostPaymentAcademicUpdate` / `academicValuesForRecord` helpers
> documented below; their controllers (checkout stages, verification, payment,
> materialization, recovery) remain fully separate. The insertion architecture
> (shared helper + shared presentational leaf + a per-page navigation gate) is
> what made that reuse possible without merging the two pages or their shells.

**It is a review-and-update step, not gap-fill.** Whenever a reviewable academic
target exists, **all four** academic fields are shown, **prefilled** with the
current values, so the user can confirm, correct, complete or skip. It is still
**not** identity completion, contact collection, sales-lead capture,
account/legal management or full Profile editing. Surname, phone, contacts,
consent, quotes, notes, assignees and `sources` are **never** touched — no field,
no save path anywhere in this slice.

**Multiple Student academic records.** The Student domain supports several
academic records. This step reviews **one existing** record: a Student with >1
record gets a compact `Percorso accademico` selector to choose which existing
record to review (preselecting `is_current`, else the first in Profile order).
The selector is only an edit-target chooser — it never changes `is_current`,
creates/deletes a record, touches `StudentService` / `academic_record_id`, or
associates the paid TesiCheck with any record. **There is no
PersistentTesiCheck ↔ academic-record association in this slice** (a separate
future decision if it becomes a requirement).

### 15.1 Product shape

- **Post-materialization only.** Shown **after** the persistent standalone check
  exists (`completedCheck` set), never before. On a materialization failure the
  existing `completionError` recovery is unchanged and the review never appears.
- **Optional, non-blocking.** `Aggiorna profilo` (primary) attempts the academic
  update then navigates regardless of the outcome; `Salta` (secondary) writes
  nothing, marks nothing, creates no entity. Both always reach the paid report.
- **Always all four fields, prefilled.** For a resolvable target the interstitial
  renders `Livello di laurea`, `Università`, `Corso di laurea`, `Tipologia`
  every time, prefilled with the current values — **not** "missing fields only".
  The interstitial only disappears when there is **no** reviewable target (see
  §15.4).
- **Review, not correction surface.** The full Profile remains the surface for
  deliberate multi-record management; this is a lightweight one-screen review.
- **Values belong to Pipeline / Student, never the check.** Nothing is written to
  `PersistentTesiCheck` / `public-tesicheck-checks-v1`.
- **Save never blocks the report.** `applyPostPaymentAcademicUpdate` runs in a
  `try/catch`; navigation happens regardless. No recovery screen for this data —
  payment/report recovery and this review are different domains.

### 15.2 Fields (four — academic only)

| UI label | key | Pipeline target | Student target | Control |
| --- | --- | --- | --- | --- |
| Livello di laurea | `degree_level` | `academic_data.degree_level` | selected record | select |
| Università | `university_name` | `academic_data.university_name` | selected record | text |
| Corso di laurea | `course_name` | `academic_data.course_name` | selected record | text |
| Tipologia | `thesis_type` | `academic_data.thesis_type` | selected record (`Compilativa` / `Sperimentale` / `Esame`) | select |

Plus, for a Student with >1 record, a `Percorso accademico` `<select>` above the
four fields. Explicitly **excluded**: `Cognome`, `Telefono`, first name, email,
`Materia` (`thesis_subject`), `Professore` (`thesis_professor`), `Argomento`
(`thesis_topic`), Terms, Privacy, commercial consent. No exam-specific
properties — `Esame` stays a `thesis_type` value.

`PostPaymentAcademicValues` = `{ degree_level?, university_name?, course_name?, thesis_type? }`.

### 15.3 Files

| File | Change |
| --- | --- |
| `src/app/data/tesicheckLeadEnrichment.ts` | **New exports.** `PostPaymentAcademicValues`, `AcademicRecordOption`, `PostPaymentAcademicReview`, `PostPaymentAcademicOutcome`; `resolvePostPaymentAcademicReview({ accountEmail, students, pipelines })` → `{ applicable, initialValues, records?, selectedRecordId? }` (see §15.4); `academicValuesForRecord(students, recordId)` → prefill for one Student record by id (or `null`); `applyPostPaymentAcademicUpdate({ …, updatePipeline, updateStudent, values, studentRecordId? })` → re-resolves at call time and writes the Pipeline `academic_data` **or** the ONE Student record named by `studentRecordId` (see §15.5). Internal `academicValuesFrom` / `academicRecordLabel` / `orderedAcademicRecords` / `academicPatchFor` / `applyAcademicValuesToPipeline` / `applyAcademicValuesToStudentRecord`. No change to any existing export; `ContactPhone` is **not** imported. |
| `src/app/data/pendingEnrichmentBreadcrumb.ts` | **New.** `write/read/clearPendingEnrichmentCheckId` over the single `sessionStorage` key `tesicheck-pending-enrichment-v1`, value `{ checkId }` only. Protects post-materialization continuation on a refresh; never a payment idempotency key, never stores answers. |
| `src/app/components/tesicheck/PostPaymentEnrichmentInterstitial.tsx` | **New.** Presentational leaf. Props `{ initialValues; records?; selectedRecordId?; onRecordChange?; onSave(values); onSkip() }` — **no** checkId / reportPath / Pipeline / Student / account session. Reuses `FormSection` / `TextField` / `SelectField` / `fieldLabelStyle` / `controlStyle` from `ProfileFormPrimitives`. Heading `Prima del report`; body `Controlla o aggiorna alcune informazioni sul tuo percorso universitario. Le ritroverai nel Profilo. Puoi anche saltare e vedere subito il report.`; section `Contesto accademico`. **Single-column** layout (`grid-cols-1`) inside a contained `max-w-[520px]` column: optional `Percorso accademico` `<select>` (only when `records.length > 1`; options show the record summary + ` · Corrente` for the current one) followed by the **four always-rendered** fields, order degree level → university → course → typology, prefilled from `initialValues`. A guarded effect re-seeds the four fields when `selectedRecordId` changes. Actions: primary `Aggiorna profilo`, secondary `Salta`. No progress bar, no required markers, single screen. Degree/typology option lists are defined **locally** (see §15.6). |
| `src/pages/public/PublicPaidSottocheckPage.tsx` | Consumes `useLavorazioni` (`students`, `pipelines`, `updatePipeline`, `updateStudent`). New `academicReview` + `selectedRecordId` state. Mount effect: if a breadcrumb survives a reload and no in-memory review state, navigate straight to `/public-view/report/:checkId` and clear the breadcrumb. The **existing** `completedCheck → setTimeout(navigate, 1200)` effect is replaced by: write breadcrumb → `resolvePostPaymentAcademicReview` → if `applicable`, set `academicReview` + `selectedRecordId` and render the interstitial (no timer); else keep the 1200 ms beat and navigate. On render, the `initialValues` passed follow `selectedRecordId` via `academicValuesForRecord` so switching records updates the prefill. `handleAcademicSave` (try/catch around `applyPostPaymentAcademicUpdate` with `studentRecordId: selectedRecordId`, then navigate) / `handleAcademicSkip` (navigate only) / `handleAcademicRecordChange` (`setSelectedRecordId`); save/skip clear the breadcrumb. The **materialization effect and `completionError` recovery are untouched.** |

### 15.4 Review applicability (`resolvePostPaymentAcademicReview`)

Runs `resolveEnrichmentTarget(accountEmail)` (verified account email; unverified
→ `null` → `unavailable`):

- **`pipeline`** → `applicable: true`; `initialValues` from `pipeline.academic_data`;
  no `records`, no `selectedRecordId` (one flat object, no selector).
- **`student`, ≥1 academic record** → `applicable: true`; preselect the
  `is_current` record, else the first in Profile order
  (`is_current` first, then array order); `initialValues` + `selectedRecordId`
  from it; `records` (the ordered options, each labelled
  `Livello · Corso · Università` — the `CreateStudentDrawer` summary join — with
  `isCurrent`) **only when there is >1 record**.
- **`student`, 0 academic records** → `applicable: false` (no record fabricated) →
  straight to report.
- **`new_pipeline` / `unavailable`** → `applicable: false` → straight to report.

### 15.5 Update semantics (`applyPostPaymentAcademicUpdate`)

Re-resolves the target at save time (never trusts a stale target). Non-destructive
per field (`academicPatchFor`): a submitted **non-empty** value that **differs**
from the current one replaces it (explicit user correction); an unchanged value
is a no-op; a submitted **empty** value never erases an existing value. No field
is ever cleared here.

- **Pipeline** — `updatePipeline`, merge the changed non-empty keys into
  `academic_data`. Nothing else on the Pipeline is touched — no `last_name` /
  `student_name` / `phone` / contact / `sources` / consent / quotes / notes /
  assignees; **no second Pipeline**.
- **Student** — `updateStudent`, patch **only the one record whose `id` equals
  `studentRecordId`** (the record the user was reviewing), `updated_at` bumped
  only when a value actually changed. **A missing `studentRecordId`, or an id
  that no longer exists at save time, writes nothing.** Never creates a record,
  never changes `is_current`, never touches `id` / `student_id` /
  `StudentService.academic_record_id` / service bindings — and never touches
  identity, `contacts` (no phone write, no contact creation), `purposes`,
  `is_primary` or commercial consent. `is_current` changing meanwhile does **not**
  redirect the write — the selected record id is the edit target.
- **`new_pipeline` / `unavailable`** → nothing written (`outcome: 'skipped'`).

There is **no** phone-persistence / contact-creation logic and **no**
PersistentTesiCheck ↔ academic-record association anywhere in this slice.

### 15.6 Academic option constants (audit outcome)

The degree-level and typology option lists in `PublicProfilePage` are **not
exported**. Extracting them would mean editing a Profile page purely because a
second consumer appeared — out of scope for this slice and against the
"don't refactor for a second consumer" rule. The interstitial therefore defines
the two short lists **locally**. The record-summary selector label reuses the
existing `CreateStudentDrawer` vocabulary (`degreeLabelMap` + `' · '` join +
`Corrente` cue), replicated locally in `tesicheckLeadEnrichment.ts`
(`DEGREE_LEVEL_SUMMARY_LABEL` / `academicRecordLabel`) since that map is not
exported either. No new taxonomy. If a third consumer appears, extract then.

### 15.7 Refresh / breadcrumb behaviour

- On materialization success the page writes `{ checkId }` to
  `sessionStorage['tesicheck-pending-enrichment-v1']` **before** deciding on the
  review.
- A reload while the interstitial (or the 1200 ms beat) is open loses the
  in-memory flow; on the next mount the page reads the breadcrumb and navigates
  straight to `/public-view/report/:checkId`, then clears it.
- The breadcrumb is also cleared on `Aggiorna profilo`, `Salta`, and the
  automatic direct-to-report path.
- It is **never** used to reopen payment, regenerate the check, or as a payment
  idempotency key (`sourcePaymentReference` is unchanged and untouched). It only
  protects post-materialization continuation.

### 15.8 Verification

- `npm run build` — passes (Vite 6.4.2).
- `git diff --check` — clean (only pre-existing LF→CRLF warnings).
- `npx tsc --noEmit` — **42-error baseline unchanged**; no new errors in touched
  or new files.

Manual code trace:

- **A. Pipeline target** → `resolvePostPaymentAcademicReview` → `applicable`, no
  `records` → interstitial shows the four fields prefilled from
  `pipeline.academic_data`, no selector.
- **B. Student with exactly 1 academic record** → `applicable`,
  `selectedRecordId` set, no `records` → four fields prefilled from that record,
  no selector.
- **C. Student with 3 academic records** → `records` (3 options, Profile order),
  `selectedRecordId` = the `is_current` one → selector shown with the current
  record preselected; fields reflect it.
- **D. Switch the selector to another record** → page updates `selectedRecordId`,
  recomputes `initialValues` via `academicValuesForRecord`, the component's
  guarded effect re-seeds the four fields from that record.
- **E. `Aggiorna profilo`** → `applyPostPaymentAcademicUpdate` with
  `studentRecordId = selectedRecordId` → only that record (matched by stable id)
  is patched; unchanged/empty inputs never write; existing values are only
  replaced by an explicit different non-empty value.
- **F. `is_current` flag** is never read as a write target and never modified —
  the selected record id is authoritative even if `is_current` changed meanwhile.
- **G. No `StudentService` / `academic_record_id` / service-access change**;
  `applyAcademicValuesToStudentRecord` maps only the matched record's four
  content fields + `updated_at`.
- **H. Student with 0 academic records** → `applicable: false` → no interstitial
  → 1200 ms beat → report; no record created.
- **I. No PersistentTesiCheck / report ↔ academic-record association** is
  introduced anywhere (grep: no write to `public-tesicheck-checks-v1` from the
  helper; the check id is only used for navigation + the breadcrumb).
- **J. `Salta`** → zero writes → breadcrumb cleared → report.
- **K. Refresh on the interstitial** → breadcrumb read on mount → report; no
  payment, no duplicate check (materialization effect guarded by `isProcessing`
  + `hasCreatedCheckRef` + per-`sourcePaymentReference` dedupe, none of which the
  breadcrumb path touches).
- **L. Materialization failure** → `completedCheck` never set → decision effect
  bails → existing `completionError` recovery only → interstitial never appears.

---

## 16. Slice 2 — same academic-profile review on the guest checkout (`PublicAccountGatePage`)

> **FULLY SUPERSEDED — see §20.** Same note as §15: the post-payment
> interstitial this section extended to the guest checkout no longer exists.
> `PublicAccountGatePage` now navigates straight to the report after
> materialization, unchanged apart from that removal.

Extends §15 to the **guest acquisition flow**:
`/public → /public/account → payment → materialization → academic-profile
review → report`. Reuses the Slice 1 leaf and helpers as-is; adds **zero** new
product concepts. `StudentPaidSottocheckPage` remains untouched (later slice).

### 16.1 What is reused vs. what stays separate

**Reused, unmodified:**

- `PostPaymentEnrichmentInterstitial` (same component, same props contract —
  no guest-specific variant, no second questionnaire component).
- `resolvePostPaymentAcademicReview`, `applyPostPaymentAcademicUpdate`,
  `academicValuesForRecord`, `AcademicRecordOption`, `PostPaymentAcademicValues`
  (`tesicheckLeadEnrichment.ts` — no changes to any of §15's exports).
- `pendingEnrichmentBreadcrumb.ts` (`tesicheck-pending-enrichment-v1`) — same
  single key, same contract.
- `resolveEnrichmentTarget` (Student wins over Pipeline) underneath both.

**Stays separate (by design — not merged):**

- `PublicAccountGatePage` (guest checkout controller: account/login/register,
  email verification, checkout stage machine, payment gateway, materialization,
  `completionError` recovery) and `PublicPaidSottocheckPage` (authenticated
  standalone controller) remain two independent page components. Only the leaf
  interstitial and the data-layer helpers are shared — never the controller,
  never the shell, never the checkout/account UI.
- Account/login/registration forms, email verification, the checkout stage
  machine (`PrecheckFlowStage`), `SottocheckCheckoutSummary`, the payment
  gateway boundary, and `createPersistentCheckFromPaidPrecheck` (+ its retry) —
  **all byte-for-byte unchanged.**

### 16.2 Exact insertion point

Same seam as Slice 1: the pre-existing
`completedCheck → setTimeout(navigate('/public-view/report/:id'), 1200)` effect
(`PublicAccountGatePage.tsx`, previously right after the materialization effect)
is the *only* thing gated/replaced. Nothing about the materialization effect or
its retry (`handleRetryReportCreation`) changed.

After `setCompletedCheck(check)` (materialization effect success, **unchanged**)
or a successful `handleRetryReportCreation` (**unchanged**), the page now:

1. writes `{ checkId }` to `sessionStorage['tesicheck-pending-enrichment-v1']`;
2. runs `resolvePostPaymentAcademicReview({ accountEmail: account?.emailVerified
   ? account.email : null, students, pipelines })` — the SAME `account` state
   the page already tracks (set at login/register/`confirmAccountEmail`), gated
   `emailVerified` is guaranteed true by the time payment succeeds because
   `isPaymentEnabled` (`authenticated && emailVerified`) already gated
   `startRedirect`;
3. if `applicable` → sets `academicReview` + `selectedRecordId`, renders
   `PostPaymentEnrichmentInterstitial` (wrapped in the page's own
   `<main className="min-h-screen bg-[var(--background)] px-[20px] … md:px-[40px]">`
   shell, matching the page's other early-return branches — this page has no
   shared `PublicLayout` chrome, unlike `PublicPaidSottocheckPage`) and does
   **not** arm the navigation timer; also sets `isCompletingPayment` to `false`
   so the "Pagamento ricevuto" card does not compete with the review render;
4. otherwise (Pipeline missing, Student with 0 academic records, or
   `new_pipeline` / `unavailable`) → keeps the existing 1200 ms "Pagamento
   ricevuto" beat and navigates.

A new mount-only refresh-safety effect mirrors Slice 1: if a breadcrumb survives
a reload and there is no in-memory `completedCheck` / `academicReview`, navigate
straight to `/public-view/report/:checkId` and clear it.

`handleAcademicSave` (try/catch around `applyPostPaymentAcademicUpdate` with
`studentRecordId: selectedRecordId`, then navigate) / `handleAcademicSkip`
(navigate only) / `handleAcademicRecordChange` (`setSelectedRecordId`) are new,
name-for-name parallels of the Slice 1 handlers. The render order is: academic
review → `isCompletingPayment` → `completionError` → `!precheckSession` → the
checkout form — so a materialization failure (`completionError`) is always
reached before any review state exists (`completedCheck` is never set on that
path), and the review branch always wins over the processing/checkout branches
once it is set.

### 16.3 Pipeline behaviour

Identical to §15.5: `resolveEnrichmentTarget` resolves by the verified account
email. Guest registration already created/deduped that Pipeline **at email
verification** (`handleConfirmEmail` → `applyStandaloneRegistrationConsent` →
`ensureTesiCheckPipeline`, unchanged, canonical §33.3) — **long before** payment.
The post-payment review therefore always resolves the **same, already-existing**
Pipeline; it never creates a second one. All four fields prefill from
`pipeline.academic_data`; `Aggiorna profilo` writes only the changed non-empty
fields back to that same Pipeline (non-destructive — see §15.5).

### 16.4 Student multi-record behaviour

Identical to §15.4 / §15.5: 0 records → no review → report; 1 record → review
directly, no selector; >1 records → `Percorso accademico` selector, preselecting
`is_current` else the first record in Profile order. The selected record id is
only the edit target — `is_current`, `StudentService`, `academic_record_id` and
service access are never touched, and the write targets that stable record id
even if `is_current` changes meanwhile.

An existing Student identity is resolved **before** any Pipeline lookup (the
long-standing `resolveEnrichmentTarget` rule, canonical §33.3) — registration
never creates a Pipeline for an email that already matches a Student, so the
guest post-payment review naturally lands on the Student branch for that case,
exactly like Slice 1.

### 16.5 Breadcrumb / refresh behaviour

Reuses the **same** `pendingEnrichmentBreadcrumb.ts` module and the same single
key — no second guest-specific storage mechanism. One guest-specific fact
matters here and is now explicit in the module's Slice 1 header comment: the
guest **pre-check session** (`tesicheck-precheck-session-v1`,
`sessionStorage`) is already cleared by `createPersistentCheckFromPaidPrecheck`
the moment materialization succeeds (canonical §6 / paid-consumer §3) — so once
a persistent check exists, the pre-check session can no longer serve as a
resume mechanism. The `tesicheck-pending-enrichment-v1` breadcrumb is what
protects continuation from that point forward: a refresh while the review is
open (or during the "Pagamento ricevuto" beat) loses in-memory state entirely,
but the breadcrumb lets the next mount fall straight to the already-materialized
report — no repayment, no duplicate check (the existing
`sourceTemporaryDocumentRef` dedupe in `createPersistentCheckFromPaidPrecheck`
is untouched and would no-op a duplicate attempt regardless). Questionnaire
answers are never restored — the review is disposable, the paid report is not.

### 16.6 Files changed

| File | Change |
| --- | --- |
| `src/pages/public/PublicAccountGatePage.tsx` | Consumes the same `useLavorazioni` destructure it already had. New `academicReview` + `selectedRecordId` state, mirroring Slice 1. New mount-only refresh-safety effect. The **existing** `completedCheck → setTimeout(navigate, 1200)` effect is replaced by the gated version (writes breadcrumb → `resolvePostPaymentAcademicReview` → interstitial or timer). New `handleAcademicSave` / `handleAcademicSkip` / `handleAcademicRecordChange` / `goToReport`. New early-return render branch (before `isCompletingPayment`) mounting `PostPaymentEnrichmentInterstitial` inside the page's own `<main>` shell. **Untouched:** the returning-account effect, the materialization effect, `handleRetryReportCreation`, `updateCheckoutStage`, `advanceAfterAuth`, `handleLogin`, `handleRegister`, `handleConfirmEmail` (+ its `applyStandaloneRegistrationConsent` call), `startRedirect`, `returnFromPayment`, and every render branch for `completionError` / `!precheckSession` / `isRedirecting` / the checkout form. |
| `src/app/data/tesicheckLeadEnrichment.ts` | **No changes** — Slice 1 exports reused as-is. |
| `src/app/components/tesicheck/PostPaymentEnrichmentInterstitial.tsx` | **No changes.** |
| `src/app/data/pendingEnrichmentBreadcrumb.ts` | **No changes** — same key, same module, now documented as shared by both paid pages. |

### 16.7 Prototype-scope notes (handoff only, not implemented)

Explicitly out of scope here, same as Slice 1 and the rest of this workstream:
durable server-side workflow state, token-based recovery, CRM transaction
rollback, payment reconciliation, questionnaire-answer persistence beyond the
one-shot in-memory review, audit logging, analytics, and queue/retry
infrastructure. The `tesicheck-pending-enrichment-v1` breadcrumb and the
`sourceTemporaryDocumentRef` / `sourcePaymentReference` dedupe keys remain
prototype-only, client-side stand-ins for what production must implement
server-side (canonical §7.4, paid-consumer handoff §7 "PROTOTYPE LIMITATION").

### 16.8 Verification

- `npm run build` — passes (Vite 6.4.2).
- `git diff --check` — clean (only pre-existing LF→CRLF warnings).
- `npx tsc --noEmit` — **42-error baseline unchanged**; no new errors in
  `PublicAccountGatePage.tsx` or any other touched file.

Manual code trace:

- **A. Guest `/public` → registration/login → payment → persistent check →
  applicable Pipeline review → report.** Registration creates/dedupes the
  Pipeline at email verification (unchanged); payment succeeds; materialization
  effect creates the persistent check (unchanged, dedupe by
  `sourceTemporaryDocumentRef`); decision effect resolves the same Pipeline via
  the verified email and shows the review if any field is worth reviewing (it
  always is, since the review is now review-not-gap-fill — see §15.1); `Aggiorna
  profilo` / `Salta` both reach `/public-view/report/:checkId`.
- **B. Existing Pipeline values** → all four fields prefilled; a correction on
  save persists to the **same** Pipeline (`updatePipeline`, matched by
  `resolveEnrichmentTarget`'s `pipeline.id`) — never a duplicate.
- **C. Student identity with multiple academic records** (guest login/registration
  email matches a seeded Student with >1 record) → `Percorso accademico` selector
  appears, preselecting `is_current`; switching updates the prefill; save patches
  only the selected record's stable id.
- **D. Student with 0 academic records** → `resolvePostPaymentAcademicReview`
  returns `applicable: false` → review skipped → report; no record created.
- **E. `Salta`** → zero Pipeline/Student writes → breadcrumb cleared → report.
- **F. Refresh while the review is open** → mount effect reads the breadcrumb →
  navigates straight to the already-materialized report; no gateway, no new
  `createPersistentCheckFromPaidPrecheck` call, no duplicate persistent check.
- **G. Materialization failure** (`?paymentDemo=reportfail` or a storage error)
  → `completedCheck` never set → decision effect never runs → existing
  `completionError` recovery screen only, unchanged copy and retry button → no
  academic review at any point on this path.
- **H. Guest registration / account / payment UI is otherwise unchanged** — no
  edits to `LoginForm`, `RegisterForm`, `VerifyEmailForm`,
  `SottocheckCheckoutSummary`, `SottocheckPaymentGatewayBoundary`, the
  `PrecheckFlowStage` machine, or any copy in the account/verify/payment steps.
  (`RegisterForm` was later touched by an unrelated, separate correction — see
  §18.2 — not by this slice.)

---

## 17. Standalone Profile consistency correction — Student multi-record + consent placement

> **SUPERSEDED by §19.** This section fixed `PublicProfilePage` to expose a
> Student's real multi-record academic history INSTEAD of a neutral card — a
> genuine, still-valid product fix. But the mechanism it used (branching on
> `resolveEnrichmentTarget`, writing into `Student.academic_records[]` /
> `Pipeline.academic_data` directly from the public Profile) reintroduced the
> exact CRM coupling into the public Profile that §19 then removed. The
> **shape** this section establishes — `Informazioni personali` → `Contatti`
> (consent inline) → `Percorso attuale` + `Percorsi precedenti`, reusing
> `AcademicRecordsSections`/`studentAcademicRecords` helpers — is preserved
> in §19; only the data source changed, from Pipeline/Student to
> `standaloneProfile.ts`. `student/ProfilePage`'s own refactor onto the shared
> `studentAcademicRecords.ts` module (the files table below) is **unaffected**
> — the Student role surface still reads/writes `Student.academic_records[]`,
> unchanged by §19.

**Problem found.** `PostPaymentEnrichmentInterstitial` (Slices 1–2) correctly
distinguishes a Pipeline's single flat `academic_data` from a Student's
multi-record `academic_records[]`. `/public-view/profilo`
(`PublicProfilePage`) did not: its Student branch was a neutral
"Profilo studente già collegato" card with only a commercial-consent control —
it never exposed the Student's actual academic records at all, current or
previous. That made the post-payment copy "Le ritroverai nel Profilo" literally
false for a Student-resolved identity: an academic edit made in the review had
nowhere to be seen again on `/public-view/profilo`. The commercial-consent
control also lived in a separate `Comunicazioni` `FormSection`, inconsistent
with the per-email domain model (Pipeline `marketing_consents[email]` / Student
`contacts.emails[].marketing_consent`) and with `student/ProfilePage`'s own
placement (inline under `Contatti`).

**Fix — reuse, not redesign.** No new academic-record model, no route/shell
merge. `PublicProfilePage` and `student/ProfilePage` now share two extracted
modules; each page keeps its own state, resolution and `updateStudent` calls.

| File | Role |
| --- | --- |
| `src/app/data/studentAcademicRecords.ts` | **New.** Pure domain layer: `EditableAcademic`, `toEditableAcademicRecord`, `createDraftAcademicRecord`, `editableAcademicHasContent`, `editableAcademicDiffersFrom`, `applyAcademicRecordEdits(studentId, records, edits)` — the Profile-style direct-correction merge (content overwrite, `updated_at` bumped only on real change, never `id`/`student_id`/`is_current`/service bindings). This is explicitly **not** the post-payment review's gap-fill (`tesicheckLeadEnrichment.ts`); both live side by side because the semantics differ on purpose. |
| `src/app/components/profile/AcademicRecordsSection.tsx` | **New.** Presentational: `AcademicRecordFields` (the 7-field grid — `degree_level`, `course_name`, `university_name`, `thesis_type`, `thesis_professor`, `thesis_subject`, `thesis_topic`) and `AcademicRecordsSections` (`Percorso attuale` + `Percorsi precedenti`, add/remove-draft/delete-if-unbound, its own local "confirm delete" state). Option lists (`degreeLevelOptions`/`typologyOptions`) are passed in as props — each host keeps its own local `DEGREE_LEVEL_OPTIONS`/`TYPOLOGY_OPTIONS` constant (not extracted; same "don't refactor for a second consumer" call as §15.6, now a third+fourth consumer exists but still out of scope for this pass). |
| `src/pages/student/ProfilePage.tsx` | **Refactored, behavior-preserving.** Local `EditableAcademic`/`toEditable`/`editableHasContent`/`editableDiffersFrom`/`AcademicFields`/`textActionStyle` removed in favor of the shared modules; `handleSubmit`'s inline merge replaced by `applyAcademicRecordEdits`; the "Percorso attuale"/"Percorsi precedenti" JSX replaced by one `<AcademicRecordsSections>` call. Output is unchanged — same fields, same copy, same interactions, same `updateStudent` write shape. |
| `src/pages/public/PublicProfilePage.tsx` | **Behavior change (this is the actual fix).** See below. |

### 17.1 Pipeline target — unchanged model, reordered/relocated sections only

Still one flat `academic_data`, no record selector (a Pipeline cannot have
multiple academic records — none invented). Section order normalized to
`Informazioni personali` (was `Anagrafica`) → `Contatti` (was `Contatto`,
now **also** hosts the commercial-consent control, moved out of the removed
`Comunicazioni` section, with a `Riferito all'indirizzo …` caption matching
`student/ProfilePage`) → `Percorso universitario`. `handleSubmit`'s write logic
(the `academic_data` merge, `marketing_consents[email]` write) is **untouched**
— only the JSX section each field lives in moved.

### 17.2 Student target — now a real multi-record editor, not a neutral card

The branch keeps its "Nome, cognome e contatti restano gestiti dal percorso
dedicato" note (identity editing is still out of scope for the standalone
Profile — an intentional, unchanged decision, not reopened here) but now also
renders:

- `Contatti` — `Email account` (read-only, the verified account email) +
  the commercial-consent control inline, same placement/domain rule as
  `student/ProfilePage` and the Pipeline branch above: writes
  `contacts.emails[verifiedEmail].marketing_consent` only, via the SAME
  `withStudentEmailConsent` helper already used here before this change.
- `AcademicRecordsSections` bound to `matchedStudent.academic_records` via
  the new `studentAcademic` state (`EditableAcademic[]`), prefilled and
  re-synced on the same `student:{id}:{recordIds.join(',')}` key pattern
  `student/ProfilePage` uses (so in-session edits are not clobbered, but a
  fresh mount always re-reads current data — including any change made by the
  post-payment review, canonical §33.7).
- One `Salva` submit (`handleStudentSubmit`) that writes **both** the touched
  consent (if any) and the academic corrections in a single `updateStudent`
  call, via `applyAcademicRecordEdits(matchedStudent.id, matchedStudent.academic_records, studentAcademic)`
  — the exact same domain function `student/ProfilePage` uses. Replaces the
  old lone "Salva preferenza" button.

**Zero new academic-record source.** No second array, no flattening: the
Profile reads/writes the SAME `Student.academic_records[]` the post-payment
review and `student/ProfilePage` read/write. A record edited in the
post-payment review (Slice 1/2) is the same record shown here (matched by
stable `id`); a record edited here is the same record `student/ProfilePage`
and Admin see, in the same SPA session (existing shared-source-of-truth
convention, canonical §33 / production-handoff.md).

**Still enforced, unchanged:** `is_current` is never editable from this
surface (no toggle, `AcademicRecordsSections` never exposes one); the delete
action is hidden entirely for a record referenced by a `StudentService`
(`isStudentRecordServiceBound`, same `services.some(s => s.academic_record_id === id)`
check as `student/ProfilePage`); no `StudentService` write of any kind
originates from the Profile.

### 17.3 Trace

- Pipeline user edits academic data in the post-payment review → same
  `pipeline.academic_data` → `/public-view/profilo` shows the updated values on
  next visit (same object, no copy).
- Student user with 3 academic records edits record B in the post-payment
  review (via its stable id) → `/public-view/profilo` shows record B, unchanged
  id, among the same 3 records (current + 2 previous, or whatever the actual
  split is) — no duplication, no flattening.
- `is_current` and `StudentService` bindings are never touched by either
  surface.

### 17.4 Verification

`npm run build` passes; `git diff --check` clean; `npx tsc --noEmit` at the
**42-error baseline**, no new errors in any touched or new file.

---

## 18. Registration commercial-consent invariant — explicit choice required

**Problem found.** `RegisterForm`'s "Comunicazioni commerciali" control was a
single checkbox defaulting to unchecked/`false`. That made "declined" and
"never interacted with the control" indistinguishable at the data layer: a
registration where the user simply never touched the checkbox produced the
exact same `commercialConsent: false` as one where they deliberately declined.
Downstream, `ensureTesiCheckPipeline` / `applyStandaloneRegistrationConsent`
already write an EXPLICIT boolean whenever `commercialConsent` is a `boolean`
(never a silent default) — so the actual gap was entirely in the form: it never
forced a genuine choice.

**Product rule (new, standalone-registration-specific):** for a standalone
account that has completed TesiCheck registration, the resolved identity's
verified account email must end up with an explicit
`marketing_consent = true | false` — never unknown/`null`/absent. The
preference itself stays optional (`Sì` is never required); **expressing** it is
mandatory. This is **narrower** than the general CRM rule: `Pipeline` contacts
from other acquisition channels, and Student contacts not touched by this
registration, may legitimately stay `Non richiesto` / unknown — that tri-state
is unchanged everywhere else (Admin Slice D, Profile for a Pipeline resolved by
email match rather than fresh registration, etc.).

### 18.1 Fix

`src/pages/public/standaloneAuthForms.tsx` — `RegisterForm` only:

- `commercialConsent` local state changed from `useState(false)` (boolean,
  defaulting to "declined") to `useState<boolean | null>(null)` (tri-state,
  defaulting to "not yet chosen").
- The custom `ConsentCheckbox`-based block is replaced by the **same shared**
  `CommercialConsentField` (`src/app/components/profile/CommercialConsentField.tsx`)
  already used by both Profiles — reused as-is, no new component, same
  `Sì, desidero…` / `No, non desidero…` copy and the same
  "Puoi modificare questa scelta in qualsiasi momento." helper.
- `submit()` gains one more guard, after the two required Terms/Privacy checks
  and before calling `onSubmit`: `if (commercialConsent === null) { setError(...); return; }`
  — a plain-language error ("Seleziona una preferenza per le comunicazioni
  commerciali (Sì o No).") in the form's existing single error slot. Positive
  consent is still never required — only that *some* explicit answer was given.
- `RegisterSubmitValues.commercialConsent` stays `boolean` (unchanged type) —
  the form's own guard guarantees it is never reached with `null`.

Nothing else changed: `PublicAccountGatePage.handleRegister` and
`PublicStandaloneAuthPage.handleRegister` already forward
`values.commercialConsent` verbatim into `pendingCommercialConsent` and then
into `applyStandaloneRegistrationConsent` at `handleConfirmEmail` — both
untouched, because they already handled a plain `boolean` correctly. No change
to `tesicheckLeadEnrichment.ts`, `ensureTesiCheckPipeline`,
`applyStandaloneRegistrationConsent`, or either Profile's *read* logic — this
was a write-path (form) defect, not a read-path one; per the task instruction,
the fixture/registration-state path was fixed rather than coercing an unknown
read into `false` anywhere downstream.

### 18.2 Why the Profile automatically stops showing "Preferenza non ancora espressa"

> **Updated by §19.** At the time this section was written, `/public-view/profilo`
> still read `readEmailMarketingConsent` / `readStudentEmailConsent` (Pipeline /
> Student) directly, so this reasoning applied to the Public Profile too. §19
> removed that read path: the Public Profile now reads
> `readStandaloneCommercialConsent` from `standaloneProfile.ts` instead. The
> underlying mechanism described below — "the write path always supplies a
> `boolean`, so the empty state never occurs for a completed registration" —
> is now true of `standaloneProfile.ts`'s `commercial_consents` map
> specifically, seeded by `seedStandaloneProfileFromRegistration` (§19.4). It
> remains true of the CRM side too (Admin still reads Pipeline/Student
> tri-state, still never sees an unexplained gap for a TesiCheck registration)
> — the two are now two independent writes of the SAME explicit choice, not
> one read serving both surfaces.

`CommercialConsentField` only renders that helper line when
`value === null`. Since `readEmailMarketingConsent` /
`readStudentEmailConsent` now always find an explicit key for a
TesiCheck-registered identity's verified email (because the write path always
supplies a `boolean`), the empty state simply never occurs for that identity —
no change to either Profile's *read* logic was needed or made. The empty state
remains fully legitimate for:

- a Pipeline resolved by e-mail match that pre-dates this registration
  (created through another acquisition channel);
- an existing Student whose matched email was never asked (general Admin/CRM
  tri-state, unchanged);
- the `new_pipeline` fallback (pre-rule accounts, canonical §33.3) — that path
  still creates a Pipeline without necessarily capturing a consent choice, by
  design (it is a fallback for accounts that predate this rule, not a new
  registration).

### 18.3 Scope discipline

Untouched, on purpose: Admin tri-state consent editing (Slice D), manually
created Pipeline consent semantics, Student contacts not resolved through this
registration path, service access, Account Terms/Privacy status. `LoginForm`
and `VerifyEmailForm` are untouched — only `RegisterForm`'s commercial-consent
control changed.

### 18.4 Verification

`npm run build` passes; `git diff --check` clean; `npx tsc --noEmit` at the
**42-error baseline**, no new errors in `standaloneAuthForms.tsx` or any other
file.

---

## 19. Public Profile / post-payment review decoupled from CRM (Pipeline/Student)

**Problem found.** §15–§17 built the public-facing Profile / post-payment
review on top of `resolveEnrichmentTarget` (Pipeline-vs-Student CRM
resolution). That over-modelled CRM ownership into public UI that should not
have known about it: the public Profile's *shape* changed depending on whether
the account's email happened to match a Pipeline or a Student — a one-block
academic form for one, a multi-record editor for the other — and the
post-payment review inherited the same branching, plus wrote directly into
`Pipeline.academic_data` / `Student.academic_records[]`. Acquisition/CRM logic
is explicitly **owned by the developer team, not this prototype UI workstream**
— the public Profile and the post-payment review must not depend on it.

**PROTOTYPE / PRODUCTION HANDOFF boundary (read this first):**

- **PROTOTYPE:** the standalone Profile now has its own self-contained,
  demonstrable user-profile state (`src/app/data/standaloneProfile.ts`),
  independent of CRM resolution. It supports one current + zero-or-more
  previous academic records for every authenticated standalone user, always —
  never "one block vs. many" depending on a CRM match. The post-payment review
  reads/writes that SAME state. Acquisition Pipeline creation/dedupe
  (`ensureTesiCheckPipeline`, `applyStandaloneRegistrationConsent`) is
  **completely unchanged** and lives **entirely outside** this Profile UI's
  concerns — registration still creates/dedupes a Pipeline (or resolves a
  Student) exactly as before; the Profile simply never reads or writes that
  result.
- **PRODUCTION HANDOFF:** whether and how a standalone user's Profile data
  (this prototype's `standaloneProfile.ts`) should reconcile with a real
  CRM/Student backend entity is a decision for developer/backend
  implementation — **this prototype intentionally does not simulate that
  reconciliation.** Nothing in `standaloneProfile.ts`, `PublicProfilePage`, or
  the post-payment review should be read as prescribing that architecture; it
  is a UX/UI demonstration of Profile *ownership and shape*, not a CRM design.

### 19.1 What was removed

| Removed | From | Why |
| --- | --- | --- |
| `resolvePostPaymentAcademicReview`, `applyPostPaymentAcademicUpdate`, `academicValuesForRecord`, `PostPaymentAcademicValues`, `AcademicRecordOption`, `PostPaymentAcademicReview`, `PostPaymentAcademicOutcome`, and their internal helpers (`academicValuesFrom`, `academicRecordLabel`, `orderedAcademicRecords`, `academicPatchFor`, `applyAcademicValuesToPipeline`, `applyAcademicValuesToStudentRecord`) | `src/app/data/tesicheckLeadEnrichment.ts` | Review-only, CRM-coupled, used by nothing else (confirmed by a repo-wide grep before deletion) |
| Pipeline-vs-Student branching for identity, contacts, academic data and consent (`target.mode === 'pipeline' \| 'student' \| 'new_pipeline' \| 'unavailable'`, `useLavorazioni()`, `resolveEnrichmentTarget`, `addPipeline`/`updatePipeline`/`updateStudent` calls) | `src/pages/public/PublicProfilePage.tsx` | The public Profile must not change shape based on CRM resolution |
| `resolveStandaloneAcademicReview`'s / the review's dependence on `students`/`pipelines`/`updatePipeline`/`updateStudent` | `PublicPaidSottocheckPage.tsx`, `PublicAccountGatePage.tsx` | The review must read/write only the standalone Profile |

`tesicheckLeadEnrichment.ts` is now back to exactly its pre-review-work shape
(`resolveEnrichmentTarget`, `ensureTesiCheckPipeline`,
`buildTesiCheckPipeline`, `applyStandaloneRegistrationConsent`, and their
supporting helpers) — a diff against the last commit shows **zero** changes to
any of those functions, only the module doc-comment and the removed
review-only tail. **Not removed, not touched:** `resolveEnrichmentTarget`
itself, `ensureTesiCheckPipeline`, `applyStandaloneRegistrationConsent`,
`buildTesiCheckPipeline`, `withTesiCheckSource`, `nextPipelineId`,
`withEmailMarketingConsent` — registration still uses every one of them,
unchanged. No Admin file was touched.

### 19.2 Chosen standalone Profile prototype source of truth

**New module:** `src/app/data/standaloneProfile.ts`. **Not** an extension of
`tesicheckAccountSession.ts` — that module owns *account* identity and legal
state (email, verification, Terms/Privacy), and conflating Profile data
(personal info, academic records, commercial consent) into it would blur
"who I am" with "what I've told you about myself", a distinction the rest of
the prototype already treats as meaningful (canonical §33.5's Profile-vs-Account
split). A separate, small, dedicated store keeps that boundary intact while
staying just as minimal.

- **Storage:** `localStorage`, key `tesicheck-standalone-profile-v1`, one JSON
  object keyed by the **normalized verified account email** — the same keying
  `tesicheck-registered-accounts-v1` already uses, so no new identity concept
  is introduced. (Not keyed by `DEMO_ACCOUNT_ID`: that id is shared by every
  standalone account in this prototype, so keying by it would collapse every
  registered email's Profile into one row — wrong for demo walkthroughs where
  different test registrations should see their own data.)
- **Shape** (`StandaloneProfile`): `email`, `first_name`, `last_name`, `phone`,
  `commercial_consents: Record<string, boolean>` (per-email, mirrors the
  Pipeline `marketing_consents` shape conceptually but is a wholly separate
  map — never the same object), `academic_records: StandaloneAcademicRecord[]`.
- **Academic record shape** (`StandaloneAcademicRecord`): `id`, `is_current`,
  the seven content fields (`degree_level`, `course_name`, `university_name`,
  `thesis_type`, `thesis_professor`, `thesis_subject`, `thesis_topic`),
  `created_at`, `updated_at`. No `student_id`, no `foreign_language`, no
  `thesis_language`, no service-binding field of any kind — those are Student
  operational-domain concepts this store never models.
- **Invariant:** `ensureStandaloneProfile(email)` (get-or-create) guarantees
  the returned profile always has **exactly one `is_current` record** —
  auto-creating a blank one on first use. A standalone Profile is never "not
  applicable"; it always has something to review or complete.

### 19.3 Public Profile (`/public-view/profilo`) — final shape (HISTORICAL layout — see §21)

> **Layout superseded by §21.** Email account and the consent control shown
> in the `Contatti` block below have since moved to `PublicAccountPage.tsx`
> — Profile's `Contatti` now holds only Telefono. Everything else in this
> subsection (academic sections, save semantics, first-name fallback) is
> unaffected and still accurate.

Same conceptual layout as §17 established, now CRM-free:

```text
Informazioni personali   (Nome, Cognome)
Contatti                 (Telefono)
Percorso attuale         (AcademicRecordsSections)
Percorsi precedenti      (AcademicRecordsSections)
```

- **Always the multi-record experience** — no branching. Every authenticated
  standalone user gets `Percorso attuale` + `Percorsi precedenti`, reusing the
  shared `AcademicRecordsSections` leaf (unchanged from §17) with the **same**
  option constants (`DEGREE_LEVEL_OPTIONS` / `TYPOLOGY_OPTIONS`, still local —
  no shared-taxonomy extraction, per the earlier documented decision) and all
  seven academic content fields.
- **`isRecordServiceBound` is a trivial `() => false`** — the standalone
  Profile has no `StudentService` concept, so every previous record is always
  deletable. This does not change `AcademicRecordsSections`'s contract (still
  used, unmodified, by `student/ProfilePage`, where the same prop carries the
  real service-binding check).
- **Save** (`handleSubmit`) writes `updateStandaloneProfile`: `first_name`,
  `last_name`, `phone` (direct correction, not gap-fill — same "Profile lets
  you correct what you already know" semantics as before) and
  `applyStandaloneAcademicEdits(profile.academic_records, academic)` — the
  same direct-correction merge shape §17 introduced, now operating on
  `StandaloneAcademicRecord[]` instead of `Student.academic_records[]`.
  Consent is no longer part of this save at all — see §21.
- **First-name prefill fallback:** `profile.first_name || getAccountFirstName(session)`
  — if the Profile store's `first_name` is still blank (e.g. an account whose
  registration predates this store), fall back to the account session's first
  name for continuity. `getAccountFirstName` is account-identity data, not
  CRM — this is not a Pipeline/Student read.

### 19.4 Commercial consent — smallest prototype-local mechanism

> **UI surface superseded by §21** — the control itself moved from Profile to
> `PublicAccountPage.tsx`. The storage mechanism and registration-seeding
> described below are unaffected: §21 changes only which page renders and
> writes `writeStandaloneCommercialConsent`, not the store itself.

The approved per-email UX (`CommercialConsentField`, tri-state, "Puoi
modificare questa scelta in qualsiasi momento.") is unchanged. What changed is
**where the Public Profile reads/writes it**:

- `readStandaloneCommercialConsent(email)` / `writeStandaloneCommercialConsent(email, granted)`
  in `standaloneProfile.ts` — tri-state read (`commercial_consents[email]`
  absent = never expressed), explicit-boolean write only.
- **Bridging the registration choice in, without CRM branching in the
  Profile:** `RegisterForm` already forces an explicit Sì/No choice at
  registration (§18). At `handleConfirmEmail` (`PublicAccountGatePage.tsx`,
  `PublicStandaloneAuthPage.tsx`) that SAME explicit boolean is now written
  **twice, in parallel, to two independent places**:
  1. `applyStandaloneRegistrationConsent(...)` — **unchanged call, unchanged
     behaviour** — the acquisition write, to Pipeline `marketing_consents[email]`
     or a matched Student's `contacts.emails[].marketing_consent`. This is
     what Admin reads (Slice D, §14) and is owned by the CRM/acquisition
     workstream, not this one.
  2. `seedStandaloneProfileFromRegistration({ email, firstName, commercialConsent })`
     (new, `standaloneProfile.ts`) — mirrors first name + the SAME consent
     boolean into `standaloneProfile.ts`'s own `commercial_consents` map. This
     is what `/public-view/profilo` and the post-payment review read.

  Both calls read the SAME already-resolved `pendingCommercialConsent`
  component state; neither one derives from or depends on the other's result.
  The Profile never calls `resolveEnrichmentTarget` to find "its" consent
  value — it only ever reads its own store.
- **Invariant preserved, unchanged:** a completed standalone registration
  still always produces an explicit `true | false` for the account email
  (§18) — now written to both the CRM side (Admin visibility) and the
  Profile-local side (Public Profile visibility) at once. The general
  Admin/CRM tri-state semantics for contacts from other channels are
  completely untouched.

### 19.5 Post-payment academic review — final source/update behaviour (HISTORICAL — see §20)

> **This entire subsection describes a step that no longer exists.** §20
> replaced the post-payment review with a post-**registration** onboarding
> modal; the paid pages no longer gate navigation on any academic step. Kept
> for historical trace only — `resolveStandaloneAcademicReview`,
> `standaloneAcademicValuesForRecord` and `applyStandaloneAcademicReview` were
> deleted from `standaloneProfile.ts` and replaced with
> `getCurrentAcademicValues` / `applyCurrentAcademicUpdate` (current-record
> only, no selector — see §20.3).

Same UI, same seam (`completedCheck` → breadcrumb → decide → interstitial or
1200 ms timer → report), same non-destructive 4-field patch semantics as
§15/§16 established — only the data source changed:

- **`resolveStandaloneAcademicReview(email)`** (`standaloneProfile.ts`) calls
  `ensureStandaloneProfile(email)` and returns `{ initialValues,
  selectedRecordId, records? }` directly — **always** resolvable for a valid
  verified email (a current record always exists), so there is no longer a
  Pipeline-missing / Student-0-records / `new_pipeline` / `unavailable` case
  to skip on. The interstitial's applicability now depends only on "is there a
  verified account email", not on any CRM state.
- **0 academic records in the Profile:** per product direction, this is a USER
  PROFILE surface, so there is no reason to skip. `ensureStandaloneProfile`
  auto-creates a blank current record and the review shows it — the opposite
  of the old CRM-based behaviour, which skipped entirely for a Student with 0
  records.
- **1 record:** no selector, prefilled directly.
- **>1 records:** `Percorso accademico` selector, preselecting the current
  record (else the first in the same order convention as before). Selecting
  another record re-derives `initialValues` via
  `standaloneAcademicValuesForRecord(email, recordId)`.
- **`applyStandaloneAcademicReview(email, recordId, values)`** — the exact
  same non-destructive per-field patch §15 built
  (`academicPatchFor`/`fourFieldPatch`: non-empty + different → replaces;
  empty or unchanged → no-op; the record's other three Profile-only fields are
  never touched), now against `StandaloneAcademicRecord` instead of Pipeline
  `academic_data` / a `Student.academic_records[]` entry. A missing or stale
  `recordId` at save time writes nothing.
- **No CRM write is required or performed for this review, ever.** `reviewEmail`
  (new page-local state on both paid pages) captures the verified email once,
  at the same moment the review is resolved, so the save/prefill calls never
  need to re-resolve anything.
- **No TesiCheck ↔ academic-record association** is introduced — unchanged
  from §15/§16; the check id is used only for navigation + the breadcrumb.

### 19.6 Files changed

| File | Change |
| --- | --- |
| `src/app/data/standaloneProfile.ts` | **New.** The CRM-free Profile store: `StandaloneProfile`, `StandaloneAcademicRecord`, get/ensure/update, `readStandaloneCommercialConsent` / `writeStandaloneCommercialConsent` / `seedStandaloneProfileFromRegistration`, `toEditableStandaloneRecord` / `applyStandaloneAcademicEdits` (Profile, 7-field direct correction), `resolveStandaloneAcademicReview` / `standaloneAcademicValuesForRecord` / `applyStandaloneAcademicReview` (post-payment review, 4-field non-destructive patch). Imports only the generic, Student-agnostic pieces of `studentAcademicRecords.ts` (`createDraftAcademicRecord`, `editableAcademicHasContent`, the `EditableAcademic` type) — never `StudentAcademicRecord` itself. |
| `src/app/data/tesicheckLeadEnrichment.ts` | Reverted to its pre-review shape: the entire "Post-payment ACADEMIC-PROFILE REVIEW" section removed; module doc-comment updated to point at `standaloneProfile.ts`. **Zero** changes to any acquisition function. |
| `src/pages/public/PublicProfilePage.tsx` | Rewritten: no more `useLavorazioni`, `resolveEnrichmentTarget`, Pipeline/Student branching. Reads/writes only `standaloneProfile.ts`. Always renders the same Informazioni personali → Contatti → Percorso attuale → Percorsi precedenti shape. |
| `src/pages/public/PublicPaidSottocheckPage.tsx` | Review wiring repointed from `tesicheckLeadEnrichment.ts` to `standaloneProfile.ts`; `useLavorazioni()` removed entirely (nothing else in the page needed it); new `reviewEmail` state. |
| `src/pages/public/PublicAccountGatePage.tsx` | Same repointing; `useLavorazioni()` **kept** (still needed for the untouched `applyStandaloneRegistrationConsent` call); new `reviewEmail` state; `handleConfirmEmail` gains the additive `seedStandaloneProfileFromRegistration` call. |
| `src/pages/public/PublicStandaloneAuthPage.tsx` | Same additive `seedStandaloneProfileFromRegistration` call at its own `handleConfirmEmail`, for parity with the in-checkout registration path. |
| `src/app/components/tesicheck/PostPaymentEnrichmentInterstitial.tsx` | Import source for `PostPaymentAcademicValues` / `AcademicRecordOption` changed from `tesicheckLeadEnrichment.ts` to `standaloneProfile.ts`; doc comment updated. **No behavioural change** — still presentation-only, still receives no CRM/account data. |
| `src/pages/student/ProfilePage.tsx`, `src/app/components/profile/AcademicRecordsSection.tsx`, `src/app/data/studentAcademicRecords.ts` | **Unaffected by this task** — `student/ProfilePage` still reads/writes `Student.academic_records[]` directly, unchanged; the shared leaf/helpers are reused, not modified. |

### 19.7 Trace

- **A.** New standalone user → `ensureStandaloneProfile` guarantees a current
  academic record from the first Profile visit; `Aggiungi percorso precedente`
  is always available.
- **B.** `/public-view/profilo` renders the identical shape regardless of
  whether the account email happens to match a Pipeline, a Student, or
  neither — because it never checks.
- **C.** Post-payment review's `initialValues` come from
  `resolveStandaloneAcademicReview`, reading `standaloneProfile.ts` only.
- **D.** A save in the post-payment review (`applyStandaloneAcademicReview`)
  and a later visit to `/public-view/profilo` (`ensureStandaloneProfile`) read
  the same `localStorage` row for that email — the edited values appear.
- **E.** Adding a previous path in the Profile (`addPreviousRecord` →
  `applyStandaloneAcademicEdits` on save) persists a new
  `StandaloneAcademicRecord`; a later paid check's review resolves
  `resolveStandaloneAcademicReview` against the updated `academic_records`
  array and offers it in the selector.
- **F.** Neither `applyStandaloneAcademicEdits` nor `applyStandaloneAcademicReview`
  nor any Profile handler calls `updatePipeline` / `updateStudent` / `addPipeline`
  — confirmed by grep (`useLavorazioni` no longer imported in
  `PublicProfilePage.tsx` / `PublicPaidSottocheckPage.tsx`).
- **G.** `ensureTesiCheckPipeline`, `applyStandaloneRegistrationConsent`,
  `resolveEnrichmentTarget`, `buildTesiCheckPipeline` are byte-for-byte
  unchanged (diff-verified against the last commit).
- **H.** No Admin file appears in the changed-files list for this task.
- **I.** The materialization effect, `handleRetryReportCreation`, the payment
  gateway, `createPersistentStandaloneCheck` / `createPersistentCheckFromPaidPrecheck`,
  the `completionError` recovery, the `tesicheck-pending-enrichment-v1`
  breadcrumb and the Save/Skip → `goToReport` navigation are all unchanged —
  only `resolveStandaloneAcademicReview` / `applyStandaloneAcademicReview` /
  `standaloneAcademicValuesForRecord` replaced the CRM-based equivalents at
  the exact same call sites.
- **J.** `RegisterForm` still blocks submit until an explicit Sì/No is chosen
  (§18, unchanged); the choice is now written to both the CRM side and the
  Profile-local side.

### 19.8 Verification

`npm run build` passes; `git diff --check` clean; `npx tsc --noEmit` at the
**42-error baseline**, no new errors in any touched or new file.

---

## 20. Post-payment review replaced by post-registration onboarding modal + Dashboard reminder card

**Problem found.** §15–§19 placed academic-profile completion **after
payment**, as an interstitial between check materialization and the report.
Product direction changed: Profile completion belongs to **registration
onboarding**, not payment — a guest who registers mid-checkout and a user who
registers directly (`Registrati`, no purchase involved) should get the same
one-time opportunity to complete their academic profile, and a paid report
must never be delayed or gated by it.

**PROTOTYPE / PRODUCTION HANDOFF boundary (read this first):**

- **PROTOTYPE:** registration sets a one-time onboarding-prompt flag on the
  standalone Profile (`standaloneProfile.ts`). Whichever authenticated
  surface the user reaches first — Dashboard (direct registration) or the
  paid Report (guest checkout registration) — shows
  `StandaloneProfileCompletionModal` over its already-rendered content, never
  gating or delaying it. The Dashboard additionally shows a persistent,
  non-blocking reminder card whenever the current academic record is missing
  any of its four essential fields, independent of the one-time flag.
- **PRODUCTION HANDOFF:** as with §19, this prototype does not prescribe how
  the onboarding prompt or Profile data should be represented against a real
  backend/CRM — `profile_completion_prompt_pending` and the completeness
  derivation are prototype-local, `localStorage`-backed signals only.

### 20.1 Canonical hierarchy

Three surfaces, three distinct jobs — never conflated:

1. **`StandaloneProfileCompletionModal`** — an immediate, ONE-TIME onboarding
   opportunity shown right after a NEW registration, on whichever surface
   (Dashboard or Report) the user reaches first. Controlled exclusively by
   `profile_completion_prompt_pending`. Never reappears once dismissed
   (Save, Skip, or the X all dismiss it the same way).
2. **Dashboard reminder card** — a persistent, non-blocking reminder shown
   whenever the CURRENT academic record's four essential fields are not all
   filled in, regardless of whether the modal was ever shown, skipped, or
   completed. Disappears the moment those four fields are all present.
3. **`/public-view/profilo`** — the full management surface: personal info,
   contacts, commercial consent, the current record's all seven fields, and
   any number of previous records (add/remove). Both the modal and the
   reminder card exist only to route the user toward this surface; neither
   replaces it.

These two flags are **intentionally independent** — see §20.4 for the
worked example the product spec called out explicitly.

### 20.2 `profile_completion_prompt_pending` — the one-time flag

New optional field on `StandaloneProfile` (`standaloneProfile.ts`):

```
profile_completion_prompt_pending?: boolean
```

- Means **only** "the one-time onboarding modal still needs to be shown" —
  never a Profile-completeness signal (that is §20.5's separate derivation).
- `isProfileCompletionPromptPending(email)` — absent (legacy/pre-feature
  profiles, or no profile at all) reads as `false`. Never inferred from
  missing academic data; never defaulted to `true`.
- `dismissProfileCompletionPrompt(email)` — sets it `false`. Called on every
  modal exit (Save, Skip, X) — identical outcome for all three, differing
  only in whether academic data was also written (§20.6/§20.7).
- Set to `true` **only** by `seedStandaloneProfileFromRegistration`, i.e.
  only on a brand-new successful registration. No other code path ever sets
  it `true` — an existing account can never have the modal "re-armed".

### 20.3 Registration seeding

`seedStandaloneProfileFromRegistration({ email, firstName, commercialConsent })`
(`standaloneProfile.ts`) is unchanged in its call sites — both
`PublicAccountGatePage.handleConfirmEmail` and
`PublicStandaloneAuthPage.handleConfirmEmail` already called it (§19.4) to
mirror the registration's first name + commercial-consent choice onto the
Profile store. Its **body** now additionally sets
`profile_completion_prompt_pending: true` on every call. Since this function
only ever runs once, at a NEW registration's email-verification moment, no
existing/legacy account is ever retroactively flagged — `profile_completion_prompt_pending`
simply does not exist on a profile that predates this feature, which
`isProfileCompletionPromptPending` reads as `false` (§20.2).

Nothing else about registration changed: `applyStandaloneRegistrationConsent`
(the Pipeline/Student acquisition write) is called immediately before, at the
same call site, completely unchanged (§19.4's diagram still applies — this
is a third parallel write alongside the two §19.4 already documented, not a
replacement of either).

### 20.4 Worked example — why the two flags never interact

From the product spec, verified by code trace:

1. New registration → `profile_completion_prompt_pending = true`.
2. User reaches the Dashboard (or Report) → modal shown.
3. User clicks **Salta** → `dismissProfileCompletionPrompt` →
   `profile_completion_prompt_pending = false`. Zero academic writes. Modal
   never auto-opens again for this account.
4. The current academic record is still incomplete (nothing was written) →
   `isCurrentAcademicRecordComplete(email)` is `false` → the Dashboard
   reminder card **remains visible** — it never read the pending flag, so
   dismissing the modal has no effect on it.
5. User later fills in the four fields via `/public-view/profilo` and saves →
   `isCurrentAcademicRecordComplete(email)` becomes `true` → the reminder
   card disappears on the next Dashboard render. `profile_completion_prompt_pending`
   is never touched by this — it was already `false` since step 3 and stays
   that way; completing the Profile does **not** re-arm the modal.

### 20.5 Dashboard completeness derivation

`isCurrentAcademicRecordComplete(email)` (`standaloneProfile.ts`) — reads
(never auto-creates) the Profile's current academic record and returns
`true` only when `degree_level`, `university_name`, `course_name` and
`thesis_type` are all non-blank. No profile / no current record → `false`.
Previous records are never consulted — only the current record's four
essential fields decide the Dashboard reminder card's visibility (§20.7).
This is a **read-only** derivation; it never creates or modifies a profile
(unlike `ensureStandaloneProfile`, which the modal's prefill uses).

### 20.6 `StandaloneProfileCompletionModal`

New: `src/app/components/profile/StandaloneProfileCompletionModal.tsx`.
Follows the established custom-overlay modal pattern already used by
`AssignStepModal.tsx` (`coach/`) — fixed-inset overlay + `onClick={onClose}`,
inner card with `stopPropagation`, header with title + X, scrollable body,
footer actions — rendered with the Public/standalone pages' `var(--…)`
CSS-variable styling convention (matching `ProfileFormPrimitives.tsx` /
`SottocheckActionButton`), not Coach's Tailwind bracket-var syntax. The
unused shadcn `ui/dialog.tsx` / `ui/alert-dialog.tsx` primitives (zero
consumers repo-wide) were deliberately not adopted — reusing them here would
have introduced a second, competing modal architecture instead of following
the one actually in use.

- **Props:** `{ isOpen, email, onClose }` — no `checkId` / Pipeline / Student
  / account-session data; it only needs the verified email.
- **Content:** title `Completa il tuo profilo`; body `Aggiungi alcune
  informazioni sul tuo percorso universitario. Potrai modificarle in
  qualsiasi momento dal Profilo.`; single column, four fields — `Livello di
  laurea` (select), `Università` (text), `Corso di laurea` (text),
  `Tipologia` (select) — all optional, no progress bar, no required markers.
  The modal card itself is the only container; `FormSection` /
  `AcademicRecordsSections` are deliberately **not** nested inside it (per
  product direction — the modal is not a small Profile page).
- **Prefill:** `getCurrentAcademicValues(email)` (new, `standaloneProfile.ts`)
  — calls `ensureStandaloneProfile` (guarantees a current record exists,
  same invariant §19.2 established) and returns that record's four fields.
- **Save (`Aggiorna profilo`):** `applyCurrentAcademicUpdate(email, values)`
  (new) — the exact same non-destructive per-field patch semantics §15.5
  established (`fourFieldPatch`: non-empty + different → replaces; empty or
  unchanged → no-op), now always targeting the record flagged `is_current`
  directly (no `recordId` parameter — the modal never manages or selects
  among records), then `dismissProfileCompletionPrompt(email)`, then
  `onClose()`.
- **Skip / X (`Salta`, top-right X):** both call the same `dismiss()` —
  `dismissProfileCompletionPrompt(email)` then `onClose()` — zero academic
  writes, no field marked completed/declined.
- Width ~540px, `max-h-[85vh]` with an internal scrolling field area, so it
  stays usable at mobile widths without horizontal overflow.

### 20.7 Dashboard host (`DashboardPage.tsx`)

- Resolves the verified account email the same way `PublicProfilePage` does
  (`getAccountSession()` + `emailVerified` guard).
  Note: `DEMO_ACCOUNT_ID` remains the routing/report-ownership identity
  elsewhere in this prototype (§19.2) — the Profile store is keyed by email,
  unchanged from §19.
- `showCompletionModal` state, initialized from
  `isProfileCompletionPromptPending(accountEmail)` on mount; renders
  `<StandaloneProfileCompletionModal>` unconditionally alongside the existing
  Dashboard content (not gating it) — `onClose` just flips the state back to
  `false`, no navigation, no redirect. The Dashboard underneath is always
  already fully rendered.
- New reminder-card `<section>`, inserted between the TesiCheck service card
  and the Coaching upsell card, rendered only when
  `!isCurrentAcademicRecordComplete(accountEmail)` (re-derived whenever the
  modal's open state changes, so completing the Profile via the modal — if
  that path is ever extended — or dismissing it both refresh the card
  immediately). Intentionally lighter-weight styling than the TesiCheck card
  (no image sticker, thinner border, no shadow) to stay visually subordinate,
  per product direction. Copy: eyebrow/title `Completa il tuo profilo`, body
  `Aggiungi le informazioni sul tuo percorso universitario per completare il
  tuo profilo Sottotesi.`, CTA `Completa profilo` → `navigate('/public-view/profilo')`.
  The card never reopens the modal — it only links to the full Profile.
- Nothing else on the Dashboard (the TesiCheck card, the Coaching card, their
  copy/CTAs) was touched.

### 20.8 Report host (`PublicReportPage.tsx`)

Identical pattern to the Dashboard host, added as a sibling at the top of the
existing return JSX — `isValidCheck`, the iframe `src`/props, the download
handler and both support/storico cards are **byte-for-byte unchanged**. The
modal is rendered only in the valid-check branch (never in the `ReportState`
early-return for a missing/invalid check, which was left untouched); it sits
visually over the already-rendered report, never delays or gates the
`isValidCheck` guard, the iframe render, or navigation to this page. Session
resolution and modal open/dismiss logic mirror §20.7 exactly (own
`getAccountSession` + `isProfileCompletionPromptPending` read, own
`showCompletionModal` state).

### 20.9 Old post-payment interstitial removal

Both paid-flow controllers reverted to their pre-review shape:

| File | Change |
| --- | --- |
| `src/pages/public/PublicPaidSottocheckPage.tsx` | Removed all academic-review state/effects/handlers/render-branch. The materialization effect and `handleRetryReportCreation` are untouched. Restored the plain `completedCheck → setTimeout(navigate('/public-view/report/:id'), 1200)` effect — the review no longer sits between materialization and navigation. |
| `src/pages/public/PublicAccountGatePage.tsx` | Same reversion. `useLavorazioni()` **kept** (still needed for the untouched `applyStandaloneRegistrationConsent` call in `handleConfirmEmail`); `seedStandaloneProfileFromRegistration` call site unchanged (the new flag comes from extending that function's body, §20.3, not this call site). Restored the same plain navigation-timer effect. |
| `src/app/components/tesicheck/PostPaymentEnrichmentInterstitial.tsx` | **Deleted.** Fully replaced by `StandaloneProfileCompletionModal`, which is not a drop-in reuse (different trigger, different host pages, no record selector) — reusing the old component's shell would have kept a payment-shaped seam (`initialValues`/`records`/`selectedRecordId` props) with no product reason to exist anymore. |
| `src/app/data/standaloneProfile.ts` | `resolveStandaloneAcademicReview`, `standaloneAcademicValuesForRecord`, `applyStandaloneAcademicReview`, `AcademicRecordOption`, `StandaloneAcademicReview`, `recordLabel`, `DEGREE_LEVEL_SUMMARY_LABEL` **deleted** (confirmed unused repo-wide by grep before deletion) — replaced by the simpler current-record-only `getCurrentAcademicValues` / `applyCurrentAcademicUpdate` (§20.6) the modal actually needs, plus `profile_completion_prompt_pending` / `isProfileCompletionPromptPending` / `dismissProfileCompletionPrompt` / `isCurrentAcademicRecordComplete`. `seedStandaloneProfileFromRegistration` extended in place (§20.3). Module doc-comment rewritten to describe the modal/reminder-card architecture instead of the post-payment review. The 7-field Profile-editing exports (`toEditableStandaloneRecord`, `applyStandaloneAcademicEdits`) are **unchanged** — `/public-view/profilo` (§19.3) is untouched by this task. |

### 20.10 Breadcrumb decision

`src/app/data/pendingEnrichmentBreadcrumb.ts` — **deleted**, along with its
only callers (the two paid-flow controllers above). Its entire purpose
(§15.7/§16.5) was protecting continuation from a refresh **while the
post-payment interstitial was open, between materialization and navigation**.
That seam no longer exists — navigation after materialization is once again
a plain, ungated `setTimeout` → `navigate`, so a refresh during that brief
window simply re-renders the paid page from its own existing state (`?
completedCheck` is lost on a hard refresh regardless, same as before this
entire workstream began — an accepted, pre-existing prototype limitation,
not something this task's breadcrumb was protecting). No genuine
report-continuation use remained once the interstitial was removed, so
keeping the module would have been dead infrastructure with a misleading
name. A repo-wide grep after deletion confirmed both files (and the
interstitial component) have zero remaining importers.

### 20.11 Scope protection

Untouched, verified by `git diff --stat` against `Pipeline`/CRM/Admin/Student/
Account/payment files: `tesicheckLeadEnrichment.ts`, `LavorazioniContext.tsx`,
every `src/pages/admin/**`, every `src/pages/student/**`,
`tesicheckAccountSession.ts`, `tesicheckPersistentCheck.ts`. The Dashboard
reminder card is the **only** Dashboard-content change; every other Dashboard
section (TesiCheck card, Coaching card) is byte-for-byte unchanged. The
Report page's `isValidCheck` guard, iframe, download handler and support
cards are byte-for-byte unchanged.

### 20.12 Trace (acceptance criteria)

- **A.** Register during guest `/public/account` checkout → payment →
  materialization → plain `setTimeout` navigation (no gate) →
  `/public-view/report/:checkId` renders fully → modal shown **over** it
  (`isProfileCompletionPromptPending` true from registration).
- **B.** `Aggiorna profilo` in that modal → `applyCurrentAcademicUpdate`
  updates the Profile's current record's four fields → modal closes → report
  remains visible, unaffected → `profile_completion_prompt_pending` is
  `false`, so a later report visit never reopens it.
- **C.** `Salta` / X → zero academic writes → prompt dismissed → report
  remains visible → never reopens.
- **D.** Register directly via `/public/register` → Dashboard renders fully
  → same modal shown over it (same flag, same component, different host).
- **E.** Skip on the Dashboard → Dashboard remains, unaffected → modal never
  reopens on a later Dashboard visit.
- **F.** Current academic record still incomplete after Skip → Dashboard
  reminder card shown (§20.4's worked example).
- **G.** Reminder card's `Completa profilo` → `/public-view/profilo`.
- **H.** All four current-record fields completed in the full Profile →
  return to Dashboard → `isCurrentAcademicRecordComplete` now `true` →
  reminder card no longer rendered.
- **I.** A legacy/demo account with no `profile_completion_prompt_pending`
  key → `isProfileCompletionPromptPending` reads `false` → modal never
  auto-appears, on either host.
- **J.** `/public-view/profilo` (§19.3) still supports the current record
  plus any number of previous records, unaffected by this task.
- **K.** No modal / Dashboard-reminder / registration-seed write anywhere in
  this task calls `updatePipeline` / `updateStudent` / `addPipeline` —
  confirmed by grep; `useLavorazioni` is not imported by
  `StandaloneProfileCompletionModal.tsx`, `DashboardPage.tsx`, or
  `PublicReportPage.tsx`.
- **L.** `PublicPaidSottocheckPage.tsx` / `PublicAccountGatePage.tsx` contain
  no academic-review state, handler or render branch after this task —
  materialization → navigation is unconditional.
- **M.** The report is never blocked: `isValidCheck`, the iframe and the
  download flow are reached and rendered exactly as before this task, with
  the modal only ever layered on top, never gating any of it.

### 20.13 Verification

- `npm run build` — passes (Vite 6.4.2).
- `git diff --check` — clean (only pre-existing LF→CRLF advisory warnings on
  touched files, no actual whitespace errors).
- `npx tsc --noEmit` — **42-error baseline unchanged**; the handful of errors
  that do appear in touched files (`DashboardPage.tsx` image-module imports,
  `PublicReportPage.tsx`'s `import.meta.env`) are pre-existing, unrelated to
  this task, and were already part of the 42 before this work.
- `git diff` against Pipeline/CRM/Admin/Student/Account/payment files —
  empty (§20.11).
- Browser/UI smoke test: **not performed** — no browser-automation tool was
  available in this environment. `npm run dev` was started and served
  without console/build errors, but the modal, reminder card and both hosts
  were verified by code review + `tsc`/`build` only, not by exercising them
  in a live browser. This should be manually verified before shipping.

---

## 21. Cross-role self-service IA correction — account email + commercial consent move to Account

**Problem found.** §11 (and its Slice C/D implementation, §13–§14) placed the
commercial-communications preference on Profile, and both self-service
Profile pages additionally displayed the account/login email inline in
`Contatti`. Product direction established a canonical rule that applies to
every current and future self-service surface (standalone, Student, and —
documented for later — Coach): **account/login email and the
commercial-communications preference are ACCOUNT data, not Profile data.**
Profile is personal/professional information about the person; Account is
how they log in, how they're contacted commercially, and their legal state.
Mixing the two meant Profile's shape depended partly on account/consent
concerns, and the (already-established, §12) Profile/Account split wasn't
actually load-bearing for consent.

This does **not** apply to Admin CRM/contact surfaces (`PipelineDetailDrawer`,
`CreatePipelineDrawer`, `CreateStudentDrawer`, `ContactManager` in Admin
mode) — those legitimately show a contact's email and its commercial consent
together, because they are managing a *contact record*, not a self-service
identity. Admin is untouched by this task.

### 21.1 Canonical IA (applies to every self-service surface)

| Surface | Owns |
| --- | --- |
| **Profile** (`/public-view/profilo`, `/student-view/profilo`) | personal information, phone / non-login contact info, academic profile / history |
| **Account** (`/public-view/account`, `/student-view/account`) | account/login email, password/access management, **commercial-communications preference for that account email**, Terms & Conditions state, Privacy notice acknowledgement state |

Commercial communications remain **distinct** from Terms/Privacy — moving
the preference onto Account does not make it legal acceptance; it is still a
plain marketing preference, tri-state, never required, never gating
anything.

### 21.2 Standalone Public Profile (`/public-view/profilo`)

Removed from the Profile UI: the `Email account` read-only row and the
`CommercialConsentField` block (including its `Riferito all'indirizzo …`
caption) that used to sit in `Contatti`. `Contatti` now holds only Telefono.
Nothing else changed: `Informazioni personali` → `Contatti` (Telefono) →
`Percorso attuale` → `Percorsi precedenti`, same academic behaviour, same
`handleSubmit`/`applyStandaloneAcademicEdits` write, same
`updateStandaloneProfile` store. The underlying Profile-local commercial
state (`standaloneProfile.ts`'s `commercial_consents` map,
`readStandaloneCommercialConsent` / `writeStandaloneCommercialConsent`) is
**not deleted** — only no longer read/written from this page. The
Profile-completion modal (`StandaloneProfileCompletionModal`, §20) is
**unchanged** — it remains academic-only (the same four fields) and was not
touched by this task.

### 21.3 Standalone Account (`/public-view/account`)

New `FormSection "Comunicazioni"` inserted between the existing `Accesso`
and `Termini e privacy` sections. Renders the SAME `CommercialConsentField`
Profile used to render (no new consent-interaction pattern), with the SAME
caption `Riferito all'indirizzo <account email>.`, plus a `Puoi modificare
questa scelta in qualsiasi momento.` line (built into the shared component).
Since `PublicAccountPage` has no single page-level form/submit (Accesso and
Termini e privacy are both read-only), the Comunicazioni section gets its
own local `commercialConsent`/`commercialSaved` state and a dedicated
`Salva preferenza` button (`SottocheckActionButton`, disabled until a choice
is made) with an inline "Salvata" confirmation on success — matching the
save-confirmation pattern already used elsewhere (Profile's own save
banner), not a new one.

Reads/writes the exact same store the Profile page used to:
`readStandaloneCommercialConsent(session.email)` /
`writeStandaloneCommercialConsent(session.email, value)`
(`standaloneProfile.ts`) — **no CRM/Pipeline read or write was introduced
here.** A correctly registered standalone user never sees an
unknown/unexpressed preference (registration already forces an explicit
Sì/No, §18) — the tri-state "Preferenza non ancora espressa" state
(built into `CommercialConsentField`) remains reachable only for accounts
that predate this feature, same as before.

### 21.4 Student Profile (`/student-view/profilo`)

Removed from the Profile UI: the primary-email `ReadOnlyField` and the
`CommercialConsentField` block (with its `Riferito all'indirizzo …`
caption) that used to sit in `Contatti`, under the email. `Contatti` now
holds only Telefono (gap-fill text field, or a read-only row when a primary
number already exists — unchanged from before). The `primaryEmail`
computation, `commercialConsent`/`commercialTouched` state, and the
`withStudentEmailConsent` write inside `handleSubmit` are all removed from
this file entirely — consent no longer rides along with an academic/personal
save here. `academic_records`, `is_current`, `StudentService` bindings and
all existing academic-history management (add/edit/delete previous records,
service-bound delete protection) are **completely unchanged** —
`applyAcademicRecordEdits` and `AcademicRecordsSections` are untouched.

### 21.5 Student Account (`/student-view/account`)

New `FormSection "Comunicazioni"` inserted between `Accesso` and `Termini e
privacy`, mirroring §21.3. `AccountPage` now also destructures `updateStudent`
from `useLavorazioni()` (previously only `students`). Resolves the exact same
`primaryEmail` the page already computed for the `Accesso` row
(`student.contacts?.emails?.find(is_primary)?.email ?? student.email ?? ''`)
and reads/writes commercial consent via the **same** `marketingConsent.ts`
helpers Profile used to call — `readStudentEmailConsent` for prefill,
`withStudentEmailConsent(prev.contacts?.emails, primaryEmail, consent, {
source: 'student-account' })` for save, wrapped in the page's own
`updateStudent(student.id, …)` call. This writes **only**
`Student.contacts.emails[primaryEmail].marketing_consent` — never
`is_primary`, `purposes`, `service_access`, or any other email contact; never
a global `Student.marketing_consent` (still deprecated, still unused). If
`primaryEmail` cannot be resolved (empty string — a Student record with no
email contact at all, not expected in the current fixtures but handled
defensively), the section renders a neutral, non-fabricating message
(`Preferenza non disponibile: nessun indirizzo email registrato per questo
account.`) instead of a consent control — no invented email, no invented
consent.

### 21.6 Account ↔ Profile cross-links

Unchanged: Profile's `Gestisci account e privacy` → Account; Account's `Vai
al profilo personale` → Profile (`CrossSurfaceLink`, both directions, both
roles). These links are now more load-bearing than before — Account is
where email and consent visibility/editing live, so Profile relies on the
cross-link to point users there rather than duplicating anything. No
duplicate email/consent control exists on both pages for either role.

### 21.7 Registration — unchanged

Standalone registration still requires an explicit Sì/No for commercial
communications (§18, `RegisterForm`'s `commercialConsent === null` guard,
untouched). `seedStandaloneProfileFromRegistration` still seeds
`standaloneProfile.ts`'s `commercial_consents` map with that choice
(§19.4/§20.3) — Account simply reads/edits the same seeded value now,
instead of Profile. Terms acceptance, Privacy acknowledgement, and Pipeline
acquisition (`applyStandaloneRegistrationConsent`, `ensureTesiCheckPipeline`)
are byte-for-byte untouched.

### 21.8 Onboarding — unchanged

`StandaloneProfileCompletionModal`, the Dashboard reminder card, the
`profile_completion_prompt_pending` flag and `isCurrentAcademicRecordComplete`
(§20) are all untouched by this task. The modal remains academic-only (the
four fields it has always had); no email/marketing control was added to
onboarding.

### 21.9 Future Coach rule (documentation only — not implemented)

No Coach Account/Profile work was implemented or scoped by this task. For
when Coach self-service UI is eventually built, it should follow the same
boundary established here: Profile owns personal/professional Profile data;
Account owns login email, password, privacy state and communications
preference. This is a documentation note for that future work, not a
current requirement.

### 21.10 Shared components — audit outcome

`CommercialConsentField` (`src/app/components/profile/CommercialConsentField.tsx`)
was already fully presentation-only (no Pipeline/Student/session/CRM
knowledge, tri-state `value`/`onChange` props) — reused as-is on both Account
pages, no new consent-interaction pattern introduced.
`AccountPrimitives.tsx` (`AccountInfoRow`, `LegalStatusRow`,
`CrossSurfaceLink`) and `ProfileFormPrimitives.tsx` (`FormSection`) are also
reused unmodified. `PublicAccountPage.tsx` and `student/AccountPage.tsx`
remain two separate page components, each resolving its own role's identity
source (standalone account session vs. structured `Student`) — not merged.

### 21.11 Scope protection

Untouched: Admin Student drawer, Pipeline drawer, `ContactManager` in Admin
mode, Pipeline consent management, `Student.academic_records[]`,
`is_current`, `StudentService`, registration behaviour, Terms/Privacy state,
Pipeline acquisition/CRM logic, the Profile-completion modal, the Dashboard
reminder card, academic-completeness logic, `profile_completion_prompt_pending`.
Verified by an empty `git diff --stat` against every one of those files/areas.

### 21.12 Files changed

| File | Change |
| --- | --- |
| `src/pages/public/PublicProfilePage.tsx` | Removed `Email account` row and the commercial-consent block from `Contatti`; removed `commercialConsent`/`commercialTouched` state, the consent prefill and the consent write from `handleSubmit`. `Contatti` now holds only Telefono. |
| `src/pages/public/PublicAccountPage.tsx` | New `Comunicazioni` section between `Accesso` and `Termini e privacy`, with its own `commercialConsent`/`commercialSaved` state, `CommercialConsentField`, caption and `Salva preferenza` button, reading/writing `standaloneProfile.ts`'s `commercial_consents` map directly. |
| `src/pages/student/ProfilePage.tsx` | Removed the primary-email row and the commercial-consent block from `Contatti`; removed `primaryEmail`, `commercialConsent`/`commercialTouched` and the `withStudentEmailConsent` write from `handleSubmit`. `Contatti` now holds only Telefono. Academic-record management untouched. |
| `src/pages/student/AccountPage.tsx` | New `Comunicazioni` section between `Accesso` and `Termini e privacy`; now destructures `updateStudent`; reads/writes `Student.contacts.emails[primaryEmail].marketing_consent` via the existing `marketingConsent.ts` helpers, with a neutral fallback when no primary email resolves. |

No other file changed for this task.

### 21.13 Verification

`npm run build` passes; `git diff --check` clean (only pre-existing LF→CRLF
advisory warnings); `npx tsc --noEmit` at the **42-error baseline**,
unchanged, no new errors in any of the four touched files. `git diff --stat`
against Admin, Pipeline/CRM, `StandaloneProfileCompletionModal.tsx`,
`DashboardPage.tsx`, and the registration controller pages — empty, confirming
§21.11.
