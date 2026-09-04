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
| `src/app/data/tesicheckAccountSession.ts` | `TesiCheckAccountSession` gains explicit `firstName?`; `registerAccount(firstName, email)` sets it; `getAccountFirstName(session)` added (prefers `firstName`, single-token legacy `name` fallback). `name?` kept for legacy sessions. |
| `src/pages/public/PublicAccountGatePage.tsx` | `RegisterForm` "Nome" field is the explicit first name (`autoComplete="given-name"`, required — unchanged validation). On email verification (`handleConfirmEmail`) calls `ensureTesiCheckPipeline`. Consumes `useLavorazioni` (available: provider is now app-level). |
| `src/pages/public/PublicProfilePage.tsx` | Enrichment-first: normal path resolves the already-created Pipeline and updates it. `new_pipeline` kept as **fallback only** (pre-rule accounts) — requires a first name. `Nome` prefilled via `getAccountFirstName`. |
| `src/app/App.tsx` | Single app-level `LavorazioniProvider` (from the previous fix — unchanged here). |
| `src/app/data/LavorazioniContext.tsx` | `AVAILABLE_SOURCES` + `'TesiCheck'`; `Pipeline.academic_data.thesis_topic?`; `ThesisType` + `'esame'`. |
| `src/app/components/PipelineDetailDrawer.tsx`, `CreatePipelineDrawer.tsx`, `DrawerPrimitives.tsx` | Academic **labels/options only** (see §5). |
| `src/app/routes.tsx` | `/public-view/profilo` → `PublicProfilePage`. `/student-view/profilo` unchanged. |
| `docs/tesicheck-canonical-flow.md` | §33 rewritten (acquisition + enrichment + academic vocabulary + consent domains) + §29 bullets. |

Untouched: checkout/payment logic, TesiCheck reports, History, Coach, Admin
drawer architecture / conversion / validation, `StudentProfilePage`,
marketing-consent UX, Pipeline → Student conversion, underlying `thesis_*` field
names.

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
read view. `CreateStudentDrawer` edit-mode labels are Student-owned and left
unchanged (out of scope) — a known remaining inconsistency for a follow-up.

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

## 9. Open implementation requirement — versioned consent

Three distinct domains (canonical §33.5), **no legal wording invented here**:

1. Terms & Conditions acceptance;
2. Privacy notice acknowledgement / required privacy handling;
3. optional commercial-recontact / marketing consent.

Current state:

- `Pipeline.marketing_consents` (per-contact `Record<string, boolean>`)
  represents **only** domain 3. No UI is added for it in this slice.
- Domains 1 and 2 are **not modeled**. When required, they belong on the
  account/session model (`TesiCheckAccountSession` / its production replacement)
  as **versioned acceptance** — e.g. `{ termsVersion, termsAcceptedAt,
  privacyVersion, privacyAcknowledgedAt }` — never on the Pipeline and never
  folded into `marketing_consents`.
- Final checkbox copy waits on client/legal wording. Do not add it before then.

---

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
