# Vista Coach — Guidelines

## A chi è rivolta
Coach che seguono studenti nel percorso tesi. Accesso solo via URL diretto.

## Path
`/coach-view` — Layout: `src/app/components/coach/CoachLayout.tsx`
Pagine: `src/pages/coach/`

## Scopo
Il coach controlla il completamento degli step, revisiona documenti,
aggiunge note, avvia check plagio. Solo il coach può marcare uno step come completato.

## Principi
- MVP, preferire riuso di pattern dalla Student Dashboard
- Nessuna complessità admin-level
- Il coach è sempre nel contesto di uno studente specifico
- Nessuna lista globale studenti in stile admin

## Timeline
- Struttura verticale per step (uguale a student view)
- Step corrente sempre evidenziato
- Step = thread contestuale (documenti + note + revisioni)
- Non separare activity log in sezione separata

## Azioni disponibili per step
- Leggi / scarica documenti
- Carica documenti revisionati
- Aggiungi note (asincrone, non chat)
- Avvia check plagio
- Marca step come completato (esplicito e manuale)

## Navigazione
- Topbar: ruolo coach + contesto studente corrente
- Accesso a profilo studente (drawer o vista secondaria)
- ❌ Nessuna azione admin-only esposta

## Regole di isolamento
- Non condividere CoachLayout con altre viste
- Non esporre azioni admin nel topbar coach