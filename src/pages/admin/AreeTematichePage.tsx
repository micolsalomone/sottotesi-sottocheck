import React, { useMemo, useState } from 'react';
import { Plus, X, Check, Pencil, Trash2, Search, FolderKanban, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAreeTematiche, type AreaTematica } from '@/app/data/AreeTematicheContext';
import { StatusBadge } from '@/app/components/StatusBadge';
import { AreaTematicaDetailDrawer } from '@/app/components/AreaTematicaDetailDrawer';
import { useTableResize } from '@/app/hooks/useTableResize';
import {
  CellContentStack,
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
} from '@/app/components/TablePrimitives';

const COACHES_LIST = [
  { id: 'C-07', name: 'Martina Rossi' },
  { id: 'C-08', name: 'Andrea Conti' },
  { id: 'C-12', name: 'Marco Bianchi' },
  { id: 'C-15', name: 'Elena Ferretti' },
  { id: 'C-20', name: 'Lucia Marchetti' },
];

const CURRENT_ADMIN = 'Francesca';

type SortKey = 'name' | 'status' | 'coachCount' | 'createdAt' | null;

const formatDateIT = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function AreeTematichePage() {
  const { aree, addArea, updateArea, removeArea, toggleAreaActive } = useAreeTematiche();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [detailAreaId, setDetailAreaId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCoachCoverage, setFilterCoachCoverage] = useState<'all' | 'with' | 'without'>('all');
  const [sortColumn, setSortColumn] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    name: 260,
    status: 120,
    coaches: 320,
    createdAt: 140,
    actions: 120,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--input-background)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    color: 'var(--foreground)',
    lineHeight: '1.5',
    outline: 'none',
  };

  const stats = useMemo(() => {
    const total = aree.length;
    const active = aree.filter(a => a.isActive).length;
    const withoutCoach = aree.filter(a => a.coachIds.length === 0).length;
    const totalCoachAssignments = aree.reduce((acc, a) => acc + a.coachIds.length, 0);
    return { total, active, withoutCoach, totalCoachAssignments };
  }, [aree]);

  const handleSort = (column: Exclude<SortKey, null>) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAree = useMemo(() => {
    let data = [...aree];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(area => {
        const coachNames = COACHES_LIST
          .filter(c => area.coachIds.includes(c.id))
          .map(c => c.name)
          .join(' ')
          .toLowerCase();
        return (
          area.name.toLowerCase().includes(q) ||
          area.description.toLowerCase().includes(q) ||
          area.id.toLowerCase().includes(q) ||
          coachNames.includes(q)
        );
      });
    }

    if (filterStatus !== 'all') {
      data = data.filter(area => (filterStatus === 'active' ? area.isActive : !area.isActive));
    }

    if (filterCoachCoverage === 'with') data = data.filter(area => area.coachIds.length > 0);
    if (filterCoachCoverage === 'without') data = data.filter(area => area.coachIds.length === 0);

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = '';
        let bVal = '';
        if (sortColumn === 'name') {
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
        } else if (sortColumn === 'status') {
          aVal = a.isActive ? 'active' : 'inactive';
          bVal = b.isActive ? 'active' : 'inactive';
        } else if (sortColumn === 'coachCount') {
          aVal = String(a.coachIds.length).padStart(3, '0');
          bVal = String(b.coachIds.length).padStart(3, '0');
        } else {
          aVal = a.createdAt;
          bVal = b.createdAt;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [aree, searchQuery, filterStatus, filterCoachCoverage, sortColumn, sortDirection]);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Inserisci un nome per l\'area tematica');
      return;
    }
    const now = new Date();
    const newArea: AreaTematica = {
      id: `AT-${now.getTime().toString().slice(-3)}`,
      name: newName.trim(),
      description: newDescription.trim(),
      coachIds: [],
      createdAt: now.toISOString().split('T')[0],
      isActive: true,
      created_by: CURRENT_ADMIN,
      updated_by: CURRENT_ADMIN,
      updated_at: now.toISOString(),
    };
    addArea(newArea);
    toast.success(`Area "${newArea.name}" creata`);
    setNewName('');
    setNewDescription('');
    setShowNewForm(false);
  };



  const handleDelete = (id: string) => {
    const area = aree.find(a => a.id === id);
    removeArea(id);
    toast.success(`Area "${area?.name}" rimossa`);
    setConfirmDeleteId(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Aree Tematiche</h1>
          <p className="page-subtitle">Gestione aree tematiche e assegnazione coach via drawer di dettaglio</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Totale aree</span>
            <div className="stat-icon"><FolderKanban size={20} /></div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{stats.active} attive</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Senza coach</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.withoutCoach}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>da assegnare</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Assegnazioni coach</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.totalCoachAssignments}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>collegamenti area-coach</div>
        </div>
      </div>

      <div className="action-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Cerca per nome area, descrizione, ID o coach..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>
        <div className="action-toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
            <Plus size={18} />
            Nuova area
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 160px', minWidth: '160px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Stato</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">Tutti</option>
            <option value="active">Attive</option>
            <option value="inactive">Inattive</option>
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Assegnazione coach</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterCoachCoverage} onChange={(e) => setFilterCoachCoverage(e.target.value as 'all' | 'with' | 'without')}>
            <option value="all">Tutte</option>
            <option value="with">Con coach</option>
            <option value="without">Senza coach</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterCoachCoverage('all'); setSortColumn('name'); setSortDirection('asc'); }}>Reset filtri</button>
      </div>

      {showNewForm && (
        <>
          <div onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', maxWidth: '100vw', background: 'var(--card)', borderLeft: '1px solid var(--border)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', margin: 0 }}>Nuova area tematica</h2>
              <button onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Nome *</label>
                <input type="text" placeholder="es. Economia e Management" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Descrizione</label>
                <input type="text" placeholder="Breve descrizione dell'area" value={newDescription} onChange={e => setNewDescription(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}>Annulla</button>
              <button className="btn btn-primary" onClick={handleCreate}><Check size={14} />Crea area</button>
            </div>
          </div>
        </>
      )}

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="980px">
            <thead>
              <tr>
                <TableHeaderCell id="name" label="Area" width={columnWidths.name} sortable sortDirection={sortColumn === 'name' ? sortDirection : null} onSort={(id) => handleSort(id as Exclude<SortKey, null>)} onResize={handleMouseDown} />
                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} sortable sortDirection={sortColumn === 'status' ? sortDirection : null} onSort={(id) => handleSort(id as Exclude<SortKey, null>)} onResize={handleMouseDown} />
                <TableHeaderCell id="coachCount" label="Coach Assegnati" width={columnWidths.coaches} sortable sortDirection={sortColumn === 'coachCount' ? sortDirection : null} onSort={(id) => handleSort(id as Exclude<SortKey, null>)} onResize={handleMouseDown} />
                <TableHeaderCell id="createdAt" label="Creata il" width={columnWidths.createdAt} sortable sortDirection={sortColumn === 'createdAt' ? sortDirection : null} onSort={(id) => handleSort(id as Exclude<SortKey, null>)} onResize={handleMouseDown} />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredAree.length === 0 ? (
                <TableEmptyState message="Nessuna area trovata" colSpan={5} />
              ) : (
                filteredAree.map(area => {
                  const assignedCoaches = COACHES_LIST.filter(c => area.coachIds.includes(c.id));
                  return (
                    <TableRow key={area.id}>
                      <TableCell>
                        <CellContentStack>
                          <CellTextPrimary>{area.name}</CellTextPrimary>
                          <CellTextSecondary>{area.description || '-'}</CellTextSecondary>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{area.id}</div>
                        </CellContentStack>
                      </TableCell>
                      <TableCell>
                        <span style={{ cursor: 'pointer' }} onClick={() => { toggleAreaActive(area.id); toast.success(area.isActive ? `Area "${area.name}" disattivata` : `Area "${area.name}" attivata`); }}>
                          <StatusBadge status={area.isActive ? 'active' : 'inactive'} label={area.isActive ? 'Attiva' : 'Inattiva'} />
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {assignedCoaches.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {assignedCoaches.map(coach => (
                                <span key={coach.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius-badge)', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>
                                  {coach.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <CellTextSecondary>Nessun coach assegnato</CellTextSecondary>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><CellTextPrimary>{formatDateIT(area.createdAt)}</CellTextPrimary></TableCell>
                      <TableActionCell width={columnWidths.actions}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}>
                          {confirmDeleteId === area.id ? (
                            <>
                              <button onClick={() => handleDelete(area.id)} className="btn btn-primary" style={{ padding: '0.35rem 0.55rem', minWidth: 'unset' }}><Check size={14} /></button>
                              <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem', minWidth: 'unset' }}><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setDetailAreaId(area.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem', minWidth: 'unset' }}><Pencil size={14} /></button>
                              <button onClick={() => setConfirmDeleteId(area.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.55rem', minWidth: 'unset', color: 'var(--destructive-foreground)' }}><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
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
            {filteredAree.map(area => (
              <ResponsiveMobileCard key={area.id}>
                <ResponsiveMobileCardHeader>
                  <CellContentStack>
                    <CellTextPrimary>{area.name}</CellTextPrimary>
                    <CellTextSecondary>{area.description || '-'}</CellTextSecondary>
                  </CellContentStack>
                  <StatusBadge status={area.isActive ? 'active' : 'inactive'} label={area.isActive ? 'Attiva' : 'Inattiva'} />
                </ResponsiveMobileCardHeader>
                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Coach assegnati</ResponsiveMobileFieldLabel>
                  <CellTextSecondary>{area.coachIds.length}</CellTextSecondary>
                </ResponsiveMobileCardSection>
                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Creata il</ResponsiveMobileFieldLabel>
                  <CellTextSecondary>{formatDateIT(area.createdAt)}</CellTextSecondary>
                </ResponsiveMobileCardSection>
              </ResponsiveMobileCard>
            ))}
          </ResponsiveMobileCards>
        )}
      />

      {aree.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
          Nessuna area tematica. Clicca "Nuova area" per crearne una.
        </div>
      )}

      <AreaTematicaDetailDrawer
        isOpen={detailAreaId !== null}
        areaId={detailAreaId}
        onClose={() => setDetailAreaId(null)}
        onDelete={(areaId) => {
          removeArea(areaId);
          toast.success('Area eliminata');
        }}
      />
    </div>
  );
}
