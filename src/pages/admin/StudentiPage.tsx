import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Edit, Trash2, Power, StickyNote, AlertCircle, CheckCircle, Users, Mail, MailX, UserCheck, ExternalLink, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useLavorazioni, REFERENTI_SOTTOTESI } from '../../app/data/LavorazioniContext';
import type { Student, StudentService } from '../../app/data/LavorazioniContext';
import { CreateStudentDrawer } from '../../app/components/CreateStudentDrawer';
import { StatusBadge, type StatusType } from '../../app/components/StatusBadge';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { ConfirmDialog } from '../../app/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { NotesDrawer, type Note } from '../../app/components/NotesDrawer';
import { Checkbox } from '../../app/components/ui/checkbox';
import {
  CellContentStack,
  CellTextPrimary,
  CellTextSecondary,
  NotesBadgeButton,
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveMobileFieldLabel,
  ResponsiveTableLayout,
  TableActionCell,
  TableActionPlaceholderCell,
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

// ─── Mock admin corrente ───────────────────────────────────
const CURRENT_ADMIN = 'Francesca';

// ─── Extended Student type con tracking ──────────────────────
interface ExtendedStudent extends Student {
  notes?: Note[];
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
}

const STATUS_MAP: Record<string, StatusType> = {
  active: 'active',
  invited: 'pending',
  blocked: 'inactive',
};

const SERVICE_STATUS_MAP: Record<string, StatusType> = {
  pending_payment: 'pending',
  active: 'active',
  paused: 'warning',
  completed: 'completed',
  cancelled: 'inactive',
  expired: 'overdue',
};

const SERVICE_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'In attesa pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

export function StudentiPage() {
  const { students, data: lavorazioni, addStudent, updateStudent } = useLavorazioni();
  const navigate = useNavigate();

  // State base
  const [studentsData, setStudentsData] = useState<ExtendedStudent[]>(
    students.map(s => ({
      ...s,
      notes: [],
      created_by: 'Francesca',
      updated_by: s.updated_by || 'Francesca',
      updated_at: s.updated_at || s.created_at,
    }))
  );

  // Filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReferente, setFilterReferente] = useState('all');
  const [filterTimeline, setFilterTimeline] = useState<'all' | 'with' | 'without'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Drawer state
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);

  // Note drawer
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState<ExtendedStudent | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    student: ExtendedStudent | null;
  }>({ open: false, student: null });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Expandable rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sort
  type SortKey = 'id' | 'name' | 'status' | 'coaching' | 'referente' | 'created_by' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column widths
  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    id: 80,
    name: 200,
    status: 100,
    coaching: 120,
    referente: 100,
    created_by: 110,
    notes: 60,
    actions: 80,
  });

  // ─── Derive data from lavorazioni ─────────────────────────
  const getStudentLavorazioni = (studentId: string): StudentService[] => {
    return lavorazioni.filter(l => l.student_id === studentId);
  };

  // "Ha timeline" = almeno una lavorazione con needs_timeline:true E coaching_timeline valorizzata
  const getHasTimeline = (studentId: string): boolean => {
    return lavorazioni.some(
      l => l.student_id === studentId &&
        l.needs_timeline === true &&
        l.coaching_timeline &&
        l.coaching_timeline.length > 0
    );
  };

  // "Necessita timeline ma mancante" = almeno una lavorazione con needs_timeline:true E nessuna timeline ancora
  const getNeedsTimelineButMissing = (studentId: string): boolean => {
    return lavorazioni.some(
      l => l.student_id === studentId &&
        l.needs_timeline === true &&
        (!l.coaching_timeline || l.coaching_timeline.length === 0)
    );
  };

  const getCoachingStatus = (studentId: string): boolean => {
    return lavorazioni.some(
      l => l.student_id === studentId && l.status === 'active' && l.service_category === 'Coaching'
    );
  };

  // ─── Stato operativo derivato dalle lavorazioni ───────────
  // "blocked" è l'unico override account legittimo: impedisce qualsiasi operatività.
  // "invited" è uno stato auth/piattaforma e NON deve mascherare lo stato dei servizi.
  // Se lo studente ha lavorazioni → lo stato è sempre derivato da quelle.
  const getDerivedStatus = (student: ExtendedStudent): { status: StatusType; label: string } => {
    if (student.status === 'blocked') return { status: 'inactive', label: 'Bloccato' };

    const studentServices = lavorazioni.filter(l => l.student_id === student.id);

    // Nessun servizio associato: "invited" è l'unico contesto utile da mostrare
    if (studentServices.length === 0) {
      if (student.status === 'invited') return { status: 'pending', label: 'Invitato' };
      return { status: 'active', label: 'Attivo' };
    }

    // Servizi non chiusi (esclusi completed/cancelled/expired)
    const openServices = studentServices.filter(
      l => l.status !== 'completed' && l.status !== 'cancelled' && l.status !== 'expired'
    );

    // Ha almeno un servizio attivo → studente attivo
    const hasActiveServices = openServices.some(l => l.status === 'active');
    if (hasActiveServices) return { status: 'active', label: 'Attivo' };

    // Nessun servizio attivo: controlla se tutti i servizi aperti sono in pausa
    const allPaused = openServices.length > 0 && openServices.every(l => l.status === 'paused');
    if (allPaused) return { status: 'warning', label: 'In pausa' };

    // Nessun servizio attivo né in pausa: controlla se tutti i servizi aperti sono pending_payment
    const allPendingPayment = openServices.length > 0 && openServices.every(l => l.status === 'pending_payment');
    if (allPendingPayment) return { status: 'pending', label: 'In attesa pagamento' };

    // Mix di stati aperti (es. paused + pending_payment) → attivo generico
    if (openServices.length > 0) return { status: 'active', label: 'Attivo' };

    // Tutti i servizi sono chiusi
    const hasAnyCompleted = studentServices.some(l => l.status === 'completed');
    if (hasAnyCompleted) return { status: 'completed', label: 'Completato' };

    return { status: 'active', label: 'Attivo' };
  };

  const getActiveReferente = (studentId: string): string | null => {
    const activeLavorazioni = lavorazioni.filter(
      l => l.student_id === studentId && (l.status === 'active' || l.status === 'paused' || l.status === 'pending_payment')
    );
    if (activeLavorazioni.length === 0) return null;
    return activeLavorazioni[0].referente || null;
  };

  const getActiveReferenteExtra = (studentId: string): number => {
    const activeLavorazioni = lavorazioni.filter(
      l => l.student_id === studentId && (l.status === 'active' || l.status === 'paused' || l.status === 'pending_payment') && l.referente
    );
    return Math.max(0, activeLavorazioni.length - 1);
  };

  // ─── Filter by referente (derived from lavorazioni) ──────
  const getStudentReferenti = (studentId: string): string[] => {
    return lavorazioni
      .filter(l => l.student_id === studentId && l.referente)
      .map(l => l.referente!)
      .filter((v, i, a) => a.indexOf(v) === i);
  };

  // Stats
  const stats = useMemo(() => {
    const active = studentsData.filter(s => s.status === 'active').length;
    const totalStudents = studentsData.length;
    const inCoaching = studentsData.filter(s => getCoachingStatus(s.id)).length;
    // "Senza timeline" = needs_timeline:true su almeno una lavorazione, ma nessuna timeline ancora creata
    const withoutTimeline = studentsData.filter(s => getNeedsTimelineButMissing(s.id)).length;
    return { active, totalStudents, inCoaching, withoutTimeline };
  }, [studentsData, lavorazioni]);

  // Sort
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

  // Filter + sort
  const filteredData = useMemo(() => {
    let data = [...studentsData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      data = data.filter(s => s.status === filterStatus);
    }
    if (filterReferente !== 'all') {
      data = data.filter(s => getStudentReferenti(s.id).includes(filterReferente));
    }
    if (filterTimeline === 'with') {
      data = data.filter(s => getHasTimeline(s.id));
    } else if (filterTimeline === 'without') {
      // Solo chi ha needs_timeline:true ma timeline ancora mancante (da onboardare)
      data = data.filter(s => getNeedsTimelineButMissing(s.id));
    }
    if (filterDateFrom) {
      data = data.filter(s => s.created_at >= filterDateFrom);
    }
    if (filterDateTo) {
      data = data.filter(s => s.created_at <= filterDateTo);
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = '';
        let bVal = '';
        if (sortColumn === 'id') { aVal = a.id; bVal = b.id; }
        else if (sortColumn === 'name') { aVal = a.name; bVal = b.name; }
        else if (sortColumn === 'status') { aVal = a.status; bVal = b.status; }
        else if (sortColumn === 'coaching') { aVal = getCoachingStatus(a.id) ? '1' : '0'; bVal = getCoachingStatus(b.id) ? '1' : '0'; }
        else if (sortColumn === 'referente') { aVal = getActiveReferente(a.id) || ''; bVal = getActiveReferente(b.id) || ''; }
        else if (sortColumn === 'created_by') { aVal = a.created_by || ''; bVal = b.created_by || ''; }

        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [studentsData, searchQuery, filterStatus, filterReferente, filterDateFrom, filterDateTo, sortColumn, sortDirection, lavorazioni]);

  // Actions
  const handleToggleStatus = (student: ExtendedStudent) => {
    setStudentsData(prev => prev.map(s =>
      s.id === student.id
        ? { ...s, status: s.status === 'active' ? 'blocked' : 'active', updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }
        : s
    ));
    toast.success(student.status === 'active' ? 'Studente bloccato' : 'Studente attivato');
  };

  const handleToggleMarketing = (student: ExtendedStudent) => {
    setStudentsData(prev => prev.map(s =>
      s.id === student.id
        ? { ...s, marketing_consent: !s.marketing_consent, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }
        : s
    ));
    toast.success(student.marketing_consent ? 'Consenso marketing rimosso' : 'Consenso marketing attivato');
  };

  const handleEditStudent = (student: ExtendedStudent) => {
    setEditStudentId(student.id);
    setShowCreateDrawer(true);
  };

  const handleOpenNotesDrawer = (student: ExtendedStudent) => {
    setSelectedStudentForNotes(student);
    setNotesDrawerOpen(true);
  };

  const handleAddNote = (content: string) => {
    if (!selectedStudentForNotes) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      admin: CURRENT_ADMIN,
      timestamp: new Date().toISOString()
    };
    setStudentsData(prev => prev.map(s =>
      s.id === selectedStudentForNotes.id
        ? { ...s, notes: [...(s.notes || []), newNote], updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }
        : s
    ));
    setSelectedStudentForNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), newNote] } : null);
    toast.success('Nota aggiunta');
  };

  const handleRemoveStudent = (student: ExtendedStudent) => {
    setConfirmDialog({ open: true, student });
  };

  const confirmRemoveStudent = () => {
    if (!confirmDialog.student) return;
    setStudentsData(prev => prev.filter(s => s.id !== confirmDialog.student!.id));
    toast.success('Studente rimosso');
    setConfirmDialog({ open: false, student: null });
  };

  const handleStudentCreated = (student: Student) => {
    const newStudent: ExtendedStudent = {
      ...student,
      notes: [],
      created_by: CURRENT_ADMIN,
      updated_by: CURRENT_ADMIN,
      updated_at: new Date().toISOString(),
    };
    setStudentsData(prev => [newStudent, ...prev]);
    addStudent(student);
    setShowCreateDrawer(false);
    toast.success('Studente creato');
  };

  const handleStudentUpdated = (student: Student) => {
    setStudentsData(prev => prev.map(s => s.id === student.id ? {
      ...student,
      notes: s.notes,
      created_by: s.created_by,
      updated_by: CURRENT_ADMIN,
      updated_at: new Date().toISOString()
    } : s));
    updateStudent(student.id, () => student);
    setShowCreateDrawer(false);
    setEditStudentId(null);
    toast.success('Studente aggiornato');
  };

  // Bulk Actions
  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(s => s.id));
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Attiva',
      icon: <CheckCircle size={16} />,
      onClick: (ids) => {
        setStudentsData(prev => prev.map(s =>
          ids.includes(s.id) ? { ...s, status: 'active', updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : s
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} studenti attivati`);
      },
      variant: 'default'
    },
    {
      label: 'Blocca',
      icon: <AlertCircle size={16} />,
      onClick: (ids) => {
        setStudentsData(prev => prev.map(s =>
          ids.includes(s.id) ? { ...s, status: 'blocked', updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : s
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} studenti bloccati`);
      },
      variant: 'secondary'
    },
  ];

  // Table Actions
  const getTableActions = (student: ExtendedStudent): TableAction[] => {
    const noteCount = student.notes?.length || 0;
    return [
      { label: 'Modifica', icon: <Edit size={16} />, onClick: () => handleEditStudent(student) },
      { label: `Note interne${noteCount > 0 ? ` (${noteCount})` : ''}`, icon: <StickyNote size={16} />, onClick: () => handleOpenNotesDrawer(student) },
      { label: student.marketing_consent ? 'Rimuovi consenso marketing' : 'Attiva consenso marketing', icon: student.marketing_consent ? <MailX size={16} /> : <Mail size={16} />, onClick: () => handleToggleMarketing(student) },
      { label: student.status === 'active' ? 'Blocca' : 'Attiva', icon: <Power size={16} />, onClick: () => handleToggleStatus(student), divider: true },
      { label: 'Rimuovi', icon: <Trash2 size={16} />, onClick: () => handleRemoveStudent(student), variant: 'destructive' }
    ];
  };

  const editStudent = editStudentId ? studentsData.find(s => s.id === editStudentId) ?? null : null;

  // ─── Navigate to lavorazione ─────────────────────────────
  const navigateToLavorazione = (serviceId: string) => {
    navigate(`/lavorazioni?highlight=${serviceId}`);
  };

  // Total columns count (checkbox, id, name, status, coaching, referente, created_by, notes, actions)
  const totalColumns = 9;

  // Gli studenti si creano dalle pipeline: il drawer è disponibile solo in edit mode

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Gestione Studenti</h1>
        <p className="page-subtitle">Gestisci i profili degli studenti. Gli studenti sono creati in Lavorazioni.</p>
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
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Studenti totali</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem', lineHeight: '1.5' }}>
            {stats.active} attivi
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">In coaching attivo</span>
            <div className="stat-icon"><UserCheck size={20} /></div>
          </div>
          <div className="stat-value">{stats.inCoaching}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem', lineHeight: '1.5' }}>
            su {stats.totalStudents} totali
          </div>
        </div>
        <div
          className="stat-card"
          onClick={() => setFilterTimeline(filterTimeline === 'without' ? 'all' : 'without')}
          style={{ cursor: 'pointer', outline: filterTimeline === 'without' ? '2px solid var(--primary)' : 'none' }}
          title="Clicca per filtrare gli studenti che necessitano timeline ma non ce l'hanno ancora"
        >
          <div className="stat-header">
            <span className="stat-label">Senza timeline</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: stats.withoutTimeline > 0 ? 'var(--destructive-foreground, #dc2626)' : 'var(--foreground)' }}>
            {stats.withoutTimeline}
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem', lineHeight: '1.5' }}>
            {stats.withoutTimeline > 0 ? 'da onboardare' : 'tutti onboardati'}
          </div>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per nome, ID o email..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
        </div>
        <div className="action-toolbar-right">
          {/* Creazione studente avviene dalla Pipeline */}
        </div>
        <style>{`
          @media (max-width: 768px) {
            .action-toolbar {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .action-toolbar > div { width: 100% !important; }
            .action-toolbar-right { width: 100% !important; justify-content: stretch !important; }
            .action-toolbar-right .btn { width: 100% !important; justify-content: center !important; }
          }
        `}</style>
      </div>

      {/* Filtri multipli */}
      <div style={{
        display: 'flex', gap: '1.5rem', padding: '1.5rem',
        backgroundColor: 'var(--background)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Stato
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="invited">Invitato</option>
            <option value="blocked">Bloccato</option>
          </select>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Referente
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterReferente} onChange={(e) => setFilterReferente(e.target.value)}>
            <option value="all">Tutti</option>
            {REFERENTI_SOTTOTESI.map(ref => (
              <option key={ref.id} value={ref.name}>{ref.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Timeline
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterTimeline} onChange={(e) => setFilterTimeline(e.target.value as 'all' | 'with' | 'without')}>
            <option value="all">Tutte</option>
            <option value="with">Con timeline</option>
            <option value="without">Da onboardare (timeline mancante)</option>
          </select>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Creato da
          </label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Creato fino a
          </label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={() => { setFilterStatus('all'); setFilterReferente('all'); setFilterTimeline('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
            style={{ height: 'fit-content' }}
          >
            Reset filtri
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1000px">
            <thead>
              <tr>
                <TableSelectionHeaderCell
                  width={columnWidths.checkbox}
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <TableHeaderCell id="id" label="ID" width={columnWidths.id} sortable sortDirection={sortColumn === 'id' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="name" label="Studente" width={columnWidths.name} sortable sortDirection={sortColumn === 'name' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} sortable sortDirection={sortColumn === 'status' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="coaching" label="Lavorazioni" width={columnWidths.coaching} sortable sortDirection={sortColumn === 'coaching' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="referente" label="Referente" width={columnWidths.referente} sortable sortDirection={sortColumn === 'referente' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="created_by" label="Inserito da" width={columnWidths.created_by} sortable sortDirection={sortColumn === 'created_by' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="notes" label="Note" width={columnWidths.notes} onResize={handleMouseDown} align="center" />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <TableEmptyState message="Nessuno studente trovato" colSpan={totalColumns} />
              ) : (
                filteredData.map((student) => {
                  const noteCount = student.notes?.length || 0;
                  const isSelected = selectedIds.includes(student.id);
                  const isExpanded = expandedRows.has(student.id);
                  const studentLavorazioni = getStudentLavorazioni(student.id);
                  const hasLavorazioni = studentLavorazioni.length > 0;
                  const activeRef = getActiveReferente(student.id);
                  const extraRef = getActiveReferenteExtra(student.id);
                  const isInCoaching = getCoachingStatus(student.id);
                  const derivedStatus = getDerivedStatus(student);
                  const hasTimeline = getHasTimeline(student.id);
                  const needsTimelineMissing = getNeedsTimelineButMissing(student.id);

                  return (
                    <React.Fragment key={student.id}>
                      <TableRow onClick={() => handleEditStudent(student)} selected={isSelected} selectedBackgroundColor="var(--selected-row-bg)">
                        <TableSelectionCell checked={isSelected} onCheckedChange={() => handleSelectRow(student.id)} onClick={(e) => e.stopPropagation()} />

                        <TableCell>
                          <CellTextSecondary>{student.id}</CellTextSecondary>
                        </TableCell>

                        <TableCell>
                          <CellContentStack>
                            <CellTextPrimary>{student.name}</CellTextPrimary>
                            <CellTextSecondary>{student.email}</CellTextSecondary>
                          </CellContentStack>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={derivedStatus.status} label={derivedStatus.label} />
                        </TableCell>

                        <TableCell onClick={(e) => { e.stopPropagation(); if (hasLavorazioni) toggleRowExpand(student.id); }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: hasLavorazioni ? 'pointer' : 'default' }}>
                            {hasLavorazioni && (
                              <ChevronRight
                                size={14}
                                style={{
                                  color: 'var(--muted-foreground)',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.15s ease',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <span style={{
                              fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: isInCoaching ? 'var(--primary)' : hasLavorazioni ? 'var(--foreground)' : 'var(--muted-foreground)',
                            }}>
                              {hasLavorazioni ? (
                                <>
                                  {studentLavorazioni.length} {studentLavorazioni.length === 1 ? 'servizio' : 'servizi'}
                                  {isInCoaching && (
                                    <span style={{
                                      marginLeft: '0.375rem', fontSize: '10px',
                                      padding: '0.0625rem 0.375rem', borderRadius: 'var(--radius-badge)',
                                      backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                                      color: 'var(--primary)', fontWeight: 'var(--font-weight-medium)',
                                    }}>
                                      coaching
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic' }}>—</span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: activeRef ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {activeRef ? (
                              <>
                                {activeRef}
                                {extraRef > 0 && (
                                  <span style={{
                                    marginLeft: '0.25rem', fontSize: '10px',
                                    color: 'var(--muted-foreground)',
                                    fontWeight: 'var(--font-weight-medium)',
                                  }}>
                                    +{extraRef}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>—</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <CellTextSecondary>{student.created_by || '—'}</CellTextSecondary>
                        </TableCell>

                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <NotesBadgeButton count={noteCount} onClick={() => handleOpenNotesDrawer(student)} />
                        </TableCell>

                        <TableActionCell
                          width={columnWidths.actions}
                          backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--background)'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TableActions actions={getTableActions(student)} />
                        </TableActionCell>
                      </TableRow>

                      {isExpanded && studentLavorazioni.map((svc) => (
                        <TableRow key={svc.id} selected selectedBackgroundColor="var(--muted)">
                          <TableCell />

                          <TableCell onClick={() => navigateToLavorazione(svc.id)}>
                            <div style={{
                              fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                              color: 'var(--primary)', cursor: 'pointer',
                              textDecoration: 'underline', textDecorationColor: 'transparent',
                              textUnderlineOffset: '2px', transition: 'text-decoration-color 0.15s ease',
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                            }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.textDecorationColor = 'var(--primary)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.textDecorationColor = 'transparent'; }}
                              title="Vai alla lavorazione"
                            >
                              {svc.id}
                              <ExternalLink size={11} style={{ opacity: 0.6 }} />
                            </div>
                          </TableCell>

                          <TableCell>
                            <CellContentStack>
                              <CellTextPrimary>{svc.service_name}</CellTextPrimary>
                              {svc.coach_name && <CellTextSecondary>Coach: {svc.coach_name}</CellTextSecondary>}
                            </CellContentStack>
                          </TableCell>

                          <TableCell />

                          <TableCell>
                            <StatusBadge
                              status={SERVICE_STATUS_MAP[svc.status] || 'inactive'}
                              label={SERVICE_STATUS_LABELS[svc.status] || svc.status}
                            />
                            {svc.status === 'paused' && (
                              <div style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '11px',
                                color: 'var(--muted-foreground)',
                                lineHeight: '1.5',
                                marginTop: '0.125rem',
                              }}>
                                {svc.pause_start_date ? (
                                  <>
                                    {svc.pause_start_date}
                                    {svc.pause_end_date ? ` → ${svc.pause_end_date}` : ' → in corso'}
                                  </>
                                ) : (
                                  <span style={{ fontStyle: 'italic' }}>Date pausa N/D</span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div style={{
                              fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: svc.referente ? 'var(--foreground)' : 'var(--muted-foreground)',
                              lineHeight: '1.5',
                            }}>
                              {svc.referente || '—'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <CellTextSecondary>{svc.created_at}</CellTextSecondary>
                          </TableCell>

                          <TableCell />
                          <TableActionPlaceholderCell width={columnWidths.actions} backgroundColor="var(--muted)" />
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.map((student) => {
              const noteCount = student.notes?.length || 0;
              const isSelected = selectedIds.includes(student.id);
              const studentLavorazioni = getStudentLavorazioni(student.id);
              const activeRef = getActiveReferente(student.id);
              const isExpanded = expandedRows.has(student.id);
              const mobileStatus = getDerivedStatus(student);

              return (
                <ResponsiveMobileCard key={student.id} backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--card)'}>
                  <ResponsiveMobileCardHeader>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(student.id)} />
                      <CellContentStack>
                        <CellTextSecondary>{student.id}</CellTextSecondary>
                        <CellTextPrimary>{student.name}</CellTextPrimary>
                        <CellTextSecondary>{student.email}</CellTextSecondary>
                      </CellContentStack>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <StatusBadge status={mobileStatus.status} label={mobileStatus.label} />
                      <TableActions actions={getTableActions(student)} />
                    </div>
                  </ResponsiveMobileCardHeader>

                  <ResponsiveMobileCardSection>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <ResponsiveMobileFieldLabel>Referente</ResponsiveMobileFieldLabel>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          {activeRef || '—'}
                        </div>
                      </div>

                      <div>
                        <ResponsiveMobileFieldLabel>Lavorazioni</ResponsiveMobileFieldLabel>
                        {studentLavorazioni.length > 0 ? (
                          <button
                            onClick={() => toggleRowExpand(student.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--primary)',
                              fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                            }}
                          >
                            {studentLavorazioni.length} {studentLavorazioni.length === 1 ? 'servizio' : 'servizi'}
                            <ChevronRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                          </button>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>—</span>
                        )}
                      </div>

                      <div>
                        <ResponsiveMobileFieldLabel>Note</ResponsiveMobileFieldLabel>
                        <button
                          onClick={() => handleOpenNotesDrawer(student)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          <StickyNote size={16} /> {noteCount}
                        </button>
                      </div>
                    </div>
                  </ResponsiveMobileCardSection>

                  {isExpanded && studentLavorazioni.length > 0 && (
                    <ResponsiveMobileCardSection marginBottom="0">
                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        {studentLavorazioni.map(svc => (
                          <div
                            key={svc.id}
                            onClick={() => navigateToLavorazione(svc.id)}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.5rem 0.75rem', backgroundColor: 'var(--muted)',
                              borderRadius: 'var(--radius)', marginBottom: '0.375rem', cursor: 'pointer',
                            }}
                          >
                            <div>
                              <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {svc.id} <ExternalLink size={10} style={{ opacity: 0.5 }} />
                              </div>
                              <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                {svc.service_name} {svc.referente && `· Ref: ${svc.referente}`}
                              </div>
                            </div>
                            <StatusBadge status={SERVICE_STATUS_MAP[svc.status] || 'inactive'} label={SERVICE_STATUS_LABELS[svc.status] || svc.status} />
                          </div>
                        ))}
                      </div>
                    </ResponsiveMobileCardSection>
                  )}
                </ResponsiveMobileCard>
              );
            })}
          </ResponsiveMobileCards>
        )}
      />

      {/* Drawer Studente */}
      <CreateStudentDrawer
        open={showCreateDrawer}
        onClose={() => { setShowCreateDrawer(false); setEditStudentId(null); }}
        onStudentCreated={handleStudentCreated}
        editStudent={editStudent}
        onStudentUpdated={handleStudentUpdated}
      />

      {/* Notes Drawer */}
      {selectedStudentForNotes && (
        <NotesDrawer
          isOpen={notesDrawerOpen}
          onClose={() => { setNotesDrawerOpen(false); setSelectedStudentForNotes(null); }}
          entityId={selectedStudentForNotes.id}
          entityType="Studente"
          entityName={selectedStudentForNotes.name}
          notes={selectedStudentForNotes.notes || []}
          onAddNote={handleAddNote}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.student && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={`Rimuovere ${confirmDialog.student.name}?`}
          description="Questa azione è irreversibile. Lo studente verrà rimosso dal sistema."
          confirmLabel="Rimuovi"
          cancelLabel="Annulla"
          onConfirm={confirmRemoveStudent}
          variant="destructive"
          itemsList={[
            `Studente: ${confirmDialog.student.name}`,
            `Lavorazioni: ${lavorazioni.filter(l => l.student_id === confirmDialog.student!.id).length}`,
            `Record accademici: ${(confirmDialog.student.academic_records || []).length}`,
            `Note interne: ${confirmDialog.student.notes?.length || 0}`
          ]}
        />
      )}


    </div>
  );
}