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

Espone anche due percorsi di **ingresso account diretto**, indipendenti dal
checkout upload-first: `Accedi` (`/public/login`) e `Registrati`
(`/public/register`). Non richiedono pre-check session, quote fittizio o
pagamento. La registrazione diretta usa la stessa verifica email prototipo e la
stessa regola di acquisizione CRM (§33) del gate in-checkout, poi porta a
`/public-view`. Il checkout upload-first (`upload → quote → account step se serve
→ payment → report`) resta invariato: la registrazione non è mai forzata prima
dell'upload. Se esiste già una sessione standalone valida, l'azione account della
landing porta direttamente a `/public-view` senza reindirizzare ogni visita.

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
Storico (archivio persistente, nessuna scadenza)
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

Se l'utente ha già una sessione standalone **verificata prima di iniziare il
checkout** dalla landing:

```text
quote
→ [Procedi al pagamento]
→ gateway
```

Vengono saltati sia lo step account sia il recap `Completa il pagamento`: la
pre-check viene claimed dall'account e si passa direttamente allo stato
`redirecting` / gateway, con la stessa grammatica a CTA unica di standalone
autenticato (`/public-view/sottocheck`), Student e Coach `Check libero`.

Distinzione rilevante: **autenticato prima dell'ingresso nel checkout** vs
**autenticato durante il checkout**. Chi si autentica dentro `/public/account`
(login o registrazione in-checkout) **mantiene** il recap `Completa il pagamento`:
l'autenticazione ha interrotto l'acquisto e ristabilire il contesto d'ordine
prima di uscire verso il gateway esterno è utile. "Esiste una sessione adesso"
da solo non basta: nei casi ambigui si mostra il recap.

### Dopo autenticazione

Dopo login/registrazione:

- la pre-check session viene claimed dall'account;
- documento, count e prezzo non devono essere persi;
- l'utente **resta nel checkout**;
- si passa direttamente allo step pagamento.

Non usare una pagina intermedia autonoma “Account completato”.

L'account completato è uno stato implicito del checkout: lo step corrente avanza
al pagamento, con documento/count/prezzo sempre visibili nel riepilogo. Non
introdurre un blocco di pseudo-progress (Account / Email / Pagamento) come
orientamento: bastano heading, step corrente e riepilogo persistente.

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

### Persistenza e discard della pre-check session (semantica di prodotto)

Esistono **tre domini di persistenza distinti**; la pre-check session è il
dominio transitorio B.

- **A — Identità account.** Può sopravvivere a un reload. Viene azzerata solo al
  logout esplicito.
- **B — Purchase/precheck transitorio corrente.** Può sopravvivere a un refresh
  **mentre lo stesso utente sta completando il checkout** (resume da
  `checkout_account` / `checkout_verify_email` / `checkout_payment` /
  `redirecting`). Va invece **scartato** quando:
  - l'utente fa **logout esplicito**;
  - il pagamento è andato a buon fine **e** il TesiCheck persistente è stato
    creato (materializzazione consumata, vedi §7.3).

  Non deve mai propagarsi nella login/sessione successiva come acquisto attivo,
  né lasciare un `flowStage` terminale/intermedio che blocchi un nuovo checkout.
- **C — Dati di prodotto persistenti.** Sopravvivono al logout: check completati,
  report, Storico permanente, Pipeline CRM, registry account prototipo
  registrati. Non vanno mai cancellati dal logout.

Un fallimento di pagamento, un annullamento o un fallimento di materializzazione
post-pagamento **non** sono eventi di discard: mantengono la pre-check session
attiva per il retry (§7.3), senza forzare un nuovo pagamento. Solo il logout
esplicito e la materializzazione riuscita consumano il dominio B.

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

Il report resta accessibile a tempo indeterminato dallo Storico:

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

**Salvato nel tuo Storico TesiCheck**

Contenuto:

- conferma che il report resta accessibile dallo Storico;
- CTA `Scarica report` (azione separata, per una copia offline).

Esempio:

> Potrai consultare questo report anche in seguito. Scarica una copia se vuoi conservarla anche offline.

Il box **non** contiene più una data di scadenza né un reminder di retention: non esiste più una scadenza applicativa del report (vedi §20).

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

Lo Storico è un **archivio persistente** del lavoro accademico/di tesi dell'utente:
i TesiCheck completati restano accessibili nel tempo, senza scadenza applicativa.
Deve usare un modello moderno condiviso tra ruoli.

Non copiare la tabella Admin 1:1 agli utenti.

### Identità della riga

- **titolo del check** (semantico, distinto dal nome file) — identità primaria;
- **nome file originale** — metadato secondario;
- metadati di contesto per ruolo (vedi §17, §19.1);
- data di completamento;
- `Apri report` — sempre disponibile.

Ogni TesiCheck ha un titolo. Per i record legacy privi di titolo, il fallback è il
nome file senza estensione.

### Titolo semantico del check

- Ogni TesiCheck ha **un titolo semantico** più il **nome file originale**: sono
  concetti distinti. Il titolo identifica la fase/versione del lavoro
  (`Capitolo 3 – Metodologia`); il nome file resta l'artefatto caricato
  (`tesi_finale_v7.docx`). Il file caricato **non viene mai rinominato**.
