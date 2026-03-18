import React, { useState, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Download, RefreshCw, Trash2, StickyNote, Pencil, Check } from 'lucide-react';
import { TableHeader } from '../components/ui/TableHeader';
import { useTableResize } from '../hooks/useTableResize';
import { toast } from 'sonner';
import { StatusBadge, type StatusType } from '../components/StatusBadge';
import { TableActions, type TableAction } from '../components/TableActions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../components/BulkActionsBar';
import { NotesDrawer, type Note } from '../components/NotesDrawer';
import { Checkbox } from '../components/ui/checkbox';

interface CheckReport {
  id: string;
  similarityPercentage: number;
  plagiarismDetected: boolean;
  aiDetectionPercentage: number;
  generatedAt: string;
  pdfUrl: string;
}

interface CoachingCheckJob {
  id: string;
  coach_name: string;
  student: string;
  student_id: string;
  service_id: string;
  lavorazione_name: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  startedAt: string;
  completedAt: string | null;
  document_name?: string;
  characters: number;
  pages: number;
  copyleaks_credits: number;
  credits_max: number;
  credits_used: number;
  report?: CheckReport;
  notes?: Note[];
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

const STATUS_MAP: Record<string, StatusType> = {
  completed: 'completed',
  running: 'in-progress',
  failed: 'error',
  pending: 'pending',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completato',
  running: 'In corso',
  failed: 'Fallito',
  pending: 'In attesa',
};

const mockJobs: CoachingCheckJob[] = [
  {
    id: 'JOB-089',
    coach_name: 'Martina Rossi',
    student: 'Giulia Verdi',
    student_id: 'STU-445',
    service_id: 'SS-101',
    lavorazione_name: 'Coaching - Giulia Verdi',
    status: 'completed',
    startedAt: '2026-02-08 15:00',
    completedAt: '2026-02-08 15:22',
    document_name: 'capitolo_3_verdi.pdf',
    characters: 38400,
    pages: 16,
    copyleaks_credits: 16,
    credits_max: 300,
    credits_used: 76,
    report: {
      id: 'REP-089',
      similarityPercentage: 12.5,
      plagiarismDetected: false,
      aiDetectionPercentage: 8.3,
      generatedAt: '2026-02-08',
      pdfUrl: '/reports/REP-089.pdf'
    },
    notes: [
      { id: 'N-C1', content: 'Controllo effettuato dal coach durante revisione cap. 3', admin: 'Claudia', timestamp: '2026-02-08 16:00' }
    ]
  },
  {
    id: 'JOB-090',
    coach_name: 'Martina Rossi',
    student: 'Giulia Verdi',
    student_id: 'STU-445',
    service_id: 'SS-101',
    lavorazione_name: 'Coaching - Giulia Verdi',
    status: 'completed',
    startedAt: '2026-01-20 11:30',
    completedAt: '2026-01-20 11:48',
    document_name: 'introduzione_verdi.pdf',
    characters: 24500,
    pages: 10,
    copyleaks_credits: 10,
    credits_max: 300,
    credits_used: 60,
    report: {
      id: 'REP-090',
      similarityPercentage: 6.1,
      plagiarismDetected: false,
      aiDetectionPercentage: 2.0,
      generatedAt: '2026-01-20',
      pdfUrl: '/reports/REP-090.pdf'
    },
    notes: []
  },
  {
    id: 'JOB-091',
    coach_name: 'Marco Bianchi',
    student: 'Luca Neri',
    student_id: 'STU-478',
    service_id: 'SS-117',
    lavorazione_name: 'Coaching Plus - Luca Neri',
    status: 'running',
    startedAt: '2026-03-05 09:15',
    completedAt: null,
    document_name: 'prima_stesura_neri.pdf',
    characters: 52000,
    pages: 22,
    copyleaks_credits: 22,
    credits_max: 500,
    credits_used: 22,
    notes: []
  },
  {
    id: 'JOB-092',
    coach_name: 'Elena Ferretti',
    student: 'Francesca Moretti',
    student_id: 'STU-512',
    service_id: 'SS-110',
    lavorazione_name: 'Coaching Plus - Francesca Moretti',
    status: 'completed',
    startedAt: '2026-02-20 14:00',
    completedAt: '2026-02-20 14:35',
    document_name: 'analisi_dati_moretti.pdf',
    characters: 71200,
    pages: 30,
    copyleaks_credits: 30,
    credits_max: 500,
    credits_used: 128,
    report: {
      id: 'REP-092',
      similarityPercentage: 31.4,
      plagiarismDetected: true,
      aiDetectionPercentage: 42.1,
      generatedAt: '2026-02-20',
      pdfUrl: '/reports/REP-092.pdf'
    },
    notes: [
      { id: 'N-C2', content: 'Risultati critici: similarita e AI detection alti. Coach avvisato.', admin: 'Francesca', timestamp: '2026-02-20 15:00' }
    ]
  },
  {
    id: 'JOB-093',
    coach_name: 'Andrea Conti',
    student: 'Paolo Russo',
    student_id: 'STU-501',
    service_id: 'SS-132',
    lavorazione_name: 'Starter Pack - Paolo Russo',
    status: 'failed',
    startedAt: '2026-03-01 16:00',
    completedAt: '2026-03-01 16:05',
    document_name: 'bozza_tesi_russo.pdf',
    characters: 45800,
    pages: 19,
    copyleaks_credits: 0,
    credits_max: 100,
    credits_used: 0,
    notes: [
      { id: 'N-C3', content: 'Errore API Copyleaks - timeout. Da riavviare.', admin: 'Francesca', timestamp: '2026-03-01 16:10' }
    ]
  },
];

const CURRENT_ADMIN = 'Francesca';

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  color: 'var(--muted-foreground)',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-base)',
  color: 'var(--foreground)',
  lineHeight: '1.5',
};

