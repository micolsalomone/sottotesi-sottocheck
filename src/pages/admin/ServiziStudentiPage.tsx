
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, CSSProperties } from 'react';
import { Plus, ExternalLink, X, ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle, Clock, AlertTriangle, Pencil, ChevronRight, Calendar, UserPlus, StickyNote, Trash2, User, GraduationCap, Download, PauseCircle, Mail } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { StatusBadge, type StatusType } from '../../app/components/StatusBadge';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import {
  useLavorazioni,
  REFERENTI_SOTTOTESI,
  ADMIN_PROFILES,
  SERVICE_CATALOG,
  type StudentService,
  type ServiceStatus,
  type ContractStatus,
  type InstallmentStatus,
  type DegreeLevel,
  type PayoutStatus,
  type CoachPayout,
  type TaxRate,
} from '../../app/data/LavorazioniContext';
import { CreateStudentDrawer } from '../../app/components/CreateStudentDrawer';
import { useAreeTematiche } from '../../app/data/AreeTematicheContext';
import { NotesDrawer, type Note } from '../../app/components/NotesDrawer';
import { LavorazioneDetailDrawer } from '../../app/components/LavorazioneDetailDrawer';
import { SmartCoachSelect } from '../../app/components/SmartCoachSelect';
import { CreateLavorazioneDrawer } from '../../app/components/CreateLavorazioneDrawer';
import {
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveTableLayout,
  TableActionCell,
  TableCell,
  TableHeaderBaseCell,
  TableHeaderActionCell,
  TableRow,
  TableRoot,
  TableSelectionCell,
  TableSelectionHeaderCell,
} from '../../app/components/TablePrimitives';

// ─── Vista types ────────────────────────────────────────────
type Vista = 'lavorazioni' | 'compensi';
const VISTA_LABELS: Record<Vista, string> = {
  lavorazioni: 'Lavorazioni',
  compensi: 'Compensi Coach',
};

type NotulaWorkflowStatus = 'da_programmare' | 'creata' | 'da_pagare' | 'pagata';

const MONTH_NAMES_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

interface MonthGroup {
  key: string; // "2026-01"
  label: string; // "Gennaio 2026"
  services: StudentService[];
  totalLordo: number;
  totalNetto: number;
  totalIncassato: number;
  totalCoachFees: number;
  overdueCount: number;
}

const normalizeTaxRate = (value?: number): TaxRate => (value === 0 || value === 4 || value === 22 ? value : 22);
const roundToCents = (value: number): number => Math.round(value * 100) / 100;
const normalizeNotulaStatus = (status?: CoachPayout['notula_status']): NotulaWorkflowStatus => {
  if (status === 'pagata') return 'pagata';
  if (status === 'inviata' || status === 'da_pagare') return 'da_pagare';
  if (status === 'creata' || status === 'programmata') return 'creata';
  return 'da_programmare';
};
const getPayoutIssueDate = (payout?: Partial<CoachPayout>): string | undefined => {
  if (!payout) return undefined;
  return payout.document_type === 'fattura'
    ? payout.invoice_date
    : payout.notula_issue_date;
};
const getPayoutDocumentDate = (payout?: Partial<CoachPayout>): string | undefined => {
  if (!payout) return undefined;
  return payout.document_type === 'fattura'
    ? payout.invoice_date
    : payout.notula_sent_date || payout.notula_issue_date;
};
const resolveNotulaStatus = (payout?: Partial<CoachPayout>): NotulaWorkflowStatus => {
  if (!payout) return 'da_programmare';
  const isFattura = payout.document_type === 'fattura';

  if (payout.paid_at) return 'pagata';
  if (isFattura) {
    if (payout.invoice_status === 'ricevuta') return 'da_pagare';
    if (payout.invoice_date) return 'creata';
    return 'da_programmare';
  }

  if (payout.sent_manually || normalizeNotulaStatus(payout.notula_status) === 'da_pagare') return 'da_pagare';
  if (payout.notula_issue_date) return 'creata';
  return 'da_programmare';
};
const createDefaultCoachPayout = (serviceId: string): CoachPayout => ({
  id: `CP-${serviceId}`,
  document_type: 'notula',
  status: 'pending_invoice',
  notula_status: 'da_programmare',
  invoice_status: 'da_ricevere',
  tax_rate: 0,
  sent_manually: false,
});
const withSyncedNotulaStatus = (payout: CoachPayout): CoachPayout => ({
  ...payout,
  notula_status: resolveNotulaStatus(payout),
});

// ─── Admin Note type (estende Note con serviceId per flat storage) ──
interface ServiceNote extends Note {
  serviceId: string;
}

