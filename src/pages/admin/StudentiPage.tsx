import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Edit, Trash2, Power, StickyNote, AlertCircle, CheckCircle, Users, Mail, MailX, UserCheck, ExternalLink, GitBranch, Clock } from 'lucide-react';
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
import { TableHeader } from '../../app/components/ui/TableHeader';
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
    timeline: 110,
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

  const getSortIcon = (column: SortKey) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />;
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

  // Total columns count (checkbox, id, name, status, coaching, timeline, referente, created_by, notes, actions)
  const totalColumns = 10;

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

      {/* Table - Desktop */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1000px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: `${columnWidths.checkbox}px`, position: 'relative', background: 'var(--muted)', borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
                  <Checkbox
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px', background: 'var(--border)' }} />
                </th>
                <TableHeader label="ID" columnKey="id" width={columnWidths.id} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Studente" columnKey="name" width={columnWidths.name} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Stato" columnKey="status" width={columnWidths.status} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Lavorazioni" columnKey="coaching" width={columnWidths.coaching} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Timeline" columnKey="timeline" width={columnWidths.timeline} onResize={handleMouseDown} icon={<GitBranch size={13} style={{ color: 'var(--muted-foreground)' }} />} />
                <TableHeader label="Referente" columnKey="referente" width={columnWidths.referente} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Inserito da" columnKey="created_by" width={columnWidths.created_by} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Note" columnKey="notes" width={columnWidths.notes} onResize={handleMouseDown} align="center" />
                <th style={{ width: `${columnWidths.actions}px`, position: 'sticky', right: 0, background: 'var(--muted)', borderBottom: '1px solid var(--border)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Azioni</span>
                </th>
              </tr>
            </thead>
            {filteredData.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={totalColumns} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      Nessuno studente trovato
                    </span>
                  </td>
                </tr>
              </tbody>
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
                  <tbody key={student.id}>
                    <tr
                      onClick={() => handleEditStudent(student)}
                      style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--selected-row-bg)' : undefined }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(student.id)} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        {student.id}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            {student.name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {student.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={derivedStatus.status} label={derivedStatus.label} />
                      </td>
                      {/* Lavorazioni — expandable */}
                      <td onClick={(e) => { e.stopPropagation(); if (hasLavorazioni) toggleRowExpand(student.id); }} style={{ cursor: hasLavorazioni ? 'pointer' : 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                      </td>
                      {/* Timeline — basata su needs_timeline della lavorazione */}
                      <td>
                        {hasTimeline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', padding: '0.125rem 0.5rem', backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)', borderRadius: 'var(--radius-badge)', lineHeight: '1.5' }}>
                            <GitBranch size={11} />
                            Presente
                          </span>
                        ) : needsTimelineMissing ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: '#dc2626', padding: '0.125rem 0.5rem', backgroundColor: 'color-mix(in srgb, #dc2626 10%, transparent)', borderRadius: 'var(--radius-badge)', lineHeight: '1.5' }}>
                            <Clock size={11} />
                            Da creare
                          </span>
                        ) : (
                          // needs_timeline:false oppure servizi non-coaching: timeline non prevista
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>—</span>
                        )}
                      </td>
                      {/* Referente (dalla lavorazione attiva) */}
                      <td>
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
                      </td>
                      {/* Inserito da */}
                      <td>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                          {student.created_by || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenNotesDrawer(student)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', padding: '0.25rem',
                            color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                          }}
                          title={`${noteCount} note`}
                        >
                          <StickyNote size={18} />
                          {noteCount > 0 && (
                            <span style={{
                              position: 'absolute', top: '-4px', right: '-4px',
                              backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
                              borderRadius: '50%', width: '16px', height: '16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 'var(--font-weight-medium)', fontFamily: 'var(--font-inter)',
                            }}>
                              {noteCount}
                            </span>
                          )}
                        </button>
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'sticky', right: 0,
                          backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--background)',
                          zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <TableActions actions={getTableActions(student)} />
                      </td>
                    </tr>

                    {/* ─── Expanded lavorazioni rows ──────────────── */}
                    {isExpanded && studentLavorazioni.map((svc) => (
                      <tr
                        key={svc.id}
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        {/* Spacer for checkbox */}
                        <td />
                        {/* ID lavorazione */}
                        <td
                          onClick={() => navigateToLavorazione(svc.id)}
                          style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                            color: 'var(--primary)', cursor: 'pointer',
                            textDecoration: 'underline', textDecorationColor: 'transparent',
                            textUnderlineOffset: '2px', transition: 'text-decoration-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableCellElement).style.textDecorationColor = 'var(--primary)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableCellElement).style.textDecorationColor = 'transparent'; }}
                          title="Vai alla lavorazione"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {svc.id}
                            <ExternalLink size={11} style={{ opacity: 0.6 }} />
                          </div>
                        </td>
                        {/* Servizio */}
                        <td>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            {svc.service_name}
                          </div>
                          {svc.coach_name && (
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                              Coach: {svc.coach_name}
                            </div>
                          )}
                        </td>
                        {/* Skip marketing */}
                        <td />
                        {/* Stato lavorazione */}
                        <td>
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
                        </td>
                        {/* Date piano */}
                        <td>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {svc.plan_start_date ? (
                              <>{svc.plan_start_date}{svc.plan_end_date ? ` → ${svc.plan_end_date}` : ' → in corso'}</>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>N/D</span>
                            )}
                          </div>
                        </td>
                        {/* Referente lavorazione */}
                        <td>
                          <div style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: svc.referente ? 'var(--foreground)' : 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {svc.referente || '—'}
                          </div>
                        </td>
                        {/* Creato da (lavorazione) */}
                        <td>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {svc.created_at}
                          </div>
                        </td>
                        {/* Empty note + actions */}
                        <td />
                        <td style={{
                          position: 'sticky', right: 0,
                          backgroundColor: 'var(--muted)',
                          zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                        }} />
                      </tr>
                    ))}
                  </tbody>
                );
              })
            )}
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredData.map((student) => {
          const noteCount = student.notes?.length || 0;
          const isSelected = selectedIds.includes(student.id);
          const studentLavorazioni = getStudentLavorazioni(student.id);
          const activeRef = getActiveReferente(student.id);
          const isExpanded = expandedRows.has(student.id);
          const mobileStatus = getDerivedStatus(student);

          return (
            <div
              key={student.id}
              style={{
                backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '1rem', marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(student.id)} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>{student.id}</div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{student.name}</div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{student.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={mobileStatus.status} label={mobileStatus.label} />
                  <TableActions actions={getTableActions(student)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>
                    Referente
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {activeRef || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>
                    Lavorazioni
                  </div>
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
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>Note</div>
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
              {/* Mobile expanded lavorazioni */}
              {isExpanded && studentLavorazioni.length > 0 && (
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
              )}
            </div>
          );
        })}
      </div>

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

      <style>{`
        @media (max-width: 768px) {
          .data-table { display: none !important; }
          .mobile-cards { display: block !important; }
        }
        .data-table tbody tr { transition: background-color 0.15s ease; }
        .data-table tbody tr:hover { background-color: var(--muted); }
      `}</style>
    </div>
  );
}