- Il titolo non vive dentro `document` / `UploadedDocument`.
- **Default:** al caricamento del documento il titolo è preimpostato con
  `deriveDefaultCheckTitle(document.name)` — solo la rimozione dell'estensione
  finale, nessun'altra trasformazione. Cambiando il documento il titolo torna al
  nuovo default derivato.
- **Editing prima di run/pagamento:** un campo `Titolo del controllo`
  preimpostato ed editabile è mostrato accanto al documento caricato, nel passo
  di preparazione — **non** è un nuovo step di checkout. Vale per standalone
  guest, Student, Coach percorso e Coach `Check libero`, con la stessa semantica.
  Se svuotato, il titolo si risolve al default da nome file (nessun titolo vuoto
  può materializzare un check).
- **Rename dallo Storico:** dopo il completamento l'utente può rinominare il
  check dallo Storico con un'interazione minima (matita → edit inline/compatto →
  Salva/Annulla). Il rename tocca **solo** `title`: mai nome file, report
  reference, pagamento, crediti, binding studente/percorso, data di
  completamento. Lo Storico si aggiorna subito, senza reload.
- Il report letto dallo Storico mostra il titolo corrente; l'iframe continua a
  ricevere il nome file originale; il `.txt` scaricato riporta `Titolo:` +
  `Documento:`. Il nome del file scaricato resta basato sull'id
  (`report-tesicheck-{id}.txt`), mai derivato dal titolo.

### Stati

Ogni record persistente è **Completato** e può sempre aprire il proprio report.
Non esistono più gli stati `In scadenza` / `Scaduto`: sono rimossi.
`Fallito / Errore` resta pertinente solo a superfici legacy/mock che modellano
un'esecuzione non riuscita, non allo Storico persistente.

### Stato da rimuovere

`In elaborazione` non deve comparire come stato stabile dello Storico.

---

## 17. Storico — completed

Informazioni possibili:

- titolo del check (identità primaria);
- nome file originale (secondario);
- check ID, se utile;
- data di completamento;
- prezzo/importo, se pertinente;
- punteggi sintetici, se policy consente;
- metadati di contesto per ruolo.

Azioni:

- `Apri report` (sempre disponibile)
- `Scarica report`

Esempio:

```text
Capitolo 3 – Metodologia
tesi_finale_v7_CORRETTA.docx

Completato l'8 feb 2026

[Apri report]
```

---

## 18. Storico — nessuna scadenza

Non esiste più una condizione `In scadenza` né una data di scadenza del report.
Un record completato resta disponibile a tempo indeterminato e `Apri report` non
viene mai disabilitato o nascosto.

Retention legale dei file/report ed eliminazione account sono concern separati di
produzione (vedi §20), non regole UX dello Storico.

---

## 19. Storico — deep link a record non valido

Non esiste più uno stato "report scaduto". L'unico stato non-nominale è un
`checkId` non trovato o non di proprietà del ruolo corrente: mostrare uno stato
neutro "Report non disponibile" con azione verso lo Storico. Nessun record
completato valido raggiunge questo stato.

---

## 19.1 Storico — Coach: due contesti di record

Lo Storico TesiCheck del Coach contiene **due contesti di record distinti**. Condividono la stessa grammatica base dello Storico consumer — titolo del check (primario), nome file (secondario), data di completamento, `Apri report` sempre disponibile, nessuna scadenza — ma il Coach ha metadati contestuali aggiuntivi.

### A. Check su percorso coaching

Check eseguito dal Coach per uno Student all'interno di un percorso coaching attivo.

Mostrare:

- titolo del check (primario);
- nome file originale (secondario);
- Student;
- percorso coaching;
- crediti utilizzati **da quel singolo check**;
- data di completamento;
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

- titolo del check (primario);
- nome file originale (secondario);
- badge `Check libero`;
- prezzo pagato;
- data di completamento;
- `Apri report`.

Non mostrare Student o percorso coaching quando il check non è associato ad alcun percorso. Non inventare un'associazione a un percorso.

### Semantica

- `Check libero` è un badge di **contesto/tipo**, non uno stato.
- Ogni record è `Completato` e apre sempre il proprio report. Non esistono più `Scaduto` / `In scadenza` (vedi §16, §20).
- Un badge di stato disponibilità nello Storico persistente Coach è **ridondante** e non va mostrato.

### Gerarchia informativa

Check su percorso:

```text
PRIMARIO
- titolo del check
- Apri report

CONTESTO
- nome file originale
- Student
- Percorso
- Crediti usati

SECONDARIO
- data di completamento
```

Check libero:

