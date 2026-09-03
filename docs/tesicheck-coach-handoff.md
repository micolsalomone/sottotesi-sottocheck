# TesiCheck — Coach Handoff (technical)

> **Not a source of truth.** UX/product source of truth stays
> [tesicheck-canonical-flow.md](./tesicheck-canonical-flow.md) (Coach: §8.4, §11, §12, §19.1).
> This file only records implementation knowledge that would be expensive for a
> new agent to rediscover. Product rules are referenced, not restated.

Sibling doc for the paid consumer flow: [tesicheck-paid-consumer-handoff.md](./tesicheck-paid-consumer-handoff.md).
Coach is a **different entitlement/context domain** — do not copy the consumer
payment architecture into it. The one deliberate exception is the shared paid
**primitives** the free mode reuses (see §9).

---

## 1. Scope implemented

Both Coach modes now exist in the Coach shell.

### Mode A — Path-bound Coach check (`binding.mode: 'coaching_path'`)

Semantics unchanged from the first slice (only the selector it shares with Mode B
changed — see §5):

- Coach selects an active coaching path in the context selector, uploads a
  document, an internal entitlement check gates `Avvia controllo`, a brief
  transient processing state, then exactly one persistent record is written and
  the Coach report opens.
- **Prototype Coach identity shim** — `COACH_VIEW_COACH_ID = 'coach-view-demo'`
  (`src/app/utils/coachView.ts`). The Coach shell has no auth/session; this is
  the single stable id used as `owner.id` for **both** modes.
- **Explicit Giulia → `S-034` binding** — only the eligible coaching path
  (`svc-giulia-verdi`) carries a grounded `studentId` (`'S-034'`). Sara / Luca
  are not grounded and not selectable.
- **`sourceExecutionReference` idempotency** — one token per accepted
  `Avvia controllo`, deduped inside the store. Origin event = the execution
  request, not a payment.
- **Qualitative-only Coach credit UI** — no remaining / total / cumulative-used
  numbers anywhere. `creditsUsed` (this check only) is persisted, not surfaced.
- Coaching quota bookkeeping (`draftUsedCreditsByPath`) is **mock**
  (`availableCredits > 0` against local seeded state).

### Mode B — `Check libero` paid free check (`binding.mode: 'check_libero'`)

- The Coach picks the mode through the **single context selector** — the
  explicit `Check libero a pagamento` option in the `Altro` optgroup of the
  `<select>` in `src/pages/coach/SottocheckPage.tsx` (see §5). There is no
  separate "modalità" selector. The empty placeholder is never a paid choice.
- Free flow: upload → mock character count / price → `SottocheckPricingPreview`
  → `Vai al pagamento` → `SottocheckPaymentGatewayBoundary` (reused unmodified)
  → payment success → transient "Pagamento ricevuto / Stiamo generando il
  report..." → `createCoachFreeCheck(...)` → `/coach-view/report/:checkId`.
- Coach is already authenticated: **no** account / login / registration / email
  verification / account summary / claim, **no** coaching credit UI, **no** path
  selection.
- **`sourcePaymentReference` idempotency** — `createCoachFreePaymentReference()`
  mints a `coach-pay-<ts>-<rand>` token **once** on payment success, held in
  `paymentReferenceRef` for the mounted flow; every materialization attempt
  (initial + StrictMode + recovery retry) passes the same value.
  `createCoachFreeCheck` dedupes by it. Payment is the origin event, so the
  path-bound `sourceExecutionReference` is deliberately **not** reused.
- **Post-payment recovery** — if `createCoachFreeCheck` returns `null` after a
  verified payment, the paid state is kept and a recoverable screen is shown
  (`Non siamo riusciti a generare il report` / `Il pagamento è stato ricevuto.
  Puoi riprovare senza effettuare un nuovo pagamento.` + `Riprova a generare il
  report`). Retry re-runs **only** `createCoachFreeCheck` — never the gateway.
  `?paymentDemo=reportfail` forces one materialization failure (same meaning as
  the consumer flows).
- **Report + History** serve both modes off the single existing route / page.

### Still mock / not real

- Real entitlement/quota engine — the path-bound availability gate is mock.
- Real payment — `SottocheckPaymentGatewayBoundary` is simulated (1500 ms
  auto-success in normal mode; `?paymentDemo=1` for manual outcomes).
- Real report data — one shared static `sottocheck-output-preview.html`.
- `File` / `Blob` persistence — only `document` metadata; `report.reference` is a
  placeholder token.

---

## 2. Persistent model

