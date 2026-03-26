export type StudentStatus =
  | 'pending_payment'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired';

/** Human-readable Italian labels for each status */
export const STATUS_LABELS: Record<StudentStatus, string> = {
  pending_payment: 'In attesa di pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

/** Visual styles per status: background + text color */
export const STATUS_STYLES: Record<StudentStatus, { bg: string; text: string }> = {
  pending_payment: { bg: 'rgba(247,144,9,0.10)', text: 'var(--chart-3)' },
  active: { bg: 'rgba(11,182,63,0.10)', text: 'var(--primary)' },
  paused: { bg: 'rgba(113,118,128,0.10)', text: 'var(--muted-foreground)' },
  completed: { bg: 'rgba(46,144,250,0.10)', text: 'var(--chart-2)' },
  cancelled: { bg: 'rgba(220,38,38,0.10)', text: 'var(--destructive-foreground)' },
  expired: { bg: 'rgba(113,118,128,0.10)', text: 'var(--muted-foreground)' },
};

export type ServiceType = 'starter_pack' | 'coaching' | 'coaching_plus';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  starter_pack: 'Starter Pack',
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
};

export type ThesisType = 'sperimentale' | 'compilativa';

export const THESIS_TYPE_LABELS: Record<ThesisType, string> = {
  sperimentale: 'Sperimentale',
  compilativa: 'Compilativa',
};

