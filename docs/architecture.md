# Architettura del Progetto — Sottotesi

## Contesto
Questo progetto nasce dall'unione di due prototipi Figma Make separati:
- **src1** — Dashboard Admin (vista amministratore)
- **src2** — Vista Coach (vista utente con restrizioni)

Oggi il progetto espone **tre viste** separate: Admin, Coach e Student.

## Tre viste, un unico progetto

### Vista Admin (`/`)
- Layout: `src/app/components/AdminLayout.tsx`
- Navigazione: sidebar con accesso a tutte le sezioni admin
- Pagine: `src/pages/admin/`
- La pagina `/coach` in questa vista è **gestione coach lato admin**, non la vista coach utente

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
- Per ora le pagine contenuto sono condivise con `src/pages/coach/` (stessa UX della coach view)
- Accessibile solo tramite URL diretto (non dalla sidebar admin)

## Struttura cartelle
- Pagine admin: `src/pages/admin/`
- Pagine coach (riusate anche da student-view): `src/pages/coach/`
- Componenti admin/shared root: `src/app/components/`
- Componenti esclusivi coach: `src/app/components/coach/`
- Componenti esclusivi student: `src/app/components/student/`

## Layout e isolamento
- Vista admin usa solo `AdminLayout`
- Vista coach usa solo `CoachLayout`
- Vista student usa solo `StudentLayout`
- Non fare riferimenti incrociati tra layout di viste diverse

## Regole invarianti
1. Non aggiungere route coach/student alla sidebar admin
2. Non spostare componenti coach in admin e viceversa senza verifica
3. I componenti `Header`, `Sidebar` e `Layout` di student-view devono restare custom e indipendenti
4. Le variabili CSS condivise restano in `src/styles/theme.css`

## Route map completa
| Path | Vista | Layout | Note |
|------|-------|--------|------|
| `/` | Admin | AdminLayout | Dashboard admin |
| `/studenti` | Admin | AdminLayout | Gestione studenti |
| `/coach` | Admin | AdminLayout | Gestione coach (admin) |
| `/coach-view` | Coach | CoachLayout | Vista utente coach — solo URL diretto |
| `/coach-view/studenti` | Coach | CoachLayout | Studenti vista coach |
| `/coach-view/studenti/:studentId` | Coach | CoachLayout | Timeline studente |
| `/coach-view/sottocheck` | Coach | CoachLayout | Sottocheck vista coach |
| `/coach-view/archivio` | Coach | CoachLayout | Archivio vista coach |
| `/coach-view/*` | Coach | CoachLayout | NotFound coach |
| `/student-view` | Student | StudentLayout | Vista utente student — solo URL diretto |
| `/student-view/studenti` | Student | StudentLayout | Studenti vista student (riuso pagine coach) |
| `/student-view/studenti/:studentId` | Student | StudentLayout | Timeline studente (riuso pagine coach) |
| `/student-view/sottocheck` | Student | StudentLayout | Sottocheck vista student (riuso pagine coach) |
| `/student-view/archivio` | Student | StudentLayout | Archivio vista student (riuso pagine coach) |
| `/student-view/*` | Student | StudentLayout | NotFound student |