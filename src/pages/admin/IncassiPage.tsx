import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Download, ExternalLink, Check, AlertTriangle, Clock, Pencil, Trash2, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useLavorazioni, type InstallmentStatus } from '@/app/data/LavorazioniContext';
import { TableActions, type TableAction } from '@/app/components/TableActions';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '@/app/components/BulkActionsBar';
import { Checkbox } from '@/app/components/ui/checkbox';

const STATUS_LABELS: Record<InstallmentStatus, string> = {
  paid: 'Pagata',
  pending: 'In attesa',
  overdue: 'Scaduta',
};

const STATUS_COLORS: Record<InstallmentStatus, { bg: string; fg: string }> = {
  paid: { bg: 'var(--primary)', fg: 'var(--primary-foreground)' },
  pending: { bg: 'var(--chart-3)', fg: '#fff' },
  overdue: { bg: 'var(--destructive)', fg: 'var(--destructive-foreground)' },
};

type SortKey = 'student_name' | 'service_name' | 'amount' | 'dueDate' | 'status' | null;

const CURRENT_ADMIN = 'Francesca';

// ─── Column widths for resizing ───────────────────────────────
const INITIAL_COLUMN_WIDTHS = {
  checkbox: 48,
  studente: 180,
  servizio: 200,
  rata: 80,
  netto: 100,
  lordo: 100,
  data_fattura: 120,
  scadenza: 110,
  stato: 110,
  pagato_il: 110,
  metodo: 120,
  fattura: 80,
  actions: 60,
};

