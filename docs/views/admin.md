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

Il consenso commerciale è **per contatto (email e telefono)** in entrambi i
domini (Pipeline e Student) — Pipeline lo era già per entrambi i canali;
Student lo estende dal solo canale email anche al telefono. Non è più un
valore globale di persona. Storage ed editing restano comunque **distinti**
tra Pipeline e Student:

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

### Student — consenso per contatto (email + telefono)

- `Student.contacts.emails[].marketing_consent?: boolean | null` e
  `Student.contacts.phones[].marketing_consent?: boolean | null` — un valore
  tri-state **per ogni email e per ogni telefono** dello studente: `true` =
  Consentito, `false` = Non consentito, `null` / assente = Non richiesto. Il
  consenso appartiene al singolo contatto (email O telefono), indipendente da
  `purposes` e dall'accesso ai servizi, e non si sposta mai fra contatti.
  **Significato in questo prototipo — email = newsletter/promozionale via
  email; telefono = SOLO WhatsApp promozionale, non telefonate commerciali.**
  Il contatto resta comunque utilizzabile per assistenza/servizio a
  prescindere da questo consenso (dominio separato). Un eventuale consenso
  per chiamate commerciali è una decisione di produzione/legale, non
  modellata qui. Admin mantiene comunque il vocabolario operativo esistente
  (`Consentito` / `Non consentito` / `Non richiesto` — vedi sopra), distinto
  dal linguaggio self-service (`Sì` / `No` + domanda in linguaggio naturale)
  usato su Profilo/Account.
- Il vecchio valore globale `Student.marketing_consent` è **deprecato**: nessuna
  UI / lettura / scrittura canonica lo usa più. `migrateLegacyStudentConsent`
  (in `LavorazioniContext.tsx`) sposta un eventuale valore globale dei seed
  sulla **sola email primaria** al caricamento del modulo; uno Student senza
  email primaria non riceve alcun consenso per email (limite documentato — un
  valore globale non è attribuibile in sicurezza a tutte le email). Il
  telefono non ha mai avuto un consenso globale, quindi non richiede
  migrazione.
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
- **Controllo `Comunicazioni commerciali` dentro OGNI card email E OGNI card
  telefono** di `ContactManager` (`mode='student'`): un `MarketingConsentSelect`
  tri-state compatto (`Non richiesto` / `Consentito` / `Non consentito`) sotto
  l'indirizzo/numero, nella card primaria e in quelle aggiuntive, per
  entrambi i tipi di contatto. La card contiene solo: indirizzo/numero,
  designazione principale, azioni di contatto, select consenso — nient'altro
  (niente `Accesso servizi`, niente `purposes` grezzi, niente tassonomia
  interna sui campi mostrati). È l'**unica** superficie di editing del
  consenso lato Admin — nessun toggle nel menu kebab, nessuna sezione globale
  separata tra Email e Telefoni.
  - Cambiare il consenso di un'email o di un telefono aggiorna solo lo stato
    locale dei contatti del form; `Salva modifiche` (la transazione esistente
    del drawer) persiste i contatti aggiornati. Nessun auto-save, nessun save
    separato del consenso.
  - Mapping: `Non richiesto → chiave assente`, `Consentito → true`,
    `Non consentito → false`. Cambiare il consenso di un contatto non tocca
    `is_primary`, `purposes`, accesso ai servizi, né il consenso degli altri
    contatti (email o telefono che siano).
- Source of truth **condivisa** con l'Account Student: il drawer legge
  `marketing_consent` per email/telefono dal record `useLavorazioni().students`
  (non dallo snapshot `editStudent`); la migrazione contatti resta non-lossy,
  quindi un salvataggio non correlato non riscrive un valore più recente
  impostato dall'Account.
- **Sintesi Student per la list/card `/studenti`**: una sola pill read-only di
  triage (`Ricontatto consentito` / `Ricontatto non consentito` /
  `Consenso non richiesto`) derivata dalle email E dai telefoni **correnti**
  dello studente (`deriveStudentRecontactSummary(emails, phones)`): qualsiasi
  contatto `true` → consentito; altrimenti qualsiasi `false` → non consentito;
  altrimenti non richiesto. Serve solo al triage — il valore per-contatto nel
  drawer resta autoritativo su QUALE canale. Esempio: email primaria `false` +
  telefono primario `true` → list mostra `Ricontatto consentito`, il drawer
  mostra email Non consentito / telefono Consentito.

### Invariante duro

- Modifica dei contatti nel drawer Student → **non** concede/revoca l'accesso ai
  servizi, non altera `purposes`, non sposta il consenso tra record email o
  telefono.
- Impostare un'altra email o un altro telefono come principale → **non**
  trasferisce il consenso a un altro record: il consenso resta sul contatto a
  cui appartiene.
- Flusso di accesso in `TimelineDrawer` → **non** altera `marketing_consent`.
- Modifica del consenso commerciale di un contatto → **non** altera accesso,
  `purposes`, `is_primary`, né il consenso degli altri contatti.

### Fuori scope
Filtri consenso, azioni bulk marketing, timestamp/versioning/audit, log
immutabile, gestione Termini/Privacy in Admin, redesign di `TimelineDrawer` o
della UI contatti Coach. Provenienza, timestamp, audit ed evidenza legale
restano responsabilità della produzione.