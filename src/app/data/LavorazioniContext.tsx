import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getStudentTimeline } from '@/pages/coach/studentTimelines';

// ─── Types ───────────────────────────────────────────────────
export type ServiceStatus = 'active' | 'paused' | 'completed' | 'cancelled' | 'expired';
export type ContractStatus = 'draft' | 'signed' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type TimelineStatus = 'not_started' | 'in_progress' | 'completed';
export type ClosedReason = 'concluso' | 'upgrade' | 'annullato' | 'abbandono';
export type ServiceCategory = 'Starter Pack' | 'Coaching' | 'Check plagio/AI';

// ─── Pipeline types ──────────────────────────────────────────
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'paid';

export interface Quote {
  id: string;
  number: string; // [numero]/[anno]
  amount_gross?: number;
  created_at?: string; // ISO date
  sent_at?: string; // ISO date
  accepted_at?: string; // ISO date
  expires_at?: string; // ISO date
  status: QuoteStatus;
  service_link?: string; // Servizio specifico del preventivo (coaching, coaching_plus, starter_pack, ...)
  notes?: string;
}

export interface Pipeline {
  id: string;
  student_id?: string;
  student_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  emails?: string[]; // Email aggiuntive
  phone?: string;
  phones?: string[]; // Telefoni aggiuntivi
  sources?: string[]; // IG, Sottotelefono BO, Modulo meta ads, Form Coaching, ecc.
  communication_channel?: string;    // legacy — sostituito da communication_channels
  communication_channels?: string[]; // Dove ci parliamo: WhatsApp Bologna, ecc. (multipli)
  assigned_to?: string[]; // Persone/fornitori in carico (es. ['Margherita', 'Fornitore A'])
  quote_sent?: boolean; // Preventivo inviato (legacy/status veloce)
  quotes?: Quote[]; // Preventivi multipli
  service_link?: string; // Collegamento a servizio (es. coaching)
  external_link?: string; // Link esterno (es. Google Docs)
  created_at?: string;
  notes?: string;
  lavorazioni_ids?: string[]; // Array di ID lavorazioni generate da questa pipeline
  marketing_consents?: Record<string, boolean>; // Consensi marketing per ogni singolo contatto (email/telefono)
  // Dati accademici preliminari raccolti in fase di lead (pre-conversione)
  academic_data?: {
    degree_level?: DegreeLevel;
    course_name?: string;
    university_name?: string;
    thesis_professor?: string;
    thesis_subject?: string;
    thesis_type?: ThesisType;
    foreign_language?: boolean;
    thesis_language?: string;
  };
  // Se true, student_id punta a uno studente già esistente in anagrafica (re-enrollment)
  linked_existing_student?: boolean;
  updated_at?: string;
  updated_by?: string;
}

export const AVAILABLE_SOURCES = [
  'IG',
  'Sottotelefono BO',
  'Modulo meta ads',
  'Form Coaching',
  'Form Coaching Plus',
  'Gmail',
  'Altro'
];

export const COMMUNICATION_CHANNELS = [
  'WhatsApp Bologna',
  'WhatsApp Milano',
  'Telegram',
  'Email',
  'Telefono',
  'Altro'
];

export const ADMIN_USERS = [
  'Margherita',
  'Francesca',
  'Non assegnato'
];

// ─── Coach Payout types ─────────────────────────────────────
export type PayoutStatus = 'pending_invoice' | 'waiting_due_date' | 'ready_to_pay' | 'paid' | 'disputed';

export interface CoachPayout {
  id: string;
  notula_number?: string;
  notula_status?: 'da_programmare' | 'programmata' | 'inviata' | 'pagata';
  invoice_status?: 'da_ricevere' | 'ricevuta' | 'pagata';
  notula_issue_date?: string;
  notula_amount?: number;
  payment_due_date?: string;
  status: PayoutStatus;
  paid_at?: string;
  payment_reference?: string;
}

// ─── Student types ──────────────────────────────────────────
export type DegreeLevel = 'triennale' | 'magistrale' | 'ciclo_unico' | 'master' | 'dottorato';
export type ThesisType = 'compilativa' | 'sperimentale';
export type ContactPurpose = 'generic' | 'service_access' | 'communications' | 'coaching';

export interface ContactEmail {
  email: string;
  is_primary: boolean;
  purposes: ('generic' | 'service_access')[]; // generic o service_access
  source?: string; // 'pipeline:PIP-001', 'manual', etc.
  added_at: string;
}

export interface ContactPhone {
  phone: string;
  is_primary: boolean;
  purposes: ('communications' | 'coaching')[]; // communications o coaching
  source?: string;
  added_at: string;
}

export interface StudentAcademicRecord {
  id: string;
  student_id: string;
  degree_level: DegreeLevel | '';
  course_name: string;
  university_name: string;
  thesis_professor: string;
  thesis_topic?: string;
  thesis_subject: string;
  foreign_language: boolean;
  thesis_language: string;
  thesis_type: ThesisType | '';
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string; // Email principale (deprecato, usare contacts.emails)
  phone: string; // Telefono principale (deprecato, usare contacts.phones)
  contacts?: {
    emails: ContactEmail[];
    phones: ContactPhone[];
  };
  status: 'active' | 'invited' | 'blocked';
  marketing_consent: boolean;
  academic_records: StudentAcademicRecord[];
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

export interface Contract {
  id: string;
  status: ContractStatus;
  signedAt?: string;
  documentUrl: string;
  expiresAt?: string;
}

export interface Invoice {
  id: string;
  amount: number;
  issuedAt: string;
  pdfUrl: string;
}

export interface Payment {
  id: string;
  amount: number;
  paidAt: string;
  method: string;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  net_tax_rate?: 4 | 22;
  invoice_number?: string;
  invoice?: Invoice;
  payment?: Payment;
}

export interface CoachingTimeline {
  id: string;
  phase: string;
  description: string;
  status: TimelineStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface SharedTimelineDocumentItem {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string;
  isNew?: boolean;
}

export interface SharedTimelineActivity {
  id: string;
  type: 'document' | 'note';
  timestamp: string;
  author: string;
  isNew?: boolean;
  fileName?: string;
  description?: string;
  content?: string;
}

export interface SharedTimelineStep {
  id: string;
  phaseNumber: string;
  title: string;
  description?: string;
  startDate?: string;
  deadline: string;
  originalDeadline?: string;
  completedDate?: string;
  completionStatus?: 'on-time' | 'early' | 'late';
  status: 'active' | 'completed' | 'upcoming';
  isDraft?: boolean;
  isVisibleToStudent?: boolean;
  documents: SharedTimelineDocumentItem[];
  activities: SharedTimelineActivity[];
}

export interface SharedArchiveDocument {
  id: string;
  name: string;
  sender: 'student' | 'coach';
  stepId: string | null;
  stepTitle: string | null;
  date: string;
  size: string;
  uploadedBy: string;
  plagiarismStatus?: 'none' | 'pending' | 'clear' | 'flagged';
  plagiarismCheckDate?: string;
  plagiarismCheckedBy?: string;
  note?: string;
}

export interface SharedAdminNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface SharedStepOption {
  id: string;
  phaseNumber: string;
  title: string;
}

export interface CheckJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: string;
  completedAt?: string;
  report?: CheckReport;
}

export interface CheckReport {
  id: string;
  similarityPercentage: number;
  plagiarismDetected: boolean;
  aiDetectionPercentage: number;
  generatedAt: string;
  pdfUrl: string;
}

export interface StudentService {
  id: string;
  student_id: string;
  student_name: string;
  service_id: string;
  service_name: string;
  service_category: ServiceCategory;
  quote_id: string;
  quoted_gross_amount?: number;
  total_tax_rate?: 4 | 22;
  invoice_number?: string;
  contract_id?: string;
  academic_record_id?: string;
  status: ServiceStatus;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  start_date?: string;
  end_date?: string;
  is_upgrade_from?: string;
  closed_reason?: ClosedReason;
  contract?: Contract;
  installments: Installment[];
  coaching_timeline?: CoachingTimeline[];
  coaching_timeline_full?: SharedTimelineStep[];
  shared_documents?: SharedArchiveDocument[];
  admin_notes?: SharedAdminNote[];
  check_job?: CheckJob;
  coach_fee?: number;
  coach_name?: string;
  coach_payout?: CoachPayout;
  referente?: string;
  area_tematica?: string;
  service_notes?: string;
  needs_timeline?: boolean;
  coaching_access_enabled?: boolean; // Accesso alla timeline abilitato per studente/coach
  /** Email usata per l'invito di accesso alla piattaforma */
  invite_email?: string;
  /** ISO timestamp dell'ultimo invio invito */
  invite_sent_at?: string;
  /** Stato dell'invito: non inviato / inviato / attivo (primo login effettuato) */
  invite_status?: 'not_sent' | 'sent' | 'active';
  plan_start_date?: string;
  plan_end_date?: string;
  pause_start_date?: string;
  pause_end_date?: string;
  pipeline_id?: string; // ID della pipeline che ha generato questa lavorazione
}

const mapMinimalTimelineToSharedStep = (phase: CoachingTimeline, index: number, total: number): SharedTimelineStep => ({
  id: phase.id,
  phaseNumber: phase.phase || `FASE ${index + 1} DI ${total}`,
  title: phase.description || phase.phase,
  description: phase.description,
  startDate: phase.startedAt,
  deadline: phase.completedAt || 'Data da definire',
  completedDate: phase.completedAt,
  status:
    phase.status === 'completed'
      ? 'completed'
      : phase.status === 'in_progress'
      ? 'active'
      : 'upcoming',
  isVisibleToStudent: true,
  documents: [],
  activities: [],
});

const getSharedTimelineStepsFromService = (service?: StudentService): SharedTimelineStep[] => {
  if (!service) return [];
  if (service.coaching_timeline_full && service.coaching_timeline_full.length > 0) {
    return service.coaching_timeline_full;
  }
  if (!service.coaching_timeline || service.coaching_timeline.length === 0) {
    return [];
  }
  return service.coaching_timeline.map((phase, index, items) => mapMinimalTimelineToSharedStep(phase, index, items.length));
};

const getSharedArchiveDocumentsFromService = (service?: StudentService): SharedArchiveDocument[] =>
  service?.shared_documents || [];

const getSharedAdminNotesFromService = (service?: StudentService): SharedAdminNote[] =>
  service?.admin_notes || [];

const getSharedStepOptionsFromService = (service?: StudentService): SharedStepOption[] =>
  getSharedTimelineStepsFromService(service).map(step => ({
    id: step.id,
    phaseNumber: step.phaseNumber,
    title: step.title,
  }));

const LEGACY_TIMELINE_ID_BY_STUDENT_NAME: Record<string, string> = {
  'Giulia Verdi': 'S-034',
  'Sara Martini': 'S-022',
  'Alessandro Brun': 'S-015',
  'Alex Johnson': 'S-052',
};

const hydrateServiceWithLegacySharedData = (service: StudentService): StudentService => {
  if (service.coaching_timeline_full?.length || service.shared_documents?.length) {
    return service;
  }

  const legacyTimelineId = LEGACY_TIMELINE_ID_BY_STUDENT_NAME[service.student_name];
  if (!legacyTimelineId) {
    return service;
  }

  const legacyBundle = getStudentTimeline(legacyTimelineId, service.student_name);
  if (!legacyBundle.steps.length && !legacyBundle.documents.length) {
    return service;
  }

  return {
    ...service,
    coaching_timeline_full: legacyBundle.steps,
    shared_documents: legacyBundle.documents,
  };
};

// ─── Profili Admin (referenti Sottotesi) ────────────────────
export interface AdminProfile {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const ADMIN_PROFILES: AdminProfile[] = [
  { id: 'ADM-001', name: 'Claudia', role: 'Referente operativa', email: 'claudia@sottotesi.it' },
  { id: 'ADM-002', name: 'Giada', role: 'Referente operativa', email: 'giada@sottotesi.it' },
  { id: 'ADM-003', name: 'Francesca', role: 'Amministratore', email: 'francesca@sottotesi.it' },
];

// Shortcut per backward compat
export const REFERENTI_SOTTOTESI = ADMIN_PROFILES.filter(a => a.role === 'Referente operativa');

// ─── Coach disponibili ─────────────────────────────────────
export const AVAILABLE_COACHES = [
  'Martina Rossi',
  'Marco Bianchi',
  'Andrea Conti',
  'Elena Ferretti',
  'Lucia Marchetti',
];

// ─── Coach ID ↔ Nome mapping (coerente con CoachPage) ──────
export const COACH_ID_MAP: Record<string, string> = {
  'Martina Rossi': 'C-07',
  'Marco Bianchi': 'C-12',
  'Andrea Conti': 'C-08',
  'Elena Ferretti': 'C-15',
  'Lucia Marchetti': 'C-20',
};

export const COACH_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COACH_ID_MAP).map(([name, id]) => [id, name])
);

