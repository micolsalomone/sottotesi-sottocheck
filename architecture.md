# Architettura del Progetto — Sottotesi

## Contesto
Questo progetto nasce dall'unione di due prototipi Figma Make separati:
- **src1** — Dashboard Admin (vista amministratore)
- **src2** — Vista Coach (vista utente con restrizioni)

## Due viste, un unico progetto

### Vista Admin (`/`)
- Layout: `src/app/components/AdminLayout.tsx`
- Navigazione: sidebar con accesso a tutte le sezioni
- Pagine: `src/pages/admin/`
- La pagina "Coach" in questa vista (`/coach`) è una schermata di **gestione coach** 
  dal punto di vista amministrativo — NON è la vista coach utente

### Vista Coach (`/coach-view`) ← o il path che scegli
- Layout: `src/app/components/coach/CoachLayout.tsx`
- Navigazione: separata, con restrizioni
- Pagine: `src/pages/coach/`
- Accessibile SOLO tramite URL diretto, NON dalla sidebar admin
- Completamente separata dalla vista admin

## Conflitti noti da risolvere

### 1. Conflitto CoachPage vs Vista Coach
- `src/pages/admin/CoachPage.tsx` → gestione coach lato admin, route `/coach`
- `src/pages/coach/` → vista utente coach, deve stare su path diverso es. `/coach-view`
- **Soluzione:** rinominare la route della vista utente in `/coach-view` 

### 2. Conflitto Container.tsx
Esistono due `Container.tsx` con strutture diverse perché i due prototipi 
partivano da pagine genitore diverse:
- `src/app/components/Container.tsx` → container Admin, con sidebar e header admin
- `src/app/components/coach/Container.tsx` → container Coach, layout ristretto 
- **Soluzione:** NON unirli. Tenerli separati e con nomi distinti:
  - `AdminContainer.tsx` per la vista adminLeggi ARCHITECTURE.md nella root del progetto per capire il contesto completo prima di fare qualsiasi modifica.

Devi aggiornare src/app/routes.tsx seguendo queste regole:

## Struttura file
Le pagine admin si trovano in src/pages/admin/
Le pagine coach si trovano in src/pages/coach/
I componenti admin si trovano in src/app/components/ (root)
I componenti coach si trovano in src/app/components/coach/

## Layout
- Vista admin usa AdminLayout → src/app/components/AdminLayout.tsx
- Vista coach usa CoachLayout → src/app/components/coach/CoachLayout.tsx

## Container (NON unire, NON rinominare gli import interni)
- src/app/components/Container.tsx → esclusivo della vista admin
- src/app/components/coach/Container.tsx → esclusivo della vista coach
Ogni layout usa solo il proprio Container. Non fare riferimento incrociato.

## Route map da implementare
Vista Admin (path base: /)
- Tutte le route admin esistenti rimangono invariate
- Pagine importate da src/pages/admin/

Vista Coach (path base: /coach-view — solo URL diretto, NON dalla sidebar)
- / coach-view → DashboardPage
- /coach-view/studenti → StudentiPage
- /coach-view/studenti/:studentId → StudentTimelinePage
- /coach-view/sottocheck → SottocheckPage
- /coach-view/archivio → ArchivioPage
- /coach-view/* → NotFoundPage
- Pagine importate da src/pages/coach/
- Componenti importati da src/app/components/coach/

## Regole
1. Non toccare le route admin
2. Non unire i due Container.tsx
3. Tutti gli import della vista coach devono usare i path corretti sopra indicati
4. Usa l'alias @ dove possibile per evitare path relativi lunghi
  - `CoachContainer.tsx` per la vista coach

### 3. Import da percorsi assoluti esterni
Alcuni file importano ancora da `/Downloads/STUFF TO MIGRATE/...`
Tutti questi import vanno aggiornati a `@/app/utils/...`
Cerca: "Downloads/STUFF TO MIGRATE" per trovarli tutti.

## Regola generale
- I componenti in `src/app/components/coach/` sono ESCLUSIVI della vista coach
- I componenti in `src/app/components/` (root) sono admin o condivisi
- I componenti in `src/components/ui/` sono condivisi tra entrambe le viste
- NON spostare componenti coach nella cartella admin e viceversa senza verifica

## Route map completa
| Path | Vista | Layout | Note |
|------|-------|--------|------|
| `/` | Admin | AdminLayout | Dashboard admin |
| `/studenti` | Admin | AdminLayout | Gestione studenti |
| `/coach` | Admin | AdminLayout | Gestione coach (admin) |
| `/coach-view` | Coach | CoachLayout | Vista utente coach — solo URL diretto |
| `/coach-view/studenti` | Coach | CoachLayout | Studenti vista coach |
| `/coach-view/sottocheck` | Coach | CoachLayout | Sottocheck vista coach |
| `/coach-view/archivio` | Coach | CoachLayout | Archivio vista coach |