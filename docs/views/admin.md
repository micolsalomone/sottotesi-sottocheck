# Vista Admin — Guidelines

## A chi è rivolta
Amministratori del sistema. Uso sporadico, operativo, correttivo.

## Path
`/` — Layout: `src/app/components/AdminLayout.tsx`

## Scopo
Controllare che il sistema funzioni, gestire utenti/ruoli/stati.
NON è una dashboard analitica. NON duplica funzioni coach/student.

## Principi (non negoziabili)
- MVP vero: niente feature speculative
- CRUD first: liste, stati, azioni chiare
- Una schermata = una responsabilità
- Se togli una feature e nessuno se ne accorge → era giusto non metterla

## Criterio per ogni elemento UI
Serve a correggere / abilitare / disabilitare / rimuovere?
→ Sì: mostralo. No: non mostrarlo.

## Struttura navigazione (sidebar)
1. Dashboard — stato del sistema, card semplici, nessun grafico
2. Utenti — tabella con Nome, Ruolo, Stato, Ultima attività, Azioni
3. Percorsi — lista con stato, coach assegnati, numero studenti
4. Documenti — tabella con moderazione (rimuovi/nascondi/scarica)
5. Attività / Log — audit cronologico, filtri base
6. Impostazioni — solo sistemiche (ruoli, permessi globali)

## Tono microcopy
Diretto, neutro, operativo. Es: "Disattiva utente", "Percorso archiviato".
❌ No linguaggio empatico. ❌ No CTA motivazionali.

## Componenti condivisi rilevanti
- `DrawerPrimitives.tsx` — usare sempre per nuovi drawer, mai ridefinire stili inline
- Animazioni drawer: definite in `dashboard.css`, non ridefinirle

## Consenso comunicazioni commerciali — visibilità Admin (Slice D)

Vocabolario di visualizzazione **condiviso** (`src/app/data/marketingConsent.ts`):
`Consentito` / `Non consentito` / `Non richiesto`. Reso con `StatusPill`
neutro + testo esplicito — mai il verde brand come "success" generico.
`Non richiesto` (stato sconosciuto / mai raccolto) non va mai collassato in
`Non consentito`.

Il consenso commerciale è **per contatto / per email** in entrambi i domini
(Pipeline e Student). Non è più un valore globale di persona. Storage ed editing
restano comunque **distinti** tra Pipeline e Student:

### Pipeline — consenso per contatto + sintesi persona derivata

- `Pipeline.marketing_consents: Record<string, boolean>` — un valore per
  contatto (email / telefono). Chiave assente = `Non richiesto`, `true` =
  `Consentito`, `false` = `Non consentito`.
- `CreatePipelineDrawer` e `PipelineDetailDrawer` **restano superfici di editing**
  per-contatto, con un controllo **tri-state esplicito** (`select`
  `Non richiesto` / `Consentito` / `Non consentito` — `MarketingConsentSelect`
  condiviso), non più un checkbox binario.
  - `Consentito` → chiave `= true`; `Non consentito` → chiave `= false`;
    `Non richiesto` → **rimuove** la chiave dal map (riporta lo stato a
    sconosciuto: è l'unico caso legittimo di cancellazione della chiave — non
    rappresenta un "no" esplicito).
  - **Nessun auto-save.** Il controllo si integra nel pattern di editing
    esistente di ciascun drawer, **senza modificarne l'architettura**:
    `PipelineDetailDrawer` mantiene il suo pattern per-campo (click/matita →
    editor → Save inline); la riga consenso è ora `click → select tri-state →
    Save inline` (`saveConsent`, lo stesso meccanismo di persistenza per-campo
    già usato dal drawer). `CreatePipelineDrawer` mantiene `click → select →
    conferma`; la persistenza è la sua azione "Crea". Nessun footer `Salva
    modifiche` globale introdotto, nessun bottone Save inline rimosso.
  - Salvare non altera chiavi di contatti non toccati. Nessun toggle globale Pipeline.
- La **sintesi persona** (`Ricontatto consentito` / `Ricontatto non consentito` /
  `Consenso non richiesto`) è derivata sui **contatti correnti**: qualsiasi
  `true` → consentito; altrimenti qualsiasi `false` → non consentito; altrimenti
  non richiesto. Risponde a "esiste un canale su cui è permesso ricontattare?",
  **non** "tutti i canali sono permessi". Il dettaglio per-contatto resta
  autoritativo su QUALE canale. Mostrata nel drawer (riga `Ricontatto
  commerciale`) e come pill compatto nella list/card `/pipelines` (vicino ai
  `sources`, desktop + mobile). Nessuna nuova colonna, nessun filtro consenso.

### Student — consenso per email

- `Student.contacts.emails[].marketing_consent?: boolean | null` — un valore
  tri-state **per ogni email** dello studente: `true` = Consentito, `false` =
  Non consentito, `null` / assente = Non richiesto. Il consenso appartiene al
  canale email, indipendente da `purposes` e dall'accesso ai servizi.
