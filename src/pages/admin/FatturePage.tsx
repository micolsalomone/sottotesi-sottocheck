import React, { useState, useMemo } from 'react';
import { X, FileText, AlertTriangle, CheckCircle, Download, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BulkActionsBar, type BulkAction } from '@/app/components/BulkActionsBar';
import { TableActions, type TableAction } from '@/app/components/TableActions';
import { Checkbox } from '@/app/components/ui/checkbox';
import { StatusBadge } from '@/app/components/StatusBadge';
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
  TableHeaderActionCell,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableSelectionCell,
  TableSelectionHeaderCell,
} from '@/app/components/TablePrimitives';

interface Payment {
  id: string;
  lavorazione: string;
  studente: string;
  importo: string;
  dataTransazione: string;
  gateway: string;
  stato: 'completato' | 'errore_pagamento' | 'errore_verifica';
  erroreOrigine?: 'T-Pay' | 'Copyleaks';
  erroreDettaglio?: string;
  fattura: string;
}

const mockPayments: Payment[] = [
  { id: 'PAG-2026-001', lavorazione: 'SC-2026-0041', studente: 'Giulia Verdi', importo: '€49', dataTransazione: '2026-02-28', gateway: 'T-Pay', stato: 'completato', fattura: 'FT-SC-2026-001.pdf' },
  { id: 'PAG-2026-002', lavorazione: 'SC-2026-0038', studente: 'Luca Neri', importo: '€29', dataTransazione: '2026-02-25', gateway: 'T-Pay', stato: 'completato', fattura: 'FT-SC-2026-002.pdf' },
  { id: 'PAG-2026-003', lavorazione: 'SC-2026-0035', studente: 'Sara Martini', importo: '€49', dataTransazione: '2026-02-20', gateway: 'T-Pay', stato: 'errore_pagamento', erroreOrigine: 'T-Pay', erroreDettaglio: 'Timeout connessione gateway — transazione non confermata', fattura: '' },
  { id: 'PAG-2026-004', lavorazione: 'SC-2026-0033', studente: 'Paolo Russo', importo: '€29', dataTransazione: '2026-02-18', gateway: 'T-Pay', stato: 'completato', fattura: 'FT-SC-2026-004.pdf' },
  { id: 'PAG-2026-005', lavorazione: 'SC-2026-0030', studente: 'Alessandro Brun', importo: '€49', dataTransazione: '2026-02-15', gateway: 'T-Pay', stato: 'errore_verifica', erroreOrigine: 'Copyleaks', erroreDettaglio: 'Errore API 503 — servizio temporaneamente non disponibile, verifica plagio/AI non completata', fattura: 'FT-SC-2026-005.pdf' },
  { id: 'PAG-2026-006', lavorazione: 'SC-2026-0028', studente: 'Maria Rossi', importo: '€49', dataTransazione: '2026-02-12', gateway: 'T-Pay', stato: 'completato', fattura: 'FT-SC-2026-006.pdf' },
  { id: 'PAG-2026-007', lavorazione: 'SC-2026-0025', studente: 'Federico Conti', importo: '€29', dataTransazione: '2026-02-10', gateway: 'T-Pay', stato: 'completato', fattura: 'FT-SC-2026-007.pdf' },
  { id: 'PAG-2026-008', lavorazione: 'SC-2026-0022', studente: 'Elena Barbieri', importo: '€49', dataTransazione: '2026-02-08', gateway: 'T-Pay', stato: 'errore_pagamento', erroreOrigine: 'T-Pay', erroreDettaglio: 'Carta rifiutata — fondi insufficienti', fattura: '' },
];

