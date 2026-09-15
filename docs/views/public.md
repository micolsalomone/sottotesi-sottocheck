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
  superfici distinte, secondo una regola IA canonica valida per ogni superficie
  self-service (standalone e Student): **email di accesso, telefono (recapito)
  e preferenze di comunicazioni commerciali sono dati di ACCOUNT, non di
  Profilo.**
  - Profilo = `Informazioni personali` → `Percorso attuale` →
    `Percorsi precedenti`, in quest'ordine. **Non** mostra più l'email
    account, il telefono, né alcun controllo di consenso commerciale — nessuna
    sezione `Contatti`.
  - Account, ordine visivo canonico: `Accesso` (email account → preferenza
    commerciale per l'email → password) → `Recapiti` (telefono → preferenza
    commerciale per il telefono) → una frase secondaria di stato legale, in
    fondo (nessuna card dedicata — vedi sotto). **Non** esiste più una
    sezione `Comunicazioni commerciali` separata: ogni consenso vive subito
    sotto il contatto a cui appartiene (CONTATTO → VALORE →
    PREFERENZA). È l'**unica** superficie self-service dove telefono e
    consenso commerciale si modificano — nessun controllo duplicato sul
    Profilo.
  - **Interazione: due grammar distinte, nessuno stato "Salvato" permanente.**
    La preferenza commerciale (Sì/No, sia email sia WhatsApp) **si autosalva
    alla selezione**: scrive subito, nessun bottone `Salva modifiche` esiste
    più per il consenso. Il numero di telefono resta invece testo libero con
    salvataggio esplicito — `Salva numero`, visibile solo quando il campo
    differisce dal valore persistito, mai in autosave. Ogni azione riuscita
    (preferenza email, preferenza WhatsApp, numero di telefono) mostra una
    conferma transitoria condivisa (`sonner` `toast`, lo stesso meccanismo già
    usato in Admin) e non lascia mai un `Salvato` fisso nella pagina.
    **Vincolo numero-non-salvato:** finché il campo telefono differisce dal
    valore persistito, il controllo Sì/No WhatsApp resta `disabled` — non è
    possibile impostare la preferenza per un numero non ancora salvato — con
    una nota inline (`Salva il numero per modificare questa preferenza.`).
    Dopo il salvataggio del numero, la preferenza WhatsApp si rilegge dalla
    chiave del NUOVO numero: un numero genuinamente nuovo non eredita mai il
    consenso del precedente (tipicamente torna `Non richiesto`).
  - **Copy minimale, significato per canale dichiarato nel prototipo.** Sotto
    ogni valore di contatto: una riga breve che distingue il contatto
    operativo (`Per accesso, assistenza e comunicazioni di servizio.` per
    l'email; `Per assistenza e comunicazioni di servizio.` per il telefono)
    dalla domanda commerciale vera e propria — `Vuoi ricevere la newsletter
    Sottotesi?` (email, Sì/No) e `Vuoi ricevere aggiornamenti e offerte
    Sottotesi su WhatsApp?` (telefono, Sì/No). Nessuna etichetta
    amministrativa (`Preferenza commerciale`, `Comunicazioni commerciali`),
    nessun badge di stato, nessun helper aggiuntivo sullo stato sconosciuto:
    i radio non selezionati e la domanda stessa bastano.
  - **Significato del consenso telefono in questo prototipo — SOLO WhatsApp
    promozionale, non chiamate.** Il consenso telefono autorizza messaggi
    promozionali WhatsApp su quel numero; NON copre telefonate commerciali.
    Il contatto resta comunque utilizzabile per assistenza/servizio a
    prescindere da questa preferenza (dominio separato). Un eventuale
    consenso per chiamate commerciali è una decisione di produzione/legale,
    non modellata qui.
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
  - **MODEL B — consenso PER CONTATTO, non per persona.** Account espone DUE
    controlli tri-state indipendenti (`CommercialConsentField` riusato, con
    copy accorciata `Sì`/`No` per il radio e la domanda vera e propria resa
    come testo separato sopra), ciascuno con il proprio salvataggio: uno per
    l'email account, uno per il telefono corrente. Cambiare l'uno non tocca
    l'altro. Se non esiste ancora un telefono, `Recapiti` non mostra un
    controllo di consenso attivo: solo un helper (`Aggiungi un numero per
    gestire la preferenza WhatsApp.`).
  - Entrambe le preferenze sono scritte sullo stesso store Profilo-locale
    (`commercial_consents: Record<string, boolean>` in `standaloneProfile.ts`),
    ora chiave-neutro rispetto al contatto (email O telefono, non solo email):
    `readStandaloneContactConsent` / `writeStandaloneContactConsent` leggono e
    scrivono la chiave esatta passata, con `readStandaloneCommercialConsent` /
    `writeStandaloneCommercialConsent` (email) e `readStandalonePhoneConsent` /
    `writeStandalonePhoneConsent` (telefono) come wrapper sottili. Poiché
    `phone` è un valore singolo (non un array di contatti storici), cambiare
    numero significa leggere/scrivere una chiave diversa: il nuovo numero
    NON eredita mai il consenso del precedente, e parte sempre da
    `Non richiesto`. L'email di registrazione resta seedata dalla scelta
    esplicita fatta in fase di registrazione; la Pipeline/lo Student CRM
    ricevono comunque la stessa scelta email in parallelo (dominio
    acquisizione, invariato — vedi `tesicheck-standalone-enrichment-handoff.md`
    §19).
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
- **Stato legale Account — frase secondaria unica, non una card.** Nessuna
  sezione `Termini e privacy` dedicata, nessuna riga di stato per-voce, nessun
  badge/icona: una sola frase discreta in fondo alla pagina (sopra il
  cross-link al Profilo), `Hai accettato i Termini e condizioni e preso
  visione dell'Informativa privacy.` — mai `Privacy accettata` (la presa
  visione non è consenso commerciale). Non più letta dalla persistenza
  prototipo Slice A (registry `RegisteredAccount` + mirror sessione, ora
  inutilizzata da questa pagina): la frase è incondizionata, perché la
  registrazione richiede già entrambe le accettazioni prima di poter creare
  l'account. `Termini e condizioni` resta testo semplice, non cliccabile:
  nessuna destinazione Termini reale esiste in questo prototipo, e nessuna
  viene inventata (URL di produzione da definire). `Informativa privacy` è un
  link reale verso la privacy policy Sottotesi attualmente nota
  (`https://www.sottotesi.it/cookie-privacy-policy/`), coerente con i link
  esterni `sottotesi.it` già usati altrove nel prototipo.

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
