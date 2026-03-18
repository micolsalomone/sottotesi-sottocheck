import React, { useState, useMemo } from 'react';
import { MoreVertical, X, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Activity } from 'lucide-react';
import {
  CellTextPrimary,
  CellTextSecondary,
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveMobileFieldLabel,
  ResponsiveTableLayout,
  TableCell,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from '../../app/components/TablePrimitives';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'Documento' | 'Step' | 'Servizio' | 'Pagamento' | 'Check' | 'Sistema';
  actor: 'Studente' | 'Coach' | 'Admin' | 'Sistema';
  action: string;
  reference: string;
  outcome: 'success' | 'warning' | 'error';
}

const mockEvents: SystemEvent[] = [
  { id: 'EV-1234', timestamp: '2026-02-09 14:32:15', type: 'Documento', actor: 'Studente', action: 'Caricamento capitolo_1.docx', reference: 'Giulia Verdi', outcome: 'success' },
  { id: 'EV-1235', timestamp: '2026-02-09 14:28:03', type: 'Check', actor: 'Sistema', action: 'Controllo plagio avviato', reference: 'SRV-034 (Giulia Verdi)', outcome: 'success' },
  { id: 'EV-1236', timestamp: '2026-02-09 14:15:42', type: 'Step', actor: 'Coach', action: 'Completato: Revisione capitolo 1', reference: 'SRV-034 (Giulia Verdi)', outcome: 'success' },
  { id: 'EV-1237', timestamp: '2026-02-09 13:58:21', type: 'Pagamento', actor: 'Studente', action: 'Pagamento rata €800 confermato', reference: 'Luca Neri', outcome: 'success' },
  { id: 'EV-1238', timestamp: '2026-02-09 13:45:10', type: 'Servizio', actor: 'Admin', action: 'Assegnazione coach: Marco Ferri', reference: 'SRV-041 (Luca Neri)', outcome: 'success' },
  { id: 'EV-1239', timestamp: '2026-02-09 12:22:35', type: 'Check', actor: 'Sistema', action: 'Verifica bibliografia completata', reference: 'DOC-402', outcome: 'warning' },
  { id: 'EV-1240', timestamp: '2026-02-09 11:50:18', type: 'Documento', actor: 'Coach', action: 'Upload note_revisione.pdf', reference: 'SRV-041 (Luca Neri)', outcome: 'success' },
  { id: 'EV-1241', timestamp: '2026-02-09 11:33:44', type: 'Sistema', actor: 'Sistema', action: 'Invio reminder scadenza rata', reference: 'Alessandro Brun', outcome: 'success' },
  { id: 'EV-1242', timestamp: '2026-02-09 10:45:29', type: 'Check', actor: 'Sistema', action: 'Controllo plagio fallito - Errore timeout', reference: 'DOC-405', outcome: 'error' },
  { id: 'EV-1243', timestamp: '2026-02-09 10:15:07', type: 'Step', actor: 'Coach', action: 'Avviato: Stesura capitolo 2', reference: 'SRV-034 (Giulia Verdi)', outcome: 'success' },
  { id: 'EV-1244', timestamp: '2026-02-09 09:42:13', type: 'Servizio', actor: 'Admin', action: 'Creazione nuovo servizio', reference: 'SRV-062 (Paolo Russo)', outcome: 'success' },
  { id: 'EV-1245', timestamp: '2026-02-09 09:18:55', type: 'Pagamento', actor: 'Sistema', action: 'Verifica pagamento in sospeso', reference: 'Paolo Russo', outcome: 'warning' },
  { id: 'EV-1246', timestamp: '2026-02-09 08:30:22', type: 'Sistema', actor: 'Sistema', action: 'Backup database eseguito', reference: 'Sistema', outcome: 'success' },
  { id: 'EV-1247', timestamp: '2026-02-08 18:20:41', type: 'Documento', actor: 'Studente', action: 'Caricamento bibliografia.pdf', reference: 'Sara Martini', outcome: 'success' },
  { id: 'EV-1248', timestamp: '2026-02-08 17:55:16', type: 'Check', actor: 'Sistema', action: 'Analisi coerenza completata', reference: 'DOC-404', outcome: 'success' },
  { id: 'EV-1249', timestamp: '2026-02-08 16:40:33', type: 'Servizio', actor: 'Admin', action: 'Modifica stato servizio: Attivo', reference: 'SRV-022 (Sara Martini)', outcome: 'success' },
  { id: 'EV-1250', timestamp: '2026-02-08 15:25:09', type: 'Pagamento', actor: 'Studente', action: 'Tentativo pagamento fallito', reference: 'Alessandro Brun', outcome: 'error' },
  { id: 'EV-1251', timestamp: '2026-02-08 14:10:47', type: 'Step', actor: 'Coach', action: 'Approvato: Definizione argomento', reference: 'SRV-022 (Sara Martini)', outcome: 'success' },
];