// ─── Studenti disponibili (per assegnazione) ────────────────
export const AVAILABLE_STUDENTS = [
  { id: 'STU-445', name: 'Giulia Verdi' },
  { id: 'STU-478', name: 'Luca Neri' },
  { id: 'STU-423', name: 'Sara Martini' },
  { id: 'STU-501', name: 'Paolo Russo' },
  { id: 'STU-467', name: 'Alessandro Brun' },
  { id: 'STU-512', name: 'Francesca Moretti' },
  { id: 'STU-520', name: 'Marco De Luca' },
  { id: 'STU-531', name: 'Chiara Lombardi' },
  { id: 'STU-540', name: 'Elena Mancini' },
  { id: 'STU-545', name: 'Lorenzo Galli' },
  { id: 'STU-551', name: 'Valentina Costa' },
  { id: 'STU-558', name: 'Andrea Pellegrini' },
  { id: 'STU-563', name: 'Martina Colombo' },
  { id: 'STU-570', name: 'Davide Barbieri' },
  { id: 'STU-577', name: 'Sofia Ricci' },
  { id: 'STU-583', name: 'Matteo Fontana' },
  { id: 'STU-590', name: 'Beatrice Vitale' },
  { id: 'STU-596', name: 'Simone Caruso' },
  { id: 'STU-602', name: 'Anna Greco' },
  { id: 'STU-608', name: 'Federico Rinaldi' },
];

