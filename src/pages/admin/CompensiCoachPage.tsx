import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Check, Clock, AlertTriangle, Pencil, FileText, X, Send, CreditCard, AlertCircle, StickyNote, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useLavorazioni, PayoutStatus, CoachPayout } from '@/app/data/LavorazioniContext';
import { TableActions } from '@/app/components/TableActions';
import { BulkActionsBar } from '@/app/components/BulkActionsBar';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { NotesDrawer } from '@/app/components/NotesDrawer';
import { Checkbox } from '@/app/components/ui/checkbox';

// ─── Status configuration ─────────────────────────────────────
const PAYOUT_STATUS_CONFIG: Record<PayoutStatus, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
  pending_invoice: {
    label: 'Da emettere',
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
    icon: <FileText size={12} />,
  },
  waiting_due_date: {
    label: 'Notula inviata',
    bg: 'var(--chart-2)',
    fg: '#fff',
    icon: <Send size={12} />,
  },
  ready_to_pay: {
    label: 'Da pagare',
    bg: 'var(--chart-3)',
    fg: '#fff',
    icon: <CreditCard size={12} />,
  },
  paid: {
    label: 'Pagato',
    bg: 'var(--primary)',
    fg: 'var(--primary-foreground)',
    icon: <Check size={12} />,
  },
  disputed: {
    label: 'Contestato',
    bg: 'var(--destructive)',
    fg: 'var(--destructive-foreground)',
    icon: <AlertCircle size={12} />,
  },
};