```text
PRIMARIO
- titolo del check
- badge Check libero
- Apri report

CONTESTO
- nome file originale
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
> Una sola route report (`/coach-view/report/:checkId`) serve entrambe le modalità; lo Storico Coach (`/coach-view/history`, `/coach-view/archivio`) legge lo store filtrando per owner Coach. Non c'è più derivazione di scadenza: ogni record è aperto. `expiresAt` resta solo come campo legacy opzionale su record vecchi, mai letto. Ogni record espone un `title` effettivo (dai creator, o fallback dal nome file per i record pre-title). L'entitlement/quota del percorso coaching resta logica prototipo/mock. Il recupero del flusso free è session-scoped (stato React, nessun `sessionStorage`). Dettaglio tecnico: [tesicheck-coach-handoff.md](./tesicheck-coach-handoff.md).

---

## 20. Retention

Regola di prodotto approvata dal cliente:

**Un report TesiCheck completato resta accessibile dallo Storico dell'utente.**
Non esiste più una scadenza applicativa/UI (in precedenza `completed_at + 30
giorni`). Lo Storico è un archivio persistente: l'utente può rivedere nel tempo
la progressione del proprio lavoro di tesi/accademico.

Vale per tutti i contesti con report persistenti: standalone, Student, Coach
percorso, Coach `Check libero`.

Conseguenze:

- nessuna generazione di `expiresAt` sui nuovi record;
- `expiresAt` resta un campo **legacy opzionale** tollerato sui record vecchi del
  prototipo, mai letto per limitare l'accesso;
- un record il cui vecchio `expiresAt` è già passato torna accessibile;
- nessun stato "report scaduto", nessun box "Conserva il report" con data di
  scadenza, nessuna logica "X giorni rimanenti".

### Fuori scope

Questa non è una policy legale/di data-retention di produzione. La retention
legale dei file/report e l'eliminazione account sono concern separati e futuri di
produzione, da definire con il legale; non vanno implementati qui come
architettura di storage.

---

## 21. Deep link a un record non valido

Un link salvato non deve portare a 404, pagina vuota o report parziale.

Un record completato valido apre **sempre** il report. L'unico stato non-nominale
è un `checkId` non trovato o non di proprietà del ruolo corrente: dentro la shell
mostrare uno stato neutro.

**Report non disponibile**

> Non abbiamo trovato un report disponibile per questo controllo.

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
- report accessibile a tempo indeterminato dallo Storico;
- storico persistente come archivio del lavoro di tesi.

L'assenza di scadenza applicativa (§20) **aumenta** la rilevanza di questo punto:
la relazione tra promesse della landing e conservazione effettiva di
file/report/record va chiarita con il legale prima dell'handoff. Non inventare
policy durante il redesign.

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
- disponibile (sempre, per ogni record completato);
- `checkId` non valido / non di proprietà del ruolo → stato neutro "Report non disponibile".

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
| Storico | — | Archivio persistente | Archivio persistente | Archivio persistente | Archivio persistente | Record operativo |
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
- **Nessuna scadenza applicativa del report.** Un TesiCheck completato resta
  accessibile dallo Storico a tempo indeterminato (standalone, Student, Coach
  percorso, Coach `Check libero`). Non c'è box "Conserva il report" con data,
  stato `Scaduto`, stato `In scadenza`, né report reso non disponibile dopo N
  giorni (§20).
- `expiresAt` è solo un campo legacy opzionale tollerato sui record vecchi del
  prototipo, mai letto per limitare l'accesso; i nuovi record non lo generano.
- Retention legale dei file/report ed eliminazione account sono concern separati
  e futuri di produzione, non regole UX (§20).
- Ogni TesiCheck ha un `title` semantico distinto dal nome file
  (`document.name`). Non vive dentro `UploadedDocument`. Fallback per record
  legacy senza titolo: nome file senza estensione (`deriveDefaultCheckTitle`,
  rimozione della sola estensione finale — nessun'altra pulizia).
- Il titolo è **preimpostato dal nome file ed editabile prima di run/pagamento**
  in un campo `Titolo del controllo` accanto al documento caricato (non un nuovo
  step). Stessa semantica per standalone, Student, Coach percorso, Coach
  `Check libero`. Cambiando il documento il titolo torna al nuovo default; se
  svuotato si risolve al default (nessun titolo vuoto materializza un check).
- Il titolo viaggia sullo stato transitorio fino alla materializzazione: per lo
  standalone sulla `TesiCheckPrecheckSession` (upload → quote → account →
  verifica → pagamento → materializzazione); per Student e Coach sullo stato
  React del flusso, incluso il retry post-pagamento. Non è accoppiato al modello
  account.
- Dopo il completamento il titolo è **rinominabile dallo Storico** (interazione
  minima: matita → edit compatto → Salva/Annulla). Il rename cambia **solo**
  `title` (trim; vuoto → default o titolo precedente), mai nome file / report
  reference / pagamento / crediti / binding / data di completamento. Lo Storico
  si aggiorna subito senza reload; il report riaperto mostra il nuovo titolo,
  l'iframe usa ancora il nome file, il `.txt` scaricato usa il titolo corrente.
- Storico = archivio persistente; identità di riga = titolo (primario), nome file
  (secondario), metadati di contesto, data di completamento, `Apri report`.
- Nessun badge di stato disponibilità nello Storico persistente consumer/Coach:
  ogni record è `Completato`, il badge è ridondante (§16, §19.1).
- Student e standalone authenticated condividono il core paid flow; lo Student salta solo lo step account perché è già autenticato.
- `/public-view/sottocheck` è il flusso paid canonico dello standalone
  autenticato (`PublicPaidSottocheckPage`): upload → titolo → conteggio/prezzo
  mock → un'unica CTA pagamento → `SottocheckPaymentGatewayBoundary` →
  materializzazione → `/public-view/report/:checkId`. Nessuno step
  account/login/verifica (sessione già presente; il guard di `PublicLayout` è
  l'unico gate). Nessuna pagina finale `Check completato`, nessun
  `Visualizza il report` manuale, nessuna azione Storico. Il record è
  `owner.context='standalone'` nello store consumer condiviso, dedup per
  riferimento di pagamento; compare in `/public-view/history`. La vecchia UI mock
  (`Il controllo è in corso` / `Check completato`) è ritirata e non più
  raggiungibile; `/public/sottocheck` reindirizza a `/public`. È una pagina
  di ruolo dedicata: non riusa il wrapper Student.
- Coach ha due modalità:
  - percorso coaching con quota/usage limits e senza gateway;
  - check libero a pagamento con gateway.
- Se la quota Coach è esaurita, può passare a un check libero a pagamento.
- Il check libero Coach non viene associato automaticamente a un percorso coaching.
- Admin seleziona studente + percorso e non usa gateway.
- Student Archivio resta separato dallo Storico TesiCheck.
- `/public` e `/public-view` restano contesti distinti.
- La landing espone login e registrazione standalone diretti (`/public/login`,
  `/public/register`), indipendenti dal checkout upload-first, che resta valido e
  invariato.
- La registrazione standalone diretta crea/deduplica la Pipeline CRM dopo la
  verifica email, con la stessa regola di acquisizione del gate in-checkout (§33).
- Auth diretta (`/public/login`, `/public/register`) e account step del checkout
  (`/public/account`) restano distinti. Le superfici di auth diretta **non**
  mostrano riepilogo ordine, stato pagamento, prezzo/quote o progress di
  checkout: sono schermate di sola autenticazione. L'account step del checkout
  **mantiene** il `Riepilogo TesiCheck` perché l'utente si autentica nel
  contesto di un acquisto già configurato; non va rimosso per parità visiva con
  Student/Coach (che non hanno account step). Le form condivise variano solo la
  copy tra i due contesti, mai i dati mostrati.
- L'account step del checkout non mostra un blocco di pseudo-progress
  (Account / Email verificata / Pagamento). L'orientamento è dato da heading +
  step corrente + riepilogo persistente. È una scelta di presentazione: la
  macchina a stati del `flowStage` resta invariata (UI di progress ≠ stato
  interno del flow).
- Per i ruoli già autenticati (Student, Coach `Check libero`, standalone
  autenticato `/public-view/sottocheck`) non esiste una schermata intermedia
  "Completa il pagamento" prima del gateway: lo step di preparazione mostra già
  conteggio e prezzo e la sua unica CTA apre il gateway. `failed` / `cancelled`
  riportano allo step di preparazione, con la notice e documento/titolo/quote
  preservati; `failed` usa `Riprova pagamento`. Non è una regola di prezzo né un
  nuovo componente condiviso.
- Checkout dalla landing `/public` con **sessione verificata già presente prima
  dell'ingresso nel checkout**: si salta anche il recap `Completa il pagamento`
  (oltre allo step account) e si va dritti al gateway. Chi si autentica **dentro**
  `/public/account` mantiene il recap. La distinzione è "autenticato prima
  dell'ingresso" vs "autenticato durante"; è realizzata solo dallo stato
  esistente — la landing scrive `flowStage='redirecting'` (invece di
  `checkout_account`) e fa il claim quando `isPaymentEnabled(sessione)` è vero
  all'ingresso. Nessun flag persistente, nessuna seconda implementazione di
  pagamento; claim, idempotenza e recovery post-pagamento restano nel gate page.
- Il recupero password è una **GUI prototipo per handoff** (`/public/password-recovery`,
  `/public/reset-password`): solo schermate e navigazione, nessun invio email,
  nessun token di reset, nessun backend, nessun hashing. Specifica il journey per
  l'implementazione reale. `Password dimenticata?` vive sotto il campo password
  nel LoginForm condiviso (diretto e in-checkout) e passa `?returnTo=` per
  tornare all'origine senza toccare la pre-check session.
- Il logout standalone (menu utente `/public-view`) azzera la sessione account
  standalone **e** scarta la pre-check/checkout session transitoria corrente
  (domini A + B), poi riporta a `/public` (mai `/`). Non tocca il registry
  account registrati, i check/Storico persistenti, le Pipeline CRM né lo stato
  Student/Coach/Admin (dominio C). Un acquisto iniziato ma non completato non
  deve mai riapparire come attivo dopo il logout o nella login successiva di un
  altro utente; abilita test ripetibili di register → logout → login e
  garantisce l'isolamento tra utenti diversi nel prototipo.
- `PublicLayout` ha un guard prototipale: nessuna sessione account standalone →
  redirect a `/public`. Non riguarda Student/Coach/Admin.
- L'autenticazione standalone del prototipo (sessione + mini-registry locale) è
  solo simulazione per walkthrough deterministici: nessun backend, token,
  hashing o scadenza. L'auth di produzione è delegata all'applicazione reale.
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
- I tre domini di consenso restano separati: mai una singola checkbox combinata (§33.5).
- La registrazione standalone (`/public/register` e registrazione in `/public/account`) richiede accettazione Termini **e** presa visione Informativa privacy: entrambe obbligatorie, bloccano il submit (§33.5).
- Il consenso alle comunicazioni commerciali è opzionale, non spuntato di default, e non blocca mai account / verifica / pagamento / report (§33.5).
- Il consenso commerciale della registrazione standalone è scritto come boolean esplicito, dopo la verifica email, al dominio di identità risolto (`applyStandaloneRegistrationConsent`): Pipeline → `marketing_consents[emailVerificata]`; Student esistente → il contatto email verificato corrispondente (`contacts.emails[].marketing_consent`), mai un valore globale, mai altre email dello Student (§33.5).
- Per la Pipeline: chiave assente = mai raccolto, `false` = chiesto e non concesso, `true` = concesso — non collassare assente e `false` (§33.5).
- Se la registrazione standalone risolve a uno Student esistente non si crea né aggiorna una Pipeline; la scelta esplicita (checked → `true`, unchecked → `false`) aggiorna solo `marketing_consent` del contatto email verificato via `updateStudent`, senza toccare altre email / `purposes` / servizi / altri campi. Se l'email verificata non è ancora un contatto ne viene aggiunto uno minimo (§33.5).
- I booleani `termsAccepted` / `privacyAcknowledged` sul registered-account registry sono persistenza di prototipo: assente = non registrato, mai accettato; nessuna retroattività sugli account legacy; la produzione richiede versione + timestamp + audit (§33.5).
- Wording legale finale, versioni e URL delle policy sono responsabilità di cliente/legale; il prototipo non inventa versioni, link o testo legale (§33.5).
- Profilo e Account sono superfici distinte con route separate: `/public-view/profilo` + `/public-view/account`, `/student-view/profilo` + `/student-view/account`. `/public/account` resta esclusivamente il gate account del checkout (§33.5).
- Termini e Informativa privacy vivono sulla pagina Account (sola lettura); il consenso commerciale vive sul Profilo (Slice C). Nessuna duplicazione di contenuti tra Profilo e Account (§33.5).
- La pagina Account standalone legge lo stato Termini/Privacy dalla persistenza prototipo Slice A (registry → mirror sessione); assente = `Stato non registrato nel prototipo`, mai accettato per default. Lo Student non ha stato legale nel prototipo → righe neutre, niente date/versioni/accettazioni fabbricate (§33.5).
- Nel sidebar `Profilo` è nello slot secondario in basso per standalone autenticato e Student (come Admin); Account non è nel sidebar, si raggiunge dal menu utente in alto a destra (`Informazioni Account` → `accountPath`) e dal cross-link del Profilo (§33.5).
- Il consenso alle comunicazioni commerciali vive nel Profilo (sezione `Comunicazioni`), mai in Account. Terms/Privacy restano in Account (§33.5).
- Il controllo è a scelta esplicita tri-state (`Sì` / `No` / non espresso): unknown non va mai collassato in `No`. Non spuntato di default; mai gate a registrazione/pagamento/report/servizi (§33.5).
- `Pipeline.marketing_consents` mantiene il tipo `Record<string, boolean>`: chiave assente = sconosciuto, `false` = chiesto/non concesso, `true` = concesso. Read tri-state via `readEmailMarketingConsent`; niente `map[email] || false` (§33.5).
- **Consenso Student = per email** (`Student.contacts.emails[].marketing_consent?: boolean | null`): `true` consentito / `false` non consentito / `null` o assente = non richiesto. Il vecchio globale `Student.marketing_consent` è deprecato, nessuna UI/lettura/scrittura canonica lo usa; `migrateLegacyStudentConsent` sposta un valore seed sulla sola email primaria al load (Student senza email primaria → nessun consenso per email, limite documentato). Conversioni Pipeline→Student portano il consenso **per contatto** dal map Pipeline (chiave `true`/`false` → stesso valore sull'email; chiave assente → `null`), mai collassato in un unico valore, mai `false` fabbricato (§33.5).
- Nel Profilo standalone la preferenza va all'identità risolta: Pipeline → `marketing_consents[emailVerificata]`; Student → `marketing_consent` della **sola email verificata corrispondente**; nessun owner → stato neutro, nessuna Pipeline creata solo per la preferenza (§33.5).
- Salvando il Profilo, una preferenza non toccata dall'utente resta invariata (assente/`null`/`true`/`false`): solo una scelta esplicita persiste il boolean (§33.5).
- Admin: vocabolario consenso unico — `Consentito` / `Non consentito` / `Non richiesto` (per contatto / per email); sintesi persona `Ricontatto consentito` / `Ricontatto non consentito` / `Consenso non richiesto` (Pipeline: sui contatti correnti; Student: su `deriveStudentRecontactSummary` sulle email correnti). Pill neutro + testo, mai verde brand come success generico (§33.5).
- Pipeline: il consenso resta per contatto; la sintesi persona è derivata sui contatti correnti (qualsiasi `true` → consentito; altrimenti qualsiasi `false` → non consentito; altrimenti non richiesto) e NON implica che tutti i canali siano permessi — il dettaglio per-contatto resta autoritativo (§33.5).
- Admin Pipeline list/card mostra un pill di ricontatto vicino ai `sources`; nessuna nuova colonna, nessun filtro consenso in questo slice (§33.5).
- Student: Admin e Profilo Student condividono la stessa source of truth (`useLavorazioni().students` + `updateStudent`, campo per-email); la visibilità Admin riflette le modifiche del Profilo nella stessa sessione SPA. Nessuna seconda copia del consenso (§33.5).
- Editing consenso Pipeline: per-contatto con controllo tri-state esplicito (`MarketingConsentSelect`). `Non richiesto` **rimuove** la chiave (unico caso legittimo di cancellazione = ritorno a sconosciuto); `Non consentito` = chiave `false`; salvare campi non correlati non tocca il map. Nessun toggle globale (§33.5).
- Editing consenso Student: controllo tri-state `MarketingConsentSelect` **dentro ogni card email** di `ContactManager` (`mode='student'`), sotto l'indirizzo — email primaria e aggiuntive. Aggiorna solo lo stato locale dei contatti; persistito dal normale `Salva modifiche` del drawer (nessun auto-save, nessun save separato, nessuna sezione globale). Scrive solo `contacts.emails[].marketing_consent` dell'email toccata; `is_primary`, `purposes`, accesso servizi e le altre email non sono toccati. Nessun toggle nel kebab. Legge la fonte condivisa; migrazione contatti non-lossy (§33.5).
- List/card `/studenti`: una sola pill read-only di triage per Student (`deriveStudentRecontactSummary` sulle email correnti); il valore per-email nel drawer resta autoritativo (§33.5).
- Il drawer Student non gestisce l'accesso ai servizi: `ContactManager` in `mode='student'` mostra solo dati di contatto (rimossi `Accesso servizi` / `service_access` / UI `purposes`); l'owner dell'accesso è `TimelineDrawer` (`/coaching/timeline`). Migrazione contatti del drawer resa non lossy (§33.5).
- Invariante duro: contatti Student ⇎ accesso servizi ⇎ consenso commerciale sono domini separati; modificarne uno non altera gli altri; impostare un'altra email come principale non trasferisce il consenso tra record (§33.5).

---

## 30. Decisioni prodotto ancora aperte

1. Policy legale di retention/eliminazione effettiva di file originali, report e
   record storico/pagamento (concern di produzione, separato dall'UX §20).
2. Quale visibilità dello staff Sottotesi sui file/report è consentita.
3. Scope production delle pagine Profilo/Account incomplete.
4. Eventuale collegamento opzionale futuro tra Coach paid free check e un percorso coaching.

> Risolte: la scadenza a 30 giorni e la condizione `In scadenza` sono state
> rimosse (§20); non c'è più una decisione aperta su "quali dati restano dopo
> expiry" perché non c'è expiry applicativo. L'editing del titolo prima di
> run/pagamento e il rename dallo Storico sono implementati (§16).

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
- scadenza a 30 giorni del report / stato `Scaduto` / `In scadenza` / box "Conserva il report" con data;
- `expiresAt` letto per limitare l'accesso al report o allo Storico;
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
6. history persistente (archivio, nessuna expiry) + titolo semantico del check;
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

**Stato prototipo — Slice A (registrazione standalone).** I due entry point di
registrazione standalone (`/public/register` diretto e registrazione dentro
`/public/account`) espongono ora tre controlli distinti nel `RegisterForm`
condiviso:

- `Accetto i Termini e condizioni` — **obbligatorio**, blocca il submit;
- `Dichiaro di aver preso visione dell'Informativa privacy` — **obbligatorio**,
  blocca il submit (acknowledgement, non consenso);