`src/app/data/tesicheckCoachCheck.ts`, storage key **`coach-tesicheck-checks-v1`**
(single array, newest first, **mixed** record shapes).

```ts
type CoachPersistentCheck = CoachPathBoundCheck | CoachFreeCheck;

interface CoachPathBoundCheck {          // unchanged
  id: string;                            // `COA-CHK-<last 8 of Date.now()>`
  owner: { context: 'coach'; id: string };
  binding: {
    mode: 'coaching_path';
    studentId: string;                   // grounded STUDENTS_DATA id, e.g. 'S-034'
    studentName: string;
    pathId: string;                      // prototype-local opaque, e.g. 'svc-giulia-verdi'
    pathLabel: string;
  };
  document: UploadedDocument;            // { name, size, format } — no File/Blob
  creditsUsed: number;                   // = MOCK_CREDIT_COST_PER_CHECK (8), THIS check only
  status: 'completed';
  createdAt: string; completedAt: string; expiresAt: string;   // expiresAt = completedAt + 30d
  report: { availability: 'available'; reference: string };
  sourceExecutionReference: string;      // `coach-exec-<ts>-<rand>`
}

interface CoachFreeCheck {
  id: string;                            // `COA-CHK-<last 8 of Date.now()>`
  owner: { context: 'coach'; id: string };
  binding: { mode: 'check_libero' };     // discriminator only — NO student, NO path
  document: UploadedDocument;
  characterCount: number;                // mock (28500)
  price: number;                         // mock (14.9) — price paid
  payment: { status: 'paid'; reference: string };   // reference = `PAY-<...>`
  status: 'completed';
  createdAt: string; completedAt: string; expiresAt: string;   // expiresAt = completedAt + 30d
  report: { availability: 'available'; reference: string };
  sourcePaymentReference: string;        // `coach-pay-<ts>-<rand>`
}
```

`CoachFreeCheck` deliberately has **no** `studentId` / `studentName` / `pathId` /
`pathLabel` / `creditsUsed` / quota field — they are absent, not nullable.

Accessors:

- `getCoachPersistentCheck(id)` → `CoachPersistentCheck | null` (runs the union guard).
- `getCoachPersistentChecksForOwner(coachId)` → `CoachPersistentCheck[]`, exact
  `owner.id`, newest `completedAt` first, no expiry mutation. Read by History.
- `createCoachPathBoundCheck({...})` → `CoachPathBoundCheck | null`. **Unchanged.**
  Dedupes by `sourceExecutionReference`.
- `createCoachFreeCheck({ coachId, document, characterCount, price, sourcePaymentReference })`
  → `CoachFreeCheck | null`. Dedupes by `sourcePaymentReference`. `null` = storage
  write failed.
- `createCoachExecutionReference()` → `coach-exec-<ts>-<rand>` (path-bound).
- `createCoachFreePaymentReference()` → `coach-pay-<ts>-<rand>` (free).
- Guards, all exported: `isCoachPathBoundCheck` (type predicate, **semantics
  unchanged** — same field checks, now takes the union and early-returns on
  `binding.mode !== 'coaching_path'`), `isCoachFreeCheck` (type predicate),
  `isCoachPersistentCheck` (`boolean`, either shape).

**Retention:** `expiresAt = completedAt + 30 days`, `RETENTION_DAYS = 30` local
const, computed inline in both creators. Still not shared with the consumer store.

**Excluded by design (both shapes):** quota total, remaining credits, cumulative
used credits. **Path-bound only:** `price`, `payment`. **Free only:** `creditsUsed`.

**TS narrowing note.** The union discriminant is nested (`binding.mode`). Pages
must branch with the exported `isCoachFreeCheck(check)` type guard (or
`isCoachPathBoundCheck`), **not** a bare `check.binding.mode === '…'` inline
check, so `check.price` / `check.creditsUsed` (props on the outer object) narrow
correctly.

---

## 3. Identity limitations

- **`COACH_VIEW_COACH_ID = 'coach-view-demo'`** is a prototype shim, used as
  `owner.id` for both modes. Production must replace it with the real
  authenticated Coach id.
- **Only Giulia Verdi / `S-034` is grounded** (path-bound only). Free checks have
  no Student at all.
- **`svc-giulia-verdi` is prototype-local**, defined only in
  `src/pages/coach/SottocheckPage.tsx`; not joined to `LavorazioniContext`.

---

## 4. Credit semantics (path-bound only)