const PAYOUT_STATUS_ORDER: PayoutStatus[] = ['pending_invoice', 'waiting_due_date', 'ready_to_pay', 'paid', 'disputed'];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  return Math.ceil((new Date(dateB).getTime() - new Date(dateA).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Derived row type ──────────────────────────────────────────
interface CompensoRow {
  serviceId: string;
  coach_name: string;
  student_name: string;
  service_name: string;
  compenso: number;
  lavorazione_status: string;
  payout: CoachPayout;
  // Computed
  effectiveStatus: PayoutStatus;
  daysToPayment?: number;
}

type SortKey = 'coach_name' | 'student_name' | 'compenso' | 'effectiveStatus' | 'notula_issue_date' | 'payment_due_date' | null;

// ─── Helpers ───────────────────────────────────────────────────
const formatCurrency = (v: number) => `€${v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatDate = (d?: string) => {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
};

const parseNotula = (inv?: string) => {
  if (!inv) return { num: '', year: '' };
  const parts = inv.split('/');
  return { num: parts[0] || '', year: parts[1] || '' };
};
const composeNotula = (num: string, year: string) => {
  const t = num.trim();
  if (!t) return undefined;
  return `${t}/${year}`;
};

const inlineInputStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--primary)',
  backgroundColor: 'var(--input-background)',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  color: 'var(--foreground)',
  outline: 'none',
  lineHeight: '1.5',
};

// Standard TH styles
const thBaseStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left',
  fontWeight: 'var(--font-weight-medium)' as any,
  color: 'var(--muted-foreground)',
  backgroundColor: 'var(--muted)',
  borderBottom: '1px solid var(--border)',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

// Standard TD styles (base - può essere esteso inline)
const tdBaseStyle: React.CSSProperties = {
  padding: '1rem',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  lineHeight: '1.5',
  color: 'var(--foreground)',
};

// ─── Component ─────────────────────────────────────────────────
export function CompensiCoachPage() {
  const navigate = useNavigate();
  const { data: lavorazioni, updateService } = useLavorazioni();

  // ─── Filtri ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCoach, setFilterCoach] = useState<string>('all');
  
  // ─── Sort ─────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<SortKey>('effectiveStatus');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ─── Column widths (resize) ───────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    lav: 90,
    coach: 150,
    student: 150,
    service: 180,
    stato_lav: 120,
    compenso: 100,
    notula: 110,
    data_notula: 110,
    scadenza: 120,
    stato_pag: 140,
    pagato_il: 110,
    rif_pag: 130,
    actions: 80,
  });

  // ─── Selection ────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Editing states ───────────────────────────────────────
  const [editingCompenso, setEditingCompenso] = useState<string | null>(null);
  const [editCompensoValue, setEditCompensoValue] = useState('');

  // ─── Inline status-change form ────────────────────────────
  const [pendingStatusChange, setPendingStatusChange] = useState<{ serviceId: string; newStatus: PayoutStatus } | null>(null);
  const [formNotulaNum, setFormNotulaNum] = useState('');
  const [formNotulaYear, setFormNotulaYear] = useState('');
  const [formNotulaDate, setFormNotulaDate] = useState('');
  const [formNotulaAmount, setFormNotulaAmount] = useState('');
  const [formPaidAt, setFormPaidAt] = useState('');
  const [formPaymentRef, setFormPaymentRef] = useState('');

  // ─── Editing individual fields ────────────────────────────
  const [editingNotulaNum, setEditingNotulaNum] = useState<string | null>(null);
  const [editNotulaNumVal, setEditNotulaNumVal] = useState('');
  const [editNotulaYearVal, setEditNotulaYearVal] = useState('');
  const [editingNotulaDate, setEditingNotulaDate] = useState<string | null>(null);
  const [editNotulaDateVal, setEditNotulaDateVal] = useState('');
  const [editingPaidAt, setEditingPaidAt] = useState<string | null>(null);
  const [editPaidAtVal, setEditPaidAtVal] = useState('');
  const [editingPayRef, setEditingPayRef] = useState<string | null>(null);
  const [editPayRefVal, setEditPayRefVal] = useState('');

  // ─── Confirm dialog ───────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void } | null>(null);

  // ─── Notes drawer ─────────────────────────────────────────
  const [notesDrawer, setNotesDrawer] = useState<{ isOpen: boolean; entityId: string; entityName: string; entityType: string } | null>(null);

  // ─── Mock notes storage ───────────────────────────────────
  const [compensoNotes, setCompensoNotes] = useState<Record<string, Array<{ id: string; content: string; admin: string; timestamp: string }>>>({});

  const CURRENT_ADMIN = 'Francesca';

  const handleAddNote = (serviceId: string, content: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      content,
      admin: CURRENT_ADMIN,
      timestamp: new Date().toISOString(),
    };
    setCompensoNotes(prev => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), newNote],
    }));
    toast.success('Nota aggiunta');
  };

  // ─── Derive rows from context ─────────────────────────────
  const allRows = useMemo((): CompensoRow[] => {
    return lavorazioni
      .filter(svc => svc.coach_name && svc.coach_fee !== undefined && svc.coach_fee > 0)
      .map(svc => {
        const payout: CoachPayout = svc.coach_payout || {
          id: `CP-auto-${svc.id}`,
          status: 'pending_invoice',
        };

        // Compute effective status
        let effectiveStatus = payout.status;
        let daysToPayment: number | undefined;
        if (payout.status === 'waiting_due_date' && payout.notula_issue_date) {
          const dueDate = payout.payment_due_date || addDays(payout.notula_issue_date, 40);
          const now = new Date().toISOString().split('T')[0];
          daysToPayment = daysBetween(now, dueDate);
          if (daysToPayment <= 0) {
            effectiveStatus = 'ready_to_pay';
          }
        }
        if (payout.status === 'ready_to_pay' && payout.payment_due_date) {
          const now = new Date().toISOString().split('T')[0];
          daysToPayment = daysBetween(now, payout.payment_due_date);
        }

        return {
          serviceId: svc.id,
          coach_name: svc.coach_name!,
          student_name: svc.student_name,
          service_name: svc.service_name,
          compenso: svc.coach_fee!,
          lavorazione_status: svc.status,
          payout,
          effectiveStatus,
          daysToPayment,
        };
      });
  }, [lavorazioni]);

  // ─── Unique coaches for filter ─────────────────────────────
  const uniqueCoaches = useMemo(() => {
    return Array.from(new Set(allRows.map(r => r.coach_name))).sort();
  }, [allRows]);

  // ─── Column resize handler ────────────────────────────────
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
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

  // ─── Sorting ──────────────────────────────────────────────
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

  const getSortIcon = (col: SortKey) => {
    if (sortColumn !== col) {
      return <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  // ─── Filtering ────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...allRows];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.coach_name.toLowerCase().includes(q) ||
        r.student_name.toLowerCase().includes(q) ||
        r.service_name.toLowerCase().includes(q) ||
        r.serviceId.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') result = result.filter(r => r.effectiveStatus === filterStatus);
    if (filterCoach !== 'all') result = result.filter(r => r.coach_name === filterCoach);
    if (sortColumn) {
      const statusOrder = PAYOUT_STATUS_ORDER;
      result.sort((a, b) => {
        let va: any, vb: any;
        if (sortColumn === 'effectiveStatus') {
          va = statusOrder.indexOf(a.effectiveStatus);
          vb = statusOrder.indexOf(b.effectiveStatus);
        } else if (sortColumn === 'notula_issue_date') {
          va = a.payout.notula_issue_date || '';
          vb = b.payout.notula_issue_date || '';
        } else if (sortColumn === 'payment_due_date') {
          va = a.payout.payment_due_date || '';
          vb = b.payout.payment_due_date || '';
        } else {
          va = a[sortColumn] ?? '';
          vb = b[sortColumn] ?? '';
        }
        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
        if (va < vb) return sortDirection === 'asc' ? -1 : 1;
        if (va > vb) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [allRows, searchQuery, filterStatus, filterCoach, sortColumn, sortDirection]);

  // ─── Summary stats ────────────────────────────────────────
  const totalDaPagare = allRows.filter(r => r.effectiveStatus === 'ready_to_pay').reduce((s, r) => s + r.compenso, 0);
  const totalInAttesa = allRows.filter(r => r.effectiveStatus === 'waiting_due_date').reduce((s, r) => s + r.compenso, 0);
  const totalPagato = allRows.filter(r => r.effectiveStatus === 'paid').reduce((s, r) => s + r.compenso, 0);
  const countDaEmettere = allRows.filter(r => r.effectiveStatus === 'pending_invoice').length;
  const countDaPagare = allRows.filter(r => r.effectiveStatus === 'ready_to_pay').length;
  const countContestati = allRows.filter(r => r.effectiveStatus === 'disputed').length;

  // ─── Actions ───────────────────────────────────────────────
  const saveCompenso = (row: CompensoRow) => {
    const val = parseFloat(editCompensoValue);
    if (!isNaN(val) && val >= 0) {
      updateService(row.serviceId, s => ({ ...s, coach_fee: val, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
      toast.success(`Compenso aggiornato: €${val}`);
    }
    setEditingCompenso(null);
  };

  const updatePayout = (serviceId: string, updates: Partial<CoachPayout>) => {
    updateService(serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      coach_payout: {
        ...(s.coach_payout || { id: `CP-auto-${s.id}`, status: 'pending_invoice' as PayoutStatus }),
        ...updates,
      },
    }));
  };

  // Handle status change initiation
  const initiateStatusChange = (row: CompensoRow, newStatus: PayoutStatus) => {
    const currentStatus = row.effectiveStatus;
    if (newStatus === currentStatus) return;

    // Direct changes (no form needed)
    if (newStatus === 'pending_invoice') {
      updatePayout(row.serviceId, { status: 'pending_invoice' });
      toast.success('Stato aggiornato: Da emettere');
      return;
    }
    if (newStatus === 'disputed') {
      updatePayout(row.serviceId, { status: 'disputed' });
      toast.success('Stato aggiornato: Contestato');
      return;
    }

    // Form-required changes
    if (newStatus === 'waiting_due_date') {
      const parsed = parseNotula(row.payout.notula_number);
      setPendingStatusChange({ serviceId: row.serviceId, newStatus });
      setFormNotulaNum(parsed.num);
      setFormNotulaYear(parsed.year || String(new Date().getFullYear()));
      setFormNotulaDate(row.payout.notula_issue_date || new Date().toISOString().split('T')[0]);
      setFormNotulaAmount(String(row.payout.notula_amount || row.compenso));
      return;
    }
    if (newStatus === 'ready_to_pay') {
      if (row.payout.notula_issue_date) {
        updatePayout(row.serviceId, { status: 'ready_to_pay' });
        toast.success('Stato aggiornato: Da pagare');
      } else {
        const parsed = parseNotula(row.payout.notula_number);
        setPendingStatusChange({ serviceId: row.serviceId, newStatus: 'waiting_due_date' });
        setFormNotulaNum(parsed.num);
        setFormNotulaYear(parsed.year || String(new Date().getFullYear()));
        setFormNotulaDate(new Date().toISOString().split('T')[0]);
        setFormNotulaAmount(String(row.compenso));
        toast('Inserisci prima i dati della notula');
      }
      return;
    }
    if (newStatus === 'paid') {
      setPendingStatusChange({ serviceId: row.serviceId, newStatus });
      setFormPaidAt(row.payout.paid_at || new Date().toISOString().split('T')[0]);
      setFormPaymentRef(row.payout.payment_reference || '');
      return;
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const { serviceId, newStatus } = pendingStatusChange;

    if (newStatus === 'waiting_due_date') {
      if (!formNotulaNum.trim()) {
        toast.error('Inserisci il numero notula');
        return;
      }
      if (!formNotulaDate) {
        toast.error('Inserisci la data di emissione');
        return;
      }
      const notulaNumber = composeNotula(formNotulaNum, formNotulaYear);
      const amount = parseFloat(formNotulaAmount) || undefined;
      const paymentDueDate = addDays(formNotulaDate, 40);
      updatePayout(serviceId, {
        status: 'waiting_due_date',
        notula_number: notulaNumber,
        notula_issue_date: formNotulaDate,
        notula_amount: amount,
        payment_due_date: paymentDueDate,
      });
      toast.success(`Notula ${notulaNumber} registrata — scadenza pagamento: ${formatDate(paymentDueDate)}`);
    }

    if (newStatus === 'paid') {
      if (!formPaidAt) {
        toast.error('Inserisci la data di pagamento');
        return;
      }
      updatePayout(serviceId, {
        status: 'paid',
        paid_at: formPaidAt,
        payment_reference: formPaymentRef || undefined,
      });
      toast.success('Pagamento registrato');
    }

    setPendingStatusChange(null);
  };

  const cancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  // Inline field editors
  const saveNotulaNum = (row: CompensoRow) => {
    const val = composeNotula(editNotulaNumVal, editNotulaYearVal);
    updatePayout(row.serviceId, { notula_number: val });
    setEditingNotulaNum(null);
    if (val) toast.success(`N. Notula aggiornato: ${val}`);
  };

  const saveNotulaDate = (row: CompensoRow) => {
    if (editNotulaDateVal) {
      // Calcola automaticamente la scadenza a 40 giorni dalla nuova data
      const paymentDueDate = addDays(editNotulaDateVal, 40);
      updatePayout(row.serviceId, { 
        notula_issue_date: editNotulaDateVal,
        payment_due_date: paymentDueDate 
      });
      toast.success(`Data notula aggiornata: ${formatDate(editNotulaDateVal)} — scadenza: ${formatDate(paymentDueDate)}`);
    }
    setEditingNotulaDate(null);
  };

  const savePaidAt = (row: CompensoRow) => {
    if (editPaidAtVal) {
      updatePayout(row.serviceId, { paid_at: editPaidAtVal });
      toast.success(`Data pagamento aggiornata: ${formatDate(editPaidAtVal)}`);
    }
    setEditingPaidAt(null);
  };

  const savePayRef = (row: CompensoRow) => {
    updatePayout(row.serviceId, { payment_reference: editPayRefVal || undefined });
    setEditingPayRef(null);
    toast.success('Riferimento pagamento aggiornato');
  };

  // ─── Selection handlers ────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(r => r.serviceId));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── Bulk actions ──────────────────────────────────────────
  const handleBulkExport = () => {
    const selected = filteredData.filter(r => selectedIds.includes(r.serviceId));
    const csv = ['Coach,Studente,Servizio,Compenso,Stato,N. Notula,Data Notula'].concat(
      selected.map(r => `${r.coach_name},${r.student_name},${r.service_name},${r.compenso},${PAYOUT_STATUS_CONFIG[r.effectiveStatus].label},${r.payout.notula_number || ''},${formatDate(r.payout.notula_issue_date)}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compensi-coach-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success(`${selectedIds.length} compensi esportati`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      open: true,
      title: 'Elimina compensi selezionati',
      description: `Vuoi eliminare ${selectedIds.length} compensi? Questa azione non può essere annullata.`,
      onConfirm: () => {
        selectedIds.forEach(id => {
          updateService(id, s => ({ ...s, coach_fee: undefined, coach_payout: undefined, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
        });
        toast.success(`${selectedIds.length} compensi eliminati`);
        setSelectedIds([]);
        setConfirmDialog(null);
      },
    });
  };

  // ─── Reset filters ─────────────────────────────────────────
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCoach('all');
  };

  const statusLabel = (s: string) => {
    switch (s) { case 'completed': return 'Completata'; case 'active': return 'Attiva'; case 'suspended': return 'Sospesa'; case 'created': return 'Creata'; default: return s; }
  };
  const statusColor = (s: string) => {
    switch (s) { case 'completed': return 'var(--primary)'; case 'active': return 'var(--chart-2)'; case 'suspended': return 'var(--chart-3)'; default: return 'var(--muted-foreground)'; }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Compensi Coach</h1>
        <p className="page-subtitle">Notule, scadenze e pagamenti ai coach — 40 giorni dalla data notula</p>
        <style>{`
          @media (max-width: 768px) {
            .page-header {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
            }
          }
        `}</style>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Da pagare (ready_to_pay) */}
        <div className="stat-card" style={{ border: countDaPagare > 0 ? '2px solid var(--chart-3)' : undefined }}>
          <div className="stat-header">
            <span className="stat-label">Da pagare</span>
            <div className="stat-icon" style={{ background: 'var(--chart-3)' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalDaPagare)}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            {countDaPagare} compensi
          </div>
        </div>

        {/* In attesa scadenza */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Notule inviate</span>
            <div className="stat-icon" style={{ background: 'var(--chart-2)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalInAttesa)}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            in attesa 40gg
          </div>
        </div>

        {/* Da emettere */}
        {countDaEmettere > 0 && (
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Da emettere</span>
              <div className="stat-icon">
                <FileText size={20} />
              </div>
            </div>
            <div className="stat-value">{countDaEmettere}</div>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              color: 'var(--muted-foreground)',
              marginTop: '0.25rem',
              lineHeight: '1.5',
            }}>
              notule da creare
            </div>
          </div>
        )}

        {/* Contestati */}
        {countContestati > 0 && (
          <div className="stat-card" style={{ 
            border: '2px solid var(--destructive-foreground)', 
            backgroundColor: 'var(--destructive)' 
          }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: 'var(--destructive-foreground)' }}>Contestati</span>
              <div className="stat-icon" style={{ background: 'var(--destructive-foreground)' }}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: 'var(--destructive-foreground)' }}>
              {countContestati}
            </div>
          </div>
        )}

        {/* Pagato totale */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pagato</span>
            <div className="stat-icon">
              <Check size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {formatCurrency(totalPagato)}
          </div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            {allRows.filter(r => r.effectiveStatus === 'paid').length} compensi
          </div>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          flex: 1,
          width: '100%'
        }}>
          <input
            type="text"
            placeholder="Cerca coach, studente, lavorazione..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              minWidth: 0,
              maxWidth: 'none'
            }}
          />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .action-toolbar {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .action-toolbar > div {
              width: 100% !important;
            }
          }
        `}</style>
      </div>

      {/* Filtri multipli */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
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
            Stato pagamento
          </label>
          <select
            className="select-dropdown"
            style={{ width: '100%' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            {PAYOUT_STATUS_ORDER.map(s => (
              <option key={s} value={s}>{PAYOUT_STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Coach
          </label>
          <select
            className="select-dropdown"
            style={{ width: '100%' }}
            value={filterCoach}
            onChange={(e) => setFilterCoach(e.target.value)}
          >
            <option value="all">Tutti i coach</option>
            {uniqueCoaches.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          <button
            className="btn btn-secondary"
            onClick={resetFilters}
            style={{ height: 'fit-content' }}
          >
            Reset filtri
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          actions={[
            {
              label: 'Esporta',
              icon: <Download size={16} />,
              onClick: handleBulkExport,
              variant: 'secondary'
            },
            {
              label: 'Elimina',
              icon: <Trash2 size={16} />,
              onClick: handleBulkDelete,
              variant: 'destructive',
            },
          ]}
        />
      )}

      {/* Table */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1600px' }}>
            <thead>
              <tr>
                {/* Checkbox column */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.checkbox}px`, position: 'relative' }}>
                  <Checkbox
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                    onCheckedChange={handleSelectAll}
                  />
                  {resizeHandle('checkbox')}
                </th>

                {/* Lav. ID */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.lav}px`, position: 'relative' }}>
                  <span>Lav.</span>
                  {resizeHandle('lav')}
                </th>

                {/* Coach - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.coach}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('coach_name')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Coach</span>
                    {getSortIcon('coach_name')}
                  </div>
                  {resizeHandle('coach')}
                </th>

                {/* Studente - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.student}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('student_name')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Studente</span>
                    {getSortIcon('student_name')}
                  </div>
                  {resizeHandle('student')}
                </th>

                {/* Servizio */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.service}px`, position: 'relative' }}>
                  <span>Servizio</span>
                  {resizeHandle('service')}
                </th>

                {/* Stato lav. */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.stato_lav}px`, position: 'relative' }}>
                  <span>Stato lav.</span>
                  {resizeHandle('stato_lav')}
                </th>

                {/* Compenso - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.compenso}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('compenso')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Compenso</span>
                    {getSortIcon('compenso')}
                  </div>
                  {resizeHandle('compenso')}
                </th>

                {/* N. Notula */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.notula}px`, position: 'relative' }}>
                  <span>N. Notula</span>
                  {resizeHandle('notula')}
                </th>

                {/* Data notula - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.data_notula}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('notula_issue_date')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Data notula</span>
                    {getSortIcon('notula_issue_date')}
                  </div>
                  {resizeHandle('data_notula')}
                </th>

                {/* Scad. 40gg - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.scadenza}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('payment_due_date')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Scad. 40gg</span>
                    {getSortIcon('payment_due_date')}
                  </div>
                  {resizeHandle('scadenza')}
                </th>

                {/* Stato pag. - sortable */}
                <th
                  style={{
                    ...thBaseStyle,
                    width: `${columnWidths.stato_pag}px`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSort('effectiveStatus')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Stato pag.</span>
                    {getSortIcon('effectiveStatus')}
                  </div>
                  {resizeHandle('stato_pag')}
                </th>

                {/* Pagato il */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.pagato_il}px`, position: 'relative' }}>
                  <span>Pagato il</span>
                  {resizeHandle('pagato_il')}
                </th>

                {/* Rif. pag. */}
                <th style={{ ...thBaseStyle, width: `${columnWidths.rif_pag}px`, position: 'relative' }}>
                  <span>Rif. pag.</span>
                  {resizeHandle('rif_pag')}
                </th>

                {/* Actions sticky - NO RESIZE */}
                <th style={{
                  ...thBaseStyle,
                  width: `${columnWidths.actions}px`,
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'var(--muted)',
                  zIndex: 11,
                  boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                }}>
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => {
                const isPendingForm = pendingStatusChange?.serviceId === row.serviceId;
                const cfg = PAYOUT_STATUS_CONFIG[row.effectiveStatus];
                const isSelected = selectedIds.includes(row.serviceId);

                const mainRow = (
                  <tr 
                    key={`row-${row.serviceId}`}
                    style={{ 
                      borderBottom: isPendingForm ? 'none' : '1px solid var(--border)', 
                      backgroundColor: isSelected ? 'var(--selected-row-bg)' : undefined 
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = ''; }}
                  >
                    {/* Checkbox */}
                    <td onClick={e => e.stopPropagation()} style={{ minWidth: columnWidths.checkbox, padding: '1rem' }}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(row.serviceId)}
                      />
                    </td>

                    {/* Lav. ID */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.lav,
                      color: 'var(--muted-foreground)', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {row.serviceId}
                    </td>

                    {/* Coach */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.coach,
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}>
                      {row.coach_name}
                    </td>

                    {/* Studente */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.student,
                    }}>
                      {row.student_name}
                    </td>

                    {/* Servizio */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.service,
                      color: 'var(--muted-foreground)' 
                    }}>
                      {row.service_name}
                    </td>

                    {/* Stato lav. */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.stato_lav,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: statusColor(row.lavorazione_status) }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor(row.lavorazione_status), flexShrink: 0 }} />
                        {statusLabel(row.lavorazione_status)}
                      </span>
                    </td>

                    {/* Compenso — editabile */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.compenso,
                    }}>
                      {editingCompenso === row.serviceId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: 'var(--muted-foreground)' }}>€</span>
                          <input type="number" value={editCompensoValue} onChange={e => setEditCompensoValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveCompenso(row); if (e.key === 'Escape') setEditingCompenso(null); }}
                            autoFocus onBlur={() => saveCompenso(row)}
                            style={{ width: '80px', ...inlineInputStyle }}
                          />
                        </div>
                      ) : (
                        <span onClick={() => { setEditingCompenso(row.serviceId); setEditCompensoValue(String(row.compenso)); }}
                          style={{ cursor: 'pointer', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Clicca per modificare"
                        >
                          {formatCurrency(row.compenso)}
                          <Pencil size={12} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                        </span>
                      )}
                    </td>

                    {/* N. Notula — editabile inline */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.notula,
                    }}>
                      {editingNotulaNum === row.serviceId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input type="text" inputMode="numeric" value={editNotulaNumVal}
                            onChange={e => setEditNotulaNumVal(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => { if (e.key === 'Enter') saveNotulaNum(row); if (e.key === 'Escape') setEditingNotulaNum(null); }}
                            autoFocus
                            style={{ width: '40px', textAlign: 'right', ...inlineInputStyle }}
                          />
                          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
                          <input type="text" inputMode="numeric" value={editNotulaYearVal}
                            onChange={e => setEditNotulaYearVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            onKeyDown={e => { if (e.key === 'Enter') saveNotulaNum(row); if (e.key === 'Escape') setEditingNotulaNum(null); }}
                            onBlur={() => saveNotulaNum(row)}
                            style={{ width: '50px', ...inlineInputStyle }}
                          />
                        </div>
                      ) : (
                        <span onClick={() => {
                          const parsed = parseNotula(row.payout.notula_number);
                          setEditingNotulaNum(row.serviceId);
                          setEditNotulaNumVal(parsed.num);
                          setEditNotulaYearVal(parsed.year || String(new Date().getFullYear()));
                        }}
                          style={{ cursor: 'pointer', color: row.payout.notula_number ? 'var(--foreground)' : 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Clicca per modificare"
                        >
                          {row.payout.notula_number || '—'}
                          <Pencil size={10} style={{ opacity: 0.4 }} />
                        </span>
                      )}
                    </td>

                    {/* Data notula — editabile inline */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.data_notula,
                      color: row.payout.notula_issue_date ? 'var(--foreground)' : 'var(--muted-foreground)' 
                    }}>
                      {editingNotulaDate === row.serviceId ? (
                        <input 
                          type="date" 
                          value={editNotulaDateVal}
                          onChange={e => setEditNotulaDateVal(e.target.value)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter') saveNotulaDate(row); 
                            if (e.key === 'Escape') setEditingNotulaDate(null); 
                          }}
                          autoFocus 
                          onBlur={() => saveNotulaDate(row)}
                          style={{ ...inlineInputStyle, width: '130px' }}
                        />
                      ) : (
                        <span 
                          onClick={() => { 
                            setEditingNotulaDate(row.serviceId); 
                            setEditNotulaDateVal(row.payout.notula_issue_date || ''); 
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            color: row.payout.notula_issue_date ? 'var(--foreground)' : 'var(--muted-foreground)', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px' 
                          }}
                          title="Clicca per modificare"
                        >
                          {formatDate(row.payout.notula_issue_date)}
                          <Pencil size={10} style={{ opacity: 0.4 }} />
                        </span>
                      )}
                    </td>

                    {/* Scadenza 40gg */}
                    <td style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.scadenza,
                    }}>
                      {row.payout.payment_due_date ? (
                        <span style={{
                          color: row.daysToPayment !== undefined && row.daysToPayment <= 0 ? 'var(--chart-3)' : 'var(--foreground)',
                          fontWeight: row.daysToPayment !== undefined && row.daysToPayment <= 0 ? 'var(--font-weight-bold)' : undefined,
                        }}>
                          {formatDate(row.payout.payment_due_date)}
                          {row.daysToPayment !== undefined && row.daysToPayment > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginLeft: '4px' }}>
                              (-{row.daysToPayment}gg)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                      )}
                    </td>

                    {/* Stato pagamento — dropdown */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.stato_pag,
                    }}>
                      <select value={row.effectiveStatus} onChange={e => initiateStatusChange(row, e.target.value as PayoutStatus)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius)',
                          border: 'none',
                          backgroundColor: cfg.bg,
                          color: cfg.fg,
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-medium)',
                          cursor: 'pointer',
                          lineHeight: '1.5',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {PAYOUT_STATUS_ORDER.map(s => (
                          <option key={s} value={s}>{PAYOUT_STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Pagato il — editabile */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.pagato_il,
                      padding: '10px 12px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      lineHeight: '1.5',
                    }}>
                      {row.effectiveStatus === 'paid' ? (
                        editingPaidAt === row.serviceId ? (
                          <input type="date" value={editPaidAtVal}
                            onChange={e => setEditPaidAtVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') savePaidAt(row); if (e.key === 'Escape') setEditingPaidAt(null); }}
                            autoFocus onBlur={() => savePaidAt(row)}
                            style={{ ...inlineInputStyle, width: '130px' }}
                          />
                        ) : (
                          <span onClick={() => { setEditingPaidAt(row.serviceId); setEditPaidAtVal(row.payout.paid_at || ''); }}
                            style={{ cursor: 'pointer', color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Clicca per modificare"
                          >
                            {formatDate(row.payout.paid_at)}
                            <Pencil size={10} style={{ opacity: 0.4 }} />
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                      )}
                    </td>

                    {/* Riferimento pagamento — editabile */}
                    <td onClick={e => e.stopPropagation()} style={{ 
                      ...tdBaseStyle,
                      minWidth: columnWidths.rif_pag,
                    }}>
                      {row.effectiveStatus === 'paid' ? (
                        editingPayRef === row.serviceId ? (
                          <input type="text" value={editPayRefVal}
                            onChange={e => setEditPayRefVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') savePayRef(row); if (e.key === 'Escape') setEditingPayRef(null); }}
                            autoFocus onBlur={() => savePayRef(row)}
                            placeholder="CRO/IBAN/rif."
                            style={{ width: '140px', ...inlineInputStyle }}
                          />
                        ) : (
                          <span onClick={() => { setEditingPayRef(row.serviceId); setEditPayRefVal(row.payout.payment_reference || ''); }}
                            style={{ cursor: 'pointer', color: row.payout.payment_reference ? 'var(--foreground)' : 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: '4px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={row.payout.payment_reference || 'Clicca per inserire riferimento'}
                          >
                            {row.payout.payment_reference || '—'}
                            <Pencil size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                      )}
                    </td>

                    {/* Actions — Sticky right */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        minWidth: columnWidths.actions,
                        padding: '1rem',
                        position: 'sticky',
                        right: 0,
                        backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--background)',
                        zIndex: 10,
                        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)',
                        textAlign: 'center',
                      }}
                    >
                      <TableActions
                        actions={[
                          {
                            label: 'Note compenso',
                            icon: <StickyNote size={14} />,
                            onClick: () => setNotesDrawer({
                              isOpen: true,
                              entityId: row.serviceId,
                              entityName: `Compenso ${row.coach_name}`,
                              entityType: 'compenso',
                            }),
                          },
                          {
                            label: 'Vai a lavorazione',
                            icon: <ExternalLink size={14} />,
                            onClick: () => navigate(`/lavorazioni?highlight=${row.serviceId}`),
                          },
                          {
                            label: 'Elimina compenso',
                            icon: <Trash2 size={14} />,
                            onClick: () => {
                              setConfirmDialog({
                                open: true,
                                title: 'Elimina compenso',
                                description: `Vuoi eliminare il compenso per ${row.coach_name}?`,
                                onConfirm: () => {
                                  updateService(row.serviceId, s => ({ ...s, coach_fee: undefined, coach_payout: undefined, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
                                  toast.success('Compenso eliminato');
                                  setConfirmDialog(null);
                                },
                              });
                            },
                            variant: 'destructive',
                            divider: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );

                const formRow = isPendingForm ? (
                  <tr key={`form-${row.serviceId}`} style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                    <td colSpan={14} style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Form header */}
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
                          {pendingStatusChange.newStatus === 'waiting_due_date' && (
                            <><Send size={14} style={{ color: 'var(--chart-2)' }} /> Registra notula</>
                          )}
                          {pendingStatusChange.newStatus === 'paid' && (
                            <><Check size={14} style={{ color: 'var(--primary)' }} /> Registra pagamento</>
                          )}
                        </div>

                        {/* Notula form */}
                        {pendingStatusChange.newStatus === 'waiting_due_date' && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>N. Notula *</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <input type="text" inputMode="numeric" value={formNotulaNum}
                                  onChange={e => setFormNotulaNum(e.target.value.replace(/\D/g, ''))}
                                  placeholder="N."
                                  autoFocus
                                  style={{ width: '50px', textAlign: 'right', ...inlineInputStyle }}
                                />
                                <span style={{ color: 'var(--muted-foreground)' }}>/</span>
                                <input type="text" inputMode="numeric" value={formNotulaYear}
                                  onChange={e => setFormNotulaYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  style={{ width: '50px', ...inlineInputStyle, color: 'var(--muted-foreground)' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>Data emissione *</label>
                              <input type="date" value={formNotulaDate}
                                onChange={e => setFormNotulaDate(e.target.value)}
                                style={{ ...inlineInputStyle }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>Importo</label>
                              <input type="number" value={formNotulaAmount}
                                onChange={e => setFormNotulaAmount(e.target.value)}
                                placeholder="€"
                                style={{ width: '80px', ...inlineInputStyle }}
                              />
                            </div>
                          </>
                        )}

                        {/* Payment form */}
                        {pendingStatusChange.newStatus === 'paid' && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>Data pagamento *</label>
                              <input type="date" value={formPaidAt}
                                onChange={e => setFormPaidAt(e.target.value)}
                                autoFocus
                                style={{ ...inlineInputStyle }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>Riferimento</label>
                              <input type="text" value={formPaymentRef}
                                onChange={e => setFormPaymentRef(e.target.value)}
                                placeholder="CRO/IBAN/..."
                                style={{ width: '140px', ...inlineInputStyle }}
                              />
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                          <button onClick={cancelStatusChange} className="btn btn-secondary">
                            Annulla
                          </button>
                          <button onClick={confirmStatusChange} className="btn btn-primary">
                            Conferma
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null;

                return [mainRow, formRow].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredData.map((row) => {
          const isSelected = selectedIds.includes(row.serviceId);
          const statusConfig = PAYOUT_STATUS_CONFIG[row.effectiveStatus];
          const noteCount = compensoNotes[row.serviceId]?.length || 0;

          return (
            <div
              key={row.serviceId}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectRow(row.serviceId)}
                  />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      {row.serviceId}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {row.coach_name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {row.student_name}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => initiateStatusChange(row, PAYOUT_STATUS_ORDER[(PAYOUT_STATUS_ORDER.indexOf(row.effectiveStatus) + 1) % PAYOUT_STATUS_ORDER.length])}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-badge)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.fg,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </button>
                  <TableActions
                    actions={[
                      {
                        label: 'Note compenso',
                        icon: <StickyNote size={14} />,
                        onClick: () => setNotesDrawer({
                          isOpen: true,
                          entityId: row.serviceId,
                          entityName: `Compenso ${row.coach_name}`,
                          entityType: 'compenso',
                        }),
                      },
                      {
                        label: 'Vai a lavorazione',
                        icon: <ExternalLink size={14} />,
                        onClick: () => navigate(`/lavorazioni?highlight=${row.serviceId}`),
                      },
                      {
                        label: 'Elimina compenso',
                        icon: <Trash2 size={14} />,
                        onClick: () => {
                          setConfirmDialog({
                            open: true,
                            title: 'Elimina compenso',
                            description: `Vuoi eliminare il compenso per ${row.coach_name}?`,
                            onConfirm: () => {
                              updateService(row.serviceId, s => ({ ...s, coach_fee: undefined, coach_payout: undefined, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
                              toast.success('Compenso eliminato');
                              setConfirmDialog(null);
                            },
                          });
                        },
                        variant: 'destructive',
                        divider: true,
                      },
                    ]}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    lineHeight: '1.5',
                  }}>
                    Servizio
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                  }}>
                    {row.service_name}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Compenso
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {formatCurrency(row.compenso)}
                    </div>
                  </div>

                  {row.payout.notula_number && (
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.25rem',
                        lineHeight: '1.5',
                      }}>
                        N. Notula
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        {row.payout.notula_number}
                      </div>
                    </div>
                  )}
                </div>

                {row.payout.notula_issue_date && (
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        marginBottom: '0.25rem',
                        lineHeight: '1.5',
                      }}>
                        Data notula
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        {formatDate(row.payout.notula_issue_date)}
                      </div>
                    </div>

                    {row.payout.payment_due_date && (
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          color: 'var(--muted-foreground)',
                          marginBottom: '0.25rem',
                          lineHeight: '1.5',
                        }}>
                          Scad. 40gg
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}>
                          {formatDate(row.payout.payment_due_date)}
                          {row.daysToPayment !== undefined && row.daysToPayment > 0 && (
                            <span style={{ color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                              (in {row.daysToPayment}gg)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {row.payout.paid_at && (
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Pagato il
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--primary)',
                      lineHeight: '1.5',
                    }}>
                      {formatDate(row.payout.paid_at)}
                      {row.payout.payment_reference && (
                        <span style={{ color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                          • {row.payout.payment_reference}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {noteCount > 0 && (
                  <div>
                    <button
                      onClick={() => setNotesDrawer({
                        isOpen: true,
                        entityId: row.serviceId,
                        entityName: `Compenso ${row.coach_name}`,
                        entityType: 'compenso',
                      })}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-medium)',
                        padding: 0,
                      }}
                    >
                      <StickyNote size={16} />
                      {noteCount} {noteCount === 1 ? 'nota' : 'note'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredData.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
            Nessun compenso trovato
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null);
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
          variant="destructive"
        />
      )}

      {/* Notes Drawer */}
      {notesDrawer && (
        <NotesDrawer
          isOpen={notesDrawer.isOpen}
          onClose={() => setNotesDrawer(null)}
          entityId={notesDrawer.entityId}
          entityName={notesDrawer.entityName}
          entityType={notesDrawer.entityType}
          notes={compensoNotes[notesDrawer.entityId] || []}
          onAddNote={(content) => handleAddNote(notesDrawer.entityId, content)}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .data-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
        
        .data-table tbody tr {
          transition: background-color 0.15s ease;
        }
        
        .data-table tbody tr:hover {
          background-color: var(--muted);
        }
      `}</style>
    </div>
  );
}
