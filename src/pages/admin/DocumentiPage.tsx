import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';
import { TableHeader } from '../../app/components/ui/TableHeader';
import { useTableResize } from '../../app/hooks/useTableResize';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: 'Contratto' | 'Doc Identità' | 'Bozza Tesi' | 'Revisione' | 'Altro';
  author: string;
  authorType: 'studente' | 'coach' | 'admin';
  service: string;
  uploadedAt: string;
  status: 'visible' | 'hidden';
  size: string;
}

const mockDocuments: Document[] = [
  { id: 'DOC-001', name: 'Contratto_Verdi_v1.pdf', type: 'Contratto', author: 'Giulia Verdi', authorType: 'studente', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '1.2 MB' },
  { id: 'DOC-002', name: 'Capitolo_1_Rossi.docx', type: 'Bozza Tesi', author: 'Marco Rossi', authorType: 'studente', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-09', status: 'visible', size: '450 KB' },
  { id: 'DOC-003', name: 'Correzioni_Cap1.pdf', type: 'Revisione', author: 'Martina Rossi', authorType: 'coach', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '2.1 MB' },
  { id: 'DOC-004', name: 'CI_Neri_Fronte.jpg', type: 'Doc Identità', author: 'Luca Neri', authorType: 'studente', service: 'SS-103 (Catalogo)', uploadedAt: '2026-03-05', status: 'hidden', size: '890 KB' },
  { id: 'DOC-005', name: 'Piano_Studi_Bianchi.pdf', type: 'Altro', author: 'Elena Bianchi', authorType: 'studente', service: 'SS-104 (Coaching)', uploadedAt: '2026-03-01', status: 'visible', size: '5.4 MB' },
  { id: 'DOC-006', name: 'Report_Finale.pdf', type: 'Revisione', author: 'Martina Rossi', authorType: 'coach', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-12', status: 'visible', size: '1.8 MB' },
  { id: 'DOC-007', name: 'Contratto_Firma.pdf', type: 'Contratto', author: 'Paolo Russo', authorType: 'studente', service: 'SS-105 (Coaching)', uploadedAt: '2026-02-28', status: 'visible', size: '1.5 MB' },
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
    type: 130,
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
    if (filterType !== 'all') data = data.filter(d => d.type === filterType);
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
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Tipo Documento</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tutti i tipi</option>
            <option value="Contratto">Contratto</option>
            <option value="Doc Identità">Documento Identità</option>
            <option value="Bozza Tesi">Bozza Tesi</option>
            <option value="Revisione">Revisione</option>
            <option value="Altro">Altro</option>
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Visibilità</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="visible">Visibile</option>
            <option value="hidden">Nascosto</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterStatus('all'); }}>Reset</button>
      </div>

      <BulkActionsBar 
        selectedCount={selectedIds.length} 
        selectedIds={selectedIds} 
        actions={bulkActions} 
        onClearSelection={() => setSelectedIds([])} 
      />

      <div className="data-table">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ width: `${columnWidths.checkbox}px`, padding: '0 1rem', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <Checkbox 
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
                    onCheckedChange={handleSelectAll} 
                  />
                </th>
                <TableHeader label="ID" columnKey="id" width={columnWidths.id} sortColumn={sortColumn} sortDirection={sortDirection} onSort={() => handleSort('id')} onResize={handleMouseDown} />
                <TableHeader label="Nome File" columnKey="name" width={columnWidths.name} sortColumn={sortColumn} sortDirection={sortDirection} onSort={() => handleSort('name')} onResize={handleMouseDown} />
                <TableHeader label="Tipo" columnKey="type" width={columnWidths.type} sortColumn={sortColumn} sortDirection={sortDirection} onSort={() => handleSort('type')} onResize={handleMouseDown} />
                <TableHeader label="Autore" columnKey="author" width={columnWidths.author} sortColumn={sortColumn} sortDirection={sortDirection} onSort={() => handleSort('author')} onResize={handleMouseDown} />
                <TableHeader label="Percorso" columnKey="service" width={columnWidths.service} onResize={handleMouseDown} />
                <TableHeader label="Caricato" columnKey="uploadedAt" width={columnWidths.uploadedAt} sortColumn={sortColumn} sortDirection={sortDirection} onSort={() => handleSort('uploadedAt')} onResize={handleMouseDown} />
                <TableHeader label="Stato" columnKey="status" width={columnWidths.status} onResize={handleMouseDown} />
                <th style={{ width: `${columnWidths.actions}px`, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--muted)', zIndex: 10 }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((doc) => (
                <tr key={doc.id} style={{ backgroundColor: selectedIds.includes(doc.id) ? 'var(--selected-row-bg)' : undefined }}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.includes(doc.id)} onCheckedChange={() => handleSelectRow(doc.id)} />
                  </td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>{doc.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{doc.name}</div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)' }}>{doc.size}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.125rem 0.5rem', 
                      borderRadius: 'var(--radius-badge)', 
                      background: 'var(--muted)', 
                      fontFamily: 'var(--font-inter)', 
                      fontSize: 'var(--text-xs)', 
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)'
                    }}>
                      {doc.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}>
                        {doc.author}
                        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginLeft: '0.25rem', textTransform: 'uppercase' }}>({doc.authorType})</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>{doc.service}</td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}>{doc.uploadedAt}</td>
                  <td>
                    {doc.status === 'visible' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        <Eye size={14} /> Visibile
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        <EyeOff size={14} /> Nascosto
                      </span>
                    )}
                  </td>
                  <td style={{ position: 'sticky', right: 0, background: 'var(--background)' }}>
                    <TableActions actions={getTableActions(doc)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
