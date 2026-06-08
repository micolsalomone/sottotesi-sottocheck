import * as React from 'react';
import { useMemo, useState, MouseEvent } from 'react';
import { MessageSquare, GraduationCap, Wrench, CheckCircle2, Edit } from 'lucide-react';
import {
  ResponsiveTableLayout,
  ResponsiveMobileCards,
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCardSection,
  ResponsiveMobileCardFooter,
  TableRoot,
  TableHeaderCell,
  TableHeaderActionCell,
  TableRow,
  TableCell,
  TableActionCell,
  TableEmptyState,
  CellTextPrimary,
  CellTextSecondary,
  CellContentStack,
  StatusPill,
} from '@/app/components/TablePrimitives';
import { Checkbox } from '@/app/components/ui/checkbox';
import { TicketDrawer, TicketMessage, TicketData } from '@/app/components/TicketDrawer';
import { TableActions, type TableAction } from '@/app/components/TableActions';

type TicketPriority = 'alta' | 'media' | 'bassa';
type TicketStatus = 'aperto' | 'in_lavorazione' | 'risolto';
type TicketSource = 'coach' | 'studente';
type TicketTab = 'aperti' | 'chiusi';
type SortKey = 'subject' | 'createdAt' | 'priority' | null;

interface Ticket {
  id: string;
  subject: string;
  source: TicketSource;
  studentName?: string;
  coachName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  category: string;
  messages: TicketMessage[];
  assignedTo?: string;
}

const CURRENT_ADMIN = 'Francesca';

const AVAILABLE_ADMINS = [
  { id: 'admin-1', name: 'Francesca' },
  { id: 'admin-2', name: 'Giulia' },
  { id: 'admin-3', name: 'Marco' },
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TK-001',
    subject: 'Timeline bloccata dopo step 3',
    source: 'coach',
    coachName: 'Marco Bianchi',
    studentName: 'Laura Rossi',
    priority: 'alta',
    status: 'aperto',
    createdAt: '2026-03-07',
    category: 'Timeline bloccata',
    assignedTo: 'admin-1',
    messages: [
      {
        id: 'TK-001-MSG-1',
        content: 'La timeline resta bloccata allo step 3 anche dopo il refresh.',
        author: 'Marco Bianchi',
        authorType: 'coach',
        timestamp: '07/03/2026 09:10',
      },
    ],
  },
  {
    id: 'TK-002',
    subject: 'Documento non caricabile — errore formato',
    source: 'studente',
    studentName: 'Giulia Neri',
    priority: 'media',
    status: 'aperto',
    createdAt: '2026-03-06',
    category: 'Upload documento',
    messages: [
      {
        id: 'TK-002-MSG-1',
        content: 'Il PDF viene rifiutato, ricevo errore formato non valido.',
        author: 'Giulia Neri',
        authorType: 'student',
        timestamp: '06/03/2026 14:32',
      },
    ],
  },
  {
    id: 'TK-003',
    subject: 'Richiesta cambio coach per incompatibilità area',
    source: 'coach',
    coachName: 'Anna Verdi',
    studentName: 'Davide Conti',
    priority: 'media',
    status: 'in_lavorazione',
    createdAt: '2026-03-05',
    category: 'Assegnazione coach',
    assignedTo: 'admin-2',
    messages: [
      {
        id: 'TK-003-MSG-1',
        content: 'Richiesto cambio coach per maggiore aderenza area tematica.',
        author: 'Anna Verdi',
        authorType: 'coach',
        timestamp: '05/03/2026 11:05',
      },
    ],
  },
  {
    id: 'TK-004',
    subject: 'Step completato ma non registrato dal sistema',
    source: 'coach',
    coachName: 'Luca Ferrara',
    studentName: 'Sofia Mancini',
    priority: 'alta',
    status: 'aperto',
    createdAt: '2026-03-05',
    category: 'Timeline bloccata',
    messages: [],
  },
  {
    id: 'TK-005',
    subject: 'Non riesco ad accedere alla piattaforma',
    source: 'studente',
    studentName: 'Matteo Ricci',
    priority: 'bassa',
    status: 'risolto',
    createdAt: '2026-03-04',
    category: 'Accesso piattaforma',
    assignedTo: 'admin-3',
    messages: [
      {
        id: 'TK-005-MSG-1',
        content: 'Ho resettato password e ora riesco ad accedere.',
        author: 'Matteo Ricci',
        authorType: 'student',
        timestamp: '04/03/2026 17:20',
      },
    ],
  },
  {
    id: 'TK-006',
    subject: 'Errore nel calcolo rate pagamento',
    source: 'studente',
    studentName: 'Elena Galli',
    priority: 'alta',
    status: 'in_lavorazione',
    createdAt: '2026-03-04',
    category: 'Pagamenti',
    assignedTo: 'admin-1',
    messages: [
      {
        id: 'TK-006-MSG-1',
        content: 'Il totale rate non coincide con il piano concordato.',
        author: 'Elena Galli',
        authorType: 'student',
        timestamp: '04/03/2026 10:48',
      },
    ],
  },
];