- `Comunicazioni commerciali` — **opzionale**, non spuntato di default, non
  blocca mai registrazione / verifica email / pagamento / accesso al report.

I titoli legali sono resi come **testo**, non link: nel prototipo non esiste una
policy page / URL reale. Wording finale, versione e link sono responsabilità di
cliente/legale; nessuna versione o timestamp è inventata.

Persistenza prototipo:

- Termini + privacy → booleani opzionali (`termsAccepted`, `privacyAcknowledged`)
  sul **registered-account registry** (`RegisteredAccount`), mirrorati sulla
  sessione. Assenti = "non registrato nel prototipo", mai interpretati come
  accettato; nessuna migrazione retroattiva degli account legacy. La produzione
  deve sostituirli con versione + timestamp + audit.
- Consenso commerciale → boolean **esplicito** scritto dopo la verifica email
  al dominio di identità che la risoluzione di acquisizione risolve
  (`applyStandaloneRegistrationConsent`):
  - **Pipeline** (`created` / `enriched`) → `Pipeline.marketing_consents[emailVerificata]`.
    `true` = concesso, `false` = chiesto e non concesso; chiave assente = mai
    raccolto (non collassare con `map[email] || false`).
  - **Student esistente** → nessuna Pipeline (regola invariata); la scelta
    esplicita aggiorna `marketing_consent` del **contatto email verificato
    corrispondente** (`contacts.emails[].marketing_consent`) tramite
    `updateStudent` (checked → `true`, unchecked → `false`; nessuna inferenza).
    Mai un valore globale, mai altre email; `purposes` / servizi / altri campi
    non toccati. Email verificata non ancora contatto → viene aggiunto un
    contatto minimo così la scelta esplicita non va persa.
  - `Terms` / `Privacy` restano dominio account, indipendenti dall'identità di
    acquisizione.