export function FatturePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStato, setFilterStato] = useState('all');
  const [filterMetodo, setFilterMetodo] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [expandedError, setExpandedError] = useState<string | null>(null);

  // ─── Bulk selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  type SortKey = 'id' | 'studente' | 'importo' | 'dataTransazione' | 'gateway' | 'stato' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 140, lavorazione: 140, studente: 150, importo: 100, dataTransazione: 140, gateway: 120, stato: 160, fattura: 180, actions: 80
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
    let data = [...mockPayments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.lavorazione.toLowerCase().includes(q) ||
        p.studente.toLowerCase().includes(q)
      );
    }
    if (filterStato !== 'all') {
      data = data.filter(p => p.stato === filterStato);
    }
    if (filterMetodo !== 'all') {
      data = data.filter(p => p.gateway === filterMetodo);
    }
    if (filterDateFrom) {
      data = data.filter(p => p.dataTransazione >= filterDateFrom);
    }
    if (filterDateTo) {
      data = data.filter(p => p.dataTransazione <= filterDateTo);
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [searchQuery, filterStato, filterMetodo, filterDateFrom, filterDateTo, sortColumn, sortDirection]);

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.pageX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const totalCompletati = mockPayments.filter(p => p.stato === 'completato').length;
  const totalErrori = mockPayments.filter(p => p.stato === 'errore_pagamento' || p.stato === 'errore_verifica').length;

  const parseImporto = (s: string) => parseFloat(s.replace('€', '').replace(',', '.')) || 0;
  const totaleLordo = mockPayments.reduce((sum, p) => sum + parseImporto(p.importo), 0);
  const totaleNetto = totaleLordo / 1.22; // IVA 22%

  const formatCurrency = (v: number) => '€' + v.toFixed(2).replace('.', ',');

  const activeFilters: Array<{ label: string; onRemove: () => void }> = [];
  if (filterStato !== 'all') {
    const statoLabel = filterStato === 'completato' ? 'Completato' : filterStato === 'errore_pagamento' ? 'Errore pagamento (T-Pay)' : 'Errore verifica (Copyleaks)';
    activeFilters.push({
      label: `Stato: ${statoLabel}`,
      onRemove: () => setFilterStato('all')
    });
  }
  if (filterMetodo !== 'all') {
    activeFilters.push({
      label: `Gateway: ${filterMetodo}`,
      onRemove: () => setFilterMetodo('all')
    });
  }
  if (filterDateFrom) activeFilters.push({ label: `Da: ${filterDateFrom}`, onRemove: () => setFilterDateFrom('') });
  if (filterDateTo) activeFilters.push({ label: `A: ${filterDateTo}`, onRemove: () => setFilterDateTo('') });

  // ─── Bulk selection handlers ─────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(p => p.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── Bulk actions ────────────────────────────────────────
  const bulkActions: BulkAction[] = [
    {
      label: 'Scarica fatture',
      icon: <Download size={16} />,
      onClick: (ids: string[]) => {
        const withFattura = mockPayments.filter(p => ids.includes(p.id) && p.fattura);
        toast.success(`Scaricamento di ${withFattura.length} fatture avviato`);
      },
    },
    {
      label: 'Ritenta pagamento',
      icon: <RefreshCw size={16} />,
      onClick: (ids: string[]) => {
        const errori = mockPayments.filter(p => ids.includes(p.id) && p.stato !== 'completato');
        toast.success(`Ritentativo per ${errori.length} pagamenti avviato`);
      },
    },
    {
      label: 'Elimina selezionati',
      icon: <Trash2 size={16} />,
      onClick: (ids: string[]) => {
        toast.success(`${ids.length} pagamenti rimossi`);
        setSelectedIds([]);
      },
      variant: 'destructive' as const,
    },
  ];

  // ─── Row actions builder ─────────────────────────────────
  const getRowActions = (payment: Payment): TableAction[] => [
    {
      label: 'Scarica fattura',
      icon: <Download size={16} />,
      onClick: () => {
        toast.success(`Scaricamento ${payment.fattura} avviato`);
      },
      hidden: !payment.fattura,
    },
    {
      label: 'Ritenta pagamento',
      icon: <RefreshCw size={16} />,
      onClick: () => {
        toast.success(`Ritentativo per ${payment.id} avviato`);
      },
      hidden: payment.stato === 'completato',
      divider: true,
    },
    {
      label: 'Segna come verificato',
      icon: <ShieldCheck size={16} />,
      onClick: () => {
        toast.success(`${payment.id} segnato come verificato`);
      },
      hidden: payment.stato !== 'errore_verifica',
    },
    {
      label: 'Elimina pagamento',
      icon: <Trash2 size={16} />,
      onClick: () => {
        toast.success(`${payment.id} eliminato`);
      },
      variant: 'destructive' as const,
      divider: false,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Pagamenti e fatture</h1>
        <p className="page-subtitle">Transazioni Sottocheck — stato pagamenti e fatture generate</p>
        <style>{`@media (max-width: 768px) { .page-header { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; } }`}</style>
      </div>

      {/* Stats cards — pattern NORMALIZZAZIONE.md */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Completati</span>
            <div className="stat-icon">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-value">{totalCompletati}</div>
        </div>
        <div className="stat-card" style={totalErrori > 0 ? {
          border: '2px solid var(--destructive-foreground)',
          backgroundColor: 'var(--destructive)',
        } : undefined}>
          <div className="stat-header">
            <span className="stat-label" style={totalErrori > 0 ? { color: 'var(--destructive-foreground)' } : undefined}>Errori API</span>
            <div className="stat-icon" style={totalErrori > 0 ? { background: 'var(--destructive-foreground)' } : undefined}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value" style={totalErrori > 0 ? { color: 'var(--destructive-foreground)' } : undefined}>{totalErrori}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Totale transazioni</span>
            <div className="stat-icon" style={{ background: 'var(--muted-foreground)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{mockPayments.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input type="text" placeholder="Cerca per ID, lavorazione o studente..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }} />
          <button className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Cerca</button>
        </div>
        <style>{`@media (max-width: 768px) { .action-toolbar { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; flex-direction: column !important; align-items: stretch !important; } .action-toolbar > div { width: 100% !important; } }`}</style>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Stato</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStato} onChange={(e) => setFilterStato(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="completato">Completato</option>
            <option value="errore_pagamento">Errore pagamento</option>
            <option value="errore_verifica">Errore verifica</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Gateway pagamento</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterMetodo} onChange={(e) => setFilterMetodo(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="T-Pay">T-Pay</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Da</label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Fino a</label>
          <input type="date" className="search-input" style={{ width: '100%' }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Filtri attivi:</span>
          {activeFilters.map((filter, idx) => (
            <button key={idx} onClick={filter.onRemove} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', cursor: 'pointer' }}>
              {filter.label}<X size={14} />
            </button>
          ))}
          <button onClick={() => { setFilterStato('all'); setFilterMetodo('all'); setFilterDateFrom(''); setFilterDateTo(''); }} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}>Rimuovi tutti</button>
        </div>
      )}

      {/* 6. BULK ACTIONS BAR (condizionale) */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Table */}
      {/* Mini stats importi — pattern NORMALIZZAZIONE.md */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 140px',
          minWidth: '140px',
          padding: '0.75rem 1rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Totale lordo
          </div>
          <div style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.2',
          }}>
            {formatCurrency(totaleLordo)}
          </div>
        </div>
        <div style={{
          flex: '1 1 140px',
          minWidth: '140px',
          padding: '0.75rem 1rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Totale netto
          </div>
          <div style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.2',
          }}>
            {formatCurrency(totaleNetto)}
          </div>
        </div>
      </div>

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1200px">
            <thead>
              <tr>
                <TableSelectionHeaderCell width={50} checked={filteredData.length > 0 && selectedIds.length === filteredData.length} onCheckedChange={handleSelectAll} />
                <TableHeaderCell id="id" label="ID Pagamento" width={columnWidths.id} sortable sortDirection={sortColumn === 'id' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="lavorazione" label="id servizio" width={columnWidths.lavorazione} onResize={handleMouseDown} />
                <TableHeaderCell id="studente" label="Studente" width={columnWidths.studente} sortable sortDirection={sortColumn === 'studente' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="importo" label="Importo" width={columnWidths.importo} onResize={handleMouseDown} />
                <TableHeaderCell id="dataTransazione" label="Data" width={columnWidths.dataTransazione} sortable sortDirection={sortColumn === 'dataTransazione' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="gateway" label="Metodo" width={columnWidths.gateway} sortable sortDirection={sortColumn === 'gateway' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="stato" label="Stato" width={columnWidths.stato} sortable sortDirection={sortColumn === 'stato' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="fattura" label="Fattura" width={columnWidths.fattura} onResize={handleMouseDown} />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredData.flatMap((payment) => {
                const rows = [
                  <TableRow key={payment.id} selected={selectedIds.includes(payment.id)} selectedBackgroundColor="var(--selected-row-bg)">
                    <TableSelectionCell checked={selectedIds.includes(payment.id)} onCheckedChange={() => handleSelectRow(payment.id)} onClick={(e) => e.stopPropagation()} />
                    <TableCell><CellTextSecondary>{payment.id}</CellTextSecondary></TableCell>
                    <TableCell><CellTextPrimary>{payment.lavorazione}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{payment.studente}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{payment.importo}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{payment.dataTransazione}</CellTextPrimary></TableCell>
                    <TableCell>
                      <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', backgroundColor: payment.gateway === 'T-Pay' ? 'rgba(11, 182, 63, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: payment.gateway === 'T-Pay' ? 'var(--primary)' : 'rgb(59, 130, 246)' }}>
                        {payment.gateway}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.stato === 'completato' ? (
                        <StatusBadge status="active" label="Completato" />
                      ) : (
                        <button
                          onClick={() => setExpandedError(expandedError === payment.id ? null : payment.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive-foreground)', border: 'none', cursor: 'pointer' }}
                        >
                          <AlertTriangle size={12} />
                          Errore {payment.erroreOrigine}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.fattura ? (
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--text-label)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={14} />{payment.fattura}
                        </button>
                      ) : (
                        <CellTextSecondary>—</CellTextSecondary>
                      )}
                    </TableCell>
                    <TableActionCell width={columnWidths.actions} backgroundColor="var(--card)">
                      <TableActions actions={getRowActions(payment)} />
                    </TableActionCell>
                  </TableRow>
                ];
                if (expandedError === payment.id && payment.stato !== 'completato') {
                  rows.push(
                    <tr key={`${payment.id}-error`}>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--destructive)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <AlertTriangle size={14} style={{ color: 'var(--destructive-foreground)', flexShrink: 0, marginTop: '1px' }} />
                          <div>
                            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Origine: {payment.erroreOrigine}</span>
                            <span style={{ margin: '0 0.5rem', color: 'var(--muted-foreground)' }}>—</span>
                            <span>{payment.erroreDettaglio}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.map((payment) => (
              <ResponsiveMobileCard key={payment.id}>
                <ResponsiveMobileCardHeader>
                  <div>
                    <CellTextSecondary>{payment.id}</CellTextSecondary>
                    <CellTextPrimary>{payment.studente}</CellTextPrimary>
                  </div>
                  {payment.stato === 'completato' ? (
                    <StatusBadge status="active" label="Completato" />
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--destructive-foreground)' }}>
                      <AlertTriangle size={12} />Errore
                    </span>
                  )}
                </ResponsiveMobileCardHeader>

                <ResponsiveMobileCardSection>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div><ResponsiveMobileFieldLabel>Lavorazione</ResponsiveMobileFieldLabel><CellTextPrimary>{payment.lavorazione}</CellTextPrimary></div>
                    <div><ResponsiveMobileFieldLabel>Importo</ResponsiveMobileFieldLabel><CellTextPrimary>{payment.importo}</CellTextPrimary></div>
                    <div><ResponsiveMobileFieldLabel>Data</ResponsiveMobileFieldLabel><CellTextPrimary>{payment.dataTransazione}</CellTextPrimary></div>
                    <div><ResponsiveMobileFieldLabel>Metodo</ResponsiveMobileFieldLabel><CellTextPrimary>{payment.gateway}</CellTextPrimary></div>
                  </div>
                </ResponsiveMobileCardSection>

                {payment.stato !== 'completato' && (
                  <ResponsiveMobileCardSection>
                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--destructive-foreground)', borderRadius: '0 var(--radius) var(--radius) 0', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{payment.erroreOrigine}:</span> {payment.erroreDettaglio}
                    </div>
                  </ResponsiveMobileCardSection>
                )}

                {payment.fattura && (
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 'var(--text-label)' }}>
                    <FileText size={14} />{payment.fattura}
                  </button>
                )}
              </ResponsiveMobileCard>
            ))}
          </ResponsiveMobileCards>
        )}
      />
    </div>
  );
}