const statusLabels: Record<TicketStatus, string> = {
  aperto: 'Aperto',
  in_lavorazione: 'Preso in carico',
  risolto: 'Risolto',
};

const sourceLabels: Record<TicketSource, string> = {
  coach: 'Da coach',
  studente: 'Da studente',
};

const priorityPillVariant: Record<TicketPriority, 'error' | 'warning' | 'neutral'> = {
  alta: 'error',
  media: 'warning',
  bassa: 'neutral',
};

const statusPillVariant: Record<TicketStatus, 'warning' | 'info' | 'success'> = {
  aperto: 'warning',
  in_lavorazione: 'info',
  risolto: 'success',
};

export function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [activeTab, setActiveTab] = useState<TicketTab>('aperti');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | TicketSource>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all');
  const [sortColumn, setSortColumn] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 52,
    subject: 350,
    source: 150,
    category: 180,
    priority: 130,
    status: 160,
    createdAt: 120,
    actions: 64,
  });

  const stats = useMemo(() => {
    const aperti = tickets.filter(t => t.status !== 'risolto');
    return {
      totalAperti: aperti.length,
      apertiCoach: aperti.filter(t => t.source === 'coach').length,
      apertiStudente: aperti.filter(t => t.source === 'studente').length,
      chiusi: tickets.filter(t => t.status === 'risolto').length,
    };
  }, [tickets]);

  const filteredData = useMemo(() => {
    const openOrClosedFiltered = tickets.filter(ticket =>
      activeTab === 'aperti' ? ticket.status !== 'risolto' : ticket.status === 'risolto'
    );

    let data = [...openOrClosedFiltered];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(ticket =>
        ticket.id.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        (ticket.studentName || '').toLowerCase().includes(q) ||
        (ticket.coachName || '').toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== 'all') {
      data = data.filter(ticket => ticket.source === sourceFilter);
    }

    if (priorityFilter !== 'all') {
      data = data.filter(ticket => ticket.priority === priorityFilter);
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        if (sortColumn === 'subject') {
          aVal = a.subject.toLowerCase();
          bVal = b.subject.toLowerCase();
        } else if (sortColumn === 'createdAt') {
          aVal = a.createdAt;
          bVal = b.createdAt;
        } else if (sortColumn === 'priority') {
          const order: Record<TicketPriority, number> = { alta: 0, media: 1, bassa: 2 };
          aVal = order[a.priority];
          bVal = order[b.priority];
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [activeTab, searchQuery, sourceFilter, priorityFilter, sortColumn, sortDirection, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find(ticket => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const selectedTicketData = useMemo<TicketData | null>(() => {
    if (!selectedTicket) return null;
    return {
      id: selectedTicket.id,
      subject: selectedTicket.subject,
      source: selectedTicket.source,
      priority: selectedTicket.priority,
      status: selectedTicket.status,
      category: selectedTicket.category,
      createdAt: selectedTicket.createdAt,
      requesterName: selectedTicket.source === 'coach'
        ? (selectedTicket.coachName || selectedTicket.studentName || '-')
        : (selectedTicket.studentName || selectedTicket.coachName || '-'),
      assignedTo: selectedTicket.assignedTo,
      messages: selectedTicket.messages,
    };
  }, [selectedTicket]);

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

  const handleMouseDown = (columnKey: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const diff = moveEvent.pageX - startX;
      const newWidth = Math.max(52, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredData.map(ticket => ticket.id));
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenTicket = (id: string) => {
    setSelectedTicketId(id);
    setIsTicketDrawerOpen(true);
  };

  const handleSaveTicketChanges = (
    ticketId: string,
    changes: { status: TicketStatus; assignedTo?: string }
  ) => {
    setTickets(prev => prev.map(ticket => (
      ticket.id === ticketId
        ? { ...ticket, status: changes.status, assignedTo: changes.assignedTo }
        : ticket
    )));
  };

  const handleSendTicketMessage = (ticketId: string, content: string) => {
    const now = new Date();
    const timestamp = now.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setTickets(prev => prev.map(ticket => {
      if (ticket.id !== ticketId) return ticket;
      const newMessage: TicketMessage = {
        id: `${ticketId}-MSG-${ticket.messages.length + 1}`,
        content,
        author: CURRENT_ADMIN,
        authorType: 'admin',
        timestamp,
      };
      return { ...ticket, messages: [...ticket.messages, newMessage] };
    }));
  };

  const getTableActions = (ticket: Ticket): TableAction[] => {
    return [
      {
        label: 'Apri dettaglio',
        icon: <Edit size={16} />,
        onClick: () => handleOpenTicket(ticket.id),
        divider: true,
      },
      {
        label: 'Segna preso in carico',
        icon: <Wrench size={16} />,
        onClick: () => handleSaveTicketChanges(ticket.id, {
          status: 'in_lavorazione',
          assignedTo: ticket.assignedTo,
        }),
        hidden: ticket.status === 'in_lavorazione' || ticket.status === 'risolto',
      },
      {
        label: 'Segna risolto',
        icon: <CheckCircle2 size={16} />,
        onClick: () => handleSaveTicketChanges(ticket.id, {
          status: 'risolto',
          assignedTo: ticket.assignedTo,
        }),
        hidden: ticket.status === 'risolto',
      },
      {
        label: 'Riapri ticket',
        icon: <MessageSquare size={16} />,
        onClick: () => handleSaveTicketChanges(ticket.id, {
          status: 'aperto',
          assignedTo: ticket.assignedTo,
        }),
        hidden: ticket.status !== 'risolto',
      },
    ];
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setPriorityFilter('all');
    setSortColumn('createdAt');
    setSortDirection('desc');
    setSelectedIds([]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Ticket</h1>
        <p className="page-subtitle">Gestione assistenza da coach e studenti</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Ticket aperti</span>
            <div className="stat-icon"><MessageSquare size={20} /></div>
          </div>
          <div className="stat-value">{stats.totalAperti}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Aperti da coach</span>
            <div className="stat-icon"><GraduationCap size={20} /></div>
          </div>
          <div className="stat-value">{stats.apertiCoach}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Aperti da studente</span>
            <div className="stat-icon"><Wrench size={20} /></div>
          </div>
          <div className="stat-value">{stats.apertiStudente}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Ticket chiusi</span>
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-value">{stats.chiusi}</div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {([
          { key: 'aperti', label: 'Aperti' },
          { key: 'chiusi', label: 'Chiusi' },
        ] as Array<{ key: TicketTab; label: string }>).map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                border: '2px solid transparent',
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: isActive ? 'var(--primary)' : 'transparent',
                borderRadius: '0',
                background: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                lineHeight: '1.5',
                transition: 'border-color 0.15s ease, color 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per ID, oggetto, studente o coach..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Fonte</label>
          <select className="select-dropdown w-full" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as 'all' | TicketSource)}>
            <option value="all">Tutte le fonti</option>
            <option value="coach">Da coach</option>
            <option value="studente">Da studente</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Priorità</label>
          <select className="select-dropdown w-full" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as 'all' | TicketPriority)}>
            <option value="all">Tutte le priorità</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="bassa">Bassa</option>
          </select>
        </div>

        <div className="flex items-end">
          <button className="btn btn-secondary h-fit" onClick={resetFilters}>Reset filtri</button>
        </div>
      </div>

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
                  id="subject"
                  label="Oggetto"
                  width={columnWidths.subject}
                  sortable
                  sortDirection={sortColumn === 'subject' ? sortDirection : null}
                  onSort={() => handleSort('subject')}
                  onResize={handleMouseDown}
                />

                <TableHeaderCell id="source" label="Fonte" width={columnWidths.source} onResize={handleMouseDown} />
                <TableHeaderCell id="category" label="Categoria" width={columnWidths.category} onResize={handleMouseDown} />

                <TableHeaderCell
                  id="priority"
                  label="Priorità"
                  width={columnWidths.priority}
                  sortable
                  sortDirection={sortColumn === 'priority' ? sortDirection : null}
                  onSort={() => handleSort('priority')}
                  onResize={handleMouseDown}
                />

                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} onResize={handleMouseDown} />

                <TableHeaderCell
                  id="createdAt"
                  label="Data"
                  width={columnWidths.createdAt}
                  sortable
                  sortDirection={sortColumn === 'createdAt' ? sortDirection : null}
                  onSort={() => handleSort('createdAt')}
                  onResize={handleMouseDown}
                />

                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <TableEmptyState message="Nessun ticket trovato" colSpan={8} />
              ) : (
                filteredData.map(ticket => (
                  <TableRow key={ticket.id} onClick={() => handleOpenTicket(ticket.id)}>
                    <TableCell width={columnWidths.checkbox} align="center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(ticket.id)}
                        onCheckedChange={() => handleSelectRow(ticket.id)}
                      />
                    </TableCell>

                    <TableCell width={columnWidths.subject}>
                      <CellContentStack>
                        <CellTextPrimary>{ticket.subject}</CellTextPrimary>
                        <CellTextSecondary>
                          {ticket.id} · {ticket.source === 'coach' ? ticket.coachName : ticket.studentName}
                        </CellTextSecondary>
                      </CellContentStack>
                    </TableCell>

                    <TableCell width={columnWidths.source}>
                      <StatusPill label={sourceLabels[ticket.source]} variant="neutral" />
                    </TableCell>

                    <TableCell width={columnWidths.category}>
                      <CellTextSecondary>{ticket.category}</CellTextSecondary>
                    </TableCell>

                    <TableCell width={columnWidths.priority}>
                      <StatusPill label={ticket.priority} variant={priorityPillVariant[ticket.priority]} />
                    </TableCell>

                    <TableCell width={columnWidths.status}>
                      <StatusPill label={statusLabels[ticket.status]} variant={statusPillVariant[ticket.status]} />
                    </TableCell>

                    <TableCell width={columnWidths.createdAt}>
                      <CellTextSecondary>{formatDate(ticket.createdAt)}</CellTextSecondary>
                    </TableCell>

                    <TableActionCell width={columnWidths.actions} onClick={(e) => e.stopPropagation()}>
                      <TableActions actions={getTableActions(ticket)} label={`Azioni ticket ${ticket.id}`} />
                    </TableActionCell>
                  </TableRow>
                ))
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
                  Nessun ticket trovato
                </div>
              </ResponsiveMobileCard>
            ) : (
              filteredData.map(ticket => (
                <div key={ticket.id} onClick={() => handleOpenTicket(ticket.id)} style={{ cursor: 'pointer' }}>
                  <ResponsiveMobileCard>
                    <ResponsiveMobileCardHeader>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
                        <CellTextPrimary>{ticket.subject}</CellTextPrimary>
                        <CellTextSecondary>{ticket.id}</CellTextSecondary>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(ticket.id)}
                            onCheckedChange={() => handleSelectRow(ticket.id)}
                          />
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <TableActions actions={getTableActions(ticket)} label={`Azioni ticket ${ticket.id}`} />
                        </div>
                      </div>
                    </ResponsiveMobileCardHeader>

                    <ResponsiveMobileCardSection marginBottom="0.625rem">
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <StatusPill label={sourceLabels[ticket.source]} variant="neutral" />
                        <StatusPill label={ticket.priority} variant={priorityPillVariant[ticket.priority]} />
                        <StatusPill label={statusLabels[ticket.status]} variant={statusPillVariant[ticket.status]} />
                      </div>
                    </ResponsiveMobileCardSection>

                    <ResponsiveMobileCardSection marginBottom="0.375rem">
                      <CellTextSecondary>{ticket.category}</CellTextSecondary>
                    </ResponsiveMobileCardSection>

                    <ResponsiveMobileCardFooter>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <span>{ticket.source === 'coach' ? ticket.coachName : ticket.studentName}</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </ResponsiveMobileCardFooter>
                  </ResponsiveMobileCard>
                </div>
              ))
            )}
          </ResponsiveMobileCards>
        )}
      />

      <TicketDrawer
        isOpen={isTicketDrawerOpen}
        onClose={() => setIsTicketDrawerOpen(false)}
        ticket={selectedTicketData}
        onSendMessage={handleSendTicketMessage}
        onSaveChanges={handleSaveTicketChanges}
        currentAdmin={CURRENT_ADMIN}
        availableAdmins={AVAILABLE_ADMINS}
      />
    </div>
  );
}
