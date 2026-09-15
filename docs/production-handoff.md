# Production Handoff Notes

## Prototype vs production

Questo repository e' un prototipo. Layout, interaction, gerarchia visiva e comportamento di prodotto sono il riferimento progettuale da preservare. JSX, mock data, timer, localStorage e altre implementazioni prototipali non sono necessariamente il riferimento tecnico production.

L'implementazione production deve rispettare il comportamento definito usando backend, API e stack reali.

## Contesti applicativi

- Admin, Coach, Student e authenticated `public-view` sono contesti distinti con shell separate.
- `/public-view` e' un'area autenticata, nonostante il naming tecnico.
- `/public` e' la landing pubblica.
- Non condividere o fondere shell solo per similarita' visiva.

Vedi [architecture.md](architecture.md) per route e invarianti di contesto.

## Naming e visual system

- Il nome visibile del prodotto e' `TesiCheck`.
- `Sottocheck*` puo' restare solo come naming tecnico legacy.
- Route, API path e identificatori tecnici non sono source of truth per il copy UI.
- La primary high-emphasis action usa near-black con foreground bianco.
- Brand, primary action e success sono responsabilita' distinte: il legacy `--primary` verde non e' una CTA primary universale.
- Il colore di uno status deriva dal suo significato business, non dal nome generico dello stato.

Vedi [styleguide.md](styleguide.md) per i dettagli del sistema visuale.

## Layout ownership

- Shell: viewport, sidebar e scroll.
- `.page-container`: page gutter, 40px desktop e 16px mobile.
- Page root: composizione verticale.
- Card, panel, table e filter: spacing interno.
- Full-bleed: compensa direttamente il page gutter.

## Interaction e accessibility

Preservare focus-visible, accessible naming, tipo semantico del controllo, keyboard interaction e distinzione tra tabs, filter, view switcher e navigation. Usare controlli nativi quando appropriati.

Il DOM production deve essere verificato separatamente con test accessibility reali.

## Prototype simulations - non replicare letteralmente

### TesiCheck, payment e check

Il prototipo usa timer locali per simulare processing e completion, crediti locali, completion di job/report, score e valori report generati, ed eventuale stato persistito localmente.

Production deve usare API pagamento reali, job/status API reali, credit/account state reale e report data/artifact reale.

### Report download

Il `.txt` generato dal prototipo e' un artifact di simulazione. Production deve usare il formato/report reale definito dall'integrazione. Il download e' disponibile solo quando il report e' completato.

## Incomplete / out of scope UI

Le route profile/account che mostrano `Pagina in costruzione` sono incomplete nel prototipo e non devono essere replicate come comportamento finale senza una decisione di scope:

- Admin account/info.
- Coach profile.

## Student Profile — comportamento prototipale implementato

`/student-view/profilo` non è più un placeholder. Comportamento prototipale di
riferimento:

- **Bridge di identità (prototipo).** La vista Student usa l'identità piatta
  `S-052` (`STUDENTS_DATA`) per header/dashboard/timeline; il Profilo risolve il
  record `Student` strutturato `STU-052` (`STUDENT_VIEW_STUDENT_RECORD_ID` in
  `src/app/utils/studentView.ts`) da `useLavorazioni().students`. È uno shim
  esplicito di prototipo: il mapping identità reale (account ↔ Student) resta
  responsabilità di backend/applicazione di produzione. Il seed `STU-052`
  riporta solo valori grounded già presenti nel mock piatto; i campi non
  mappabili restano vuoti.
- **Dominio scritto.** Il Profilo legge/scrive **solo** il dominio Student
  (`updateStudent`) — anagrafica (`first_name` / `last_name` → `name`
  ricalcolato) e i record in `Student.academic_records[]`. Il telefono (solo
  gap-fill) è stato spostato su Account, sezione `Recapiti` — vedi "Consenso
  comunicazioni commerciali". Nessuna Pipeline, nessun lead CRM, nessuna
  sessione account standalone, nessun `resolveEnrichmentTarget`.
- **Record accademici = stessa source of truth di Admin.** Student e Admin
  leggono/scrivono lo stesso `Student.academic_records[]`. Le modifiche dello
  Student sono visibili in Admin nella stessa sessione SPA — voluto. Lo Student
  può correggere il contenuto del record attuale e dei precedenti e aggiungere
  un percorso precedente (`is_current = false`, convenzioni id/date del drawer
  Admin). Non può cambiare quale record è corrente né toccare binding operativi
  (`student_id`, id record, `StudentService.academic_record_id`, associazioni a
  servizi).
