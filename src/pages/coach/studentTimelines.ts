import { TimelineStepData } from '../../app/components/coach/CoachTimelineList';
import { Document } from '../../app/components/coach/DocumentArchiveDrawer';

export interface StudentTimelineBundle {
  steps: TimelineStepData[];
  documents: Document[];
}

/**
 * Returns per-student timeline data keyed by student ID.
 * studentName is passed so that activity authors match the student.
 */
export function getStudentTimeline(studentId: string, studentName: string): StudentTimelineBundle {
  const timelines: Record<string, () => StudentTimelineBundle> = {

    /* ──────────── S-034 · Giulia Verdi — Psicologia, Fase 3 di 6 ──────────── */
    'S-034': () => ({
      steps: [
        {
          id: '1',
          phaseNumber: 'FASE 1 DI 6',
          title: 'Definizione dell\'obiettivo di ricerca e ipotesi',
          description: 'Formulazione della domanda di ricerca, definizione delle ipotesi e identificazione delle variabili chiave per lo studio sulla mindfulness e l\'ansia.',
          startDate: 'Inizio 10 dicembre 2025',
          deadline: 'Completato il 28 dicembre 2025',
          originalDeadline: 'Scadenza 30 dicembre 2025',
          completedDate: '28/12/2025',
          completionStatus: 'early',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'gv-d1', fileName: 'Ipotesi_Ricerca_Mindfulness.pdf', uploadDate: '26/12/2025 h:11.00', uploadedBy: studentName },
          ],
          activities: [
            { id: 'gv-a1-1', type: 'document', timestamp: '26/12/2025 alle 11:00', author: studentName, fileName: 'Ipotesi_Ricerca_Mindfulness.pdf', description: 'Documento con le ipotesi di ricerca formulate' },
            { id: 'gv-a1-2', type: 'note', timestamp: '24/12/2025 alle 09:30', author: 'Coach', content: 'Le ipotesi sono ben formulate. Suggerirei di aggiungere una variabile di controllo per il livello di stress percepito.' },
            { id: 'gv-a1-3', type: 'note', timestamp: '20/12/2025 alle 14:00', author: studentName, content: 'Ho identificato tre ipotesi principali. Attendo feedback prima di procedere con il disegno sperimentale.' },
          ],
        },
        {
          id: '2',
          phaseNumber: 'FASE 2 DI 6',
          title: 'Rassegna bibliografica e framework teorico',
          description: 'Revisione sistematica della letteratura su mindfulness, ansia e interventi psicologici per giovani adulti universitari.',
          startDate: 'Inizio 2 gennaio 2026',
          deadline: 'Completato il 25 gennaio 2026',
          originalDeadline: 'Scadenza 25 gennaio 2026',
          completedDate: '25/01/2026',
          completionStatus: 'on-time',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'gv-d2-1', fileName: 'Review_Letteratura_Mindfulness.pdf', uploadDate: '20/01/2026 h:16.30', uploadedBy: studentName },
            { id: 'gv-d2-2', fileName: 'Feedback_Review_Coach.pdf', uploadDate: '23/01/2026 h:10.00', uploadedBy: 'Coach' },
          ],
          activities: [
            { id: 'gv-a2-1', type: 'document', timestamp: '23/01/2026 alle 10:00', author: 'Coach', fileName: 'Feedback_Review_Coach.pdf', description: 'Revisione con suggerimenti di integrazione' },
            { id: 'gv-a2-2', type: 'document', timestamp: '20/01/2026 alle 16:30', author: studentName, fileName: 'Review_Letteratura_Mindfulness.pdf', description: 'Revisione sistematica completata' },
            { id: 'gv-a2-3', type: 'note', timestamp: '15/01/2026 alle 11:00', author: studentName, content: 'Ho raccolto 60 articoli rilevanti, di cui 35 studi sperimentali. Procedo con la sintesi.' },
          ],
        },
        {
          id: '3',
          phaseNumber: 'FASE 3 DI 6',
          title: 'Disegno sperimentale e raccolta dati',
          description: 'Definizione del protocollo sperimentale, creazione dei questionari, reclutamento del campione e avvio della raccolta dati longitudinale.',
          startDate: 'Inizio 26 gennaio 2026',
          deadline: 'Scadenza 2 marzo 2026',
          status: 'active',
          isVisibleToStudent: true,
          documents: [
            { id: 'gv-d3-1', fileName: 'Protocollo_Sperimentale_v2.pdf', uploadDate: '15/02/2026 h:14.20', uploadedBy: studentName, isNew: true },
          ],
          activities: [
            { id: 'gv-a3-1', type: 'document', timestamp: '15/02/2026 alle 14:20', author: studentName, fileName: 'Protocollo_Sperimentale_v2.pdf', description: 'Seconda versione del protocollo con modifiche richieste', isNew: true },
            { id: 'gv-a3-2', type: 'note', timestamp: '10/02/2026 alle 16:00', author: 'Coach', content: 'Il campione minimo dovrebbe essere di 80 partecipanti per avere potenza statistica adeguata. Rivedi il protocollo di reclutamento.' },
            { id: 'gv-a3-3', type: 'note', timestamp: '05/02/2026 alle 09:30', author: studentName, content: 'Ho ottenuto l\'approvazione del comitato etico. Possiamo procedere con il reclutamento.' },
          ],
        },
        {
          id: '4',
          phaseNumber: 'FASE 4 DI 6',
          title: 'Analisi statistica dei dati',
          description: 'Analisi quantitativa dei dati raccolti tramite SPSS, test di ipotesi, correlazioni e regressioni.',
          startDate: 'Inizio 3 marzo 2026',
          deadline: 'Scadenza 25 marzo 2026',
          status: 'upcoming',
          isVisibleToStudent: true,
          documents: [],
          activities: [],
        },
        {
          id: '5',
          phaseNumber: 'FASE 5 DI 6',
          title: 'Discussione dei risultati',
          description: 'Interpretazione dei risultati, confronto con la letteratura, identificazione dei limiti e implicazioni cliniche.',
          startDate: 'Inizio 26 marzo 2026',
          deadline: 'Scadenza 20 aprile 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
        {
          id: '6',
          phaseNumber: 'FASE 6 DI 6',
          title: 'Stesura finale e revisione',
          description: 'Assemblaggio di tutti i capitoli, revisione formale, preparazione della bibliografia e abstract.',
          startDate: 'Inizio 21 aprile 2026',
          deadline: 'Scadenza 15 maggio 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
      ],
      documents: [
        { id: 'gv-doc-1', name: 'Ipotesi_Ricerca_Mindfulness.pdf', sender: 'student', stepId: '1', stepTitle: 'Definizione dell\'obiettivo di ricerca e ipotesi', date: '26/12/2025 h:11.00', size: '980 KB', uploadedBy: 'Giulia Verdi', plagiarismStatus: 'clear', plagiarismCheckDate: '27/12/2025', plagiarismCheckedBy: 'Coach' },
        { id: 'gv-doc-2', name: 'Review_Letteratura_Mindfulness.pdf', sender: 'student', stepId: '2', stepTitle: 'Rassegna bibliografica e framework teorico', date: '20/01/2026 h:16.30', size: '2.4 MB', uploadedBy: 'Giulia Verdi', plagiarismStatus: 'clear', plagiarismCheckDate: '22/01/2026', plagiarismCheckedBy: 'Coach' },
        { id: 'gv-doc-3', name: 'Protocollo_Sperimentale_v2.pdf', sender: 'student', stepId: '3', stepTitle: 'Disegno sperimentale e raccolta dati', date: '15/02/2026 h:14.20', size: '1.1 MB', uploadedBy: 'Giulia Verdi', plagiarismStatus: 'none' },
        { id: 'gv-doc-4', name: 'Feedback_Review_Coach.pdf', sender: 'coach', stepId: '2', stepTitle: 'Rassegna bibliografica e framework teorico', date: '23/01/2026 h:10.00', size: '540 KB', uploadedBy: 'Coach', plagiarismStatus: 'none' },
      ],
    }),

    /* ──────────── S-022 · Sara Martini — Ing. Gestionale, Fase 1 di 4 ──────────── */
    'S-022': () => ({
      steps: [
        {
          id: '1',
          phaseNumber: 'FASE 1 DI 4',
          title: 'Analisi del contesto e selezione del caso aziendale',
          description: 'Studio del settore farmaceutico italiano, mappatura della supply chain e selezione della multinazionale per il caso studio.',
          startDate: 'Inizio 20 gennaio 2026',
          deadline: 'Scadenza 7 marzo 2026',
          status: 'active',
          isVisibleToStudent: true,
          documents: [
            { id: 'sm-d1-1', fileName: 'Mappatura_Supply_Chain_Farma.pdf', uploadDate: '18/02/2026 h:09.30', uploadedBy: studentName, isNew: true },
          ],
          activities: [
            { id: 'sm-a1-1', type: 'document', timestamp: '18/02/2026 alle 09:30', author: studentName, fileName: 'Mappatura_Supply_Chain_Farma.pdf', description: 'Prima mappatura dei processi logistici', isNew: true },
            { id: 'sm-a1-2', type: 'note', timestamp: '10/02/2026 alle 14:00', author: 'Coach', content: 'Concentrati sull\'analisi degli indicatori KPI di efficienza logistica: lead time, fill rate e inventory turnover.' },
            { id: 'sm-a1-3', type: 'note', timestamp: '01/02/2026 alle 11:00', author: studentName, content: 'Ho contattato l\'azienda e ottenuto l\'accesso ai dati logistici degli ultimi 3 anni. Procedo con la mappatura.' },
          ],
        },
        {
          id: '2',
          phaseNumber: 'FASE 2 DI 4',
          title: 'Raccolta dati e analisi dei processi AS-IS',
          description: 'Raccolta dei dati quantitativi sui processi logistici attuali, interviste con i responsabili e analisi delle inefficienze.',
          startDate: 'Inizio 8 marzo 2026',
          deadline: 'Scadenza 15 aprile 2026',
          status: 'upcoming',
          isVisibleToStudent: true,
          documents: [],
          activities: [],
        },
        {
          id: '3',
          phaseNumber: 'FASE 3 DI 4',
          title: 'Proposta di ottimizzazione e modello TO-BE',
          description: 'Sviluppo del modello ottimizzato dei processi logistici, simulazione dei miglioramenti e analisi costi-benefici.',
          startDate: 'Inizio 16 aprile 2026',
          deadline: 'Scadenza 25 maggio 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
        {
          id: '4',
          phaseNumber: 'FASE 4 DI 4',
          title: 'Stesura finale e conclusioni',
          description: 'Assemblaggio dei capitoli, stesura delle conclusioni con raccomandazioni operative e revisione finale.',
          startDate: 'Inizio 26 maggio 2026',
          deadline: 'Scadenza 20 giugno 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
      ],
      documents: [
        { id: 'sm-doc-1', name: 'Mappatura_Supply_Chain_Farma.pdf', sender: 'student', stepId: '1', stepTitle: 'Analisi del contesto e selezione del caso aziendale', date: '18/02/2026 h:09.30', size: '1.5 MB', uploadedBy: 'Sara Martini', plagiarismStatus: 'none' },
      ],
    }),

    /* ──────────── S-015 · Alessandro Bruno — Giurisprudenza, Completato ──────────── */
    'S-015': () => ({
      steps: [
        {
          id: '1',
          phaseNumber: 'FASE 1 DI 5',
          title: 'Inquadramento normativo e comparazione UE-USA',
          description: 'Analisi del GDPR europeo e confronto con il modello statunitense di tutela dei dati personali nel contesto dell\'IA.',
          startDate: 'Inizio 1 settembre 2025',
          deadline: 'Completato il 28 settembre 2025',
          originalDeadline: 'Scadenza 30 settembre 2025',
          completedDate: '28/09/2025',
          completionStatus: 'early',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'ab-d1', fileName: 'Inquadramento_GDPR_vs_USA.pdf', uploadDate: '25/09/2025 h:10.00', uploadedBy: studentName },
          ],
          activities: [
            { id: 'ab-a1-1', type: 'document', timestamp: '25/09/2025 alle 10:00', author: studentName, fileName: 'Inquadramento_GDPR_vs_USA.pdf', description: 'Analisi comparativa completa' },
            { id: 'ab-a1-2', type: 'note', timestamp: '20/09/2025 alle 15:00', author: 'Coach', content: 'Buon lavoro. Inserisci anche un riferimento al California Consumer Privacy Act (CCPA) come punto intermedio tra i due modelli.' },
          ],
        },
        {
          id: '2',
          phaseNumber: 'FASE 2 DI 5',
          title: 'L\'IA e le sfide giuridiche emergenti',
          description: 'Analisi dei profili giuridici specifici dell\'intelligenza artificiale: profilazione automatizzata, decisioni algoritmiche e responsabilità.',
          startDate: 'Inizio 1 ottobre 2025',
          deadline: 'Completato il 30 ottobre 2025',
          originalDeadline: 'Scadenza 31 ottobre 2025',
          completedDate: '30/10/2025',
          completionStatus: 'on-time',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'ab-d2', fileName: 'Sfide_Giuridiche_IA.pdf', uploadDate: '27/10/2025 h:14.00', uploadedBy: studentName },
          ],
          activities: [
            { id: 'ab-a2-1', type: 'document', timestamp: '27/10/2025 alle 14:00', author: studentName, fileName: 'Sfide_Giuridiche_IA.pdf', description: 'Capitolo sulle sfide giuridiche dell\'IA' },
            { id: 'ab-a2-2', type: 'note', timestamp: '22/10/2025 alle 10:30', author: 'Coach', content: 'L\'analisi sulla profilazione è eccellente. Approfondisci il caso Schrems II per il trasferimento dati transatlantico.' },
          ],
        },
        {
          id: '3',
          phaseNumber: 'FASE 3 DI 5',
          title: 'Analisi giurisprudenziale e casi studio',
          description: 'Studio di casi giurisprudenziali rilevanti nelle corti europee e americane riguardanti IA e protezione dati.',
          startDate: 'Inizio 1 novembre 2025',
          deadline: 'Completato il 2 dicembre 2025',
          originalDeadline: 'Scadenza 30 novembre 2025',
          completedDate: '02/12/2025',
          completionStatus: 'late',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'ab-d3', fileName: 'Casi_Giurisprudenziali_IA.pdf', uploadDate: '30/11/2025 h:16.00', uploadedBy: studentName },
          ],
          activities: [
            { id: 'ab-a3-1', type: 'document', timestamp: '30/11/2025 alle 16:00', author: studentName, fileName: 'Casi_Giurisprudenziali_IA.pdf', description: 'Raccolta e analisi dei casi giurisprudenziali' },
            { id: 'ab-a3-2', type: 'note', timestamp: '28/11/2025 alle 09:00', author: studentName, content: 'Ho avuto difficoltà a reperire sentenze americane recenti. Chiedo qualche giorno in più.' },
          ],
        },
        {
          id: '4',
          phaseNumber: 'FASE 4 DI 5',
          title: 'Proposte de iure condendo',
          description: 'Elaborazione di proposte legislative e raccomandazioni per un framework armonizzato UE-USA sulla protezione dati nell\'era dell\'IA.',
          startDate: 'Inizio 3 dicembre 2025',
          deadline: 'Completato il 10 gennaio 2026',
          originalDeadline: 'Scadenza 10 gennaio 2026',
          completedDate: '10/01/2026',
          completionStatus: 'on-time',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'ab-d4', fileName: 'Proposte_Legislative_IA.pdf', uploadDate: '08/01/2026 h:11.30', uploadedBy: studentName },
          ],
          activities: [
            { id: 'ab-a4-1', type: 'document', timestamp: '08/01/2026 alle 11:30', author: studentName, fileName: 'Proposte_Legislative_IA.pdf', description: 'Capitolo con le proposte legislative' },
            { id: 'ab-a4-2', type: 'note', timestamp: '05/01/2026 alle 14:00', author: 'Coach', content: 'Le proposte sono molto solide. Ottimo lavoro nel collegare i framework normativi con le esigenze pratiche dell\'industria.' },
          ],
        },
        {
          id: '5',
          phaseNumber: 'FASE 5 DI 5',
          title: 'Revisione finale e preparazione discussione',
          description: 'Revisione complessiva della tesi, controllo delle citazioni, formattazione e preparazione alla discussione.',
          startDate: 'Inizio 11 gennaio 2026',
          deadline: 'Completato il 14 febbraio 2026',
          originalDeadline: 'Scadenza 15 febbraio 2026',
          completedDate: '14/02/2026',
          completionStatus: 'early',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'ab-d5', fileName: 'Tesi_Finale_Bruno.pdf', uploadDate: '12/02/2026 h:09.00', uploadedBy: studentName },
          ],
          activities: [
            { id: 'ab-a5-1', type: 'document', timestamp: '12/02/2026 alle 09:00', author: studentName, fileName: 'Tesi_Finale_Bruno.pdf', description: 'Versione finale della tesi' },
            { id: 'ab-a5-2', type: 'note', timestamp: '13/02/2026 alle 16:00', author: 'Coach', content: 'Tesi approvata. Complimenti per il lavoro svolto. La struttura argomentativa è chiara e ben documentata.' },
          ],
        },
      ],
      documents: [
        { id: 'ab-doc-1', name: 'Inquadramento_GDPR_vs_USA.pdf', sender: 'student', stepId: '1', stepTitle: 'Inquadramento normativo e comparazione UE-USA', date: '25/09/2025 h:10.00', size: '1.8 MB', uploadedBy: 'Alessandro Bruno', plagiarismStatus: 'clear', plagiarismCheckDate: '26/09/2025', plagiarismCheckedBy: 'Coach' },
        { id: 'ab-doc-2', name: 'Sfide_Giuridiche_IA.pdf', sender: 'student', stepId: '2', stepTitle: 'L\'IA e le sfide giuridiche emergenti', date: '27/10/2025 h:14.00', size: '2.1 MB', uploadedBy: 'Alessandro Bruno', plagiarismStatus: 'clear', plagiarismCheckDate: '28/10/2025', plagiarismCheckedBy: 'Coach' },
        { id: 'ab-doc-3', name: 'Casi_Giurisprudenziali_IA.pdf', sender: 'student', stepId: '3', stepTitle: 'Analisi giurisprudenziale e casi studio', date: '30/11/2025 h:16.00', size: '1.5 MB', uploadedBy: 'Alessandro Bruno', plagiarismStatus: 'clear', plagiarismCheckDate: '01/12/2025', plagiarismCheckedBy: 'Coach' },
        { id: 'ab-doc-4', name: 'Proposte_Legislative_IA.pdf', sender: 'student', stepId: '4', stepTitle: 'Proposte de iure condendo', date: '08/01/2026 h:11.30', size: '1.3 MB', uploadedBy: 'Alessandro Bruno', plagiarismStatus: 'clear', plagiarismCheckDate: '09/01/2026', plagiarismCheckedBy: 'Coach' },
        { id: 'ab-doc-5', name: 'Tesi_Finale_Bruno.pdf', sender: 'student', stepId: '5', stepTitle: 'Revisione finale e preparazione discussione', date: '12/02/2026 h:09.00', size: '4.2 MB', uploadedBy: 'Alessandro Bruno', plagiarismStatus: 'clear', plagiarismCheckDate: '13/02/2026', plagiarismCheckedBy: 'Coach' },
      ],
    }),

    /* ──────────── S-052 · Alex Johnson — Letteratura Comparata, Fase 3 di 6 ──────────── */
    'S-052': () => ({
      steps: [
        {
          id: '1',
          phaseNumber: 'FASE 1 DI 6',
          title: 'Impostazione del progetto e quadro teorico',
          description: 'Definizione degli obiettivi della ricerca, identificazione delle domande chiave e costruzione del framework teorico di riferimento.',
          startDate: 'Inizio 5 gennaio 2026',
          deadline: 'Completato il 18 gennaio 2026',
          originalDeadline: 'Scadenza 20 gennaio 2026',
          completedDate: '18/01/2026',
          completionStatus: 'early',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [{ id: 'd1-1', fileName: 'Feedback_Quadro_Teorico.pdf', uploadDate: '16/01/2026 h:15.30', uploadedBy: 'Marco Bianchi' }],
          activities: [
            { id: 'a1-1', type: 'document', timestamp: '16/01/2026 alle 15:30', author: 'Marco Bianchi', fileName: 'Feedback_Quadro_Teorico.pdf', description: 'Correzioni e suggerimenti sul framework teorico' },
            { id: 'a1-2', type: 'note', timestamp: '14/01/2026 alle 11:20', author: 'Marco Bianchi', content: 'Ottimo lavoro sulla definizione degli obiettivi. Considera di aggiungere un riferimento a Eco (1977) per rafforzare il quadro metodologico.' },
            { id: 'a1-3', type: 'document', timestamp: '12/01/2026 alle 09:45', author: studentName, fileName: 'Bozza_Quadro_Teorico_v2.pdf', description: 'Seconda versione con integrazioni bibliografiche' },
            { id: 'a1-4', type: 'note', timestamp: '08/01/2026 alle 16:30', author: studentName, content: 'Ho completato la prima stesura del quadro teorico. Attendo feedback prima di procedere con la bibliografia.' },
          ],
        },
        {
          id: '2',
          phaseNumber: 'FASE 2 DI 6',
          title: 'Rassegna bibliografica e stato dell\'arte',
          description: 'Analisi sistematica della letteratura esistente, mappatura degli studi precedenti e identificazione dei gap di ricerca.',
          startDate: 'Inizio 21 gennaio 2026',
          deadline: 'Completato il 8 febbraio 2026',
          originalDeadline: 'Scadenza 10 febbraio 2026',
          completedDate: '08/02/2026',
          completionStatus: 'on-time',
          status: 'completed',
          isVisibleToStudent: true,
          documents: [
            { id: 'd2-1', fileName: 'Bibliografia_Preliminare_Comparatistica.pdf', uploadDate: '28/01/2026 h:10.20', uploadedBy: studentName },
            { id: 'd2-2', fileName: 'Feedback_Bibliografia.pdf', uploadDate: '02/02/2026 h:11.00', uploadedBy: 'Marco Bianchi' },
          ],
          activities: [
            { id: 'a2-1', type: 'document', timestamp: '02/02/2026 alle 11:00', author: 'Marco Bianchi', fileName: 'Feedback_Bibliografia.pdf', description: 'Revisione completa con suggerimenti di integrazione' },
            { id: 'a2-2', type: 'note', timestamp: '30/01/2026 alle 14:15', author: 'Marco Bianchi', content: 'La bibliografia è ben strutturata. Ti suggerisco di includere anche gli studi di Said (2003) sulla letteratura comparata postcoloniale.' },
            { id: 'a2-3', type: 'document', timestamp: '28/01/2026 alle 10:20', author: studentName, fileName: 'Bibliografia_Preliminare_Comparatistica.pdf', description: 'Prima versione completa della bibliografia' },
            { id: 'a2-4', type: 'note', timestamp: '25/01/2026 alle 09:00', author: studentName, content: 'Sto raccogliendo le fonti primarie. Ho identificato circa 45 testi rilevanti per la comparazione.' },
          ],
        },
        {
          id: '3',
          phaseNumber: 'FASE 3 DI 6',
          title: 'Metodologia comparativa e analisi dei testi',
          description: 'Sviluppo e applicazione del metodo comparativo ai testi selezionati di Dostoevskij e Pirandello.',
          startDate: 'Inizio 11 febbraio 2026',
          deadline: 'Scadenza 5 marzo 2026',
          status: 'active',
          isVisibleToStudent: true,
          documents: [
            { id: 'd3-1', fileName: 'Bozza_Analisi_Comparativa_v1.pdf', uploadDate: '24/02/2026 h:16.54', uploadedBy: studentName, isNew: true },
            { id: 'd3-2', fileName: 'Schede_Lettura_Testi_Primari.docx', uploadDate: '20/02/2026 h:15.45', uploadedBy: studentName },
          ],
          activities: [
            { id: 'a3-1', type: 'document', timestamp: '25/01/2026 alle 13:05', author: 'Marco Bianchi', fileName: 'Schede_Lettura_Testi_Primari.docx', description: '', isNew: true },
            { id: 'a3-2', type: 'note', timestamp: '25/01/2026 alle 12:42', author: 'Marco Bianchi', content: 'Ottimo lavoro sulla struttura! Ho notato alcune aree da approfondire nel secondo capitolo.' },
            { id: 'a3-3', type: 'document', timestamp: '25/01/2026 alle 11:42', author: studentName, fileName: 'Bozza_Analisi_Comparativa_v1.pdf', description: 'Bozza completa con introduzione e indice dei capitoli' },
            { id: 'a3-4', type: 'note', timestamp: '20/01/2026 alle 15:36', author: 'Marco Bianchi', content: 'Carica la bozza di Indice. Assicurati di includere tutte le sezioni discusse durante la consulenza iniziale.' },
            { id: 'a3-5', type: 'note', timestamp: '18/01/2026 alle 10:22', author: studentName, content: 'Ho iniziato l\'analisi comparativa dei primi tre testi. La metodologia sembra funzionare bene.' },
            { id: 'a3-6', type: 'document', timestamp: '15/01/2026 alle 14:30', author: 'Marco Bianchi', fileName: 'Linee_Guida_Metodologia.pdf', description: 'Indicazioni metodologiche per l\'analisi comparativa' },
          ],
        },
        {
          id: '4',
          phaseNumber: 'FASE 4 DI 6',
          title: 'Stesura dei capitoli centrali',
          description: 'Redazione estesa dei capitoli principali della tesi, integrazione dell\'analisi con il quadro teorico.',
          startDate: 'Inizio 6 marzo 2026',
          deadline: 'Scadenza 25 marzo 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
        {
          id: '5',
          phaseNumber: 'FASE 5 DI 6',
          title: 'Revisione critica e apparato note',
          description: 'Revisione complessiva della struttura argomentativa, verifica della coerenza logica e completamento delle note.',
          startDate: 'Inizio 26 marzo 2026',
          deadline: 'Scadenza 2 aprile 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
        {
          id: '6',
          phaseNumber: 'FASE 6 DI 6',
          title: 'Editing finale e preparazione alla discussione',
          description: 'Revisione linguistica, preparazione della presentazione e simulazione della difesa.',
          startDate: 'Inizio 3 aprile 2026',
          deadline: 'Scadenza 5 aprile 2026',
          status: 'upcoming',
          isVisibleToStudent: false,
          documents: [],
          activities: [],
        },
      ],
      documents: [
        { id: 'aj-doc-1', name: 'Bibliografia_Preliminare_Comparatistica.pdf', sender: 'student', stepId: '2', stepTitle: 'Rassegna bibliografica e stato dell\'arte', date: '28/01/2026 h:10.20', size: '1.2 MB', uploadedBy: 'Alex Johnson', plagiarismStatus: 'clear', plagiarismCheckDate: '29/01/2026', plagiarismCheckedBy: 'Marco Bianchi' },
        { id: 'aj-doc-2', name: 'Schede_Lettura_Testi_Primari.docx', sender: 'student', stepId: '3', stepTitle: 'Metodologia comparativa e analisi dei testi', date: '20/02/2026 h:15.45', size: '856 KB', uploadedBy: 'Alex Johnson', plagiarismStatus: 'none' },
        { id: 'aj-doc-3', name: 'Feedback_Quadro_Teorico.pdf', sender: 'coach', stepId: '1', stepTitle: 'Impostazione del progetto e quadro teorico', date: '16/01/2026 h:15.30', size: '2.1 MB', uploadedBy: 'Marco Bianchi', plagiarismStatus: 'none' },
        { id: 'aj-doc-4', name: 'Bozza_Analisi_Comparativa_v1.pdf', sender: 'student', stepId: '3', stepTitle: 'Metodologia comparativa e analisi dei testi', date: '24/02/2026 h:16.54', size: '1.8 MB', uploadedBy: 'Alex Johnson', plagiarismStatus: 'clear', plagiarismCheckDate: '25/02/2026', plagiarismCheckedBy: 'Marco Bianchi', note: 'Documento già verificato, nessun plagio rilevato.' },
      ],
    }),

    /* ──────────── S-041 · Luca Neri — Ing. Informatica, In pausa, Fase 2 di 5, timeline mancante ──────────── */
    'S-041': () => ({
      steps: [],
      documents: [],
    }),

    /* ──────────── S-067 · Elena Ferrara — Scienze Politiche, Pending payment, Non avviato ──────────── */
    'S-067': () => ({
      steps: [],
      documents: [],
    }),

    /* ──────────── S-044 · Federico Mancini — Economia e Commercio, Annullato ──────────── */
    'S-044': () => ({
      steps: [],
      documents: [],
    }),

    /* ──────────── S-058 · Chiara Fontana — Scienze della Comunicazione, Da assegnare ──────────── */
    'S-058': () => ({
      steps: [],
      documents: [],
    }),

    /* ──────────── S-061 · Marco Pellegrini — Economia Aziendale, Da assegnare ──────────── */
    'S-061': () => ({
      steps: [],
      documents: [],
    }),
  };

  const factory = timelines[studentId];
  if (factory) return factory();

  // Fallback: empty timeline
  return { steps: [], documents: [] };
}
