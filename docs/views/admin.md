# Vista Admin — Guidelines

## A chi è rivolta
Amministratori del sistema. Uso sporadico, operativo, correttivo.

## Path
`/` — Layout: `src/app/components/AdminLayout.tsx`

## Scopo
Controllare che il sistema funzioni, gestire utenti/ruoli/stati.
NON è una dashboard analitica. NON duplica funzioni coach/student.

## Principi (non negoziabili)
- MVP vero: niente feature speculative
- CRUD first: liste, stati, azioni chiare
- Una schermata = una responsabilità
- Se togli una feature e nessuno se ne accorge → era giusto non metterla

## Criterio per ogni elemento UI
Serve a correggere / abilitare / disabilitare / rimuovere?
→ Sì: mostralo. No: non mostrarlo.

## Struttura navigazione (sidebar)
1. Dashboard — stato del sistema, card semplici, nessun grafico
2. Utenti — tabella con Nome, Ruolo, Stato, Ultima attività, Azioni
3. Percorsi — lista con stato, coach assegnati, numero studenti
4. Documenti — tabella con moderazione (rimuovi/nascondi/scarica)
5. Attività / Log — audit cronologico, filtri base
6. Impostazioni — solo sistemiche (ruoli, permessi globali)

## Tono microcopy
Diretto, neutro, operativo. Es: "Disattiva utente", "Percorso archiviato".
❌ No linguaggio empatico. ❌ No CTA motivazionali.

## Componenti condivisi rilevanti
- `DrawerPrimitives.tsx` — usare sempre per nuovi drawer, mai ridefinire stili inline
- Animazioni drawer: definite in `dashboard.css`, non ridefinirle