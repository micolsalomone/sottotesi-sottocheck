# Sottotesi

Sottotesi è una web app frontend costruita con React + Vite che unifica tre viste operative in un unico progetto:

- **Admin** (gestione sistema)
- **Coach** (monitoraggio percorso studente)
- **Student** (avanzamento personale nel percorso tesi)

L’architettura separa in modo netto layout, navigazione e responsabilità delle tre viste.

## Obiettivo del progetto

Il progetto nasce dall’unione di tre prototipi e oggi espone tre esperienze distinte:

- vista **amministrativa** per operazioni di controllo e gestione
- vista **coach** per revisione e avanzamento step
- vista **student** per seguire timeline, upload e note

## Viste disponibili

### 1) Admin View

- **Path:** `/`
- **Layout:** `src/app/components/AdminLayout.tsx`
- **Pagine:** `src/pages/admin/`
- **Utente target:** amministratori di sistema
- **Focus UX:** CRUD, stati, azioni correttive; niente complessità non necessaria

Sezioni tipiche: dashboard operativa, utenti, percorsi, documenti, log attività, impostazioni globali.

> Nota: la route `/coach` in Admin è gestione coach lato amministrativo, **non** la coach view utente.

### 2) Coach View

- **Path base:** `/coach-view`
- **Layout:** `src/app/components/coach/CoachLayout.tsx`
- **Pagine:** `src/pages/coach/`
- **Accesso:** solo via URL diretto
- **Utente target:** coach
- **Focus UX:** contesto studente, timeline per step, revisioni documenti, note, check plagio, completamento manuale step

Route principali:

- `/coach-view`
- `/coach-view/studenti`
- `/coach-view/studenti/:studentId`
- `/coach-view/sottocheck`
- `/coach-view/archivio`

### 3) Student View

- **Path base:** `/student-view`
- **Layout:** `src/app/components/student/StudentLayout.tsx`
- **Componenti layout custom:**
  - `src/app/components/student/StudentHeader.tsx`
  - `src/app/components/student/StudentSidebar.tsx`
  - `src/app/components/student/StudentLayout.tsx`
- **Pagine contenuto:** riuso di `src/pages/coach/` (stessa UX base della coach view)
- **Accesso:** solo via URL diretto
- **Utente target:** studenti
- **Focus UX:** timeline chiara, upload documenti, note inline contestuali agli step

Route principali:

- `/student-view`
- `/student-view/studenti`
- `/student-view/studenti/:studentId`
- `/student-view/sottocheck`
- `/student-view/archivio`

## Principi architetturali (invarianti)

- Non aggiungere route coach/student nella sidebar admin.
- Non condividere layout/header/sidebar tra viste diverse.
- Non unire i container delle viste diverse.
- Le variabili CSS condivise stanno in `src/styles/theme.css`.
- I drawer sono strumenti di azione, non fonte di verità dello stato.

Per i dettagli completi:

- `docs/architecture.md`
- `docs/views/admin.md`
- `docs/views/coach.md`
- `docs/views/student.md`

## Struttura essenziale

```text
src/
  app/
    components/
      AdminLayout.tsx
      coach/CoachLayout.tsx
      student/StudentLayout.tsx
    routes.tsx
  pages/
    admin/
    coach/
    student/
  styles/
    theme.css
```

## Stack tecnico

- React 18
- Vite
- React Router
- Tailwind CSS (v4)
- Radix UI + componenti UI condivisi

## Avvio locale

Prerequisiti:

- Node.js 18+
- npm

Comandi:

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Note per lo sviluppo

- Usare alias `@` per gli import (evitare path relativi lunghi).
- Mantenere isolamento tra le viste (Admin, Coach, Student).
- Implementare solo feature richieste esplicitamente (approccio MVP).
