# Admin Dashboard — Guidelines (MVP)
<!--
Use this file to guide LLMs when generating or updating
the Student Dashboard experience.
Focus on MVP, clarity, and minimal UI.
-->

# General guidelines

* This is an MVP. Prefer clarity over completeness.
* Do NOT introduce new pages or complex navigation structures.
* The student must stay inside the dashboard flow as much as possible.
* Avoid drawers as “sources of truth”. Drawers are allowed only for actions (e.g. upload).
* No real-time chat assumptions. Communication is asynchronous.
* Do not add features unless explicitly requested.

## Contesto d’uso (vincolo forte)

Questa dashboard è usata:
- sporadicamente
- per operazioni correttive
- da persone che vogliono uscire il prima possibile

NON è:
- una dashboard di monitoraggio continuo
- un prodotto principale
- un’interfaccia da esplorare
- un luogo di insight o analisi

Se un elemento non serve a:
- correggere
- abilitare
- disabilitare
- rimuovere

NON va mostrato.


## Obiettivo del ruolo Admin
L’Admin **non lavora sui contenuti educativi**.  
Il suo obiettivo è:
- controllare che il sistema funzioni
- gestire utenti, ruoli e stati
- avere visibilità operativa minima, non analitica

👉 Niente UX “piacevole”: **chiarezza, velocità, controllo**.

---

## Principi di progetto (non negoziabili)
- **MVP vero**: niente feature speculative
- **CRUD first**: liste, stati, azioni chiare
- **No timeline / no feed / no storytelling**
- **Una schermata = una responsabilità**
- **Zero duplicazioni con coach/student**

Se una cosa può essere fatta meglio dal coach o dallo studente → **non è admin**.

---

## Punto di partenza
- UI importata da **Laravel Admin Panel**
- Usala come base funzionale

❌ Non ridisegnare tutto  
✅ Razionalizza ciò che c’è

---

## Struttura della Dashboard Admin

### 1. Navigation (sidebar)
Essenziale, piatta, leggibile.

Voci consigliate (ordine di priorità):
1. Dashboard
2. Utenti
3. Percorsi / Programmi
4. Documenti
5. Attività / Log
6. Impostazioni

❌ Niente icone decorative  
✅ Icone solo se aiutano lo scanning

---

### 2. Dashboard (home admin)
Scopo: **stato del sistema, non insight**

Contenuto minimo:
- Totale utenti (studenti / coach)
- Percorsi attivi
- Documenti caricati
- Alert tecnici (se presenti)

Formato:
- Card semplici
- Numeri grandi
- Nessun grafico se non serve a decidere

Se non porta a un’azione → fuori.

---

### 3. Utenti
Vista **tabellare**, stile gestionale.

Colonne minime:
- Nome
- Ruolo (Admin / Coach / Studente)
- Stato (Attivo / Invitato / Bloccato)
- Ultima attività
- Azioni (⋯)

Azioni consentite:
- Cambia ruolo
- Attiva / Disattiva
- Rimuovi

❌ Niente profili “ricchi”  
✅ Dettaglio solo se serve a correggere un errore

---

### 4. Percorsi / Programmi
L’Admin **non segue il percorso**, lo **amministra**.

Vista:
- Lista programmi
- Stato (attivo / archiviato)
- Coach assegnati
- Numero studenti

Azioni:
- Attiva / Disattiva
- Assegna coach
- Archivia

❌ Niente step view  
❌ Niente progresso studenti

---

### 5. Documenti
Qui sì, serve chiarezza.

Vista:
- Tabella documenti
- Tipo
- Autore (studente / coach)
- Percorso
- Stato (visibile / nascosto)

Azioni:
- Rimuovi
- Nascondi
- Scarica

⚠️ L’admin **modera**, non commenta.

---

### 6. Attività / Log
Scopo: **audit**, non UX.

Contenuto:
- Upload
- Invii
- Modifiche stato
- Errori

Formato:
- Lista cronologica
- Filtri base (utente, tipo evento)

❌ Nessuna interazione sociale  
❌ Nessuna notifica push

---

### 7. Impostazioni
Solo ciò che è sistemico:
- Ruoli
- Permessi base
- Configurazioni globali

Se una setting riguarda un singolo programma → **non qui**.

---

## Microcopy (tono)
- Diretto
- Neutro
- Operativo

Esempi:
- “Disattiva utente”
- “Documento nascosto”
- “Percorso archiviato”

❌ Linguaggio empatico  
❌ Call to action “motivazionali”

---

## Interazioni
- Feedback immediato (toast semplici)
- Conferma solo per azioni distruttive
- No animazioni decorative

---

## Cose da NON fare (importante)
- ❌ Duplicare dashboard coach
- ❌ Aggiungere notifiche real-time
- ❌ Pensare l’admin come power-user creativo
- ❌ Anticipare analytics avanzate

---

## Criterio finale
Se togli una feature e **nessuno se ne accorge** → era giusto non metterla.

Admin = **strumento**, non prodotto.

---

## Architettura UI — Componenti condivisi

### DrawerPrimitives (`/src/app/components/DrawerPrimitives.tsx`)

Libreria di primitivi React condivisa da tutti i drawer di creazione.

**Principio:** ogni nuovo drawer deve usare questi primitivi, non ridefinire stili inline.

**Regola CSS:** tutti i valori usano esclusivamente variabili del design system (`var(--...)`). Nessun colore, font o spacing hardcoded.

**Componenti strutturali:**
- `DrawerOverlay` + `DrawerShell` → struttura del pannello
- `DrawerHeader` → header normalizzato con icona e close button
- `DrawerBody` → area scrollabile
- `DrawerFooter` → azioni (row o column)

**Componenti di contenuto:**
- `DrawerSection` → sezione con titolo, icona, hint
- `DrawerLabel` / `DrawerMicroLabel` → etichette
- `DrawerFieldGroup` → spaziatura campi
- `DrawerReadonlyRow` → dato read-only chiave/valore
- `DrawerEmptyState` → stato vuoto
- `DrawerInfoNote` → nota informativa
- `DrawerChip` → tag rimuovibile
- `DrawerAddButton` → pulsante "aggiungi" tratteggiato

**Style objects per spread:**
`drawerInputStyle`, `drawerSelectStyle`, `drawerLabelStyle`, `drawerMicroLabelStyle`, `drawerSectionTitleStyle`, `drawerFieldGroupStyle`

**Animazioni:** definite in `dashboard.css` (`fadeIn`, `slideInFromRight`). Non ridefinirle nei drawer.

**Drawer che usano DrawerPrimitives:**
- `CreateLavorazioneDrawer.tsx`
- `CreatePipelineDrawer.tsx`
- `CreateStudentDrawer.tsx`
