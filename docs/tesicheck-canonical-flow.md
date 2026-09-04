# TesiCheck — Canonical Service Flow

> Source of truth UX/product per il redesign del flow TesiCheck nel prototipo.  
> Questo documento descrive **comportamento, stati, responsabilità e transizioni** da preservare in production.  
> Non prescrive l'implementazione tecnica finale.

## 1. Obiettivo

TesiCheck deve essere trattato come **un unico servizio** accessibile da contesti diversi:

- landing pubblica `/public`;
- area autenticata standalone `/public-view`;
- Student;
- Coach;
- Admin.

Le differenze tra i ruoli riguardano soprattutto:

- come viene determinato il contesto del check;
- chi è l'owner;
- entitlement / crediti / pagamento;
- quali metadati e azioni vengono mostrati.

Il core flow di upload, validazione, check, report e storico resta concettualmente unico.

---

## 2. Distinzione critica: `/public` vs `/public-view`

### `/public`

È la landing pubblica e il punto di acquisition.

Può ospitare un **guest pre-check** per ridurre la friction prima della registrazione.

### `/public-view`

È l'area autenticata dell'utente standalone TesiCheck.

Il naming tecnico è legacy ma non va interpretato semanticamente come “public”.

Da quando esiste ownership persistente del check, il flusso deve vivere nell'area autenticata.

---

## 3. Due oggetti concettuali

### 3.1 Pre-check session temporanea

Il guest può arrivare fino alla conoscenza del prezzo senza creare ancora un check persistente.

```text
upload temporaneo
→ validazione
→ conteggio caratteri
→ calcolo prezzo
```

La pre-check session:

- non è uno storico;
- non è un report;
- non è un pagamento;
- non deve essere trattata come un TesiCheck persistente;
- deve poter essere associata all'account dopo login/registrazione.

Nel prototipo la sessione può contenere un riferimento temporaneo demo al documento:

```text
temporaryDocumentRef
```

che simula un upload temporaneo recuperabile lato server/storage in production.

### 3.2 TesiCheck persistente

Nasce solo quando esiste un'identità persistente e, dove richiesto, il pagamento o entitlement è stato validato.

```text
owner/account
→ pagamento o entitlement
→ avvio check
→ report
→ storico
→ retention / expiry
```

Regola di prodotto:

> **Nessun pagamento senza un'identità persistente a cui associare il check.**

---

## 4. Canonical standalone journey

Flow principale per un visitatore che arriva dalla landing.

```text
/public
  ↓
Landing TesiCheck
  ↓
Upload documento
  ↓
Validazione
  ↓
Conteggio caratteri
  ↓
Prezzo mostrato
  ↓
[Procedi al pagamento]
  ↓
CHECKOUT
  ↓
Riepilogo TesiCheck sempre visibile
  ↓
ACCOUNT STEP
  ├── Accedi
  └── Crea account
  ↓
Claim della pre-check session
  ↓
PAYMENT STEP
  ↓
[ Vai al pagamento ]
  ↓
PAYMENT GATEWAY INTERSTITIAL
  ↓
provider esterno
  ↓
ritorno nell'applicazione
  ├── success
  ├── failed
  └── cancelled
  ↓
se success:
verifica pagamento
  ↓
breve elaborazione tecnica
  ↓
/public-view/report/:checkId
  ↓
Storico
  ↓
Disponibile 30 giorni
  ↓
Scaduto
```

### Principio di continuità

L'autenticazione **fa parte del checkout**.

Non deve succedere:

```text
guest
→ login
→ dashboard
→ ricomincio il pagamento
```

Deve succedere:

```text
guest pre-check
→ checkout
→ login/registrazione
→ stesso checkout
→ pagamento
→ report nella dashboard
```

---

## 5. Checkout e account gate

L'account gate compare **dopo che l'utente conosce il prezzo** e **prima del pagamento**.

### Obiettivo UX

Preservare il beneficio:

> “Fammi sapere prima se il documento è valido e quanto costa; poi chiedimi di registrarmi.”

senza permettere un acquisto anonimo non recuperabile.

### Checkout responsibility

Account/login e pagamento sono step della stessa esperienza checkout.

Il riepilogo deve rimanere visibile durante:

```text
account
→ payment
```

e mostrare almeno:

- nome documento;
- character count;
- prezzo totale.

Nello stato `redirecting` il riepilogo non è più visibile: quella schermata è una transizione di sistema minimale con brand mark Sottotesi, non un altro step del checkout.

### Account step: login e registrazione dentro il checkout

La schermata account non deve essere un semplice gate con due bottoni.

È direttamente il **form di autenticazione del checkout**, con il riepilogo TesiCheck sempre visibile.

### Riepilogo TesiCheck persistente durante il checkout

Durante tutto il funnel di acquisto il riepilogo resta il punto fermo della pagina.

Deve essere visibile durante:

```text
login
→ registrazione
→ verifica email
→ eventuali dati strettamente necessari
→ pagamento
```

Dopo che l'utente conferma il pagamento si entra nello stato `redirecting`: qui il riepilogo non viene più mostrato, resta solo una transizione minimale con brand mark Sottotesi verso il provider.

Il riepilogo non va chiamato “riepilogo pagamento” durante gli step precedenti al gateway.

Preferire:

- `Riepilogo TesiCheck`
- oppure `Riepilogo ordine`

Contenuto minimo stabile:

- nome documento;
- character count;
- totale.

La sidebar non deve cambiare responsabilità a ogni step: rappresenta sempre l'acquisto corrente.

#### Desktop

Pattern consigliato:

