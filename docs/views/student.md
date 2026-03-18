# Vista Student — Guidelines

## A chi è rivolta
Studenti nel percorso tesi. Accesso solo via URL diretto.

## Path
`/student-view` — Layout: `src/app/components/student/StudentLayout.tsx`
Pagine: `src/pages/coach/` (riuso, stessa UX della coach view)

## Scopo
Lo studente segue il proprio percorso, carica documenti, aggiunge note.
Deve sempre capire dove si trova, qual è lo step corrente, cosa può fare ora.

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

## Navigazione
- Topbar minimale e coerente con sottotesi.it
- Terminologia: "coach" (mai "tutor")
- ❌ No concetti "home" duplicati

## Regole di isolamento
- Header, Sidebar e Layout di student-view sono custom e indipendenti
- Non condividere StudentLayout con altre viste