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
- **Fuori scope:** sezione `Privacy e consensi` (spazio previsto, non
  implementata), consenso marketing, gestione contatti multipli, eliminazione
  del record accademico corrente, cambio del record corrente, auth Student.
- Presentational primitives condivise con il Public profile in
  `src/app/components/profile/ProfileFormPrimitives.tsx` (`FormSection`,
  `TextField`, `SelectField`, `ReadOnlyField`) — solo presentazione, nessuna
  logica di dominio.

### Ancora incompleto / divergenza nota

- Authenticated `public-view` profilo (`PublicProfilePage`) resta un flusso di
  acquisizione/enrichment Pipeline, distinto dal Profilo Student.
- `CreateStudentDrawer` (edit-mode Admin) usa ancora le etichette accademiche
  vecchie (`Tipo tesi` → `Tipologia`, `Relatore tesi` → `Professore`, `Materia
  di tesi` → `Materia`, `Oggetto tesi` → `Argomento`) e non offre l'opzione
  `Esame`. Allineamento previsto come piccolo follow-up dopo la verifica del
  Profilo. La vocabolario di `InfoCoachingCard` (Timeline) resta invariato: è
  materia del workstream Timeline.

## Product decision still open

### File privacy / retention

La landing afferma che i file non sono conservati e non sono visibili a Sottotesi. Queste affermazioni devono essere confermate rispetto al comportamento production prima dell'handoff finale. Non reinterpretare la policy.

## Prototype-only artifact

Il placeholder Coach Dashboard `Illustrazione / Animazione` e' un artifact del prototipo e non deve essere interpretato automaticamente come UI finale.

## Known intentional distinctions

TesiCheck job status, history/report status e service lifecycle sono domini distinti. Label come `Completato` non implicano lo stesso colore o la stessa semantic tone. Non creare un universal StatusBadge per uniformarli.