```text
┌──────────────────────────────────┬───────────────────────┐
│ step corrente                    │ Riepilogo TesiCheck   │
│                                  │                       │
│ login / registration / verify    │ Documento.pdf         │
│ / payment                        │ 28.500 caratteri      │
│                                  │                       │
│ azione principale                │ Totale        €14,90  │
└──────────────────────────────────┴───────────────────────┘
```

Il riepilogo può essere sticky se compatibile con il layout.

#### Mobile

Non mantenere due colonne.

Usare un riepilogo compatto stacked, eventualmente collassabile:

```text
Riepilogo TesiCheck · €14,90
[Mostra dettagli]
```

#### Regola di scope

Il checkout non deve diventare onboarding.

Raccogliere qui solo dati necessari a:

- autenticazione;
- ownership;
- verifica email;
- pagamento;
- fatturazione, se realmente richiesta.

Non raccogliere durante il checkout dati di profilo non necessari all'acquisto, per esempio:

- università;
- corso di laurea;
- interessi;
- preferenze;
- dati di onboarding non indispensabili.

Questi appartengono al Profilo o a momenti successivi.

#### Login

La colonna principale mostra almeno:

```text
Accedi per continuare

Email
[________________]

Password
[________________]

[ Accedi e continua ]

Password dimenticata?

Non hai ancora un account?
[ Crea account ]
```

Il riepilogo ordine resta visibile a fianco e mostra almeno:

- documento;
- character count;
- totale.

La CTA preferita è **`Accedi e continua`**, non semplicemente `Accedi`, perché deve comunicare che il login è uno step di un acquisto già iniziato.

#### Registrazione

`Crea account` non deve portare fuori dal checkout.

La stessa area principale passa al form di registrazione, per esempio:

```text
Crea il tuo account

Nome
Email
Password
Conferma password

[ Crea account e continua ]

Hai già un account?
Accedi
```

Il riepilogo TesiCheck rimane invariato.

#### Verifica email

Per una nuova registrazione, l'email deve essere verificata prima del pagamento.

La verifica avviene nello stesso checkout e mantiene il riepilogo visibile.

Esempio:

```text
Verifica la tua email

Abbiamo inviato un codice a
utente@example.com

[ _ _ _ _ _ _ ]

[ Conferma email ]
```

Dopo verifica riuscita:

```text
account verified
→ payment
```

Non introdurre una pagina autonoma “Account confermato”.

Regola:

> `payment_enabled = authenticated account + verified email`

Nel prototipo invio e conferma possono essere simulati, ma il comportamento UX deve rappresentare il flow production.

#### Utente già autenticato

Se l'utente è già autenticato prima di iniziare il checkout:

```text
quote
→ checkout
→ payment
```

Lo step account viene saltato.

### Dopo autenticazione

Dopo login/registrazione:

- la pre-check session viene claimed dall'account;
- documento, count e prezzo non devono essere persi;
- l'utente **resta nel checkout**;
- si passa direttamente allo step pagamento.

Non usare una pagina intermedia autonoma “Account completato”.

L'account completato è solo uno stato secondario del checkout, ad esempio:

```text
✓ Account
utente@email.it

Pagamento
[ Vai al pagamento ]
```

### Da non replicare

La vecchia logica:

> “Salva l'accesso al report via email (facoltativo)”

è obsoleta.

L'email:

- non è ownership;
- non è recovery primaria;
- può essere usata per notifiche.

---

## 6. Lifecycle della pre-check session

La sessione temporanea deve distinguere lo stato del journey.

Concettualmente:

```text
quote_ready
checkout_account
checkout_payment
redirecting
```

Non è necessario introdurre una state machine complessa.

### Landing

Se:

```text
flowStage = quote_ready
```

mostrare:

- documento;
- count;
- prezzo;
- `Procedi al pagamento`.

Se il checkout è già iniziato:

```text
checkout_account
checkout_payment
redirecting
```

la landing NON deve mostrare di nuovo lo stato iniziale come se il pagamento non fosse mai partito.

Mostrare invece uno stato di resume, ad esempio:

```text
Hai un TesiCheck in corso

Documento.pdf
28.500 caratteri · €14,90

[Riprendi il checkout]
```

La sessione non va cancellata semplicemente tornando sulla home.

---

## 7. Payment gateway interstitial

Il prototipo deve includere una **schermata di intermezzo esplicita per il payment gateway**, anche se il pagamento reale non è implementato.

Questa schermata serve a rendere chiaro al developer il boundary tra:

- TesiCheck application;
- payment provider;
- ritorno dal provider.

### 7.1 Prima del redirect

Mostrare un riepilogo minimo:

- documento;
- caratteri conteggiati;
- prezzo;
- account/email associato;
- eventuale riferimento ordine/check.

CTA primaria:

**Vai al pagamento**

Microcopy:

> Verrai reindirizzato al provider di pagamento per completare la transazione.

### 7.2 Stato di redirect

Prevedere una schermata/interstitial:

**Reindirizzamento al pagamento**

con:

- indicatore di caricamento;
- provider placeholder/generico;
- nessuna falsa UI bancaria;
- azione secondaria per annullare e tornare a TesiCheck, se compatibile con il flow.

In questo stato il riepilogo ordine non è visibile: la schermata mostra solo un brand mark Sottotesi minimale, senza topbar, come transizione di sistema.

Questa schermata NON deve fingere di essere il gateway reale.

### 7.3 Ritorno dal gateway

Gestire almeno tre outcome UX:

#### Pagamento riuscito

```text
payment_success
→ verifica lato applicazione
→ breve check processing
→ report
```