**Profilo ≠ Account (direzione di prodotto).** Sono superfici separate:

- **Profilo** (`/public-view/profilo`, `/student-view/profilo`) → identità,
  contatti, dati accademici, **consenso alle comunicazioni commerciali**.
- **Account** (`/public-view/account`, `/student-view/account` — futuri) → email
  account, password / recupero, **stato accettazione Termini**, **stato presa
  visione Privacy**, azioni di gestione account.
- `/public/account` resta il **gate account del checkout a pagamento**: non va
  mai riusato come pagina Account/impostazioni autenticata.

Termini e Privacy **non** vanno come righe dentro il Profilo: sono stato di
dominio Account. Slice A lo rispetta (Termini/Privacy sul registry account,
consenso commerciale su Pipeline/Student).

**Slice B — implementato.** Pagine Account reali per ruolo:
`/public-view/account` e `/student-view/account`, superfici distinte dai Profili.

- Standalone (`PublicAccountPage`): sezione `Accesso` (email read-only, entry al
  recupero password prototipo con `?returnTo=/public-view/account`) + sezione
  `Termini e privacy` in **sola lettura** dallo stato Slice A (registry
  `RegisteredAccount` → mirror sessione); registrato → `Accettati` /
  `Presa visione registrata`, assente → `Stato non registrato nel prototipo`.
  Nessun toggle, nessuna data/versione/URL inventata.
