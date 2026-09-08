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

**Slice C — commercial-consent controls in Profile:**

- Editable/revocable `Comunicazioni commerciali` control in `/public-view/profilo`
  (writes the resolved `Pipeline.marketing_consents[email]`) and
  `/student-view/profilo` (writes `Student.marketing_consent`). Commercial
  consent is **Profile-domain**, not Account-domain.
- Profile does **not** get Terms/Privacy rows — those live on the Account page.

**Slice D — Admin consent visibility:**

- Pipeline "recontact allowed" signal (drawer summary line, then list/card pill).
- `Student.marketing_consent` read surface in Admin Student.

**Not slice-scoped / backend:**

- `Student.marketing_consent` tri-state — only for **legacy Students never asked**
  (`boolean` still conflates "declined" and "never asked" for them). Standalone
  registration now always writes an explicit boolean, so it does not need it.
- Terms/Privacy policy pages, footer legal links, versioning/timestamp/audit.
- Retroactive acceptance for pre-feature registered accounts (separate product
  decision).
- Final checkbox copy, legal basis, controller identity, retention — client/legal.

---

## 11. Profile vs Account — surface responsibilities (product direction)

Profile and Account are **separate surfaces**. Slice A already respects this:
Terms/Privacy state is written to the account registry, commercial consent to
the Profile-domain identity (Pipeline / Student). The remaining slices must keep
them apart.

| Surface | Owns |
| --- | --- |
| **Profile** (`/public-view/profilo`, `/student-view/profilo`) | identity, contacts, academic info, **commercial communications consent** |
| **Account** (`/public-view/account`, `/student-view/account`) | account email, password / recovery entry points, **Terms acceptance status**, **Privacy acknowledgement status**, future account-management actions |

Rules:

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