Non introdurre una pagina celebrativa separata “Pagamento completato”.

La conferma può essere assorbita nella transizione:

```text
✓ Pagamento ricevuto
Stiamo generando il report...
```

e poi portare direttamente al report.

#### Pagamento fallito

```text
payment_failed
→ nessun check avviato
→ possibilità di riprovare
```

Mostrare:

- errore chiaro;
- prezzo/ordine conservati;
- CTA `Riprova pagamento`.

#### Pagamento annullato

```text
payment_cancelled
→ nessun check avviato
→ ritorno allo step pagamento
```

Non trattarlo come errore tecnico.

### 7.4 Regola tecnica da comunicare al dev

Il prototipo può simulare il gateway, ma production deve verificare lo stato pagamento tramite integrazione reale.

Il client non deve essere source of truth per:

- pagamento riuscito;
- importo finale;
- creazione del check pagato.

---

## 8. Context binding per ruolo

### 8.1 Guest `/public`

Prima dell'autenticazione:

- nessun owner persistente;
- upload temporaneo;
- validazione;
- conteggio;
- prezzo;
- checkout con account gate prima del pagamento.

### 8.2 Authenticated standalone user `/public-view`

Owner:

**account corrente**

Non deve selezionare altro prima dell'upload.

Se avvia un nuovo check dall'area privata:

```text
upload
→ validazione
→ conteggio/prezzo
→ payment step
→ gateway
→ report
```

Lo step account non serve perché l'utente è già autenticato.

### 8.3 Student

Owner:

**studente corrente**

Lo Student può eseguire un TesiCheck autonomamente, ma **il check personale è a pagamento**.

Avere un percorso coaching attivo NON dà allo Student un entitlement TesiCheck personale e NON gli permette di consumare la quota assegnata al percorso.

Flow canonico Student:

```text
Student già autenticato
→ upload
→ validazione
→ conteggio/prezzo
→ checkout payment
→ gateway
→ breve processing
→ report nella Student shell
```

Caratteristiche:

- nessun account step, perché lo Student è già autenticato;
- payment gateway **obbligatorio** per il check autonomo;
- nessun consumo della quota coaching da parte dello Student;
- nessun success page intermedio;
- dopo pagamento verificato: breve loading → report.

La quota TesiCheck associata al coaching può essere usata **solo dal Coach** quando esegue il check nel contesto di un percorso attivo.

### 8.4 Coach

Il Coach ha **due modalità d'uso** dello stesso TesiCheck.

#### Modalità A — Percorso coaching

Il Coach seleziona un percorso attivo:

```text
modalità: percorso coaching
→ seleziona percorso
→ verifica quota/usage limit
→ upload
→ avvia controllo
→ breve processing
→ report
```

Caratteristiche:

- check legato al percorso/student;
- utilizza quota/usage limit definita da Admin;
- nessun payment gateway;
- nessuna pagina di successo pagamento;
- nessun checkout consumer.

#### Modalità B — Check libero a pagamento

Il Coach può usare TesiCheck per:

- lavori esterni al coaching;
- check indipendenti;
- uso oltre la quota inclusa.

Flow:

```text
modalità: check libero
→ upload
→ validazione
→ conteggio/prezzo
→ checkout payment
→ gateway
→ breve processing
→ report
```

Il Coach è già autenticato, quindi:

- non deve vedere account/login;
- entra direttamente nello step pagamento;
- riusa il checkout/payment boundary del standalone authenticated user.

#### Quota coaching esaurita

Se il Coach seleziona un percorso senza disponibilità:

```text
Crediti TesiCheck esauriti per questo percorso
```

Azioni possibili:

- `Esegui un check a pagamento`
- `Scegli un altro percorso`

Passare al check a pagamento significa cambiare modalità:

```text
coaching_entitlement
→ paid_free_check
```

Non associare automaticamente il check pagato al percorso coaching.

Un eventuale collegamento opzionale futuro è una decisione separata.

### 8.5 Admin

L'Admin opera con privilegi applicativi.

Flow:

```text
seleziona studente
→ seleziona percorso/lavorazione
→ upload
→ avvia controllo
→ breve processing
→ report
```

Per Admin:

- nessun payment gateway;
- nessun checkout consumer;
- nessuna pagina “Pagamento completato”;
- nessun success state non necessario.

---

## 9. Regola generale: payment_required

Il payment gateway deve comparire **solo quando il check richiede davvero pagamento**.

Concettualmente:

```text
payment_required = true
→ checkout/payment/gateway

payment_required = false
→ entitlement/permission check
→ avvio controllo
```

Questa regola evita di propagare stati di pagamento in:

- Admin;
- Coach con percorso coaching;
- altri contesti entitlement-based.

Lo Student NON rientra nei flow entitlement-based per il proprio check autonomo: per lo Student `payment_required = true`.

---

## 10. Core TesiCheck flow per utenti autenticati

Una volta definito il contesto:

```text
Requisiti del documento
→ Carica documento
→ Validazione
→ Conteggio
→ Costo / crediti / entitlement
→ Conferma
→ payment se required
→ Avvio controllo
→ breve elaborazione tecnica
→ Report oppure errore
```

### Processing

L'elaborazione è praticamente istantanea.

Quindi:

- può esistere tecnicamente;
- può essere mostrata come breve loading state;
- **non è uno stato persistente dello Storico**.

### Success states

Evitare una catena di pagine:

```text
Account completato
→ Pagamento completato
→ Check completato
→ Visualizza report
```

Preferire:

```text
azione
→ breve feedback inline/transitorio
→ destinazione utile successiva
```

Esempi:

```text
payment verified
→ “Stiamo generando il report...”
→ report
```

oppure:

```text
Coach/Admin: Avvia controllo
→ loading
→ report
```

---

## 11. Payment / entitlement per ruolo

| Ruolo / modalità | Context binding | Entitlement | Payment gateway |
|---|---|---|---|
| Guest standalone | account dopo checkout account step | pagamento | **Sì** |
| Authenticated standalone | account corrente | pagamento | **Sì** |
| Student — check autonomo | Student account | pagamento | **Sì** |
| Coach — percorso coaching | percorso attivo | quota definita da Admin | **No** |
| Coach — check libero | Coach account | pagamento | **Sì** |
| Admin | studente + percorso/lavorazione | privilegi Admin | **No** |

### Nota Student

Lo Student NON usa direttamente la quota TesiCheck del proprio percorso coaching.

Se vuole eseguire un check autonomamente:

```text
Student account
→ pricing
→ payment
→ gateway
→ report
```

La quota coaching viene consumata esclusivamente dal Coach nel flow `Coach — percorso coaching`.

---

## 11.1 Regola di ownership della quota coaching

La quota/usage limit TesiCheck associata a un percorso coaching appartiene al **flow operativo del Coach**, non allo Student.

```text
Student con percorso attivo
≠
TesiCheck gratuito personale
```

Lo Student che avvia volontariamente un check dalla propria area sta usando TesiCheck come servizio self-service paid.

Il Coach che avvia un check nel contesto del percorso sta invece usando l'entitlement del percorso.

Quindi:

```text
SELF-SERVICE PAID
├── Guest → account → payment
├── Authenticated standalone → payment
├── Student → payment
└── Coach — check libero → payment

COACHING ENTITLEMENT
└── Coach — percorso attivo → quota/usage limit

PRIVILEGED
└── Admin → no consumer checkout
```

---

## 12. Coach — UI della scelta modalità

La pagina Coach TesiCheck deve rendere esplicita la modalità prima del flow.

Pattern consigliato:

```text
Modalità del check

◉ Percorso coaching
  Usa la quota disponibile di uno studente/percorso attivo.

○ Check libero a pagamento
  Esegui un controllo indipendente dal coaching.
```

Non è necessario creare due pagine separate.

### Se sceglie percorso coaching

Mostrare il flow esistente:

```text
Seleziona percorso
→ Carica documento
→ Conferma e avvia controllo
```

### Se sceglie check libero

Nascondere la selezione percorso e mostrare il core flow paid:

```text
Carica documento
→ prezzo
→ pagamento
→ report
```

La scelta modalità appartiene al context binding, non al report.

---

## 13. Report

Il report standalone pubblico è **design legacy**.

Il report finale deve essere aperto dentro la shell del ruolo autenticato.

```text
authenticated public-view shell
└── report

Student shell
└── report

Coach shell
└── report

Admin shell
└── report + strumenti operativi
```

### Principio

Condividere eventualmente:

- report data model;
- report content layout;
- legenda;
- matching sources;
- testo evidenziato.

Non condividere automaticamente:

- shell;
- support actions;
- metadati operativi;
- permessi.

---

## 14. Report actions

Durante la disponibilità:

- `Apri report`
- `Scarica report`

Il report è lungo: una CTA `Scarica report` può essere presente sia:

- in alto;
- in fondo alla pagina.

Non è duplicazione inutile: evita di obbligare l'utente a tornare in cima.

---

## 15. Box finali del report

### 15.1 Box legacy da rimuovere

**Ricevi il link via email**

Non è più necessario.

### 15.2 Nuovo box consigliato

**Conserva il report**

Contenuto:

- data di scadenza;
- reminder sulla retention;
- CTA `Scarica report`.

Esempio:

> Questo report sarà disponibile nel tuo account fino al 10 maggio 2026. Scaricalo entro questa data se vuoi conservarne una copia.

### 15.3 Support box role-aware

**Hai bisogno di aiuto sul report?**

Possibili varianti:

- standalone user → supporto Sottotesi / coaching;
- Student → chiedi al tuo Coach;
- Coach → supporto/escalation Sottotesi;
- Admin → strumenti/note operative propri.

Questo box appartiene alla pagina di ruolo, non al report content puro.

---

## 16. Storico TesiCheck

Lo Storico deve usare un modello moderno condiviso tra ruoli.

Non copiare la tabella Admin 1:1 agli utenti.

### Stati UX persistenti

- **Completato**
- **In scadenza** — condizione derivata
- **Scaduto**
- **Fallito / Errore**

### Stato da rimuovere

`In elaborazione` non deve comparire come stato stabile dello Storico.

---

## 17. Storico — completed

Informazioni possibili:

- documento;
- check ID, se utile;
- data;
- prezzo/importo, se pertinente;
- punteggi sintetici, se policy consente;
- data di scadenza;
- stato.

Azioni:

- `Apri report`
- `Scarica report`

Esempio:

```text
Tesi_Capitolo_1.pdf
Completato

8 feb 2026 · €12,50
Plagio 9,2% · AI 0%

Report disponibile fino al 10 marzo 2026

[Apri report] [Scarica report]
```

---

## 18. Storico — expiring soon

`In scadenza` può essere una presentation condition derivata da `expires_at`.

Esempio:

```text
Scade tra 3 giorni
Disponibile fino al 10 marzo 2026

Scarica il report entro la scadenza per conservarne una copia.
```

Non è necessario introdurre un nuovo backend status solo per questa comunicazione.

---

## 19. Storico — expired

Dopo la scadenza:

- record ancora visibile;
- documento non disponibile;
- report non disponibile;
- nessun button report disabled;
- azioni report assenti.

Esempio:

```text
Tesi_Capitolo_1.pdf
Scaduto

Check completato l'8 feb 2026 · €12,50

Il documento e il report non sono più disponibili.
```

---

## 19.1 Storico — Coach: due contesti di record

Lo Storico TesiCheck del Coach contiene **due contesti di record distinti**. Condividono la stessa grammatica base dello Storico consumer — identità del documento, data di completamento, scadenza esplicita, stato di disponibilità `Completato` / `Scaduto`, azione `Apri report`, nessuna azione dopo la scadenza — ma il Coach ha metadati contestuali aggiuntivi.

### A. Check su percorso coaching

Check eseguito dal Coach per uno Student all'interno di un percorso coaching attivo.

Mostrare:

- nome documento;
- Student;
- percorso coaching;
- crediti utilizzati **da quel singolo check**;
- data di completamento;
- scadenza esplicita del report;
- stato di disponibilità;
- `Apri report`.

Regola di prodotto vincolante:

> Al Coach non vanno **mai** mostrati:
> - i crediti TesiCheck rimanenti;
> - la quota residua totale;
> - alcun indicatore derivato del tipo “X crediti rimasti”.
>
> È consentito mostrare **solo** i crediti consumati da quello specifico check, e solo se quel dato esiste realmente.

### B. Check libero / esterno a pagamento

Check a pagamento del Coach non associato a un percorso coaching.

Deve essere visivamente distinguibile dai check legati a un percorso tramite un badge contestuale visibile:

`Check libero`

Per questo record mostrare:

- nome documento;
- badge `Check libero`;
- prezzo pagato;
- data di completamento;
- scadenza esplicita del report;
- stato di disponibilità;
- `Apri report`.

Non mostrare Student o percorso coaching quando il check non è associato ad alcun percorso. Non inventare un'associazione a un percorso.

### Semantica

- `Check libero` è un badge di **contesto/tipo**, non uno stato; non va veicolato attraverso il badge di stato disponibilità.
- `Completato` / `Scaduto` descrivono la **disponibilità del report**, non l'esecuzione del check.
- I record scaduti restano visibili nello Storico e non hanno azione report: nessun bottone disabilitato, azione semplicemente assente.
- `In scadenza` resta una condizione derivata **non definita** finché non è approvata una soglia (vedi §18 e §30).

### Gerarchia informativa

Check su percorso:

```text
PRIMARIO
- nome documento
- stato disponibilità
- scadenza
- Apri report

CONTESTO
- Student
- Percorso
- Crediti usati

SECONDARIO
- data di completamento
```

Check libero:

```text
PRIMARIO
- nome documento
- badge Check libero
- stato disponibilità
- scadenza
- Apri report

CONTESTO
- prezzo

SECONDARIO
- data di completamento
```

> **Stato prototipo (non canonico).** Entrambe le modalità Coach sono ora implementate nella shell Coach. Il modello persistente Coach è un'unione discriminata `CoachPersistentCheck = CoachPathBoundCheck | CoachFreeCheck` nello store dedicato `coach-tesicheck-checks-v1` (mai lo store consumer `public-tesicheck-checks-v1`).
>
> Non esiste un selettore di "modalità" separato. Il Coach fa **una** scelta contestuale in un unico selettore ("Contesto del check"): un percorso coaching esplicito, oppure l'opzione esplicita `Check libero a pagamento`. Il placeholder vuoto non è azionabile e non viene mai interpretato come check a pagamento. Il documento caricato e il suo stato di validazione sono agnostici rispetto al contesto e vengono preservati al cambio di contesto; si azzera solo lo stato transitorio specifico dell'altra modalità.
>
> - **Percorso coaching** (`binding.mode === 'coaching_path'`) — invariato: selezione percorso → upload → gate entitlement qualitativo (mock) → `Avvia controllo` → check path-bound persistente → report Coach. Nessun pagamento. Studente/percorso vengono fotografati solo all'accettazione di `Avvia controllo`. Idempotenza via `sourceExecutionReference`. Lo Storico mostra studente, percorso e crediti usati dal singolo check.
> - **Check libero a pagamento** (`binding.mode === 'check_libero'`) — il Coach seleziona l'opzione esplicita, carica il documento, vede conteggio/prezzo mock (28.500 caratteri · €14,90, stessi valori dei flussi paid consumer — decisione di consistenza prototipo, non una regola di prezzo di produzione; resta aperta l'incongruenza aritmetica `EUR 0,52/1000cc` vs `€14,90`), va al pagamento riusando `SottocheckPaymentGatewayBoundary`, e dopo il pagamento verificato materializza un `CoachFreeCheck` (nessuno studente, nessun percorso, nessun credito coaching; `price` e `payment` salvati). Idempotenza via `sourcePaymentReference` (`coach-pay-…`). Recupero post-pagamento: se la materializzazione fallisce, stato recuperabile con `Riprova a generare il report`, senza nuovo pagamento. Il Coach è già autenticato: nessun account/login/verifica email. Lo Storico e il report mostrano il badge di contesto `Check libero` e il prezzo pagato, mai studente/percorso/crediti.
>
> Una sola route report (`/coach-view/report/:checkId`) serve entrambe le modalità; lo Storico Coach (`/coach-view/history`, `/coach-view/archivio`) legge lo store filtrando per owner Coach e deriva `Completato` / `Scaduto` da `expiresAt` a render time. L'entitlement/quota del percorso coaching resta logica prototipo/mock. Il recupero del flusso free è session-scoped (stato React, nessun `sessionStorage`). Dettaglio tecnico: [tesicheck-coach-handoff.md](./tesicheck-coach-handoff.md).