- Il vecchio valore globale `Student.marketing_consent` è **deprecato**: nessuna
  UI / lettura / scrittura canonica lo usa più. `migrateLegacyStudentConsent`
  (in `LavorazioniContext.tsx`) sposta un eventuale valore globale dei seed
  sulla **sola email primaria** al caricamento del modulo; uno Student senza
  email primaria non riceve alcun consenso per email (limite documentato — un
  valore globale non è attribuibile in sicurezza a tutte le email).
- **Il drawer Student non è più una superficie di gestione accessi.** In
  `CreateStudentDrawer` la sezione contatti (`ContactManager`, `mode='student'`)
  mostra **solo dati di contatto**: email principale/aggiuntive, telefono
  principale/aggiuntivi, `Imposta principale`, add/edit/remove. Sono rimossi
  dalla UI Student: badge/pulsante `Accesso servizi`, checkbox/controlli
  `service_access`, e la UI grezza di `purposes` (`Comunicazioni` = flag
  `purposes.generic`, metadata di routing, non consenso). I campi del modello
  **non** sono toccati; Coach mantiene la sua UI. La migrazione contatti del
  drawer è ora **non lossy** (preserva tutti i purpose validi): salvare il drawer
  non altera `purposes` / accesso ai servizi.
- **Superficie autoritativa per l'accesso ai servizi = `TimelineDrawer`**
  (`/coaching/timeline`, `src/app/components/TimelineDrawer.tsx`), sezione
  `Accesso al servizio`. Scrive `StudentService.coaching_access_enabled` +
  `invite_status` / `invite_email` / `invite_sent_at` (via `updateService`) e
  imposta `service_access` sull'email di invito selezionata rimuovendolo dalle
  altre (radio, via `updateStudent`). Pipeline/Lavorazione non espongono un
  controllo di gestione accessi concorrente (impostano solo un default
  `service_access` sull'email primaria alla conversione Pipeline→Student).
- **Controllo `Comunicazioni commerciali` dentro OGNI card email** di
  `ContactManager` (`mode='student'`): un `MarketingConsentSelect` tri-state
  compatto (`Non richiesto` / `Consentito` / `Non consentito`) sotto l'indirizzo,
  nella card dell'email primaria e in quelle aggiuntive. La card email contiene
  solo: indirizzo, designazione principale, azioni di contatto, select consenso —
  nient'altro (niente `Accesso servizi`, niente `purposes` grezzi, niente
  tassonomia interna). È l'**unica** superficie di editing del consenso lato
  Admin — nessun toggle nel menu kebab, nessuna sezione globale separata tra
  Email e Telefoni.
  - Cambiare il consenso di un'email aggiorna solo lo stato locale dei contatti
    del form; `Salva modifiche` (la transazione esistente del drawer) persiste
    le email aggiornate. Nessun auto-save, nessun save separato del consenso.
  - Mapping: `Non richiesto → chiave assente`, `Consentito → true`,
    `Non consentito → false`. Cambiare il consenso di un'email non tocca
    `is_primary`, `purposes`, accesso ai servizi, né le altre email.
- Source of truth **condivisa** con il Profilo Student: il drawer legge
  `marketing_consent` per email dal record `useLavorazioni().students` (non dallo
  snapshot `editStudent`); la migrazione contatti resta non-lossy, quindi un
  salvataggio non correlato non riscrive un valore più recente impostato dal
  Profilo.
- **Sintesi Student per la list/card `/studenti`**: una sola pill read-only di
  triage (`Ricontatto consentito` / `Ricontatto non consentito` /
  `Consenso non richiesto`) derivata dalle email **correnti** dello studente
  (`deriveStudentRecontactSummary`): qualsiasi email `true` → consentito;
  altrimenti qualsiasi `false` → non consentito; altrimenti non richiesto. Serve
  solo al triage — il valore per-email nel drawer resta autoritativo. Esempio:
  primaria `true` + secondaria `false` → list mostra `Ricontatto consentito`, il
  drawer mostra primaria Consentito / secondaria Non consentito.

### Invariante duro

- Modifica dei contatti nel drawer Student → **non** concede/revoca l'accesso ai
  servizi, non altera `purposes`, non sposta il consenso tra record email.
- Impostare un'altra email come principale → **non** trasferisce il consenso a
  un altro record: il consenso resta sull'email a cui appartiene.
- Flusso di accesso in `TimelineDrawer` → **non** altera `marketing_consent`.
- Modifica del consenso commerciale di un'email → **non** altera accesso,
  `purposes`, `is_primary`, né il consenso delle altre email.

### Fuori scope
Filtri consenso, azioni bulk marketing, timestamp/versioning/audit, log
immutabile, gestione Termini/Privacy in Admin, redesign di `TimelineDrawer` o
della UI contatti Coach. Provenienza, timestamp, audit ed evidenza legale
restano responsabilità della produzione.