const INITIAL_STUDENTS: Student[] = [
  // ── Studenti con coaching_access_enabled (service_access sull'email primaria) ──
  { id: 'STU-445', name: 'Giulia Verdi', first_name: 'Giulia', last_name: 'Verdi', email: 'giulia.verdi@email.com', phone: '+39 333 1234567', status: 'active', created_at: '2025-10-15', updated_at: '2026-01-20T10:30:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'giulia.verdi@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-10-15' }, { email: 'giulia.verdi@studenti.unibol.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-10-20' }], phones: [{ phone: '+39 333 1234567', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-10-15' }] }, academic_records: [{ id: 'AR-001', student_id: 'STU-445', degree_level: 'magistrale', course_name: 'Economia Aziendale', university_name: 'Università di Bologna', thesis_professor: 'Prof. Rossi', thesis_topic: 'Strategie di digitalizzazione e sostenibilità nel retail italiano', thesis_subject: 'Economia aziendale', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2025-10-15', updated_at: '2025-10-15' }] },
  { id: 'STU-478', name: 'Luca Neri', first_name: 'Luca', last_name: 'Neri', email: 'luca.neri@email.com', phone: '+39 340 9876543', status: 'active', created_at: '2025-11-02', updated_at: '2026-02-14T09:15:00', updated_by: 'Giada', marketing_consent: false, contacts: { emails: [{ email: 'luca.neri@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-11-02' }], phones: [{ phone: '+39 340 9876543', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-11-02' }] }, academic_records: [{ id: 'AR-010', student_id: 'STU-478', degree_level: 'magistrale', course_name: 'Ingegneria Gestionale', university_name: 'Politecnico di Torino', thesis_professor: 'Prof. Colombo', thesis_topic: 'Ottimizzazione della supply chain mediante blockchain e IoT', thesis_subject: 'Ingegneria dei processi', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2025-11-02', updated_at: '2025-11-02' }] },
  { id: 'STU-512', name: 'Francesca Moretti', first_name: 'Francesca', last_name: 'Moretti', email: 'francesca.moretti@email.com', phone: '+39 349 4445566', status: 'active', created_at: '2025-12-01', updated_at: '2026-01-10T11:30:00', updated_by: 'Francesca', marketing_consent: true, contacts: { emails: [{ email: 'francesca.moretti@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-12-01' }, { email: 'f.moretti@polimi.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-12-05' }], phones: [{ phone: '+39 349 4445566', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-12-01' }] }, academic_records: [{ id: 'AR-013', student_id: 'STU-512', degree_level: 'magistrale', course_name: 'Architettura', university_name: 'Politecnico di Milano', thesis_professor: 'Prof. Zanetti', thesis_topic: 'Rigenerazione urbana e architettura sostenibile nei contesti post-industriali', thesis_subject: 'Progettazione architettonica', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2025-12-01', updated_at: '2025-12-01' }] },
  { id: 'STU-520', name: 'Marco De Luca', first_name: 'Marco', last_name: 'De Luca', email: 'marco.deluca@email.com', phone: '+39 331 6667788', status: 'active', created_at: '2026-01-20', updated_at: '2026-02-28T08:45:00', updated_by: 'Claudia', marketing_consent: false, contacts: { emails: [{ email: 'marco.deluca@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2026-01-20' }, { email: 'marco.deluca@studenti.uniroma.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2026-01-22' }], phones: [{ phone: '+39 331 6667788', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2026-01-20' }] }, academic_records: [{ id: 'AR-014', student_id: 'STU-520', degree_level: 'triennale', course_name: 'Informatica', university_name: 'Università di Roma', thesis_professor: 'Prof. Esposito', thesis_topic: 'Sviluppo di sistemi di cybersecurity ibridi per le piccole-medie imprese', thesis_subject: 'Sicurezza informatica', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'sperimentale', is_current: true, created_at: '2026-01-20', updated_at: '2026-01-20' }] },
  { id: 'STU-540', name: 'Elena Mancini', first_name: 'Elena', last_name: 'Mancini', email: 'elena.mancini@email.com', phone: '+39 328 1110022', status: 'active', created_at: '2025-07-10', updated_at: '2025-12-18T10:00:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'elena.mancini@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-07-10' }], phones: [{ phone: '+39 328 1110022', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-07-10' }] }, academic_records: [{ id: 'AR-020', student_id: 'STU-540', degree_level: 'magistrale', course_name: 'Biotecnologie Mediche', university_name: 'Università di Pisa', thesis_professor: 'Prof.ssa Gallo', thesis_topic: 'Applicazioni dell\'immunoterapia nel trattamento dei tumori solidi', thesis_subject: 'Biotecnologie mediche', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'sperimentale', is_current: true, created_at: '2025-07-10', updated_at: '2025-07-10' }] },
  { id: 'STU-545', name: 'Lorenzo Galli', first_name: 'Lorenzo', last_name: 'Galli', email: 'lorenzo.galli@email.com', phone: '+39 339 2223344', status: 'active', created_at: '2025-06-15', updated_at: '2025-11-22T16:30:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'lorenzo.galli@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-06-15' }, { email: 'l.galli@medicina.unige.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-06-20' }], phones: [{ phone: '+39 339 2223344', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-06-15' }] }, academic_records: [{ id: 'AR-021', student_id: 'STU-545', degree_level: 'ciclo_unico', course_name: 'Medicina e Chirurgia', university_name: 'Università di Genova', thesis_professor: 'Prof. Parodi', thesis_topic: 'Efficacia della terapia cognitivo-comportamentale nella depressione post-partum', thesis_subject: 'Psichiatria clinica', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2025-06-15', updated_at: '2025-06-15' }] },
  { id: 'STU-551', name: 'Valentina Costa', first_name: 'Valentina', last_name: 'Costa', email: 'valentina.costa@email.com', phone: '+39 342 5556677', status: 'active', created_at: '2025-11-20', updated_at: '2026-01-15T09:20:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'valentina.costa@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-11-20' }, { email: 'valentina.costa@studbocconi.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-11-25' }], phones: [{ phone: '+39 342 5556677', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-11-20' }] }, academic_records: [{ id: 'AR-022', student_id: 'STU-551', degree_level: 'magistrale', course_name: 'Marketing e Comunicazione', university_name: 'Università Bocconi', thesis_professor: 'Prof. Molteni', thesis_topic: 'Strategie di influencer marketing e consumer engagement nel mercato fashion', thesis_subject: 'Marketing digitale', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'sperimentale', is_current: true, created_at: '2025-11-20', updated_at: '2025-11-20' }] },
  { id: 'STU-558', name: 'Andrea Pellegrini', first_name: 'Andrea', last_name: 'Pellegrini', email: 'andrea.pellegrini@email.com', phone: '+39 348 8889900', status: 'active', created_at: '2025-10-05', updated_at: '2026-01-28T13:00:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'andrea.pellegrini@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-10-05' }], phones: [{ phone: '+39 348 8889900', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-10-05' }] }, academic_records: [{ id: 'AR-023', student_id: 'STU-558', degree_level: 'triennale', course_name: 'Scienze Ambientali', university_name: 'Università di Torino', thesis_professor: 'Prof.ssa Verde', thesis_topic: 'Valutazione dell\'impatto ambientale di impianti fotovoltaici su ecosistemi mediterranei', thesis_subject: 'Ecologia applicata', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2025-10-05', updated_at: '2025-10-05' }] },
  { id: 'STU-577', name: 'Sofia Ricci', first_name: 'Sofia', last_name: 'Ricci', email: 'sofia.ricci@email.com', phone: '+39 334 9990088', status: 'active', created_at: '2025-08-25', updated_at: '2025-12-30T11:15:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'sofia.ricci@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-08-25' }, { email: 's.ricci@design.polimi.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-09-01' }], phones: [{ phone: '+39 334 9990088', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-08-25' }] }, academic_records: [{ id: 'AR-026', student_id: 'STU-577', degree_level: 'magistrale', course_name: 'Design della Comunicazione', university_name: 'Politecnico di Milano', thesis_professor: 'Prof. Baglioni', thesis_topic: 'Comunicazione visuale e brand identity nelle startup tecnologiche', thesis_subject: 'UX Design per la pubblica amministrazione digitale', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2025-08-25', updated_at: '2025-08-25' }] },
  { id: 'STU-583', name: 'Matteo Fontana', first_name: 'Matteo', last_name: 'Fontana', email: 'matteo.fontana@email.com', phone: '+39 329 1112244', status: 'active', created_at: '2025-12-10', updated_at: '2026-02-05T09:30:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'matteo.fontana@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-12-10' }, { email: 'matteo.fontana@unitn.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-12-12' }], phones: [{ phone: '+39 329 1112244', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-12-10' }] }, academic_records: [{ id: 'AR-027', student_id: 'STU-583', degree_level: 'magistrale', course_name: 'Ingegneria Informatica', university_name: 'Università di Trento', thesis_professor: 'Prof. Cimatti', thesis_topic: 'Machine learning per predizione di anomalie nelle reti 5G', thesis_subject: 'Modelli linguistici e verificabilità formale', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'sperimentale', is_current: true, created_at: '2025-12-10', updated_at: '2025-12-10' }] },
  { id: 'STU-602', name: 'Anna Greco', first_name: 'Anna', last_name: 'Greco', email: 'anna.greco@email.com', phone: '+39 330 2223300', status: 'active', created_at: '2025-09-10', updated_at: '2026-02-22T11:00:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'anna.greco@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-09-10' }], phones: [{ phone: '+39 330 2223300', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-09-10' }] }, academic_records: [{ id: 'AR-030', student_id: 'STU-602', degree_level: 'magistrale', course_name: 'Scienze Infermieristiche', university_name: 'Università di Verona', thesis_professor: 'Prof.ssa Martini', thesis_topic: 'Protocolli di prevenzione delle infezioni ospedaliere e gestione del rischio biologico', thesis_subject: 'Protocolli di gestione del dolore cronico', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2025-09-10', updated_at: '2025-09-10' }] },
  { id: 'STU-608', name: 'Federico Rinaldi', first_name: 'Federico', last_name: 'Rinaldi', email: 'federico.rinaldi@email.com', phone: '+39 337 8889911', status: 'active', created_at: '2025-11-05', updated_at: '2026-01-20T16:45:00', updated_by: 'Francesca', marketing_consent: true, contacts: { emails: [{ email: 'federico.rinaldi@email.com', is_primary: true, purposes: ['generic', 'service_access'], source: 'manual', added_at: '2025-11-05' }, { email: 'f.rinaldi@unipv.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-11-10' }], phones: [{ phone: '+39 337 8889911', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-11-05' }] }, academic_records: [{ id: 'AR-031', student_id: 'STU-608', degree_level: 'magistrale', course_name: 'Filosofia', university_name: 'Università di Pavia', thesis_professor: 'Prof. Agamben', thesis_topic: 'La questione etica dell\'intelligenza artificiale: conseguenze metafisiche e ontologiche', thesis_subject: 'Biopolitica e sorveglianza nell\'era digitale', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'compilativa', is_current: true, created_at: '2025-11-05', updated_at: '2025-11-05' }] },
  // ── Timeline prevista, accesso non ancora attivo ──
  { id: 'STU-531', name: 'Chiara Lombardi', first_name: 'Chiara', last_name: 'Lombardi', email: 'chiara.lombardi@email.com', phone: '+39 345 9990011', status: 'active', created_at: '2026-02-01', updated_at: '2026-03-05T14:10:00', updated_by: 'Francesca', marketing_consent: true, contacts: { emails: [{ email: 'chiara.lombardi@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2026-02-01' }, { email: 'chiara.lombardi@studenti.unifi.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2026-02-05' }], phones: [{ phone: '+39 345 9990011', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2026-02-01' }] }, academic_records: [{ id: 'AR-015', student_id: 'STU-531', degree_level: 'magistrale', course_name: 'Scienze della Formazione', university_name: 'Università di Firenze', thesis_professor: 'Prof.ssa Ferraro', thesis_topic: 'Metodologie collaborative nel learning design in ambienti universitari ibridi', thesis_subject: 'Didattica inclusiva e tecnologie assistive', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2026-02-01', updated_at: '2026-02-01' }] },
  { id: 'STU-563', name: 'Martina Colombo', first_name: 'Martina', last_name: 'Colombo', email: 'martina.colombo@email.com', phone: '+39 335 3334455', status: 'active', created_at: '2026-01-05', updated_at: '2026-02-20T10:45:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'martina.colombo@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2026-01-05' }], phones: [{ phone: '+39 335 3334455', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2026-01-05' }] }, academic_records: [{ id: 'AR-024', student_id: 'STU-563', degree_level: 'magistrale', course_name: 'Economia e Finanza', university_name: 'Università di Milano', thesis_professor: 'Prof. Rigoni', thesis_topic: 'Analisi del comportamento dei mercati finanziari in periodi di volatilità economica', thesis_subject: 'Finanza sostenibile e green bonds', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2026-01-05', updated_at: '2026-01-05' }] },
  // ── Senza timeline ──
  { id: 'STU-423', name: 'Sara Martini', first_name: 'Sara', last_name: 'Martini', email: 'sara.martini@email.com', phone: '+39 347 5551234', status: 'active', created_at: '2025-09-20', updated_at: '2025-11-08T14:22:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'sara.martini@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2025-09-20' }], phones: [{ phone: '+39 347 5551234', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-09-20' }] }, academic_records: [{ id: 'AR-011', student_id: 'STU-423', degree_level: 'triennale', course_name: 'Psicologia', university_name: 'Università di Padova', thesis_professor: 'Prof.ssa Marini', thesis_topic: 'Psicologia dello sviluppo: fattori di resilienza negli adolescenti con ADHD', thesis_subject: 'Effetti dello smart working sul benessere organizzativo', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2025-09-20', updated_at: '2025-09-20' }] },
  { id: 'STU-501', name: 'Paolo Russo', first_name: 'Paolo', last_name: 'Russo', email: 'paolo.russo@email.com', phone: '+39 338 7778899', status: 'invited', created_at: '2026-01-10', updated_at: '2026-03-02T16:05:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'paolo.russo@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2026-01-10' }], phones: [{ phone: '+39 338 7778899', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2026-01-10' }] }, academic_records: [{ id: 'AR-012', student_id: 'STU-501', degree_level: 'magistrale', course_name: 'Giurisprudenza', university_name: 'Università di Napoli', thesis_professor: 'Prof. De Rosa', thesis_topic: 'Diritti della persona fisica nell\'era della sorveglianza digitale', thesis_subject: 'Tutela dei dati personali nell\'era dell\'AI', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2026-01-10', updated_at: '2026-01-10' }] },
  { id: 'STU-467', name: 'Alessandro Brun', first_name: 'Alessandro', last_name: 'Brun', email: 'alessandro.brun@email.com', phone: '+39 320 1112233', status: 'active', created_at: '2025-08-05', updated_at: '2026-02-01T09:00:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'alessandro.brun@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2025-08-05' }, { email: 'a.brun@unimi.it', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2025-08-10' }], phones: [{ phone: '+39 320 1112233', is_primary: true, purposes: ['communications', 'coaching'], source: 'manual', added_at: '2025-08-05' }] }, academic_records: [{ id: 'AR-002', student_id: 'STU-467', degree_level: 'triennale', course_name: 'Scienze Politiche', university_name: 'Università di Milano', thesis_professor: 'Prof.ssa Bianchi', thesis_topic: 'Dinamiche geopolitiche e influenza russa nel contesto europeo post-2022', thesis_subject: 'Comunicazione politica e social media', foreign_language: true, thesis_language: 'Inglese', thesis_type: 'compilativa', is_current: false, created_at: '2025-08-05', updated_at: '2025-12-20' }, { id: 'AR-003', student_id: 'STU-467', degree_level: 'magistrale', course_name: 'Relazioni Internazionali', university_name: 'Università di Milano', thesis_professor: 'Prof. Ferrara', thesis_topic: 'Dinamiche geopolitiche e influenza russa nel contesto europeo post-2022', thesis_subject: 'Geopolitica energetica nel Mediterraneo', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2026-02-01', updated_at: '2026-02-01' }] },
  { id: 'STU-570', name: 'Davide Barbieri', first_name: 'Davide', last_name: 'Barbieri', email: 'davide.barbieri@email.com', phone: '+39 327 6667700', status: 'blocked', created_at: '2025-05-20', updated_at: '2025-09-03T17:00:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'davide.barbieri@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2025-05-20' }], phones: [{ phone: '+39 327 6667700', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-05-20' }] }, academic_records: [{ id: 'AR-025', student_id: 'STU-570', degree_level: 'triennale', course_name: 'Lettere Moderne', university_name: 'Università di Roma', thesis_professor: 'Prof.ssa Rinaldi', thesis_topic: 'L\'evoluzione della narrativa italiana contemporanea nel periodo post-2010', thesis_subject: 'Narrazione post-coloniale nella letteratura italiana', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2025-05-20', updated_at: '2025-05-20' }] },
  { id: 'STU-590', name: 'Beatrice Vitale', first_name: 'Beatrice', last_name: 'Vitale', email: 'beatrice.vitale@email.com', phone: '+39 346 7778800', status: 'active', created_at: '2026-02-15', updated_at: '2026-03-01T10:00:00', updated_by: 'Claudia', marketing_consent: true, contacts: { emails: [{ email: 'beatrice.vitale@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2026-02-15' }], phones: [{ phone: '+39 346 7778800', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2026-02-15' }] }, academic_records: [{ id: 'AR-028', student_id: 'STU-590', degree_level: 'triennale', course_name: 'Sociologia', university_name: 'Università di Bologna', thesis_professor: 'Prof.ssa Ferro', thesis_topic: 'Analisi sociologica della coesione sociale nelle comunità immigrate italiane', thesis_subject: 'Disuguaglianze digitali nelle aree rurali', foreign_language: false, thesis_language: '', thesis_type: 'compilativa', is_current: true, created_at: '2026-02-15', updated_at: '2026-02-15' }] },
  { id: 'STU-596', name: 'Simone Caruso', first_name: 'Simone', last_name: 'Caruso', email: 'simone.caruso@email.com', phone: '+39 341 4445500', status: 'invited', created_at: '2026-03-01', updated_at: '2026-03-05T14:30:00', updated_by: 'Francesca', marketing_consent: false, contacts: { emails: [{ email: 'simone.caruso@email.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2026-03-01' }], phones: [{ phone: '+39 341 4445500', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2026-03-01' }] }, academic_records: [{ id: 'AR-029', student_id: 'STU-596', degree_level: 'magistrale', course_name: 'Scienze Politiche', university_name: 'Università di Padova', thesis_professor: 'Prof. Ferraris', thesis_topic: 'Governance ambientale e politiche climatiche nell\'Unione Europea', thesis_subject: 'Governance multilivello e politiche migratorie europee', foreign_language: false, thesis_language: '', thesis_type: 'sperimentale', is_current: true, created_at: '2026-03-01', updated_at: '2026-03-01' }] },
];

// ─── Catalogo servizi ───────────────────────────────────────
export const SERVICE_CATALOG = [
  { id: 'SRV-001', name: 'Starter Pack', category: 'Starter Pack' as ServiceCategory, defaultPrice: 99 },
  { id: 'SRV-002', name: 'Coaching', category: 'Coaching' as ServiceCategory, defaultPrice: 1200 },
  { id: 'SRV-003', name: 'Coaching Plus', category: 'Coaching' as ServiceCategory, defaultPrice: 1800 },
  { id: 'SRV-004', name: 'Check plagio/AI', category: 'Check plagio/AI' as ServiceCategory, defaultPrice: 0 },
];

// ─── Pipelines Mock Data ────────────────────────────────────
const INITIAL_PIPELINES: Pipeline[] = [
  { 
    id: 'PIP-001', student_id: 'STU-445', student_name: 'Giulia Verdi', first_name: 'Giulia', last_name: 'Verdi', email: 'giulia.verdi@email.com', phone: '+39 333 1234567', sources: ['Form Coaching'], created_at: '2025-10-10', updated_at: '2026-01-20T10:30:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-101'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-001', number: '124/2025', status: 'accepted', sent_at: '2025-10-15', expires_at: '2025-11-15', service_link: 'coaching', amount_gross: 1200 }
    ]
  },
  { 
    id: 'PIP-002', student_id: 'STU-478', student_name: 'Luca Neri', first_name: 'Luca', last_name: 'Neri', email: 'luca.neri@email.com', phone: '+39 340 9876543', sources: ['IG', 'Sottotelefono BO'], created_at: '2025-10-28', updated_at: '2026-02-14T09:15:00', updated_by: 'Giada', lavorazioni_ids: ['SS-117'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-002', number: '156/2025', status: 'accepted', sent_at: '2025-11-01', expires_at: '2025-12-01' }
    ]
  },
  { 
    id: 'PIP-003', student_id: 'STU-423', student_name: 'Sara Martini', first_name: 'Sara', last_name: 'Martini', email: 'sara.martini@email.com', phone: '+39 347 5551234', sources: ['Form Coaching Plus'], created_at: '2024-09-05', updated_at: '2025-11-08T14:22:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-088'],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-003', number: '098/2024', status: 'accepted', sent_at: '2024-09-10', expires_at: '2024-10-10' }
    ]
  },
  { 
    id: 'PIP-004', student_id: 'STU-501', student_name: 'Paolo Russo', first_name: 'Paolo', last_name: 'Russo', email: 'paolo.russo@email.com', phone: '+39 338 7778899', sources: ['Modulo meta ads'], created_at: '2026-01-05', updated_at: '2026-03-02T16:05:00', updated_by: 'Giada', lavorazioni_ids: ['SS-132'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-004', number: '001/2026', status: 'accepted', sent_at: '2026-01-10', expires_at: '2026-02-10' }
    ]
  },
  { 
    id: 'PIP-005', student_id: 'STU-467', student_name: 'Alessandro Brun', first_name: 'Alessandro', last_name: 'Brun', email: 'alessandro.brun@email.com', phone: '+39 320 1112233', sources: ['IG'], created_at: '2025-07-30', updated_at: '2025-08-10T11:00:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-125'],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-005', number: '088/2025', status: 'accepted', sent_at: '2025-08-05', expires_at: '2025-09-05' }
    ]
  },
  { 
    id: 'PIP-006', student_id: 'STU-512', student_name: 'Francesca Moretti', first_name: 'Francesca', last_name: 'Moretti', email: 'francesca.moretti@email.com', phone: '+39 349 4445566', sources: ['Gmail', 'Sottotelefono BO'], created_at: '2024-10-25', updated_at: '2025-10-10T09:45:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-092', 'SS-110'],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-006-1', number: '178/2024', status: 'accepted', sent_at: '2024-11-01', expires_at: '2024-12-01' },
      { id: 'Q-006-2', number: '045/2025', status: 'accepted', sent_at: '2025-10-05', expires_at: '2025-11-05' }
    ]
  },
  { 
    id: 'PIP-007', student_id: 'STU-520', student_name: 'Marco De Luca', first_name: 'Marco', last_name: 'De Luca', email: 'marco.deluca@email.com', phone: '+39 331 6667788', sources: ['Form Coaching'], created_at: '2025-10-15', updated_at: '2026-02-28T08:45:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-114', 'SS-165'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-007', number: '005/2025', status: 'accepted', sent_at: '2025-10-20', expires_at: '2025-11-20' }
    ]
  },
  { 
    id: 'PIP-008', student_id: 'STU-531', student_name: 'Chiara Lombardi', first_name: 'Chiara', last_name: 'Lombardi', email: 'chiara.lombardi@email.com', phone: '+39 345 9990011', sources: ['Modulo meta ads'], created_at: '2025-11-28', updated_at: '2026-01-18T14:20:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-119'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-008', number: '012/2025', status: 'accepted', sent_at: '2025-12-05', expires_at: '2026-01-05' }
    ]
  },
  { 
    id: 'PIP-009', student_id: 'STU-540', student_name: 'Elena Mancini', first_name: 'Elena', last_name: 'Mancini', email: 'elena.mancini@email.com', sources: ['IG', 'Gmail'], created_at: '2025-07-05', updated_at: '2025-12-18T10:30:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-135'],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-009', number: '075/2025', status: 'accepted', sent_at: '2025-07-10', expires_at: '2025-08-10' }
    ]
  },
  { 
    id: 'PIP-010', student_id: 'STU-545', student_name: 'Lorenzo Galli', first_name: 'Lorenzo', last_name: 'Galli', email: 'lorenzo.galli@email.com', phone: '+39 339 2223344', sources: ['Form Coaching Plus'], created_at: '2025-06-10', updated_at: '2025-11-22T16:30:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-138'],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-010', number: '062/2025', status: 'accepted', sent_at: '2025-06-15', expires_at: '2025-07-15' }
    ]
  },
  { 
    id: 'PIP-021', student_id: 'STU-551', student_name: 'Valentina Costa', first_name: 'Valentina', last_name: 'Costa', email: 'valentina.costa@email.com', phone: '+39 342 5556677', sources: ['Modulo meta ads'], created_at: '2025-11-25', updated_at: '2026-01-15T09:20:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-141'],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-021', number: '154/2025', status: 'accepted', sent_at: '2025-12-01', expires_at: '2026-01-01' }
    ]
  },
  { 
    id: 'PIP-022', student_id: 'STU-558', student_name: 'Andrea Pellegrini', first_name: 'Andrea', last_name: 'Pellegrini', email: 'andrea.pellegrini@email.com', phone: '+39 348 8889900', sources: ['IG'], created_at: '2025-10-01', updated_at: '2025-11-12T13:00:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-143', 'SS-145'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-022-1', number: '142/2025', status: 'accepted', sent_at: '2025-10-15', expires_at: '2025-11-15' },
      { id: 'Q-022-2', number: '168/2025', status: 'accepted', sent_at: '2025-11-10', expires_at: '2025-12-10' }
    ]
  },
  { 
    id: 'PIP-023', student_id: 'STU-563', student_name: 'Martina Colombo', first_name: 'Martina', last_name: 'Colombo', email: 'martina.colombo@email.com', sources: ['Form Coaching'], created_at: '2026-01-10', updated_at: '2026-02-20T10:45:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-148'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-023', number: '008/2026', status: 'accepted', sent_at: '2026-01-15', expires_at: '2026-02-15' }
    ]
  },
  { 
    id: 'PIP-024', student_id: 'STU-570', student_name: 'Davide Barbieri', first_name: 'Davide', last_name: 'Barbieri', email: 'davide.barbieri@email.com', phone: '+39 327 6667700', sources: ['Gmail'], created_at: '2025-05-15', updated_at: '2025-09-03T17:00:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-150'],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-024', number: '055/2025', status: 'accepted', sent_at: '2025-05-25', expires_at: '2025-06-25' }
    ]
  },
  { 
    id: 'PIP-025', student_id: 'STU-577', student_name: 'Sofia Ricci', first_name: 'Sofia', last_name: 'Ricci', email: 'sofia.ricci@email.com', phone: '+39 334 9990088', sources: ['Sottotelefono BO'], created_at: '2025-08-20', updated_at: '2025-12-30T11:15:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-153'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-025', number: '092/2025', status: 'accepted', sent_at: '2025-09-10', expires_at: '2025-10-10' }
    ]
  },
  { 
    id: 'PIP-026', student_id: 'STU-583', student_name: 'Matteo Fontana', first_name: 'Matteo', last_name: 'Fontana', email: 'matteo.fontana@email.com', phone: '+39 329 1112244', sources: ['IG'], created_at: '2025-12-28', updated_at: '2026-02-05T09:30:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-155'],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-026', number: '002/2026', status: 'accepted', sent_at: '2026-01-05', expires_at: '2026-02-05' }
    ]
  },
  // ─── Pipeline storiche (lavorazioni già esistenti prima dell'adozione del sistema) ─
  { 
    id: 'PIP-027', student_id: 'STU-602', student_name: 'Anna Greco', first_name: 'Anna', last_name: 'Greco', email: 'anna.greco@email.com', phone: '+39 330 2223300', sources: ['Sottotelefono BO'], created_at: '2025-09-05', updated_at: '2025-09-20T10:00:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-159'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-027', number: '110/2025', status: 'accepted', sent_at: '2025-09-15', expires_at: '2025-10-15' }
    ],
    assigned_to: ['Team Bologna']
  },
  { 
    id: 'PIP-028', student_id: 'STU-608', student_name: 'Federico Rinaldi', first_name: 'Federico', last_name: 'Rinaldi', email: 'federico.rinaldi@email.com', sources: ['IG'], created_at: '2025-11-10', updated_at: '2026-01-20T16:45:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-161'],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-028', number: '148/2025', status: 'accepted', sent_at: '2025-11-15', expires_at: '2025-12-15' }
    ],
    assigned_to: ['Fornitore Nord']
  },
  { 
    id: 'PIP-029', student_id: 'STU-467', student_name: 'Alessandro Brun', first_name: 'Alessandro', last_name: 'Brun', email: 'alessandro.brun@email.com', phone: '+39 320 1112233', sources: ['Form Coaching Plus'], created_at: '2026-02-01', updated_at: '2026-02-06T12:00:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-163'],
    service_link: 'coaching_plus',
    linked_existing_student: true,
    quotes: [
      { id: 'Q-029', number: '013/2026', status: 'accepted', sent_at: '2026-02-05', expires_at: '2026-03-05' }
    ],
    assigned_to: ['Team Torino', 'Fornitore Esterno']
  },
  // ─── Lead senza lavorazioni (casistiche varie) ──────────────
  { 
    id: 'PIP-030', student_id: 'STU-590', student_name: 'Beatrice Vitale', first_name: 'Beatrice', last_name: 'Vitale', email: 'beatrice.vitale@email.com', phone: '+39 346 7778800', sources: ['Form Coaching'], created_at: '2026-02-15', updated_at: '2026-03-02T09:00:00', updated_by: 'Francesca', lavorazioni_ids: ['SS-157'],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-030', number: '025/2026', status: 'sent', sent_at: '2026-03-01', expires_at: '2026-03-25' }
    ],
    assigned_to: ['Team Bologna']
  },
  { 
    id: 'PIP-031', student_id: 'STU-596', student_name: 'Simone Caruso', first_name: 'Simone', last_name: 'Caruso', email: 'simone.caruso@email.com', phone: '+39 341 4445500', sources: ['Modulo meta ads'], created_at: '2026-03-05', updated_at: '2026-03-06T10:15:00', updated_by: 'Claudia', lavorazioni_ids: ['SS-167'],
    quotes: [
      { id: 'Q-031', number: '028/2026', status: 'draft' }
    ],
    assigned_to: ['Operazioni Interne']
  },
  { 
    id: 'PIP-032', student_id: 'STU-615', student_name: 'Irene Bassi', first_name: 'Irene', last_name: 'Bassi', email: 'irene.bassi@gmail.com', sources: ['Gmail'], created_at: '2026-02-20', updated_at: '2026-02-26T14:00:00', updated_by: 'Francesca', lavorazioni_ids: [],
    service_link: 'coaching',
    quotes: [
      { id: 'Q-032', number: '020/2026', status: 'sent', sent_at: '2026-02-25', notes: 'Prezzo troppo alto per il budget dello studente' }
    ],
    assigned_to: ['Team Torino']
  },
  { 
    id: 'PIP-033', student_id: 'STU-622', student_name: 'Riccardo Tosi', first_name: 'Riccardo', last_name: 'Tosi', email: 'riccardo.tosi@student.unibo.it', phone: '+39 333 4441122', sources: ['IG'], created_at: '2026-01-15', updated_at: '2026-02-21T15:30:00', updated_by: 'Claudia', lavorazioni_ids: [],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-033', number: '006/2026', status: 'sent', sent_at: '2026-01-20', expires_at: '2026-02-20' }
    ],
    assigned_to: ['Fornitore Esterno']
  },
  { 
    id: 'PIP-034', student_id: 'STU-629', student_name: 'Camilla Ferretti', first_name: 'Camilla', last_name: 'Ferretti', email: 'camilla.ferretti@email.com', sources: ['Sottotelefono BO'], created_at: '2026-03-14', updated_at: '2026-03-14T16:00:00', updated_by: 'Francesca', lavorazioni_ids: [],
    service_link: 'coaching_plus',
    quotes: [
      { id: 'Q-034', number: '030/2026', status: 'sent', sent_at: '2026-03-14', expires_at: '2026-03-18' }
    ],
    assigned_to: ['Team Bologna', 'Fornitore Nord']
  },
  {
    id: 'PIP-035', student_id: 'STU-636', student_name: 'Nicola Ferri', first_name: 'Nicola', last_name: 'Ferri', email: 'nicola.ferri@libero.it', phone: '+39 349 7770033', sources: ['Modulo meta ads', 'IG'], created_at: '2026-03-10', updated_at: '2026-03-10T11:30:00', updated_by: 'Giada', lavorazioni_ids: [],
    quotes: [
      { id: 'Q-035', number: '029/2026', status: 'draft' }
    ],
    assigned_to: ['Team Torino']
  },
  {
    id: 'PIP-036', student_id: 'STU-643', student_name: 'Giorgia Amato', first_name: 'Giorgia', last_name: 'Amato', email: 'giorgia.amato@email.com', sources: ['Form Coaching'], created_at: '2026-03-12', updated_at: '2026-03-13T09:00:00', updated_by: 'Claudia', lavorazioni_ids: [],
    service_link: 'coaching',
    assigned_to: ['Operazioni Interne'],
  },
  {
    id: 'PIP-037', student_id: 'STU-650', student_name: 'Tommaso Levi', first_name: 'Tommaso', last_name: 'Levi', email: 'tommaso.levi@hotmail.com', phone: '+39 320 9988776', sources: ['Sottotelefono BO'], created_at: '2026-03-16', updated_at: '2026-03-16T17:00:00', updated_by: 'Francesca', lavorazioni_ids: [],
    assigned_to: ['Team Torino']
  },
  {
    id: 'PIP-038', student_id: 'STU-657', student_name: 'Alice Montanari', first_name: 'Alice', last_name: 'Montanari', email: 'alice.montanari@student.unipd.it', sources: ['IG'], created_at: '2026-03-17', updated_at: '2026-03-17T10:15:00', updated_by: 'Giada', lavorazioni_ids: [],
    service_link: 'starter_pack',
    quotes: [
      { id: 'Q-038', number: '031/2026', status: 'draft' }
    ],
    assigned_to: ['Fornitore Nord']
  },
];

