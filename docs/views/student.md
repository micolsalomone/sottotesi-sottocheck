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
- Sezioni: `Informazioni personali` (Nome, Cognome), `Contatti` (Email primaria
  read-only dal contact model; Telefono; + consenso commerciale dell'email
  primaria), `Percorso attuale`, `Percorsi precedenti`. Termini e Informativa
  privacy **non** stanno nel Profilo: sono sull'Account (`/student-view/account`).
- Consenso comunicazioni commerciali: **nessuna sezione globale a sé**. Il
  controllo tri-state (`CommercialConsentField` condiviso — `Sì` / `No`; stato
  sconosciuto = nessuna opzione + `Preferenza non ancora espressa.`) è **dentro
  la sezione `Contatti`, subito sotto l'email**, con la didascalia
  `Riferito all'indirizzo <email>.` Legge/scrive **solo** il campo per-email
  `Student.contacts.emails[primaria].marketing_consent` (`boolean | null`) via
  `updateStudent`, integrato nel salvataggio del Profilo. Una preferenza non
  toccata non viene riscritta salvando altri campi (unknown resta unknown).
  Nessun tocco ad altre email / `purposes` / record accademici / servizi /
  Pipeline / stato legale Account. Il vecchio `Student.marketing_consent` globale
  è deprecato e non più usato.
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
  - Email primaria, `purposes`, `is_primary`, `source` non modificabili.
  - Telefono primario: solo gap-fill quando assente; un numero già presente
    (es. inserito da Admin) non viene mai sovrascritto.
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
  Account = accesso e stato legale. Non duplicare i campi del Profilo.
- Dominio: stesso `Student` strutturato del Profilo
  (`STUDENT_VIEW_STUDENT_RECORD_ID`). **Mai** il registry / la sessione
  dell'account standalone TesiCheck: lo Student non usa credenziali standalone.
- Sezione `Accesso`: email primaria (dal contact model strutturato, read-only).
  Nel prototipo non esiste un flusso password per lo Student → riga informativa
  neutra (`Gestione password non disponibile da questa area`), nessun link al
  recupero password standalone.
- Sezione `Termini e privacy`: lo Student **non ha** uno stato di accettazione
  Termini/Privacy nel modello. Righe neutre `Stato non disponibile` + nota
  `Lo stato delle accettazioni non è disponibile per questo account.` Non
  fabbricare date, versioni o accettazioni. Non aggiungere campi Termini/Privacy
  a `Student` per il prototipo. La produzione deve fornire lo stato legale/account
  reale dello Student.
- Cross-link: `Vai al profilo personale` → `/student-view/profilo`.
- Raggiungibile dal menu utente in alto a destra (`Informazioni Account`) e dal
  cross-link del Profilo; **non** dalla sidebar.
- Leaf presentazionali condivise con l'Account standalone in
  `src/app/components/account/AccountPrimitives.tsx` (`AccountInfoRow`,
  `LegalStatusRow`, `CrossSurfaceLink`) — sola presentazione; risoluzione dati di
  ruolo, semantica auth e ownership dello stato legale restano nella pagina.

## Navigazione

- Topbar minimale e coerente con sottotesi.it
- Terminologia: "coach" (mai "tutor")
- ❌ No concetti "home" duplicati

## Regole di isolamento

- Header, Sidebar e Layout di student-view sono custom e indipendenti
- Non condividere StudentLayout con altre viste