- Student (`student/AccountPage`): stesso `Student` strutturato del Profilo per
  l'email; nessun flusso password e nessun modello legale Student nel prototipo →
  righe neutre (UI: `Stato non disponibile`), niente fabbricato, nessun campo
  aggiunto a `Student`. Il modello legale/account Student non è modellato: lo deve
  fornire la produzione.
- IA: `UserTopbarMenu` prop `profilePath` → `accountPath`; `Informazioni Account`
  porta a `…/account` per Public/Student (Admin invariato, Coach interim al
  proprio Profilo, documentato). `PublicSidebar` sposta `Profilo` nello slot
  secondario in basso (come Student/Admin); Account non è nel sidebar. Cross-link
  reciproci Profilo ↔ Account. `/public/account` resta il gate del checkout.

**Slice C — implementato.** Controllo consenso alle comunicazioni commerciali
(dominio 3) dentro i Profili — **non** in Account.

- Sezione `Profilo` → `Comunicazioni` con controllo a scelta esplicita (radio
  tri-state condiviso `CommercialConsentField`): `Sì` / `No`; se lo stato è
  sconosciuto nessuna opzione è selezionata + `Preferenza non ancora espressa.`
  Helper: `Puoi modificare questa scelta in qualsiasi momento.` Copy neutra di
  prototipo; il testo finale resta di cliente/legale.