// ─── Mock data ──────────────────────────────────────────────
const initialData: StudentService[] = [
  {
    id: 'SS-101',
    pipeline_id: 'PIP-001',
    student_id: 'STU-445',
    student_name: 'Giulia Verdi',
    service_id: 'SRV-002',
    service_name: 'Coaching',
    service_category: 'Coaching',
    quote_id: 'QT-890',
    contract_id: 'CT-101',
    academic_record_id: 'AR-001',
    status: 'active',
    created_at: '2025-11-20',
    created_by: 'Claudia',
    updated_at: '2026-02-10',
    updated_by: 'Francesca',
    start_date: '2025-12-01',
    referente: 'Claudia',
    contract: {
      id: 'CT-101',
      status: 'signed',
      signedAt: '2025-11-28',
      documentUrl: '/contratti/CT-101.pdf',
      expiresAt: '2026-06-01'
    },
    installments: [
      {
        id: 'INS-301', amount: 400, dueDate: '2025-12-01', status: 'paid',
        invoice_number: '89/2025',
        payment: { id: 'PAY-701', amount: 400, paidAt: '2025-11-28', method: 'Bonifico' }
      },
      {
        id: 'INS-302', amount: 400, dueDate: '2026-01-01', status: 'paid',
        invoice_number: '3/2026',
        payment: { id: 'PAY-702', amount: 400, paidAt: '2025-12-30', method: 'Bonifico' }
      },
      {
        id: 'INS-303', amount: 400, dueDate: '2026-02-01', status: 'pending'
      }
    ],
    coach_fee: 480,
    coach_name: 'Martina Rossi',
    coach_payout: {
      id: 'CP-101',
      notula_number: '14/2026',
      notula_issue_date: '2026-02-10',
      notula_amount: 480,
      payment_due_date: '2026-03-22',
      status: 'waiting_due_date',
    },
    needs_timeline: true,
    coaching_access_enabled: true,
    invite_email: 'giulia.verdi@email.com',
    invite_sent_at: '2025-12-03T10:15:00',
    invite_status: 'active',
    plan_start_date: '2025-12-01',
    plan_end_date: '2026-04-01',
    coaching_timeline: [
      { id: 'TL-101', phase: 'Fase 1', description: 'Impostazione e metodologia', status: 'completed', startedAt: '2025-12-01', completedAt: '2025-12-20' },
      { id: 'TL-102', phase: 'Fase 2', description: 'Stesura capitolo introduttivo', status: 'in_progress', startedAt: '2025-12-21' },
      { id: 'TL-103', phase: 'Fase 3', description: 'Sviluppo capitoli centrali', status: 'not_started' },
      { id: 'TL-104', phase: 'Fase 4', description: 'Revisione finale e conclusioni', status: 'not_started' }
    ]
  },
  {
    id: 'SS-117',
    pipeline_id: 'PIP-002',
    student_id: 'STU-478',
    student_name: 'Luca Neri',
    service_id: 'SRV-003',
    service_name: 'Coaching Plus',
    service_category: 'Coaching',
    quote_id: 'QT-912',
    contract_id: 'CT-117',
    status: 'paused',
    created_at: '2026-01-05',
    created_by: 'Francesca',
    updated_at: '2026-02-05',
    updated_by: 'Francesca',
    start_date: '2026-01-15',
    referente: 'Giada',
    contract: {
      id: 'CT-117', status: 'signed', signedAt: '2026-01-10',
      documentUrl: '/contratti/CT-117.pdf', expiresAt: '2026-07-15'
    },
    installments: [
      {
        id: 'INS-401', amount: 600, dueDate: '2026-01-15', status: 'paid',
        invoice_number: '12/2026',
        payment: { id: 'PAY-801', amount: 600, paidAt: '2026-01-12', method: 'Carta di credito' }
      },
      {
        id: 'INS-402', amount: 600, dueDate: '2026-02-05', status: 'overdue'
      },
      {
        id: 'INS-403', amount: 600, dueDate: '2026-03-05', status: 'pending'
      }
    ],
    coach_fee: 720,
    coach_name: 'Marco Bianchi',
    coach_payout: {
      id: 'CP-117',
      status: 'pending_invoice',
    },
    needs_timeline: true,
    coaching_access_enabled: true,
    invite_email: 'luca.neri@email.com',
    invite_sent_at: '2026-01-17T09:30:00',
    invite_status: 'sent',
    plan_start_date: '2026-01-15',
    plan_end_date: '2026-06-15',
    pause_start_date: '2026-02-10',
    pause_end_date: '2026-03-10',
    coaching_timeline: [
      { id: 'TL-201', phase: 'Fase 1', description: 'Analisi e struttura', status: 'completed', startedAt: '2026-01-15', completedAt: '2026-01-28' },
      { id: 'TL-202', phase: 'Fase 2', description: 'Prima stesura', status: 'in_progress', startedAt: '2026-01-29' },
      { id: 'TL-203', phase: 'Fase 3', description: 'Revisione intermedia', status: 'not_started' },
      { id: 'TL-204', phase: 'Fase 4', description: 'Stesura capitoli avanzati', status: 'not_started' },
      { id: 'TL-205', phase: 'Fase 5', description: 'Revisione finale', status: 'not_started' }
    ]
  },
  {
    id: 'SS-132',
    pipeline_id: 'PIP-004',
    student_id: 'STU-501',
    student_name: 'Paolo Russo',
    service_id: 'SRV-001',
    service_name: 'Starter Pack',
    service_category: 'Starter Pack',
    quote_id: 'QT-934',
    contract_id: 'CT-132',
    status: 'active',
    created_at: '2026-02-01',
    created_by: 'Francesca',
    updated_at: '2026-02-01',
    updated_by: 'Francesca',
    referente: 'Claudia',
    plan_start_date: '2026-02-10',
    plan_end_date: '2026-03-10',
    contract: {
      id: 'CT-132', status: 'draft', documentUrl: '/contratti/CT-132.pdf', expiresAt: '2026-08-01'
    },
    installments: [
      {
        id: 'INS-501', amount: 99, dueDate: '2026-02-10', status: 'paid',
        invoice_number: '19/2026',
        payment: { id: 'PAY-1501', amount: 99, paidAt: '2026-02-08', method: 'Carta di credito' }
      }
    ]
  },
  {
    id: 'SS-125',
    pipeline_id: 'PIP-005',
    student_id: 'STU-467',
    student_name: 'Alessandro Brun',
    service_id: 'SRV-002',
    service_name: 'Coaching',
    service_category: 'Coaching',
    quote_id: 'QT-878',
    contract_id: 'CT-125',
    academic_record_id: 'AR-002',
    status: 'completed',
    created_at: '2025-09-01',
    created_by: 'Francesca',
    updated_at: '2025-12-20',
    updated_by: 'Claudia',
    start_date: '2025-09-15',
    end_date: '2025-12-20',
    closed_reason: 'concluso',
    referente: 'Giada',
    contract: {
      id: 'CT-125', status: 'signed', signedAt: '2025-09-10',
      documentUrl: '/contratti/CT-125.pdf', expiresAt: '2026-03-15'
    },
    installments: [
      {
        id: 'INS-101', amount: 400, dueDate: '2025-09-15', status: 'paid',
        invoice_number: '67/2025',
        payment: { id: 'PAY-101', amount: 400, paidAt: '2025-09-12', method: 'Bonifico' }
      },
      {
        id: 'INS-102', amount: 400, dueDate: '2025-10-15', status: 'paid',
        invoice_number: '71/2025',
        payment: { id: 'PAY-102', amount: 400, paidAt: '2025-10-13', method: 'Bonifico' }
      },
      {
        id: 'INS-103', amount: 400, dueDate: '2025-11-15', status: 'paid',
        invoice_number: '75/2025',
        payment: { id: 'PAY-103', amount: 400, paidAt: '2025-11-14', method: 'Bonifico' }
      }
    ],
    coach_fee: 480,
    coach_name: 'Martina Rossi',
    coach_payout: {
      id: 'CP-125',
      notula_number: '88/2025',
      notula_issue_date: '2025-12-22',
      notula_amount: 480,
      payment_due_date: '2026-01-31',
      status: 'paid',
      paid_at: '2026-01-30',
      payment_reference: 'BON-2026-0130-ROSSI',
    },
    needs_timeline: true,
    coaching_access_enabled: true,
    plan_start_date: '2025-09-15',
    plan_end_date: '2025-12-20',
    coaching_timeline: [
      { id: 'TL-001', phase: 'Fase 1', description: 'Impostazione progetto', status: 'completed', startedAt: '2025-09-15', completedAt: '2025-10-05' },
      { id: 'TL-002', phase: 'Fase 2', description: 'Ricerca e metodologia', status: 'completed', startedAt: '2025-10-06', completedAt: '2025-10-28' },
      { id: 'TL-003', phase: 'Fase 3', description: 'Stesura capitoli', status: 'completed', startedAt: '2025-10-29', completedAt: '2025-11-25' },
      { id: 'TL-004', phase: 'Fase 4', description: 'Revisione e consegna', status: 'completed', startedAt: '2025-11-26', completedAt: '2025-12-20' }
    ]
  },
  {
    id: 'SS-088',
    pipeline_id: 'PIP-003',
    student_id: 'STU-423',
    student_name: 'Sara Martini',
    service_id: 'SRV-002',
    service_name: 'Coaching',
    service_category: 'Coaching',
    quote_id: 'QT-812',
    contract_id: 'CT-088',
    status: 'completed',
    created_at: '2024-09-10',
    created_by: 'Claudia',
    updated_at: '2024-12-18',
    updated_by: 'Claudia',
    start_date: '2024-09-20',
    end_date: '2024-12-18',
    closed_reason: 'concluso',
    referente: 'Claudia',
    contract: {
      id: 'CT-088', status: 'signed', signedAt: '2024-09-15',
      documentUrl: '/contratti/CT-088.pdf', expiresAt: '2025-03-10'
    },
    installments: [
      {
        id: 'INS-801', amount: 400, dueDate: '2024-09-20', status: 'paid',
        invoice_number: '45/2024',
        payment: { id: 'PAY-901', amount: 400, paidAt: '2024-09-18', method: 'Bonifico' }
      },
      {
        id: 'INS-802', amount: 400, dueDate: '2024-10-20', status: 'paid',
        invoice_number: '52/2024',
        payment: { id: 'PAY-902', amount: 400, paidAt: '2024-10-19', method: 'Bonifico' }
      },
      {
        id: 'INS-803', amount: 400, dueDate: '2024-11-20', status: 'paid',
        invoice_number: '58/2024',
        payment: { id: 'PAY-903', amount: 400, paidAt: '2024-11-17', method: 'Carta di credito' }
      }
    ],
    coach_fee: 480,
    coach_name: 'Andrea Conti',
    coach_payout: {
      id: 'CP-088',
      notula_number: '62/2024',
      notula_issue_date: '2025-01-10',
      notula_amount: 480,
      payment_due_date: '2025-02-19',
      status: 'paid',
      paid_at: '2025-02-18',
      payment_reference: 'BON-2025-0218-CONTI',
    },
    needs_timeline: true,
    coaching_access_enabled: true,
    plan_start_date: '2024-09-20',
    plan_end_date: '2024-12-18',
    coaching_timeline: [
      { id: 'TL-801', phase: 'Fase 1', description: 'Definizione argomento', status: 'completed', startedAt: '2024-09-20', completedAt: '2024-10-10' },
      { id: 'TL-802', phase: 'Fase 2', description: 'Ricerca bibliografica', status: 'completed', startedAt: '2024-10-11', completedAt: '2024-11-05' },
      { id: 'TL-803', phase: 'Fase 3', description: 'Stesura e revisione', status: 'completed', startedAt: '2024-11-06', completedAt: '2024-12-18' }
    ]
  },
  {
    id: 'SS-092',
    pipeline_id: 'PIP-006',
    student_id: 'STU-512',
    student_name: 'Francesca Moretti',
    service_id: 'SRV-001',
    service_name: 'Starter Pack',
    service_category: 'Starter Pack',
    quote_id: 'QT-830',
    status: 'completed',
    created_at: '2024-11-05',
    created_by: 'Giada',
    updated_at: '2024-11-20',
    updated_by: 'Giada',
    end_date: '2024-11-20',
    referente: 'Giada',
    plan_start_date: '2024-11-08',
    plan_end_date: '2024-12-08',
    contract: {
      id: 'CT-092', status: 'signed', signedAt: '2024-11-08',
      documentUrl: '/contratti/CT-092.pdf'
    },
    installments: [
      {
        id: 'INS-901', amount: 99, dueDate: '2024-11-10', status: 'paid',
        invoice_number: '61/2024',
        payment: { id: 'PAY-1001', amount: 99, paidAt: '2024-11-09', method: 'Carta di credito' }
      }
    ]
  },
  {
    id: 'SS-110',
    pipeline_id: 'PIP-006',
    student_id: 'STU-512',
    student_name: 'Francesca Moretti',
    service_id: 'SRV-003',
    service_name: 'Coaching Plus',
    service_category: 'Coaching',
    quote_id: 'QT-901',
    contract_id: 'CT-110',
    status: 'active',
    created_at: '2025-10-10',
    created_by: 'Claudia',
    updated_at: '2026-01-15',
    updated_by: 'Francesca',
    start_date: '2025-10-20',
    referente: 'Claudia',
    contract: {
      id: 'CT-110', status: 'signed', signedAt: '2025-10-15',
      documentUrl: '/contratti/CT-110.pdf', expiresAt: '2026-04-10'
    },
    installments: [
      {
        id: 'INS-601', amount: 600, dueDate: '2025-10-20', status: 'paid',
        invoice_number: '78/2025',
        payment: { id: 'PAY-610', amount: 600, paidAt: '2025-10-18', method: 'Bonifico' }
      },
      {
        id: 'INS-602', amount: 600, dueDate: '2025-11-20', status: 'paid',
        invoice_number: '83/2025',
        payment: { id: 'PAY-611', amount: 600, paidAt: '2025-11-19', method: 'Bonifico' }
      },
      {
        id: 'INS-603', amount: 600, dueDate: '2025-12-20', status: 'overdue'
      }
    ],
    coach_fee: 720,
    coach_name: 'Elena Ferretti',
    coach_payout: {
      id: 'CP-110',
      notula_number: '5/2026',
      notula_issue_date: '2026-01-15',
      notula_amount: 720,
      payment_due_date: '2026-02-24',
      status: 'ready_to_pay',
    },
    needs_timeline: true,
    coaching_access_enabled: true,
    invite_email: 'francesca.moretti@email.com',
    invite_sent_at: '2025-10-22T11:00:00',
    invite_status: 'active',
    plan_start_date: '2025-10-20',
    plan_end_date: '2026-03-20',
    coaching_timeline: [
      { id: 'TL-601', phase: 'Fase 1', description: 'Definizione struttura', status: 'completed', startedAt: '2025-10-20', completedAt: '2025-11-10' },
      { id: 'TL-602', phase: 'Fase 2', description: 'Stesura primi capitoli', status: 'completed', startedAt: '2025-11-11', completedAt: '2025-12-05' },
      { id: 'TL-603', phase: 'Fase 3', description: 'Analisi dati e risultati', status: 'in_progress', startedAt: '2025-12-06' },
      { id: 'TL-604', phase: 'Fase 4', description: 'Revisione e bibliografia', status: 'not_started' }
    ]
  },
  {
    id: 'SS-114',
    pipeline_id: 'PIP-007',
    student_id: 'STU-520',
    student_name: 'Marco De Luca',
    service_id: 'SRV-001',
    service_name: 'Starter Pack',
    service_category: 'Starter Pack',
    quote_id: 'QT-905',
    status: 'completed',
    created_at: '2025-10-25',
    created_by: 'Giada',
    updated_at: '2025-11-10',
    updated_by: 'Giada',
    end_date: '2025-11-10',
    referente: 'Giada',
    plan_start_date: '2025-10-28',
    plan_end_date: '2025-11-28',
    contract: {
      id: 'CT-114', status: 'signed', signedAt: '2025-10-28',
      documentUrl: '/contratti/CT-114.pdf'
    },
    installments: [
      {
        id: 'INS-651', amount: 99, dueDate: '2025-11-01', status: 'paid',
        invoice_number: '82/2025',
        payment: { id: 'PAY-651', amount: 99, paidAt: '2025-10-30', method: 'Carta di credito' }
      }
    ]
  },
  {
    id: 'SS-119',
    pipeline_id: 'PIP-008',
    student_id: 'STU-531',
    student_name: 'Chiara Lombardi',
    service_id: 'SRV-002',
    service_name: 'Coaching',
    service_category: 'Coaching',
    quote_id: 'QT-920',
    contract_id: 'CT-119',
    status: 'active',
    created_at: '2025-12-15',
    created_by: 'Claudia',
    updated_at: '2025-12-15',
    updated_by: 'Claudia',
    referente: 'Claudia',
    plan_start_date: '2026-01-10',
    plan_end_date: '2026-07-10',
    contract: {
      id: 'CT-119', status: 'draft',
      documentUrl: '/contratti/CT-119.pdf'
    },
    installments: [
      {
        id: 'INS-920', amount: 400, dueDate: '2026-01-10', status: 'paid',
        invoice_number: '13/2026',
        payment: { id: 'PAY-920', amount: 400, paidAt: '2026-01-08', method: 'Bonifico' }
      },
      {
        id: 'INS-921', amount: 400, dueDate: '2026-02-10', status: 'pending'
      }
    ],
    coach_name: undefined,
    needs_timeline: true, // Prevista ma da creare (coaching appena attivato, timeline da onboardare)
  },
  // ─── New services for expanded student list ─────────────────
  { id: 'SS-135', pipeline_id: 'PIP-009', student_id: 'STU-540', student_name: 'Elena Mancini', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-940', contract_id: 'CT-135', academic_record_id: 'AR-020', status: 'active', created_at: '2025-08-01', created_by: 'Claudia', updated_at: '2026-01-20', updated_by: 'Claudia', start_date: '2025-08-15', referente: 'Claudia', area_tematica: 'Scienze', plan_start_date: '2025-08-15', plan_end_date: '2026-02-15', needs_timeline: true, coaching_access_enabled: true, invite_email: 'elena.mancini@email.com', invite_sent_at: '2025-08-18T14:00:00', invite_status: 'active', contract: { id: 'CT-135', status: 'signed', signedAt: '2025-08-10', documentUrl: '/contratti/CT-135.pdf', expiresAt: '2026-02-15' }, installments: [{ id: 'INS-1001', amount: 400, dueDate: '2025-08-15', status: 'paid', invoice_number: '56/2025', payment: { id: 'PAY-1101', amount: 400, paidAt: '2025-08-13', method: 'Bonifico' } }, { id: 'INS-1002', amount: 400, dueDate: '2025-09-15', status: 'paid', invoice_number: '62/2025', payment: { id: 'PAY-1102', amount: 400, paidAt: '2025-09-12', method: 'Bonifico' } }, { id: 'INS-1003', amount: 400, dueDate: '2025-10-15', status: 'paid', invoice_number: '70/2025', payment: { id: 'PAY-1103', amount: 400, paidAt: '2025-10-14', method: 'Bonifico' } }], coach_fee: 480, coach_name: 'Lucia Marchetti', coach_payout: { id: 'CP-135', notula_number: '90/2025', notula_issue_date: '2025-11-01', notula_amount: 480, status: 'paid', paid_at: '2025-12-10', payment_reference: 'BON-2025-1210-MARCHETTI' }, coaching_timeline: [{ id: 'TL-135-1', phase: 'Fase 1', description: 'Definizione ipotesi sperimentale', status: 'completed', startedAt: '2025-08-15', completedAt: '2025-09-01' }, { id: 'TL-135-2', phase: 'Fase 2', description: 'Disegno sperimentale e raccolta', status: 'completed', startedAt: '2025-09-02', completedAt: '2025-10-30' }, { id: 'TL-135-3', phase: 'Fase 3', description: 'Analisi e stesura risultati', status: 'completed', startedAt: '2025-11-01', completedAt: '2025-12-15' }, { id: 'TL-135-4', phase: 'Fase 4', description: 'Revisione finale', status: 'in_progress', startedAt: '2025-12-16' }] },
  { id: 'SS-138', pipeline_id: 'PIP-010', student_id: 'STU-545', student_name: 'Lorenzo Galli', service_id: 'SRV-003', service_name: 'Coaching Plus', service_category: 'Coaching', quote_id: 'QT-945', contract_id: 'CT-138', academic_record_id: 'AR-021', status: 'active', created_at: '2025-09-15', created_by: 'Giada', updated_at: '2026-02-28', updated_by: 'Giada', start_date: '2025-10-01', referente: 'Giada', area_tematica: 'Scienze', plan_start_date: '2025-10-01', plan_end_date: '2026-04-01', needs_timeline: true, coaching_access_enabled: true, invite_email: 'l.galli@medicina.unige.it', invite_sent_at: '2025-10-03T08:45:00', invite_status: 'active', contract: { id: 'CT-138', status: 'signed', signedAt: '2025-09-25', documentUrl: '/contratti/CT-138.pdf', expiresAt: '2026-04-01' }, installments: [{ id: 'INS-1010', amount: 600, dueDate: '2025-10-01', status: 'paid', invoice_number: '72/2025', payment: { id: 'PAY-1110', amount: 600, paidAt: '2025-09-28', method: 'Carta di credito' } }, { id: 'INS-1011', amount: 600, dueDate: '2025-11-01', status: 'paid', invoice_number: '80/2025', payment: { id: 'PAY-1111', amount: 600, paidAt: '2025-10-30', method: 'Carta di credito' } }, { id: 'INS-1012', amount: 600, dueDate: '2025-12-01', status: 'paid', invoice_number: '87/2025', payment: { id: 'PAY-1112', amount: 600, paidAt: '2025-11-28', method: 'Carta di credito' } }], coach_fee: 720, coach_name: 'Marco Bianchi', coach_payout: { id: 'CP-138', notula_number: '2/2026', notula_issue_date: '2026-01-05', notula_amount: 720, status: 'paid', paid_at: '2026-02-12', payment_reference: 'BON-2026-0212-BIANCHI' }, coaching_timeline: [{ id: 'TL-138-1', phase: 'Fase 1', description: 'Revisione letteratura medica', status: 'completed', startedAt: '2025-10-01', completedAt: '2025-10-20' }, { id: 'TL-138-2', phase: 'Fase 2', description: 'Protocollo sperimentale', status: 'completed', startedAt: '2025-10-21', completedAt: '2025-11-15' }, { id: 'TL-138-3', phase: 'Fase 3', description: 'Raccolta dati clinici', status: 'completed', startedAt: '2025-11-16', completedAt: '2026-01-10' }, { id: 'TL-138-4', phase: 'Fase 4', description: 'Analisi dati e risultati', status: 'in_progress', startedAt: '2026-01-11' }, { id: 'TL-138-5', phase: 'Fase 5', description: 'Stesura discussione', status: 'not_started' }, { id: 'TL-138-6', phase: 'Fase 6', description: 'Revisione finale e abstract', status: 'not_started' }] },
  { id: 'SS-141', pipeline_id: 'PIP-021', student_id: 'STU-551', student_name: 'Valentina Costa', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-950', contract_id: 'CT-141', academic_record_id: 'AR-022', status: 'active', created_at: '2025-12-05', created_by: 'Francesca', updated_at: '2026-03-01', updated_by: 'Francesca', start_date: '2025-12-20', referente: 'Claudia', area_tematica: 'Economia', plan_start_date: '2025-12-20', plan_end_date: '2026-06-20', needs_timeline: true, coaching_access_enabled: true, invite_email: 'valentina.costa@email.com', invite_sent_at: '2025-12-22T16:00:00', invite_status: 'sent', contract: { id: 'CT-141', status: 'signed', signedAt: '2025-12-15', documentUrl: '/contratti/CT-141.pdf', expiresAt: '2026-06-20' }, installments: [{ id: 'INS-1020', amount: 400, dueDate: '2025-12-20', status: 'paid', invoice_number: '92/2025', payment: { id: 'PAY-1120', amount: 400, paidAt: '2025-12-18', method: 'Bonifico' } }, { id: 'INS-1021', amount: 400, dueDate: '2026-01-20', status: 'paid', invoice_number: '8/2026', payment: { id: 'PAY-1121', amount: 400, paidAt: '2026-01-18', method: 'Bonifico' } }, { id: 'INS-1022', amount: 400, dueDate: '2026-02-20', status: 'overdue' }], coach_fee: 480, coach_name: 'Andrea Conti', coach_payout: { id: 'CP-141', notula_number: '18/2026', notula_issue_date: '2026-02-28', notula_amount: 480, status: 'waiting_due_date' }, coaching_timeline: [{ id: 'TL-141-1', phase: 'Fase 1', description: 'Analisi settore luxury fashion', status: 'completed', startedAt: '2025-12-20', completedAt: '2026-01-10' }, { id: 'TL-141-2', phase: 'Fase 2', description: 'Framework teorico brand storytelling', status: 'completed', startedAt: '2026-01-11', completedAt: '2026-02-05' }, { id: 'TL-141-3', phase: 'Fase 3', description: 'Indagine empirica', status: 'in_progress', startedAt: '2026-02-06' }, { id: 'TL-141-4', phase: 'Fase 4', description: 'Stesura capitoli', status: 'not_started' }, { id: 'TL-141-5', phase: 'Fase 5', description: 'Revisione finale', status: 'not_started' }] },
  { id: 'SS-143', pipeline_id: 'PIP-022', student_id: 'STU-558', student_name: 'Andrea Pellegrini', service_id: 'SRV-001', service_name: 'Starter Pack', service_category: 'Starter Pack', quote_id: 'QT-952', status: 'completed', created_at: '2025-10-20', created_by: 'Giada', updated_at: '2025-11-05', updated_by: 'Giada', end_date: '2025-11-05', referente: 'Giada', plan_start_date: '2025-10-22', plan_end_date: '2025-11-22', contract: { id: 'CT-143', status: 'signed', signedAt: '2025-10-22', documentUrl: '/contratti/CT-143.pdf' }, installments: [{ id: 'INS-1030', amount: 99, dueDate: '2025-10-25', status: 'paid', invoice_number: '77/2025', payment: { id: 'PAY-1130', amount: 99, paidAt: '2025-10-24', method: 'Carta di credito' } }] },
  { id: 'SS-145', pipeline_id: 'PIP-022', student_id: 'STU-558', student_name: 'Andrea Pellegrini', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-955', contract_id: 'CT-145', academic_record_id: 'AR-023', status: 'active', created_at: '2025-11-15', created_by: 'Claudia', updated_at: '2026-02-20', updated_by: 'Claudia', start_date: '2025-12-01', is_upgrade_from: 'SS-143', referente: 'Claudia', area_tematica: 'Scienze', plan_start_date: '2025-12-01', plan_end_date: '2026-06-01', needs_timeline: true, coaching_access_enabled: true, invite_email: 'andrea.pellegrini@email.com', invite_sent_at: '2025-12-04T10:30:00', invite_status: 'active', contract: { id: 'CT-145', status: 'signed', signedAt: '2025-11-20', documentUrl: '/contratti/CT-145.pdf', expiresAt: '2026-06-01' }, installments: [{ id: 'INS-1040', amount: 400, dueDate: '2025-12-01', status: 'paid', invoice_number: '88/2025', payment: { id: 'PAY-1140', amount: 400, paidAt: '2025-11-29', method: 'Bonifico' } }, { id: 'INS-1041', amount: 400, dueDate: '2026-01-01', status: 'paid', invoice_number: '4/2026', payment: { id: 'PAY-1141', amount: 400, paidAt: '2025-12-30', method: 'Bonifico' } }, { id: 'INS-1042', amount: 400, dueDate: '2026-02-01', status: 'pending' }], coach_fee: 480, coach_name: 'Elena Ferretti', coach_payout: { id: 'CP-145', status: 'pending_invoice' }, coaching_timeline: [{ id: 'TL-145-1', phase: 'Fase 1', description: 'Rassegna letteratura ambientale', status: 'completed', startedAt: '2025-12-01', completedAt: '2025-12-20' }, { id: 'TL-145-2', phase: 'Fase 2', description: 'Stesura introduzione e cap. 1', status: 'completed', startedAt: '2025-12-21', completedAt: '2026-01-25' }, { id: 'TL-145-3', phase: 'Fase 3', description: 'Capitoli centrali', status: 'in_progress', startedAt: '2026-01-26' }, { id: 'TL-145-4', phase: 'Fase 4', description: 'Conclusioni e revisione', status: 'not_started' }] },
  { id: 'SS-148', pipeline_id: 'PIP-023', student_id: 'STU-563', student_name: 'Martina Colombo', service_id: 'SRV-003', service_name: 'Coaching Plus', service_category: 'Coaching', quote_id: 'QT-960', contract_id: 'CT-148', academic_record_id: 'AR-024', status: 'active', created_at: '2026-01-20', created_by: 'Francesca', updated_at: '2026-01-20', updated_by: 'Francesca', referente: 'Giada', area_tematica: 'Economia', plan_start_date: '2026-02-15', plan_end_date: '2026-08-15', needs_timeline: true, contract: { id: 'CT-148', status: 'draft', documentUrl: '/contratti/CT-148.pdf', expiresAt: '2026-07-20' }, installments: [{ id: 'INS-1050', amount: 600, dueDate: '2026-02-01', status: 'paid', invoice_number: '14/2026', payment: { id: 'PAY-1050', amount: 600, paidAt: '2026-01-30', method: 'Bonifico' } }, { id: 'INS-1051', amount: 600, dueDate: '2026-03-01', status: 'pending' }, { id: 'INS-1052', amount: 600, dueDate: '2026-04-01', status: 'pending' }], coach_name: 'Lucia Marchetti', coach_fee: 720 },
  { id: 'SS-150', pipeline_id: 'PIP-024', student_id: 'STU-570', student_name: 'Davide Barbieri', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-962', contract_id: 'CT-150', academic_record_id: 'AR-025', status: 'cancelled', created_at: '2025-06-01', created_by: 'Claudia', updated_at: '2025-08-15', updated_by: 'Francesca', start_date: '2025-06-15', end_date: '2025-08-15', closed_reason: 'abbandono', referente: 'Claudia', plan_start_date: '2025-06-15', plan_end_date: '2025-12-15', contract: { id: 'CT-150', status: 'cancelled', signedAt: '2025-06-10', documentUrl: '/contratti/CT-150.pdf' }, installments: [{ id: 'INS-1060', amount: 400, dueDate: '2025-06-15', status: 'paid', invoice_number: '40/2025', payment: { id: 'PAY-1160', amount: 400, paidAt: '2025-06-13', method: 'Bonifico' } }, { id: 'INS-1061', amount: 400, dueDate: '2025-07-15', status: 'paid', invoice_number: '48/2025', payment: { id: 'PAY-1161', amount: 400, paidAt: '2025-07-12', method: 'Bonifico' } }], coach_fee: 320, coach_name: 'Martina Rossi', coach_payout: { id: 'CP-150', notula_number: '55/2025', notula_issue_date: '2025-08-20', notula_amount: 320, status: 'disputed' } },
  { id: 'SS-153', pipeline_id: 'PIP-025', student_id: 'STU-577', student_name: 'Sofia Ricci', service_id: 'SRV-003', service_name: 'Coaching Plus', service_category: 'Coaching', quote_id: 'QT-966', contract_id: 'CT-153', academic_record_id: 'AR-026', status: 'active', created_at: '2025-09-20', created_by: 'Giada', updated_at: '2026-02-15', updated_by: 'Giada', start_date: '2025-10-05', referente: 'Giada', plan_start_date: '2025-10-05', plan_end_date: '2026-04-05', needs_timeline: true, coaching_access_enabled: true, invite_email: 's.ricci@design.polimi.it', invite_sent_at: '2025-10-07T09:00:00', invite_status: 'active', contract: { id: 'CT-153', status: 'signed', signedAt: '2025-09-28', documentUrl: '/contratti/CT-153.pdf', expiresAt: '2026-04-05' }, installments: [{ id: 'INS-1070', amount: 600, dueDate: '2025-10-05', status: 'paid', invoice_number: '73/2025', payment: { id: 'PAY-1170', amount: 600, paidAt: '2025-10-03', method: 'Bonifico' } }, { id: 'INS-1071', amount: 600, dueDate: '2025-11-05', status: 'paid', invoice_number: '81/2025', payment: { id: 'PAY-1171', amount: 600, paidAt: '2025-11-04', method: 'Bonifico' } }, { id: 'INS-1072', amount: 600, dueDate: '2025-12-05', status: 'paid', invoice_number: '86/2025', payment: { id: 'PAY-1172', amount: 600, paidAt: '2025-12-03', method: 'Bonifico' } }], coach_fee: 720, coach_name: 'Andrea Conti', coach_payout: { id: 'CP-153', notula_number: '10/2026', notula_issue_date: '2026-01-20', notula_amount: 720, status: 'ready_to_pay' }, coaching_timeline: [{ id: 'TL-153-1', phase: 'Fase 1', description: 'Analisi UX stato dell\'arte', status: 'completed', startedAt: '2025-10-05', completedAt: '2025-10-20' }, { id: 'TL-153-2', phase: 'Fase 2', description: 'User research e personas', status: 'completed', startedAt: '2025-10-21', completedAt: '2025-11-10' }, { id: 'TL-153-3', phase: 'Fase 3', description: 'Prototipazione e test', status: 'completed', startedAt: '2025-11-11', completedAt: '2025-12-05' }, { id: 'TL-153-4', phase: 'Fase 4', description: 'Iterazione design', status: 'completed', startedAt: '2025-12-06', completedAt: '2026-01-20' }, { id: 'TL-153-5', phase: 'Fase 5', description: 'Stesura risultati', status: 'in_progress', startedAt: '2026-01-21' }, { id: 'TL-153-6', phase: 'Fase 6', description: 'Revisione finale', status: 'not_started' }] },
  { id: 'SS-155', pipeline_id: 'PIP-026', student_id: 'STU-583', student_name: 'Matteo Fontana', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-970', contract_id: 'CT-155', academic_record_id: 'AR-027', status: 'active', created_at: '2026-01-10', created_by: 'Francesca', updated_at: '2026-03-05', updated_by: 'Claudia', start_date: '2026-01-20', referente: 'Claudia', area_tematica: 'Ingegneria', plan_start_date: '2026-01-20', plan_end_date: '2026-07-20', needs_timeline: true, coaching_access_enabled: true, invite_email: 'matteo.fontana@email.com', invite_sent_at: '2026-01-22T10:00:00', invite_status: 'sent', contract: { id: 'CT-155', status: 'signed', signedAt: '2026-01-15', documentUrl: '/contratti/CT-155.pdf', expiresAt: '2026-07-20' }, installments: [{ id: 'INS-1080', amount: 400, dueDate: '2026-01-20', status: 'paid', invoice_number: '11/2026', payment: { id: 'PAY-1180', amount: 400, paidAt: '2026-01-18', method: 'Carta di credito' } }, { id: 'INS-1081', amount: 400, dueDate: '2026-02-20', status: 'pending' }, { id: 'INS-1082', amount: 400, dueDate: '2026-03-20', status: 'pending' }], coach_fee: 480, coach_name: 'Marco Bianchi', coach_payout: { id: 'CP-155', status: 'pending_invoice' }, coaching_timeline: [{ id: 'TL-155-1', phase: 'Fase 1', description: 'Definizione scope e architettura', status: 'completed', startedAt: '2026-01-20', completedAt: '2026-02-05' }, { id: 'TL-155-2', phase: 'Fase 2', description: 'Implementazione core', status: 'in_progress', startedAt: '2026-02-06' }, { id: 'TL-155-3', phase: 'Fase 3', description: 'Testing e validazione', status: 'not_started' }, { id: 'TL-155-4', phase: 'Fase 4', description: 'Stesura capitoli tecnici', status: 'not_started' }, { id: 'TL-155-5', phase: 'Fase 5', description: 'Revisione finale', status: 'not_started' }] },
  { id: 'SS-157', pipeline_id: 'PIP-030', student_id: 'STU-590', student_name: 'Beatrice Vitale', service_id: 'SRV-001', service_name: 'Starter Pack', service_category: 'Starter Pack', quote_id: 'QT-975', status: 'active', created_at: '2026-02-20', created_by: 'Francesca', updated_at: '2026-02-20', updated_by: 'Francesca', referente: 'Giada', plan_start_date: '2026-03-01', plan_end_date: '2026-04-01', contract: { id: 'CT-157', status: 'draft', documentUrl: '/contratti/CT-157.pdf' }, installments: [{ id: 'INS-1090', amount: 99, dueDate: '2026-03-01', status: 'paid', invoice_number: '22/2026', payment: { id: 'PAY-1090', amount: 99, paidAt: '2026-02-27', method: 'Carta di credito' } }] },
  { id: 'SS-159', pipeline_id: 'PIP-027', student_id: 'STU-602', student_name: 'Anna Greco', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-978', contract_id: 'CT-159', academic_record_id: 'AR-030', status: 'active', created_at: '2025-10-01', created_by: 'Claudia', updated_at: '2026-01-30', updated_by: 'Francesca', start_date: '2025-10-15', referente: 'Claudia', area_tematica: 'Scienze', plan_start_date: '2025-10-15', plan_end_date: '2026-04-15', needs_timeline: true, coaching_access_enabled: true, invite_email: 'anna.greco@email.com', invite_sent_at: '2025-10-16T08:30:00', invite_status: 'active', contract: { id: 'CT-159', status: 'signed', signedAt: '2025-10-10', documentUrl: '/contratti/CT-159.pdf', expiresAt: '2026-04-15' }, installments: [{ id: 'INS-1100', amount: 400, dueDate: '2025-10-15', status: 'paid', invoice_number: '74/2025', payment: { id: 'PAY-1200', amount: 400, paidAt: '2025-10-13', method: 'Bonifico' } }, { id: 'INS-1101', amount: 400, dueDate: '2025-11-15', status: 'paid', invoice_number: '84/2025', payment: { id: 'PAY-1201', amount: 400, paidAt: '2025-11-13', method: 'Bonifico' } }, { id: 'INS-1102', amount: 400, dueDate: '2025-12-15', status: 'paid', invoice_number: '91/2025', payment: { id: 'PAY-1202', amount: 400, paidAt: '2025-12-12', method: 'Bonifico' } }], coach_fee: 480, coach_name: 'Lucia Marchetti', coach_payout: { id: 'CP-159', notula_number: '7/2026', notula_issue_date: '2026-01-10', notula_amount: 480, status: 'paid', paid_at: '2026-02-18', payment_reference: 'BON-2026-0218-MARCHETTI' }, coaching_timeline: [{ id: 'TL-159-1', phase: 'Fase 1', description: 'Review letteratura infermieristica', status: 'completed', startedAt: '2025-10-15', completedAt: '2025-11-05' }, { id: 'TL-159-2', phase: 'Fase 2', description: 'Stesura protocolli', status: 'completed', startedAt: '2025-11-06', completedAt: '2025-12-10' }, { id: 'TL-159-3', phase: 'Fase 3', description: 'Capitoli e discussione', status: 'completed', startedAt: '2025-12-11', completedAt: '2026-02-15' }, { id: 'TL-159-4', phase: 'Fase 4', description: 'Revisione finale', status: 'in_progress', startedAt: '2026-02-16' }] },
  { id: 'SS-161', pipeline_id: 'PIP-028', student_id: 'STU-608', student_name: 'Federico Rinaldi', service_id: 'SRV-003', service_name: 'Coaching Plus', service_category: 'Coaching', quote_id: 'QT-982', contract_id: 'CT-161', academic_record_id: 'AR-031', status: 'active', created_at: '2025-11-20', created_by: 'Giada', updated_at: '2026-03-01', updated_by: 'Giada', start_date: '2025-12-05', referente: 'Giada', area_tematica: 'Umanistico', plan_start_date: '2025-12-05', plan_end_date: '2026-06-05', needs_timeline: true, coaching_access_enabled: true, invite_email: 'federico.rinaldi@email.com', invite_sent_at: '2025-12-08T11:15:00', invite_status: 'sent', contract: { id: 'CT-161', status: 'signed', signedAt: '2025-11-28', documentUrl: '/contratti/CT-161.pdf', expiresAt: '2026-06-05' }, installments: [{ id: 'INS-1110', amount: 600, dueDate: '2025-12-05', status: 'paid', invoice_number: '90/2025', payment: { id: 'PAY-1210', amount: 600, paidAt: '2025-12-03', method: 'Bonifico' } }, { id: 'INS-1111', amount: 600, dueDate: '2026-01-05', status: 'paid', invoice_number: '6/2026', payment: { id: 'PAY-1211', amount: 600, paidAt: '2026-01-03', method: 'Bonifico' } }, { id: 'INS-1112', amount: 600, dueDate: '2026-02-05', status: 'overdue' }], coach_fee: 720, coach_name: 'Martina Rossi', coach_payout: { id: 'CP-161', notula_number: '15/2026', notula_issue_date: '2026-02-15', notula_amount: 720, status: 'waiting_due_date' }, coaching_timeline: [{ id: 'TL-161-1', phase: 'Fase 1', description: 'Framework filosofico biopolitica', status: 'completed', startedAt: '2025-12-05', completedAt: '2025-12-20' }, { id: 'TL-161-2', phase: 'Fase 2', description: 'Analisi testuale Foucault/Agamben', status: 'completed', startedAt: '2025-12-21', completedAt: '2026-01-25' }, { id: 'TL-161-3', phase: 'Fase 3', description: 'Sviluppo argomentazione sorveglianza digitale', status: 'in_progress', startedAt: '2026-01-26' }, { id: 'TL-161-4', phase: 'Fase 4', description: 'Capitoli conclusivi', status: 'not_started' }, { id: 'TL-161-5', phase: 'Fase 5', description: 'Revisione e apparato critico', status: 'not_started' }] },
  { id: 'SS-163', pipeline_id: 'PIP-029', student_id: 'STU-467', student_name: 'Alessandro Brun', service_id: 'SRV-003', service_name: 'Coaching Plus', service_category: 'Coaching', quote_id: 'QT-985', contract_id: 'CT-163', academic_record_id: 'AR-003', status: 'active', created_at: '2026-02-10', created_by: 'Francesca', updated_at: '2026-03-05', updated_by: 'Francesca', start_date: '2026-02-20', is_upgrade_from: 'SS-125', referente: 'Giada', area_tematica: 'Umanistico', plan_start_date: '2026-02-20', plan_end_date: '2026-08-20', needs_timeline: false, coaching_access_enabled: true, contract: { id: 'CT-163', status: 'signed', signedAt: '2026-02-15', documentUrl: '/contratti/CT-163.pdf', expiresAt: '2026-08-20' }, installments: [{ id: 'INS-1120', amount: 600, dueDate: '2026-02-20', status: 'paid', invoice_number: '16/2026', payment: { id: 'PAY-1220', amount: 600, paidAt: '2026-02-18', method: 'Bonifico' } }, { id: 'INS-1121', amount: 600, dueDate: '2026-03-20', status: 'pending' }, { id: 'INS-1122', amount: 600, dueDate: '2026-04-20', status: 'pending' }], coach_fee: 720, coach_name: 'Elena Ferretti', coach_payout: { id: 'CP-163', status: 'pending_invoice' } },
  { id: 'SS-165', pipeline_id: 'PIP-007', student_id: 'STU-520', student_name: 'Marco De Luca', service_id: 'SRV-002', service_name: 'Coaching', service_category: 'Coaching', quote_id: 'QT-988', contract_id: 'CT-165', academic_record_id: 'AR-014', status: 'active', created_at: '2026-02-01', created_by: 'Francesca', updated_at: '2026-03-05', updated_by: 'Claudia', start_date: '2026-02-15', is_upgrade_from: 'SS-114', referente: 'Claudia', area_tematica: 'Ingegneria', plan_start_date: '2026-02-15', plan_end_date: '2026-08-15', needs_timeline: true, coaching_access_enabled: true, invite_email: 'marco.deluca@email.com', invite_sent_at: '2026-02-17T09:45:00', invite_status: 'sent', contract: { id: 'CT-165', status: 'signed', signedAt: '2026-02-10', documentUrl: '/contratti/CT-165.pdf', expiresAt: '2026-08-15' }, installments: [{ id: 'INS-1130', amount: 400, dueDate: '2026-02-15', status: 'paid', invoice_number: '17/2026', payment: { id: 'PAY-1230', amount: 400, paidAt: '2026-02-13', method: 'Carta di credito' } }, { id: 'INS-1131', amount: 400, dueDate: '2026-03-15', status: 'pending' }, { id: 'INS-1132', amount: 400, dueDate: '2026-04-15', status: 'pending' }], coach_fee: 480, coach_name: 'Andrea Conti', coach_payout: { id: 'CP-165', status: 'pending_invoice' }, coaching_timeline: [{ id: 'TL-165-1', phase: 'Fase 1', description: 'Architettura microservizi', status: 'completed', startedAt: '2026-02-15', completedAt: '2026-03-01' }, { id: 'TL-165-2', phase: 'Fase 2', description: 'Implementazione backend', status: 'in_progress', startedAt: '2026-03-02' }, { id: 'TL-165-3', phase: 'Fase 3', description: 'Stesura e testing', status: 'not_started' }, { id: 'TL-165-4', phase: 'Fase 4', description: 'Revisione finale', status: 'not_started' }] },
  { id: 'SS-167', pipeline_id: 'PIP-031', student_id: 'STU-596', student_name: 'Simone Caruso', service_id: 'SRV-001', service_name: 'Starter Pack', service_category: 'Starter Pack', quote_id: 'QT-992', status: 'active', created_at: '2026-03-05', created_by: 'Claudia', updated_at: '2026-03-05', updated_by: 'Claudia', referente: 'Giada', plan_start_date: '2026-03-15', plan_end_date: '2026-04-15', contract: { id: 'CT-167', status: 'draft', documentUrl: '/contratti/CT-167.pdf' }, installments: [{ id: 'INS-1140', amount: 99, dueDate: '2026-03-15', status: 'paid', invoice_number: '28/2026', payment: { id: 'PAY-1140', amount: 99, paidAt: '2026-03-13', method: 'Carta di credito' } }] },
];

const hydratedInitialData = initialData.map(hydrateServiceWithLegacySharedData);

// ─── Context ────────────────────────────────────────────────
interface LavorazioniContextType {
  data: StudentService[];
  students: Student[];
  pipelines: Pipeline[];
  sources: string[];
  communicationChannels: string[];
  getServiceTimelineSteps: (serviceId: string) => SharedTimelineStep[];
  getServiceArchiveDocuments: (serviceId: string) => SharedArchiveDocument[];
  getServiceAdminNotes: (serviceId: string) => SharedAdminNote[];
  getServiceStepOptions: (serviceId: string) => SharedStepOption[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updater: (s: Student) => Student) => void;
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updater: (p: Pipeline) => Pipeline) => void;
  removePipeline: (id: string) => void;
  addCommunicationChannel: (channel: string) => void;
  removeCommunicationChannel: (channel: string) => void;
  taxPercent: number;
  setTaxPercent: (v: number) => void;
  updateService: (id: string, updater: (s: StudentService) => StudentService) => void;
  addService: (service: StudentService) => void;
  removeService: (id: string) => void;
}

const noop = () => {};

const DEFAULT_CONTEXT: LavorazioniContextType = {
  data: hydratedInitialData,
  students: INITIAL_STUDENTS,
  pipelines: INITIAL_PIPELINES,
  sources: AVAILABLE_SOURCES,
  communicationChannels: COMMUNICATION_CHANNELS,
  getServiceTimelineSteps: () => [],
  getServiceArchiveDocuments: () => [],
  getServiceAdminNotes: () => [],
  getServiceStepOptions: () => [],
  addStudent: noop,
  updateStudent: noop,
  addPipeline: noop,
  updatePipeline: noop,
  removePipeline: noop,
  addCommunicationChannel: noop,
  removeCommunicationChannel: noop,
  taxPercent: 22,
  setTaxPercent: noop,
  updateService: noop,
  addService: noop,
  removeService: noop,
};

// HMR-safe context: reuse existing context across hot reloads while preserving typings
type LavorazioniGlobal = typeof globalThis & {
  __LavorazioniContext?: React.Context<LavorazioniContextType>;
};

const globalWithLavorazioni = globalThis as LavorazioniGlobal;
const LavorazioniContext: React.Context<LavorazioniContextType> =
  globalWithLavorazioni.__LavorazioniContext ?? createContext<LavorazioniContextType>(DEFAULT_CONTEXT);
globalWithLavorazioni.__LavorazioniContext = LavorazioniContext;

export function LavorazioniProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StudentService[]>(hydratedInitialData);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);
  const [sources, setSources] = useState<string[]>(AVAILABLE_SOURCES);
  const [communicationChannels, setCommunicationChannels] = useState<string[]>(COMMUNICATION_CHANNELS);
  const [taxPercent, setTaxPercent] = useState(22);

  useEffect(() => {
    setData(prev => {
      const next = prev.map(hydrateServiceWithLegacySharedData);
      const changed = next.some((service, index) => service !== prev[index]);
      return changed ? next : prev;
    });
  }, []);

  const getServiceTimelineSteps = useCallback((serviceId: string) => {
    const service = data.find(item => item.id === serviceId);
    return getSharedTimelineStepsFromService(service);
  }, [data]);

  const getServiceArchiveDocuments = useCallback((serviceId: string) => {
    const service = data.find(item => item.id === serviceId);
    return getSharedArchiveDocumentsFromService(service);
  }, [data]);

  const getServiceAdminNotes = useCallback((serviceId: string) => {
    const service = data.find(item => item.id === serviceId);
    return getSharedAdminNotesFromService(service);
  }, [data]);

  const getServiceStepOptions = useCallback((serviceId: string) => {
    const service = data.find(item => item.id === serviceId);
    return getSharedStepOptionsFromService(service);
  }, [data]);

  const updateService = useCallback((id: string, updater: (s: StudentService) => StudentService) => {
    setData(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const addService = useCallback((service: StudentService) => {
    setData(prev => [service, ...prev]);
  }, []);

  const addStudent = useCallback((student: Student) => {
    setStudents(prev => [...prev, student]);
  }, []);

  const updateStudent = useCallback((id: string, updater: (s: Student) => Student) => {
    setStudents(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const removeService = useCallback((id: string) => {
    setData(prev => prev.filter(s => s.id !== id));
  }, []);

  const addPipeline = useCallback((pipeline: Pipeline) => {
    setPipelines(prev => [pipeline, ...prev]);
  }, []);

  const updatePipeline = useCallback((id: string, updater: (p: Pipeline) => Pipeline) => {
    setPipelines(prev => prev.map(p => p.id === id ? updater(p) : p));
  }, []);

  const removePipeline = useCallback((id: string) => {
    setPipelines(prev => prev.filter(p => p.id !== id));
  }, []);

  const addSource = useCallback((source: string) => {
    setSources(prev => [...prev, source]);
  }, []);

  const removeSource = useCallback((source: string) => {
    setSources(prev => prev.filter(s => s !== source));
  }, []);

  const addCommunicationChannel = useCallback((channel: string) => {
    setCommunicationChannels(prev => [...prev, channel]);
  }, []);

  const removeCommunicationChannel = useCallback((channel: string) => {
    setCommunicationChannels(prev => prev.filter(c => c !== channel));
  }, []);

  return (
    <LavorazioniContext.Provider value={{ 
      data, 
      students, 
      pipelines, 
      sources, 
      communicationChannels,
      getServiceTimelineSteps,
      getServiceArchiveDocuments,
      getServiceAdminNotes,
      getServiceStepOptions,
      addStudent, 
      updateStudent, 
      addPipeline, 
      updatePipeline, 
      removePipeline, 
      addCommunicationChannel,
      removeCommunicationChannel,
      taxPercent, 
      setTaxPercent, 
      updateService, 
      addService, 
      removeService 
    }}>
      {children}
    </LavorazioniContext.Provider>
  );
}

export function useLavorazioni() {
  return useContext(LavorazioniContext);
}