- **Rimozione percorsi precedenti.** Draft locale non salvato → `Rimuovi`
  immediato (solo stato form). Record persistito `is_current === false` **non**
  referenziato da alcun `StudentService.academic_record_id` → `Elimina percorso`
  con conferma inline, poi rimosso da `Student.academic_records` via
  `updateStudent`. Record referenziato da un `StudentService` → eliminazione
  nascosta + copy esplicativa; il servizio non viene mai modificato. Il record
  `is_current` non è mai eliminabile.
- **Aggiornamenti conservativi sul contenuto.** Non è un questionario di
  enrichment: le correzioni sovrascrivono il valore precedente sullo stesso
  record. La semantica gap-fill-only resta per i futuri flussi post-pagamento,
  non per l'editing del Profilo.
- **Limitazione di provenienza/audit lasciata alla produzione.** Le modifiche
  self-service scrivono direttamente sui record Student senza coda di
  moderazione né versioning. `updated_at` del record viene aggiornato solo se il
  contenuto cambia (convenzione già presente nel drawer Admin); `Student.updated_by`
  **non** viene impostato (il drawer Admin non definisce un valore self-service e
  qui non se ne inventa uno). La produzione deve conservare informazioni di
  provenienza/audit adeguate (chi ha modificato il record).
- **Fuori scope:** gestione contatti multipli, eliminazione del record
  accademico corrente, cambio del record corrente, auth Student. Email
  primaria, telefono (`Recapiti`), consenso alle comunicazioni commerciali
  (`Comunicazioni commerciali`) e Termini/Privacy sono tutti sull'Account
  (`/student-view/account`) — non nel Profilo. Vedi "Consenso comunicazioni
  commerciali".
- Presentational primitives condivise con il Public profile in
  `src/app/components/profile/ProfileFormPrimitives.tsx` (`FormSection`,
  `TextField`, `SelectField`, `ReadOnlyField`) — solo presentazione, nessuna
  logica di dominio.

### Ancora incompleto / divergenza nota