- **Tri-state, unknown ≠ No.**
  - `Pipeline.marketing_consents` (tipo invariato `Record<string, boolean>`):
    chiave assente = sconosciuto, `false` = chiesto/non concesso, `true` =
    concesso. La sola read logic necessaria al Profilo è tri-state
    (`readEmailMarketingConsent`); le normalizzazioni Admin sono Slice D.
  - `Student.marketing_consent`: tipo allargato a **`boolean | null`**
    (`true` concesso, `false` rifiutato/revocato, `null` mai chiesto). I seed
    restano valori demo espliciti; nuove creazioni/conversioni che non
    raccolgono davvero una preferenza scrivono `null`, mai `false` fabbricato.
- **Owner della preferenza standalone = identità risolta** (stessa regola della
  registrazione): target Pipeline → `marketing_consents[emailVerificata]`;
  target Student → `Student.marketing_consent` via `updateStudent`, nessuna
  Pipeline creata; nessun owner sicuro → stato neutro, nessuna Pipeline creata
  solo per una preferenza.
- **Student Profile** scrive solo dominio Student (`updateStudent`), integrato
  nel salvataggio Profilo esistente. Nessun salvataggio Account separato.
- **Preservazione unknown al salvataggio:** una preferenza non toccata
  dall'utente (assente / `null` / `true` / `false`) non viene riscritta salvando
  altri campi del Profilo. Solo una scelta esplicita persiste il boolean.
- Il Profilo non richiede mai il consenso e non gate-a registrazione, pagamento,
  report o accesso ai servizi.

**Slice D — implementato.** Visibilità Admin del consenso commerciale, senza
redesign e senza filtri. *(Correzione di dominio successiva: il consenso Student
è **per email** su `Student.contacts.emails[].marketing_consent`, non un valore
globale di persona — i punti sotto sono già aggiornati.)*

- Vocabolario Admin unico: per-contatto / per-Student `Consentito` /
  `Non consentito` / `Non richiesto`; sintesi persona Pipeline
  `Ricontatto consentito` / `Ricontatto non consentito` / `Consenso non richiesto`.
  Reso con `StatusPill` neutro + testo esplicito (nessun verde brand come
  "success" generico).
- Helper tri-state condivisi in `src/app/data/marketingConsent.ts`
  (`readMarketingConsentForContact`, `deriveRecontactSummary`,
  `pipelineContactKeys`, label). `readEmailMarketingConsent` è ora un re-export di
  `readMarketingConsentForContact`.
