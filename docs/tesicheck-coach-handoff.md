# TesiCheck — Coach Handoff (technical)

> **Not a source of truth.** UX/product source of truth stays
> [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md) (Coach: §8.4, §11, §12, §19.1).
> This file only records implementation knowledge that would be expensive for a
> new agent to rediscover. Product rules are referenced, not restated.

Sibling doc for the paid consumer flow: [tesicheck-paid-consumer-handoff.md](./tesicheck-paid-consumer-handoff.md).
Coach is a **different entitlement/context domain** — do not copy the consumer
payment architecture into it.

---

## 1. Scope implemented (Coach Slice 1)

Path-bound Coach TesiCheck only:

- **Path-bound Coach check** — Coach selects an active coaching path, uploads a
  document, an internal entitlement check gates `Avvia controllo`, a brief
  transient processing state, then exactly one persistent record is written and
  the Coach report opens.
- **Prototype Coach identity shim** — `COACH_VIEW_COACH_ID = 'coach-view-demo'`
  (`src/app/utils/coachView.ts`). The Coach shell has no auth/session; this is
  the single stable id used as `owner.id`.
- **Explicit Giulia → `S-034` binding** — only the eligible coaching path
  (`svc-giulia-verdi`) carries a grounded `studentId` (`'S-034'`, the
  `STUDENTS_DATA` / `/coach-view/studenti/:studentId` id). Sara / Luca are not
  grounded and not selectable.
- **Prototype-local path id** — `pathId = 'svc-giulia-verdi'`, a code-defined
  constant, treated as opaque. Not joined to `LavorazioniContext` (`SS-101`).
  `pathLabel` is snapshotted so production can remap the id.
- **Persistent Coach store** — `src/app/data/tesicheckCoachCheck.ts`,
  `localStorage` key `coach-tesicheck-checks-v1`. Separate from the consumer
  paid store; does **not** reuse `public-tesicheck-checks-v1` or its validators.
- **`sourceExecutionReference` idempotency** — one token per accepted
  `Avvia controllo`, deduped inside the store.
- **Coach report route/wrapper** — `/coach-view/report/:checkId` →
  `src/pages/coach/CoachReportPage.tsx`, inside `CoachLayout`. Separate wrapper
  from `PublicReportPage` / `StudentReportPage`; shares only the static report
  content.
- **Qualitative-only Coach credit UI** — no remaining / total / cumulative-used
  numbers anywhere in the Coach view.

### NOT implemented (still)

- Coach `Check libero` (paid, no path) — no type branch, no UI, no route.
- Coach History / Storico — `src/pages/coach/ArchivioPage.tsx` still renders its
  2-item `mockHistory` and is **not** connected to `coach-tesicheck-checks-v1`.
- Real entitlement/quota — the availability gate is mock (see §4).
- Coach payment gateway — out of scope; path-bound mode has no payment.

---

## 2. Persistent model

`src/app/data/tesicheckCoachCheck.ts`, storage key **`coach-tesicheck-checks-v1`**
(array, newest first).

```ts
interface CoachPathBoundCheck {
  id: string;                                  // `COA-CHK-<last 8 of Date.now()>`
  owner: { context: 'coach'; id: string };     // id === COACH_VIEW_COACH_ID
  binding: {
    mode: 'coaching_path';                     // ONLY value; no check_libero branch yet
    studentId: string;                         // grounded STUDENTS_DATA id, e.g. 'S-034'
    studentName: string;                       // display snapshot at execution time
    pathId: string;                            // prototype-local opaque, e.g. 'svc-giulia-verdi'
    pathLabel: string;                         // display snapshot, e.g. 'Timeline Tesi Magistrale'
  };
  document: UploadedDocument;                   // { name, size, format } — no File/Blob
  creditsUsed: number;                         // = MOCK_CREDIT_COST_PER_CHECK (8), THIS check only
  status: 'completed';
  createdAt: string;                            // ISO
  completedAt: string;                          // ISO
  expiresAt: string;                            // ISO = completedAt + 30 days, computed locally
  report: { availability: 'available'; reference: string };  // reference = `REP-<...>`
  sourceExecutionReference: string;             // `coach-exec-<ts>-<rand>`
}
```

Accessors (Slice 1 surface only — no History APIs):

