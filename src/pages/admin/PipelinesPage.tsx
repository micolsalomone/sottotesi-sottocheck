import * as React from 'react';
import { useState, useEffect, useMemo, useRef, MouseEvent, CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLavorazioni } from '../../app/data/LavorazioniContext';
import type { Pipeline } from '../../app/data/LavorazioniContext';
import { PipelineDetailDrawer } from '../../app/components/PipelineDetailDrawer';
import { CreatePipelineDrawer } from '../../app/components/CreatePipelineDrawer';
import { CreateLavorazioneDrawer } from '../../app/components/CreateLavorazioneDrawer';
import { CreateStudentDrawer } from '../../app/components/CreateStudentDrawer';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { ConfirmDialog } from '../../app/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import { 
  ResponsiveTableLayout,
  ResponsiveMobileCards,
  ResponsiveMobileCard,
  TableRoot, 
  TableHeaderCell, 
  TableRow, 
  TableCell, 
  TableEmptyState,
  StudentTypeBadge,
  CellTextPrimary,
  CellTextSecondary,
  CellContentStack,
  StatusPill
} from '../../app/components/TablePrimitives';

type SortKey = 'student_name' | 'email' | 'created_at' | 'lavorazioni_count' | null;

export function PipelinesPage() {
  const { pipelines, removePipeline, students, updateStudent } = useLavorazioni();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  // ─── Search & Filters ─────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  
  // ─── Sort ─────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // ─── Bulk selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // ─── Drawers & Modals ─────────────────────────────────────
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createLavorazioneDrawerOpen, setCreateLavorazioneDrawerOpen] = useState(false);
  const [pipelineToConvert, setPipelineToConvert] = useState<Pipeline | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);

  const [studentProfileDrawerOpen, setStudentProfileDrawerOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  // Effect to handle highlight
  useEffect(() => {
    if (highlightId) {
      setSearchQuery('');
      setSourceFilter('all');
      const found = pipelines.find(p => p.id === highlightId);
      if (found) {
        setSelectedPipeline(found);
        setDetailDrawerOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [highlightId, pipelines, setSearchParams]);
  
  // ─── Column widths ────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    name: 230,
    email: 200,
    phone: 140,
    sources: 200,
    created_at: 120,
    quote_status: 150,
    lavorazioni: 100,
    actions: 80,
  });

  // ─── Column resize ────────────────────────────────────────
  const handleMouseDown = (columnKey: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: any) => {
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

  // ─── Unique sources for filter ────────────────────────────
  const availableSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    pipelines.forEach(p => p.sources.forEach(s => sourcesSet.add(s)));
    return Array.from(sourcesSet).sort();
  }, [pipelines]);

  // ─── Sort handler (3-state cycle) ─────────────────────────
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

  // ─── Filtered & sorted data ───────────────────────────────
  const filteredData = useMemo(() => {
    let data = [...pipelines];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p =>
        p.student_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== 'all') {
      data = data.filter(p => p.sources.includes(sourceFilter));
    }

    if (quoteStatusFilter !== 'all') {
      data = data.filter(p => p.quotes?.some(q => q.status === quoteStatusFilter));
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'student_name':
            aVal = a.student_name.toLowerCase();
            bVal = b.student_name.toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          case 'lavorazioni_count':
            aVal = a.lavorazioni_ids.length;
            bVal = b.lavorazioni_ids.length;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [pipelines, searchQuery, sourceFilter, sortColumn, sortDirection, quoteStatusFilter]);

  // ─── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = pipelines.length;
    const withLavorazioni = pipelines.filter(p => p.lavorazioni_ids.length > 0).length;
    const converted = pipelines.filter(p => p.lavorazioni_ids.length > 0).length;
    const expiringSoon = pipelines.filter(p => p.quotes?.some(q => q.status === 'expiring_soon')).length;
    const expired = pipelines.filter(p => p.quotes?.some(q => q.status === 'expired')).length;
    return { total, withLavorazioni, converted, expiringSoon, expired };
  }, [pipelines]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleRowClick = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setDetailDrawerOpen(true);
  };

  const handleConvertToLavorazione = (pipeline: Pipeline) => {
    setPipelineToConvert(pipeline);
    setCreateLavorazioneDrawerOpen(true);
  };

  const handleDeletePipeline = (pipeline: Pipeline) => {
    setPipelineToDelete(pipeline);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pipelineToDelete) {
      removePipeline(pipelineToDelete.id);
      setDeleteDialogOpen(false);
      setPipelineToDelete(null);
    }
  };

  const getActions = (pipeline: Pipeline): TableAction[] => [
    { label: 'Visualizza dettagli', onClick: () => handleRowClick(pipeline) },
    { label: 'Crea Lavorazione', onClick: () => handleConvertToLavorazione(pipeline) },
    { label: 'Elimina', onClick: () => handleDeletePipeline(pipeline), variant: 'destructive' },
  ];

  // ─── Bulk actions ─────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(p => p.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Elimina selezionate',
      onClick: () => {
        selectedIds.forEach(id => removePipeline(id));
        setSelectedIds([]);
      },
      variant: 'destructive',
    },
  ];

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setQuoteStatusFilter('all');
    setSortColumn('created_at');
    setSortDirection('desc');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getQuoteVariant = (status?: string): any => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'sent': return 'info';
      case 'expired': return 'error';
      case 'expiring_soon': return 'warning';
      case 'draft': return 'neutral';
      default: return 'neutral';
    }
  };

  const getQuoteLabel = (status?: string) => {
    switch (status) {
      case 'accepted': return 'Accettato';
      case 'rejected': return 'Rifiutato';
      case 'sent': return 'Inviato';
      case 'expired': return 'Scaduto';
      case 'expiring_soon': return 'In scadenza';
      case 'draft': return 'Bozza';
      default: return '—';
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Pipelines</h1>
        <p className="page-subtitle">Acquisizione lead e conversione in lavorazioni</p>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Totale Pipelines</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Con Lavorazioni</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.withLavorazioni}</div>
        </div>

        <div className="stat-card" style={{ border: '1px solid var(--warning)', background: 'rgba(247, 144, 9, 0.05)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--warning)' }}>In Scadenza (5gg)</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.expiringSoon}</div>
        </div>

        <div className="stat-card" style={{ border: '1px solid var(--destructive-foreground)', background: 'var(--destructive)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--destructive-foreground)' }}>Scaduti</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--destructive-foreground)' }}>{stats.expired}</div>
        </div>
      </div>

      {/* ACTION TOOLBAR */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per nome, email, telefono o ID..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
        </div>

        <div className="action-toolbar-right">
          <button className="btn btn-primary" onClick={() => setCreateDrawerOpen(true)}>
            <Plus size={18} />
            Nuova Pipeline
          </button>
        </div>
      </div>

      {/* FILTERS */}
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
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Fonte acquisizione</label>
          <select className="select-dropdown w-full" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">Tutte le fonti</option>
            {availableSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Stato preventivo</label>
          <select className="select-dropdown w-full" value={quoteStatusFilter} onChange={(e) => setQuoteStatusFilter(e.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="sent">Inviato</option>
            <option value="accepted">Accettato</option>
            <option value="rejected">Rifiutato</option>
            <option value="expired">Scaduto</option>
            <option value="expiring_soon">In scadenza</option>
          </select>
        </div>

        <div className="flex items-end">
          <button className="btn btn-secondary h-fit" onClick={resetFilters}>Reset filtri</button>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* DATA TABLE (desktop) + CARDS (mobile) */}
      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1200px">
        <thead>
          <tr>
            <TableHeaderCell id="checkbox" label="" width={columnWidths.checkbox} onResize={handleMouseDown}>
              <Checkbox
                checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHeaderCell>

            <TableHeaderCell
              id="student_name"
              label="Nome"
              width={columnWidths.name}
              sortable
              sortDirection={sortColumn === 'student_name' ? sortDirection : null}
              onSort={() => handleSort('student_name')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell
              id="email"
              label="Email"
              width={columnWidths.email}
              sortable
              sortDirection={sortColumn === 'email' ? sortDirection : null}
              onSort={() => handleSort('email')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="phone" label="Telefono" width={columnWidths.phone} onResize={handleMouseDown} />
            <TableHeaderCell id="sources" label="Fonti" width={columnWidths.sources} onResize={handleMouseDown} />

            <TableHeaderCell
              id="created_at"
              label="Data acq."
              width={columnWidths.created_at}
              sortable
              sortDirection={sortColumn === 'created_at' ? sortDirection : null}
              onSort={() => handleSort('created_at')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="quote_status" label="Stato Prev." width={columnWidths.quote_status} onResize={handleMouseDown} />

            <TableHeaderCell
              id="lavorazioni_count"
              label="N° Lav."
              width={columnWidths.lavorazioni}
              sortable
              sortDirection={sortColumn === 'lavorazioni_count' ? sortDirection : null}
              onSort={() => handleSort('lavorazioni_count')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="actions" label="Azioni" width={columnWidths.actions} sticky="right" align="center" />
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <TableEmptyState message="Nessuna pipeline trovata" colSpan={9} />
          ) : (
            filteredData.map(pipeline => {
              const quote = pipeline.quotes?.[0];

              return (
                <TableRow
                  key={pipeline.id}
                  onClick={() => handleRowClick(pipeline)}
                  highlighted={highlightId === pipeline.id}
                >
                  <TableCell width={columnWidths.checkbox} align="center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(pipeline.id)}
                      onCheckedChange={() => handleSelectRow(pipeline.id)}
                    />
                  </TableCell>

                  <TableCell width={columnWidths.name}>
                    <CellContentStack>
                      <div className="flex items-center gap-2">
                        <CellTextPrimary>{pipeline.student_name}</CellTextPrimary>
                        <StudentTypeBadge isStudent={pipeline.lavorazioni_ids.length > 0 || pipeline.linked_existing_student === true} />
                      </div>
                      <CellTextSecondary>{pipeline.id}</CellTextSecondary>
                    </CellContentStack>
                  </TableCell>

                  <TableCell width={columnWidths.email}>
                    <CellTextSecondary>{pipeline.email}</CellTextSecondary>
                  </TableCell>

                  <TableCell width={columnWidths.phone}>
                    <CellTextSecondary>{pipeline.phone}</CellTextSecondary>
                  </TableCell>

                  <TableCell width={columnWidths.sources}>
                    <div className="flex flex-wrap gap-1">
                      {pipeline.sources.map(source => (
                        <StatusPill key={source} label={source} variant="neutral" />
                      ))}
                    </div>
                  </TableCell>

                  <TableCell width={columnWidths.created_at}>
                    <CellTextSecondary>{formatDate(pipeline.created_at)}</CellTextSecondary>
                  </TableCell>

                  <TableCell width={columnWidths.quote_status}>
                    {quote ? (
                      <StatusPill label={getQuoteLabel(quote.status)} variant={getQuoteVariant(quote.status)} />
                    ) : (
                      <CellTextSecondary>—</CellTextSecondary>
                    )}
                  </TableCell>

                  <TableCell width={columnWidths.lavorazioni} align="center">
                    <CellTextPrimary>{pipeline.lavorazioni_ids.length}</CellTextPrimary>
                  </TableCell>

                  <TableCell width={columnWidths.actions} sticky="right" align="center" onClick={(e) => e.stopPropagation()}>
                    <TableActions actions={getActions(pipeline)} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.length === 0 ? (
              <ResponsiveMobileCard>
                <div style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                  padding: '1rem 0',
                }}>
                  Nessuna pipeline trovata
                </div>
              </ResponsiveMobileCard>
            ) : (
              filteredData.map((pipeline) => {
                const quote = pipeline.quotes?.[0];
                const isSelected = selectedIds.includes(pipeline.id);

                return (
                  <ResponsiveMobileCard key={pipeline.id}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(pipeline.id)}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--foreground)',
                              lineHeight: '1.5',
                            }}>
                              {pipeline.student_name}
                            </div>
                            <StudentTypeBadge isStudent={pipeline.lavorazioni_ids.length > 0 || pipeline.linked_existing_student === true} />
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {pipeline.id}
                          </div>
                        </div>
                      </div>

                      <TableActions actions={getActions(pipeline)} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => handleRowClick(pipeline)}>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {pipeline.email}
                      </div>

                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {pipeline.phone}
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {pipeline.sources.map((source) => (
                          <StatusPill key={source} label={source} variant="neutral" />
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <StatusPill
                          label={quote ? getQuoteLabel(quote.status) : '—'}
                          variant={quote ? getQuoteVariant(quote.status) : 'neutral'}
                        />

                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}>
                          {pipeline.lavorazioni_ids.length} lav. · {formatDate(pipeline.created_at)}
                        </div>
                      </div>
                    </div>
                  </ResponsiveMobileCard>
                );
              })
            )}
          </ResponsiveMobileCards>
        )}
      />

      {/* DRAWERS */}
      {selectedPipeline && (
        <PipelineDetailDrawer
          pipeline={selectedPipeline}
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          onConvertToLavorazione={handleConvertToLavorazione}
          onOpenStudentProfile={(studentId) => {
            setSelectedStudentId(studentId);
            setStudentProfileDrawerOpen(true);
          }}
        />
      )}

      {selectedStudent && (
        <CreateStudentDrawer
          open={studentProfileDrawerOpen}
          onClose={() => setStudentProfileDrawerOpen(false)}
          onStudentCreated={() => {}}
          editStudent={selectedStudent}
          onStudentUpdated={(updated) => {
            updateStudent(updated.id, () => updated);
            setStudentProfileDrawerOpen(false);
            toast.success('Studente aggiornato');
          }}
        />
      )}

      <CreatePipelineDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onCreateAndConvert={(pipeline) => {
          setPipelineToConvert(pipeline);
          setCreateLavorazioneDrawerOpen(true);
        }}
      />

      {pipelineToConvert && (
        <CreateLavorazioneDrawer
          open={createLavorazioneDrawerOpen}
          onOpenChange={setCreateLavorazioneDrawerOpen}
          prefilledPipeline={pipelineToConvert}
        />
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Elimina Pipeline"
        description={`Sei sicuro di voler eliminare la pipeline di ${pipelineToDelete?.student_name}?`}
        confirmLabel="Elimina"
        variant="destructive"
      />
    </div>
  );
}
