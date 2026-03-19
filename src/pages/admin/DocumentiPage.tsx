import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  User,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useTableResize } from '../../app/hooks/useTableResize';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
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
  TableSelectionCell,
  TableSelectionHeaderCell,
} from '../../app/components/TablePrimitives';
import { toast } from 'sonner';

const formatDateIT = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface Document {
  id: string;
  name: string;
  step?: number;
  totalSteps?: number;
  author: string;
  authorType: 'studente' | 'coach' | 'admin';
  service: string;
  uploadedAt: string;
  status: 'visible' | 'hidden';
  size: string;
}

const mockDocuments: Document[] = [
  { id: 'DOC-001', name: 'Contratto_Verdi_v1.pdf', step: 1, totalSteps: 6, author: 'Giulia Verdi', authorType: 'studente', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '1.2 MB' },
  { id: 'DOC-002', name: 'Capitolo_1_Rossi.docx', step: 3, totalSteps: 6, author: 'Marco Rossi', authorType: 'studente', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-09', status: 'visible', size: '450 KB' },
  { id: 'DOC-003', name: 'Correzioni_Cap1.pdf', step: 3, totalSteps: 6, author: 'Martina Rossi', authorType: 'coach', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '2.1 MB' },
  { id: 'DOC-004', name: 'CI_Neri_Fronte.jpg', step: 1, totalSteps: 4, author: 'Luca Neri', authorType: 'studente', service: 'SS-103 (Catalogo)', uploadedAt: '2026-03-05', status: 'hidden', size: '890 KB' },
  { id: 'DOC-005', name: 'Piano_Studi_Bianchi.pdf', step: 2, totalSteps: 5, author: 'Elena Bianchi', authorType: 'studente', service: 'SS-104 (Coaching)', uploadedAt: '2026-03-01', status: 'visible', size: '5.4 MB' },
  { id: 'DOC-006', name: 'Report_Finale.pdf', step: 5, totalSteps: 6, author: 'Martina Rossi', authorType: 'coach', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-12', status: 'visible', size: '1.8 MB' },
  { id: 'DOC-007', name: 'Contratto_Firma.pdf', step: 1, totalSteps: 5, author: 'Paolo Russo', authorType: 'studente', service: 'SS-105 (Coaching)', uploadedAt: '2026-02-28', status: 'visible', size: '1.5 MB' },
];

export function DocumentiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [sortColumn, setSortColumn] = useState<keyof Document | null>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    id: 100,
    name: 240,
    step: 110,
    author: 160,
    service: 180,
    uploadedAt: 130,
    status: 110,
    actions: 80,
  });

  const handleSort = (column: keyof Document) => {
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
    let data = [...mockDocuments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.author.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') data = data.filter(d => d.status === filterStatus);

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = a[sortColumn] || '';
        let bVal = b[sortColumn] || '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [searchQuery, filterType, filterStatus, sortColumn, sortDirection]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(d => d.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getTableActions = (doc: Document): TableAction[] => [
    { label: 'Scarica', icon: <Download size={16} />, onClick: () => toast.success(`Download ${doc.name} avviato`) },
    { 
      label: doc.status === 'visible' ? 'Nascondi' : 'Mostra', 
      icon: doc.status === 'visible' ? <EyeOff size={16} /> : <Eye size={16} />, 
      onClick: () => toast.success(`Documento ${doc.status === 'visible' ? 'nascosto' : 'visibile'}`) 
    },
    { label: 'Vai al percorso', icon: <ExternalLink size={16} />, onClick: () => toast.info('Navigazione al percorso collegato'), divider: true },
    { label: 'Elimina', icon: <Trash2 size={16} />, onClick: () => toast.error('Azione non disponibile in demo'), variant: 'destructive' },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Scarica selezionati', icon: <Download size={16} />, onClick: (ids) => toast.success(`Download di ${ids.length} documenti avviato`) },
    { label: 'Nascondi selezionati', icon: <EyeOff size={16} />, onClick: (ids) => toast.success(`${ids.length} documenti nascosti`) },
    { label: 'Elimina', icon: <Trash2 size={16} />, onClick: (ids) => toast.error('Azione non disponibile in demo'), variant: 'destructive' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Documenti</h1>
        <p className="page-subtitle">Modifica, nascondi e scarica i documenti caricati nel sistema</p>
      </div>

      <div className="action-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Cerca per nome, autore o ID..." 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>
        <div className="action-toolbar-right">
          <button className="btn btn-primary" onClick={() => toast.info('Solo Admin: caricamento manuale non previsto in MVP')}>
            <Plus size={18} />
            Carica documento
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Visibilità</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="visible">Visibile</option>
            <option value="hidden">Nascosto</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>Reset</button>
      </div>

      <BulkActionsBar 
        selectedCount={selectedIds.length} 
        selectedIds={selectedIds} 
        actions={bulkActions} 
        onClearSelection={() => setSelectedIds([])} 
      />

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1100px">
            <thead>
              <tr>
                <TableSelectionHeaderCell
                  width={columnWidths.checkbox}
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <TableHeaderCell id="id" label="ID" width={columnWidths.id} sortable sortDirection={sortColumn === 'id' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="name" label="Nome File" width={columnWidths.name} sortable sortDirection={sortColumn === 'name' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="step" label="Step Timeline" width={columnWidths.step} onResize={handleMouseDown} />
                <TableHeaderCell id="author" label="Autore" width={columnWidths.author} sortable sortDirection={sortColumn === 'author' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="service" label="Percorso" width={columnWidths.service} onResize={handleMouseDown} />
                <TableHeaderCell id="uploadedAt" label="Caricato" width={columnWidths.uploadedAt} sortable sortDirection={sortColumn === 'uploadedAt' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} onResize={handleMouseDown} />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <TableEmptyState message="Nessun documento trovato" colSpan={9} />
              ) : (
                filteredData.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <TableRow key={doc.id} selected={isSelected} selectedBackgroundColor="var(--selected-row-bg)">
                      <TableSelectionCell checked={isSelected} onCheckedChange={() => handleSelectRow(doc.id)} onClick={(e) => e.stopPropagation()} />
                      <TableCell><CellTextSecondary>{doc.id}</CellTextSecondary></TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <CellContentStack>
                            <CellTextPrimary>{doc.name}</CellTextPrimary>
                            <CellTextSecondary>{doc.size}</CellTextSecondary>
                          </CellContentStack>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.step !== undefined ? (
                          <span style={{ padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-badge)', background: 'var(--muted)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                            Step {doc.step}{doc.totalSteps !== undefined ? ` di ${doc.totalSteps}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <User size={14} style={{ color: 'var(--muted-foreground)' }} />
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}>
                            {doc.author}
                            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginLeft: '0.25rem', textTransform: 'uppercase' }}>({doc.authorType})</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><CellTextSecondary>{doc.service}</CellTextSecondary></TableCell>
                      <TableCell><CellTextPrimary>{formatDateIT(doc.uploadedAt)}</CellTextPrimary></TableCell>
                      <TableCell>
                        {doc.status === 'visible' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><Eye size={14} /> Visibile</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><EyeOff size={14} /> Nascosto</span>
                        )}
                      </TableCell>
                      <TableActionCell width={columnWidths.actions} backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--background)'}>
                        <TableActions actions={getTableActions(doc)} />
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
            {filteredData.map((doc) => (
              <ResponsiveMobileCard key={doc.id} backgroundColor={selectedIds.includes(doc.id) ? 'var(--selected-row-bg)' : 'var(--card)'}>
                <ResponsiveMobileCardHeader>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Checkbox checked={selectedIds.includes(doc.id)} onCheckedChange={() => handleSelectRow(doc.id)} />
                    <CellContentStack>
                      <CellTextSecondary>{doc.id}</CellTextSecondary>
                      <CellTextPrimary>{doc.name}</CellTextPrimary>
                      <CellTextSecondary>{doc.size}</CellTextSecondary>
                    </CellContentStack>
                  </div>
                  <TableActions actions={getTableActions(doc)} />
                </ResponsiveMobileCardHeader>

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Step Timeline</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{doc.step !== undefined ? `Step ${doc.step}${doc.totalSteps !== undefined ? ` di ${doc.totalSteps}` : ''}` : '—'}</CellTextPrimary>
                </ResponsiveMobileCardSection>

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Autore</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{doc.author}</CellTextPrimary>
                  <CellTextSecondary>{doc.authorType}</CellTextSecondary>
                </ResponsiveMobileCardSection>

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Percorso</ResponsiveMobileFieldLabel>
                  <CellTextSecondary>{doc.service}</CellTextSecondary>
                </ResponsiveMobileCardSection>

                <ResponsiveMobileCardSection marginBottom="0">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CellTextSecondary>{formatDateIT(doc.uploadedAt)}</CellTextSecondary>
                    {doc.status === 'visible' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><Eye size={14} /> Visibile</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><EyeOff size={14} /> Nascosto</span>
                    )}
                  </div>
                </ResponsiveMobileCardSection>
              </ResponsiveMobileCard>
            ))}
          </ResponsiveMobileCards>
        )}
      />
    </div>
  );
}
