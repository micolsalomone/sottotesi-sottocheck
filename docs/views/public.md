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
  superfici distinte: Profilo = dati personali + arricchimento Pipeline + sezione
  `Comunicazioni` (consenso commerciale, scelta esplicita tri-state, scritto
  all'identità risolta — Pipeline o Student); Account = accesso (email, recupero
  password) + stato Termini/Privacy in sola lettura. Termini/Privacy non stanno
  nel Profilo.
  Si collegano con cross-link reciproci (`Gestisci account e privacy` /
  `Vai al profilo personale`); nessun contenuto duplicato.
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
