# AGENTS.md

## Prima di intervenire

* Leggi le istruzioni di repository in `.github/copilot-instructions.md`.
* Leggi il documento architetturale richiesto come `ARCHITECTURE.md`; attualmente si trova in `docs/architecture.md`.
* Prima di modificare una vista, leggi il file pertinente: `docs/views/admin.md`, `docs/views/coach.md`, `docs/views/student.md` o `docs/views/public.md`.
* Verifica le indicazioni contro route, componenti e stili realmente presenti.
* Quando documentazione e implementazione divergono, distingui tra:

  * divergenze puramente documentali o obsolete;
  * divergenze che incidono su comportamento, dati, permessi, significato o UX.
* Non correggere implicitamente divergenze che incidono sulle regole del prodotto. Segnalale chiaramente.
* Se una decisione approvata cambia una regola documentata, aggiorna anche la documentazione pertinente.

## Confini architetturali

* Admin, Coach, Student e Public sono contesti applicativi distinti, con dati, permessi, significati e flussi propri.
* Preserva le invarianti di `docs/architecture.md`: route e navigazione restano nel proprio contesto; non esporre viste Coach o Student nella sidebar Admin.
* Layout, Header e Sidebar di ogni vista devono restare separati.
* Non condividere o fondere le shell, inclusi i Container specifici, solo per ridurre duplicazioni superficiali.
* Un componente condiviso deve rappresentare una responsabilità realmente condivisa, non soltanto un aspetto visivo simile.
* Non introdurre feature speculative o non richieste.
* Il progetto è in fase di consolidation, cleanup e rifinitura UI, non di espansione funzionale.
* Un refactoring visuale non deve cambiare dati, significato, stati, permessi o flussi UX senza una decisione esplicita.

## Consolidamento UI

* Cerca e riusa prima componenti e pattern esistenti; crea un nuovo componente solo quando il vocabolario corrente non esprime correttamente il caso.
* Prima di consolidare, identifica componenti duplicati o semanticamente equivalenti e distingui la duplicazione accidentale dalle differenze semanticamente necessarie.
* Unifica varianti visuali solo se le differenze non comunicano informazioni, stati, gerarchie o comportamenti realmente diversi.
* Non perseguire il minor numero assoluto di componenti: mantieni il più piccolo vocabolario coerente necessario all'applicazione.
* Applica lo stesso criterio a badge, button, input, card, container, spacing, typography, colori, border, radius, shadow e ogni altro pattern visuale.
* Usa `src/styles/theme.css` come riferimento per i design token condivisi.
* Non aggiungere valori hardcoded quando esiste un token appropriato.
* Prima di introdurre un nuovo token, verifica se uno esistente può esprimere correttamente lo stesso significato.
* Mantieni consistenza tipografica, cromatica, gerarchica e di contrasto nell'intera applicazione, rispettando le differenze semantiche tra contesti.
* Le differenze visuali devono essere intenzionali e spiegabili attraverso contenuto, stato, gerarchia, comportamento o contesto.

## Cleanup sicuro

* Rimuovi codice, componenti, asset o stili inutilizzati solo dopo aver verificato che non siano referenziati direttamente, importati dinamicamente o necessari a route e flussi esistenti.
* Prima di eliminare un componente apparentemente duplicato, verifica tutti i suoi consumer e confrontane comportamento, props e significato.
* Preferisci modifiche piccole, verificabili e prive di effetti collaterali.
* Non usare il cleanup come occasione per modificare feature o UX non coinvolte nel task corrente.
* Quando incontri una divergenza rilevante, segnalala separatamente invece di risolverla implicitamente.