---

## 20. Retention

Policy di prodotto corrente:

**30 giorni dal completamento del check.**

```text
completed_at
→ expires_at = completed_at + 30 giorni
```

Prima della scadenza:

- report consultabile;
- report scaricabile.

Dopo:

- report non disponibile;
- documento non disponibile;
- record storico/pagamento conservato.

### Decisioni aperte

Va ancora definito se dopo 30 giorni restano:

- nome/metadati documento;
- punteggio Plagio;
- punteggio AI;
- altri dati sintetici del report.

Non lasciare che OpenCode decida questi punti.

---

## 21. Deep link a report scaduto

Un link salvato non deve portare a:

- 404;
- pagina vuota;
- report parziale.

Dentro la shell mostrare una expired state:

**Questo report è scaduto**

> Il report non è più disponibile. Puoi consultare i dati del check e del pagamento nello Storico TesiCheck.

Azioni:

- `Vai allo storico`
- `Avvia un nuovo check`

---

## 22. Student: Storico vs Archivio

Sono domini diversi.

### Storico

Storico dei check TesiCheck.

### Archivio

Documenti scambiati tra Student e Coach nel percorso coaching.

Non unirli e non usare l'expiry TesiCheck per l'Archivio coaching.

---

## 23. Admin come reference del domain model

La vista Admin contiene la versione più ricca del dominio:

- ID;
- soggetto;
- actor;
- parole;
- punteggi;
- crediti;
- stato;
- date;
- note;
- lavorazione;
- profilo;
- report data.

Usarla per capire quali dati esistono.

Non replicare la stessa densità nelle viste consumer.

---

## 24. Dashboard authenticated

È il workspace dell'utente, non un secondo prodotto.

Può offrire:

- accesso a TesiCheck;
- nuovo check;
- ultimo report recente;
- accesso allo Storico.

Non progettare uno stato persistente “in elaborazione”: il processing è transitorio.

---

## 25. Landing `/public`

Ruolo:

**marketing + acquisition + guest pre-check**

Non deve diventare una seconda applicazione TesiCheck.

### Stato resume

Se esiste un checkout già iniziato:

- non mostrare il preventivo come se fosse appena calcolato;
- mostrare uno stato `Hai un TesiCheck in corso`;
- CTA `Riprendi il checkout`.

### Annotazioni visuali già raccolte

Da riprendere durante il redesign:

1. ridurre leggermente il vuoto hero → info cards → check;
2. chiarire la differenza tra `Scopri il servizio` e `Approfondisci il servizio`;
3. preservare neutral-first + CTA near-black + piccoli accenti illustrativi.

---

## 26. Privacy / retention

Prima dell'handoff finale va chiarita la relazione tra:

```text
documento originale
report derivato
record storico/pagamento
```

La landing oggi contiene promesse forti su:

- mancata conservazione dei file;
- mancata visibilità a Sottotesi.

Queste promesse devono essere compatibili con:

- pre-check guest;
- check;
- supporto;
- Admin;
- report disponibile 30 giorni;
- storico persistente.

Non inventare policy durante il redesign.

---

## 27. Stati ed errori minimi da prevedere

Il prototipo dovrebbe rendere espliciti almeno:

### Document validation
- file non supportato;
- file troppo grande;
- documento non conforme.

### Authentication
- login fallito;
- registrazione fallita;
- session recovery.

### Payment
Solo nei contesti `payment_required = true`:
- redirect al gateway;
- successo;
- fallimento;
- annullamento;
- retry.

### Entitlement
Nei contesti coaching:
- quota disponibile;
- quota insufficiente/esaurita;
- possibilità Coach di passare a check libero a pagamento.

### Check
- breve loading;
- fallimento tecnico.

### Report
- disponibile;
- in scadenza;
- scaduto.

---

## 28. Canonical service-flow matrix

| Stato / ruolo | Guest standalone | Authenticated standalone | Student — check autonomo | Coach — percorso | Coach — libero | Admin |
|---|---|---|---|---|---|---|
| Pre-upload | Può iniziare | Owner noto | Owner noto | Seleziona modalità + percorso | Seleziona modalità | Seleziona studente + percorso |
| Upload/validation | Temporaneo | Core flow | Core flow | Dopo context binding | Core flow | Dopo context binding |
| Prezzo / entitlement | Vede prezzo | Vede prezzo | Vede prezzo | Quota percorso | Vede prezzo | Privilegi Admin |
| Account step | Obbligatorio nel checkout | Non serve | Non serve | Non serve | Non serve | Non serve |
| Payment gateway | **Sì** | **Sì** | **Sì** | **No** | **Sì** | **No** |
| Processing | Transitorio | Transitorio | Transitorio | Transitorio | Transitorio | Transitorio |
| Completed | Report nella shell | Report nella shell | Report nella shell | Report nella shell | Report nella shell | Report + strumenti Admin |
| Expiring | — | Warning | Warning | Warning | Warning | Visibile se utile |
| Expired | — | Record storico | Record storico | Record nel perimetro | Record nel perimetro | Record operativo |
| Failed | — | Errore/retry | Errore/retry | Errore/support | Errore/retry | Diagnostica operativa |

---

## 29. Decisioni già chiuse