export interface AdminReferente {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export const ADMIN_REFERENTI: AdminReferente[] = [
  {
    id: 'admin-1',
    name: 'Margherita Bianchi',
    role: 'Referente sottotesi',
    avatarUrl: 'https://images.unsplash.com/photo-1660252696878-e6407a230ab2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwd29tYW4lMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGJydW5ldHRlfGVufDF8fHx8MTc3MjUzOTM3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'admin-2',
    name: 'Giada Esposito',
    role: 'Referente sottotesi',
    avatarUrl: 'https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBibG9uZGUlMjBzbWlsZXxlbnwxfHx8fDE3NzI1MzkzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 'admin-3',
    name: 'Francesca Romano',
    role: 'Referente sottotesi',
    avatarUrl: 'https://images.unsplash.com/photo-1576527194426-7009645f8b5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGVycmFuZWFuJTIwd29tYW4lMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGN1cmx5JTIwaGFpcnxlbnwxfHx8fDE3NzI1MzkzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
];

export interface StudentData {
  id: string;
  name: string;
  university?: string;
  degree: string;
  supervisor: string;
  status: StudentStatus;
  service: string;
  serviceType: ServiceType;
  thesisSubject: string;
  thesis_topic?: string;
  thesisMatter?: string;
  thesisType?: ThesisType;
  nextDeadline: string;
  nextDeadlineDate: string;
  currentPhase: string;
  assigned: boolean;
  hasTimeline: boolean;
  planStartDate?: string;
  planEndDate?: string;
  phone?: string;
  email?: string;
  newActivityCount?: number;
  adminReferenteId?: string;
}

export const STUDENTS_DATA: StudentData[] = [
  {
    id: 'S-034',
    name: 'Giulia Verdi',
    university: 'UniMI',
    degree: 'Magistrale Psicologia',
    supervisor: 'Prof. Conti',
    status: 'active',
    service: 'Coaching',
    serviceType: 'coaching',
    thesisSubject: 'L\'impatto della mindfulness sulla gestione dell\'ansia nei giovani adulti: uno studio longitudinale su campione universitario',
    thesisMatter: 'Psicologia clinica',
    thesis_topic: 'Mindfulness e gestione dell\'ansia nei giovani adulti',
    thesisType: 'sperimentale',
    nextDeadline: 'tra 3 giorni',
    nextDeadlineDate: '2 marzo 2026',
    currentPhase: 'Fase 3 di 6',
    assigned: true,
    hasTimeline: true,
    planStartDate: '10 dicembre 2025',
    planEndDate: '15 maggio 2026',
    phone: '+39 3491827364',
    email: 'giulia.verdi94@gmail.com',
    newActivityCount: 2,
    adminReferenteId: 'admin-1',
  },
  {
    id: 'S-041',
    name: 'Luca Neri',
    university: 'Sapienza',
    degree: 'Ingegneria Informatica',
    supervisor: 'Prof. De Santis',
    status: 'paused',
    service: 'Starter Pack',
    serviceType: 'starter_pack',
    thesisSubject: 'Ottimizzazione di reti neurali convoluzionali per il riconoscimento automatico di immagini mediche in ambito radiologico',
    thesisMatter: 'Intelligenza artificiale applicata',
    thesis_topic: 'Reti neurali convoluzionali per il riconoscimento di immagini mediche',
    thesisType: 'sperimentale',
    nextDeadline: 'in pausa',
    nextDeadlineDate: '-',
    currentPhase: 'Fase 2 di 5',
    assigned: true,
    hasTimeline: false,
    planStartDate: '15 novembre 2025',
    planEndDate: '30 aprile 2026',
    phone: '+39 3384592710',
    email: 'luca.neri@outlook.it',
    newActivityCount: 0,
    adminReferenteId: 'admin-2',
  },
  {
    id: 'S-022',
    name: 'Sara Martini',
    degree: 'Ingegneria Gestionale',
    supervisor: 'Prof. Colombo',
    status: 'active',
    service: 'Starter Pack',
    serviceType: 'starter_pack',
    thesisSubject: 'Analisi e ottimizzazione dei processi logistici nella supply chain del settore farmaceutico: il caso di una multinazionale italiana',
    thesisMatter: 'Supply chain management',
    thesis_topic: 'Ottimizzazione della logistica nel settore farmaceutico',
    thesisType: 'sperimentale',
    nextDeadline: 'tra 8 giorni',
    nextDeadlineDate: '7 marzo 2026',
    currentPhase: 'Fase 1 di 4',
    assigned: true,
    hasTimeline: true,
    planStartDate: '20 gennaio 2026',
    planEndDate: '20 giugno 2026',
    phone: '+39 3275631489',
    email: 'sara.martini@live.it',
    newActivityCount: 1,
    adminReferenteId: 'admin-3',
  },
  {
    id: 'S-015',
    name: 'Alessandro Bruno',
    university: 'UniBo',
    degree: 'Giurisprudenza',
    supervisor: 'Prof. Lombardi',
    status: 'completed',
    service: 'Coaching',
    serviceType: 'coaching',
    thesisSubject: 'La tutela dei dati personali nel contesto dell\'intelligenza artificiale: profili giuridici e comparatistici tra normativa UE e modello statunitense',
    thesisMatter: 'Diritto della privacy',
    thesis_topic: 'Privacy e intelligenza artificiale',
    thesisType: 'compilativa',
    nextDeadline: 'completato',
    nextDeadlineDate: '-',
    currentPhase: 'Completato',
    assigned: true,
    hasTimeline: true,
    planStartDate: '1 settembre 2025',
    planEndDate: '15 febbraio 2026',
    phone: '+39 3206748291',
    email: 'a.bruno@studenti.unibo.it',
    newActivityCount: 0,
    adminReferenteId: 'admin-1',
  },
  {
    id: 'S-052',
    name: 'Alex Johnson',
    university: 'UniMI',
    degree: 'Letteratura Comparata',
    supervisor: 'Prof. Rossi',
    status: 'active',
    service: 'Coaching Plus',
    serviceType: 'coaching_plus',
    thesisSubject: 'Il doppio nella narrativa di Dostoevskij e Pirandello: una lettura comparata tra identità frammentata e coscienza moderna',
    thesisMatter: 'Letteratura comparata',
    thesis_topic: 'Il doppio nella narrativa moderna',
    thesisType: 'compilativa',
    nextDeadline: 'tra 7 giorni',
    nextDeadlineDate: '5 marzo 2026',
    currentPhase: 'Fase 3 di 6',
    assigned: true,
    hasTimeline: true,
    planStartDate: '5 gennaio 2026',
    planEndDate: '5 aprile 2026',
    phone: '+39 3283756889',
    email: 'alex.johnson32@gmail.com',
    newActivityCount: 3,
    adminReferenteId: 'admin-2',
  },
  {
    id: 'S-067',
    name: 'Elena Ferrara',
    degree: 'Scienze Politiche',
    supervisor: 'Prof. Moretti',
    status: 'pending_payment',
    service: 'Coaching',
    serviceType: 'coaching',
    thesisSubject: 'Le politiche migratorie europee dopo il Patto su migrazione e asilo: un\'analisi critica del burden sharing',
    thesisMatter: 'Scienze politiche europee',
    thesis_topic: 'Politiche migratorie nel nuovo patto europeo',
    thesisType: 'compilativa',
    nextDeadline: 'in attesa',
    nextDeadlineDate: '-',
    currentPhase: 'Non avviato',
    assigned: true,
    hasTimeline: false,
    phone: '+39 3512093847',
    email: 'elena.ferrara@gmail.com',
    newActivityCount: 0,
    adminReferenteId: 'admin-3',
  },
  {
    id: 'S-044',
    name: 'Federico Mancini',
    university: 'UniNA',
    degree: 'Economia e Commercio',
    supervisor: 'Prof. Ferraro',
    status: 'cancelled',
    service: 'Coaching Plus',
    serviceType: 'coaching_plus',
    thesisSubject: 'Analisi degli effetti delle politiche fiscali espansive sulle PMI del Mezzogiorno nel periodo post-pandemico',
    thesisMatter: 'Economia politica',
    thesis_topic: 'Politiche fiscali e PMI nel Mezzogiorno',
    thesisType: 'sperimentale',
    nextDeadline: 'annullato',
    nextDeadlineDate: '-',
    currentPhase: '-',
    assigned: true,
    hasTimeline: false,
    planStartDate: '1 ottobre 2025',
    planEndDate: '28 febbraio 2026',
    phone: '+39 3467182930',
    email: 'f.mancini92@hotmail.it',
    newActivityCount: 0,
    adminReferenteId: 'admin-1',
  },
  {
    id: 'S-058',
    name: 'Chiara Fontana',
    university: 'UniPD',
    degree: 'Scienze della Comunicazione',
    supervisor: 'Prof.ssa Gallo',
    status: 'active',
    service: 'Coaching',
    serviceType: 'coaching',
    thesisSubject: 'Strategie di comunicazione digitale per il terzo settore italiano: analisi di campagne social e civic engagement',
    thesisMatter: 'Comunicazione digitale',
    thesis_topic: 'Comunicazione digitale del terzo settore',
    thesisType: 'compilativa',
    nextDeadline: '-',
    nextDeadlineDate: '-',
    currentPhase: 'Da assegnare',
    assigned: false,
    hasTimeline: false,
    phone: '+39 3398472015',
    email: 'chiara.fontana@studenti.unipd.it',
    newActivityCount: 0,
    adminReferenteId: 'admin-2',
  },
  {
    id: 'S-061',
    name: 'Marco Pellegrini',
    degree: 'Economia Aziendale',
    supervisor: 'Prof. Ferraro',
    status: 'active',
    service: 'Starter Pack',
    serviceType: 'starter_pack',
    thesisSubject: 'Modelli di business sostenibili nel settore agroalimentare campano: uno studio multi-caso sulle certificazioni biologiche',
    thesisMatter: 'Economia aziendale',
    thesis_topic: 'Modelli sostenibili nel settore agroalimentare',
    thesisType: 'sperimentale',
    nextDeadline: '-',
    nextDeadlineDate: '-',
    currentPhase: 'Da assegnare',
    assigned: false,
    hasTimeline: false,
    phone: '+39 3281547902',
    email: 'marco.pellegrini@yahoo.it',
    newActivityCount: 0,
    adminReferenteId: 'admin-3',
  },
];