const valueBoldStyle: React.CSSProperties = {
  ...valueStyle,
  fontWeight: 'var(--font-weight-medium)' as any,
};

const statLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '11px',
  fontWeight: 'var(--font-weight-medium)' as any,
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-alegreya)',
  fontSize: '20px',
  fontWeight: 'var(--font-weight-bold)' as any,
  lineHeight: '1.2',
};

function formatNumber(n: number): string {
  return n.toLocaleString('it-IT');
}

function getCreditsUsageColor(used: number, max: number): string {
  const ratio = used / max;
  if (ratio >= 0.9) return 'var(--destructive-foreground)';
  if (ratio >= 0.7) return 'var(--chart-3)';
  return 'var(--foreground)';
}

export function JobPage() {
  const [jobs, setJobs] = useState<CoachingCheckJob[]>(
    mockJobs.map(j => ({
      ...j,
      created_by: 'Francesca',
      created_at: j.startedAt,
      updated_by: 'Francesca',
      updated_at: j.completedAt || j.startedAt,
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedJob, setSelectedJob] = useState<CoachingCheckJob | null>(null);

  // Editing credits_max inline
  const [editingCreditsId, setEditingCreditsId] = useState<string | null>(null);
  const [editCreditsValue, setEditCreditsValue] = useState<number>(0);

  // Notes drawer
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [notesJobId, setNotesJobId] = useState<string | null>(null);

  // Confirm dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [jobToRestart, setJobToRestart] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Filters Reset ──────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Sort
  type SortKey = 'id' | 'coach_name' | 'student' | 'lavorazione_name' | 'status' | 'startedAt' | 'characters' | 'pages' | 'copyleaks_credits' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column widths
  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    id: 85,
    coach: 140,
    student: 130,
    lavorazione: 160,
    characters: 90,
    pages: 70,
    credits: 120,
    status: 105,
    startedAt: 140,
    notes: 55,
    actions: 65,
  });

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

  const filteredData = useMemo(() => {
    let data = [...jobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(j =>
        j.student.toLowerCase().includes(q) ||
        j.coach_name.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.lavorazione_name.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') data = data.filter(j => j.status === filterStatus);
    if (filterDateFrom) data = data.filter(j => j.startedAt >= filterDateFrom);
    if (filterDateTo) data = data.filter(j => j.startedAt <= filterDateTo);

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];
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
  }, [jobs, sortColumn, sortDirection, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || filterDateFrom || filterDateTo;

  // Stats
  const stats = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const running = jobs.filter(j => j.status === 'running').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    const totalCreditsUsed = jobs.reduce((sum, j) => sum + j.copyleaks_credits, 0);
    return { total, completed, running, failed, totalCreditsUsed };
  }, [jobs]);

  // Handlers
  const handleViewDetails = (job: CoachingCheckJob) => setSelectedJob(job);

  const handleOpenNotes = (jobId: string) => {
    setNotesJobId(jobId);
    setNotesDrawerOpen(true);
  };

  const handleAddNote = (content: string) => {
    if (!notesJobId) return;
    const newNote: Note = {
      id: `N-${Date.now()}`,
      content,
      admin: CURRENT_ADMIN,
      timestamp: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].slice(0, 5)
    };
    setJobs(prev => prev.map(j =>
      j.id === notesJobId ? { ...j, notes: [...(j.notes || []), newNote], updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : j
    ));
    toast.success('Nota aggiunta');
  };

  const handleDeleteJob = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      setJobs(prev => prev.filter(j => j.id !== jobToDelete));
      setJobToDelete(null);
      toast.success('Controllo eliminato');
    }
  };

  const handleRestartJob = (jobId: string) => {
    setJobToRestart(jobId);
    setRestartConfirmOpen(true);
  };

  const confirmRestart = () => {
    if (jobToRestart) {
      setJobs(prev => prev.map(j =>
        j.id === jobToRestart ? { ...j, status: 'pending' as const, completedAt: null, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : j
      ));
      setJobToRestart(null);
      toast.success('Controllo riavviato');
    }
  };

  const handleDownloadReport = (job: CoachingCheckJob) => {
    console.log('Download report:', job.report?.pdfUrl);
  };

  const startEditCredits = (job: CoachingCheckJob) => {
    setEditingCreditsId(job.id);
    setEditCreditsValue(job.credits_max);
  };

  const saveEditCredits = () => {
    if (editingCreditsId && editCreditsValue > 0) {
      setJobs(prev => prev.map(j =>
        j.id === editingCreditsId ? { ...j, credits_max: editCreditsValue, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : j
      ));
      if (selectedJob && selectedJob.id === editingCreditsId) {
        setSelectedJob(prev => prev ? { ...prev, credits_max: editCreditsValue, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : null);
      }
      toast.success('Limite crediti aggiornato');
    }
    setEditingCreditsId(null);
  };

  // Bulk selection
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(j => j.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Riavvia falliti',
      icon: <RefreshCw size={16} />,
      onClick: (ids) => {
        const failedIds = ids.filter(id => jobs.find(j => j.id === id)?.status === 'failed');
        if (failedIds.length === 0) {
          toast.error('Nessun controllo fallito selezionato');
          return;
        }
        setJobs(prev => prev.map(j =>
          failedIds.includes(j.id) ? { ...j, status: 'pending' as const, completedAt: null, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : j
        ));
        setSelectedIds([]);
        toast.success(`${failedIds.length} controlli riavviati`);
      },
      variant: 'default'
    },
    {
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      onClick: (ids) => {
        setJobs(prev => prev.filter(j => !ids.includes(j.id)));
        setSelectedIds([]);
        toast.success(`${ids.length} controlli eliminati`);
      },
      variant: 'destructive'
    },
  ];

  // Table Actions (no "Note interne" — already in column)
  const getTableActions = (job: CoachingCheckJob): TableAction[] => {
    const actions: TableAction[] = [
      { label: 'Vedi dettagli', icon: <ExternalLink size={16} />, onClick: () => handleViewDetails(job) },
    ];

    if (job.report) {
      actions.push({ label: 'Scarica report', icon: <Download size={16} />, onClick: () => handleDownloadReport(job), divider: true });
    }

    if (job.status === 'failed') {
      actions.push({ label: 'Riavvia controllo', icon: <RefreshCw size={16} />, onClick: () => handleRestartJob(job.id) });
    }

    actions.push({
      label: 'Modifica limite crediti',
      icon: <Pencil size={16} />,
      onClick: () => startEditCredits(job),
    });

    actions.push({ label: 'Elimina', icon: <Trash2 size={16} />, onClick: () => handleDeleteJob(job.id), variant: 'destructive' });

    return actions;
  };

  const notesJob = jobs.find(j => j.id === notesJobId);

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Sottocheck Coaching</h1>
        <p className="page-subtitle">Controlli Check Plagio/AI avviati dai coach durante i piani coaching</p>
        <style>{`@media (max-width: 768px) { .page-header { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; } }`}</style>
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Totale{hasActiveFilters ? ' (filtrati)' : ''}</div>
          <div style={{ ...statValueStyle, color: 'var(--foreground)' }}>{filteredData.length}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Completati</div>
          <div style={{ ...statValueStyle, color: 'var(--primary)' }}>{stats.completed}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: stats.running > 0 ? '2px solid var(--chart-2)' : '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>In corso</div>
          <div style={{ ...statValueStyle, color: stats.running > 0 ? 'var(--chart-2)' : 'var(--muted-foreground)' }}>{stats.running}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: stats.failed > 0 ? '2px solid var(--destructive-foreground)' : '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Falliti</div>
          <div style={{ ...statValueStyle, color: stats.failed > 0 ? 'var(--destructive-foreground)' : 'var(--muted-foreground)' }}>{stats.failed}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Crediti usati</div>
          <div style={{ ...statValueStyle, color: 'var(--foreground)' }}>{formatNumber(stats.totalCreditsUsed)}</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input type="text" placeholder="Cerca per ID, coach, studente o lavorazione..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }} />
        </div>
        <style>{`
          @media (max-width: 768px) { .action-toolbar { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; flex-direction: column !important; align-items: stretch !important; } .action-toolbar > div { width: 100% !important; } }
        `}</style>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>Stato</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="completed">Completato</option>
            <option value="running">In corso</option>
            <option value="failed">Fallito</option>
            <option value="pending">In attesa</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>Avviato da</label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>Avviato fino a</label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={handleResetFilters} style={{ height: 'fit-content' }}>Reset filtri</button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Data Table */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1300px' }}>
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
                <TableHeader label="Coach" columnKey="coach_name" width={columnWidths.coach} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Studente" columnKey="student" width={columnWidths.student} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Lavorazione" columnKey="lavorazione_name" width={columnWidths.lavorazione} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Caratteri" columnKey="characters" width={columnWidths.characters} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} align="right" />
                <TableHeader label="Pag." columnKey="pages" width={columnWidths.pages} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} align="right" />
                <TableHeader label="Crediti / Max" columnKey="copyleaks_credits" width={columnWidths.credits} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} align="right" />
                <TableHeader label="Stato" columnKey="status" width={columnWidths.status} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Avviato" columnKey="startedAt" width={columnWidths.startedAt} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Note" columnKey="notes" width={columnWidths.notes} onResize={handleMouseDown} align="center" />
                <th style={{ width: `${columnWidths.actions}px`, position: 'sticky', right: 0, backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      Nessun controllo coaching trovato
                    </span>
                  </td>
                </tr>
              ) : (
                filteredData.map((job) => {
                  const noteCount = (job.notes || []).length;
                  const isSelected = selectedIds.includes(job.id);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => handleViewDetails(job)}
                      style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--selected-row-bg)' : undefined }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(job.id)} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        {job.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {job.coach_name}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {job.student}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        {job.lavorazione_name}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5', textAlign: 'right' }}>
                        {formatNumber(job.characters)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5', textAlign: 'right' }}>
                        {job.pages}
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        {editingCreditsId === job.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <span style={{ color: 'var(--foreground)' }}>{job.credits_used} /</span>
                            <input
                              type="number"
                              value={editCreditsValue}
                              onChange={(e) => setEditCreditsValue(parseInt(e.target.value) || 0)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEditCredits(); if (e.key === 'Escape') setEditingCreditsId(null); }}
                              autoFocus
                              style={{
                                width: '60px', padding: '0.125rem 0.25rem',
                                border: '1px solid var(--primary)', borderRadius: 'var(--radius)',
                                fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
                                textAlign: 'right', outline: 'none',
                                backgroundColor: 'var(--background)', color: 'var(--foreground)',
                              }}
                            />
                            <button onClick={saveEditCredits} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', padding: '0.125rem' }}>
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: getCreditsUsageColor(job.credits_used, job.credits_max) }}>
                            {job.credits_used} / {job.credits_max}
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={STATUS_MAP[job.status]} label={STATUS_LABELS[job.status]} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {job.startedAt}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenNotes(job.id)}
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
                        style={{ position: 'sticky', right: 0, backgroundColor: 'var(--background)', zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)' }}
                      >
                        <TableActions actions={getTableActions(job)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredData.map((job) => {
          const isSelected = selectedIds.includes(job.id);
          return (
            <div key={job.id} style={{
              backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--card)',
              border: `1px solid var(--border)`,
              borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '0.125rem' }}>
                    <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(job.id)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{job.id}</div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{job.student}</div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{job.coach_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge status={STATUS_MAP[job.status]} label={STATUS_LABELS[job.status]} />
                  <TableActions actions={getTableActions(job)} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                {job.lavorazione_name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Caratteri</div>
                  <div style={valueStyle}>{formatNumber(job.characters)}</div>
                </div>
                <div>
                  <div style={labelStyle}>Pag.</div>
                  <div style={valueStyle}>{job.pages}</div>
                </div>
                <div>
                  <div style={labelStyle}>Crediti</div>
                  <div style={{ ...valueStyle, color: getCreditsUsageColor(job.credits_used, job.credits_max) }}>{job.credits_used}/{job.credits_max}</div>
                </div>
                <div>
                  <div style={labelStyle}>Avviato</div>
                  <div style={valueStyle}>{job.startedAt.split(' ')[0]}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) { .data-table { display: none !important; } .mobile-cards { display: block !important; } }
      `}</style>

      {/* Detail Drawer */}
      {selectedJob && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }} onClick={() => setSelectedJob(null)} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px',
            backgroundColor: 'var(--background)', zIndex: 50, boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>
                  Dettaglio Controllo Coaching
                </h2>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
                  {selectedJob.id} &mdash; Check Plagio/AI
                </p>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              {/* Informazioni principali */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                  Informazioni principali
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={labelStyle}>Coach</div>
                    <div style={valueBoldStyle}>{selectedJob.coach_name}</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Studente</div>
                    <div style={valueBoldStyle}>{selectedJob.student} ({selectedJob.student_id})</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={labelStyle}>Lavorazione</div>
                    <div style={valueBoldStyle}>{selectedJob.lavorazione_name} ({selectedJob.service_id})</div>
                  </div>
                  <div>
                    <div style={labelStyle}>Stato</div>
                    <StatusBadge status={STATUS_MAP[selectedJob.status]} label={STATUS_LABELS[selectedJob.status]} />
                  </div>
                  {selectedJob.document_name && (
                    <div>
                      <div style={labelStyle}>Documento</div>
                      <div style={valueBoldStyle}>{selectedJob.document_name}</div>
                    </div>
                  )}
                  <div>
                    <div style={labelStyle}>Data avvio</div>
                    <div style={valueStyle}>{selectedJob.startedAt}</div>
                  </div>
                  {selectedJob.completedAt && (
                    <div>
                      <div style={labelStyle}>Data completamento</div>
                      <div style={valueStyle}>{selectedJob.completedAt}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dati documento & crediti */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                  Dati documento & crediti
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={labelStyle}>Caratteri</div>
                    <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {formatNumber(selectedJob.characters)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={labelStyle}>Pagine</div>
                    <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {selectedJob.pages}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={labelStyle}>Crediti questo check</div>
                    <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: selectedJob.copyleaks_credits > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      {selectedJob.copyleaks_credits > 0 ? formatNumber(selectedJob.copyleaks_credits) : '-'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={labelStyle}>Crediti piano</div>
                    <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: getCreditsUsageColor(selectedJob.credits_used, selectedJob.credits_max), lineHeight: '1.5' }}>
                      {selectedJob.credits_used} / {selectedJob.credits_max}
                    </div>
                  </div>
                </div>

                {/* Credits progress bar */}
                <div style={{ marginTop: '0.75rem', padding: '0 0.25rem' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (selectedJob.credits_used / selectedJob.credits_max) * 100)}%`,
                      height: '100%',
                      backgroundColor: getCreditsUsageColor(selectedJob.credits_used, selectedJob.credits_max),
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      {Math.round((selectedJob.credits_used / selectedJob.credits_max) * 100)}% utilizzato
                    </span>
                    <button
                      onClick={() => startEditCredits(selectedJob)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--primary)',
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: 0,
                      }}
                    >
                      <Pencil size={11} /> Modifica limite
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                  Crediti calcolati da API Copyleaks. Limite max modificabile dall'admin.
                </div>
              </div>

              {/* Report */}
              {selectedJob.report && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                    Report
                  </h3>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleDownloadReport(selectedJob)}>
                      <Download size={16} /> Scarica report PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Tracking */}
              {selectedJob.created_by && (
                <div style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={labelStyle}>Creato da</div>
                      <div style={valueStyle}>{selectedJob.created_by}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Creato il</div>
                      <div style={valueStyle}>{selectedJob.created_at}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Aggiornato da</div>
                      <div style={valueStyle}>{selectedJob.updated_by}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Aggiornato il</div>
                      <div style={valueStyle}>{selectedJob.updated_at}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Notes Drawer */}
      {notesJob && (
        <NotesDrawer
          isOpen={notesDrawerOpen}
          onClose={() => { setNotesDrawerOpen(false); setNotesJobId(null); }}
          entityId={notesJob.id}
          entityType="Controllo Coaching"
          entityName={`${notesJob.coach_name} - ${notesJob.student}`}
          notes={notesJob.notes || []}
          onAddNote={handleAddNote}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Elimina controllo"
        description="Sei sicuro di voler eliminare questo controllo? Questa azione non puo essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={confirmDelete}
        variant="destructive"
      />
      <ConfirmDialog
        open={restartConfirmOpen}
        onOpenChange={setRestartConfirmOpen}
        title="Riavvia controllo"
        description="Sei sicuro di voler riavviare questo controllo fallito? Verra messo nuovamente in coda."
        confirmLabel="Riavvia"
        cancelLabel="Annulla"
        onConfirm={confirmRestart}
        variant="default"
      />
    </div>
  );
}