- Guest può vedere il prezzo prima di registrarsi.
- Account obbligatorio prima del pagamento.
- L'autenticazione è uno step del checkout, non l'ingresso anticipato nella dashboard.
- Login e registrazione avvengono direttamente dentro il checkout, con form dedicati e riepilogo ordine persistente.
- Il riepilogo TesiCheck resta visibile durante login, registrazione, verifica email e payment; nello stato `redirecting` non è mostrato.
- In desktop il riepilogo può essere sticky; in mobile diventa stacked/compatto.
- `Crea account` cambia modalità nella stessa esperienza checkout; non manda l'utente fuori dal flow.
- La nuova registrazione richiede verifica email prima di abilitare il pagamento.
- Il checkout raccoglie solo dati necessari a account/ownership/payment/fatturazione, non onboarding/profile data non indispensabili.
- Se l'utente è già autenticato, lo step account viene saltato.
- Il riepilogo ordine resta visibile durante account → payment; nello stato `redirecting` lascia il posto a una transizione minimale con brand mark Sottotesi.
- Nessun report guest.
- Email facoltativa post-payment eliminata come recovery.
- Payment gateway interstitial obbligatorio nel prototipo solo quando `payment_required = true`.
- Nessuna falsa UI bancaria.
- Nessuna pagina autonoma “Account completato”.
- Nessuna catena di success pages non necessarie.
- Processing è transitorio e non compare nello Storico.
- Report dentro la shell autenticata del ruolo.
- Retention report/documento: 30 giorni.
- Storico conserva il record dopo expiry.
- Student e standalone authenticated condividono il core paid flow; lo Student salta solo lo step account perché è già autenticato.
- Coach ha due modalità:
  - percorso coaching con quota/usage limits e senza gateway;
  - check libero a pagamento con gateway.
- Se la quota Coach è esaurita, può passare a un check libero a pagamento.
- Il check libero Coach non viene associato automaticamente a un percorso coaching.
- Admin seleziona studente + percorso e non usa gateway.
- Student Archivio resta separato dallo Storico TesiCheck.
- `/public` e `/public-view` restano contesti distinti.
- La landing distingue `quote_ready` da checkout già iniziato.
- Lo Storico Coach ha due contesti di record: check su percorso coaching e check libero a pagamento (§19.1).
- Al Coach non vanno mai mostrati crediti TesiCheck rimanenti o quota residua; è ammesso solo il dato dei crediti consumati dal singolo check, se esiste (§19.1).
- `Check libero` è un badge di contesto/tipo, non uno stato di disponibilità (§19.1).
- Una nuova registrazione standalone TesiCheck crea/deduplica subito una Pipeline CRM, alla creazione+verifica dell'account, indipendentemente da pagamento e questionario (§33).
- Identità di acquisizione minima = nome (first name) + email verificata (§33).
- Un'identità che è già uno Student non genera mai una Pipeline duplicata; l'enrichment dello Student è un flusso separato, non ancora implementato (§33).
- Il questionario post-pagamento / Profilo **arricchisce** la Pipeline già creata; non è il punto di creazione normale (§33).
- Per le Pipeline originate da questo flusso la fonte è assegnata dal sistema: `Fonte acquisizione = TesiCheck`; mai selezionabile dall'utente (§33).
- L'enrichment del profilo standalone non blocca mai pagamento, accesso al report o Storico (§33).
- Consenso al ricontatto commerciale / marketing è un dominio distinto da accettazione Termini e da gestione privacy (§33.5).

---

## 30. Decisioni prodotto ancora aperte

1. Dopo expiry: quali dati sintetici del report restano visibili?
2. Policy privacy/retention effettiva dei file originali.
3. Quale visibilità dello staff Sottotesi sui file/report è consentita.
4. Scope production delle pagine Profilo/Account incomplete.
5. Eventuale collegamento opzionale futuro tra Coach paid free check e un percorso coaching.
6. Soglia della condizione derivata `In scadenza` nello Storico (vale per tutti i ruoli). Finché non è approvata, mantenere solo la data di scadenza esplicita e non introdurre logiche “X giorni rimanenti”.

---

## 31. Assunzioni legacy da ignorare

Non usare più come riferimento:

- pagamento guest;
- report guest;
- recovery via email facoltativa post-payment;
- link report come unica ownership;
- report standalone finale;
- `In elaborazione` nello Storico;
- history Public/Student/Coach modellate come domini separati;
- `public-view` interpretato come pubblico;
- Student Archivio interpretato come storico check;
- login che porta alla dashboard prima del pagamento;
- pagina autonoma “Account completato”;
- payment gateway introdotto indiscriminatamente in Admin/Coach coaching;
- Student che consuma direttamente la quota TesiCheck del percorso coaching;
- Student che esegue check autonomi senza pagamento;
- success pages multiple tra account, pagamento, check e report.

---

## 32. Indicazioni per OpenCode

Prima di modificare codice:

1. leggere questo documento;
2. confrontarlo con l'implementazione attuale;
3. non inventare decisioni prodotto mancanti;
4. distinguere sempre `payment_required` da entitlement/privileged flow;
5. evitare success pages non necessarie;
6. preservare le shell separate.

Ordine consigliato:

1. guest pre-check + checkout account boundary;
2. checkout/payment gateway per standalone;
3. report authenticated;
4. Student paid flow dentro Student shell;
5. Coach coaching flow senza success page intermedio;
6. history + expiry;
7. Coach dual-mode con ramo paid;
8. cleanup legacy flow;
9. eventuale raffinamento Admin senza introdurre gateway.

---

## 33. Standalone TesiCheck → acquisizione + enrichment lead CRM

Riguarda solo l'**identità standalone TesiCheck** (registrazione + `/public-view`).
Non tocca Student, Coach, Admin, checkout, pagamento, report o Storico.

### 33.1 Concetto prodotto

