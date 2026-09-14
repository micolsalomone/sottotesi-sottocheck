# Vista Public — Guidelines

## A chi è rivolta

Utenti che acquistano e usano solo Sottocheck, senza un percorso coaching attivo.

## Path

`/public` - Landing pubblica non loggata (standalone)

`/public-view` - Layout: `src/app/components/public/PublicLayout.tsx` (prototipo loggato mantenuto per retrocompatibilita')
Pagine: `src/pages/public/` e contenuti Sottocheck riusabili da `src/pages/student/`

## Scopo

Consentire di caricare un documento, pagare il controllo, seguire lo stato di elaborazione e scaricare i report precedenti.
Promuovere inoltre i servizi coaching come upsell commerciale verso utenti che oggi usano solo Sottocheck.

Per la landing pubblica non loggata, l'obiettivo e' conversione + fiducia: spiegare il servizio, rassicurare sulla gestione dei file e guidare al check.

## Principi

- Linguaggio e componenti grafici coerenti con student-view (tipografia, card, badge, CTA)
- Nessuna funzionalita' coaching attiva in public-view: il coaching e' presentato come proposta commerciale
- Navigazione minima e focalizzata solo su Sottocheck
- Stato del controllo sempre evidente
- Tono informativo e operativo, con blocchi marketing dedicati all'upsell
- Messaggio trust esplicito: i file non vengono archiviati e non sono visibili a Sottotesi

## Navigazione

- Sidebar — nav principale: Dashboard sintetica, Sottocheck (TesiCheck), Storico.
- Sidebar — slot secondario in basso (separato, stesso pattern di Student/Admin):
  `Profilo`. `Account` **non** è nella sidebar.
- `Profilo` (`/public-view/profilo`) e `Account` (`/public-view/account`) sono
  superfici distinte: Profilo = `Informazioni personali` → `Contatti` → percorso
  accademico, in quest'ordine. Account = accesso (email, recupero password) +
  stato Termini/Privacy in sola lettura. Termini/Privacy non stanno nel
  Profilo.
  - **Dominio proprio, indipendente dal CRM.** Il Profilo standalone legge e
    scrive **solo** un prototipo dedicato
    (`src/app/data/standaloneProfile.ts`, keyed sull'email account verificata),
    mai `Pipeline` né `Student.academic_records[]`. Non risolve più
    `resolveEnrichmentTarget`: la sua forma **non cambia mai** in base a se
    l'email corrisponde a una Pipeline, a uno Student o a nessuno dei due —
    ogni utente standalone autenticato vede sempre lo stesso modello
    `Percorso attuale` + `Percorsi precedenti` (percorso corrente sempre
    presente, creato vuoto al primo accesso; percorsi precedenti aggiungibili
    ed eliminabili liberamente — nessun concetto `StudentService` in questo
    dominio). Stessa leaf condivisa (`AcademicRecordsSections`) usata da
    `/student-view/profilo`, che invece resta sul dominio Student reale
    (`Student.academic_records[]`, con `is_current` e binding `StudentService`
    operativi/Admin) — i due Profili non sono uniti né sincronizzati da questo
    prototipo.
  - Il consenso commerciale (scelta esplicita tri-state) vive **dentro**
    `Contatti`, accanto all'email a cui si riferisce — non in una sezione
    `Comunicazioni` separata. È scritto sullo stesso store Profilo
    (`commercial_consents`), seedato dalla scelta esplicita fatta in
    registrazione; la Pipeline/lo Student CRM ricevono comunque la stessa
    scelta in parallelo (dominio acquisizione, invariato — vedi
    `tesicheck-standalone-enrichment-handoff.md` §19).
  - **Handoff produzione:** la sincronizzazione fra questo Profilo standalone
    e un'eventuale identità CRM/Student reale è una decisione di
    implementazione futura, non simulata da questo prototipo.
  Si collegano con cross-link reciproci (`Gestisci account e privacy` /
  `Vai al profilo personale`); nessun contenuto duplicato.
  - **Completamento profilo — onboarding post-registrazione, non post-pagamento.**
    Una modale one-time (`StandaloneProfileCompletionModal`) compare sopra la
    Dashboard o sopra il Report già renderizzati (mai a bloccarli), subito dopo
    una nuova registrazione — mai per account legacy/demo. Indipendente da
    questa, una card di promemoria **non bloccante** in Dashboard resta visibile
    finché il record accademico corrente del Profilo non ha tutti e quattro i
    campi essenziali; il suo CTA porta a `/public-view/profilo`, non riapre mai
    la modale. Dettaglio completo: `tesicheck-standalone-enrichment-handoff.md`
    §20.
- `Account` è raggiungibile dal menu utente in alto a destra
  (`Informazioni Account`) e dal cross-link del Profilo.
- `/public/account` resta il gate account del checkout a pagamento: mai riusato
  come pagina Account autenticata.
- Stato legale Account: letto dalla persistenza prototipo Slice A (registry
  `RegisteredAccount` + mirror sessione); assente (account legacy) →
  `Stato non registrato nel prototipo`, mai interpretato come accettato. Nessuna
  data/versione/URL/testo legale inventati.

## Dashboard marketing

- Prevedere aree dedicate a copy marketing per vendere i percorsi coaching
- Prevedere slot grafici per sticker PNG trasparenti (placeholder sostituibili con asset reali)
- Usare CTA chiare verso richiesta informazioni coaching

## Ingresso account dalla landing

- La landing `/public` espone `Accedi` (`/public/login`) e `Registrati`
  (`/public/register`) come ingressi account diretti, separati dal checkout
  upload-first (che resta invariato).
- Con una sessione standalone valida le due CTA diventano un unico
  `Vai al tuo account` → `/public-view`; la landing non viene comunque
  reindirizzata a ogni visita.
- `/public-view` richiede una sessione account standalone: `PublicLayout` fa da
  guard prototipale e rimanda a `/public` se manca.
- Logout (menu utente in `PublicHeader`): azzera solo la sessione account
  standalone e torna a `/public` (mai `/`). Non tocca storico/check persistenti,
  Pipeline CRM o altri store. È il meccanismo di reset per i test ripetibili.
- Auth solo simulata (prototipo): vedi `tesicheck-canonical-flow.md` §29 e
  `tesicheckAccountSession.ts`.

## Regole di isolamento

- Header, Sidebar e Layout di public-view sono custom e indipendenti
- Non condividere la shell di public-view con student-view o coach-view