- `createCoachPathBoundCheck({ coachId, studentId, studentName, pathId, pathLabel, document, creditsUsed, sourceExecutionReference })` → `CoachPathBoundCheck | null`. Dedupes by `sourceExecutionReference` (returns the existing valid record instead of writing a duplicate). `null` = storage write failed.
- `getCoachPersistentCheck(id)` → `CoachPathBoundCheck | null` (runs the guard).
- `createCoachExecutionReference()` → `coach-exec-<ts>-<rand>`.
- `isCoachPathBoundCheck(value)` — internal runtime guard: `id`, `owner.context === 'coach'`, `owner.id`, `binding.mode === 'coaching_path'`, `binding.studentId`, `binding.pathId`, `document`, numeric `creditsUsed`, `status === 'completed'`, `completedAt`, `expiresAt`, `report.availability === 'available'`, `sourceExecutionReference`.

**Retention:** `expiresAt = completedAt + 30 days`, computed inline in
`createCoachPathBoundCheck` (`RETENTION_DAYS = 30` local const). Deliberately
**not** shared with the consumer store — extract a pure helper only when a second
real consumer exists.

**Excluded by design:** `price`, `payment`, quota total, remaining credits,
cumulative used credits, any `check_libero` field.

---

## 3. Identity limitations

- **`COACH_VIEW_COACH_ID = 'coach-view-demo'`** is a prototype shim. Not derived
  from "Teresa P." (the hardcoded `CoachHeader` display name), not an Admin
  `C-XX` id. Production must replace it with the real authenticated Coach id.
- **Only Giulia Verdi / `S-034` is grounded.** `TimelinePath.studentId` is
  optional; `canStartCheck` and `handleStartCheck` both require it, so a path
  without a grounded id can never materialize a record. Ids are never derived
  from `studentName` at runtime.
- **`svc-giulia-verdi` is prototype-local**, defined only in
  `src/pages/coach/SottocheckPage.tsx`. It is not the production coaching-path
  identity and has no code-level relation to `LavorazioniContext` `SS-xxx`.
  Both `pathId` and `pathLabel` are persisted so production can swap the id
  without losing the display snapshot.

---

## 4. Credit semantics

| Datum | Where it lives | Shown to Coach? | Persisted? |
| --- | --- | --- | --- |
| `creditsUsed` (this check) | `CoachPathBoundCheck.creditsUsed`, `= MOCK_CREDIT_COST_PER_CHECK` (8) | Not in Slice 1 UI (canonical §19.1 *permits* the single-check figure; not surfaced yet) | **Yes** |
| `MAX_FREE_CHECK_CREDITS` (100) — quota total | local const in `SottocheckPage.tsx` | **No** | No |
| `MOCK_USED_CREDITS_BY_PATH` / `draftUsedCreditsByPath` — cumulative used | local mock state | **No** | No |
| `availableCredits` (`MAX − draftUsed`) — remaining | derived in `SottocheckPage.tsx` | **No** (only feeds `canStartCheck`) | No |

The Coach UI shows **qualitative** availability only: `Percorso non selezionato`
/ `Disponibile` / `Non sufficiente`, and for the insufficient case the copy
`I crediti TesiCheck disponibili per questo percorso non sono sufficienti per
avviare un nuovo controllo.` No `X crediti rimasti`, no numbers.

The quota gate is **mock**: `availableCredits > 0` against local seeded state. A
real per-path Admin-assigned entitlement is out of scope.

---

## 5. Current journey

```
/coach-view/sottocheck
  select eligible coaching path (svc-giulia-verdi, grounded S-034)
  → upload PDF/DOCX (SottocheckUploadForm — the only real validator)
  → entitlement check: canStartCheck (path + grounded studentId + valid doc
    + coaching plan + availableCredits > 0)
  → Avvia controllo
      handleStartCheck: mint sourceExecutionReference, snapshot
      {studentId, studentName, pathId, pathLabel, document} into pendingCheckRef,
      reset hasCreatedCheckRef, checkStatus = 'processing'
  → brief neutral panel ("Stiamo preparando il report" + spinner)
      NO progress bar, NO "richiede alcuni minuti", NO SottocheckSuccessPanel
  → materialization effect (guarded by hasCreatedCheckRef, deps [checkStatus, completedCheck]):
      createCoachPathBoundCheck(...) writes ONE record to coach-tesicheck-checks-v1
      success → setCompletedCheck(check)
      null    → reopen guard, checkStatus = 'error' (recoverable "Riprova",
                reuses the same pendingCheckRef → same reference, no extra credit)
  → navigation effect (deps [completedCheck]): setTimeout 900 ms → navigate
    '/coach-view/report/COA-CHK-XXXXXXXX'  (inside CoachLayout)
```