Una **nuova registrazione standalone** proietta subito un'identità di
acquisizione nel CRM: alla creazione + verifica email dell'account viene
creata/deduplicata una Pipeline. La Pipeline **non dipende** dal pagamento né dal
completamento del questionario di profilo successivo.

Il questionario `Completa il tuo profilo` (Profilo, e in futuro l'interstitial
post-pagamento) **arricchisce** quella Pipeline già esistente: anagrafica
completa, telefono, percorso universitario/tesi.

La Pipeline/lead CRM è una **proiezione interna**. L'utente non vede e non
sceglie: id Pipeline, stato CRM, fonte acquisizione, presa in carico, canali di
comunicazione CRM, preventivi, note, collegamenti a servizio, metadati
operativi.

### 33.2 Identità di acquisizione minima

La registrazione di un nuovo account standalone raccoglie:

- **Nome** (first name) — obbligatorio;
- **Email** — obbligatoria, flusso account esistente;
- Password / conferma — flusso esistente.

Il cognome **non** viene chiesto in registrazione. Il first name è un valore
esplicito sull'account/sessione (`firstName`), non ricavato dallo split di una
stringa nome completo.

### 33.3 Regole

- **Creazione Pipeline (registrazione):** dopo che un nuovo account standalone è
  creato + email verificata:
  1. si risolve l'email verificata prima contro gli **Student**;
  2. se corrisponde a uno Student: **nessuna Pipeline** creata/aggiornata;
  3. altrimenti si cerca una **Pipeline** esistente per email;
  4. se esiste: si preservano tutti i dati e si garantisce `TesiCheck` in
     `sources` una sola volta;
  5. se non esiste **e** c'è un nome esplicito non vuoto: si crea **una**
     Pipeline immediata con `first_name` = nome, `student_name` = nome (mai
     l'email), `email` verificata, `sources: ['TesiCheck']` e soli campi
     strutturali grounded. Nessun preventivo, owner, servizio, canale, note,
     `student_id`;
  6. se il nome esplicito è vuoto: **nessuna Pipeline creata** (risultato non
     creato, sicuro).

  **Invariante:** una Pipeline TesiCheck appena creata richiede email verificata
  valida **e** first name esplicito non vuoto; `student_name` non è mai l'email.
  Una Pipeline originata da TesiCheck esiste quindi anche se l'utente non paga e
  non compila mai il questionario.
- **Student sempre prioritario:** un'identità già corrispondente a uno Student
  Sottotesi non viene mai duplicata come nuovo lead Pipeline.
- **Enrichment (questionario):** normalmente risolve la Pipeline già creata e la
  **aggiorna** (anagrafica, telefono, dati accademici raccolti). Assegnatario,
  preventivi, note, collegamenti a servizio, lavorazioni, metadati operativi e
  le altre fonti restano invariati; `TesiCheck` garantita una sola volta.
- **`new_pipeline` nel questionario = solo fallback** per account pre-regola
  (verificati ma senza Pipeline). Richiede email verificata + nome.
- **Nessuna identità utilizzabile** (nessuna sessione, email non verificata o
  non valida): stato neutro, nessuna Pipeline. Nessun redirect al checkout,
  nessuna identità fittizia.
- **Fonte** sempre assegnata dal sistema: `Fonte acquisizione = TesiCheck`, mai
  selezionabile dall'utente.
- L'enrichment **non è uno step del checkout** e **non blocca mai** pagamento,
  report o Storico. Dopo il salvataggio si resta sul Profilo con una conferma
  sintetica; nessuna pagina "profilo completato", nessun redirect.

### 33.4 Vocabolario accademico (approvato dal cliente)

Etichette e opzioni UI condivise da questo questionario e dai form Pipeline
Admin. **I nomi dei campi sottostanti non cambiano.**

| Etichetta UI | Campo | Note |
| --- | --- | --- |
| Livello di laurea | `degree_level` | — |
| Corso di laurea | `course_name` | — |
| Università | `university_name` | — |
| Tipologia | `thesis_type` | valori: `Compilativa`, `Sperimentale`, `Esame` |
| Professore | `thesis_professor` | facoltativo; ex "Relatore" |
| Materia | `thesis_subject` | ex "Materia di tesi" |
| Argomento | `thesis_topic` | ex "Oggetto tesi" / "Argomento / oggetto della tesi" |

La stessa struttura accademica serve sia il contesto tesi sia il contesto esame:
`Esame` è un valore di `thesis_type`, non uno schema separato.

### 33.5 Domini di consenso (distinti)

Tre domini che devono restare separati, **senza inventare wording legale**:

1. **Accettazione Termini e Condizioni** — servizio.
2. **Presa visione / gestione informativa privacy** — obbligatoria.
3. **Consenso opzionale al ricontatto commerciale / marketing**.

`Pipeline.marketing_consents` rappresenta **solo** il dominio 3. Accettazione
Termini e informativa privacy **non** vanno mappate lì. La copy delle checkbox
finali non va aggiunta finché legale non fornisce il testo. Se serve un punto per
l'accettazione versionata (versione + timestamp), appartiene al modello
account/sessione, non alla Pipeline — vedi requisito aperto nell'handoff.

### 33.6 Handoff implementativo

Vedi [tesicheck-standalone-enrichment-handoff.md](./tesicheck-standalone-enrichment-handoff.md)
per la nota tecnica: risoluzione d'identità via email come stand-in prototipale,
evento di creazione al verify email, CRM `LavorazioniContext` in memoria
(sopravvive alla navigazione SPA, non al reload completo), requisito aperto per
l'accettazione versionata Termini/privacy.