export function IncassiPage() {
  const navigate = useNavigate();
  const { data: lavorazioni, taxPercent, updateService } = useLavorazioni();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortKey>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ─── Selection state ────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Editing inline fields ────────────────────────────────────
  const [editingInvoiceDate, setEditingInvoiceDate] = useState<string | null>(null);
  const [editInvoiceDateVal, setEditInvoiceDateVal] = useState('');

  // ─── Dialog state ───────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'destructive' | 'default';
    itemsList?: string[];
  } | null>(null);

  // ─── Column resizing ────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState(INITIAL_COLUMN_WIDTHS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  useEffect(() => {
    if (!resizingColumn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(60, resizeStartWidth.current + delta);
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    };
    const handleMouseUp = () => setResizingColumn(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  const startResize = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(col);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[col as keyof typeof columnWidths];
  };

  // Derive flat installment rows from context
  const allRows = useMemo(() => {
    const rows: Array<{
      id: string;
      serviceId: string;
      studentName: string;
      serviceName: string;
      rataNumber: number;
      rataTotal: number;
      amountGross: number;
      amountNet: number;
      dueDate: string;
      status: InstallmentStatus;
      paidAt?: string;
      paymentMethod?: string;
      invoiceId?: string;
      invoiceIssueDate?: string;
      invoiceUrl?: string;
    }> = [];

    lavorazioni.forEach(svc => {
      svc.installments.forEach((inst, idx) => {
        const net = inst.amount * (1 - taxPercent / 100);
        rows.push({
          id: inst.id,
          serviceId: svc.id,
          studentName: svc.student_name,
          serviceName: svc.service_name,
          rataNumber: idx + 1,
          rataTotal: svc.installments.length,
          amountGross: inst.amount,
          amountNet: net,
          dueDate: inst.dueDate,
          status: inst.status,
          paidAt: inst.payment?.paidAt,
          paymentMethod: inst.payment?.method,
          invoiceId: inst.invoice_number,
          invoiceIssueDate: inst.invoice?.issuedAt,
          invoiceUrl: undefined,
        });
      });
    });

    return rows;
  }, [lavorazioni, taxPercent]);

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

  const filteredData = useMemo(() => {
    let data = [...allRows];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => r.studentName.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') {
      data = data.filter(r => r.status === filterStatus);
    }
    if (sortColumn) {
      data.sort((a, b) => {
        let va: any = sortColumn === 'student_name' ? a.studentName :
                       sortColumn === 'service_name' ? a.serviceName :
                       sortColumn === 'amount' ? a.amountNet :
                       sortColumn === 'dueDate' ? a.dueDate :
                       sortColumn === 'status' ? a.status : '';
        let vb: any = sortColumn === 'student_name' ? b.studentName :
                       sortColumn === 'service_name' ? b.serviceName :
                       sortColumn === 'amount' ? b.amountNet :
                       sortColumn === 'dueDate' ? b.dueDate :
                       sortColumn === 'status' ? b.status : '';
        if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase(); }
        if (va < vb) return sortDirection === 'asc' ? -1 : 1;
        if (va > vb) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [allRows, searchQuery, filterStatus, sortColumn, sortDirection]);

  // Toggle payment inline
  const handleTogglePaid = (row: typeof allRows[0]) => {
    const svc = lavorazioni.find(s => s.id === row.serviceId);
    if (!svc) return;
    updateService(row.serviceId, s => ({
      ...s,
      updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
      installments: s.installments.map(i => {
        if (i.id !== row.id) return i;
        if (i.status === 'paid') {
          return { ...i, status: 'pending' as InstallmentStatus, payment: undefined };
        } else {
          const today = new Date().toISOString().split('T')[0];
          return {
            ...i,
            status: 'paid' as InstallmentStatus,
            payment: { id: `PAY-${Date.now()}`, amount: i.amount, paidAt: today, method: 'Manuale' }
          };
        }
      })
    }));
    toast.success(row.status === 'paid' ? 'Rata segnata come non pagata' : 'Rata segnata come pagata');
  };

  // Summary
  const totalPending = allRows.filter(r => r.status === 'pending').reduce((s, r) => s + r.amountNet, 0);
  const totalOverdue = allRows.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amountNet, 0);
  const totalPaid = allRows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amountNet, 0);
  const countOverdue = allRows.filter(r => r.status === 'overdue').length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortColumn !== col) return <ChevronsUpDown size={14} style={{ opacity: 0.4 }} />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const formatCurrency = (v: number) => `€${v.toFixed(2).replace('.', ',')}`;
  const formatDate = (d: string) => {
    if (!d) return '—';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  };

  // Helper: add days to a date
  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Save invoice date and recalculate due date (+30 days)
  const saveInvoiceDate = (row: typeof allRows[0]) => {
    if (!editInvoiceDateVal) {
      setEditingInvoiceDate(null);
      return;
    }
    const newDueDate = addDays(editInvoiceDateVal, 30);
    updateService(row.serviceId, s => ({
      ...s,
      installments: s.installments.map(i => {
        if (i.id !== row.id) return i;
        return {
          ...i,
          dueDate: newDueDate,
          invoice: i.invoice ? { ...i.invoice, issuedAt: editInvoiceDateVal } : {
            id: `INV-${Date.now()}`,
            amount: i.amount,
            issuedAt: editInvoiceDateVal,
            pdfUrl: '',
          },
        };
      }),
    }));
    toast.success(`Data fattura aggiornata: ${formatDate(editInvoiceDateVal)} — scadenza: ${formatDate(newDueDate)}`);
    setEditingInvoiceDate(null);
  };

  // Inline input style
  const inlineInputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    padding: '4px 8px',
    border: '1px solid var(--primary)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
  };

  // ─── Selection handlers ────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(r => r.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── Bulk actions ───────────────────────────────────────────
  const handleBulkExport = () => {
    const selected = filteredData.filter(r => selectedIds.includes(r.id));
    const csv = ['Studente,Servizio,Rata,Netto,Lordo,Scadenza,Stato,Pagato il,Metodo'].concat(
      selected.map(r => `${r.studentName},${r.serviceName},${r.rataNumber}/${r.rataTotal},${r.amountNet},${r.amountGross},${formatDate(r.dueDate)},${STATUS_LABELS[r.status]},${formatDate(r.paidAt || '')},${r.paymentMethod || ''}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incassi-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success(`${selectedIds.length} rate esportate`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    const selected = filteredData.filter(r => selectedIds.includes(r.id));
    setConfirmDialog({
      open: true,
      title: 'Elimina rate selezionate',
      description: `Vuoi eliminare ${selectedIds.length} rate? Questa azione non può essere annullata.`,
      onConfirm: () => {
        selected.forEach(row => {
          updateService(row.serviceId, s => ({
            ...s,
            updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
            installments: s.installments.filter(i => i.id !== row.id),
          }));
        });
        toast.success(`${selectedIds.length} rate eliminate`);
        setSelectedIds([]);
        setConfirmDialog(null);
      },
      variant: 'destructive',
      itemsList: selected.map(r => `${r.studentName} — ${r.serviceName} (Rata ${r.rataNumber})`),
    });
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Esporta CSV',
      icon: <Download size={16} />,
      onClick: handleBulkExport,
      variant: 'secondary',
    },
    {
      label: 'Elimina',
      icon: <Trash2 size={16} />,
      onClick: handleBulkDelete,
      variant: 'destructive',
    },
  ];

  // ─── Table Actions ──────────────────────────────────────────
  const getTableActions = (row: typeof allRows[0]): TableAction[] => [
    {
      label: 'Vai alla lavorazione',
      icon: <ExternalLink size={16} />,
      onClick: () => navigate(`/lavorazioni?highlight=${row.serviceId}`),
    },
    {
      label: row.status === 'paid' ? 'Segna come non pagata' : 'Segna come pagata',
      icon: <Check size={16} />,
      onClick: () => handleTogglePaid(row),
    },
    {
      label: 'Scarica fattura',
      icon: <FileText size={16} />,
      onClick: () => {
        if (row.invoiceUrl) {
          window.open(row.invoiceUrl, '_blank');
        } else {
          toast.error('Fattura non disponibile');
        }
      },
      hidden: !row.invoiceUrl,
    },
    {
      label: 'Elimina rata',
      icon: <Trash2 size={16} />,
      onClick: () => {
        setConfirmDialog({
          open: true,
          title: 'Elimina rata',
          description: `Vuoi eliminare la rata ${row.rataNumber}/${row.rataTotal} per ${row.studentName}?`,
          onConfirm: () => {
            updateService(row.serviceId, s => ({
              ...s,
              updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString(),
              installments: s.installments.filter(i => i.id !== row.id),
            }));
            toast.success('Rata eliminata');
            setConfirmDialog(null);
          },
          variant: 'destructive',
        });
      },
      variant: 'destructive',
      divider: true,
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Incassi</h1>
        <p className="page-subtitle">Rate studenti — cosa incassare e cosa è stato incassato</p>
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
        <div className="stat-card" style={{
          border: countOverdue > 0 ? '2px solid var(--destructive-foreground)' : '1px solid var(--border)',
          backgroundColor: countOverdue > 0 ? 'var(--destructive)' : 'var(--card)',
        }}>
          <div className="stat-header">
            <span className="stat-label" style={{
              color: countOverdue > 0 ? 'var(--destructive-foreground)' : 'var(--muted-foreground)'
            }}>Scadute</span>
            <div className="stat-icon" style={{
              backgroundColor: countOverdue > 0 ? 'var(--destructive-foreground)' : 'var(--primary)',
            }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-value" style={{
            color: countOverdue > 0 ? 'var(--destructive-foreground)' : 'var(--foreground)'
          }}>{formatCurrency(totalOverdue)}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: countOverdue > 0 ? 'var(--destructive-foreground)' : 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            {countOverdue} {countOverdue === 1 ? 'rata' : 'rate'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">In attesa</span>
            <div className="stat-icon">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalPending)}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            {allRows.filter(r => r.status === 'pending').length} rate
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Incassato</span>
            <div className="stat-icon">
              <Check size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{formatCurrency(totalPaid)}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            {allRows.filter(r => r.status === 'paid').length} rate
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
            placeholder="Cerca studente, servizio, ID rata..."
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

        <div className="action-toolbar-right">
          <select
            className="select-dropdown"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            <option value="overdue">Scadute</option>
            <option value="pending">In attesa</option>
            <option value="paid">Pagate</option>
          </select>
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
            .action-toolbar-right {
              width: 100% !important;
              justify-content: stretch !important;
            }
          }
        `}</style>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Desktop Table */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1400px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                {/* Checkbox */}
                <th style={{ width: `${columnWidths.checkbox}px`, padding: '1rem', position: 'relative', borderBottom: '1px solid var(--border)' }}>
                  <Checkbox
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <div
                    onMouseDown={e => startResize('checkbox', e)}
                    style={{
                      position: 'absolute', right: 0, top: 0, width: '4px', height: '100%',
                      cursor: 'col-resize', borderRight: '2px solid var(--border)', transition: 'border-color 0.15s ease',
                      ...(resizingColumn === 'checkbox' ? { borderRightColor: 'var(--primary)' } : {}),
                    }}
                    onClick={e => e.stopPropagation()}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--primary)'; }}
                    onMouseLeave={e => { if (resizingColumn !== 'checkbox') (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--border)'; }}
                  />
                </th>

                {[
                  { key: 'student_name' as SortKey, label: 'Studente', col: 'studente' },
                  { key: 'service_name' as SortKey, label: 'Servizio', col: 'servizio' },
                  { key: null as SortKey, label: 'Rata', col: 'rata' },
                  { key: 'amount' as SortKey, label: 'Netto', col: 'netto' },
                  { key: null as SortKey, label: 'Lordo', col: 'lordo' },
                  { key: null as SortKey, label: 'Data fattura', col: 'data_fattura' },
                  { key: 'dueDate' as SortKey, label: 'Scadenza', col: 'scadenza' },
                  { key: 'status' as SortKey, label: 'Stato', col: 'stato' },
                  { key: null as SortKey, label: 'Pagato il', col: 'pagato_il' },
                  { key: null as SortKey, label: 'Metodo', col: 'metodo' },
                  { key: null as SortKey, label: 'Fattura', col: 'fattura' },
                ].map((colDef, i) => (
                  <th key={i} onClick={colDef.key ? () => handleSort(colDef.key) : undefined}
                    style={{
                      width: `${columnWidths[colDef.col as keyof typeof columnWidths]}px`,
                      padding: '1rem', textAlign: 'left', fontWeight: 'var(--font-weight-medium)' as any,
                      color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)',
                      cursor: colDef.key ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none',
                      position: 'relative',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>{colDef.label}</span>
                      {colDef.key && <SortIcon col={colDef.key} />}
                    </div>
                    <div
                      onMouseDown={e => startResize(colDef.col, e)}
                      style={{
                        position: 'absolute', right: 0, top: 0, width: '6px', height: '100%',
                        cursor: 'col-resize', borderRight: '2px solid var(--border)', transition: 'border-color 0.15s ease',
                        ...(resizingColumn === colDef.col ? { borderRightColor: 'var(--primary)' } : {}),
                      }}
                      onClick={e => e.stopPropagation()}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--primary)'; }}
                      onMouseLeave={e => { if (resizingColumn !== colDef.col) (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--border)'; }}
                    />
                  </th>
                ))}

                {/* Actions sticky */}
                <th style={{
                  width: `${columnWidths.actions}px`,
                  padding: '1rem',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'var(--muted)',
                  zIndex: 11,
                  boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 'var(--font-weight-medium)' as any
                }}>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => {
                const isRowSelected = selectedIds.includes(row.id);
                return (
                <tr key={row.id} style={{ borderTop: '1px solid var(--border)', backgroundColor: isRowSelected ? 'var(--selected-row-bg)' : undefined }}
                  onMouseEnter={e => { if (!isRowSelected) e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
                  onMouseLeave={e => { if (!isRowSelected) e.currentTarget.style.backgroundColor = isRowSelected ? 'var(--selected-row-bg)' : ''; }}
                >
                  {/* Checkbox */}
                  <td onClick={e => e.stopPropagation()} style={{ minWidth: columnWidths.checkbox, padding: '1rem' }}>
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => handleSelectRow(row.id)}
                    />
                  </td>

                  <td style={{ minWidth: columnWidths.studente, padding: '1rem', fontWeight: 'var(--font-weight-medium)' as any, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: '1.5' }}>{row.studentName}</td>
                  <td style={{ minWidth: columnWidths.servizio, padding: '1rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{row.serviceName}</td>
                  <td style={{ minWidth: columnWidths.rata, padding: '1rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{row.rataNumber}/{row.rataTotal}</td>
                  <td style={{ minWidth: columnWidths.netto, padding: '1rem', fontWeight: 'var(--font-weight-bold)' as any, color: 'var(--foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{formatCurrency(row.amountNet)}</td>
                  <td style={{ minWidth: columnWidths.lordo, padding: '1rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{formatCurrency(row.amountGross)}</td>

                  {/* Data fattura — editabile inline */}
                  <td onClick={e => e.stopPropagation()} style={{
                    minWidth: columnWidths.data_fattura,
                    padding: '1rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    lineHeight: '1.5',
                    color: row.invoiceIssueDate ? 'var(--foreground)' : 'var(--muted-foreground)'
                  }}>
                    {editingInvoiceDate === row.id ? (
                      <input
                        type="date"
                        value={editInvoiceDateVal}
                        onChange={e => setEditInvoiceDateVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveInvoiceDate(row);
                          if (e.key === 'Escape') setEditingInvoiceDate(null);
                        }}
                        autoFocus
                        onBlur={() => saveInvoiceDate(row)}
                        style={{ ...inlineInputStyle, width: '110px' }}
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingInvoiceDate(row.id);
                          setEditInvoiceDateVal(row.invoiceIssueDate || '');
                        }}
                        style={{
                          cursor: 'pointer',
                          color: row.invoiceIssueDate ? 'var(--foreground)' : 'var(--muted-foreground)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Clicca per modificare"
                      >
                        {formatDate(row.invoiceIssueDate || '')}
                        <Pencil size={10} style={{ opacity: 0.4 }} />
                      </span>
                    )}
                  </td>

                  <td style={{ minWidth: columnWidths.scadenza, padding: '1rem', color: 'var(--foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{formatDate(row.dueDate)}</td>
                  <td style={{ minWidth: columnWidths.stato, padding: '1rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePaid(row);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-badge)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        backgroundColor: STATUS_COLORS[row.status].bg,
                        color: STATUS_COLORS[row.status].fg,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title={row.status === 'paid' ? 'Clicca per annullare pagamento' : 'Clicca per segnare come pagata'}
                    >
                      {STATUS_LABELS[row.status]}
                    </button>
                  </td>
                  <td style={{ minWidth: columnWidths.pagato_il, padding: '1rem', color: row.paidAt ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>
                    {row.paidAt ? formatDate(row.paidAt) : '—'}
                  </td>
                  <td style={{ minWidth: columnWidths.metodo, padding: '1rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{row.paymentMethod || '—'}</td>
                  <td style={{ minWidth: columnWidths.fattura, padding: '1rem', textAlign: 'center' }}>
                    {row.invoiceUrl ? (
                      <button onClick={(e) => { e.stopPropagation(); window.open(row.invoiceUrl, '_blank'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                        title={`Scarica ${row.invoiceId}`}
                      >
                        <Download size={16} />
                      </button>
                    ) : '—'}
                  </td>

                  {/* Actions sticky */}
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      minWidth: columnWidths.actions,
                      padding: '1rem',
                      textAlign: 'center',
                      position: 'sticky',
                      right: 0,
                      backgroundColor: isRowSelected ? 'var(--selected-row-bg)' : 'var(--background)',
                      zIndex: 10,
                      boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <TableActions actions={getTableActions(row)} />
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredData.map((row) => {
          const isSelected = selectedIds.includes(row.id);

          return (
            <div
              key={row.id}
              style={{
                backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--card)',
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
                    onCheckedChange={() => handleSelectRow(row.id)}
                  />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      {row.id}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {row.studentName}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {row.serviceName}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => handleTogglePaid(row)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: 'var(--radius-badge)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: STATUS_COLORS[row.status].bg,
                      color: STATUS_COLORS[row.status].fg,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_LABELS[row.status]}
                  </button>
                  <TableActions actions={getTableActions(row)} />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Rata
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {row.rataNumber}/{row.rataTotal}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Netto
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {formatCurrency(row.amountNet)}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Scadenza
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {formatDate(row.dueDate)}
                    </div>
                  </div>
                </div>

                {row.paidAt && (
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
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {formatDate(row.paidAt)} • {row.paymentMethod}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '12px', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
        {filteredData.length} di {allRows.length} rate
      </div>

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
          variant={confirmDialog.variant}
          itemsList={confirmDialog.itemsList}
          confirmLabel="Conferma"
          cancelLabel="Annulla"
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