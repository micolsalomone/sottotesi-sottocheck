# Vista Student — Guidelines

## A chi è rivolta

Studenti nel percorso tesi. Accesso solo via URL diretto.

## Path

`/student-view` — Layout: `src/app/components/student/StudentLayout.tsx`
Pagine: `src/pages/student/` per la dashboard dedicata, con riuso selettivo da `src/pages/coach/` dove serve

## Scopo

Lo studente segue il proprio percorso, carica documenti, aggiunge note.
Deve sempre capire dove si trova, qual è lo step corrente, cosa può fare ora.

## Dashboard

- Riprende la gerarchia visiva della public-view
- Tesi Check è presentato come servizio attivo
- Il coaching è già attivo e porta al percorso/timeline dello studente

## Principi

- Tutto in contesto dello step della timeline
- Ridurre il carico cognitivo: UI minimale, nessuna duplicazione
- Nessuna azione nascosta critica

## Timeline

- Struttura verticale, step-based
- Mostra: data inizio, step completati, step corrente (evidenziato), prossimo step, data fine prevista
- Step passati e futuri possono essere collassati

## Azioni per step

- Upload documento (drawer solo per selezione file)
- Aggiungi nota (inline, no drawer, no chat)
- Dopo upload: mostra documento nello storico step con stato "In revisione"

## Note

- Leggere, opzionali, contestuali allo step
- Appaiono inline nello storico step
- ❌ No pattern chat. ❌ No success screen dopo invio nota.

## Profilo (`/student-view/profilo`)

- Lo Student è un'identità Sottotesi **già nota**: la pagina legge e aggiorna
  solo dati del dominio Student, mai una Pipeline / lead CRM.
- Identità: bridge prototipale. La vista Student usa l'identità piatta `S-052`
  (`STUDENTS_DATA`) per header/dashboard/timeline; il Profilo risolve il record
  `Student` strutturato `STU-052` (`STUDENT_VIEW_STUDENT_RECORD_ID` in
  `src/app/utils/studentView.ts`) da `useLavorazioni().students`. Nessuna
  risoluzione via email, sessione account o `resolveEnrichmentTarget`. Se il
  record non esiste → stato neutro "Profilo non disponibile", nessuna creazione
  a runtime.
- **Regola IA canonica (self-service, standalone + Student): email di accesso,
  telefono (recapito) e preferenze di comunicazioni commerciali sono dati di
  ACCOUNT, non di Profilo.** Sezioni del Profilo: `Informazioni personali`
  (Nome, Cognome), `Percorso attuale`, `Percorsi precedenti` — **nessuna
  sezione `Contatti`**: niente più email, telefono, né consenso commerciale.
  Email, telefono, consenso commerciale e Termini/Informativa privacy stanno
  tutti sull'Account (`/student-view/account`).
