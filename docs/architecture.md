# Architettura del Progetto — Sottotesi

## Contesto

Questo progetto nasce dall'unione di due prototipi Figma Make separati:

- **src1** — Dashboard Admin (vista amministratore)
- **src2** — Vista Coach (vista utente con restrizioni)

Oggi il progetto espone **quattro viste** separate: Admin, Coach, Student e Public, piu' una landing pubblica non loggata.

## Tre viste, un unico progetto

### Vista Admin (`/`)

- Layout: `src/app/components/AdminLayout.tsx`
- Navigazione: sidebar con accesso a tutte le sezioni admin
- Pagine: `src/pages/admin/`
- La pagina `/coach` in questa vista è **gestione coach lato admin**, non la vista coach utente
- La route `/lavorazioni` usa `src/pages/admin/ServiziStudentiPage.tsx` come hub operativo unico per:
  - Lavorazioni
  - Compensi Coach
  - Scadenzario

### Vista Coach (`/coach-view`)

- Layout: `src/app/components/coach/CoachLayout.tsx`
- Navigazione: separata, con restrizioni
- Pagine: `src/pages/coach/`
- Accessibile solo tramite URL diretto (non dalla sidebar admin)

### Vista Student (`/student-view`)

- Layout: `src/app/components/student/StudentLayout.tsx`
- Navigazione: separata, con restrizioni
- Componenti custom dedicati:
  - `src/app/components/student/StudentHeader.tsx`
  - `src/app/components/student/StudentSidebar.tsx`
  - `src/app/components/student/StudentLayout.tsx`
- Dashboard e timeline dedicate: `src/pages/student/DashboardPage.tsx`, `src/pages/student/StudentTimelinePage.tsx`
- Pagine contenuto riusabili: `src/pages/coach/` quando serve la stessa UX della coach view
- Accessibile solo tramite URL diretto (non dalla sidebar admin)

### Vista Public (`/public-view`)

- Layout: `src/app/components/public/PublicLayout.tsx`
- Navigazione: separata, focalizzata solo su Sottocheck
- Componenti custom dedicati:
  - `src/app/components/public/PublicHeader.tsx`
  - `src/app/components/public/PublicSidebar.tsx`
  - `src/app/components/public/PublicLayout.tsx`
- Pensata per utenti che usano solo Sottocheck e non hanno un percorso coaching attivo
- Accessibile solo tramite URL diretto (non dalla sidebar admin)

### Landing Public non loggata (`/public`)

- Pagina standalone senza shell loggata
- Pensata come landing commerciale/informativa del servizio Sottocheck
- Include ancore informative e accesso al flusso check pubblico
- Aggiunta in modalita' routing-safe per non impattare le route esistenti

## Struttura cartelle

- Pagine admin: `src/pages/admin/`
- Pagine coach (riusate anche da student-view): `src/pages/coach/`
- Pagine public: `src/pages/public/`
- Componenti admin/shared root: `src/app/components/`
- Componenti esclusivi coach: `src/app/components/coach/`
- Componenti esclusivi student: `src/app/components/student/`
- Componenti esclusivi public: `src/app/components/public/`

## Layout e isolamento

- Vista admin usa solo `AdminLayout`
- Vista coach usa solo `CoachLayout`
- Vista student usa solo `StudentLayout`
- Vista public usa solo `PublicLayout`
- Non fare riferimenti incrociati tra layout di viste diverse

## Regole invarianti

1. Non aggiungere route coach/student alla sidebar admin
2. Non spostare componenti coach in admin e viceversa senza verifica
3. I componenti `Header`, `Sidebar` e `Layout` di student-view devono restare custom e indipendenti
4. I componenti `Header`, `Sidebar` e `Layout` di public-view devono restare custom e indipendenti
5. Le variabili CSS condivise restano in `src/styles/theme.css`

## Route map completa

| Path | Vista | Layout | Note |

