import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Bell, AlertTriangle, CheckCircle2, UserPlus, UserMinus, X, StickyNote, Trash2, Send, TicketIcon, CreditCard, FileText, MessageSquare, ArrowUpRight, Download } from 'lucide-react';
import { TimelineDrawer } from '../../app/components/TimelineDrawer';
import { StudentDetailDrawer } from '../../app/components/StudentDetailDrawer';
import { StatusBadge } from '../../app/components/StatusBadge';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { NotesDrawer, type Note } from '../../app/components/NotesDrawer';
import { ConfirmDialog } from '../../app/components/ConfirmDialog';
import { BulkActionsBar } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import {
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveMobileFieldLabel,
  ResponsiveTableLayout,
  TableActionCell,
  TableCell,
  TableEmptyState,
  TableHeaderActionCell,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableSelectionCell,
  TableSelectionHeaderCell,
} from '../../app/components/TablePrimitives';
import { useTableResize } from '../../app/hooks/useTableResize';
import { useLavorazioni } from '../../app/data/LavorazioniContext';

// --- Types ---
type StudentStatus = 'pending_payment' | 'active' | 'paused' | 'completed' | 'cancelled' | 'expired';

const STATUS_LABELS: Record<StudentStatus, string> = {
  pending_payment: 'In attesa di pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

const STATUS_DOT_COLORS: Record<StudentStatus, string> = {
  pending_payment: 'var(--chart-3)',
  active: 'var(--primary)',
  paused: 'var(--muted-foreground)',
  completed: 'var(--chart-2)',
  cancelled: 'var(--destructive-foreground)',
  expired: 'var(--muted-foreground)',
};

type ServiceType = 'starter_pack' | 'coaching' | 'coaching_plus' | 'sottocheck';
const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  starter_pack: 'Starter Pack',
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
  sottocheck: 'SottoCheck',
};

type ThesisType = 'sperimentale' | 'compilativa';
const THESIS_TYPE_LABELS: Record<ThesisType, string> = {
  sperimentale: 'Sperimentale',
  compilativa: 'Compilativa',
};

type ClosedReason = 'concluso' | 'upgrade' | 'annullato' | 'abbandono';
const CLOSED_REASON_LABELS: Record<ClosedReason, string> = {
  concluso: 'Concluso',
  upgrade: 'Upgrade',
  annullato: 'Annullato',
  abbandono: 'Abbandono',
};
const CLOSED_REASON_COLORS: Record<ClosedReason, string> = {
  concluso: 'var(--primary)',
  upgrade: 'var(--chart-2)',
  annullato: 'var(--destructive-foreground)',
  abbandono: 'var(--chart-3)',
};

type InstallmentStatus = 'all_paid' | 'pending' | 'overdue';

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
}

export interface CoachingStep {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: string;
  messageCount: number;
}

export interface StudentData {
  id: string;
  studentId: string; // Real student ID from LavorazioniContext
  name: string;
  university?: string;
  degree: string;
  status: StudentStatus;
  serviceType: ServiceType;
  thesisType?: ThesisType;
  planStartDate?: string;
  planEndDate?: string;
  hasTimeline: boolean;
  newActivityCount?: number;
  assignedCoachName?: string;
  // STUDENT_SERVICE extended fields
  contractStatus?: 'pending' | 'signed';
  installmentStatus?: InstallmentStatus;
  installmentOverdueCount?: number;
  stepsCompleted?: number;
  stepsTotal?: number;
  openTicketCount?: number;
  finalPrice?: number;
  discountAmount?: number;
  closedReason?: ClosedReason;
  closedAt?: string;
  activatedAt?: string;
  serviceNameSnapshot?: string;
  plagiarismPagesLimit?: number;
  plagiarismPagesUsed?: number;
  isUpgradeFrom?: string;
  coachFee?: number;
  contractFileUrl?: string;
  // Related data for drawer
  installments?: Installment[];
  coachingSteps?: CoachingStep[];
  tickets?: Ticket[];
  // Tracking admin
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  // Cross-navigation to lavorazioni
  lavorazioneId?: string;
  coachingAccessEnabled?: boolean; // Propagated from StudentService.coaching_access_enabled
  /** Email usata per l'invito di accesso alla piattaforma */
  inviteEmail?: string;
  /** Stato invito: not_sent / sent / active */
  inviteStatus?: 'not_sent' | 'sent' | 'active';
  /** ISO timestamp invio invito */
  inviteSentAt?: string;
}

// --- Admin Notes ---
// Note: using 'content' instead of 'text' to match NotesDrawer interface
export interface AdminNote {
  id: string;
  studentId: string;
  content: string;
  admin: string;
  timestamp: string;
}

const initialMockNotes: AdminNote[] = [
  { id: 'N-001', studentId: 'STU-001', content: 'Verificare pagamento seconda rata, scadenza prossima settimana.', admin: 'Francesca', timestamp: '3 mar 2026 09:15' },
  { id: 'N-002', studentId: 'STU-001', content: 'Coach ha segnalato ritardo nella consegna del capitolo 2.', admin: 'Claudia', timestamp: '28 feb 2026 14:30' },
  { id: 'N-003', studentId: 'STU-003', content: 'Studente ha richiesto cambio relatore. Da verificare con segreteria.', admin: 'Francesca', timestamp: '1 mar 2026 11:00' },
  { id: 'N-004', studentId: 'STU-004', content: 'Pausa richiesta per motivi personali. Ripresa prevista aprile 2026.', admin: 'Claudia', timestamp: '20 feb 2026 16:45' },
];

