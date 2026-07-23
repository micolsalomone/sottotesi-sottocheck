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

- Dashboard sintetica
- Sottocheck
- Storico
- Profilo

## Dashboard marketing

- Prevedere aree dedicate a copy marketing per vendere i percorsi coaching
- Prevedere slot grafici per sticker PNG trasparenti (placeholder sostituibili con asset reali)
- Usare CTA chiare verso richiesta informazioni coaching

## Regole di isolamento

- Header, Sidebar e Layout di public-view sono custom e indipendenti
- Non condividere la shell di public-view con student-view o coach-view
