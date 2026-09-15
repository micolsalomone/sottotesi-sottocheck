# Vista Coach — Guidelines

## A chi è rivolta
Coach che seguono studenti nel percorso tesi. Accesso solo via URL diretto.

## Path
`/coach-view` — Layout: `src/app/components/coach/CoachLayout.tsx`
Pagine: `src/pages/coach/`

## Scopo
Il coach controlla il completamento degli step, revisiona documenti,
aggiunge note. Solo il coach può marcare uno step come completato.
Il check plagio/TesiCheck è un prodotto indipendente (`/coach-view/sottocheck`),
non un'azione, uno stato o un contatore della Timeline.

## Principi
- MVP, preferire riuso di pattern dalla Student Dashboard
- Nessuna complessità admin-level
- Il coach è sempre nel contesto di uno studente specifico
- Nessuna lista globale studenti in stile admin

## Timeline
- Struttura verticale per step (uguale a student view)
- Step corrente sempre evidenziato
- Step = thread contestuale (documenti + note + revisioni)
- Non separare activity log in sezione separata

### Sidebar Timeline — Dati accademici e Contatti studente

- `Dati accademici`: proiezione read-only del record accademico **corrente**
  dello Student (`Livello di laurea`, `Corso di laurea`, `Università`,
  `Tipologia`, `Professore`, `Materia`, `Argomento`) — stesso vocabolario
  canonico di Profilo e Admin. Nessuna modifica da Timeline.
- `Contatti studente`: contatti primari dello Student (telefono/WhatsApp,
  email) dal record `Student` strutturato — non i contatti del Coach stesso.
  Contratto dati: record Student corrente → contatto primario telefono/email →
  Timeline lo mostra in sola lettura. Nessun contatto secondario dello
  Student, nessuna gestione contatti da qui: resta Admin-managed
  (`ContactManager` in `/lavorazioni`).

## Azioni disponibili per step
- Leggi / scarica documenti
- Carica documenti revisionati
- Aggiungi note (asincrone, non chat)
- Marca step come completato (esplicito e manuale)

## Navigazione
- Topbar: ruolo coach + contesto studente corrente
- Accesso a profilo studente (drawer o vista secondaria)
- ❌ Nessuna azione admin-only esposta

## Identità Coach (self-service) — solo prototipo, non un contratto

- Il Coach self-service non ha auth/sessione nel prototipo. L'identità
  visualizzata in header/Profilo/Account viene da `CoachViewProfileContext`
  (`src/app/components/coach/CoachViewProfileContext.tsx`), una fixture
  leggera **locale a `CoachLayout`** — NON il record Coach di Admin `/coach`
  (`CoachPage.tsx`, che mantiene la propria lista mock locale invariata).
  Le due superfici non sono sincronizzate: modificare Profilo/Account Coach
  non cambia Admin, e viceversa. Questa separazione è intenzionale — il
  dominio Coach reale/backend è responsabilità di production, non di questo
  prototipo UX (vedi `docs/production-handoff.md` → "Coach Profile/Account").
- `coachView.ts` espone `COACH_VIEW_COACH_ID` (`'coach-view-demo'`), shim di
  sola OWNERSHIP per l'`owner.id` dei check TesiCheck
  (`tesicheckCoachCheck.ts`) — non un'identità CRM, non collegato alla
  fixture Profilo/Account.
- I valori seed della fixture (`Martina Rossi`, email, telefono, aree)
  corrispondono visivamente al mock Admin `C-07` solo per coerenza tra le
  due superfici prototipali indipendenti — non è un binding vivo. Non
  esiste alcuna sincronizzazione runtime Admin↔Coach in questo prototipo:
  `AreeTematicheProvider` resta montato solo dentro `AdminLayout.tsx`,
  come prima di questo workstream.

## Profilo (`/coach-view/profilo`)

- Titolo pagina `Profilo coach` (esplicito sul ruolo); l'etichetta di
  navigazione in sidebar resta `Profilo`.
- Sezione `Informazioni personali`: Nome, Cognome. La fixture persiste solo
  `fullName`; Nome/Cognome sono derivati/ricomposti solo per l'editing.
  Azione `Salva modifiche` **dentro la card**, footer allineato a destra,
  visibile solo quando Nome/Cognome differiscono dal valore persistito
  (nessun autosave); al salvataggio: aggiorna la fixture, toast, il bottone
  torna a sparire (modulo pulito).
- Sezione `Aree tematiche di specializzazione` — **sola lettura**: legge
  `profile.areas`, dati fixture rappresentativi in `CoachViewProfileContext`
  (`['Area Umanistica', 'Scienze Politiche']`) — NON una lettura live di
  `AreeTematicheContext`/Admin, nessuna sincronizzazione runtime. Nessuna
  copia dei dati Admin, nessun multiselect, nessun controllo add/remove;
  l'unica superficie di assegnazione resta Admin `/coach`. Tag neutri per
  aree multiple; stato vuoto `Nessuna area tematica associata.`; helper `Le
  aree tematiche sono gestite da Sottotesi.`. `Salva modifiche` si applica
  solo alle informazioni personali, mai a questa sezione.
- Non contiene: email, telefono, disponibilità, stato, data attivazione,
  `payment_reference`, note, audit — tutti Admin/operations-only o spostati
  su Account.

## Account (`/coach-view/account`)

- Sezioni: `Accesso` (email + `Modifica email` + `Gestisci password`),
  `Recapiti` (telefono, `Salva numero` esplicito).
- Nessun controllo di consenso commerciale: la fixture Coach non modella
  alcun campo di consenso (a differenza di Student/Public).
- Nessuna riga di stato legale (Termini/Privacy): non esiste un'assunzione
  di ciclo di vita account Coach grounded, quindi non viene affermata.
- `Modifica email` riusa lo stesso `ChangeEmailModal` condiviso
  (riautenticazione → nuova email → verifica), senza controllo di
  collisione (nessun registry Coach).
- Le modifiche a email e telefono scrivono sulla fixture Coach-view locale
  (`email`/`phone`, stringhe piatte) — nessun modello di contatti
  strutturati e nessuna sincronizzazione con Admin `/coach` in questo
  prototipo.
- **Telefono — SOLO recapito primario.** Regola di prodotto: Admin può
  gestire più numeri Coach; il self-service espone e modifica **solo** il
  recapito operativo primario — mai un elenco, mai più contatti. Etichetta
  `Telefono di contatto / WhatsApp`; helper `Questo recapito può essere
  condiviso con gli studenti assegnati per le comunicazioni relative al
  loro percorso.` (copy scelta perché i coach usano spesso il proprio
  telefono di lavoro direttamente con gli studenti assegnati, più
  appropriata di una copy generica "assistenza/servizio"). Nessun controllo
  di consenso commerciale, nessun toggle "condividi con gli studenti",
  nessun campo telefono aggiuntivo, nessuna impostazione di visibilità:
  la condivisione con gli studenti assegnati segue regole di
  prodotto/business già esistenti, non modellate qui. Salvare qui aggiorna
  **solo** il recapito primario — non implica che eventuali altri numeri
  gestiti da Admin vengano eliminati o sostituiti; quei contatti restano
  Admin-managed e fuori dalla portata del self-service. Production deve
  legare questo campo al recapito/contatto primario Coach già esistente nel
  proprio dominio — questo prototipo non prescrive l'implementazione
  backend.

## Regole di isolamento
- Non condividere CoachLayout con altre viste
- Non esporre azioni admin nel topbar coach