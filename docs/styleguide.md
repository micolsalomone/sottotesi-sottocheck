# Styleguide — Sottotesi

## Scopo

Questa guida documenta e razionalizza il sistema visuale esistente. Non definisce un redesign, non richiede rinomini di token e non implica la normalizzazione automatica di implementazioni o valori eccezionali che abbiano una responsabilita' chiara.

Il nome visibile del prodotto e' sempre **TesiCheck**. Gli identificatori tecnici legacy che contengono `sottocheck` possono rimanere invariati.

## Principi visivi

- La UI applicativa e' **neutral-first**: bianco, grigi, near-black, bordi e gerarchia tipografica svolgono la maggior parte del lavoro visivo.
- Il colore e' intenzionale: comunica semantica, selezione, categoria oppure un momento espressivo del brand.
- Le superfici sono prevalentemente bianche e neutre. Bordi e tipografia sono preferibili a riempimenti cromatici per costruire gerarchia.
- L'elevation e' contenuta e riservata a indicare layering, non a decorare ogni superficie.
- Il colore non deve mai essere l'unico portatore di informazione: stato, selezione e categoria devono avere anche un'etichetta, un'icona, una forma, un testo o un altro segnale accessibile.

## Colore e responsabilita'

I token esistenti restano invariati. In particolare, `--primary` e' oggi verde e viene gia' usato in molti contesti: non va cambiato semanticamente o rinominato attraverso questa guida.

Concettualmente, le seguenti responsabilita' restano distinte anche quando l'implementazione corrente usa token o valori coincidenti:

- `action-primary`: azione primaria ad alta enfasi. Il relativo bottone usa near-black come sfondo e bianco come foreground; nel sistema corrente questo corrisponde al pattern `.btn-primary` con `--foreground` e `--background`.
- `brand`: identita' espressiva del prodotto. Il verde Sottotesi esistente, oggi esposto da `--primary`, rimane il colore brand corrente.
- `status-success`: esito positivo o completamento quando il contesto lo definisce come tale. Non va dedotto automaticamente dal verde brand.

Le primitive esistenti che usano ancora il verde come variante `default` non devono essere modificate globalmente come conseguenza di questa regola. La loro migrazione va valutata durante il consolidamento specifico del sistema Button.

`#FF7B00` e' una possibile futura brand accent color. Va usato con cautela per marketing, upsell, onboarding, sticker, illustrazioni, empty state e piccoli highlight espressivi. Non e' un semantic warning e non deve essere usato come tale.

Il warning resta `#F79009` (`--warning`). Il lime `#D5FF00` (`--accent`) resta disponibile e non va sostituito automaticamente dall'arancio futuro.

### Stati, categorie e report

- I colori delle categorie e i colori degli status semantici sono concetti distinti.
- Non normalizzare globalmente gli stati denominati "Completato": il loro significato puo' variare secondo il contesto applicativo.
- I colori specifici di TesiCheck per match `identical`, `minor` e `semantic` restano distinti dagli status generici dell'applicazione. Non vanno reinterpretati come success, warning o destructive.
- Se il colore comunica selezione, la selezione deve rimanere leggibile anche con indicatori non cromatici, come bordo, testo, icona o stato del controllo.

### Separazione dei ruoli cromatici

Queste equivalenze non devono essere assunte:

- `action-primary != brand`
- `brand != status-success`
- `brand-accent != status-warning`

Due ruoli possono temporaneamente condividere lo stesso valore cromatico senza diventare semanticamente equivalenti.

## Tipografia

La baseline esistente usa Alegreya per titoli e Inter per contenuti, navigazione e controlli.

| Famiglia | Ruolo | Dimensione | Token |
| --- | --- | ---: | --- |
| Alegreya | Page title | 36px | `--text-h1` |
| Alegreya | Section title | 30px | `--text-h2` |
| Alegreya | Content/card heading | 24px | `--text-h3` |
| Alegreya | Small heading | 20px | `--text-h4` |
| Inter | Body/navigation/action | 16px | `--text-base` |
| Inter | Label/table | 14px | `--text-label` |
| Inter | Metadata/helper | 12px | `--text-sm` |
| Inter | Micro-label/badge | 11px | `--text-xs` |

Valori tipografici eccezionali gia' presenti non vanno normalizzati automaticamente quando assolvono una responsabilita' chiara, ad esempio leggibilita' del documento, densita' informativa o adattamento responsive.

`--text-xl: 20px` e' attualmente usato per UI section heading in Inter semibold; non e' semanticamente equivalente a `--text-h4` nonostante condivida la dimensione. Un'eventuale rinomina verso un token piu' semantico va affrontata solo durante una revisione tipografica dedicata.

## Forma, superfici ed elevation

- Il radius predefinito e' 8px (`--radius`) per controlli, card e contenitori.
- Badge e pill possono usare 16px (`--radius-badge`) quando la forma comunica correttamente un elemento compatto o categoriale.
- Superfici di card, popover e input fanno riferimento ai token neutri esistenti, in particolare `--card`, `--popover`, `--input-background` e `--border`.
- `--elevation-sm`, `--elevation-md` e `--elevation-lg` sono nomi legacy/compatibility, non una scala visiva automaticamente crescente. Popover, modal, drawer e sticky elements hanno responsabilita' differenti; una futura revisione dedicata potra' sostituire i nomi dimensionali con ruoli semantici, ma non durante il cleanup corrente.

## Interazione e accessibilita'

- Ogni controllo interattivo deve avere uno stato `:focus-visible` percepibile, coerente con `--ring` o con un indicatore equivalente che garantisca contrasto e chiarezza.
- Hover, active, selected, disabled e destructive devono essere distinguibili senza affidarsi al solo colore.
- Il primary high-emphasis button e' near-black con foreground bianco; gli altri controlli mantengono gerarchie neutre o responsabilita' semantiche esplicite.

## Consolidamento e contesti

- Il cleanup deve ridurre duplicazioni accidentali, preservando differenze necessarie di significato, stato, gerarchia, comportamento o contesto.
- Prima di consolidare un pattern, verificare che sia semanticamente equivalente oltre che visivamente simile.
- Admin, Coach, Student e Public mantengono shell applicative separate. Layout, Header e Sidebar non vanno fusi solo per somiglianza visuale.
- I token condivisi restano in `src/styles/theme.css`; questa guida non introduce nuovi token o componenti.

## Strategia di evoluzione

La styleguide descrive il target semantico, ma la migrazione del codice è incrementale.

Quando si interviene su un'area:

1. correggere prima eventuali problemi di correctness;
2. preservare il comportamento esistente;
3. verificare accessibilità e significato;
4. consolidare solo duplicazioni accertate;
5. introdurre nuovi token o varianti solo quando il refactoring concreto li richiede.

Non effettuare migrazioni globali esclusivamente per allineare il codice alla terminologia della styleguide.