| ------ | ------- | -------- | ------ |
| `/` | Admin | AdminLayout | Dashboard admin |
| `/pipelines` | Admin | AdminLayout | Gestione pipeline |
| `/lavorazioni` | Admin | AdminLayout | Hub operativo servizi studenti (`ServiziStudentiPage`) con viste Lavorazioni / Compensi Coach / Scadenzario |
| `/finanza/compensi-coach` | Admin | AdminLayout | Redirect a `/lavorazioni` |
| `/finanza/incassi` | Admin | AdminLayout | Redirect a `/lavorazioni` |
| `/sottocheck/pagamenti-fatture` | Admin | AdminLayout | Gestione pagamenti e fatture Sottocheck |
| `/studenti` | Admin | AdminLayout | Gestione studenti |
| `/documenti` | Admin | AdminLayout | Gestione documenti |
| `/coach` | Admin | AdminLayout | Gestione coach (admin) |
| `/coaching/timeline` | Admin | AdminLayout | Timeline coaching lato admin |
| `/coaching/ticket` | Admin | AdminLayout | Ticket coaching lato admin |
| `/sottocheck/job` | Admin | AdminLayout | Job Sottocheck (coach) lato admin |
| `/aree-tematiche` | Admin | AdminLayout | Gestione aree tematiche |
| `/sottocheck/check` | Admin | AdminLayout | Check Sottocheck lato admin |
| `/sottocheck/output-preview` | Admin | AdminLayout | Anteprima output Sottocheck |
| `/sottocheck/lavorazioni` | Admin | AdminLayout | Lavorazioni Sottocheck |
| `/sottocheck/impostazioni` | Admin | AdminLayout | Impostazioni Sottocheck |
| `/servizi/catalogo` | Admin | AdminLayout | Catalogo servizi |
| `/sistema/kpi` | Admin | AdminLayout | KPI e monitoraggio sistema |
| `/sistema/eventi` | Admin | AdminLayout | Log eventi sistema |
| `/impostazioni/profili` | Admin | AdminLayout | Profili admin |
| `/impostazioni/account` | Admin | AdminLayout | Info account admin |
| `*` | Admin | AdminLayout | Fallback a Dashboard |
| `/coach-view` | Coach | CoachLayout | Vista utente coach — solo URL diretto |
| `/coach-view/studenti` | Coach | CoachLayout | Studenti vista coach |
| `/coach-view/studenti/:studentId` | Coach | CoachLayout | Timeline studente |
| `/coach-view/sottocheck` | Coach | CoachLayout | Sottocheck vista coach |
| `/coach-view/history` | Coach | CoachLayout | Alias cronologia coach (stessa pagina archivio) |
| `/coach-view/archivio` | Coach | CoachLayout | Archivio vista coach |
| `/coach-view/profilo` | Coach | CoachLayout | Profilo coach |
| `/coach-view/*` | Coach | CoachLayout | NotFound coach |
| `/student-view` | Student | StudentLayout | Dashboard student dedicata — solo URL diretto |
| `/student-view/studenti` | Student | StudentLayout | Studenti vista student (riuso pagine coach) |
| `/student-view/studenti/:studentId` | Student | StudentLayout | Timeline studente (riuso pagine coach) |
| `/student-view/sottocheck` | Student | StudentLayout | TesiCheck self-service a pagamento |
| `/student-view/report/:checkId` | Student | StudentLayout | Report TesiCheck autenticato |
| `/student-view/history` | Student | StudentLayout | Cronologia vista student |
| `/student-view/archivio` | Student | StudentLayout | Archivio vista student (riuso pagine coach) |
| `/student-view/profilo` | Student | StudentLayout | Profilo student |
| `/student-view/*` | Student | StudentLayout | NotFound student |
| `/public-view` | Public | PublicLayout | Dashboard public focalizzata su Sottocheck. `PublicLayout` ha un guard prototipale: senza sessione account standalone (`getAccountSession()`) reindirizza a `/public`. Non tocca Student/Coach/Admin |
| `/public-view/sottocheck` | Public | PublicLayout | TesiCheck self-service a pagamento per l'utente standalone autenticato (`PublicPaidSottocheckPage`): upload → titolo → conteggio/prezzo mock → un'unica CTA pagamento → gateway → check persistente `owner.context='standalone'` → `/public-view/report/:checkId`. Nessuno step account (sessione già presente). Sostituisce la vecchia pagina mock |
| `/public-view/report/:checkId` | Public | PublicLayout | Report TesiCheck autenticato |
| `/public-view/history` | Public | PublicLayout | Storico Sottocheck vista public |
| `/public-view/profilo` | Public | PublicLayout | Profilo public |
| `/public-view/*` | Public | PublicLayout | NotFound public |
| `/public` | Public Landing | Standalone | Landing pubblica non loggata. Header CTA `Accedi` / `Registrati` portano alle route dirette qui sotto; con sessione standalone valida diventano un unico `Vai al tuo account` → `/public-view` |
| `/public/login` | Public Landing | Standalone | Accesso standalone diretto (nessun pre-check / checkout) → `/public-view` |
| `/public/register` | Public Landing | Standalone | Registrazione standalone diretta → verifica email prototipo → create/dedupe Pipeline CRM (regola di acquisizione canonica) → `/public-view` |
| `/public/password-recovery` | Public Landing | Standalone | GUI prototipo di recupero password (solo handoff): richiesta email → stato "controlla la tua email". Nessun invio email, nessun token. `?returnTo=` (`/public/login` o `/public/account`) per tornare all'origine |
| `/public/reset-password` | Public Landing | Standalone | GUI prototipo di reset password (solo handoff): nuova password + conferma → stato "password aggiornata". Nessun token/link/backend |
| `/public/account` | Public Landing | Standalone | Checkout standalone: stage `checkout_account` (login/registrazione) → `checkout_verify_email` (verifica OTP) → `checkout_payment` → `redirecting` → `payment_success` |
| `/public/sottocheck` | Public Landing | Standalone | Legacy ritirata: `loader` che reindirizza a `/public`. La UI mock a pagamento non è più raggiungibile |
| `/public/history` | Public Landing | Standalone | Storico pubblico |
| `/public/output-preview` | Public Landing | Standalone | Anteprima output Sottocheck |
| `/public/success` | Public Landing | Standalone | Legacy: `PublicSuccessPage`, non referenziata da alcuna navigazione in-app |