export function ServiziStudentiPage() {
  const { data: localData, students, pipelines, addStudent, updateStudent, taxPercent, updateService, addService, removeService } = useLavorazioni();
  const { getActiveAree } = useAreeTematiche();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Transfer highlight from URL param to local state + reset filters
  useEffect(() => {
    if (highlightId) {
      // Reset all filters so the highlighted row is guaranteed visible
      setSelectedYear('all');
      setFilterStatus('all');
      setFilterCategory('all');
      setFilterCoach('all');
      setSearchQuery('');
      setQuickFilter(null);
      setActiveHighlightId(highlightId);
      setSearchParams({}, { replace: true });
    }
  }, [highlightId, setSearchParams]);

  // Scroll into view after DOM renders the highlighted row
  useEffect(() => {
    if (!activeHighlightId) return;
    let attempts = 0;
    const tryScroll = () => {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    };
    // Try immediately via rAF, then retry with short intervals if ref not ready
    const raf = requestAnimationFrame(() => {
      if (!tryScroll()) {
        const interval = setInterval(() => {
          if (tryScroll() || ++attempts >= 10) clearInterval(interval);
        }, 100);
        timers.push(interval);
      }
    });
    const timers: ReturnType<typeof setInterval>[] = [];
    const clearTimer = setTimeout(() => {
      setActiveHighlightId(null);
    }, 4500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clearTimer);
      timers.forEach(t => clearInterval(t));
    };
  }, [activeHighlightId]);

  // ─── Auto-open "Nuova lavorazione" from quick action ────
  const azioneParam = searchParams.get('azione');
  useEffect(() => {
    if (azioneParam === 'nuova') {
      setShowAssignPanel(true);
      setSearchParams({}, { replace: true });
    }
  }, [azioneParam, setSearchParams]);

  // ─── Nuova Lavorazione drawer ────────────────────────────
  const [showAssignPanel, setShowAssignPanel] = useState(false);

  // ─── Edit student drawer ──────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // ─── Vista state ──────────────────────────────────────────
  const [activeVista, setActiveVista] = useState<Vista>('lavorazioni');

  // ─── Column visibility per vista ─────────────────────────
  const VISTA_COLUMNS: Record<Vista, Set<string>> = {
    lavorazioni: new Set(['checkbox','student','rate','contratto','netto','lordo','incassato','coachCompenso','nextDue','coachName','createdAt','expiresAt','status','notes','actions']),
    compensi:    new Set(['checkbox','coach','student','servizio','statoLav','compenso','dataNotula','scad45gg','statoNotula','pagatoIl','rifPag','actions']),
  };
  const visibleCols = VISTA_COLUMNS[activeVista];
  const colVis = (col: string): CSSProperties => visibleCols.has(col) ? {} : { display: 'none' };
  const ALL_COLS = ['checkbox','id','coach','student','status','createdAt','expiresAt','servizio','rate','contratto','fattura','netto','lordo','incassato','coachCompenso','nextDue','coachName','statoLav','compenso','dataNotula','scad45gg','statoNotula','pagatoIl','rifPag','notes','actions'] as const;
  const visibleColCount = ALL_COLS.filter(c => visibleCols.has(c)).length;

  // ─── Quick filters (operational) ──────────────────────────
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // ─── Year tabs ─────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);

  // ─── Admin notes (pattern NotesDrawer — NORMALIZZAZIONE_RECAP) ──
  const CURRENT_ADMIN = 'Francesca';
  const [adminNotes, setAdminNotes] = useState<ServiceNote[]>([
    { id: 'LN-001', serviceId: 'SS-117', content: 'Sollecitare pagamento seconda rata — scaduta da 3 settimane.', admin: 'Francesca', timestamp: '2 mar 2026 10:30' },
    { id: 'LN-002', serviceId: 'SS-117', content: 'Coach ha segnalato difficoltà nella comunicazione con lo studente.', admin: 'Claudia', timestamp: '25 feb 2026 15:00' },
    { id: 'LN-003', serviceId: 'SS-101', content: 'Terza rata in scadenza il 1 febbraio. Inviare reminder.', admin: 'Francesca', timestamp: '28 gen 2026 09:00' },
  ]);

  // ─── Note drawer state ──────────────────────────────────────
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [selectedServiceForNotes, setSelectedServiceForNotes] = useState<{ id: string; name: string } | null>(null);

  const getNotesCount = (serviceId: string) => adminNotes.filter(n => n.serviceId === serviceId).length;
  const getNotesForService = (serviceId: string): Note[] =>
    adminNotes.filter(n => n.serviceId === serviceId);

  const handleOpenNotesDrawer = (serviceId: string, serviceName: string) => {
    setSelectedServiceForNotes({ id: serviceId, name: serviceName });
    setNotesDrawerOpen(true);
  };

  const handleAddNote = (content: string) => {
    if (!selectedServiceForNotes) return;
    const newNote: ServiceNote = {
      id: `LN-${Date.now()}`,
      serviceId: selectedServiceForNotes.id,
      content,
      admin: CURRENT_ADMIN,
      timestamp: formatDateTimeIT(new Date().toISOString()),
    };
    setAdminNotes(prev => [newNote, ...prev]);
    toast.success('Nota aggiunta');
  };

  // ─── Detail drawer state ──────────────────────────────────
  const [detailDrawerServiceId, setDetailDrawerServiceId] = useState<string | null>(null);
  const [detailDrawerOpenedAt, setDetailDrawerOpenedAt] = useState<number>(0);

  const detailDrawerService = detailDrawerServiceId ? localData.find(s => s.id === detailDrawerServiceId) : null;

  const handleRowClick = (serviceId: string) => {
    setDetailDrawerServiceId(serviceId);
    setDetailDrawerOpenedAt(Date.now());
  };

  // ─── Filters & sort ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  
  type SortKey = 'id' | 'student_name' | 'created_at' | 'status' | 'nextDue' | 'coach_name' | 'compenso' | 'dataNotula' | 'scad45gg' | 'statoNotula' | 'plan_start_date' | 'plan_end_date' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Editing states
  const [editingCoachFee, setEditingCoachFee] = useState<string | null>(null);
  const [coachFeeInput, setCoachFeeInput] = useState('');
  const [editingInstAmount, setEditingInstAmount] = useState<string | null>(null);
  const [instAmountInput, setInstAmountInput] = useState('');
  const [editingLordo, setEditingLordo] = useState<string | null>(null);
  const [lordoInput, setLordoInput] = useState('');
  const [editingExpiresAt, setEditingExpiresAt] = useState<string | null>(null);
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [editingPlanStart, setEditingPlanStart] = useState<string | null>(null);
  const [planStartInput, setPlanStartInput] = useState('');
  const [editingPaymentDate, setEditingPaymentDate] = useState<string | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState('');
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string | null>(null);
  const [invoiceNumInput, setInvoiceNumInput] = useState('');
  const [invoiceYearInput, setInvoiceYearInput] = useState('');
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [editingInstInvoice, setEditingInstInvoice] = useState<string | null>(null);
  const [instInvoiceNumInput, setInstInvoiceNumInput] = useState('');
  const [instInvoiceYearInput, setInstInvoiceYearInput] = useState('');
  // Compensi coach inline editing states
  const [editingDataNotula, setEditingDataNotula] = useState<string | null>(null);
  const [dataNotulaInput, setDataNotulaInput] = useState('');
  const [editingPagatoIl, setEditingPagatoIl] = useState<string | null>(null);
  const [pagatoIlInput, setPagatoIlInput] = useState('');
  const [editingRifPag, setEditingRifPag] = useState<string | null>(null);
  const [rifPagInput, setRifPagInput] = useState('');
  
  // ─── Bulk selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(({
    checkbox: 40,
    id: 100,
    student: 250,
    contratto: 90,
    fattura: 150,
    netto: 85,
    lordo: 85,
    incassato: 95,
    rate: 80,
    nextDue: 140,
    coachCompenso: 100,
    coachName: 140,
    createdAt: 120,
    expiresAt: 130,
    status: 100,
    notes: 60,
    actions: 60,
    // Compensi coach columns
    coach: 157,
    servizio: 160,
    statoLav: 120,
    compenso: 130,
    dataNotula: 140,
    scad45gg: 150,
    statoNotula: 150,
    pagatoIl: 120,
    rifPag: 180,
  }));
  
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const updateCoachFee = (serviceId: string, fee: number) => {
    updateService(serviceId, s => ({ ...s, coach_fee: fee, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
    setEditingCoachFee(null);
    toast.success('Compenso coach aggiornato');
  };
  
  const updateCoachName = (serviceId: string, name: string) => {
    updateService(serviceId, s => ({ ...s, coach_name: name || undefined, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
    toast.success(name ? `Coach assegnato: ${name}` : 'Coach rimosso');
  };
  
  const updateContractStatus = (serviceId: string, newStatus: ContractStatus) => {
    const now = new Date().toISOString();
    updateService(serviceId, s => {
      if (!s.contract) {
        return {
          ...s,
          updated_by: CURRENT_ADMIN, updated_at: now,
          contract: {
            id: `CT-NEW-${Date.now()}`,
            status: newStatus,
            documentUrl: '',
            signedAt: newStatus === 'signed' ? now.split('T')[0] : undefined,
          }
        };
      }
      return {
        ...s,
        updated_by: CURRENT_ADMIN, updated_at: now,
        contract: {
          ...s.contract,
          status: newStatus,
          signedAt: newStatus === 'signed' ? (s.contract.signedAt || now.split('T')[0]) : s.contract.signedAt,
        }
      };
    });
    const statusLabels: Record<string, string> = { draft: 'Bozza', signed: 'Firmato', cancelled: 'Annullato' };
    toast.success(`Contratto → ${statusLabels[newStatus]}`);
  };
  
  const updateContractExpiry = (serviceId: string, planEndDate: string) => {
    updateService(serviceId, s => {
      return { ...s, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(), plan_end_date: planEndDate || undefined };
    });
    setEditingExpiresAt(null);
    toast.success('Scadenza piano aggiornata');
  };

  const updatePlanStart = (serviceId: string, planStartDate: string) => {
    updateService(serviceId, s => {
      return { ...s, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(), plan_start_date: planStartDate || undefined };
    });
    setEditingPlanStart(null);
    toast.success('Inizio piano aggiornato');
  };
  
  const updateInstallmentAmount = (serviceId: string, instId: string, amount: number) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => i.id === instId ? { ...i, amount } : i)
    }));
    setEditingInstAmount(null);
    toast.success('Importo rata aggiornato');
  };

  const updateLordo = (serviceId: string, newLordo: number, taxRate: TaxRate) => {
    updateService(serviceId, s => {
      const count = s.installments.length;
      if (count === 0) return s;
      const perInst = Math.round(newLordo / count);
      const remainder = newLordo - perInst * (count - 1);
      return {
        ...s,
        updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
        total_tax_rate: taxRate,
        installments: s.installments.map((inst, idx) => ({
          ...inst,
          amount: idx === count - 1 ? remainder : perInst
        }))
      };
    });
    setEditingLordo(null);
    toast.success('Totale lordo aggiornato');
  };

  const toggleInstallmentPaid = (serviceId: string, instId: string) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => {
        if (i.id !== instId) return i;
        if (i.status === 'paid') {
          return { ...i, status: 'pending' as InstallmentStatus, payment: undefined };
        } else {
          const today = new Date().toISOString().split('T')[0];
          return {
            ...i,
            status: 'paid' as InstallmentStatus,
            payment: { id: `PAY-${Date.now()}`, amount: i.amount, paidAt: today, method: 'Manuale' }
          };
        }
      })
    }));
    toast.success('Stato rata aggiornato');
  };

  const updatePaymentDate = (serviceId: string, instId: string, newDate: string) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => {
        if (i.id !== instId || !i.payment) return i;
        return { ...i, payment: { ...i.payment, paidAt: newDate } };
      })
    }));
    setEditingPaymentDate(null);
  };

  const updateInstallmentDueDate = (serviceId: string, instId: string, newDate: string) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => {
        if (i.id !== instId) return i;
        return { ...i, dueDate: newDate };
      })
    }));
    setEditingDueDate(null);
    toast.success('Scadenza rata aggiornata');
  };

  // Helper: parse "17/2026" → { num: "17", year: "2026" }
  const parseInvoiceNumber = (inv?: string) => {
    if (!inv) return { num: '', year: '' };
    const parts = inv.split('/');
    return { num: parts[0] || '', year: parts[1] || '' };
  };

  // Helper: derive year from installment dueDate or current year
  const deriveInvoiceYear = (dueDate?: string) => {
    if (dueDate) return dueDate.substring(0, 4);
    return String(new Date().getFullYear());
  };

  // Helper: compose "num/year", or undefined if no num
  const composeInvoiceNumber = (num: string, year: string) => {
    const trimmed = num.trim();
    if (!trimmed) return undefined;
    return `${trimmed}/${year}`;
  };

  const updateInstallmentInvoiceNumber = (serviceId: string, instId: string, invoiceNum: string) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => {
        if (i.id !== instId) return i;
        return { ...i, invoice_number: invoiceNum || undefined };
      })
    }));
    setEditingInstInvoice(null);
    toast.success('N. Fattura rata aggiornato');
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortKey) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  // Generate actions for each service
  const getServiceActions = (service: StudentService): TableAction[] => {
    const actions: TableAction[] = [];

    // View details
    const link = getLavorazioneLink(service);
    if (link) {
      actions.push({
        label: 'Vai a lavorazione',
        icon: <ExternalLink size={14} />,
        onClick: () => navigate(link.path),
      });
    }

    // Change status
    if (service.status !== 'completed') {
      actions.push({
        label: 'Segna come completato',
        icon: <CheckCircle size={14} />,
        onClick: () => {
          updateService(service.id, s => ({ ...s, status: 'completed', updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
          toast.success('Lavorazione completata');
        },
      });
    }

    // Delete
    actions.push({
      label: 'Elimina',
      icon: <Trash2 size={14} />,
      onClick: () => {
        if (confirm(`Eliminare la lavorazione ${service.id}?`)) {
          removeService(service.id);
          toast.success('Lavorazione eliminata');
        }
      },
      variant: 'destructive' as const,
    });

    return actions;
  };

  // Helper: get next pending/overdue installment date
  const getNextDueDate = useCallback((service: StudentService): string | null => {
    const pending = service.installments
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return pending.length > 0 ? pending[0].dueDate : null;
  }, []);

  const getServiceTaxRate = useCallback((service: StudentService): TaxRate => {
    return normalizeTaxRate(service.total_tax_rate);
  }, []);

  const getInstallmentTaxRate = useCallback((service: StudentService, installment: { net_tax_rate?: TaxRate }): TaxRate => {
    return normalizeTaxRate(installment.net_tax_rate ?? service.total_tax_rate);
  }, []);

  const getInstallmentNet = useCallback((service: StudentService, installment: { amount: number; net_tax_rate?: TaxRate }): number => {
    const rate = getInstallmentTaxRate(service, installment);
    return roundToCents(installment.amount * (1 - rate / 100));
  }, [getInstallmentTaxRate]);

  const getServiceLordo = useCallback((service: StudentService): number => {
    return service.installments.reduce((sum, i) => sum + i.amount, 0);
  }, []);

  const getServiceNet = useCallback((service: StudentService): number => {
    return roundToCents(service.installments.reduce((sum, i) => sum + getInstallmentNet(service, i), 0));
  }, [getInstallmentNet]);

  const getPaidNet = useCallback((service: StudentService): number => {
    return roundToCents(service.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + getInstallmentNet(service, i), 0));
  }, [getInstallmentNet]);

  const grossFromNet = useCallback((netAmount: number, taxRate: TaxRate): number => {
    const divisor = 1 - taxRate / 100;
    if (divisor <= 0) return netAmount;
    return roundToCents(netAmount / divisor);
  }, []);

  // Prefiltered base data (exclude Sottocheck)
  const baseData = useMemo(() => localData.filter(s => s.service_category !== 'Check plagio/AI'), [localData]);
  const uniqueCoaches = Array.from(new Set(baseData.map(s => s.coach_name).filter(Boolean))).sort() as string[];

  // Helper: is a lavorazione "incomplete" (needs admin action)?
  const isIncomplete = useCallback((s: StudentService): boolean => {
    if (s.status === 'completed') return false;
    const missingContract = !s.contract || s.contract.status === 'draft';
    const missingPrice = s.installments.length === 0;
    const missingCoach = !s.coach_name && s.service_category === 'Coaching';
    const hasOverdue = s.installments.some(i => i.status === 'overdue');
    return missingContract || missingPrice || missingCoach || hasOverdue;
  }, []);

  // Available years (sorted descending, most recent first)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    baseData.forEach(s => {
      const y = parseInt(s.created_at.slice(0, 4));
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [baseData]);

  // Year-filtered data
  const yearFilteredData = useMemo(() => {
    if (selectedYear === 'all') return baseData;
    return baseData.filter(s => s.created_at.startsWith(String(selectedYear)));
  }, [baseData, selectedYear]);

  // Per-year incomplete counts (for tab badges)
  const yearIncompleteCounts = useMemo(() => {
    const counts: Record<number | 'all', number> = { all: 0 };
    availableYears.forEach(y => { counts[y] = 0; });
    baseData.forEach(s => {
      if (isIncomplete(s)) {
        counts.all++;
        const y = parseInt(s.created_at.slice(0, 4));
        if (!isNaN(y) && counts[y] !== undefined) counts[y]++;
      }
    });
    return counts;
  }, [baseData, availableYears, isIncomplete]);

  // Quick filter counts (computed on year-filtered data for badge counts)
  const quickFilterCounts = useMemo(() => {
    return {
      overdueRates: yearFilteredData.filter(s => s.installments.some(i => i.status === 'overdue')).length,
      missingContract: yearFilteredData.filter(s => !s.contract || s.contract.status === 'draft').length,
      noCoach: yearFilteredData.filter(s => !s.coach_name && s.service_category === 'Coaching').length,
      noPriceQuote: yearFilteredData.filter(s => s.installments.length === 0 && s.status !== 'completed').length,
    };
  }, [yearFilteredData]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...yearFilteredData];

    // Quick filter
    if (quickFilter === 'overdueRates') {
      data = data.filter(s => s.installments.some(i => i.status === 'overdue'));
    } else if (quickFilter === 'missingContract') {
      data = data.filter(s => !s.contract || s.contract.status === 'draft');
    } else if (quickFilter === 'noCoach') {
      data = data.filter(s => !s.coach_name && s.service_category === 'Coaching');
    } else if (quickFilter === 'noPriceQuote') {
      data = data.filter(s => s.installments.length === 0 && s.status !== 'completed');
    }
    
    if (searchQuery) {
      data = data.filter(item => 
        item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.coach_name && item.coach_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (filterStatus !== 'all') {
      data = data.filter(item => item.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      data = data.filter(item => item.service_name === filterCategory);
    }
    if (filterCoach !== 'all') {
      data = data.filter(item => item.coach_name === filterCoach);
    }
    
    if (sortColumn) {
      data.sort((a, b) => {
        if (sortColumn === 'nextDue') {
          const aDate = getNextDueDate(a) || '9999-12-31';
          const bDate = getNextDueDate(b) || '9999-12-31';
          if (aDate < bDate) return sortDirection === 'asc' ? -1 : 1;
          if (aDate > bDate) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortColumn === 'compenso') {
          const aV = a.coach_fee || 0;
          const bV = b.coach_fee || 0;
          return sortDirection === 'asc' ? aV - bV : bV - aV;
        }
        if (sortColumn === 'dataNotula') {
          const aD = getPayoutDocumentDate(a.coach_payout) || '9999-12-31';
          const bD = getPayoutDocumentDate(b.coach_payout) || '9999-12-31';
          if (aD < bD) return sortDirection === 'asc' ? -1 : 1;
          if (aD > bD) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortColumn === 'scad45gg') {
          const aIssueDate = getPayoutIssueDate(a.coach_payout);
          const bIssueDate = getPayoutIssueDate(b.coach_payout);
          const aD = aIssueDate ? new Date(aIssueDate).getTime() + (45 * 24 * 60 * 60 * 1000) : Number.MAX_SAFE_INTEGER;
          const bD = bIssueDate ? new Date(bIssueDate).getTime() + (45 * 24 * 60 * 60 * 1000) : Number.MAX_SAFE_INTEGER;
          if (aD < bD) return sortDirection === 'asc' ? -1 : 1;
          if (aD > bD) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortColumn === 'statoNotula') {
          const order: Record<NotulaWorkflowStatus, number> = { da_programmare: 0, creata: 1, da_pagare: 2, pagata: 3 };
          const aV = order[resolveNotulaStatus(a.coach_payout)];
          const bV = order[resolveNotulaStatus(b.coach_payout)];
          return sortDirection === 'asc' ? aV - bV : bV - aV;
        }
        let aVal: any = a[sortColumn as keyof StudentService];
        let bVal: any = b[sortColumn as keyof StudentService];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return data;
  }, [sortColumn, sortDirection, filterStatus, filterCategory, filterCoach, searchQuery, yearFilteredData, quickFilter, getNextDueDate]);

  // ─── Monthly grouping ─────────────────────────────────────
  const monthGroups = useMemo((): MonthGroup[] => {
    const groupMap = new Map<string, StudentService[]>();
    
    // Sort by created_at descending (most recent month first)
    const sorted = [...filteredAndSortedData];
    
    sorted.forEach(s => {
      const monthKey = s.created_at.slice(0, 7); // "2026-01"
      if (!groupMap.has(monthKey)) groupMap.set(monthKey, []);
      groupMap.get(monthKey)!.push(s);
    });

    // Sort month keys descending
    const keys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

    return keys.map(key => {
      const services = groupMap.get(key)!;
      const [yearStr, monthStr] = key.split('-');
      const monthIdx = parseInt(monthStr) - 1;
      const label = `${MONTH_NAMES_IT[monthIdx]} ${yearStr}`;
      
      const totalLordo = services.reduce((sum, s) => sum + getServiceLordo(s), 0);
      const totalNetto = Math.round(services.reduce((sum, s) => sum + getServiceNet(s), 0));
      const totalIncassato = services.reduce((sum, s) => sum + s.installments.filter(i => i.status === 'paid').reduce((si, i) => si + i.amount, 0), 0);
      const totalCoachFees = services.reduce((sum, s) => sum + (s.coach_fee || 0), 0);
      const overdueCount = services.reduce((count, s) => count + s.installments.filter(i => i.status === 'overdue').length, 0);

      return { key, label, services, totalLordo, totalNetto, totalIncassato, totalCoachFees, overdueCount };
    });
  }, [filteredAndSortedData, getServiceLordo, getServiceNet]);

  const handleMouseDown = (columnKey: string, e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Column resize handle (normalized pattern)
  const resizeHandle = (key: string) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        cursor: 'col-resize',
        borderRight: '2px solid var(--border)',
        transition: 'border-color 0.15s ease',
      }}
      onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(key, e); }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--primary)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--border)'; }}
    />
  );

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = [];
  if (filterStatus !== 'all') {
    const statusLabels: Record<string, string> = {
      'active': 'Attivo',
      'paused': 'In pausa',
      'completed': 'Completato',
      'cancelled': 'Annullato',
      'expired': 'Scaduto',
    };
    activeFilters.push({
      label: `Stato: ${statusLabels[filterStatus]}`,
      value: filterStatus,
      onRemove: () => setFilterStatus('all')
    });
  }
  if (filterCategory !== 'all') {
    activeFilters.push({
      label: `Tipo Servizio: ${filterCategory}`,
      value: filterCategory,
      onRemove: () => setFilterCategory('all')
    });
  }
  if (filterCoach !== 'all') {
    activeFilters.push({
      label: `Coach: ${filterCoach}`,
      value: filterCoach,
      onRemove: () => setFilterCoach('all')
    });
  }

  // ─── Status mapping normalizzato ──────────────────────────
  const SERVICE_STATUS_MAP: Record<ServiceStatus, StatusType> = {
    active: 'active',
    paused: 'warning',
    completed: 'completed',
    cancelled: 'inactive',
    expired: 'blocked',
  };

  const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
    active: 'Attivo',
    paused: 'In pausa',
    completed: 'Completato',
    cancelled: 'Annullato',
    expired: 'Scaduto',
  };

  const getStatusBadge = (status: ServiceStatus) => (
    <StatusBadge status={SERVICE_STATUS_MAP[status]} label={SERVICE_STATUS_LABELS[status]} />
  );

  // ─── Bulk selection handlers ────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedData.map(s => s.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Attiva',
      icon: <CheckCircle size={16} />,
      onClick: (ids) => {
        ids.forEach(id => {
          updateService(id, s => ({
            ...s,
            status: 'active' as ServiceStatus,
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString(),
          }));
        });
        toast.success(`${ids.length} servizi attivati`);
        setSelectedIds([]);
      },
      variant: 'default',
    },
    {
      label: 'Sospendi',
      icon: <PauseCircle size={16} />,
      onClick: (ids) => {
        ids.forEach(id => {
          updateService(id, s => ({
            ...s,
            status: 'paused' as ServiceStatus,
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString(),
          }));
        });
        toast.success(`${ids.length} servizi sospesi`);
        setSelectedIds([]);
      },
      variant: 'secondary',
    },
    {
      label: 'Esporta CSV',
      icon: <Download size={16} />,
      onClick: (ids) => {
        const selected = filteredAndSortedData.filter(s => ids.includes(s.id));
        const csv = ['ID,Studente,Servizio,Coach,Stato,Importo,Creato il'].concat(
          selected.map((s) => {
            const totalPrice = s.installments.reduce((sum, installment) => sum + installment.amount, 0);
            return `${s.id},${s.student_name},${s.service_name},${s.coach_name || ''},${SERVICE_STATUS_LABELS[s.status]},€${totalPrice},${s.created_at}`;
          })
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `servizi-studenti-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success(`${ids.length} servizi esportati`);
        setSelectedIds([]);
      },
      variant: 'secondary',
    },
    {
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      variant: 'destructive',
      onClick: (ids) => {
        ids.forEach(id => {
          updateService(id, s => ({
            ...s,
            status: 'cancelled' as ServiceStatus,
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString(),
          }));
        });
        toast.success(`${ids.length} servizi cancellati`);
        setSelectedIds([]);
      },
    },
  ];

  const inlineSelectStyle: CSSProperties = {
    padding: '0.25rem 0.375rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'auto' as any,
  };

  const inlineInputStyle: CSSProperties = {
    padding: '0.125rem 0.375rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--primary)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    outline: 'none',
  };

  // ─── Compensi coach helpers ────────────────────────────────
  const NOTULA_STATUS_MAP: Record<NotulaWorkflowStatus, StatusType> = {
    da_programmare: 'inactive',
    creata: 'warning',
    da_pagare: 'active',
    pagata: 'completed',
  };

  const NOTULA_STATUS_LABELS: Record<NotulaWorkflowStatus, string> = {
    da_programmare: 'Da programmare',
    creata: 'Creata',
    da_pagare: 'Da pagare',
    pagata: 'Pagata',
  };

  const getNotulaStatusBadge = (status: NotulaWorkflowStatus) => (
    <StatusBadge status={NOTULA_STATUS_MAP[status]} label={NOTULA_STATUS_LABELS[status]} />
  );

  const computeScad45gg = (payout?: Partial<CoachPayout>): { date: string; daysLeft: number } | null => {
    const issueDate = getPayoutIssueDate(payout);
    if (!issueDate) return null;
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 45);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { date: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), daysLeft };
  };
  const formatDateIT = (dateStr?: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatDateTimeIT = (dateTime?: string): string => {
    if (!dateTime) return '—';
    const normalized = dateTime.includes(' ') && !dateTime.includes('T')
      ? dateTime.replace(' ', 'T')
      : dateTime;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return dateTime;
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const updatePayoutField = (serviceId: string, field: Partial<CoachPayout>) => {
    updateService(serviceId, s => ({
      ...s,
      coach_payout: (() => {
        const current = s.coach_payout || createDefaultCoachPayout(serviceId);
        const nextDocumentType = field.document_type ?? current.document_type ?? 'notula';
        const merged: CoachPayout = {
          ...current,
          ...field,
          sent_manually: (('notula_issue_date' in field && !field.notula_issue_date) || ('invoice_date' in field && !field.invoice_date))
            ? false
            : (current.sent_manually ?? false),
        };

        if (nextDocumentType === 'fattura') {
          merged.notula_issue_date = undefined;
          merged.notula_sent_date = undefined;
          merged.notula_number = undefined;
        } else {
          merged.invoice_date = undefined;
          merged.invoice_status = 'da_ricevere';
        }

        return withSyncedNotulaStatus(merged);
      })(),
      updated_by: CURRENT_ADMIN,
      updated_at: new Date().toISOString(),
    }));
  };

  const inlineLabelStyle: CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    fontWeight: 'var(--font-weight-medium)' as any,
    color: 'var(--muted-foreground)',
    marginBottom: '0.25rem',
    lineHeight: '1.5',
  };

  const getLavorazioneLink = (service: StudentService): { label: string; path: string } | null => {
    switch (service.service_category) {
      case 'Coaching':
        return { label: 'Timeline', path: `/coaching/timeline?highlight=${service.id}` };
      case 'Check plagio/AI':
        return service.check_job
          ? { label: 'Job', path: `/sottocheck/job?highlight=${service.id}` }
          : null;
      case 'Starter Pack':
        return null;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Lavorazioni</h1>
          <p className="page-subtitle">Centro operativo — gestione servizi e compensi coach</p>
        </div>
      </div>

      {/* ─── Vista Tabs ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '1.25rem',
        borderBottom: '2px solid var(--border)',
      }}>
        {(['lavorazioni', 'compensi'] as Vista[]).map(vista => {
          const isActive = activeVista === vista;
          return (
            <button
              key={vista}
              onClick={() => { setActiveVista(vista); setSelectedIds([]); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.625rem 1.25rem',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                borderRadius: '0',
                background: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                lineHeight: '1.5',
                transition: 'border-color 0.15s ease, color 0.15s ease',
                marginBottom: '-2px',
              }}
            >
              {VISTA_LABELS[vista]}
            </button>
          );
        })}
      </div>

      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per studente, servizio, ID o coach..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
          <button className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            Cerca
          </button>
        </div>
        <div className="action-toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => setShowAssignPanel(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Plus size={18} />
            Nuova lavorazione
          </button>
        </div>
      </div>

      {/* ─── Drawer Nuova Lavorazione (componente) ─── */}
      <CreateLavorazioneDrawer
        open={showAssignPanel}
        onOpenChange={setShowAssignPanel}
      />

      {/* ─── Year Tabs ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0',
      }}>
        {availableYears.map(year => {
          const isActive = selectedYear === year;
          const incompleteCount = yearIncompleteCounts[year] || 0;
          return (
            <button
              key={year}
              onClick={() => setSelectedYear(isActive ? 'all' : year)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                border: '2px solid transparent',
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: isActive ? 'var(--primary)' : 'transparent',
                borderRadius: '0',
                background: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                lineHeight: '1.5',
                transition: 'border-color 0.15s ease, color 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              {year}
              {incompleteCount > 0 && (
                <span style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-bold)',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: 'var(--chart-3)',
                  borderRadius: '999px',
                  padding: '0 0.375rem',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '18px',
                }}>
                  {incompleteCount}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setSelectedYear('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            border: '2px solid transparent',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: selectedYear === 'all' ? 'var(--primary)' : 'transparent',
            borderRadius: '0',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: selectedYear === 'all' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: selectedYear === 'all' ? 'var(--foreground)' : 'var(--muted-foreground)',
            cursor: 'pointer',
            lineHeight: '1.5',
            transition: 'border-color 0.15s ease, color 0.15s ease',
            marginBottom: '-1px',
          }}
        >
          Tutti
          <span style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            lineHeight: '18px',
          }}>
            {baseData.length}
          </span>
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="filter-container">
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Tipo Servizio
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Tutte</option>
            {SERVICE_CATALOG.map(service => (
              <option key={service.id} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Coach
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}>
            <option value="all">Tutti</option>
            {uniqueCoaches.map(coach => (
              <option key={coach} value={coach}>{coach}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Stato Servizio
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="active">Attivo</option>
            <option value="paused">In pausa</option>
            <option value="completed">Completato</option>
            <option value="cancelled">Annullato</option>
            <option value="expired">Scaduto</option>
          </select>
        </div>

        {/* Reset filtri */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('all');
              setFilterCategory('all');
              setFilterCoach('all');
              setQuickFilter(null);
            }}
            style={{ height: 'fit-content' }}
          >
            Reset filtri
          </button>
        </div>
      </div>

      {/* Filtri attivi */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
            Filtri attivi:
          </span>
          {activeFilters.map((filter, idx) => (
            <button
              key={idx}
              onClick={filter.onRemove}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', cursor: 'pointer' }}
            >
              {filter.label}
              <X size={14} />
            </button>
          ))}
          <button 
            onClick={() => { 
              setFilterStatus('all'); 
              setFilterCategory('all');
              setFilterCoach('all');
              setQuickFilter(null);
            }} 
            className="btn btn-secondary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}
          >
            Rimuovi tutti
          </button>
        </div>
      )}

      {/* ─── Quick filter chips ────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--muted-foreground)',
          marginRight: '0.25rem',
        }}>
          Azioni richieste:
        </span>
        {([
          { key: 'overdueRates', label: 'Rate scadute', count: quickFilterCounts.overdueRates, color: 'var(--destructive-foreground)', bgActive: 'rgba(239, 68, 68, 0.08)', bgBadge: 'rgba(239, 68, 68, 0.15)' },
          { key: 'missingContract', label: 'Contratto mancante', count: quickFilterCounts.missingContract, color: 'var(--chart-3)', bgActive: 'rgba(251, 191, 36, 0.08)', bgBadge: 'rgba(251, 191, 36, 0.15)' },
          { key: 'noCoach', label: 'Senza coach', count: quickFilterCounts.noCoach, color: 'var(--chart-3)', bgActive: 'rgba(251, 191, 36, 0.08)', bgBadge: 'rgba(251, 191, 36, 0.15)' },
          { key: 'noPriceQuote', label: 'Preventivo da fare', count: quickFilterCounts.noPriceQuote, color: 'var(--muted-foreground)', bgActive: 'rgba(113, 118, 128, 0.08)', bgBadge: 'rgba(113, 118, 128, 0.15)' },
        ] as const).map(chip => (
          <button
            key={chip.key}
            onClick={() => setQuickFilter(quickFilter === chip.key ? null : chip.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-badge)',
              border: quickFilter === chip.key ? `1.5px solid ${chip.color}` : '1px solid var(--border)',
              background: quickFilter === chip.key ? chip.bgActive : 'var(--card)',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              color: chip.count > 0 ? chip.color : 'var(--muted-foreground)',
              cursor: 'pointer',
              opacity: chip.count === 0 ? 0.5 : 1,
              lineHeight: '1.5',
            }}
            disabled={chip.count === 0}
          >
            {chip.label}
            <span style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-bold)',
              background: chip.count > 0 ? chip.bgBadge : 'var(--muted)',
              color: chip.count > 0 ? chip.color : 'var(--muted-foreground)',
              borderRadius: '999px',
              padding: '0 0.375rem',
              minWidth: '18px',
              textAlign: 'center',
              lineHeight: '18px',
            }}>
              {chip.count}
            </span>
          </button>
        ))}
        {quickFilter && (
          <button
            onClick={() => setQuickFilter(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              lineHeight: '1.5',
            }}
          >
            <X size={12} />
            Rimuovi
          </button>
        )}
      </div>

      {/* ─── Summary cards (vista-aware) ────────────────────────── */}
      {(() => {
        const totalLordo = filteredAndSortedData.reduce((sum, s) => sum + getServiceLordo(s), 0);
        const totalNetto = Math.round(filteredAndSortedData.reduce((sum, s) => sum + getServiceNet(s), 0));
        const totalIncassato = filteredAndSortedData.reduce((sum, s) => sum + s.installments.filter(i => i.status === 'paid').reduce((si, i) => si + i.amount, 0), 0);
        const totalOverdue = filteredAndSortedData.reduce((count, s) => count + s.installments.filter(i => i.status === 'overdue').length, 0);
        const totalNoCoach = filteredAndSortedData.filter(s => !s.coach_name && s.service_category === 'Coaching').length;
        const totalCoachFees = filteredAndSortedData.reduce((sum, s) => sum + (s.coach_fee || 0), 0);
        const totalDaIncassare = totalLordo - totalIncassato;

        const activeCoachCount = filteredAndSortedData.filter(s => s.status === 'active' && s.coach_name).length;
        const totalCompensiDovuti = filteredAndSortedData
          .filter(s => s.status === 'active' && s.coach_name)
          .reduce((sum, s) => sum + (s.coach_fee || 0), 0);
        const totalCompensiPagati = filteredAndSortedData
          .filter(s => s.status === 'active' && s.coach_name && s.coach_payout?.status === 'paid')
          .reduce((sum, s) => sum + (s.coach_fee || 0), 0);

        const statCard = (highlight?: string): CSSProperties => ({
          flex: '1 1 140px', minWidth: '140px', padding: '0.75rem 1rem',
          background: 'var(--card)', border: highlight ? `2px solid ${highlight}` : '1px solid var(--border)', borderRadius: 'var(--radius)',
        });
        const statLabel: CSSProperties = {
          fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: '0.25rem', lineHeight: '1.5',
        };
        const statVal = (c?: string): CSSProperties => ({
          fontFamily: 'var(--font-alegreya)', fontSize: '20px', fontWeight: 'var(--font-weight-bold)',
          color: c || 'var(--foreground)', lineHeight: '1.2',
        });

        return (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={statCard()}>
              <div style={statLabel}>Lavorazioni attive{quickFilter || filterStatus !== 'all' || filterCategory !== 'all' ? ' (filtrate)' : ''}</div>
              <div style={statVal()}>{filteredAndSortedData.filter(s => s.status === 'active').length}</div>
            </div>

            {activeVista === 'lavorazioni' && (
              <div style={statCard()}>
                <div style={statLabel}>Totale lordo</div>
                <div style={statVal()}>€{totalLordo.toLocaleString('it-IT')}</div>
              </div>
            )}
            {activeVista === 'lavorazioni' && (
              <div style={statCard()}>
                <div style={statLabel}>Totale netto</div>
                <div style={statVal()}>€{totalNetto.toLocaleString('it-IT')}</div>
              </div>
            )}
            {activeVista === 'lavorazioni' && (
              <div style={statCard()}>
                <div style={statLabel}>Incassato</div>
                <div style={statVal(totalIncassato > 0 ? 'var(--primary)' : 'var(--muted-foreground)')}>€{totalIncassato.toLocaleString('it-IT')}</div>
              </div>
            )}
            {activeVista === 'lavorazioni' && (
              <div style={statCard(totalDaIncassare > 0 ? 'var(--chart-3)' : undefined)}>
                <div style={statLabel}>Da incassare</div>
                <div style={statVal(totalDaIncassare > 0 ? 'var(--chart-3)' : 'var(--muted-foreground)')}>€{totalDaIncassare.toLocaleString('it-IT')}</div>
              </div>
            )}
            {activeVista === 'lavorazioni' && totalOverdue > 0 && (
              <div style={statCard('var(--destructive-foreground)')}>
                <div style={statLabel}>Rate scadute</div>
                <div style={statVal('var(--destructive-foreground)')}>{totalOverdue}</div>
              </div>
            )}
            {activeVista === 'lavorazioni' && totalNoCoach > 0 && (
              <div style={statCard('var(--chart-3)')}>
                <div style={statLabel}>Senza coach</div>
                <div style={statVal('var(--chart-3)')}>{totalNoCoach}</div>
              </div>
            )}
            {activeVista === 'compensi' && (
              <div style={statCard()}>
                <div style={statLabel}>Coach attivi</div>
                <div style={statVal()}>{activeCoachCount}</div>
              </div>
            )}
            {activeVista === 'compensi' && (
              <div style={statCard()}>
                <div style={statLabel}>Totale compensi dovuti</div>
                <div style={statVal()}>€{totalCompensiDovuti.toLocaleString('it-IT')}</div>
              </div>
            )}
            {activeVista === 'compensi' && (
              <div style={statCard(totalCompensiPagati > 0 ? 'var(--primary)' : undefined)}>
                <div style={statLabel}>Totale compensi pagati</div>
                <div style={statVal(totalCompensiPagati > 0 ? 'var(--primary)' : 'var(--muted-foreground)')}>€{totalCompensiPagati.toLocaleString('it-IT')}</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Table */}
      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1450px">
            <thead>
              <TableRow>
                {visibleCols.has('checkbox') && (
                  <TableSelectionHeaderCell
                    width={columnWidths.checkbox}
                    checked={
                      selectedIds.length === 0
                        ? false
                        : selectedIds.length === filteredAndSortedData.length
                        ? true
                        : 'indeterminate'
                    }
                    onCheckedChange={handleSelectAll}
                  />
                )}
                <TableHeaderBaseCell style={{ width: `${columnWidths.coach}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('coach') }} onClick={() => handleSort('coach_name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Coach</span>
                    {getSortIcon('coach_name')}
                  </div>
                  {resizeHandle('coach')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.student}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('student') }} onClick={() => handleSort('student_name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Studente</span>
                    {getSortIcon('student_name')}
                  </div>
                  {resizeHandle('student')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.coachName}px`, position: 'relative', userSelect: 'none', ...colVis('coachName') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Coach</span>
                  </div>
                  {resizeHandle('coachName')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.status}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('status') }} onClick={() => handleSort('status')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Stato</span>
                    {getSortIcon('status')}
                  </div>
                  {resizeHandle('status')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.createdAt}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('createdAt') }} onClick={() => handleSort('plan_start_date')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Inizio piano</span>
                    {getSortIcon('plan_start_date')}
                  </div>
                  {resizeHandle('createdAt')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.expiresAt}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('expiresAt') }} onClick={() => handleSort('plan_end_date')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Scadenza piano</span>
                    {getSortIcon('plan_end_date')}
                  </div>
                  {resizeHandle('expiresAt')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.servizio}px`, position: 'relative', userSelect: 'none', ...colVis('servizio') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Servizio</span>
                  </div>
                  {resizeHandle('servizio')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.rate}px`, position: 'relative', userSelect: 'none', ...colVis('rate') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Rate</span>
                  </div>
                  {resizeHandle('rate')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.contratto}px`, position: 'relative', userSelect: 'none', ...colVis('contratto') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Contratto</span>
                  </div>
                  {resizeHandle('contratto')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.fattura}px`, position: 'relative', userSelect: 'none', ...colVis('fattura') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>N. Fattura</span>
                  </div>
                  {resizeHandle('fattura')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.netto}px`, position: 'relative', userSelect: 'none', ...colVis('netto') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Netto</span>
                  </div>
                  {resizeHandle('netto')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.lordo}px`, position: 'relative', userSelect: 'none', ...colVis('lordo') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Lordo</span>
                  </div>
                  {resizeHandle('lordo')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.incassato}px`, position: 'relative', userSelect: 'none', ...colVis('incassato') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Incassato</span>
                  </div>
                  {resizeHandle('incassato')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.coachCompenso}px`, position: 'relative', userSelect: 'none', ...colVis('coachCompenso') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Comp. Coach</span>
                  </div>
                  {resizeHandle('coachCompenso')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.nextDue}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('nextDue') }} onClick={() => handleSort('nextDue')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Prossima rata</span>
                    {getSortIcon('nextDue')}
                  </div>
                  {resizeHandle('nextDue')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.statoLav}px`, position: 'relative', userSelect: 'none', ...colVis('statoLav') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Stato lav.</span>
                  </div>
                  {resizeHandle('statoLav')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.compenso}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('compenso') }} onClick={() => handleSort('compenso')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Compenso</span>
                    {getSortIcon('compenso')}
                  </div>
                  {resizeHandle('compenso')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.dataNotula}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('dataNotula') }} onClick={() => handleSort('dataNotula')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Data invio/emissione</span>
                    {getSortIcon('dataNotula')}
                  </div>
                  {resizeHandle('dataNotula')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.scad45gg}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('scad45gg') }} onClick={() => handleSort('scad45gg')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Scad. 45gg</span>
                    {getSortIcon('scad45gg')}
                  </div>
                  {resizeHandle('scad45gg')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.statoNotula}px`, position: 'relative', cursor: 'pointer', userSelect: 'none', ...colVis('statoNotula') }} onClick={() => handleSort('statoNotula')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Status</span>
                    {getSortIcon('statoNotula')}
                  </div>
                  {resizeHandle('statoNotula')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.pagatoIl}px`, position: 'relative', userSelect: 'none', ...colVis('pagatoIl') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Pagato il</span>
                  </div>
                  {resizeHandle('pagatoIl')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.rifPag}px`, position: 'relative', userSelect: 'none', ...colVis('rifPag') }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Rif. pag.</span>
                  </div>
                  {resizeHandle('rifPag')}
                </TableHeaderBaseCell>
                <TableHeaderBaseCell style={{ width: `${columnWidths.notes}px`, position: 'relative', userSelect: 'none', textAlign: 'center', ...colVis('notes') }}>
                  <span>Note</span>
                  {resizeHandle('notes')}
                </TableHeaderBaseCell>
                {visibleCols.has('actions') && <TableHeaderActionCell width={columnWidths.actions} />}
              </TableRow>
            </thead>
              {/* ─── Monthly grouped rendering ──────────────────── */}
              {monthGroups.flatMap((group) => [
                  <tbody key={`month-header-${group.key}`}>
                    <TableRow style={{ backgroundColor: 'var(--muted)', borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <TableCell colSpan={['checkbox','id','coach','student','status','createdAt','expiresAt','servizio','rate','contratto','fattura'].filter(c => visibleCols.has(c)).length} style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            {group.label}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            color: 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {group.services.length} {group.services.length === 1 ? 'lavorazione' : 'lavorazioni'}
                          </span>
                          {group.overdueCount > 0 && (
                            <span style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-bold)',
                              color: 'var(--destructive-foreground)',
                              backgroundColor: 'var(--destructive)',
                              borderRadius: '999px',
                              padding: '0 0.375rem',
                              lineHeight: '18px',
                            }}>
                              {group.overdueCount} scadute
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5', ...colVis('netto') }}>
                        {activeVista === 'lavorazioni' && `€${group.totalNetto.toLocaleString('it-IT')}`}
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5', ...colVis('lordo') }}>
                        {activeVista === 'lavorazioni' && `€${group.totalLordo.toLocaleString('it-IT')}`}
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: group.totalIncassato > 0 ? 'var(--primary)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('incassato') }}>
                        {activeVista === 'lavorazioni' && `€${group.totalIncassato.toLocaleString('it-IT')}`}
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: group.totalCoachFees > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('coachCompenso') }}>
                        {activeVista === 'lavorazioni' && `€${group.totalCoachFees.toLocaleString('it-IT')}`}
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('nextDue') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('coachName') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('statoLav') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: group.totalCoachFees > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('compenso') }}>
                        {activeVista === 'compensi' && `€${group.totalCoachFees.toLocaleString('it-IT')}`}
                      </TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('dataNotula') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('scad45gg') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('statoNotula') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('pagatoIl') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('rifPag') }}></TableCell>
                      <TableCell style={{ padding: '0.5rem 0.25rem', ...colVis('notes') }}></TableCell>
                      <TableCell style={{ position: 'sticky', right: 0, backgroundColor: 'var(--muted)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)' }}></TableCell>
                    </TableRow>
                  </tbody>,
              ...group.services.map((service) => {
                const lordo = getServiceLordo(service);
                const netto = getServiceNet(service);
                const hasCustomTaxRate = service.installments.some(inst => getInstallmentTaxRate(service, inst) !== 22);
                const paidCount = service.installments.filter(i => i.status === 'paid').length;
                const totalCount = service.installments.length;
                const hasOverdue = service.installments.some(i => i.status === 'overdue');
                const isExpanded = expandedRows.has(service.id);
                const isHighlighted = activeHighlightId === service.id;
                const rowIncomplete = isIncomplete(service);

                return (
                  <tbody key={service.id}>
                    <TableRow
                      rowRef={isHighlighted ? highlightRef : undefined}
                      className={isHighlighted ? 'row-highlight' : undefined}
                      onClick={() => handleRowClick(service.id)}
                      style={{
                        cursor: 'pointer',
                        ...(!isHighlighted && selectedIds.includes(service.id) ? {
                          backgroundColor: 'var(--selected-row-bg)',
                        } : !isHighlighted && detailDrawerServiceId === service.id ? {
                          backgroundColor: 'var(--selected-row-bg)',
                        } : undefined),
                      }}
                    >
                      {visibleCols.has('checkbox') && (
                        <TableSelectionCell
                          checked={selectedIds.includes(service.id)}
                          onCheckedChange={() => handleSelectRow(service.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <TableCell style={{ minWidth: columnWidths.coach, fontFamily: 'var(--font-inter)', ...colVis('coach') }}>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          {service.coach_name || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                        </div>
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.student, ...colVis('student') }}>
                        <div style={{ fontFamily: 'var(--font-inter)' }}>
                          {activeVista === 'compensi' ? (
                            <>
                              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.student_name}</div>
                              <div style={{ fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {rowIncomplete && <span title="Setup incompleto" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--chart-3)', flexShrink: 0 }} />}
                                {service.id}
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.student_name}</div>
                              <div style={{ fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{service.service_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7 }}>
                                {rowIncomplete && <span title="Setup incompleto" style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--chart-3)', flexShrink: 0 }} />}
                                {service.id}
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.coachName, fontFamily: 'var(--font-inter)', ...colVis('coachName') }}>
                        <SmartCoachSelect
                          value={service.coach_name || ''}
                          onChange={(val) => updateCoachName(service.id, val)}
                          areaTematica={service.area_tematica}
                          style={{ ...inlineSelectStyle, fontSize: 'var(--text-label)', padding: '0.25rem 0.375rem', maxWidth: '130px', color: service.coach_name ? 'var(--foreground)' : 'var(--destructive-foreground)', fontWeight: 'var(--font-weight-medium)' }}
                          title="Cambia coach"
                          emptyLabel="Nessun coach"
                        />
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.status, ...colVis('status') }}>
                        {getStatusBadge(service.status)}
                        {service.status === 'paused' && (
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5', marginTop: '0.125rem' }}>
                            {service.pause_start_date ? (
                              <>
                                {service.pause_start_date}
                                {service.pause_end_date ? ` → ${service.pause_end_date}` : ' → in corso'}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Date pausa N/D</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.createdAt, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('createdAt') }}>
                        {service.service_category === 'Check plagio/AI' ? (
                          <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                        ) : editingPlanStart === service.id ? (
                          <input
                            type="date"
                            value={planStartInput}
                            onChange={(e) => setPlanStartInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && planStartInput) updatePlanStart(service.id, planStartInput);
                              if (e.key === 'Escape') setEditingPlanStart(null);
                            }}
                            onBlur={() => {
                              if (planStartInput) updatePlanStart(service.id, planStartInput);
                              else setEditingPlanStart(null);
                            }}
                            style={{ width: '120px', ...inlineInputStyle }}
                          />
                        ) : (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: service.plan_start_date ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                            onClick={() => { setEditingPlanStart(service.id); setPlanStartInput(service.plan_start_date || ''); }}
                            title="Clicca per modificare inizio piano"
                          >
                            <span>{service.plan_start_date ? formatDateIT(service.plan_start_date) : 'N/D'}</span>
                            <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.expiresAt, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('expiresAt') }}>
                        {service.service_category === 'Check plagio/AI' ? (
                          <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                        ) : editingExpiresAt === service.id ? (
                          <input
                            type="date"
                            value={expiresAtInput}
                            onChange={(e) => setExpiresAtInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && expiresAtInput) updateContractExpiry(service.id, expiresAtInput);
                              if (e.key === 'Escape') setEditingExpiresAt(null);
                            }}
                            onBlur={() => {
                              if (expiresAtInput) updateContractExpiry(service.id, expiresAtInput);
                              else setEditingExpiresAt(null);
                            }}
                            style={{ width: '120px', ...inlineInputStyle }}
                          />
                        ) : (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: service.plan_end_date ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                            onClick={() => { setEditingExpiresAt(service.id); setExpiresAtInput(service.plan_end_date || ''); }}
                            title="Clicca per modificare scadenza piano"
                          >
                            <span>{service.plan_end_date ? formatDateIT(service.plan_end_date) : 'N/D'}</span>
                            <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.servizio, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', ...colVis('servizio') }}>
                        {service.service_name}
                      </TableCell>
                      <TableCell onClick={(e) => { e.stopPropagation(); toggleRowExpand(service.id); }} style={{ minWidth: columnWidths.rate, cursor: 'pointer', ...colVis('rate') }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: hasOverdue ? 'var(--destructive-foreground)' : paidCount === totalCount ? 'var(--primary)' : 'var(--foreground)' }}>
                            {paidCount}/{totalCount}
                          </span>
                          {hasOverdue && <AlertTriangle size={12} style={{ color: 'var(--destructive-foreground)' }} />}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.contratto, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('contratto') }}>
                        {service.service_category === 'Check plagio/AI' ? (
                          <span style={{ color: 'var(--muted-foreground)' }}>N/A</span>
                        ) : (
                          <select
                            value={service.contract?.status || ''}
                            onChange={(e) => updateContractStatus(service.id, e.target.value as ContractStatus)}
                            style={{
                              ...inlineSelectStyle,
                              color: service.contract?.status === 'signed' ? 'var(--primary)' 
                                : service.contract?.status === 'draft' ? 'var(--chart-5)' 
                                : 'var(--destructive-foreground)',
                              fontWeight: 'var(--font-weight-medium)',
                              maxWidth: '90px',
                            }}
                          >
                            {!service.contract && <option value="">Mancante</option>}
                            <option value="draft">Bozza</option>
                            <option value="signed">Firmato</option>
                            <option value="cancelled">Annullato</option>
                          </select>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.fattura, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('fattura') }}>
                        {service.installments.length > 1 ? (
                          <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Multiple</span>
                        ) : editingInvoiceNumber === service.id ? (
                          (() => {
                            const saveSingleInvoice = () => {
                              const val = composeInvoiceNumber(invoiceNumInput, invoiceYearInput);
                              updateService(service.id, s => ({
                                ...s,
                                updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
                                invoice_number: val,
                                installments: s.installments.map((inst, idx) => idx === 0 ? { ...inst, invoice_number: val } : inst)
                              }));
                              setEditingInvoiceNumber(null);
                              if (val) toast.success('N. Fattura aggiornato');
                            };
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <input type="text" inputMode="numeric" value={invoiceNumInput}
                                  onChange={(e) => setInvoiceNumInput(e.target.value.replace(/\D/g, ''))}
                                  autoFocus placeholder="N."
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveSingleInvoice(); if (e.key === 'Escape') setEditingInvoiceNumber(null); }}
                                  onBlur={(e) => { if (e.relatedTarget?.getAttribute('data-invoice-year') === service.id) return; saveSingleInvoice(); }}
                                  style={{ width: '40px', textAlign: 'right', ...inlineInputStyle }}
                                />
                                <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-label)' }}>/</span>
                                <input type="text" inputMode="numeric" data-invoice-year={service.id} value={invoiceYearInput}
                                  onChange={(e) => setInvoiceYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveSingleInvoice(); if (e.key === 'Escape') setEditingInvoiceNumber(null); }}
                                  onBlur={() => saveSingleInvoice()}
                                  style={{ width: '42px', ...inlineInputStyle, color: 'var(--muted-foreground)' }}
                                />
                              </div>
                            );
                          })()
                        ) : (
                          (() => {
                            const currentInv = service.installments[0]?.invoice_number || service.invoice_number;
                            return (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: currentInv ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                                onClick={() => { const parsed = parseInvoiceNumber(currentInv); setEditingInvoiceNumber(service.id); setInvoiceNumInput(parsed.num); setInvoiceYearInput(parsed.year || deriveInvoiceYear(service.installments[0]?.dueDate)); }}
                                title="Clicca per modificare N. Fattura"
                              >
                                <span>{currentInv || '—'}</span>
                                <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                              </div>
                            );
                          })()
                        )}
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.netto, fontFamily: 'var(--font-inter)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', ...colVis('netto') }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span>€{netto.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          {hasCustomTaxRate && (
                            <span style={{
                              border: '1px solid var(--chart-3)',
                              color: 'var(--chart-3)',
                              borderRadius: '999px',
                              padding: '0 0.375rem',
                              fontSize: '10px',
                              lineHeight: '16px',
                              fontWeight: 'var(--font-weight-medium)',
                            }}>
                              aliquota custom
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.lordo, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('lordo') }}>
                        {editingLordo === service.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: 'var(--muted-foreground)' }}>€</span>
                            <input type="number" value={lordoInput} onChange={(e) => setLordoInput(e.target.value)} autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') { const val = Number(lordoInput); if (!isNaN(val) && val > 0) updateLordo(service.id, val, getServiceTaxRate(service)); } if (e.key === 'Escape') setEditingLordo(null); }}
                              onBlur={() => { const val = Number(lordoInput); if (!isNaN(val) && val > 0) updateLordo(service.id, val, getServiceTaxRate(service)); else setEditingLordo(null); }}
                              style={{ width: '70px', ...inlineInputStyle }}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                            onClick={() => { setEditingLordo(service.id); setLordoInput(String(lordo)); }}
                            title="Clicca per modificare il totale lordo"
                          >
                            <span>€{lordo.toLocaleString('it-IT')}</span>
                            <Pencil size={10} style={{ opacity: 0.5 }} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.incassato, fontFamily: 'var(--font-inter)', fontWeight: 'var(--font-weight-medium)', ...colVis('incassato') }}>
                        {(() => {
                          const incassato = service.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
                          return <span style={{ color: incassato > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>€{incassato.toLocaleString('it-IT')}</span>;
                        })()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.coachCompenso, fontFamily: 'var(--font-inter)', fontWeight: 'var(--font-weight-medium)', ...colVis('coachCompenso') }}>
                        {editingCoachFee === service.id && activeVista === 'lavorazioni' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ color: 'var(--muted-foreground)' }}>€</span>
                            <input type="number" value={coachFeeInput} onChange={(e) => setCoachFeeInput(e.target.value)} autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') { const val = Number(coachFeeInput); if (!isNaN(val) && val >= 0) updateCoachFee(service.id, val); } if (e.key === 'Escape') setEditingCoachFee(null); }}
                              onBlur={() => { const val = Number(coachFeeInput); if (!isNaN(val) && val >= 0) updateCoachFee(service.id, val); else setEditingCoachFee(null); }}
                              style={{ width: '70px', ...inlineInputStyle }}
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                            onClick={() => { setEditingCoachFee(service.id); setCoachFeeInput(String(service.coach_fee ?? '')); }}
                            title="Clicca per modificare compenso coach"
                          >
                            {service.coach_fee !== undefined ? (
                              <><span style={{ color: 'var(--foreground)' }}>€{service.coach_fee.toLocaleString('it-IT')}</span><Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} /></>
                            ) : (
                              <><span style={{ color: 'var(--muted-foreground)' }}>—</span><Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} /></>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ minWidth: columnWidths.nextDue, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('nextDue') }}>
                        {(() => {
                          const nextDue = getNextDueDate(service);
                          if (!nextDue) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
                          const today = new Date(); today.setHours(0,0,0,0);
                          const dueDate = new Date(nextDue); dueDate.setHours(0,0,0,0);
                          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          let color = 'var(--foreground)'; let label = '';
                          if (diffDays < 0) { color = 'var(--destructive-foreground)'; label = `${Math.abs(diffDays)}g fa`; }
                          else if (diffDays === 0) { color = 'var(--destructive-foreground)'; label = 'Oggi'; }
                          else if (diffDays <= 7) { color = 'var(--chart-3)'; label = `tra ${diffDays}g`; }
                          else { color = 'var(--muted-foreground)'; label = `tra ${diffDays}g`; }
                          return (
                            <div>
                              <div style={{ fontWeight: 'var(--font-weight-medium)', color }}>{nextDue}</div>
                              <div style={{ fontSize: '11px', color, lineHeight: '1.5' }}>{label}</div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      {/* Stato lav. */}
                      <TableCell style={{ minWidth: columnWidths.statoLav, ...colVis('statoLav') }}>
                        {getStatusBadge(service.status)}
                      </TableCell>
                      {/* Compenso — editabile */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.compenso, fontFamily: 'var(--font-inter)', ...colVis('compenso') }}>
                        {(() => {
                          const totalLordo = service.coach_payouts && service.coach_payouts.length > 0
                            ? service.coach_payouts.reduce((sum, p) => sum + (p.notula_amount || 0), 0)
                            : service.coach_fee;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {totalLordo !== undefined && totalLordo > 0 ? (
                                <span style={{ fontWeight: 'var(--font-weight-bold)' as any }}>€{totalLordo.toLocaleString('it-IT')}</span>
                              ) : (
                                <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      {/* Data invio notula / emissione fattura */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.dataNotula, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('dataNotula') }}>
                        {(() => {
                          const documentDate = getPayoutDocumentDate(service.coach_payout);
                          const isFattura = service.coach_payout?.document_type === 'fattura';
                          if (editingDataNotula === service.id) {
                            return (
                              <input
                                type="date"
                                value={dataNotulaInput}
                                onChange={(e) => setDataNotulaInput(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && dataNotulaInput) {
                                    updatePayoutField(service.id, isFattura ? { invoice_date: dataNotulaInput } : { notula_sent_date: dataNotulaInput });
                                    setEditingDataNotula(null);
                                  }
                                  if (e.key === 'Escape') setEditingDataNotula(null);
                                }}
                                onBlur={() => {
                                  if (dataNotulaInput) updatePayoutField(service.id, isFattura ? { invoice_date: dataNotulaInput } : { notula_sent_date: dataNotulaInput });
                                  setEditingDataNotula(null);
                                }}
                                style={{ width: '130px', ...inlineInputStyle }}
                              />
                            );
                          }
                          return (
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: documentDate ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                              onClick={() => { setEditingDataNotula(service.id); setDataNotulaInput(documentDate || ''); }}
                              title={`Clicca per modificare data ${isFattura ? 'emissione fattura' : 'invio notula'}`}
                            >
                              <span>{formatDateIT(documentDate)}</span>
                              <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                            </div>
                          );
                        })()}
                      </TableCell>
                      {/* Scad. 45gg */}
                      <TableCell style={{ minWidth: columnWidths.scad45gg, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('scad45gg') }}>
                        {(() => {
                          const scad = computeScad45gg(service.coach_payout);
                          if (!scad) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
                          const isWarning = scad.daysLeft <= 7 && scad.daysLeft > 0;
                          const isOverdue = scad.daysLeft <= 0;
                          const isPast = resolveNotulaStatus(service.coach_payout) === 'pagata';
                          return (
                            <span style={{ fontWeight: isOverdue && !isPast ? 'var(--font-weight-bold)' as any : undefined, color: isPast ? 'var(--foreground)' : isOverdue ? 'var(--destructive-foreground)' : isWarning ? 'var(--chart-3)' : 'var(--foreground)' }}>
                              {scad.date}
                              {!isPast && scad.daysLeft <= 14 && (
                                <span style={{ fontSize: '11px', color: isOverdue ? 'var(--destructive-foreground)' : 'var(--chart-3)', marginLeft: '0.125rem' }}>
                                  ({scad.daysLeft > 0 ? `-${scad.daysLeft}gg` : `+${Math.abs(scad.daysLeft)}gg`})
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </TableCell>
                      {/* Status documento */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.statoNotula, fontFamily: 'var(--font-inter)', ...colVis('statoNotula') }}>
                        {getNotulaStatusBadge(resolveNotulaStatus(service.coach_payout))}
                      </TableCell>
                      {/* Pagato il */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.pagatoIl, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('pagatoIl') }}>
                        {editingPagatoIl === service.id ? (
                          <input type="date" value={pagatoIlInput} onChange={(e) => setPagatoIlInput(e.target.value)} autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' && pagatoIlInput) { updatePayoutField(service.id, { paid_at: pagatoIlInput }); setEditingPagatoIl(null); } if (e.key === 'Escape') setEditingPagatoIl(null); }}
                            onBlur={() => { if (pagatoIlInput) updatePayoutField(service.id, { paid_at: pagatoIlInput }); setEditingPagatoIl(null); }}
                            style={{ width: '120px', ...inlineInputStyle }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: service.coach_payout?.paid_at ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                            onClick={() => { setEditingPagatoIl(service.id); setPagatoIlInput(service.coach_payout?.paid_at || ''); }}
                            title="Clicca per modificare"
                          >
                            <span>{formatDateIT(service.coach_payout?.paid_at)}</span>
                            <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                          </div>
                        )}
                      </TableCell>
                      {/* Rif. pag. */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.rifPag, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('rifPag') }}>
                        {editingRifPag === service.id ? (
                          <input type="text" value={rifPagInput} onChange={(e) => setRifPagInput(e.target.value)} autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') { updatePayoutField(service.id, { payment_reference: rifPagInput }); setEditingRifPag(null); } if (e.key === 'Escape') setEditingRifPag(null); }}
                            onBlur={() => { updatePayoutField(service.id, { payment_reference: rifPagInput }); setEditingRifPag(null); }}
                            style={{ width: '150px', ...inlineInputStyle }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', overflow: 'hidden', maxWidth: '160px' }}
                            onClick={() => { setEditingRifPag(service.id); setRifPagInput(service.coach_payout?.payment_reference || ''); }}
                            title={service.coach_payout?.payment_reference || 'Clicca per inserire'}
                          >
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: service.coach_payout?.payment_reference ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                              {service.coach_payout?.payment_reference || '—'}
                            </span>
                            <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
                          </div>
                        )}
                      </TableCell>
                      {/* Note admin */}
                      <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.notes, textAlign: 'center', ...colVis('notes') }}>
                        {(() => {
                          const noteCount = getNotesCount(service.id);
                          return (
                            <button
                              onClick={() => handleOpenNotesDrawer(service.id, `${service.student_name} — ${service.service_name}`)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0.25rem', color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}
                              title={`${noteCount} note`}
                            >
                              <StickyNote size={18} />
                              {noteCount > 0 && (
                                <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'var(--font-weight-medium)', fontFamily: 'var(--font-inter)' }}>
                                  {noteCount}
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </TableCell>
                      {/* Azioni */}
                      {visibleCols.has('actions') && (
                        <TableActionCell
                          width={columnWidths.actions}
                          backgroundColor="var(--background)"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TableActions actions={getServiceActions(service)} />
                        </TableActionCell>
                      )}
                    </TableRow>

                    {/* Expanded installments */}
                    {isExpanded && service.installments.map((inst, idx) => (
                      <TableRow key={inst.id} style={{ backgroundColor: inst.status === 'overdue' ? 'rgba(239, 68, 68, 0.04)' : 'var(--muted)' }}>
                        <TableCell style={{ minWidth: columnWidths.checkbox, ...colVis('checkbox') }}></TableCell>
                        <TableCell style={colVis('coach')}></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.student, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5', ...colVis('student') }}>
                          <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.125rem' }}>Rata {idx + 1}</div>
                          {editingDueDate === inst.id ? (
                            <input type="date" value={dueDateInput} onChange={(e) => setDueDateInput(e.target.value)} autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter' && dueDateInput) updateInstallmentDueDate(service.id, inst.id, dueDateInput); if (e.key === 'Escape') setEditingDueDate(null); }}
                              onBlur={() => { if (dueDateInput) updateInstallmentDueDate(service.id, inst.id, dueDateInput); else setEditingDueDate(null); }}
                              style={{ width: '130px', ...inlineInputStyle, fontSize: '11px' }}
                            />
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '11px' }}
                              onClick={() => { setEditingDueDate(inst.id); setDueDateInput(inst.dueDate); }}
                              title="Clicca per modificare scadenza rata"
                            >
                              <Calendar size={10} />
                              Scad. {formatDateIT(inst.dueDate)}
                              <Pencil size={9} style={{ opacity: 0.4 }} />
                            </span>
                          )}
                        </TableCell>
                        <TableCell style={colVis('coachName')}></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.status, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('status') }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => toggleInstallmentPaid(service.id, inst.id)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', background: inst.status === 'paid' ? 'rgba(11, 182, 63, 0.1)' : 'var(--card)', color: inst.status === 'paid' ? 'var(--primary)' : inst.status === 'overdue' ? 'var(--destructive-foreground)' : 'var(--muted-foreground)' }}
                            >
                              {inst.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {inst.status === 'paid' ? 'Pagata' : inst.status === 'overdue' ? 'Scaduta' : 'In attesa'}
                            </button>
                            {inst.payment ? (
                              editingPaymentDate === inst.id ? (
                                <input type="date" value={paymentDateInput} onChange={(e) => setPaymentDateInput(e.target.value)} autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter' && paymentDateInput) updatePaymentDate(service.id, inst.id, paymentDateInput); if (e.key === 'Escape') setEditingPaymentDate(null); }}
                                  onBlur={() => { if (paymentDateInput) updatePaymentDate(service.id, inst.id, paymentDateInput); else setEditingPaymentDate(null); }}
                                  style={{ width: '120px', ...inlineInputStyle, fontSize: '11px' }}
                                />
                              ) : (
                                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => { setEditingPaymentDate(inst.id); setPaymentDateInput(inst.payment!.paidAt); }}
                                  title="Clicca per modificare data pagamento"
                                >
                                  <Calendar size={10} />{formatDateIT(inst.payment.paidAt)}<Pencil size={9} style={{ opacity: 0.4 }} />
                                </span>
                              )
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell style={colVis('createdAt')}></TableCell>
                        <TableCell style={colVis('expiresAt')}></TableCell>
                        <TableCell style={{ ...colVis('servizio') }}></TableCell>
                        <TableCell style={{ minWidth: columnWidths.rate, ...colVis('rate') }}></TableCell>
                        <TableCell style={{ minWidth: columnWidths.contratto, ...colVis('contratto') }}></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.fattura, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('fattura') }}>
                          {editingInstInvoice === inst.id ? (
                            (() => {
                              const saveInstInvoice = () => { const val = composeInvoiceNumber(instInvoiceNumInput, instInvoiceYearInput); updateInstallmentInvoiceNumber(service.id, inst.id, val || ''); };
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <input type="text" inputMode="numeric" value={instInvoiceNumInput}
                                    onChange={(e) => setInstInvoiceNumInput(e.target.value.replace(/\D/g, ''))} autoFocus placeholder="N."
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveInstInvoice(); if (e.key === 'Escape') setEditingInstInvoice(null); }}
                                    onBlur={(e) => { if (e.relatedTarget?.getAttribute('data-inst-invoice-year') === inst.id) return; saveInstInvoice(); }}
                                    style={{ width: '32px', textAlign: 'right', ...inlineInputStyle, fontSize: '11px' }}
                                  />
                                  <span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>/</span>
                                  <input type="text" inputMode="numeric" data-inst-invoice-year={inst.id} value={instInvoiceYearInput}
                                    onChange={(e) => setInstInvoiceYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveInstInvoice(); if (e.key === 'Escape') setEditingInstInvoice(null); }}
                                    onBlur={() => saveInstInvoice()}
                                    style={{ width: '38px', ...inlineInputStyle, fontSize: '11px', color: 'var(--muted-foreground)' }}
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: inst.invoice_number ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                              onClick={() => { const parsed = parseInvoiceNumber(inst.invoice_number); setEditingInstInvoice(inst.id); setInstInvoiceNumInput(parsed.num); setInstInvoiceYearInput(parsed.year || deriveInvoiceYear(inst.dueDate)); }}
                              title="Clicca per modificare N. Fattura rata"
                            >
                              <span>{inst.invoice_number || '—'}</span>
                              <Pencil size={9} style={{ opacity: 0.4 }} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell style={{ minWidth: columnWidths.netto, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', ...colVis('netto') }}>
                          €{getInstallmentNet(service, inst).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} style={{ minWidth: columnWidths.lordo, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', ...colVis('lordo') }}>
                          {editingInstAmount === inst.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: 'var(--muted-foreground)' }}>€</span>
                              <input type="number" value={instAmountInput} onChange={(e) => setInstAmountInput(e.target.value)} autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { const val = Number(instAmountInput); if (!isNaN(val) && val > 0) updateInstallmentAmount(service.id, inst.id, val); } if (e.key === 'Escape') setEditingInstAmount(null); }}
                                onBlur={() => { const val = Number(instAmountInput); if (!isNaN(val) && val > 0) updateInstallmentAmount(service.id, inst.id, val); else setEditingInstAmount(null); }}
                                style={{ width: '65px', ...inlineInputStyle }}
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                              onClick={() => { setEditingInstAmount(inst.id); setInstAmountInput(String(inst.amount)); }}
                              title="Clicca per modificare importo lordo"
                            >
                              <span>€{inst.amount.toLocaleString('it-IT')}</span>
                              <Pencil size={10} style={{ opacity: 0.5 }} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell style={colVis('incassato')}></TableCell>
                        <TableCell style={colVis('coachCompenso')}></TableCell>
                        <TableCell style={colVis('nextDue')}></TableCell>
                        <TableCell style={colVis('statoLav')}></TableCell>
                        <TableCell style={colVis('compenso')}></TableCell>
                        <TableCell style={colVis('dataNotula')}></TableCell>
                        <TableCell style={colVis('scad45gg')}></TableCell>
                        <TableCell style={colVis('statoNotula')}></TableCell>
                        <TableCell style={colVis('pagatoIl')}></TableCell>
                        <TableCell style={colVis('rifPag')}></TableCell>
                        <TableCell style={colVis('notes')}></TableCell>
                        <TableCell style={{ position: 'sticky', right: 0, backgroundColor: inst.status === 'overdue' ? 'rgba(239, 68, 68, 0.04)' : 'var(--muted)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)', ...colVis('actions') }}></TableCell>
                      </TableRow>
                    ))}
                    {/* Totale incassato row */}
                    {isExpanded && service.installments.length > 0 && (() => {
                      const paidTotal = service.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
                      const paidNetto = getPaidNet(service);
                      return (
                        <TableRow style={{ backgroundColor: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                          <TableCell style={{ minWidth: columnWidths.checkbox, ...colVis('checkbox') }}></TableCell>
                          <TableCell style={colVis('coach')}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.student, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', ...colVis('student') }}>Incassato</TableCell>
                          <TableCell style={colVis('coachName')}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.status, fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('status') }}>{paidCount}/{totalCount} pagate</TableCell>
                          <TableCell style={colVis('createdAt')}></TableCell>
                          <TableCell style={colVis('expiresAt')}></TableCell>
                          <TableCell style={colVis('servizio')}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.rate, ...colVis('rate') }}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.contratto, ...colVis('contratto') }}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.fattura, ...colVis('fattura') }}></TableCell>
                          <TableCell style={{ minWidth: columnWidths.netto, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: paidTotal > 0 ? 'var(--primary)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('netto') }}>€{paidNetto.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                          <TableCell style={{ minWidth: columnWidths.lordo, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: paidTotal > 0 ? 'var(--primary)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('lordo') }}>€{paidTotal.toLocaleString('it-IT')}</TableCell>
                          <TableCell style={{ minWidth: columnWidths.incassato, fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: paidTotal > 0 ? 'var(--primary)' : 'var(--muted-foreground)', lineHeight: '1.5', ...colVis('incassato') }}>€{paidTotal.toLocaleString('it-IT')}</TableCell>
                          <TableCell style={colVis('coachCompenso')}></TableCell>
                          <TableCell style={colVis('nextDue')}></TableCell>
                          <TableCell style={colVis('statoLav')}></TableCell>
                          <TableCell style={colVis('compenso')}></TableCell>
                          <TableCell style={colVis('dataNotula')}></TableCell>
                          <TableCell style={colVis('scad45gg')}></TableCell>
                          <TableCell style={colVis('statoNotula')}></TableCell>
                          <TableCell style={colVis('pagatoIl')}></TableCell>
                          <TableCell style={colVis('rifPag')}></TableCell>
                          <TableCell style={colVis('notes')}></TableCell>
                          <TableCell style={{ position: 'sticky', right: 0, backgroundColor: 'var(--muted)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)', ...colVis('actions') }}></TableCell>
                        </TableRow>
                      );
                    })()}
                  </tbody>
                );
              })
              ])}
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
        {filteredAndSortedData.map((service) => {
          const isMobileSelected = selectedIds.includes(service.id);
          return (
          <ResponsiveMobileCard
            key={service.id}
            backgroundColor={isMobileSelected ? 'var(--selected-row-bg)' : 'var(--card)'}
          >
            <div onClick={() => handleRowClick(service.id)} style={{ cursor: 'pointer' }}>
            <ResponsiveMobileCardHeader>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '0.125rem' }}>
                  <Checkbox checked={selectedIds.includes(service.id)} onCheckedChange={() => handleSelectRow(service.id)} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.25rem' }}>{service.student_name}</div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>{service.id} • {service.service_name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {getStatusBadge(service.status)}
              </div>
            </ResponsiveMobileCardHeader>

            <ResponsiveMobileCardSection marginBottom="0">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(() => {
                const mLordo = getServiceLordo(service);
                const mNetto = getServiceNet(service);
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                    <span>Netto: <span style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-bold)' }}>€{mNetto.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span></span>
                    <span>Lordo: <span style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>€{mLordo.toLocaleString('it-IT')}</span></span>
                  </div>
                );
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                <span>Rate: <span style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>{service.installments.filter(i => i.status === 'paid').length}/{service.installments.length}</span></span>
                {service.coach_fee !== undefined && (
                  <span>Coach: <span style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>€{service.coach_fee.toLocaleString('it-IT')}</span>{service.coach_name && <span style={{ color: 'var(--muted-foreground)' }}> ({service.coach_name})</span>}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                <span>Creato: {formatDateIT(service.created_at)}</span>
                {service.service_category !== 'Check plagio/AI' && (
                  <span>
                    Contratto: {service.contract?.status === 'signed'
                      ? <span style={{ color: 'var(--primary)', fontWeight: 'var(--font-weight-medium)' }}>Firmato</span>
                      : service.contract?.status === 'draft'
                        ? <span style={{ color: 'var(--chart-5)', fontWeight: 'var(--font-weight-medium)' }}>Bozza</span>
                        : <span style={{ color: 'var(--destructive-foreground)', fontWeight: 'var(--font-weight-medium)' }}>Mancante</span>
                    }
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                <span>Note</span>
                {(() => {
                  const noteCount = getNotesCount(service.id);
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenNotesDrawer(service.id, `${service.student_name} — ${service.service_name}`); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}
                    >
                      <StickyNote size={16} />{noteCount}
                    </button>
                  );
                })()}
              </div>
            </div>
            </ResponsiveMobileCardSection>
            </div>
          </ResponsiveMobileCard>
          );
        })}
          </ResponsiveMobileCards>
        )}
      />

      <style>{`
        @media (max-width: 768px) {
          .action-toolbar {
            flex-direction: column;
            gap: 1rem;
          }
          .action-toolbar-left,
          .action-toolbar-right {
            width: 100%;
          }
          .action-toolbar-left {
            flex-direction: column;
          }
          .search-input {
            max-width: 100%!important;
          }
          .filter-container {
            padding: 1rem !important;
          }
        }
      `}</style>

      {/* ─── Edit Student Drawer ─────────────────────────── */}
      {(() => {
        const editStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;
        const studentSvcs = selectedStudentId ? localData.filter(s => s.student_id === selectedStudentId) : [];
        return (
          <CreateStudentDrawer
            open={!!selectedStudentId}
            onClose={() => setSelectedStudentId(null)}
            onStudentCreated={() => {}}
            editStudent={editStudent}
            onStudentUpdated={(updated) => {
              updateStudent(updated.id, () => updated);
              for (const svc of studentSvcs) {
                updateService(svc.id, s => ({ ...s, student_name: updated.name, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
              }
              setSelectedStudentId(null);
              toast.success(`Studente ${updated.name} aggiornato`);
            }}
          />
        );
      })()}

      {/* ─── Notes Drawer ── */}
      {selectedServiceForNotes && (
        <NotesDrawer
          isOpen={notesDrawerOpen}
          onClose={() => {
            setNotesDrawerOpen(false);
            setSelectedServiceForNotes(null);
          }}
          entityId={selectedServiceForNotes.id}
          entityType="Servizio"
          entityName={selectedServiceForNotes.name}
          notes={getNotesForService(selectedServiceForNotes.id)}
          onAddNote={handleAddNote}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      {/* ─── Lavorazione Detail Drawer ── */}
      {detailDrawerService && (
        <LavorazioneDetailDrawer
          service={detailDrawerService}
          isOpen={!!detailDrawerServiceId}
          onClose={() => setDetailDrawerServiceId(null)}
          onUpdateService={updateService}
          currentAdmin={CURRENT_ADMIN}
          taxPercent={taxPercent}
          openedAt={detailDrawerOpenedAt}
          students={students}
          pipelines={pipelines}
          availableAree={getActiveAree().map(a => a.name)}
          onEditStudent={(studentId) => {
            setDetailDrawerServiceId(null);
            setTimeout(() => setSelectedStudentId(studentId), 200);
          }}
        />
      )}
    </div>
  );
}