// --- Mock Data ---
const mockStudents: StudentData[] = [
  {
    id: 'STU-001',
    name: 'Alex Johnson',
    university: 'UniMI',
    degree: 'Letteratura Comparata',
    status: 'active',
    serviceType: 'coaching_plus',
    thesisType: 'compilativa',
    planStartDate: '5 gen 2026',
    planEndDate: '5 apr 2026',
    hasTimeline: true,
    newActivityCount: 3,
    assignedCoachName: 'Marco Rossi',
    contractStatus: 'signed',
    installmentStatus: 'pending',
    installmentOverdueCount: 0,
    stepsCompleted: 4,
    stepsTotal: 7,
    openTicketCount: 1,
    finalPrice: 1200,
    discountAmount: 100,
    activatedAt: '5 gen 2026',
    serviceNameSnapshot: 'Coaching Plus - Tesi Compilativa',
    coachFee: 480,
    contractFileUrl: '/contracts/STU-001.pdf',
    lavorazioneId: 'SS-155',
    inviteStatus: 'active',
    inviteEmail: 'alex.johnson@email.com',
    inviteSentAt: '2026-01-05T09:00:00Z',
    installments: [
      { id: 'INS-001', amount: 400, dueDate: '5 gen 2026', status: 'paid', paidAt: '4 gen 2026' },
      { id: 'INS-002', amount: 400, dueDate: '5 feb 2026', status: 'paid', paidAt: '5 feb 2026' },
      { id: 'INS-003', amount: 400, dueDate: '5 mar 2026', status: 'pending' },
    ],
    coachingSteps: [
      { id: 'CS-001', title: 'Analisi tema e struttura', status: 'completed', completedAt: '12 gen 2026' },
      { id: 'CS-002', title: 'Ricerca bibliografica', status: 'completed', completedAt: '25 gen 2026' },
      { id: 'CS-003', title: 'Capitolo 1 - Introduzione', status: 'completed', completedAt: '10 feb 2026' },
      { id: 'CS-004', title: 'Capitolo 2 - Revisione letteratura', status: 'completed', completedAt: '28 feb 2026' },
      { id: 'CS-005', title: 'Capitolo 3 - Analisi comparata', status: 'in_progress' },
      { id: 'CS-006', title: 'Capitolo 4 - Conclusioni', status: 'pending' },
      { id: 'CS-007', title: 'Revisione finale e formattazione', status: 'pending' },
    ],
    tickets: [
      { id: 'TK-001', subject: 'Richiesta proroga scadenza cap. 3', status: 'open', createdAt: '1 mar 2026', messageCount: 3 },
    ],
  },
  {
    id: 'STU-002',
    name: 'Elena Ferrara',
    degree: 'Scienze Politiche',
    status: 'pending_payment',
    serviceType: 'coaching',
    thesisType: 'compilativa',
    hasTimeline: false,
    newActivityCount: 0,
    assignedCoachName: 'Laura Bianchi',
    contractStatus: 'signed',
    installmentStatus: 'pending',
    installmentOverdueCount: 0,
    stepsCompleted: 0,
    stepsTotal: 5,
    openTicketCount: 0,
    finalPrice: 800,
    serviceNameSnapshot: 'Coaching - Tesi Compilativa',
    coachFee: 320,
    contractFileUrl: '/contracts/STU-002.pdf',
    lavorazioneId: 'SS-138',
    inviteStatus: 'sent',
    inviteEmail: 'elena.ferrara@email.com',
    inviteSentAt: '2026-02-28T14:00:00Z',
    installments: [
      { id: 'INS-004', amount: 400, dueDate: '1 mar 2026', status: 'pending' },
      { id: 'INS-005', amount: 400, dueDate: '1 apr 2026', status: 'pending' },
    ],
    coachingSteps: [],
    tickets: [],
  },
  {
    id: 'STU-003',
    name: 'Giulia Verdi',
    university: 'UniMI',
    degree: 'Magistrale Psicologia',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'sperimentale',
    planStartDate: '10 dic 2025',
    planEndDate: '15 mag 2026',
    hasTimeline: true,
    newActivityCount: 2,
    assignedCoachName: 'Marco Rossi',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    installmentOverdueCount: 0,
    stepsCompleted: 3,
    stepsTotal: 8,
    openTicketCount: 0,
    finalPrice: 950,
    activatedAt: '10 dic 2025',
    serviceNameSnapshot: 'Coaching - Tesi Sperimentale',
    coachFee: 380,
    contractFileUrl: '/contracts/STU-003.pdf',
    lavorazioneId: 'SS-101',
    inviteStatus: 'active',
    inviteEmail: 'giulia.verdi@email.com',
    inviteSentAt: '2025-12-09T10:00:00Z',
    installments: [
      { id: 'INS-006', amount: 475, dueDate: '10 dic 2025', status: 'paid', paidAt: '9 dic 2025' },
      { id: 'INS-007', amount: 475, dueDate: '10 gen 2026', status: 'paid', paidAt: '10 gen 2026' },
    ],
    coachingSteps: [
      { id: 'CS-008', title: 'Definizione ipotesi', status: 'completed', completedAt: '18 dic 2025' },
      { id: 'CS-009', title: 'Disegno sperimentale', status: 'completed', completedAt: '8 gen 2026' },
      { id: 'CS-010', title: 'Raccolta dati', status: 'completed', completedAt: '15 feb 2026' },
      { id: 'CS-011', title: 'Analisi statistica', status: 'in_progress' },
      { id: 'CS-012', title: 'Cap. Risultati', status: 'pending' },
      { id: 'CS-013', title: 'Cap. Discussione', status: 'pending' },
      { id: 'CS-014', title: 'Cap. Conclusioni', status: 'pending' },
      { id: 'CS-015', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-004',
    name: 'Luca Neri',
    university: 'Sapienza',
    degree: 'Ingegneria Informatica',
    status: 'paused',
    serviceType: 'starter_pack',
    thesisType: 'sperimentale',
    planStartDate: '15 nov 2025',
    planEndDate: '30 apr 2026',
    hasTimeline: true,
    newActivityCount: 0,
    assignedCoachName: 'Andrea Romano',
    contractStatus: 'signed',
    installmentStatus: 'overdue',
    installmentOverdueCount: 1,
    stepsCompleted: 2,
    stepsTotal: 5,
    openTicketCount: 0,
    finalPrice: 500,
    activatedAt: '15 nov 2025',
    serviceNameSnapshot: 'Starter Pack - Tesi Sperimentale',
    coachFee: 200,
    contractFileUrl: '/contracts/STU-004.pdf',
    lavorazioneId: 'SS-117',
    installments: [
      { id: 'INS-008', amount: 250, dueDate: '15 nov 2025', status: 'paid', paidAt: '14 nov 2025' },
      { id: 'INS-009', amount: 250, dueDate: '15 feb 2026', status: 'overdue' },
    ],
    coachingSteps: [
      { id: 'CS-016', title: 'Analisi requisiti', status: 'completed', completedAt: '25 nov 2025' },
      { id: 'CS-017', title: 'Struttura tesi', status: 'completed', completedAt: '10 dic 2025' },
      { id: 'CS-018', title: 'Implementazione', status: 'in_progress' },
      { id: 'CS-019', title: 'Testing', status: 'pending' },
      { id: 'CS-020', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-005',
    name: 'Sara Martini',
    degree: 'Ingegneria Gestionale',
    status: 'active',
    serviceType: 'starter_pack',
    thesisType: 'sperimentale',
    planStartDate: '20 gen 2026',
    planEndDate: '20 giu 2026',
    hasTimeline: true,
    newActivityCount: 1,
    assignedCoachName: undefined,
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    installmentOverdueCount: 0,
    stepsCompleted: 1,
    stepsTotal: 5,
    openTicketCount: 2,
    finalPrice: 500,
    activatedAt: '20 gen 2026',
    serviceNameSnapshot: 'Starter Pack - Tesi Sperimentale',
    contractFileUrl: '/contracts/STU-005.pdf',
    lavorazioneId: 'SS-088',
    installments: [
      { id: 'INS-010', amount: 500, dueDate: '20 gen 2026', status: 'paid', paidAt: '19 gen 2026' },
    ],
    coachingSteps: [
      { id: 'CS-021', title: 'Analisi tema', status: 'completed', completedAt: '28 gen 2026' },
      { id: 'CS-022', title: 'Ricerca bibliografica', status: 'in_progress' },
      { id: 'CS-023', title: 'Capitolo 1', status: 'pending' },
      { id: 'CS-024', title: 'Capitolo 2', status: 'pending' },
      { id: 'CS-025', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [
      { id: 'TK-002', subject: 'Assegnazione coach mancante', status: 'open', createdAt: '25 gen 2026', messageCount: 5 },
      { id: 'TK-003', subject: 'Problema accesso piattaforma', status: 'open', createdAt: '2 feb 2026', messageCount: 2 },
    ],
  },
  {
    id: 'STU-006',
    name: 'Paolo Russo',
    university: 'Politecnico MI',
    degree: 'Architettura',
    status: 'completed',
    serviceType: 'coaching_plus',
    thesisType: 'sperimentale',
    planStartDate: '1 set 2025',
    planEndDate: '15 dic 2025',
    hasTimeline: true,
    newActivityCount: 0,
    assignedCoachName: 'Laura Bianchi',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    stepsCompleted: 7,
    stepsTotal: 7,
    openTicketCount: 0,
    finalPrice: 1400,
    discountAmount: 200,
    activatedAt: '1 set 2025',
    closedReason: 'concluso',
    closedAt: '10 dic 2025',
    serviceNameSnapshot: 'Coaching Plus - Tesi Sperimentale',
    coachFee: 560,
    contractFileUrl: '/contracts/STU-006.pdf',
    lavorazioneId: 'SS-132',
    installments: [
      { id: 'INS-011', amount: 700, dueDate: '1 set 2025', status: 'paid', paidAt: '31 ago 2025' },
      { id: 'INS-012', amount: 700, dueDate: '1 nov 2025', status: 'paid', paidAt: '1 nov 2025' },
    ],
    coachingSteps: [
      { id: 'CS-026', title: 'Analisi progetto', status: 'completed', completedAt: '8 set 2025' },
      { id: 'CS-027', title: 'Ricerca', status: 'completed', completedAt: '25 set 2025' },
      { id: 'CS-028', title: 'Progettazione', status: 'completed', completedAt: '15 ott 2025' },
      { id: 'CS-029', title: 'Sviluppo tavole', status: 'completed', completedAt: '1 nov 2025' },
      { id: 'CS-030', title: 'Capitolo teorico', status: 'completed', completedAt: '15 nov 2025' },
      { id: 'CS-031', title: 'Capitolo progettuale', status: 'completed', completedAt: '28 nov 2025' },
      { id: 'CS-032', title: 'Revisione finale', status: 'completed', completedAt: '8 dic 2025' },
    ],
    tickets: [],
  },
  {
    id: 'STU-007',
    name: 'Marco Bianchi',
    university: 'UniBo',
    degree: 'Economia',
    status: 'cancelled',
    serviceType: 'coaching',
    thesisType: 'compilativa',
    planStartDate: '1 ott 2025',
    planEndDate: '1 mar 2026',
    hasTimeline: false,
    newActivityCount: 0,
    assignedCoachName: 'Marco Rossi',
    contractStatus: 'signed',
    installmentStatus: 'overdue',
    installmentOverdueCount: 2,
    stepsCompleted: 1,
    stepsTotal: 6,
    openTicketCount: 0,
    finalPrice: 800,
    activatedAt: '1 ott 2025',
    closedReason: 'abbandono',
    closedAt: '15 gen 2026',
    serviceNameSnapshot: 'Coaching - Tesi Compilativa',
    coachFee: 320,
    contractFileUrl: '/contracts/STU-007.pdf',
    lavorazioneId: 'SS-150',
    installments: [
      { id: 'INS-013', amount: 400, dueDate: '1 ott 2025', status: 'paid', paidAt: '1 ott 2025' },
      { id: 'INS-014', amount: 400, dueDate: '1 dic 2025', status: 'overdue' },
    ],
    coachingSteps: [
      { id: 'CS-033', title: 'Analisi tema', status: 'completed', completedAt: '10 ott 2025' },
      { id: 'CS-034', title: 'Ricerca bibliografica', status: 'pending' },
      { id: 'CS-035', title: 'Capitolo 1', status: 'pending' },
      { id: 'CS-036', title: 'Capitolo 2', status: 'pending' },
      { id: 'CS-037', title: 'Capitolo 3', status: 'pending' },
      { id: 'CS-038', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [
      { id: 'TK-004', subject: 'Richiesta annullamento', status: 'closed', createdAt: '10 gen 2026', messageCount: 4 },
    ],
  },
  // ─── Students linked to LavorazioniContext services ──────────
  {
    id: 'STU-008',
    name: 'Elena Mancini',
    university: 'UniPI',
    degree: 'Biotecnologie Mediche',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'sperimentale',
    planStartDate: '15 ago 2025',
    planEndDate: '15 feb 2026',
    hasTimeline: true,
    newActivityCount: 1,
    assignedCoachName: 'Lucia Marchetti',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    stepsCompleted: 5,
    stepsTotal: 6,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '15 ago 2025',
    serviceNameSnapshot: 'Coaching - Tesi Sperimentale',
    coachFee: 480,
    lavorazioneId: 'SS-135',
    installments: [
      { id: 'INS-020', amount: 400, dueDate: '15 ago 2025', status: 'paid', paidAt: '13 ago 2025' },
      { id: 'INS-021', amount: 400, dueDate: '15 set 2025', status: 'paid', paidAt: '12 set 2025' },
      { id: 'INS-022', amount: 400, dueDate: '15 ott 2025', status: 'paid', paidAt: '14 ott 2025' },
    ],
    coachingSteps: [
      { id: 'CS-050', title: 'Definizione ipotesi sperimentale', status: 'completed', completedAt: '1 set 2025' },
      { id: 'CS-051', title: 'Disegno sperimentale', status: 'completed', completedAt: '28 set 2025' },
      { id: 'CS-052', title: 'Raccolta dati laboratorio', status: 'completed', completedAt: '30 ott 2025' },
      { id: 'CS-053', title: 'Analisi statistica', status: 'completed', completedAt: '20 nov 2025' },
      { id: 'CS-054', title: 'Stesura risultati e discussione', status: 'completed', completedAt: '15 dic 2025' },
      { id: 'CS-055', title: 'Revisione finale', status: 'in_progress' },
    ],
    tickets: [],
  },
  {
    id: 'STU-009',
    name: 'Lorenzo Galli',
    university: 'UniGE',
    degree: 'Medicina e Chirurgia',
    status: 'active',
    serviceType: 'coaching_plus',
    thesisType: 'sperimentale',
    planStartDate: '1 ott 2025',
    planEndDate: '1 apr 2026',
    hasTimeline: true,
    newActivityCount: 2,
    assignedCoachName: 'Marco Bianchi',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    stepsCompleted: 3,
    stepsTotal: 6,
    openTicketCount: 0,
    finalPrice: 1800,
    activatedAt: '1 ott 2025',
    serviceNameSnapshot: 'Coaching Plus - Tesi Sperimentale',
    coachFee: 720,
    lavorazioneId: 'SS-138',
    installments: [
      { id: 'INS-025', amount: 600, dueDate: '1 ott 2025', status: 'paid', paidAt: '28 set 2025' },
      { id: 'INS-026', amount: 600, dueDate: '1 nov 2025', status: 'paid', paidAt: '30 ott 2025' },
      { id: 'INS-027', amount: 600, dueDate: '1 dic 2025', status: 'paid', paidAt: '28 nov 2025' },
    ],
    coachingSteps: [
      { id: 'CS-060', title: 'Revisione letteratura medica', status: 'completed', completedAt: '20 ott 2025' },
      { id: 'CS-061', title: 'Protocollo sperimentale', status: 'completed', completedAt: '15 nov 2025' },
      { id: 'CS-062', title: 'Raccolta dati clinici', status: 'completed', completedAt: '10 gen 2026' },
      { id: 'CS-063', title: 'Analisi dati e risultati', status: 'in_progress' },
      { id: 'CS-064', title: 'Stesura discussione', status: 'pending' },
      { id: 'CS-065', title: 'Revisione finale e abstract', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-010',
    name: 'Valentina Costa',
    university: 'Bocconi',
    degree: 'Marketing e Comunicazione',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'sperimentale',
    planStartDate: '20 dic 2025',
    planEndDate: '20 giu 2026',
    hasTimeline: true,
    newActivityCount: 0,
    assignedCoachName: 'Andrea Conti',
    contractStatus: 'signed',
    installmentStatus: 'overdue',
    installmentOverdueCount: 1,
    stepsCompleted: 2,
    stepsTotal: 5,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '20 dic 2025',
    serviceNameSnapshot: 'Coaching - Tesi Sperimentale',
    coachFee: 480,
    lavorazioneId: 'SS-141',
    installments: [
      { id: 'INS-030', amount: 400, dueDate: '20 dic 2025', status: 'paid', paidAt: '18 dic 2025' },
      { id: 'INS-031', amount: 400, dueDate: '20 gen 2026', status: 'paid', paidAt: '18 gen 2026' },
      { id: 'INS-032', amount: 400, dueDate: '20 feb 2026', status: 'overdue' },
    ],
    coachingSteps: [
      { id: 'CS-070', title: 'Analisi settore luxury', status: 'completed', completedAt: '10 gen 2026' },
      { id: 'CS-071', title: 'Framework teorico', status: 'completed', completedAt: '5 feb 2026' },
      { id: 'CS-072', title: 'Indagine empirica', status: 'in_progress' },
      { id: 'CS-073', title: 'Stesura capitoli', status: 'pending' },
      { id: 'CS-074', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-011',
    name: 'Andrea Pellegrini',
    university: 'UniTO',
    degree: 'Scienze Ambientali',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'compilativa',
    planStartDate: '1 dic 2025',
    planEndDate: '1 giu 2026',
    hasTimeline: true,
    newActivityCount: 1,
    assignedCoachName: 'Elena Ferretti',
    contractStatus: 'signed',
    installmentStatus: 'pending',
    stepsCompleted: 2,
    stepsTotal: 4,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '1 dic 2025',
    serviceNameSnapshot: 'Coaching - Tesi Compilativa',
    coachFee: 480,
    lavorazioneId: 'SS-145',
    installments: [
      { id: 'INS-035', amount: 400, dueDate: '1 dic 2025', status: 'paid', paidAt: '29 nov 2025' },
      { id: 'INS-036', amount: 400, dueDate: '1 gen 2026', status: 'paid', paidAt: '30 dic 2025' },
      { id: 'INS-037', amount: 400, dueDate: '1 feb 2026', status: 'pending' },
    ],
    coachingSteps: [
      { id: 'CS-080', title: 'Rassegna letteratura', status: 'completed', completedAt: '20 dic 2025' },
      { id: 'CS-081', title: 'Stesura introduzione e cap. 1', status: 'completed', completedAt: '25 gen 2026' },
      { id: 'CS-082', title: 'Capitoli centrali', status: 'in_progress' },
      { id: 'CS-083', title: 'Conclusioni e revisione', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-012',
    name: 'Sofia Ricci',
    university: 'Politecnico MI',
    degree: 'Design della Comunicazione',
    status: 'active',
    serviceType: 'coaching_plus',
    thesisType: 'sperimentale',
    planStartDate: '5 ott 2025',
    planEndDate: '5 apr 2026',
    hasTimeline: true,
    newActivityCount: 3,
    assignedCoachName: 'Andrea Conti',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    stepsCompleted: 4,
    stepsTotal: 6,
    openTicketCount: 1,
    finalPrice: 1800,
    activatedAt: '5 ott 2025',
    serviceNameSnapshot: 'Coaching Plus - Tesi Sperimentale',
    coachFee: 720,
    lavorazioneId: 'SS-153',
    installments: [
      { id: 'INS-040', amount: 600, dueDate: '5 ott 2025', status: 'paid', paidAt: '3 ott 2025' },
      { id: 'INS-041', amount: 600, dueDate: '5 nov 2025', status: 'paid', paidAt: '4 nov 2025' },
      { id: 'INS-042', amount: 600, dueDate: '5 dic 2025', status: 'paid', paidAt: '3 dic 2025' },
    ],
    coachingSteps: [
      { id: 'CS-090', title: 'Analisi UX stato dell\'arte', status: 'completed', completedAt: '20 ott 2025' },
      { id: 'CS-091', title: 'User research e personas', status: 'completed', completedAt: '10 nov 2025' },
      { id: 'CS-092', title: 'Prototipazione e test', status: 'completed', completedAt: '5 dic 2025' },
      { id: 'CS-093', title: 'Iterazione design', status: 'completed', completedAt: '20 gen 2026' },
      { id: 'CS-094', title: 'Stesura risultati', status: 'in_progress' },
      { id: 'CS-095', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [
      { id: 'TK-005', subject: 'Richiesta feedback prototipo', status: 'open', createdAt: '1 mar 2026', messageCount: 2 },
    ],
  },
  {
    id: 'STU-013',
    name: 'Matteo Fontana',
    university: 'UniTN',
    degree: 'Ingegneria Informatica',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'sperimentale',
    planStartDate: '20 gen 2026',
    planEndDate: '20 lug 2026',
    hasTimeline: true,
    newActivityCount: 0,
    assignedCoachName: 'Marco Bianchi',
    contractStatus: 'signed',
    installmentStatus: 'pending',
    stepsCompleted: 1,
    stepsTotal: 5,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '20 gen 2026',
    serviceNameSnapshot: 'Coaching - Tesi Sperimentale',
    coachFee: 480,
    lavorazioneId: 'SS-155',
    installments: [
      { id: 'INS-045', amount: 400, dueDate: '20 gen 2026', status: 'paid', paidAt: '18 gen 2026' },
      { id: 'INS-046', amount: 400, dueDate: '20 feb 2026', status: 'pending' },
      { id: 'INS-047', amount: 400, dueDate: '20 mar 2026', status: 'pending' },
    ],
    coachingSteps: [
      { id: 'CS-100', title: 'Definizione scope e architettura', status: 'completed', completedAt: '5 feb 2026' },
      { id: 'CS-101', title: 'Implementazione core', status: 'in_progress' },
      { id: 'CS-102', title: 'Testing e validazione', status: 'pending' },
      { id: 'CS-103', title: 'Stesura capitoli tecnici', status: 'pending' },
      { id: 'CS-104', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-014',
    name: 'Anna Greco',
    university: 'UniVR',
    degree: 'Scienze Infermieristiche',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'compilativa',
    planStartDate: '15 ott 2025',
    planEndDate: '15 apr 2026',
    hasTimeline: true,
    newActivityCount: 1,
    assignedCoachName: 'Lucia Marchetti',
    contractStatus: 'signed',
    installmentStatus: 'all_paid',
    stepsCompleted: 3,
    stepsTotal: 4,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '15 ott 2025',
    serviceNameSnapshot: 'Coaching - Tesi Compilativa',
    coachFee: 480,
    lavorazioneId: 'SS-159',
    installments: [
      { id: 'INS-050', amount: 400, dueDate: '15 ott 2025', status: 'paid', paidAt: '13 ott 2025' },
      { id: 'INS-051', amount: 400, dueDate: '15 nov 2025', status: 'paid', paidAt: '13 nov 2025' },
      { id: 'INS-052', amount: 400, dueDate: '15 dic 2025', status: 'paid', paidAt: '12 dic 2025' },
    ],
    coachingSteps: [
      { id: 'CS-110', title: 'Review letteratura infermieristica', status: 'completed', completedAt: '5 nov 2025' },
      { id: 'CS-111', title: 'Stesura protocolli', status: 'completed', completedAt: '10 dic 2025' },
      { id: 'CS-112', title: 'Capitoli e discussione', status: 'completed', completedAt: '15 feb 2026' },
      { id: 'CS-113', title: 'Revisione finale', status: 'in_progress' },
    ],
    tickets: [],
  },
  {
    id: 'STU-015',
    name: 'Federico Rinaldi',
    university: 'UniPV',
    degree: 'Filosofia',
    status: 'active',
    serviceType: 'coaching_plus',
    thesisType: 'compilativa',
    planStartDate: '5 dic 2025',
    planEndDate: '5 giu 2026',
    hasTimeline: true,
    newActivityCount: 2,
    assignedCoachName: 'Martina Rossi',
    contractStatus: 'signed',
    installmentStatus: 'overdue',
    installmentOverdueCount: 1,
    stepsCompleted: 2,
    stepsTotal: 5,
    openTicketCount: 0,
    finalPrice: 1800,
    activatedAt: '5 dic 2025',
    serviceNameSnapshot: 'Coaching Plus - Tesi Compilativa',
    coachFee: 720,
    lavorazioneId: 'SS-161',
    installments: [
      { id: 'INS-055', amount: 600, dueDate: '5 dic 2025', status: 'paid', paidAt: '3 dic 2025' },
      { id: 'INS-056', amount: 600, dueDate: '5 gen 2026', status: 'paid', paidAt: '3 gen 2026' },
      { id: 'INS-057', amount: 600, dueDate: '5 feb 2026', status: 'overdue' },
    ],
    coachingSteps: [
      { id: 'CS-120', title: 'Framework filosofico', status: 'completed', completedAt: '20 dic 2025' },
      { id: 'CS-121', title: 'Analisi testuale', status: 'completed', completedAt: '25 gen 2026' },
      { id: 'CS-122', title: 'Sviluppo argomentazione', status: 'in_progress' },
      { id: 'CS-123', title: 'Capitoli conclusivi', status: 'pending' },
      { id: 'CS-124', title: 'Revisione e apparato critico', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-016',
    name: 'Martina Colombo',
    university: 'UniMI',
    degree: 'Economia e Finanza',
    status: 'pending_payment',
    serviceType: 'coaching_plus',
    thesisType: 'sperimentale',
    planStartDate: '15 feb 2026',
    planEndDate: '15 ago 2026',
    hasTimeline: false,
    newActivityCount: 0,
    assignedCoachName: 'Lucia Marchetti',
    contractStatus: 'pending',
    installmentStatus: 'pending',
    stepsCompleted: 0,
    stepsTotal: 6,
    openTicketCount: 0,
    finalPrice: 1800,
    serviceNameSnapshot: 'Coaching Plus - Tesi Sperimentale',
    coachFee: 720,
    lavorazioneId: 'SS-148',
    installments: [
      { id: 'INS-060', amount: 600, dueDate: '1 feb 2026', status: 'pending' },
      { id: 'INS-061', amount: 600, dueDate: '1 mar 2026', status: 'pending' },
      { id: 'INS-062', amount: 600, dueDate: '1 apr 2026', status: 'pending' },
    ],
    coachingSteps: [],
    tickets: [],
  },
  {
    id: 'STU-017',
    name: 'Marco De Luca',
    university: 'UniRM',
    degree: 'Informatica',
    status: 'active',
    serviceType: 'coaching',
    thesisType: 'sperimentale',
    planStartDate: '15 feb 2026',
    planEndDate: '15 ago 2026',
    hasTimeline: true,
    newActivityCount: 1,
    assignedCoachName: 'Andrea Conti',
    contractStatus: 'signed',
    installmentStatus: 'pending',
    stepsCompleted: 1,
    stepsTotal: 4,
    openTicketCount: 0,
    finalPrice: 1200,
    activatedAt: '15 feb 2026',
    serviceNameSnapshot: 'Coaching - Tesi Sperimentale',
    coachFee: 480,
    lavorazioneId: 'SS-165',
    installments: [
      { id: 'INS-065', amount: 400, dueDate: '15 feb 2026', status: 'paid', paidAt: '13 feb 2026' },
      { id: 'INS-066', amount: 400, dueDate: '15 mar 2026', status: 'pending' },
      { id: 'INS-067', amount: 400, dueDate: '15 apr 2026', status: 'pending' },
    ],
    coachingSteps: [
      { id: 'CS-130', title: 'Architettura microservizi', status: 'completed', completedAt: '1 mar 2026' },
      { id: 'CS-131', title: 'Implementazione backend', status: 'in_progress' },
      { id: 'CS-132', title: 'Stesura e testing', status: 'pending' },
      { id: 'CS-133', title: 'Revisione finale', status: 'pending' },
    ],
    tickets: [],
  },
  {
    id: 'STU-018',
    name: 'Francesca Moretti',
    university: 'Politecnico MI',
    degree: 'Architettura',
    status: 'active',
    serviceType: 'coaching_plus',
    thesisType: 'sperimentale',
    planStartDate: '20 ott 2025',
    planEndDate: '20 mar 2026',
    hasTimeline: true,
    newActivityCount: 0,
    assignedCoachName: 'Elena Ferretti',
    contractStatus: 'signed',
    installmentStatus: 'overdue',
    installmentOverdueCount: 1,
    stepsCompleted: 3,
    stepsTotal: 4,
    openTicketCount: 0,
    finalPrice: 1800,
    activatedAt: '20 ott 2025',
    serviceNameSnapshot: 'Coaching Plus - Tesi Sperimentale',
    coachFee: 720,
    lavorazioneId: 'SS-110',
    installments: [
      { id: 'INS-070', amount: 600, dueDate: '20 ott 2025', status: 'paid', paidAt: '18 ott 2025' },
      { id: 'INS-071', amount: 600, dueDate: '20 nov 2025', status: 'paid', paidAt: '19 nov 2025' },
      { id: 'INS-072', amount: 600, dueDate: '20 dic 2025', status: 'overdue' },
    ],
    coachingSteps: [
      { id: 'CS-140', title: 'Definizione struttura progetto', status: 'completed', completedAt: '10 nov 2025' },
      { id: 'CS-141', title: 'Stesura primi capitoli', status: 'completed', completedAt: '5 dic 2025' },
      { id: 'CS-142', title: 'Analisi dati e risultati', status: 'completed', completedAt: '20 gen 2026' },
      { id: 'CS-143', title: 'Revisione e bibliografia', status: 'in_progress' },
    ],
    tickets: [],
  },
];

const ACTIVE_STATUSES: StudentStatus[] = ['active'];
const ACTIVATION_STATUSES: StudentStatus[] = ['pending_payment', 'paused'];
const PAST_STATUSES: StudentStatus[] = ['completed', 'cancelled', 'expired'];

type TabKey = 'active' | 'activation' | 'past' | 'calendar';
type SortKey = 'name' | 'coach' | 'degree' | 'thesisType' | 'serviceType' | 'status' | 'planStart' | 'planEnd' | 'progress' | 'closedReason';

const COACHES = ['Martina Rossi', 'Marco Bianchi', 'Andrea Conti', 'Elena Ferretti', 'Lucia Marchetti', 'Marco Rossi', 'Laura Bianchi', 'Andrea Romano'];

const CURRENT_ADMIN = 'Francesca';

export function TimelinePage() {
  const { data: services, students: realStudents } = useLavorazioni();

  // Map StudentService to StudentData for services that need timeline
  const students = useMemo(() => {
    if (!services || !realStudents) return [];
    
    return services
      .filter(svc => svc.needs_timeline === true) // Only timeline services
      .map(svc => {
        const student = realStudents.find(s => s.id === svc.student_id);
        const academicRecord = student?.academic_records?.find(r => r.id === svc.academic_record_id)
          || student?.academic_records?.find(r => r.is_current)
          || student?.academic_records?.[0];

        // Map service category to ServiceType
        const serviceTypeMap: Record<string, ServiceType> = {
          'Starter Pack': 'starter_pack',
          'Coaching': 'coaching',
          'Coaching Plus': 'coaching_plus',
          'Check plagio/AI': 'sottocheck',
        };
        const serviceType = serviceTypeMap[svc.service_category] || 'coaching';

        // Determine installment status
        const hasOverdue = (svc.installments || []).some(i => i.status === 'overdue');
        const hasPending = (svc.installments || []).some(i => i.status === 'pending');
        const installmentStatus: InstallmentStatus = hasOverdue ? 'overdue' : hasPending ? 'pending' : 'all_paid';
        
        // Mock coaching steps (timeline data — will be real when implemented)
        const coachingSteps: CoachingStep[] = svc.coaching_timeline?.map(phase => ({
          id: phase.id || `CS-${svc.id}-${phase.phase}`,
          title: phase.description || phase.phase,
          status: phase.status === 'completed' ? 'completed' : phase.status === 'in_progress' ? 'in_progress' : 'pending',
          completedAt: phase.completedAt,
        })) || [];

        const stepsCompleted = coachingSteps.filter(s => s.status === 'completed').length;
        const stepsTotal = coachingSteps.length;

        const result: StudentData = {
          id: svc.id,
          studentId: student?.id || svc.student_id,
          name: svc.student_name,
          university: academicRecord?.university_name,
          degree: academicRecord?.course_name || 'Non specificato',
          status: svc.status as StudentStatus,
          serviceType,
          thesisType: academicRecord?.thesis_type as ThesisType | undefined,
          planStartDate: svc.plan_start_date || svc.start_date,
          planEndDate: svc.plan_end_date || svc.end_date,
          hasTimeline: svc.needs_timeline !== false,
          assignedCoachName: svc.coach_name,
          contractStatus: svc.contract?.status === 'signed' ? 'signed' : 'pending',
          installmentStatus,
          installmentOverdueCount: (svc.installments || []).filter(i => i.status === 'overdue').length,
          stepsCompleted,
          stepsTotal,
          openTicketCount: 0, // Placeholder
          finalPrice: (svc.installments || []).reduce((sum, i) => sum + i.amount, 0),
          activatedAt: svc.start_date,
          serviceNameSnapshot: `${svc.service_name}${academicRecord?.thesis_type ? ` - Tesi ${academicRecord.thesis_type === 'sperimentale' ? 'Sperimentale' : 'Compilativa'}` : ''}`,
          coachFee: svc.coach_fee,
          contractFileUrl: svc.contract?.documentUrl,
          installments: (svc.installments || []).map(inst => ({
            id: inst.id,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status,
            paidAt: inst.payment?.paidAt,
          })),
          coachingSteps,
          tickets: [], // Placeholder
          created_by: svc.created_by,
          created_at: svc.created_at,
          updated_by: svc.updated_by,
          updated_at: svc.updated_at,
          lavorazioneId: svc.id,
          closedReason: svc.closed_reason,
          coachingAccessEnabled: svc.coaching_access_enabled,
          inviteEmail: svc.invite_email,
          inviteStatus: svc.invite_status,
          inviteSentAt: svc.invite_sent_at,
        };
        return result;
      });
  }, [services, realStudents]);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterServiceType, setFilterServiceType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortColumn, setSortColumn] = useState<SortKey | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [confirmModal, setConfirmModal] = useState<{ type: 'complete' | 'remove'; student: StudentData } | null>(null);
  const [reassignModal, setReassignModal] = useState<StudentData | null>(null);
  const [selectedCoach, setSelectedCoach] = useState('');

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>(initialMockNotes);
  const [notesModal, setNotesModal] = useState<StudentData | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail drawer state
  const [drawerStudent, setDrawerStudent] = useState<StudentData | null>(null);
  const [studentDetailDrawer, setStudentDetailDrawer] = useState<StudentData | null>(null);

  // Column widths (resize)
  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 44,
    name: 180,
    coach: 140,
    degree: 140,
    thesisType: 100,
    serviceType: 110,
    status: 130,
    progress: 100,
    closedReason: 100,
    planStart: 110,
    planEnd: 110,
    actions: 44,
  });

  // Keep drawer student in sync with students state
  useEffect(() => {
    if (drawerStudent) {
      const updated = students.find(s => s.id === drawerStudent.id);
      if (updated && updated !== drawerStudent) {
        setDrawerStudent(updated);
      }
    }
  }, [students]);

  const getNotesCount = (studentId: string) => adminNotes.filter(n => n.studentId === studentId).length;

  const handleAddNote = (studentId: string, content: string) => {
    const newNote: AdminNote = {
      id: `N-${Date.now()}`,
      studentId,
      content,
      admin: CURRENT_ADMIN,
      timestamp: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setAdminNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (noteId: string) => {
    setAdminNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Mark installment as paid — admin manually confirms bank transfer
  const handleMarkInstallmentPaid = (studentId: string, installmentId: string, paidDate: string) => {
    // TODO: Implement with LavorazioniContext
    console.log('handleMarkInstallmentPaid:', studentId, installmentId, paidDate);
  };

  // Update installment amount
  const handleUpdateInstallmentAmount = (studentId: string, installmentId: string, newAmount: number) => {
    // TODO: Implement with LavorazioniContext
    console.log('handleUpdateInstallmentAmount:', studentId, installmentId, newAmount);
  };

  // Revert installment to pending
  const handleRevertInstallment = (studentId: string, installmentId: string) => {
    // TODO: Implement with LavorazioniContext
    console.log('handleRevertInstallment:', studentId, installmentId);
  };

  const activeCount = students.filter(s => ACTIVE_STATUSES.includes(s.status)).length;
  const activationCount = students.filter(s => ACTIVATION_STATUSES.includes(s.status)).length;
  const pastCount = students.filter(s => PAST_STATUSES.includes(s.status)).length;

  const tabStatuses =
    activeTab === 'active'
      ? ACTIVE_STATUSES
      : activeTab === 'activation'
      ? ACTIVATION_STATUSES
      : PAST_STATUSES;

  const activeStatusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'active', label: 'Attivo' },
  ];
  const activationStatusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'pending_payment', label: 'In attesa di pagamento' },
    { value: 'paused', label: 'In pausa' },
  ];
  const pastStatusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'completed', label: 'Completato' },
    { value: 'cancelled', label: 'Annullato' },
    { value: 'expired', label: 'Scaduto' },
  ];
  const statusFilterOptions =
    activeTab === 'active'
      ? activeStatusOptions
      : activeTab === 'activation'
      ? activationStatusOptions
      : pastStatusOptions;

  const filteredStudents = useMemo(() => {
    let data = students.filter(s => tabStatuses.includes(s.status));
    if (filterStatus !== 'all') data = data.filter(s => s.status === filterStatus);
    if (filterServiceType !== 'all') data = data.filter(s => s.serviceType === filterServiceType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q));
    }
    if (sortColumn) {
      data = [...data].sort((a, b) => {
        let aVal = '';
        let bVal = '';
        switch (sortColumn) {
          case 'name': aVal = a.name; bVal = b.name; break;
          case 'coach': aVal = a.assignedCoachName || ''; bVal = b.assignedCoachName || ''; break;
          case 'degree': aVal = a.degree; bVal = b.degree; break;
          case 'thesisType': aVal = a.thesisType || ''; bVal = b.thesisType || ''; break;
          case 'serviceType': aVal = a.serviceType; bVal = b.serviceType; break;
          case 'status': aVal = a.status; bVal = b.status; break;
          case 'planStart': aVal = a.planStartDate || ''; bVal = b.planStartDate || ''; break;
          case 'planEnd': aVal = a.planEndDate || ''; bVal = b.planEndDate || ''; break;
          case 'progress': {
            const ap = a.stepsTotal ? a.stepsCompleted! / a.stepsTotal : 0;
            const bp = b.stepsTotal ? b.stepsCompleted! / b.stepsTotal : 0;
            aVal = ap.toFixed(4); bVal = bp.toFixed(4); break;
          }
          case 'closedReason': aVal = a.closedReason || ''; bVal = b.closedReason || ''; break;
        }
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [students, activeTab, filterStatus, filterServiceType, searchQuery, sortColumn, sortDirection]);

  const handleSort = (col: SortKey) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setFilterStatus('all');
    setFilterServiceType('all');
    setSearchQuery('');
  };

  // Active filters
  const activeFilters: Array<{ label: string; onRemove: () => void }> = [];
  if (filterStatus !== 'all') {
    const lbl = statusFilterOptions.find(o => o.value === filterStatus)?.label || filterStatus;
    activeFilters.push({ label: `Stato: ${lbl}`, onRemove: () => setFilterStatus('all') });
  }
  if (filterServiceType !== 'all') {
    activeFilters.push({ label: `Lavorazione: ${SERVICE_TYPE_LABELS[filterServiceType as ServiceType] || filterServiceType}`, onRemove: () => setFilterServiceType('all') });
  }
  if (filterDateFrom) activeFilters.push({ label: `Da: ${filterDateFrom}`, onRemove: () => setFilterDateFrom('') });
  if (filterDateTo) activeFilters.push({ label: `A: ${filterDateTo}`, onRemove: () => setFilterDateTo('') });

  const isOpenPathTab = activeTab === 'active' || activeTab === 'activation';
  const tableColCount = 11; // aggiornato per includere checkbox

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const someSelected = filteredStudents.some(s => selectedIds.has(s.id)) && !allSelected;

  // Bulk actions
  const handleBulkComplete = () => {
    // TODO: Implement with LavorazioniContext
    console.log('handleBulkComplete:', Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    // TODO: Implement with LavorazioniContext
    console.log('handleBulkDelete:', Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selected = students.filter(s => selectedIds.has(s.id));
    console.log('Esportazione studenti:', selected);
    // Implementare logica export
    setSelectedIds(new Set());
  };

  // Generate table actions for each student
  const getStudentActions = (student: StudentData): TableAction[] => {
    const actions: TableAction[] = [
      {
        label: 'Dettaglio completo',
        icon: <ArrowUpRight size={16} />,
        onClick: () => setDrawerStudent(student),
      },
    ];

    if (isOpenPathTab && student.status !== 'completed') {
      actions.push({
        label: 'Segna come completato',
        icon: <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />,
        onClick: () => setConfirmModal({ type: 'complete', student }),
      });
    }

    actions.push({
      label: `Note admin${getNotesCount(student.id) > 0 ? ` (${getNotesCount(student.id)})` : ''}`,
      icon: <StickyNote size={16} />,
      onClick: () => setNotesModal(student),
    });

    if (isOpenPathTab) {
      actions.push({
        label: 'Riassegna coach',
        icon: <UserPlus size={16} />,
        onClick: () => {
          setReassignModal(student);
          setSelectedCoach(student.assignedCoachName || '');
        },
        divider: true,
      });
    }

    actions.push({
      label: 'Rimuovi',
      icon: <Trash2 size={16} />,
      onClick: () => setConfirmModal({ type: 'remove', student }),
      variant: 'destructive',
    });

    return actions;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
          lineHeight: '1.5',
          margin: 0,
        }}>
          Piani Coaching
        </h1>
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          margin: '4px 0 0 0',
          lineHeight: '1.5',
        }}>
          Gestione piani di coaching e avanzamento studenti
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0',
      }}>
        <button
          onClick={() => handleTabChange('active')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '2px solid transparent',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: activeTab === 'active' ? 'var(--primary)' : 'transparent',
            borderRadius: '0',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: activeTab === 'active' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: activeTab === 'active' ? 'var(--foreground)' : 'var(--muted-foreground)',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginBottom: '-1px',
          }}
        >
          Percorsi attivi
          {activeCount > 0 && (
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('activation')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '2px solid transparent',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: activeTab === 'activation' ? 'var(--primary)' : 'transparent',
            borderRadius: '0',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: activeTab === 'activation' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: activeTab === 'activation' ? 'var(--foreground)' : 'var(--muted-foreground)',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginBottom: '-1px',
          }}
        >
          In attivazione
          {activationCount > 0 && (
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              {activationCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('past')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '2px solid transparent',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: activeTab === 'past' ? 'var(--primary)' : 'transparent',
            borderRadius: '0',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: activeTab === 'past' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: activeTab === 'past' ? 'var(--foreground)' : 'var(--muted-foreground)',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginBottom: '-1px',
          }}
        >
          Percorsi passati
          {pastCount > 0 && (
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              {pastCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('calendar')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '2px solid transparent',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: activeTab === 'calendar' ? 'var(--primary)' : 'transparent',
            borderRadius: '0',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: activeTab === 'calendar' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: activeTab === 'calendar' ? 'var(--foreground)' : 'var(--muted-foreground)',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginBottom: '-1px',
          }}
        >
          Calendario
        </button>
      </div>

      {activeTab === 'calendar' ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
        }}>
          Vista calendario — in sviluppo
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Cerca per nome..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px 0 44px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--card)',
                  outline: 'none',
                  lineHeight: '1.5',
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                height: '46px',
                minWidth: '200px',
                padding: '0 2rem 0 1rem',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--card)',
                cursor: 'pointer',
                appearance: 'none' as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23717680' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                lineHeight: '1.5',
              }}
            >
              {statusFilterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '1.5rem',
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                marginBottom: '0.5rem',
                lineHeight: '1.5',
              }}>
                Lavorazione
              </label>
              <select
                className="select-dropdown"
                style={{ width: '100%' }}
                value={filterServiceType}
                onChange={e => setFilterServiceType(e.target.value)}
              >
                <option value="all">Tutte</option>
                <option value="starter_pack">Starter Pack</option>
                <option value="coaching">Coaching</option>
                <option value="coaching_plus">Coaching Plus</option>
                <option value="sottocheck">SottoCheck</option>
              </select>
            </div>
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                marginBottom: '0.5rem',
                lineHeight: '1.5',
              }}>
                Data inizio da
              </label>
              <input
                type="date"
                className="search-input"
                style={{ width: '100%' }}
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                marginBottom: '0.5rem',
                lineHeight: '1.5',
              }}>
                Data inizio a
              </label>
              <input
                type="date"
                className="search-input"
                style={{ width: '100%' }}
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>

            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'flex-end',
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterServiceType('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                style={{ height: 'fit-content' }}
              >
                Reset filtri
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
              }}>
                Filtri attivi:
              </span>
              {activeFilters.map((filter, idx) => (
                <button
                  key={idx}
                  onClick={filter.onRemove}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    cursor: 'pointer',
                    lineHeight: '1.5',
                  }}
                >
                  {filter.label}
                  <X size={14} />
                </button>
              ))}
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterServiceType('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="btn btn-secondary"
                style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}
              >
                Rimuovi tutti
              </button>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedIds.size}
              onDeselectAll={() => setSelectedIds(new Set())}
              actions={[
                ...(isOpenPathTab ? [{
                  label: 'Segna come completato',
                  icon: <CheckCircle2 size={16} />,
                  onClick: handleBulkComplete,
                }] : []),
                {
                  label: 'Esporta',
                  icon: <Download size={16} />,
                  onClick: handleBulkExport,
                },
                {
                  label: 'Elimina',
                  icon: <Trash2 size={16} />,
                  onClick: handleBulkDelete,
                  variant: 'destructive' as const,
                },
              ]}
            />
          )}

          <ResponsiveTableLayout
            desktop={(
              <TableRoot minWidth="1200px">
                <thead>
                  <tr>
                    <TableSelectionHeaderCell
                      width={columnWidths.checkbox}
                      checked={someSelected ? 'indeterminate' : allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <TableHeaderCell id="name" label="Nome" width={columnWidths.name} sortable sortDirection={sortColumn === 'name' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="coach" label="Coach" width={columnWidths.coach} sortable sortDirection={sortColumn === 'coach' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="degree" label="Corso" width={columnWidths.degree} sortable sortDirection={sortColumn === 'degree' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="thesisType" label="Tipologia" width={columnWidths.thesisType} sortable sortDirection={sortColumn === 'thesisType' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="serviceType" label="Lavorazione" width={columnWidths.serviceType} sortable sortDirection={sortColumn === 'serviceType' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="status" label="Stato" width={columnWidths.status} sortable sortDirection={sortColumn === 'status' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    {isOpenPathTab ? (
                      <TableHeaderCell id="progress" label="Progresso" width={columnWidths.progress} sortable sortDirection={sortColumn === 'progress' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    ) : (
                      <TableHeaderCell id="closedReason" label="Motivo" width={columnWidths.closedReason} sortable sortDirection={sortColumn === 'closedReason' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    )}
                    <TableHeaderCell id="planStart" label="Inizio" width={columnWidths.planStart} sortable sortDirection={sortColumn === 'planStart' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderCell id="planEnd" label={isOpenPathTab ? 'Scadenza' : 'Chiusura'} width={columnWidths.planEnd} sortable sortDirection={sortColumn === 'planEnd' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                    <TableHeaderActionCell width={columnWidths.actions} />
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <TableEmptyState message="Nessuno studente trovato" colSpan={tableColCount} />
                  ) : filteredStudents.map((student) => (
                    <TableRow key={student.id} onClick={() => setDrawerStudent(student)} selected={selectedIds.has(student.id)} selectedBackgroundColor="var(--selected-row-bg)">
                      <TableSelectionCell
                        checked={selectedIds.has(student.id)}
                        onCheckedChange={(checked) => handleSelectOne(student.id, checked === true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                                {student.name}
                              </span>
                              {(student.openTicketCount ?? 0) > 0 && (
                                <span
                                  title={`${student.openTicketCount} ticket aperti`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(238, 70, 188, 0.12)', borderRadius: '10px', padding: '1px 6px', height: '18px' }}
                                >
                                  <TicketIcon size={10} style={{ color: 'var(--chart-4)' }} />
                                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--chart-4)', lineHeight: '1.5' }}>
                                    {student.openTicketCount}
                                  </span>
                                </span>
                              )}
                            </div>
                            {student.university && (
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                {student.university}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.assignedCoachName ? (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            {student.assignedCoachName}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          {student.degree}
                        </span>
                      </TableCell>
                      <TableCell>
                        {student.thesisType ? (
                          <PillBadge label={THESIS_TYPE_LABELS[student.thesisType]} />
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PillBadge label={SERVICE_TYPE_LABELS[student.serviceType]} />
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '3px', background: STATUS_DOT_COLORS[student.status], flexShrink: 0 }} />
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: STATUS_DOT_COLORS[student.status], lineHeight: '1.5' }}>
                              {STATUS_LABELS[student.status]}
                            </span>
                          </div>
                          {student.installmentStatus === 'overdue' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CreditCard size={11} style={{ color: 'var(--destructive-foreground)' }} />
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--destructive-foreground)', lineHeight: '1.5' }}>
                                Rata scaduta{(student.installmentOverdueCount ?? 0) > 1 ? ` (${student.installmentOverdueCount})` : ''}
                              </span>
                            </div>
                          )}
                          {student.contractStatus === 'pending' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={11} style={{ color: 'var(--chart-3)' }} />
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--chart-3)', lineHeight: '1.5' }}>
                                Contratto da firmare
                              </span>
                            </div>
                          )}
                          {!student.hasTimeline && student.status === 'pending_payment' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={11} style={{ color: 'var(--chart-3)' }} />
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--chart-3)', lineHeight: '1.5' }}>
                                Timeline mancante
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {isOpenPathTab ? (
                        <TableCell>
                          <ProgressCell completed={student.stepsCompleted ?? 0} total={student.stepsTotal ?? 0} />
                        </TableCell>
                      ) : (
                        <TableCell>
                          {student.closedReason ? (
                            <ClosedReasonBadge reason={student.closedReason} />
                          ) : (
                            <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {student.planStartDate ? (
                          <DateCell date={student.planStartDate} />
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isOpenPathTab ? (
                          student.planEndDate ? (
                            <DateCell date={student.planEndDate} />
                          ) : (
                            <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>
                          )
                        ) : (
                          student.closedAt ? (
                            <DateCell date={student.closedAt} />
                          ) : (
                            <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>
                          )
                        )}
                      </TableCell>
                      <TableActionCell width={columnWidths.actions} onClick={(e) => e.stopPropagation()}>
                        <TableActions actions={getStudentActions(student)} />
                      </TableActionCell>
                    </TableRow>
                  ))}
                </tbody>
              </TableRoot>
            )}
            mobile={(
              <ResponsiveMobileCards>
                {filteredStudents.map((student) => (
                  <ResponsiveMobileCard key={student.id}>
                    <div onClick={() => setDrawerStudent(student)} style={{ cursor: 'pointer' }}>
                    <ResponsiveMobileCardHeader>
                      <div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          {student.name}
                        </div>
                        {student.university && (
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {student.university}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '3px', background: STATUS_DOT_COLORS[student.status] }} />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: STATUS_DOT_COLORS[student.status], lineHeight: '1.5' }}>
                          {STATUS_LABELS[student.status]}
                        </span>
                      </div>
                    </ResponsiveMobileCardHeader>

                    <ResponsiveMobileCardSection marginBottom="0.75rem">
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <PillBadge label={SERVICE_TYPE_LABELS[student.serviceType]} />
                        {student.thesisType && <PillBadge label={THESIS_TYPE_LABELS[student.thesisType]} />}
                      </div>
                    </ResponsiveMobileCardSection>

                    {student.stepsTotal && student.stepsTotal > 0 && (
                      <ResponsiveMobileCardSection marginBottom="0.75rem">
                        <ResponsiveMobileFieldLabel>Progresso</ResponsiveMobileFieldLabel>
                        <ProgressCell completed={student.stepsCompleted ?? 0} total={student.stepsTotal} />
                      </ResponsiveMobileCardSection>
                    )}

                    {student.assignedCoachName && (
                      <ResponsiveMobileCardSection marginBottom="0.75rem">
                        <ResponsiveMobileFieldLabel>Coach</ResponsiveMobileFieldLabel>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          {student.assignedCoachName}
                        </span>
                      </ResponsiveMobileCardSection>
                    )}

                    {student.installmentStatus === 'overdue' && (
                      <ResponsiveMobileCardSection marginBottom="0">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={11} style={{ color: 'var(--destructive-foreground)' }} />
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--destructive-foreground)', lineHeight: '1.5' }}>
                            Rata scaduta
                          </span>
                        </div>
                      </ResponsiveMobileCardSection>
                    )}
                    </div>
                  </ResponsiveMobileCard>
                ))}
              </ResponsiveMobileCards>
            )}
          />
        </>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmDialog
          isOpen={true}
          title={confirmModal.type === 'complete' ? 'Segna come completato?' : 'Rimuovi studente?'}
          description={
            confirmModal.type === 'complete'
              ? `Confermi di voler segnare come completato il piano coaching di ${confirmModal.student.name}?`
              : `Sei sicuro di voler rimuovere ${confirmModal.student.name}? Questa azione non può essere annullata.`
          }
          variant={confirmModal.type === 'remove' ? 'destructive' : 'default'}
          onConfirm={() => {
            if (confirmModal.type === 'complete') {
              // TODO: Implement with LavorazioniContext
              console.log('Complete student:', confirmModal.student.id);
            } else {
              // TODO: Implement with LavorazioniContext
              console.log('Remove student:', confirmModal.student.id);
            }
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <ReassignModal
          student={reassignModal}
          selectedCoach={selectedCoach}
          onSelectCoach={setSelectedCoach}
          onClose={() => setReassignModal(null)}
          onConfirm={() => setReassignModal(null)}
        />
      )}

      {/* Notes Drawer */}
      <NotesDrawer
        isOpen={!!notesModal}
        onClose={() => setNotesModal(null)}
        entityId={notesModal?.id || ''}
        entityType="Piano Coaching"
        entityName={notesModal?.name || ''}
        notes={notesModal ? adminNotes.filter(n => n.studentId === notesModal.id) : []}
        onAddNote={(content) => notesModal && handleAddNote(notesModal.id, content)}
        currentAdmin={CURRENT_ADMIN}
      />

      {/* Detail Drawer */}
      {drawerStudent && (
        <TimelineDrawer
          student={drawerStudent}
          notes={adminNotes.filter(n => n.studentId === drawerStudent.id)}
          onClose={() => setDrawerStudent(null)}
          onOpenNotes={() => { setNotesModal(drawerStudent); }}
          onReassignCoach={() => { setReassignModal(drawerStudent); setSelectedCoach(drawerStudent.assignedCoachName || ''); }}
          onMarkComplete={() => { setConfirmModal({ type: 'complete', student: drawerStudent }); }}
          onRemove={() => { setConfirmModal({ type: 'remove', student: drawerStudent }); }}
          onOpenStudentDetail={() => { 
            setStudentDetailDrawer(drawerStudent); 
            setDrawerStudent(null); 
          }}
        />
      )}

      {studentDetailDrawer && (
        <StudentDetailDrawer
          student={studentDetailDrawer}
          notes={adminNotes.filter(n => n.studentId === studentDetailDrawer.id)}
          onAddNote={(text) => handleAddNote(studentDetailDrawer.id, text)}
          onDeleteNote={handleDeleteNote}
          onClose={() => setStudentDetailDrawer(null)}
          onOpenNotes={() => setNotesModal(studentDetailDrawer)}
          onReassignCoach={() => { setReassignModal(studentDetailDrawer); setSelectedCoach(studentDetailDrawer.assignedCoachName || ''); }}
          onMarkComplete={() => setConfirmModal({ type: 'complete', student: studentDetailDrawer })}
          onRemove={() => setConfirmModal({ type: 'remove', student: studentDetailDrawer })}
          onMarkInstallmentPaid={(id, date) => handleMarkInstallmentPaid(studentDetailDrawer.id, id, date)}
          onRevertInstallment={(id) => handleRevertInstallment(studentDetailDrawer.id, id)}
          onUpdateInstallmentAmount={(id, amount) => handleUpdateInstallmentAmount(studentDetailDrawer.id, id, amount)}
          onUploadContract={() => alert('Upload contratto — in sviluppo')}
          onDownloadContract={() => alert('Download contratto — in sviluppo')}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function PillBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.125rem 0.5rem',
      borderRadius: 'var(--radius-badge)',
      background: 'var(--muted)',
      fontFamily: 'var(--font-inter)',
      fontSize: '12px',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--foreground)',
      lineHeight: '1.5',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function DateCell({ date }: { date: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Calendar size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        fontWeight: 'var(--font-weight-regular)',
        color: 'var(--foreground)',
        lineHeight: '1.5',
        whiteSpace: 'nowrap',
      }}>
        {date}
      </span>
    </div>
  );
}

function ProgressCell({ completed, total }: { completed: number; total: number }) {
  if (total === 0) {
    return <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>—</span>;
  }
  const pct = Math.round((completed / total) * 100);
  const barColor = pct === 100 ? 'var(--primary)' : pct >= 50 ? 'var(--chart-2)' : 'var(--chart-3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '60px' }}>
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--foreground)',
        lineHeight: '1.5',
      }}>
        {completed}/{total}
      </span>
      <div style={{
        width: '100%',
        height: '4px',
        borderRadius: '2px',
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: '2px',
          background: barColor,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function ClosedReasonBadge({ reason }: { reason: ClosedReason }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '3px',
        background: CLOSED_REASON_COLORS[reason],
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)',
        color: CLOSED_REASON_COLORS[reason],
        lineHeight: '1.5',
        whiteSpace: 'nowrap',
      }}>
        {CLOSED_REASON_LABELS[reason]}
      </span>
    </div>
  );
}

function ConfirmModal({ type, studentName, onClose, onConfirm }: {
  type: 'complete' | 'remove'; studentName: string; onClose: () => void; onConfirm: () => void;
}) {
  const isRemove = type === 'remove';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(10,13,18,0.15)', maxWidth: '440px', width: '100%',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: isRemove ? 'rgba(220,38,38,0.10)' : 'rgba(11,182,63,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isRemove
                ? <UserMinus size={18} style={{ color: 'var(--destructive-foreground)' }} />
                : <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
              }
            </div>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
            }}>
              {isRemove ? 'Rimuovi studente' : 'Segna come completato'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          marginBottom: '24px',
          lineHeight: '1.6',
        }}>
          {isRemove
            ? <>Stai per rimuovere <strong style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>{studentName}</strong>. Questa azione non è facilmente reversibile.</>
            : <>Stai per segnare il percorso di <strong style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>{studentName}</strong> come completato. Questa azione non è facilmente reversibile.</>
          }
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">Annulla</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              border: 'none',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: '#fff',
              background: isRemove ? 'var(--destructive-foreground)' : 'var(--primary)',
              cursor: 'pointer',
              lineHeight: '1.5',
            }}
          >
            {isRemove ? 'Rimuovi' : 'Completa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReassignModal({ student, selectedCoach, onSelectCoach, onClose, onConfirm }: {
  student: StudentData; selectedCoach: string;
  onSelectCoach: (c: string) => void; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(10,13,18,0.15)', maxWidth: '440px', width: '100%',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(46,144,250,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={18} style={{ color: 'var(--chart-2)' }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
            }}>
              Riassegna coach
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          marginBottom: '16px',
          lineHeight: '1.6',
        }}>
          Seleziona un nuovo coach per <strong style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>{student.name}</strong>.
        </p>

        {student.assignedCoachName && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--muted)',
            borderRadius: 'var(--radius)',
            marginBottom: '12px',
          }}>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              Coach attuale:
            </span>
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              marginLeft: '6px',
              lineHeight: '1.5',
            }}>
              {student.assignedCoachName}
            </span>
          </div>
        )}

        <select
          value={selectedCoach}
          onChange={e => onSelectCoach(e.target.value)}
          className="select-dropdown"
          style={{ width: '100%', marginBottom: '24px', height: '46px' }}
        >
          <option value="">Seleziona coach...</option>
          {COACHES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">Annulla</button>
          <button
            onClick={onConfirm}
            disabled={!selectedCoach || selectedCoach === student.assignedCoachName}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              border: 'none',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: '#fff',
              background: (!selectedCoach || selectedCoach === student.assignedCoachName) ? 'var(--muted-foreground)' : 'var(--primary)',
              cursor: (!selectedCoach || selectedCoach === student.assignedCoachName) ? 'not-allowed' : 'pointer',
              opacity: (!selectedCoach || selectedCoach === student.assignedCoachName) ? 0.5 : 1,
              lineHeight: '1.5',
            }}
          >
            Riassegna
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesModal({ student, notes, onAddNote, onDeleteNote, onClose }: {
  student: StudentData;
  notes: AdminNote[];
  onAddNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onClose: () => void;
}) {
  const [newNoteText, setNewNoteText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (newNoteText.trim()) {
      onAddNote(newNoteText.trim());
      setNewNoteText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(10,13,18,0.15)', maxWidth: '520px', width: '100%',
          display: 'flex', flexDirection: 'column', maxHeight: '80vh',
        }}
      >
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(122, 90, 248, 0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StickyNote size={18} style={{ color: 'var(--chart-5)' }} />
            </div>
            <div>
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                lineHeight: '1.5',
                display: 'block',
              }}>
                Note admin
              </span>
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
              }}>
                {student.name} — solo visibili tra admin
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}>
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi una nota..."
              rows={2}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--input-background)',
                outline: 'none',
                resize: 'vertical',
                minHeight: '60px',
                lineHeight: '1.5',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!newNoteText.trim()}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: newNoteText.trim() ? 'var(--primary)' : 'var(--muted)',
                color: newNoteText.trim() ? '#fff' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: newNoteText.trim() ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div style={{
          padding: '16px 24px 24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {notes.length === 0 ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
            }}>
              <StickyNote size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.3, marginBottom: '8px' }} />
              <p style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                margin: 0,
                lineHeight: '1.5',
              }}>
                Nessuna nota per questa lavorazione
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.map(note => (
                <div
                  key={note.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                    position: 'relative',
                  }}
                >
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--foreground)',
                    margin: '0 0 8px 0',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {note.text}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {note.author}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        · {note.createdAt}
                      </span>
                    </div>
                    {deleteConfirmId === note.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--destructive-foreground)',
                          lineHeight: '1.5',
                        }}>
                          Eliminare?
                        </span>
                        <button
                          onClick={() => { onDeleteNote(note.id); setDeleteConfirmId(null); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-inter)', fontSize: '11px',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--destructive-foreground)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            lineHeight: '1.5',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          Sì
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-inter)', fontSize: '11px',
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--muted-foreground)',
                            padding: '2px 6px',
                            lineHeight: '1.5',
                          }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--muted-foreground)', padding: '2px',
                          borderRadius: '4px', display: 'flex', alignItems: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--destructive-foreground)'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.background = 'none'; }}
                        title="Elimina nota"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