| Datum | Where | Shown to Coach? | Persisted? |
| --- | --- | --- | --- |
| `creditsUsed` (this check) | `CoachPathBoundCheck.creditsUsed` = `MOCK_CREDIT_COST_PER_CHECK` (8) | History only (`Crediti usati: X`), single-check figure per canonical §19.1 | **Yes** |
| `MAX_FREE_CHECK_CREDITS` (100) — quota total | local const | **No** | No |
| `draftUsedCreditsByPath` — cumulative used | local mock state; a context change never touches it | **No** | No |
| `availableCredits` (`MAX − draftUsed`) — remaining | derived, feeds `canStartPathCheck` only | **No** | No |

Qualitative gate copy unchanged: `Percorso non selezionato` / `Disponibile` /
`Non sufficiente`. The **free** mode shows none of this — it shows a price.

---

## 5. Page structure — `src/pages/coach/SottocheckPage.tsx`

**One component, one context selector.** There is no separate "modalità"
selector, no segmented control, no tabs. `SottocheckPage` holds all state and
branches on `contextValue`.

### The context selector

A native `<select aria-label="Percorso del check">` inside step card 1
("Contesto del check"):

```
'' (placeholder)   "Seleziona un percorso o fai un Check libero…"   — non-actionable
<optgroup "Percorsi coaching">
  <option value="svc-giulia-verdi">Giulia Verdi — Timeline Tesi Magistrale</option>
  …grounded path ids only (planType === 'coaching')
<optgroup "Altro">
  <option value="check_libero">Check libero a pagamento</option>   — explicit paid choice
```

