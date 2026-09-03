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
- Student profile.
- Authenticated `public-view` quando riusa la Student profile.

## Product decision still open

### File privacy / retention

La landing afferma che i file non sono conservati e non sono visibili a Sottotesi. Queste affermazioni devono essere confermate rispetto al comportamento production prima dell'handoff finale. Non reinterpretare la policy.

## Prototype-only artifact

Il placeholder Coach Dashboard `Illustrazione / Animazione` e' un artifact del prototipo e non deve essere interpretato automaticamente come UI finale.

## Known intentional distinctions

TesiCheck job status, history/report status e service lifecycle sono domini distinti. Label come `Completato` non implicano lo stesso colore o la stessa semantic tone. Non creare un universal StatusBadge per uniformarli.