**Idempotency lifecycle:** one `sourceExecutionReference` per accepted
`Avvia controllo`, held in `pendingCheckRef` for the mounted flow. StrictMode
double-invoke is covered twice: the `hasCreatedCheckRef` ref guard **and** the
`sourceExecutionReference` dedupe inside `createCoachPathBoundCheck`. A retry
from the `error` state reuses the same reference.

---

## 6. Report — `/coach-view/report/:checkId`

`src/pages/coach/CoachReportPage.tsx`, inside `CoachLayout`. Reads **only**
`coach-tesicheck-checks-v1` via `getCoachPersistentCheck`. Separate wrapper from
Public/Student — shares only the static content
`public/sottocheck-output-preview.html` (`mode=authenticated-public`,
`back=/coach-view/archivio`).

- **Available** — valid record, `owner.context === 'coach'`,
  `owner.id === COACH_VIEW_COACH_ID`, `report.availability === 'available'`,
  `expiresAt` in the future: renders the shared report `<iframe>` + a
  `Conserva il report` box (expiry date + `Scarica report` `.txt`) + a **Coach**
  support box (`Supporto Sottotesi` / `Serve un'escalation sul report?` /
  `Contatta Sottotesi` `mailto:` with a coach-tagged subject). No Student
  "chiedi al tuo Coach" copy.
- **Expired** — valid record but `expiresAt` passed: in-shell state
  `Report non più disponibile` + explicit `…era disponibile fino al {date}` +
  CTA `Vai allo storico TesiCheck` → `/coach-view/archivio`. **No iframe, no
  download, no automatic redirect.**
- **Invalid / missing / wrong owner** — `getCoachPersistentCheck` returns `null`
  or the guard fails: in-shell `Report non disponibile` + `Vai allo storico
  TesiCheck`. Filtered by `owner.id`, so another owner's record cannot surface.

**Local Vite base-URL note:** `CoachReportPage.tsx` reads
`(import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL` via a
`VITE_BASE_URL` module const. The repo has no `vite/client` types, so the
sibling report pages let `import.meta.env` error; this narrow local intersection
keeps the new file at the 47-error `tsc` baseline without touching tsconfig or
globals. Same runtime behaviour.

---

## 7. Known limitations

- **Coach History still mock/disconnected** — `ArchivioPage.tsx` renders
  `mockHistory` (`{id, documentName, pagesSelected, status, createdAt}`), not the
  persistent store. Mounted at both `/coach-view/history` and
  `/coach-view/archivio` (and, separately, `/student-view/archivio` — a known
  smell, out of scope).
- **`Check libero` absent** — no type branch, UI, route, or payment. The model is
  shaped so a discriminated `binding.mode` branch can be added later without
  nullable-field sprawl.
- **Entitlement engine is mock** — `availableCredits > 0` against local seeded
  state; no real Admin-assigned per-path quota.
- **Report content is static** — one shared `sottocheck-output-preview.html`, no
  per-check data / scores.
- **No `File` / `Blob` persistence** — only `document` metadata; `report.reference`
  is a placeholder token.
- **Processing / recovery is session-scoped** — `pendingCheckRef`,
  `hasCreatedCheckRef`, `completedCheck` live only in React state (same as
  `StudentPaidSottocheckPage`). A reload during `processing` / `error` returns to
  the upload form and loses the `sourceExecutionReference`.
- **No browser walkthrough** — build + `tsc` only; `Avvia controllo → report`,
  expired, and invalid states not click-tested.

---

## 8. Next work

- **Coach History** should read `coach-tesicheck-checks-v1` (a read-only
  owner-filtered accessor, mirroring `getPersistentTesiChecksForOwner`), render
  per canonical §19.1 (document, Student, path, `creditsUsed` for this check,
  completed date, explicit expiry, availability, `Apri report` →
  `/coach-view/report/:id`), and adopt `getFileTypeFromName` for the document
  icon. Never show remaining credits. Must **not** reuse
  `public-tesicheck-checks-v1`.
- **`Check libero`** — a later separate slice: discriminated
  `binding.mode = 'check_libero'` (price paid, no Student/path), paid checkout
  reusing the consumer payment boundary, `Check libero` context badge. Do not
  start it inside a Coach-path change.