- **Pipeline: consenso per contatto, editing tri-state esplicito.**
  `PipelineDetailDrawer` e `CreatePipelineDrawer` usano un controllo
  `MarketingConsentSelect` (`Non richiesto` / `Consentito` / `Non consentito`)
  per ogni contatto — non più un checkbox binario, **nessun auto-save**.
  `Consentito` → chiave `= true`; `Non consentito` → chiave `= false`;
  `Non richiesto` → **rimuove** la chiave (unico caso legittimo di cancellazione:
  ritorno a sconosciuto, non è un "no" esplicito). L'integrazione **non cambia
  l'architettura del drawer**: `PipelineDetailDrawer` mantiene il pattern
  per-campo (click → editor → Save inline: `saveConsent`); `CreatePipelineDrawer`
  mantiene `click → editor → conferma`, persistenza sull'azione "Crea". Nessun
  footer `Salva modifiche` globale, nessun Save inline rimosso.
  `CreateLavorazioneDrawer` mostra solo un display read-only tri-state (converte,
  non edita).
- **Pipeline: sintesi persona derivata** sui **contatti correnti**: almeno un
  contatto `true` → `Ricontatto consentito`; altrimenti almeno un `false` →
  `Ricontatto non consentito`; altrimenti `Consenso non richiesto`. Risponde a
  "esiste un canale su cui è permesso ricontattare?", **non** "tutti i canali
  sono permessi". Il dettaglio per-contatto resta autoritativo su QUALE canale
  (es. email `true` + phone `false` → sintesi `Ricontatto consentito`, ma il
  drawer mostra phone `Non consentito`). Chiavi stale non influenzano la sintesi.
- **Pipeline list/card**: pill compatto vicino ai `sources` (desktop + mobile),
  leggibile in triage senza aprire il drawer. Nessuna nuova colonna.
- **Student: consenso PER EMAIL, editing solo nel drawer.** Domini distinti e
  mai combinati visivamente: dati di contatto, accesso ai servizi (owner:
  `TimelineDrawer`, `/coaching/timeline`), consenso commerciale
  (`Student.contacts.emails[].marketing_consent`). In `CreateStudentDrawer` la
  sezione contatti (`ContactManager`, `mode='student'`) mostra **solo dati di
  contatto**: rimossi badge/pulsante `Accesso servizi`, controlli
  `service_access` e UI grezza di `purposes` (campi del modello intatti; Coach
  invariato). La migrazione contatti del drawer è **non lossy**: salvare il
  drawer non altera `purposes` / accesso / consenso di email non toccate.
- **Editing consenso Student = controllo tri-state `MarketingConsentSelect`**
  (`Non richiesto → chiave assente` / `Consentito → true` / `Non consentito →
  false`) **dentro ogni card email** di `ContactManager` (`mode='student'`),
  sotto l'indirizzo — email primaria e aggiuntive. La card email contiene solo
  indirizzo + designazione principale + azioni di contatto + select consenso.
  Aggiorna lo stato locale dei contatti; persistito **solo** dal normale
  `Salva modifiche` del drawer (nessuna sezione a sé, nessun save separato,
  nessun auto-save). Scrive `contacts.emails[].marketing_consent` dell'email
  toccata; `is_primary` / `purposes` / accesso / altre email non toccati. Legge
  il record **condiviso** `useLavorazioni().students`. Create mode: `Non
  richiesto`, facoltativo, non fabbrica `false`. **Nessun toggle nel menu kebab.**
- **Legacy**: il globale `Student.marketing_consent` è deprecato — nessuna
  UI/lettura/scrittura canonica lo usa. `migrateLegacyStudentConsent` sposta un
  valore seed sulla sola email primaria al load; Student senza email primaria →
  nessun consenso per email (limite documentato).
- **Student list/card**: una sola pill read-only di triage
  (`deriveStudentRecontactSummary` sulle email correnti → `Ricontatto consentito`
  / `Ricontatto non consentito` / `Consenso non richiesto`), letta dalla fonte
  condivisa. Il valore per-email nel drawer resta autoritativo. Nessun
  Terms/Privacy nel drawer.
- **Invariante duro**: modifiche ai contatti nel drawer Student non
  concedono/revocano accesso e non alterano `purposes` né spostano il consenso
  tra record; impostare un'altra email come principale non trasferisce il
  consenso; il flusso di accesso in `TimelineDrawer` non altera
  `marketing_consent`; l'editing del consenso di un'email non altera
  accesso / `purposes` / `is_primary` / le altre email.
- **Conversione Pipeline → Student = per contatto**: per ogni email creata dalla
  Pipeline il consenso è `readMarketingConsentForContact(map, quellaEmail)` —
  chiave `true`→`true`, `false`→`false`, assente→`null`; mai `!!map[email]`, mai
  collasso del map in un unico valore.

Fuori da Slice D: filtri consenso Admin, azioni bulk marketing, integrazioni
email marketing, policy/legal pages, gestione Termini/Privacy in Admin,
timestamp/versioning/audit del consenso, log immutabile, Coach consent, Coach
Account/Profilo. La produzione possiede provenienza, timestamp, audit ed evidenza
legale.

### 33.6 Handoff implementativo

Vedi [tesicheck-standalone-enrichment-handoff.md](./tesicheck-standalone-enrichment-handoff.md)
per la nota tecnica: risoluzione d'identità via email come stand-in prototipale,
evento di creazione al verify email, CRM `LavorazioniContext` in memoria
(sopravvive alla navigazione SPA, non al reload completo), requisito aperto per
l'accettazione versionata Termini/privacy.

