import React, { useState, useMemo } from 'react';
import { Plus, X, ExternalLink, Download, RefreshCw, Trash2, StickyNote } from 'lucide-react';
import {
  CellTextPrimary,
  CellTextSecondary,
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
import { toast } from 'sonner';
import { StatusBadge, type StatusType } from '../../app/components/StatusBadge';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { ConfirmDialog } from '../../app/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { NotesDrawer, type Note } from '../../app/components/NotesDrawer';
import { Checkbox } from '../../app/components/ui/checkbox';

interface CheckReport {
  id: string;
  similarityPercentage: number;
  plagiarismDetected: boolean;
  aiDetectionPercentage: number;
  generatedAt: string;
  pdfUrl: string;
}

interface Job {
  id: string;
  student: string;
  student_id: string;
  service_id?: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  startedAt: string;
  completedAt: string | null;
  document_name?: string;
  characters: number;
  pages: number;
  copyleaks_credits: number;
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

const mockJobs: Job[] = [
  {
    id: 'SC-101',
    student: 'Marco Bianchi',
    student_id: 'STU-601',
    service_id: 'SS-201',
    status: 'completed',
    startedAt: '2026-01-15 10:30',
    completedAt: '2026-01-15 10:55',
    document_name: 'tesi_bianchi_cap3.pdf',
    characters: 42350,
    pages: 18,
    copyleaks_credits: 19,
    report: {
      id: 'REP-201',
      similarityPercentage: 18.2,
      plagiarismDetected: false,
      aiDetectionPercentage: 5.1,
      generatedAt: '2026-01-15',
      pdfUrl: '/reports/REP-201.pdf'
    },
    notes: [
      { id: 'N-1', content: 'Risultato nella norma', admin: 'Claudia', timestamp: '2026-01-15 11:00' }
    ]
  },
  {
    id: 'SC-102',
    student: 'Anna Russo',
    student_id: 'STU-602',
    status: 'completed',
    startedAt: '2026-01-20 14:00',
    completedAt: '2026-01-20 14:18',
    document_name: 'tesi_russo_completa.pdf',
    characters: 98200,
    pages: 42,
    copyleaks_credits: 42,
    report: {
      id: 'REP-202',
      similarityPercentage: 22.7,
      plagiarismDetected: true,
      aiDetectionPercentage: 3.4,
      generatedAt: '2026-01-20',
      pdfUrl: '/reports/REP-202.pdf'
    },
    notes: []
  },
  {
    id: 'SC-103',
    student: 'Federico Conti',
    student_id: 'STU-603',
    status: 'running',
    startedAt: '2026-02-28 09:00',
    completedAt: null,
    document_name: 'capitolo_finale.pdf',
    characters: 35600,
    pages: 15,
    copyleaks_credits: 15,
    notes: []
  },
  {
    id: 'SC-104',
    student: 'Elena Marchetti',
    student_id: 'STU-604',
    status: 'failed',
    startedAt: '2026-02-25 16:30',
    completedAt: '2026-02-25 16:32',
    document_name: 'tesi_marchetti.pdf',
    characters: 67800,
    pages: 29,
    copyleaks_credits: 0,
    notes: [
      { id: 'N-2', content: 'Errore nel processamento, da riavviare', admin: 'Francesca', timestamp: '2026-02-25 16:35' }
    ]
  },
  {
    id: 'SC-105',
    student: 'Davide Ferretti',
    student_id: 'STU-605',
    status: 'pending',
    startedAt: '2026-03-01 08:00',
    completedAt: null,
    document_name: 'ref_ferretti.pdf',
    characters: 54100,
    pages: 23,
    copyleaks_credits: 0,
    notes: []
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

export function LavorazioniSottocheckPage() {
  const [jobs, setJobs] = useState<Job[]>(
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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
  type SortKey = 'id' | 'student' | 'status' | 'startedAt' | 'characters' | 'pages' | 'copyleaks_credits' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column widths
  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    id: 90,
    student: 150,
    characters: 100,
    pages: 80,
    credits: 90,
    status: 110,
    startedAt: 150,
    completedAt: 150,
    notes: 60,
    actions: 70,
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
        j.id.toLowerCase().includes(q) ||
        (j.document_name || '').toLowerCase().includes(q)
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
    const pending = jobs.filter(j => j.status === 'pending').length;
    const totalCredits = jobs.reduce((sum, j) => sum + j.copyleaks_credits, 0);
    return { total, completed, running, failed, pending, totalCredits };
  }, [jobs]);

  // Actions handlers
  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
  };

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
      toast.success('Lavorazione eliminata');
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
      toast.success('Lavorazione riavviata');
    }
  };

  const handleDownloadReport = (job: Job) => {
    console.log('Download report:', job.report?.pdfUrl);
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
          toast.error('Nessuna lavorazione fallita selezionata');
          return;
        }
        setJobs(prev => prev.map(j =>
          failedIds.includes(j.id) ? { ...j, status: 'pending' as const, completedAt: null, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : j
        ));
        setSelectedIds([]);
        toast.success(`${failedIds.length} lavorazioni riavviate`);
      },
      variant: 'default'
    },
    {
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      onClick: (ids) => {
        setJobs(prev => prev.filter(j => !ids.includes(j.id)));
        setSelectedIds([]);
        toast.success(`${ids.length} lavorazioni eliminate`);
      },
      variant: 'destructive'
    },
  ];

  // Table Actions (no "Note interne" — already in column)
  const getTableActions = (job: Job): TableAction[] => {
    const actions: TableAction[] = [
      {
        label: 'Vedi dettagli',
        icon: <ExternalLink size={16} />,
        onClick: () => handleViewDetails(job)
      },
    ];

    if (job.report) {
      actions.push({
        label: 'Scarica report',
        icon: <Download size={16} />,
        onClick: () => handleDownloadReport(job),
        divider: true
      });
    }

    if (job.status === 'failed') {
      actions.push({
        label: 'Riavvia controllo',
        icon: <RefreshCw size={16} />,
        onClick: () => handleRestartJob(job.id)
      });
    }

    actions.push({
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      onClick: () => handleDeleteJob(job.id),
      variant: 'destructive'
    });

    return actions;
  };

  const notesJob = jobs.find(j => j.id === notesJobId);

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Lavorazioni Sottocheck</h1>
        <p className="page-subtitle">Controlli Check Plagio/AI del sistema Sottocheck</p>
        <style>{`@media (max-width: 768px) { .page-header { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; } }`}</style>
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Totale{hasActiveFilters ? ' (filtrate)' : ''}</div>
          <div style={{ ...statValueStyle, color: 'var(--foreground)' }}>{filteredData.length}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Completate</div>
          <div style={{ ...statValueStyle, color: 'var(--primary)' }}>{stats.completed}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: stats.running > 0 ? '2px solid var(--chart-2)' : '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>In corso</div>
          <div style={{ ...statValueStyle, color: stats.running > 0 ? 'var(--chart-2)' : 'var(--muted-foreground)' }}>{stats.running}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: stats.failed > 0 ? '2px solid var(--destructive-foreground)' : '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Fallite</div>
          <div style={{ ...statValueStyle, color: stats.failed > 0 ? 'var(--destructive-foreground)' : 'var(--muted-foreground)' }}>{stats.failed}</div>
        </div>
        <div style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.75rem 1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={statLabelStyle}>Crediti totali</div>
          <div style={{ ...statValueStyle, color: 'var(--foreground)' }}>{formatNumber(stats.totalCredits)}</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per ID, studente o documento..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
        </div>
        <div className="action-toolbar-right">
          <button className="btn btn-primary">
            <Plus size={18} />
            Nuova lavorazione
          </button>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .action-toolbar { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; flex-direction: column !important; align-items: stretch !important; }
            .action-toolbar > div { width: 100% !important; }
            .action-toolbar-right { width: 100% !important; justify-content: stretch !important; }
            .action-toolbar-right .btn { width: 100% !important; justify-content: center !important; }
          }
        `}</style>
      </div>

      {/* Filtri */}
      <div style={{
        display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem',
        flexWrap: 'wrap', alignItems: 'flex-end'
      }}>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Stato
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="completed">Completato</option>
            <option value="running">In corso</option>
            <option value="failed">Fallito</option>
            <option value="pending">In attesa</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Avviato da
          </label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
            Avviato fino a
          </label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={handleResetFilters} style={{ height: 'fit-content' }}>
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
          <TableRoot minWidth="1150px">
            <thead>
              <tr>
                <TableSelectionHeaderCell
                  width={columnWidths.checkbox}
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <TableHeaderCell id="id" label="ID" width={columnWidths.id} sortable sortDirection={sortColumn === 'id' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="student" label="Studente" width={columnWidths.student} sortable sortDirection={sortColumn === 'student' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="characters" label="Caratteri" width={columnWidths.characters} sortable align="right" sortDirection={sortColumn === 'characters' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="pages" label="Pagine" width={columnWidths.pages} sortable align="right" sortDirection={sortColumn === 'pages' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="copyleaks_credits" label="Crediti" width={columnWidths.credits} sortable align="right" sortDirection={sortColumn === 'copyleaks_credits' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} sortable sortDirection={sortColumn === 'status' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="startedAt" label="Avviato" width={columnWidths.startedAt} sortable sortDirection={sortColumn === 'startedAt' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="completedAt" label="Completato" width={columnWidths.completedAt} onResize={handleMouseDown} />
                <TableHeaderCell id="notes" label="Note" width={columnWidths.notes} align="center" onResize={handleMouseDown} />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <TableEmptyState message="Nessuna lavorazione trovata" colSpan={11} />
              ) : (
                filteredData.map((job) => {
                  const noteCount = (job.notes || []).length;
                  const isSelected = selectedIds.includes(job.id);

                  return (
                    <TableRow
                      key={job.id}
                      onClick={() => handleViewDetails(job)}
                      selected={isSelected}
                      selectedBackgroundColor="var(--selected-row-bg)"
                    >
                      <TableSelectionCell
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(job.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <TableCell><CellTextSecondary>{job.id}</CellTextSecondary></TableCell>
                      <TableCell><CellTextPrimary>{job.student}</CellTextPrimary></TableCell>
                      <TableCell align="right"><CellTextPrimary>{formatNumber(job.characters)}</CellTextPrimary></TableCell>
                      <TableCell align="right"><CellTextPrimary>{job.pages}</CellTextPrimary></TableCell>
                      <TableCell align="right"><CellTextPrimary>{job.copyleaks_credits > 0 ? formatNumber(job.copyleaks_credits) : '-'}</CellTextPrimary></TableCell>
                      <TableCell>
                        <StatusBadge status={STATUS_MAP[job.status]} label={STATUS_LABELS[job.status]} />
                      </TableCell>
                      <TableCell><CellTextPrimary>{formatDateTimeIT(job.startedAt)}</CellTextPrimary></TableCell>
                      <TableCell><CellTextPrimary>{job.completedAt ? formatDateTimeIT(job.completedAt) : '-'}</CellTextPrimary></TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
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
                      </TableCell>
                      <TableActionCell
                        width={columnWidths.actions}
                        backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--background)'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TableActions actions={getTableActions(job)} />
                      </TableActionCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.map((job) => {
              const isSelected = selectedIds.includes(job.id);
              const noteCount = (job.notes || []).length;

              return (
                <ResponsiveMobileCard key={job.id} backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--card)'}>
                  <ResponsiveMobileCardHeader>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                      <div style={{ paddingTop: '0.125rem' }}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectRow(job.id)} />
                      </div>
                      <div>
                        <CellTextSecondary>{job.id}</CellTextSecondary>
                        <CellTextPrimary>{job.student}</CellTextPrimary>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusBadge status={STATUS_MAP[job.status]} label={STATUS_LABELS[job.status]} />
                      <TableActions actions={getTableActions(job)} />
                    </div>
                  </ResponsiveMobileCardHeader>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <ResponsiveMobileFieldLabel>Caratteri</ResponsiveMobileFieldLabel>
                      <CellTextPrimary>{formatNumber(job.characters)}</CellTextPrimary>
                    </div>
                    <div>
                      <ResponsiveMobileFieldLabel>Pagine</ResponsiveMobileFieldLabel>
                      <CellTextPrimary>{job.pages}</CellTextPrimary>
                    </div>
                    <div>
                      <ResponsiveMobileFieldLabel>Crediti</ResponsiveMobileFieldLabel>
                      <CellTextPrimary>{job.copyleaks_credits > 0 ? job.copyleaks_credits : '-'}</CellTextPrimary>
                    </div>
                  </div>

                  <ResponsiveMobileCardSection marginBottom="0.75rem">
                    <ResponsiveMobileFieldLabel>Avviato</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{formatDateTimeIT(job.startedAt)}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                  {job.completedAt && (
                    <ResponsiveMobileCardSection marginBottom="0.75rem">
                      <ResponsiveMobileFieldLabel>Completato</ResponsiveMobileFieldLabel>
                      <CellTextPrimary>{formatDateTimeIT(job.completedAt)}</CellTextPrimary>
                    </ResponsiveMobileCardSection>
                  )}
                  <ResponsiveMobileCardSection marginBottom="0">
                    <ResponsiveMobileFieldLabel>Note interne</ResponsiveMobileFieldLabel>
                    <button
                      onClick={() => handleOpenNotes(job.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: 0,
                        color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                      }}
                    >
                      <StickyNote size={16} />
                      {noteCount > 0 ? `${noteCount} note` : 'Nessuna nota'}
                    </button>
                  </ResponsiveMobileCardSection>
                </ResponsiveMobileCard>
              );
            })}
          </ResponsiveMobileCards>
        )}
      />

      {/* Detail Drawer */}
      {selectedJob && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }}
            onClick={() => setSelectedJob(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px',
            backgroundColor: 'var(--background)', zIndex: 50, boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>
                  Dettaglio Lavorazione
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={labelStyle}>Studente</div>
                    <div style={valueBoldStyle}>{selectedJob.student} ({selectedJob.student_id})</div>
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

              {/* Dati documento */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                  Dati documento & crediti
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
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
                    <div style={labelStyle}>Crediti Copyleaks</div>
                    <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: selectedJob.copyleaks_credits > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      {selectedJob.copyleaks_credits > 0 ? formatNumber(selectedJob.copyleaks_credits) : '-'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                  Crediti calcolati da API Copyleaks in base al contenuto del documento
                </div>
              </div>

              {/* Report */}
              {selectedJob.report && (
                <div>
                  <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                    Report
                  </h3>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={labelStyle}>Report ID</div>
                        <div style={valueBoldStyle}>{selectedJob.report.id}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: selectedJob.report.similarityPercentage > 20 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(11, 182, 63, 0.05)',
                          borderRadius: 'var(--radius)',
                          border: `1px solid ${selectedJob.report.similarityPercentage > 20 ? 'var(--destructive-foreground)' : 'var(--primary)'}`
                        }}>
                          <div style={labelStyle}>Similarita</div>
                          <div style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-h3)',
                            color: selectedJob.report.similarityPercentage > 20 ? 'var(--destructive-foreground)' : 'var(--primary)',
                            fontWeight: 'var(--font-weight-bold)', lineHeight: '1.5'
                          }}>
                            {selectedJob.report.similarityPercentage}%
                          </div>
                        </div>
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: selectedJob.report.aiDetectionPercentage > 30 ? 'rgba(255, 193, 7, 0.05)' : 'rgba(11, 182, 63, 0.05)',
                          borderRadius: 'var(--radius)',
                          border: `1px solid ${selectedJob.report.aiDetectionPercentage > 30 ? 'var(--chart-3)' : 'var(--primary)'}`
                        }}>
                          <div style={labelStyle}>AI Detection</div>
                          <div style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-h3)',
                            color: selectedJob.report.aiDetectionPercentage > 30 ? 'var(--chart-3)' : 'var(--primary)',
                            fontWeight: 'var(--font-weight-bold)', lineHeight: '1.5'
                          }}>
                            {selectedJob.report.aiDetectionPercentage}%
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        Generato il {selectedJob.report.generatedAt}
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleDownloadReport(selectedJob)}>
                      <Download size={16} />
                      Scarica report PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Tracking */}
              {selectedJob.created_by && (
                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={labelStyle}>Creato da</div>
                      <div style={valueStyle}>{selectedJob.created_by}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Creato il</div>
                      <div style={valueStyle}>{formatDateTimeIT(selectedJob.created_at)}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Aggiornato da</div>
                      <div style={valueStyle}>{selectedJob.updated_by}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Aggiornato il</div>
                      <div style={valueStyle}>{formatDateTimeIT(selectedJob.updated_at)}</div>
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
          entityType="Lavorazione"
          entityName={`Check Plagio/AI - ${notesJob.student}`}
          notes={notesJob.notes || []}
          onAddNote={handleAddNote}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Elimina lavorazione"
        description="Sei sicuro di voler eliminare questa lavorazione? Questa azione non puo essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={confirmDelete}
        variant="destructive"
      />
      <ConfirmDialog
        open={restartConfirmOpen}
        onOpenChange={setRestartConfirmOpen}
        title="Riavvia lavorazione"
        description="Sei sicuro di voler riavviare questa lavorazione fallita? Verra messa nuovamente in coda."
        confirmLabel="Riavvia"
        cancelLabel="Annulla"
        onConfirm={confirmRestart}
        variant="default"
      />
    </div>
  );
}