- **MODEL B — consenso PER CONTATTO, non per persona.** Si modifica **solo**
  su Account: ogni consenso vive subito sotto il contatto a cui appartiene
  (CONTATTO → VALORE → PREFERENZA), dentro `Accesso` (email) e `Recapiti`
  (telefono) — **non** esiste più una sezione `Comunicazioni commerciali`
  separata. DUE controlli tri-state indipendenti (`CommercialConsentField`
  condiviso — copy accorciata `Sì` / `No`, domanda resa come testo separato
  sopra il controllo), **entrambi in autosave alla selezione**: nessun
  bottone `Salva modifiche` per il consenso, scrittura immediata e conferma
  transitoria condivisa (`sonner` `toast`, stesso meccanismo di Admin), mai un
  `Salvato` fisso nella pagina:
  - Email: riga breve `Per accesso, assistenza e comunicazioni di servizio.`
    seguita dalla domanda `Vuoi ricevere la newsletter Sottotesi?` (Sì/No).
    Legge/scrive **solo** `Student.contacts.emails[primaria].marketing_consent`
    (`boolean | null`) via `updateStudent` — `marketingConsent.ts`
    (`readStudentEmailConsent` / `withStudentEmailConsent`), stessi helper di
    sempre, solo spostati di superficie. Se l'email primaria non è
    risolvibile, mostra uno stato neutro (`Preferenza non disponibile: nessun
    indirizzo email registrato per questo account.`) invece di fabbricare un
    consenso.
  - Telefono: riga breve `Per assistenza e comunicazioni di servizio.` seguita
    dalla domanda `Vuoi ricevere aggiornamenti e offerte Sottotesi su
    WhatsApp?` (Sì/No). **Significato in questo prototipo: SOLO WhatsApp
    promozionale, non telefonate commerciali** — il contatto resta comunque
    utilizzabile per assistenza/servizio a prescindere da questa preferenza
    (dominio separato); un eventuale consenso per chiamate commerciali è una
    decisione di produzione/legale, non modellata qui. Legge/scrive **solo**
    `Student.contacts.phones[primario].marketing_consent` (`boolean | null`)
    via `updateStudent` — helper simmetrici `readStudentPhoneConsent` /
    `withStudentPhoneConsent` in `marketingConsent.ts`. Se non esiste ancora
    un telefono primario, nessun controllo di consenso è mostrato (solo
    l'assenza del recapito in `Recapiti`) — mai un consenso fabbricato per un
    contatto inesistente. Il numero di telefono resta invece testo libero con
    salvataggio esplicito (`Salva numero`, gap-fill-only, mai in autosave — vedi
    "Account" sotto): salvarlo non richiede mai una scelta di marketing, e un
    numero sostituito non eredita mai il consenso precedente.
  - Nessun badge/pill di stato, nessun helper aggiuntivo sullo stato
    sconosciuto: i radio non selezionati e la domanda stessa bastano.
  - Cambiare il consenso di un contatto non tocca l'altro, né `is_primary` /
    `purposes` / record accademici / servizi / Pipeline / stato legale
    Account. Il vecchio `Student.marketing_consent` globale resta deprecato e
    non più usato.
- Vocabolario accademico approvato: `Livello di laurea` (`degree_level`),
  `Corso di laurea` (`course_name`), `Università` (`university_name`),
  `Tipologia` (`thesis_type` — valori Compilativa / Sperimentale / Esame),
  `Professore` (`thesis_professor`), `Materia` (`thesis_subject`), `Argomento`
  (`thesis_topic`). Nessun campo esame-specifico.
- Modello accademico: **stesso** `Student.academic_records[]` letto/scritto da
  Admin. Nessun modello parallelo, nessuna copia privata, nessun record
  accademico di Pipeline. Le modifiche dello Student sono visibili in Admin nella
  stessa sessione SPA: comportamento voluto.
- Semantica di scrittura:
  - Nome/Cognome editabili; un input vuoto preserva il valore memorizzato
    (nessuna affordance di "svuota"). `name` ricalcolato da nome + cognome.
  - Email primaria, telefono, `purposes`, `is_primary`, `source` non
    modificabili qui — il Profilo non tocca più `contacts` (vedi `Recapiti`
    in Account per il telefono, stessa semantica gap-fill di prima).
  - Contenuto accademico: lo Student **può correggere** i campi di contenuto
    del record attuale e dei record precedenti (es. Università Bologna → Padova)
    — modifica diretta dello stesso `StudentAcademicRecord`. `updated_at` viene
    aggiornato solo se il contenuto cambia davvero (convenzione già usata dal
    drawer Admin).
  - È possibile **aggiungere** un nuovo percorso precedente (`is_current =
    false`, id `AR-NEW-<timestamp>` e date come nel drawer Admin, nessun
    binding a servizi).
  - **Rimozione percorsi precedenti:**
    - draft locale non ancora salvato → `Rimuovi`, senza conferma, rimosso
      solo dallo stato del form (non raggiunge mai `Student.academic_records`);
    - record persistito, `is_current === false`, **non** referenziato da alcun
      `StudentService.academic_record_id` → `Elimina percorso` con conferma
      inline leggera, poi rimosso da `Student.academic_records` con lo stesso
      `updateStudent`;
    - record persistito referenziato da un `StudentService` → azione distruttiva
      nascosta, copy `Questo percorso è collegato a una lavorazione e non può
      essere eliminato.` Il `StudentService` non viene mai toccato/rebindato.
  - Lo Student **non** può: cambiare quale record è `is_current`, eliminare il
    record attuale, toccare `student_id` / id record /
    `StudentService.academic_record_id` / associazioni a servizi / metadati
    operativi. Nessun toggle `is_current` esposto.
  - Se non esiste un record `is_current` → stato read-only neutro nella sezione
    `Percorso attuale`.
- Provenienza/audit: in prototipo le modifiche self-service scrivono sugli
  stessi record accademici Student consumati da Admin, senza coda di
  moderazione. L'implementazione di produzione dovrebbe conservare informazioni
  di provenienza/audit adeguate per le modifiche self-service (chi ha cambiato
  il record). Non modellato qui.
- Fuori scope: visibilità/normalizzazione consenso in Admin (Slice D), gestione
  contatti multipli, eliminazione del record accademico corrente, cambio del
  record corrente, auth Student.
- Il Profilo espone in fondo un link secondario `Gestisci account e privacy` →
  `/student-view/account`. Nella sidebar `Profilo` è nello slot secondario in
  basso (stesso pattern di Admin).

## Account (`/student-view/account`)

- Superficie **distinta** dal Profilo: Profilo = dati personali/accademici;
  Account = accesso, telefono (recapito), preferenze di comunicazioni
  commerciali e stato legale. Non duplicare i campi del Profilo (email,
  telefono e consenso commerciale vivono **solo** qui — vedi la regola IA
  canonica in "Profilo" sopra).
- Dominio: stesso `Student` strutturato del Profilo
  (`STUDENT_VIEW_STUDENT_RECORD_ID`). **Mai** il registry / la sessione
  dell'account standalone TesiCheck: lo Student non usa credenziali standalone.
- **Ordine visivo canonico**: `Accesso` (email → preferenza commerciale email →
  password) → `Recapiti` (telefono → preferenza commerciale telefono) → una
  frase secondaria di stato legale, in fondo (nessuna card dedicata — vedi
  sotto). Non esiste una sezione `Comunicazioni commerciali` separata: ogni
  consenso vive subito sotto il contatto a cui appartiene.
- **`Modifica email`.** La riga `Email` porta un'azione `Modifica email`
  (visibile solo quando esiste già un'email primaria) che apre lo STESSO
  modale condiviso a tre step della vista Public: `Conferma la tua
  identità` (password attuale, qualunque valore non vuoto — nessun
  controllo reale, mai accoppiato a un registry Student che non esiste) →
  nuova email → verifica (qualunque codice a 6 cifre ben formato).
  Sostituisce **solo** il valore dell'email primaria in `contacts.emails[]`
  (`is_primary`, `purposes`, `source`/`added_at`, ogni altro contatto
  invariati); il `marketing_consent` di quella voce si azzera nella stessa
  scrittura — mai ereditato dal vecchio indirizzo. Nessun registry Student di
  email "già registrate" esiste, quindi nessun controllo di collisione è
  offerto (a differenza della vista Public). Vedi `production-handoff.md` →
  "Modifica email".
- **Assunzione di ciclo di vita: questa vista rappresenta SEMPRE un account
  self-service già attivo.** Flusso concettuale di produzione (non
  implementato nel prototipo): Admin crea il record Student (operativo,
  senza login) → invito/attivazione dell'account self-service → l'utente
  accetta i Termini → l'utente prende visione dell'Informativa privacy →
  l'accesso self-service diventa attivo. Raggiungere
  `/student-view/account` presuppone che questo percorso sia già concluso;
  la pagina non verifica né rappresenta stati intermedi (invito pendente,
  Termini non ancora accettati, ecc.). Da questa assunzione derivano due
  scelte deliberate, nessuna delle quali aggiunge campi al dominio `Student`:
  - **Password gestibile.** La riga Password mostra `Gestisci password`, non
    un avviso di funzionalità mancante — un account attivo deve poter
    gestire la propria password, come qualunque altro account attivo. Apre
    un form inline (password attuale / nuova / conferma + `Aggiorna
    password`) con validazione locale, presentazionale al 100%: nessuna
    verifica reale, nessuna password salvata, nessun token, nessun hashing.
    Al successo il form si chiude e appare una conferma transitoria condivisa
    (`sonner` `toast`, stesso meccanismo di Admin) — mai un `Password
    aggiornata.` fisso nella pagina. Deliberatamente **non** instradato sul
    registry/sessione dell'account standalone TesiCheck
    (`tesicheckAccountSession.ts`): Student e standalone restano identità
    separate. Non esisteva un flusso password Student-safe riutilizzabile,
    quindi questo è il flusso locale più piccolo che comunica l'esperienza
    attesa. La produzione deve delegare interamente al sistema di
    autenticazione reale dello Student.
  - **Termini/Privacy = stato attivo canonico, come frase unica** — non
    `Stato non disponibile`, non una card `Termini e privacy` dedicata, non
    righe di stato per-voce, nessun badge/icona: `Hai accettato i Termini e
    condizioni e preso visione dell'Informativa privacy.`, incondizionata (mai
    `Privacy accettata`: la presa visione dell'informativa non è consenso
    commerciale). `Termini e condizioni` resta testo semplice, non
    cliccabile: nessuna destinazione Termini reale esiste in questo
    prototipo, nessuna viene inventata. `Informativa privacy` è un link reale
    verso la privacy policy Sottotesi attualmente nota
    (`https://www.sottotesi.it/cookie-privacy-policy/`). Mai letta da
    `Student` — nessun campo legale aggiunto al dominio, nessuna
    data/versione/accettazione fabbricata oltre questa frase. La produzione
    deve fornire lo stato legale/account reale dello Student (versioning,
    timestamp, un eventuale stato pendente/inattivo se esiste).
- Sezione `Recapiti`: telefono, dalla STESSA fonte strutturata
  `Student.contacts.phones[]` usata da sempre (nessuna fonte piatta
  `Student.phone` introdotta). Stessa semantica gap-fill-only che prima
  viveva nel Profilo: se esiste già un telefono primario con valore, riga
  read-only; se il contatto primario esiste ma è vuoto, campo editabile +
  `Salva numero` (esplicito, mai autosave) che valorizza SOLO quel contatto
  esistente (non crea un nuovo `ContactPhone`, non sovrascrive mai un numero
  già presente); conferma via `toast` transitorio.
- Cross-link: `Vai al profilo personale` → `/student-view/profilo`.
- Raggiungibile dal menu utente in alto a destra (`Informazioni Account`) e dal
  cross-link del Profilo; **non** dalla sidebar.
- Leaf presentazionali condivise con l'Account standalone in
  `src/app/components/account/AccountPrimitives.tsx` (`AccountInfoRow`,
  `CrossSurfaceLink`) — sola presentazione; risoluzione dati di ruolo,
  semantica auth e ownership dello stato legale restano nella pagina. La
  frase di stato legale è composta direttamente in ciascuna pagina (non un
  componente condiviso): breve e local-only.

## Navigazione

- Topbar minimale e coerente con sottotesi.it
- Terminologia: "coach" (mai "tutor")
- ❌ No concetti "home" duplicati

## Regole di isolamento

- Header, Sidebar e Layout di student-view sono custom e indipendenti
- Non condividere StudentLayout con altre viste