- Authenticated `public-view` profilo (`PublicProfilePage`) **non** è più un
  flusso di acquisizione/enrichment Pipeline: legge/scrive un dominio
  prototipale proprio e indipendente dal CRM
  (`src/app/data/standaloneProfile.ts`, keyed sull'email account verificata),
  mai `Pipeline` né `Student.academic_records[]`. La sua forma è sempre la
  stessa per ogni utente standalone autenticato — `Informazioni personali` →
  `Percorso attuale` + `Percorsi precedenti` — nessuna sezione `Contatti`:
  email account, telefono (`Recapiti`) e consenso commerciale
  (`Comunicazioni commerciali`) vivono tutti ora su `/public-view/account`,
  non qui — mai
  "un blocco se Pipeline, multi-record se Student". Riusa la stessa leaf
  condivisa (`AcademicRecordsSections`) di `/student-view/profilo`, che invece
  resta sul dominio Student reale (`Student.academic_records[]`, `is_current` e
  binding `StudentService` operativi/Admin, mai toccati dal Profilo
  standalone) — i due Profilo non sono uniti né sincronizzati. L'acquisizione
  Pipeline a registrazione (`ensureTesiCheckPipeline`,
  `applyStandaloneRegistrationConsent`) resta invariata e indipendente da
  questa pagina; solo la scelta di consenso commerciale viene proiettata in
  parallelo anche sul dominio Profilo standalone
  (`seedStandaloneProfileFromRegistration`), senza che il Profilo legga mai
  indietro dal CRM. La sincronizzazione fra questo Profilo standalone e
  un'eventuale identità CRM/Student reale è lasciata alla produzione, non
  simulata qui — vedi `tesicheck-standalone-enrichment-handoff.md` §19.
- **Completamento profilo post-registrazione** (modale one-time
  `StandaloneProfileCompletionModal` + card promemoria non bloccante in
  Dashboard) è interamente prototipale: il flag `profile_completion_prompt_pending`
  e la derivazione di completezza (`isCurrentAcademicRecordComplete`) vivono
  solo in `src/app/data/standaloneProfile.ts` (`localStorage`), senza alcuna
  sincronizzazione server-side simulata. La produzione deve decidere dove
  persistere questo stato one-time (probabilmente lato backend, per
  sopravvivere a dispositivi/sessioni diverse) — questo prototipo non lo
  prescrive. Vedi `tesicheck-standalone-enrichment-handoff.md` §20.
- `CreateStudentDrawer` (create + edit Admin) usa ora il vocabolario approvato
  (`Tipologia` / `Professore` / `Materia` / `Argomento`) e offre l'opzione
  `Esame` (valore `esame`). Solo etichette/opzioni: nessun cambio a
  multi-record, add/remove, `is_current`, binding `StudentService`, conversione
  Pipeline o semantica di salvataggio. Il vocabolario di `InfoCoachingCard`
  (Timeline) resta invariato: è materia del workstream Timeline.

## Product decision still open

### File privacy / retention

La landing afferma che i file non sono conservati e non sono visibili a Sottotesi. Queste affermazioni devono essere confermate rispetto al comportamento production prima dell'handoff finale. Non reinterpretare la policy.

## Prototype-only artifact

Il placeholder Coach Dashboard `Illustrazione / Animazione` e' un artifact del prototipo e non deve essere interpretato automaticamente come UI finale.

## Known intentional distinctions

TesiCheck job status, history/report status e service lifecycle sono domini distinti. Label come `Completato` non implicano lo stesso colore o la stessa semantic tone. Non creare un universal StatusBadge per uniformarli.

## Consenso comunicazioni commerciali

Tre domini di consenso distinti (canonical §33.5): Termini & Condizioni,
Informativa privacy, consenso commerciale. Nel prototipo:

- **Termini/Privacy — nessuna card dedicata, una sola frase secondaria.** Su
  entrambe le superfici Account (`/public-view/account`,
  `/student-view/account`), lo stato legale non è più una sezione `Termini e
  privacy` con righe/icone: è UNA frase discreta in fondo alla pagina, sopra
  il cross-link al Profilo — `Hai accettato i Termini e condizioni e preso
  visione dell'Informativa privacy.`, sempre incondizionata (mai `Privacy
  accettata`: la presa visione non è consenso commerciale). Standalone: la
  registrazione richiede già entrambe le accettazioni prima di poter creare
  l'account, quindi la frase non dipende più dalla persistenza prototipo
  Slice A (registry `RegisteredAccount`/`termsAccepted`/`privacyAcknowledged`
  — quella lettura è stata rimossa dalla pagina). Student: la vista
  rappresenta SEMPRE un account self-service già attivo (vedi "Ciclo di vita
  Student" più sotto), quindi la stessa frase incondizionata, mai letta da
  `Student`. `Termini e condizioni` resta testo semplice, non cliccabile:
  nessuna destinazione Termini reale esiste in questo prototipo, nessuna
  viene inventata (URL di produzione pending). `Informativa privacy` è un
  link reale verso la privacy policy Sottotesi attualmente nota
  (`https://www.sottotesi.it/cookie-privacy-policy/`), coerente con i link
  esterni `sottotesi.it` già usati altrove nel prototipo (landing, report,
  output-preview).
- **Consenso commerciale — MODEL B, per contatto (email + telefono).** Vive
  **solo** su Account (non più Profilo — regola IA canonica, canonical
  §33.9). **Non esiste una sezione `Comunicazioni commerciali` separata**:
  ogni consenso vive subito sotto il contatto a cui appartiene (CONTATTO →
  VALORE → PREFERENZA), dentro `Accesso` (email) e `Recapiti` (telefono).
  DUE controlli tri-state **indipendenti**, con copy propria:
  - Email: riga di servizio (`Per accesso, assistenza e comunicazioni di
    servizio.`) + domanda (`Vuoi ricevere la newsletter Sottotesi?`, Sì/No).
  - Telefono: riga di servizio (`Per assistenza e comunicazioni di
    servizio.`) + domanda (`Vuoi ricevere aggiornamenti e offerte Sottotesi
    su WhatsApp?`, Sì/No).
  **Interazione — due grammar distinte, non una.** La preferenza (Sì/No, sia
  email sia WhatsApp) **si autosalva alla selezione**: scrittura immediata,
  nessun bottone `Salva modifiche` per il consenso. Il numero di telefono
  resta invece testo libero con salvataggio esplicito — `Salva numero`,
  visibile solo quando il campo differisce dal valore persistito, mai in
  autosave: salvarlo non richiede mai una scelta di marketing. Ogni azione
  riuscita (preferenza email, preferenza WhatsApp, numero di telefono) mostra
  una conferma transitoria condivisa (`sonner` `toast`, lo stesso meccanismo
  già usato in Admin) e non lascia mai uno stato `Salvato` fisso nella
  pagina. **Vincolo numero-non-salvato:** finché il campo telefono differisce
  dal valore persistito, il controllo Sì/No WhatsApp resta `disabled` — non è
  possibile impostare la preferenza per un numero non ancora salvato — con
  una nota inline (`Salva il numero per modificare questa preferenza.`). Dopo
  il salvataggio, la preferenza WhatsApp si rilegge dalla chiave del NUOVO
  numero.
  Nessuna etichetta amministrativa (`Preferenza commerciale`, `Comunicazioni
  commerciali`), nessun badge di stato, nessun helper aggiuntivo sullo stato
  sconosciuto — i radio non selezionati e la domanda stessa bastano. Cambiare
  l'uno non tocca l'altro; consenso non si sposta mai fra contatti (cambio
  primario, cambio numero, aggiunta/rimozione di un contatto).
  **Significato in questo prototipo — email: newsletter/promozionale via
  email; telefono: SOLO WhatsApp promozionale, MAI telefonate commerciali.**
  Il contatto resta comunque utilizzabile per assistenza/servizio a
  prescindere da questo consenso (dominio separato, sempre consentito). Un
  eventuale consenso per chiamate commerciali è una decisione di
  produzione/legale, non modellata qui — non introdurre una granularità
  per-canale (WhatsApp vs chiamata) senza tale decisione.
  - Standalone: entrambe scritte su `standaloneProfile.ts`
    (`commercial_consents: Record<string, boolean>`, ora chiave-neutro
    rispetto al contatto — email O telefono — via
    `readStandaloneContactConsent` / `writeStandaloneContactConsent`, con
    `readStandaloneCommercialConsent`/`writeStandaloneCommercialConsent`
    (email) e `readStandalonePhoneConsent`/`writeStandalonePhoneConsent`
    (telefono) come wrapper sottili). Store Profilo-locale, non Pipeline.
    Poiché `phone` è un valore singolo (non un array di contatti storici),
    un numero sostituito legge/scrive una chiave diversa: NON eredita mai il
    consenso del numero precedente, parte sempre da `Non richiesto`.
  - Student: email scritta su `contacts.emails[emailPrimaria].marketing_consent`
    (`boolean | null`) via `updateStudent`, stessi helper `marketingConsent.ts`
    di sempre (`readStudentEmailConsent`/`withStudentEmailConsent`). Telefono
    scritto su `contacts.phones[telefonoPrimario].marketing_consent`, stessa
    semantica, nuovi helper simmetrici `readStudentPhoneConsent`/
    `withStudentPhoneConsent`. Se non esiste ancora un telefono primario,
    nessun controllo di consenso telefono è mostrato (mai un consenso
    fabbricato per un contatto inesistente).
  - Nessun valore globale di persona in nessuno dei due domini. (L'acquisizione
    Pipeline/CRM riceve comunque la scelta email in parallelo alla
    registrazione — dominio separato, vedi sotto.)
- **Registrazione standalone = scelta obbligatoria, valore opzionale, scope
  EMAIL.** Il tri-state generale del CRM (chiave assente = mai chiesto, valido
  per contatti di altri canali di acquisizione o dati CRM legacy) resta
  **distinto** dall'invariante specifico della registrazione standalone
  TesiCheck: chi completa la registrazione **deve esprimere** una preferenza
  esplicita — `Sì` o `No` alla domanda `Vuoi ricevere la newsletter
  Sottotesi?` — prima di poter creare l'account; il consenso positivo non è
  mai obbligatorio, **esprimerlo lo è**. La registrazione raccoglie solo
  un'email (nessun telefono): la domanda non menziona MAI WhatsApp, telefono
  o un contatto aggiunto in seguito; un telefono aggiunto dopo in Account
  parte sempre con una propria preferenza separata a `Non richiesto`, mai
  ereditata da questa scelta. `RegisterForm` (condiviso da
  `/public/register` e dal checkout in-account) blocca il submit finché non è
  selezionata un'opzione, riusando lo stesso controllo tri-state
  (`CommercialConsentField`) di Account. Il risultato è sempre un booleano
  esplicito, mai `null`, passato a `applyStandaloneRegistrationConsent` dopo
  la verifica email: scrive `Pipeline.marketing_consents[emailVerificata]`
  oppure, per uno Student esistente, `contacts.emails[emailVerificata].marketing_consent`
  — sempre `true`/`false`; in parallelo, `seedStandaloneProfileFromRegistration`
  scrive la stessa scelta su `standaloneProfile.ts` (chiave email). Di
  conseguenza l'Account standalone non mostra mai lo stato sconosciuto (radio
  non selezionati) per l'email dell'account verificato di una registrazione
  TesiCheck completata; quello stato resta legittimo solo per contatti CRM
  non originati da questa registrazione (Pipeline/Student pre-esistenti
  risolti per email, o il fallback `new_pipeline` per account pre-regola) —
  e resta sempre legittimo per il telefono, che la registrazione non tocca
  mai. Non è stato introdotto alcun consenso "positivo" obbligatorio, né
  alcuna coercizione di un valore sconosciuto a `false`.
- **Admin (Slice D)** → Pipeline: consenso per contatto (email E telefono, già
  supportato prima di questo workstream) con controllo tri-state esplicito
  (`Non richiesto` rimuove la chiave = ritorno a sconosciuto), più una sintesi
  persona derivata nella list/card/drawer. Student: consenso tri-state
  **dentro ogni card email E ogni card telefono** del drawer (`ContactManager`,
  `mode='student'`) come unica superficie di editing (nessun toggle nel
  kebab), persistito dal normale `Salva modifiche`; la list/card mostra una
  sola pill di triage derivata dalle email E dai telefoni correnti
  (`deriveStudentRecontactSummary(emails, phones)`). `Non richiesto` / chiave
  assente ≠ `Non consentito`. L'accesso ai servizi dello Student **non** si
  gestisce dal drawer contatti: owner = `TimelineDrawer` (`/coaching/timeline`).
  Contatti ⇎ accesso ⇎ consenso sono domini separati. Pipeline non ha
  richiesto alcuna modifica di modello o di architettura del drawer: solo
  l'estensione Student ha richiesto un cambiamento.

I due modelli di storage (Pipeline `Record<string,boolean>` per-contatto vs
Student `marketing_consent` per contatto sul record email/telefono) **non**
sono unificati in un'unica superficie di editing: condividono solo il
vocabolario di visualizzazione e il componente `MarketingConsentSelect`. Il
legacy globale `Student.marketing_consent` è deprecato e non più usato.

**La produzione possiede**: provenienza (chi ha registrato il consenso e da dove),
timestamp, versioning del testo legale, audit log immutabile, evidenza legale,
eventuale double opt-in. Il prototipo non li modella e non dichiara conformità
legale. Wording finale delle checkbox, base giuridica, titolare del trattamento,
retention e URL delle policy restano responsabilità di cliente/legale.

## Modifica email (cambio email account)

Entrambe le superfici Account (`/public-view/account`, `/student-view/account`)
espongono ora `Modifica email` sulla riga dell'email account/primaria. Regola
canonica: **nuovo indirizzo → verifica → sostituzione confermata**. Nessuna
sostituzione silenziosa inline: l'email è sia identità di accesso sia contatto
di servizio, quindi cambiarla richiede lo stesso rigore di un cambio identità,
non la stessa semantica di un campo di testo qualunque.

- **Modale condiviso a tre step** (`ChangeEmailModal.tsx`), stesso guscio
  prototipale già in uso (`StandaloneProfileCompletionModal`), nessun nuovo
  linguaggio visivo. **Step 0 — `Conferma la tua identità`** (nuovo): chiede
  la password attuale prima di lasciar digitare una nuova email — comunica
  che cambiare l'identità di accesso è un'azione sensibile, la STESSA UX su
  Public e Student, mai accoppiata al registry standalone
  `tesicheck-registered-accounts-v1` né a un equivalente Student (che non
  esiste); nel prototipo qualunque password non vuota fa proseguire
  (`Inserisci la password attuale.` se vuota, resta sullo step) — **non è
  un controllo di credenziali reale**, vedi sotto. Step 1: nuova email
  (validazione: non vuota, formato valido, diversa dall'attuale, più un
  controllo di collisione economico dove disponibile — solo standalone, via
  il registry `tesicheck-registered-accounts-v1`; lo Student non ha un
  registry equivalente, quindi nessun controllo di unicità è offerto lì).
  Step 2: verifica — **stessa regola prototipale della verifica di
  registrazione esistente** (`VerifyEmailForm`): un codice a 6 cifre
  qualsiasi, ben formato, è sufficiente; nessun codice "corretto" nascosto,
  nessun suggerimento/nota per sviluppatori visibile nella UI (una bozza
  iniziale introduceva un codice demo `123456` con una nota inline — rimossi
  in revisione per allinearsi esattamente alla convenzione di registrazione:
  una superficie rivolta all'utente non deve mostrare copy da sviluppatore).
- **La verifica resta l'UNICO punto di mutazione**, invariato dall'aggiunta
  dello Step 0. Nessuna scrittura — sessione, registry, Profilo standalone,
  contatto Student, o una qualsiasi forma di "email in sospeso" — avviene
  prima che il codice passi il controllo di formato. Annullare prima della
  verifica (Step 0 o Step 1: X/Annulla, chiusura immediata, nessuna
  conferma — la password digitata allo Step 0 non è mai persistita né
  controllata contro nulla di reale, quindi non c'è nulla da perdere
  silenziosamente) lascia l'account invariato. Allo Step 2, l'utente ha già
  proceduto oltre, quindi chiudere (X o click sull'overlay) chiede prima
  conferma con un piccolo dialogo impilato (`Annullare la modifica
  dell'email?` / `La nuova email non verrà salvata.`, azioni `Continua
  modifica` / `Annulla modifica`) — `Annulla modifica` scarta l'intero
  flusso, Step 0 incluso: ricominciare richiede di nuovo la password.
  `Indietro` resta un passo indietro nel flusso (solo Step 2 → Step 1, non
  torna allo Step 0), non una chiusura, e non chiede mai conferma. In ogni
  caso nessuna email "in sospeso" viene mai persistita: annullare allo Step
  2 non riserva l'indirizzo tentato — un nuovo tentativo con lo stesso
  indirizzo successivamente ripete semplicemente la normale
  validazione/controllo di collisione, come se fosse il primo tentativo.
- **Step 0 — nota di produzione esplicita.** Questo step comunica SOLO che
  una sostituzione dell'identità di accesso richiede ri-autenticazione prima
  di procedere — non prescrive COME: la produzione può implementarla con
  password attuale, ri-autenticazione basata su recency della sessione, MFA,
  o un altro meccanismo del proprio auth-provider. Il prototipo non
  implementa e non dichiara nessuna di queste scelte (storage password, regole
  MFA, soglie di età sessione, API di un provider) — chiede deliberatamente
  la STESSA UX su Public e Student, senza validare la password contro il
  registry standalone (che pure esiste ed è tecnicamente ispezionabile) né
  inventare un equivalente Student: farlo avrebbe implicato semantiche di
  validazione diverse tra i due ruoli, che questo step evita apposta.
- **Al successo**: il modale si chiude, la pagina Account mostra
  immediatamente il nuovo indirizzo, appare la conferma transitoria condivisa
  (`Email aggiornata`, stesso meccanismo `sonner` `toast` già in uso), si
  resta sulla pagina Account (nessun redirect).
- **Il consenso NON si trasferisce.** Perché il consenso appartiene al
  contatto esatto (MODEL B, vedi "Consenso comunicazioni commerciali" sopra),
  la preferenza newsletter del nuovo indirizzo parte sempre non espressa (né
  Sì né No) — mai copiata dal vecchio indirizzo (né `true→true` né
  `false→false`).
  - Standalone: `changeAccountEmail` (`tesicheckAccountSession.ts`) rinomina
    la voce del registry `tesicheck-registered-accounts-v1` e aggiorna
    l'email della sessione; `renameStandaloneProfileEmail`
    (`standaloneProfile.ts`) sposta l'INTERO record `StandaloneProfile`
    (anagrafica, telefono, `academic_records[]`) dalla vecchia alla nuova
    chiave email, senza mai seminare la nuova chiave di
    `commercial_consents` dal valore precedente. La vecchia chiave, se
    presente, resta sul posto ma inerte — stessa convenzione già usata per
    un numero di telefono sostituito.
  - Student: `withStudentPrimaryEmailChanged` (locale a
    `student/AccountPage.tsx`) sostituisce **solo** il valore `.email` della
    voce `contacts.emails[]` con `is_primary === true`, preservando
    `is_primary`, `purposes`, `source`/`added_at` e ogni altro contatto
    (email o telefono); `marketing_consent` su quella stessa voce viene
    azzerato (tornando a non espresso) nella stessa scrittura. Nessun
    consenso globale Student è stato introdotto; nessuna infrastruttura di
    autenticazione è stata aggiunta al modello Student.
- **Fuori scope, deliberatamente non costruito**: ri-autenticazione reale
  (lo Step 0 comunica solo il requisito, vedi sopra — nessuno storage
  password, nessuna regola MFA, nessuna soglia di sessione è implementata),
  invio email reale, gestione conflitti di unicità lato produzione,
  scadenza/reinvio del codice, rate limiting, token di sicurezza,
  invalidazione sessione lato produzione, persistenza di un'email "in
  sospeso", opzione self-service per mantenere il vecchio indirizzo come
  contatto secondario (decisione di backend/CRM, non di questo prototipo).

**La produzione deve fornire**: ri-autenticazione/verifica di sicurezza dove
necessario, ciclo di vita reale del token di verifica, risoluzione dei
conflitti di unicità email, invio email reale, sostituzione dell'identità di
sessione/account, sincronizzazione CRM/Profilo, audit/log di sicurezza, e la
decisione se il vecchio indirizzo resti come contatto CRM secondario. Questo
prototipo comunica solo il contratto UX atteso.

## Ciclo di vita self-service Student — assunzione di prototipo

`/student-view/account` (e, per estensione, l'intera vista Student
autenticata) rappresenta **sempre un account self-service già attivo**. Il
prototipo non implementa né verifica gli stati intermedi che precedono
quell'attivazione — li assume già conclusi.

Flusso concettuale di produzione (non implementato qui):

```text
Admin crea il record Student (operativo, senza login)
→ invito / attivazione dell'account self-service
→ l'utente accetta i Termini e condizioni
→ l'utente prende visione dell'Informativa privacy
→ l'accesso self-service Student diventa attivo
```

Da questa assunzione derivano due scelte UI deliberate, nessuna delle quali
aggiunge campi al dominio `Student` (`LavorazioniContext.tsx`) solo per
renderle:

- **Stato legale (Student Account)**: nessuna card `Termini e privacy`,
  nessuna riga per-voce — una sola frase secondaria incondizionata, `Hai
  accettato i Termini e condizioni e preso visione dell'Informativa
  privacy.` (mai `Privacy accettata`: la presa visione dell'informativa non
  è consenso commerciale, vedi "Consenso comunicazioni commerciali" sopra).
  Mai `Stato non disponibile`. La frase è scritta direttamente nella pagina,
  non letta da `Student` — non esiste (e non è stato aggiunto) uno stato
  legale nel dominio Student. `Termini e condizioni` resta testo semplice,
  non cliccabile (nessuna destinazione reale nel prototipo); `Informativa
  privacy` è un link reale (`https://www.sottotesi.it/cookie-privacy-policy/`).
- **Password (Student Account)**: la riga Password mostra `Gestisci
  password` ed espone un form inline presentazionale (password attuale /
  nuova / conferma + `Aggiorna password`, validazione locale) — non un
  avviso di funzionalità mancante. Al successo il form si chiude e appare
  una conferma transitoria condivisa (`sonner` `toast`), mai uno stato
  `Password aggiornata.` fisso nella pagina. Nessuna verifica reale, nessuna
  password salvata, nessun token, nessun hashing: lo stato del form non
  sopravvive oltre il componente. Deliberatamente **non**
  instradato sul registry/sessione dell'account standalone TesiCheck
  (`tesicheckAccountSession.ts`, `tesicheck-registered-accounts-v1`): Student
  e standalone restano identità separate, sia nel prototipo che come
  requisito di produzione. Non esisteva un flusso password Student-safe
  riutilizzabile nel repository; questo è il flusso locale più piccolo che
  comunica l'esperienza attesa senza inventare infrastruttura di auth.

**La produzione deve fornire**: lo stato legale/account reale dello Student
(inclusi eventuali stati pendenti/inattivi, se l'onboarding reale li prevede),
l'infrastruttura di invito/attivazione dell'account self-service, e il
sistema di autenticazione/gestione password reale per lo Student — nessuno
dei quali è simulato oltre la UI descritta sopra. Se la produzione ha
bisogno che questa vista rappresenti anche uno stato "non ancora attivo",
questo è un gap reale da colmare con dati reali, non un caso per il testo
hardcoded qui descritto.
