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
  ricalcolato), telefono primario (solo gap-fill), e i record in
  `Student.academic_records[]`. Nessuna Pipeline, nessun lead CRM, nessuna
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
  primaria, consenso alle comunicazioni commerciali e Termini/Privacy sono
  tutti sull'Account (`/student-view/account`, sezione `Comunicazioni` per il
  consenso) — non nel Profilo. Vedi "Consenso comunicazioni commerciali".
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
  `Contatti` (solo Telefono — email account e consenso commerciale vivono
  ora su `/public-view/account`, sezione `Comunicazioni`, non qui) →
  `Percorso attuale` + `Percorsi precedenti` — mai
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

- **Termini/Privacy** → superfici Account (`/public-view/account`,
  `/student-view/account`), sola lettura, stato letto dalla persistenza
  prototipo Slice A (registry account); lo Student non ha modello legale →
  `Stato non disponibile`.
- **Consenso commerciale** → **Account** (non più Profilo — regola IA
  canonica corretta, canonical §33.9), scelta esplicita tri-state, **per
  email**, sezione `Comunicazioni` tra `Accesso` e `Termini e privacy`.
  Standalone: scritto su `standaloneProfile.ts` (`commercial_consents[email]`,
  store Profilo-locale, non Pipeline). Student: scritto su
  `contacts.emails[emailPrimaria].marketing_consent` (`boolean | null`) via
  `updateStudent`, stessi helper di `marketingConsent.ts` di sempre. Nessun
  valore globale di persona. (L'acquisizione Pipeline/CRM riceve comunque la
  stessa scelta in parallelo alla registrazione — dominio separato, vedi
  sotto.)
- **Registrazione standalone = scelta obbligatoria, valore opzionale.** Il
  tri-state generale del CRM (chiave assente = mai chiesto, valido per contatti
  di altri canali di acquisizione o dati CRM legacy) resta **distinto**
  dall'invariante specifico della registrazione standalone TesiCheck: chi
  completa la registrazione **deve esprimere** una preferenza esplicita —
  `Sì` o `No` — per le comunicazioni commerciali prima di poter creare
  l'account; il consenso positivo non è mai obbligatorio, **esprimerlo lo è**.
  `RegisterForm` (condiviso da `/public/register` e dal checkout in-account)
  blocca il submit finché non è selezionata un'opzione, riusando lo stesso
  controllo tri-state (`CommercialConsentField`) del Profilo. Il risultato è
  sempre un booleano esplicito, mai `null`, passato a
  `applyStandaloneRegistrationConsent` dopo la verifica email: scrive
  `Pipeline.marketing_consents[emailVerificata]` oppure, per uno Student
  esistente, `contacts.emails[emailVerificata].marketing_consent` — sempre
  `true`/`false`; in parallelo, `seedStandaloneProfileFromRegistration` scrive
  la stessa scelta su `standaloneProfile.ts`. Di conseguenza l'Account
  standalone non mostra mai `Preferenza non ancora espressa` per l'email
  dell'account verificato di una registrazione TesiCheck completata; quello
  stato resta legittimo solo per contatti CRM non originati da questa
  registrazione (Pipeline/Student pre-esistenti risolti per email, o il
  fallback `new_pipeline` per account pre-regola). Non è stato introdotto
  alcun consenso "positivo" obbligatorio,
  né alcuna coercizione di un valore sconosciuto a `false`.
- **Admin (Slice D)** → Pipeline: consenso per contatto con controllo tri-state
  esplicito (`Non richiesto` rimuove la chiave = ritorno a sconosciuto), più una
  sintesi persona derivata nella list/card/drawer. Student: consenso tri-state
  **dentro ogni card email** del drawer (`ContactManager`, `mode='student'`) come
  unica superficie di editing (nessun toggle nel kebab), persistito dal normale
  `Salva modifiche`; la list/card mostra una sola pill di triage derivata dalle
  email correnti (`deriveStudentRecontactSummary`). `Non richiesto` / chiave
  assente ≠ `Non consentito`. L'accesso ai servizi dello Student **non** si
  gestisce dal drawer contatti: owner = `TimelineDrawer` (`/coaching/timeline`).
  Contatti ⇎ accesso ⇎ consenso sono domini separati.

I due modelli di storage (Pipeline `Record<string,boolean>` per-contatto vs
Student `marketing_consent` per email sul contact record) **non** sono unificati
in un'unica superficie di editing: condividono solo il vocabolario di
visualizzazione e il componente `MarketingConsentSelect`. Il legacy globale
`Student.marketing_consent` è deprecato e non più usato.

**La produzione possiede**: provenienza (chi ha registrato il consenso e da dove),
timestamp, versioning del testo legale, audit log immutabile, evidenza legale,
eventuale double opt-in. Il prototipo non li modella e non dichiara conformità
legale. Wording finale delle checkbox, base giuridica, titolare del trattamento,
retention e URL delle policy restano responsabilità di cliente/legale.