export function EventiSistemaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  type SortKey = 'id' | 'timestamp' | 'type' | 'actor' | 'action' | 'outcome' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 100, timestamp: 160, type: 120, actor: 110, action: 280, reference: 200, outcome: 100, actions: 100
  });

  const eventTypes = ['Documento', 'Step', 'Servizio', 'Pagamento', 'Check', 'Sistema'];
  const actorTypes = ['Studente', 'Coach', 'Admin', 'Sistema'];

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

  const sortedData = useMemo(() => {
    let data = [...mockEvents];
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
  }, [sortColumn, sortDirection]);

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

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = [];
  if (filterType !== 'all') {
    activeFilters.push({ label: `Tipo: ${filterType}`, value: filterType, onRemove: () => setFilterType('all') });
  }
  if (filterActor !== 'all') {
    activeFilters.push({ label: `Attore: ${filterActor}`, value: filterActor, onRemove: () => setFilterActor('all') });
  }
  if (filterOutcome !== 'all') {
    activeFilters.push({
      label: `Esito: ${filterOutcome === 'success' ? 'Successo' : filterOutcome === 'warning' ? 'Warning' : 'Errore'}`,
      value: filterOutcome,
      onRemove: () => setFilterOutcome('all')
    });
  }
  if (filterDateFrom) activeFilters.push({ label: `Da: ${filterDateFrom}`, value: filterDateFrom, onRemove: () => setFilterDateFrom('') });
  if (filterDateTo) activeFilters.push({ label: `A: ${filterDateTo}`, value: filterDateTo, onRemove: () => setFilterDateTo('') });

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Eventi di Sistema</h1>
        <p className="page-subtitle">Log operativo eventi e azioni</p>
        <style>{`@media (max-width: 768px) { .page-header { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; } }`}</style>
      </div>

      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input type="text" placeholder="Cerca evento..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }} />
          <button className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Cerca</button>
        </div>
        <style>{`@media (max-width: 768px) { .action-toolbar { margin-left: var(--spacing-4) !important; margin-right: var(--spacing-4) !important; flex-direction: column !important; align-items: stretch !important; } .action-toolbar > div { width: 100% !important; } }`}</style>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Tipo Evento</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tutti i tipi</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Attore</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterActor} onChange={(e) => setFilterActor(e.target.value)}>
            <option value="all">Tutti</option>
            {actorTypes.map(actor => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Esito</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="success">Successo</option>
            <option value="warning">Warning</option>
            <option value="error">Errore</option>
          </select>
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Periodo da</label>
          <input type="datetime-local" className="search-input" style={{ width: '100%' }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Periodo a</label>
          <input type="datetime-local" className="search-input" style={{ width: '100%' }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>Filtri attivi:</span>
          {activeFilters.map((filter, idx) => (
            <button key={idx} onClick={filter.onRemove} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', cursor: 'pointer' }}>
              {filter.label}<X size={14} />
            </button>
          ))}
          <button onClick={() => { setFilterType('all'); setFilterActor('all'); setFilterOutcome('all'); setFilterDateFrom(''); setFilterDateTo(''); }} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}>Rimuovi tutti</button>
        </div>
      )}

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1250px">
            <thead>
              <tr>
                <TableHeaderCell id="id" label="ID" width={columnWidths.id} sortable sortDirection={sortColumn === 'id' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="timestamp" label="Timestamp" width={columnWidths.timestamp} sortable sortDirection={sortColumn === 'timestamp' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="type" label="Tipo" width={columnWidths.type} sortable sortDirection={sortColumn === 'type' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="actor" label="Attore" width={columnWidths.actor} sortable sortDirection={sortColumn === 'actor' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="action" label="Azione" width={columnWidths.action} sortable sortDirection={sortColumn === 'action' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="reference" label="Riferimento" width={columnWidths.reference} onResize={handleMouseDown} />
                <TableHeaderCell id="outcome" label="Esito" width={columnWidths.outcome} sortable sortDirection={sortColumn === 'outcome' ? sortDirection : null} onSort={(id) => handleSort(id as SortKey)} onResize={handleMouseDown} />
                <TableHeaderCell id="actions" label="Azioni" width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {sortedData.map((event) => (
                <TableRow key={event.id}>
                  <TableCell><CellTextSecondary>{event.id}</CellTextSecondary></TableCell>
                  <TableCell><span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>{event.timestamp}</span></TableCell>
                  <TableCell>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius)',
                      fontSize: 'var(--text-label)',
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor:
                        event.type === 'Documento' ? 'hsl(210, 40%, 96%)' :
                        event.type === 'Step' ? 'hsl(160, 40%, 96%)' :
                        event.type === 'Servizio' ? 'hsl(270, 40%, 96%)' :
                        event.type === 'Pagamento' ? 'hsl(25, 40%, 96%)' :
                        event.type === 'Check' ? 'hsl(200, 40%, 96%)' :
                        'hsl(0, 0%, 96%)',
                      color:
                        event.type === 'Documento' ? 'hsl(210, 60%, 40%)' :
                        event.type === 'Step' ? 'hsl(160, 60%, 35%)' :
                        event.type === 'Servizio' ? 'hsl(270, 60%, 40%)' :
                        event.type === 'Pagamento' ? 'hsl(25, 60%, 40%)' :
                        event.type === 'Check' ? 'hsl(200, 60%, 40%)' :
                        'hsl(0, 0%, 40%)'
                    }}>
                      {event.type}
                    </span>
                  </TableCell>
                  <TableCell><CellTextPrimary>{event.actor}</CellTextPrimary></TableCell>
                  <TableCell><CellTextPrimary>{event.action}</CellTextPrimary></TableCell>
                  <TableCell><CellTextPrimary>{event.reference}</CellTextPrimary></TableCell>
                  <TableCell>
                    <span className={`status-badge ${event.outcome === 'success' ? 'active' : event.outcome === 'warning' ? 'pending' : 'inactive'}`}>
                      {event.outcome === 'success' ? 'Successo' : event.outcome === 'warning' ? 'Warning' : 'Errore'}
                    </span>
                  </TableCell>
                  <TableCell><button className="actions-button"><MoreVertical size={18} /></button></TableCell>
                </TableRow>
              ))}
            </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {sortedData.map((event) => (
              <ResponsiveMobileCard key={event.id}>
                <ResponsiveMobileCardHeader>
                  <div>
                    <CellTextSecondary>{event.id}</CellTextSecondary>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 'var(--text-label)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>{event.timestamp}</div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius)',
                      fontSize: 'var(--text-label)', fontFamily: 'var(--font-inter)', fontWeight: 'var(--font-weight-medium)',
                      backgroundColor:
                        event.type === 'Documento' ? 'hsl(210, 40%, 96%)' :
                        event.type === 'Step' ? 'hsl(160, 40%, 96%)' :
                        event.type === 'Servizio' ? 'hsl(270, 40%, 96%)' :
                        event.type === 'Pagamento' ? 'hsl(25, 40%, 96%)' :
                        event.type === 'Check' ? 'hsl(200, 40%, 96%)' :
                        'hsl(0, 0%, 96%)',
                      color:
                        event.type === 'Documento' ? 'hsl(210, 60%, 40%)' :
                        event.type === 'Step' ? 'hsl(160, 60%, 35%)' :
                        event.type === 'Servizio' ? 'hsl(270, 60%, 40%)' :
                        event.type === 'Pagamento' ? 'hsl(25, 60%, 40%)' :
                        event.type === 'Check' ? 'hsl(200, 60%, 40%)' :
                        'hsl(0, 0%, 40%)'
                    }}>
                      {event.type}
                    </span>
                  </div>
                  <span className={`status-badge ${event.outcome === 'success' ? 'active' : event.outcome === 'warning' ? 'pending' : 'inactive'}`}>
                    {event.outcome === 'success' ? 'Successo' : event.outcome === 'warning' ? 'Warning' : 'Errore'}
                  </span>
                </ResponsiveMobileCardHeader>

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Attore</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{event.actor}</CellTextPrimary>
                </ResponsiveMobileCardSection>
                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Azione</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{event.action}</CellTextPrimary>
                </ResponsiveMobileCardSection>
                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Riferimento</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{event.reference}</CellTextPrimary>
                </ResponsiveMobileCardSection>

                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}><ExternalLink size={14} />Apri Dettagli</button>
              </ResponsiveMobileCard>
            ))}
          </ResponsiveMobileCards>
        )}
      />
    </div>
  );
}