`FREE_CHECK_CONTEXT = 'check_libero'` is an explicit sentinel. `check_libero` is
**never** derived from `''`. Display strings are never used as ids. A short
neutral notice sits in the step-card description ("Seleziona un percorso per
utilizzare i crediti TesiCheck associati. Per un documento non legato a uno
studente o percorso, scegli Check libero a pagamento.").

### State

- **Shared, context-agnostic — preserved across every context change:**
  `document`, `documentStatus`, `pagesSelected`.
- **Path-bound transient:** `pathCheckStatus` (`created`/`processing`/`error`),
  `pathCompletedCheck`, `draftUsedCreditsByPath`, `pendingPathCheckRef`,
  `hasCreatedPathCheckRef`.
- **Free transient:** `isPricing`, `quote`, `freeStage` (`form`/`payment`/
  `redirecting`), `paymentNotice`, `freeIsProcessing`, `freeCompletionError`,
  `freeCompletedCheck`, `pricingTimerRef`, `hasCreatedFreeCheckRef`,
  `paymentReferenceRef`, `reportFailDemoRef`.

### `handleContextChange(nextValue)` — reset ONLY the other mode

On **any** context change it clears **both** the free payment/materialization
state (`quote`, `isPricing`, `paymentNotice`, `freeStage='form'`,
`freeIsProcessing`, `freeCompletionError`, `freeCompletedCheck`,
`hasCreatedFreeCheckRef`, `paymentReferenceRef`, `reportFailDemoRef`) **and** the
pending path binding (`pendingPathCheckRef`, `hasCreatedPathCheckRef`,
`pathCheckStatus='created'`, `pathCompletedCheck`). It never touches `document`,
`documentStatus`, `pagesSelected`, or `draftUsedCreditsByPath`. If the new
context is `check_libero` **and** a document is already valid, it re-runs
`startPricing()` so the quote is derived from the existing document — no
re-upload.

Net effect:

| Switch | Cleared | Preserved |
| --- | --- | --- |
| any → PATH | `quote` / `isPricing` / `paymentNotice` / `freeStage` / `freeIsProcessing` / `freeCompletionError` / `freeCompletedCheck` / `paymentReferenceRef` / `hasCreatedFreeCheckRef` / `reportFailDemoRef`; `pendingPathCheckRef` / `hasCreatedPathCheckRef` / `pathCheckStatus` / `pathCompletedCheck` | `document`, `documentStatus`, `pagesSelected`, `draftUsedCreditsByPath` |
| any → FREE | same list (quote re-derived from the existing document if valid) | `document`, `documentStatus`, `pagesSelected`, `draftUsedCreditsByPath` |
| any → `''` | same list | `document`, `documentStatus`, `pagesSelected`, `draftUsedCreditsByPath` |

A free check can never inherit Student / path / credits; a path-bound check can
never inherit price / payment state. `''` is never treated as a paid choice — no
check or payment action is reachable until a context is explicitly chosen.

### Snapshot only on action

`pendingPathCheckRef` (Student + path + document + `sourceExecutionReference`) is
written **only** inside `handleStartPathCheck`, on an accepted `Avvia controllo`
— never when the `<select>` changes. The free flow has no Student/path snapshot
at all.

### Step hierarchy

1. **Contesto del check** — the `<select>` + notice + a per-context detail box.
2. **Carica documento** — `SottocheckUploadForm`, **never keyed** (so the file
   survives context changes).
3. Dynamic completion card:
   - `''` → neutral hint, no action.
   - path → **Conferma e avvia controllo** (qualitative credit box + `Avvia
     controllo`).
   - free → **Conferma e pagamento** (`SottocheckPricingPreview` + `Vai al
     pagamento`); `freeStage='payment'` swaps in `CoachFreePaymentPanel`;
     `freeStage='redirecting'` swaps in the gateway card (steps hidden).

`processing` / `error` (path) and `freeIsProcessing` / `freeCompletionError`
(free) are still full-page early returns.

Coach-facing selector/help copy uses **percorso**, not "lavorazione/timeline"
(internal type/id names unchanged).

---

## 6. Free-mode journey

```
/coach-view/sottocheck   (context = 'check_libero'; Coach already authenticated)
  → upload PDF/DOCX (SottocheckUploadForm — the only real validator; never keyed)
  → 700 ms mock pricing → quote { characterCount: 28500, price: 14.9 }
       (also re-run by handleContextChange when switching INTO check_libero with a valid doc)
  → SottocheckPricingPreview + "Vai al pagamento"      freeStage: form → payment
  → CoachFreePaymentPanel ("Completa il pagamento" + doc + count·price)
       "Vai al pagamento"                              freeStage: payment → redirecting
  → SottocheckPaymentGatewayBoundary (in a Coach card; boundary unmodified)
       normal mode: auto onSuccess after 1500 ms
       ?paymentDemo=1: manual Esito positivo | negativo | Annullato
       onFailed   → paymentNotice='failed'    → freeStage=payment (doc/quote kept)
       onCancelled→ paymentNotice='cancelled' → freeStage=payment (doc/quote kept)
       onSuccess  → mint paymentReferenceRef once → freeIsProcessing = true
  → transient "Pagamento ricevuto / Stiamo generando il report..."
  → effect: createCoachFreeCheck({ coachId, document, characterCount, price, sourcePaymentReference })
       success → setFreeCompletedCheck → setTimeout 900 ms → navigate('/coach-view/report/COA-CHK-XXXXXXXX')
       null    → hasCreatedFreeCheckRef reset, freeCompletionError = true, freeIsProcessing = false
  → freeCompletionError screen → "Riprova a generare il report"
       → handleRetryFreeReportCreation: createCoachFreeCheck(...) ONLY (same sourcePaymentReference)
```

**Idempotency lifecycle:** `paymentReferenceRef` is set once in `onSuccess` and
never re-minted (and cleared on any context change). StrictMode double-invoke is
covered by `hasCreatedFreeCheckRef` + the `sourcePaymentReference` dedupe inside
`createCoachFreeCheck`. A recovery retry reuses the same reference, so an
already-written record is returned rather than duplicated.

---

## 7. Report — `/coach-view/report/:checkId`

`src/pages/coach/CoachReportPage.tsx`, inside `CoachLayout`. **One route, both
modes.** Reads `getCoachPersistentCheck` (union). Ownership / availability /
expiry semantics **unchanged** — the guard checks `owner.context === 'coach'`,
`owner.id === COACH_VIEW_COACH_ID`, `status === 'completed'`,
`report.availability === 'available'`, valid dates; it does **not** assert
`binding.mode`.

Mode-specific branch (via `isCoachFreeCheck(check)`):

- `coaching_path` — header subtitle `document · studentName · pathLabel`;
  download `.txt` includes `Studente:` / `Percorso:`. Unchanged.
- `check_libero` — header shows a `CoachCheckLiberoBadge` next to the title and
  subtitle `document · €14,90`; download `.txt` includes `Tipo: Check libero` /
  `Prezzo pagato: €14,90` and **never** a Student/Percorso line.

Everything else (expired state, invalid state, `Conserva il report` box, Coach
support box, report `<iframe>` content) is shared and unchanged.

`CoachReportPage.tsx` still reads `import.meta.env.BASE_URL` via the narrow local
`VITE_BASE_URL` intersection (repo has no `vite/client` types) — unchanged.

---

## 8. History — `/coach-view/history` + `/coach-view/archivio`

`src/pages/coach/CoachHistoryPage.tsx`. Reads `getCoachPersistentChecksForOwner`
(union), exact Coach `owner.id`. Common grammar for every row: format icon +
document name, `Completato il …`, explicit expiry (`Disponibile fino al …` /
`Scaduto il …`), availability badge via `SottocheckHistoryStatusBadge`
(`completed` / `expired` only), `Apri report` while available, no action element
when expired.

Mode-specific context lines (via `isCoachFreeCheck(check)`):

- `coaching_path` — `studentName · pathLabel` + `Crediti usati: {creditsUsed}`.
  Unchanged.
- `check_libero` — `<CoachCheckLiberoBadge />` + `Prezzo pagato: €14,90`. No
  Student, no path, no credits.

`Check libero` is **not** routed through `SottocheckHistoryStatusBadge` — it is a
context/type marker, see §10. Empty-state copy generalised for both record types.

---

## 9. Shared vs intentionally separate

**Reused from the consumer paid flow, unmodified:**

- `SottocheckUploadForm` — validator (both Coach modes already used it).
- `SottocheckPricingPreview` — pricing/character-count display (free mode).
- `SottocheckPaymentGatewayBoundary` — the gateway boundary + `?paymentDemo=1` /
  `?paymentDemo=reportfail` behaviour. **No Coach-specific gateway component.**
- `formatCheckoutPrice()` — every Coach free-check amount renders `€14,90`.

**New, Coach-only:**

- `CoachFreeCheck` shape + `createCoachFreeCheck` + `createCoachFreePaymentReference`
  + `isCoachFreeCheck` / `isCoachPersistentCheck` (`tesicheckCoachCheck.ts`).
- `src/app/components/CoachCheckLiberoBadge.tsx` — the `Check libero` context
  marker, used by History **and** the report header (reuse demonstrated).

**Deliberately NOT reused:** guest account/login/register, email verification,
`tesicheckAccountSession.ts` / `DEMO_ACCOUNT_ID`, `tesicheckPrecheckSession.ts`
(pre-check session + `flowStage` machine), the consumer store
`tesicheckPersistentCheck.ts` / `public-tesicheck-checks-v1` /
`getPersistentTesiChecksForOwner`, `PersistentTesiCheck.owner.context`.

---

## 10. `Check libero` visual treatment

`CoachCheckLiberoBadge` — an `inline-flex` span: `1px` `--border`, `--background`
fill, `--muted-foreground` text, `--radius-badge`, 11px uppercase, **no icon**,
**no** success/warning colour. Restrained and neutral so it distinguishes the
record without competing with the `Completato` / `Scaduto` status badges (which
keep their own colours and carry icons). It is a context/type label, never an
availability status.

---

## 11. Known limitations

- **Free-mode recovery is session-scoped** — `paymentReferenceRef`,
  `hasCreatedFreeCheckRef`, `freeCompletedCheck`, `quote`, `document`,
  `contextValue` live only in React state (no `sessionStorage` / `localStorage`),
  same as `StudentPaidSottocheckPage`. A full reload during `redirecting` /
  `processing` / `freeCompletionError` returns to the empty context selector and
  loses the `sourcePaymentReference`.
- **Pricing is mock and the arithmetic is still inconsistent** — `28500` /
  `14.9` are local consts in `SottocheckPage.tsx` (a third copy of the values
  already duplicated in `PublicLandingPage` / `StudentPaidSottocheckPage`; no
  shared pricing module was introduced). `SottocheckPricingPreview` still shows
  `EUR 0,52/1000cc` (→ 14.82 for 28 500 cc) which does not reconcile with
  `€14,90`. Left open on purpose — needs a product decision on the real rate.
- **Entitlement engine is still mock** (path-bound).
- **Report content is static** — one shared `sottocheck-output-preview.html`, no
  per-check data / scores / real price rendering inside the iframe.
- **No `File` / `Blob` persistence** — `document` metadata only.
- **No browser walkthrough** — `npm run build` + `tsc` only; `Vai al pagamento →
  report`, `?paymentDemo=1` failed/cancelled, `?paymentDemo=reportfail` recovery,
  mode switching, and the History/report free branch were not click-tested.
- **`id` collision window** — both creators build `id` from
  `Date.now().toString().slice(-8)`; two checks materialized in the same
  millisecond would collide. Negligible for the prototype, unchanged from the
  path-bound slice.

---

## 12. Next work

- Real payment integration + server-side verification for the free mode (client
  is not source of truth).
- Real per-path Admin-assigned entitlement for the path-bound mode.
- Resolve the pricing rate/total inconsistency (product decision).
- Persist the in-flight free checkout (survive reload) if product wants it.
- Optional future link between a Coach paid free check and a coaching path
  (canonical §30.5) — a separate decision, not started.
