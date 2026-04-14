import { useState, useRef, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  Bell,
  LifeBuoy,
  MoreVertical,
  CheckCircle2,
  UserMinus,
  X,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  STUDENTS_DATA,
  StudentStatus,
  STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  THESIS_TYPE_LABELS,
  ADMIN_REFERENTI,
} from './studentsData';
import { CalendarTableView } from '../../app/components/coach/CalendarTableView.tsx';
import { getFileTypeFromName, getFileExtension, formatFileSize, FILE_TYPE_LABELS } from '../../app/utils/fileTypeUtils';
import { getViewBasePath } from './viewBasePath';
import { useTableResize } from '@/app/hooks/useTableResize';

type TabMode = 'active' | 'past' | 'calendar';
type SortField = 'name' | 'degree' | 'status' | 'planStart' | 'planEnd' | 'serviceType' | 'thesisType' | 'progress';
type SortDir = 'asc' | 'desc';
type CoachTableColumnKey = SortField | 'tickets' | 'actions';

/* ──────────────── All possible statuses for the filter dropdown ──────────────── */
const ACTIVE_STATUSES: StudentStatus[] = ['pending_payment', 'active', 'paused'];
const PAST_STATUSES: StudentStatus[] = ['completed', 'cancelled', 'expired'];
const COACH_ACTIVE_STATUSES: Exclude<StudentStatus, 'pending_payment'>[] = ['active', 'paused'];

const COACH_COLUMN_WIDTHS: Record<CoachTableColumnKey, number> = {
  name: 260,
  degree: 220,
  thesisType: 140,
  serviceType: 150,
  status: 170,
  progress: 130,
  planStart: 160,
  planEnd: 160,
  tickets: 80,
  actions: 72,
};

const COACH_STATUS_DOT_COLORS: Record<Exclude<StudentStatus, 'pending_payment'>, string> = {
  active: 'var(--primary)',
  paused: 'var(--muted-foreground)',
  completed: 'var(--chart-2)',
  cancelled: 'var(--destructive-foreground)',
  expired: 'var(--muted-foreground)',
};

/* ──────────────────────────────────────────────────────────────────────────────── */

export function StudentiPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewBasePath = getViewBasePath(location.pathname);

  const [activeTab, setActiveTab] = useState<TabMode>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const { columnWidths, handleResize } = useTableResize(COACH_COLUMN_WIDTHS);
  const tableMinWidth = useMemo(
    () => Object.values(columnWidths).reduce((sum, width) => sum + width, 0),
    [columnWidths]
  );

  /* Only assigned students (coach's own) */
  const assignedStudents = STUDENTS_DATA.filter(s => s.assigned);

  /* Split by tab: active vs past */
  const tabStatuses = activeTab === 'active' ? ACTIVE_STATUSES : PAST_STATUSES;
  const tabStudents = assignedStudents.filter(s => tabStatuses.includes(s.status));

  /* Filter */
  const filtered = tabStudents.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  /* Sort */
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    const progressA = getProgressRatio(a.currentPhase, a.status);
    const progressB = getProgressRatio(b.currentPhase, b.status);
    switch (sortField) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'degree': cmp = a.degree.localeCompare(b.degree); break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'serviceType': cmp = (a.serviceType || '').localeCompare(b.serviceType || ''); break;
      case 'planEnd': cmp = (a.planEndDate || '').localeCompare(b.planEndDate || ''); break;
      case 'planStart': cmp = (a.planStartDate || '').localeCompare(b.planStartDate || ''); break;
      case 'thesisType': cmp = (a.thesisType || '').localeCompare(b.thesisType || ''); break;
      case 'progress': {
        cmp = progressA - progressB;
        break;
      }
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  /* Row actions menu */
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Confirmation modal */
  const [confirmModal, setConfirmModal] = useState<{ type: 'complete' | 'unassign'; studentId: string; studentName: string } | null>(null);

  /* Ticket modal (richiedi assistenza) */
  const [ticketModal, setTicketModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketFiles, setTicketFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ticketCountByStudent, setTicketCountByStudent] = useState<Record<string, number>>({});

  /* Close menu on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenuId]);

  function handleConfirmAction() {
    if (!confirmModal) return;
    // Mock action — in production this would call an API
    setConfirmModal(null);
  }

  function handleSendTicket() {
    if (!ticketModal || !ticketMessage.trim()) return;
    const studentId = ticketModal.studentId;
    // Mock — in production this creates a ticket
    setTicketSent(true);
    setTimeout(() => {
      setTicketCountByStudent(prev => ({
        ...prev,
        [studentId]: (prev[studentId] || 0) + 1,
      }));
      setTicketModal(null);
      setTicketMessage('');
      setTicketFiles([]);
      setTicketSent(false);
    }, 1500);
  }

  /* Sort icon */
  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ChevronDown className="w-3 h-3 opacity-30" />
  );

  /* Status badge */
  function statusBadge(status: StudentStatus) {
    const coachStatus = normalizeCoachStatus(status);
    return (
      <span
        className="inline-flex items-center gap-[6px] whitespace-nowrap"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-medium)',
          color: COACH_STATUS_DOT_COLORS[coachStatus],
          lineHeight: '1.5',
        }}
      >
        <span
          className="shrink-0"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: COACH_STATUS_DOT_COLORS[coachStatus],
          }}
        />
        {STATUS_LABELS[coachStatus]}
      </span>
    );
  }

  /* Service type badge */
  function serviceTypeBadge(serviceType: typeof STUDENTS_DATA[0]['serviceType']) {
    return (
      <span
        className="inline-flex items-center px-[10px] py-[3px] whitespace-nowrap"
        style={{
          borderRadius: 'var(--radius-badge)',
          border: '1px solid var(--border)',
          background: 'var(--card)',
          fontFamily: 'var(--font-inter)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
        }}
      >
        {SERVICE_TYPE_LABELS[serviceType]}
      </span>
    );
  }

  /* Format Italian date to short format: "10 dic 2025" */
  function shortDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const monthMap: Record<string, string> = {
      'gennaio': 'gen', 'febbraio': 'feb', 'marzo': 'mar', 'aprile': 'apr',
      'maggio': 'mag', 'giugno': 'giu', 'luglio': 'lug', 'agosto': 'ago',
      'settembre': 'set', 'ottobre': 'ott', 'novembre': 'nov', 'dicembre': 'dic',
    };
    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return dateStr;
    const shortMonth = monthMap[match[2].toLowerCase()] || match[2];
    return `${match[1]} ${shortMonth} ${match[3]}`;
  }

  /* ──────────────────────────────── RENDER ──────────────────────────────── */

  return (
    <div className="px-[40px] py-[32px]">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.5, color: 'var(--foreground)' }}>
          I Miei Studenti
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)' }}>
          Gestisci i percorsi di coaching dei tuoi studenti
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-0 mb-6 border-b border-[var(--border)]">
        <TabButton active={activeTab === 'active'} count={assignedStudents.filter(s => ACTIVE_STATUSES.includes(s.status)).length} onClick={() => { setActiveTab('active'); setStatusFilter('all'); }}>Percorsi attivi</TabButton>
        <TabButton active={activeTab === 'past'} count={assignedStudents.filter(s => PAST_STATUSES.includes(s.status)).length} onClick={() => { setActiveTab('past'); setStatusFilter('all'); }}>Percorsi passati</TabButton>
        <TabButton active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setStatusFilter('all'); }}>Calendario</TabButton>
      </div>

      {/* ── Calendar Tab Content ── */}
      {activeTab === 'calendar' && (
        <CalendarTableView />
      )}

      {/* ── Search & Filter (only for list tabs) ── */}
      {activeTab !== 'calendar' && (
      <>
      {/* ── Search & Filter ── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 flex items-center border border-[var(--border)] bg-[var(--input-background)] overflow-hidden" style={{ borderRadius: 'var(--radius)', height: '46px' }}>
          <div className="px-4"><Search className="w-4 h-4 text-[var(--muted-foreground)]" /></div>
          <input
            type="text" placeholder="Cerca per nome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 h-full bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)' }}
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] pr-8 pl-4 h-[46px] min-w-[200px] cursor-pointer"
            style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
          >
            <option value="all">Tutti gli stati</option>
            {activeTab === 'active'
              ? COACH_ACTIVE_STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)
              : PAST_STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="border border-[var(--border)] bg-[var(--card)] overflow-x-auto" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
        {/* Header */}
        <div className="bg-[var(--muted)]">
          <div className="flex items-center h-[54px]" style={{ minWidth: `${tableMinWidth}px` }}>
            <HeaderCell id="name" label="Nome" field="name" width={columnWidths.name} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="degree" label="Corso di Laurea" field="degree" width={columnWidths.degree} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="thesisType" label="Tipologia" field="thesisType" width={columnWidths.thesisType} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="serviceType" label="Lavorazione" field="serviceType" width={columnWidths.serviceType} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="status" label="Stato" field="status" width={columnWidths.status} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="progress" label="Progresso" field="progress" width={columnWidths.progress} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="planStart" label="Inizio piano" field="planStart" width={columnWidths.planStart} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="planEnd" label="Scadenza piano" field="planEnd" width={columnWidths.planEnd} onSort={toggleSort} SortIcon={SortIcon} onResize={handleResize} />
            <HeaderCell id="tickets" label="Ticket" width={columnWidths.tickets} onResize={handleResize} />
            <HeaderCell id="actions" label="Azioni" width={columnWidths.actions} />
          </div>
        </div>

        {/* Body */}
        <div>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>Nessuno studente trovato</p>
              <p className="mt-1" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}>Prova a modificare i filtri di ricerca</p>
            </div>
          ) : (
            sorted.map(student => (
              <div key={student.id}>
                {/* Main row */}
                <div
                  className="flex items-stretch transition-colors cursor-pointer border-b border-[var(--border)] hover:bg-[var(--muted)]"
                  style={{ minHeight: '68px', minWidth: `${tableMinWidth}px` }}
                  onClick={() => navigate(`${viewBasePath}/studenti/${student.id}`)}
                >
                  {/* Name + optional university + activity indicator */}
                  <Cell width={columnWidths.name}>
                    <div className="flex items-center gap-[10px]">
                      <div className="flex flex-col gap-[2px] min-w-0">
                        <div className="flex items-center gap-[8px]">
                          <span className="text-[var(--foreground)] truncate" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>
                            {student.name}
                          </span>
                          {(student.newActivityCount ?? 0) > 0 && (
                            <span
                              className="inline-flex items-center gap-[3px] shrink-0 px-[6px] py-[1px]"
                              style={{
                                borderRadius: '10px',
                                background: 'rgba(46,144,250,0.12)',
                                color: 'var(--chart-2)',
                                fontFamily: 'var(--font-inter)',
                                fontSize: '11px',
                                fontWeight: 'var(--font-weight-medium)',
                              }}
                              title={`${student.newActivityCount} novita`}
                            >
                              <Bell className="w-[10px] h-[10px]" />
                              {student.newActivityCount}
                            </span>
                          )}
                        </div>
                        {student.university && (
                          <span className="text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)' }}>
                            {student.university}
                          </span>
                        )}
                      </div>
                    </div>
                  </Cell>
                  <Cell width={columnWidths.degree}>{student.degree}</Cell>
                  <Cell width={columnWidths.thesisType}>
                    {student.thesisType ? (
                      <span
                        className="inline-flex items-center px-[10px] py-[3px] whitespace-nowrap"
                        style={{
                          borderRadius: 'var(--radius-badge)',
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {THESIS_TYPE_LABELS[student.thesisType]}
                      </span>
                    ) : (
                      <span
                        className="italic"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        —
                      </span>
                    )}
                  </Cell>
                  <Cell width={columnWidths.serviceType}>
                    {serviceTypeBadge(student.serviceType)}
                  </Cell>
                  <Cell width={columnWidths.status}>
                    <div className="flex flex-col gap-[4px]">
                      {statusBadge(student.status)}
                      {!student.hasTimeline && student.status === 'pending_payment' && (
                        <span className="inline-flex items-center gap-1 text-[var(--chart-3)]" style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)' }}>
                          <AlertTriangle className="w-3 h-3" />
                          Timeline mancante
                        </span>
                      )}
                    </div>
                  </Cell>
                  <Cell width={columnWidths.progress}>
                    <TimelineProgressCell {...getTimelineProgress(student.currentPhase, student.status)} />
                  </Cell>
                  <Cell width={columnWidths.planStart}>
                    {student.planStartDate ? (
                      <div className="flex items-center gap-[6px]">
                        <Calendar className="w-[12px] h-[12px] text-[var(--muted-foreground)] shrink-0" />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)' }}>
                          {shortDate(student.planStartDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted-foreground)] italic" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}>
                        —
                      </span>
                    )}
                  </Cell>
                  <Cell width={columnWidths.planEnd}>
                    {student.planEndDate ? (
                      <div className="flex items-center gap-[6px]">
                        <Calendar className="w-[12px] h-[12px] text-[var(--muted-foreground)] shrink-0" />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)' }}>
                          {shortDate(student.planEndDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--muted-foreground)] italic" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}>
                        —
                      </span>
                    )}
                  </Cell>

                  <Cell width={columnWidths.tickets}>
                    <div className="w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <TicketBadgeButton
                        count={ticketCountByStudent[student.id] || 0}
                        onClick={() => setTicketModal({ studentId: student.id, studentName: student.name })}
                      />
                    </div>
                  </Cell>

                  {/* ── Three-dot actions menu ── */}
                  <Cell width={columnWidths.actions}>
                    <div className="relative" onClick={e => e.stopPropagation()} ref={openMenuId === student.id ? menuRef : undefined}>
                      <button
                        className="flex items-center justify-center w-[32px] h-[32px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                        style={{ borderRadius: 'var(--radius)' }}
                        onClick={() => setOpenMenuId(prev => prev === student.id ? null : student.id)}
                        title="Azioni"
                      >
                        <MoreVertical className="w-[16px] h-[16px]" />
                      </button>

                      {openMenuId === student.id && (
                        <div
                          className="absolute right-0 top-[36px] z-50 border border-[var(--border)] bg-[var(--card)] py-[4px]"
                          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-md)', minWidth: '220px' }}
                        >
                          {/* Completato */}
                          <button
                            className="flex items-center gap-[10px] w-full px-[14px] py-[10px] text-left hover:bg-[var(--muted)] transition-colors"
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmModal({ type: 'complete', studentId: student.id, studentName: student.name });
                            }}
                          >
                            <CheckCircle2 className="w-[15px] h-[15px] text-[var(--primary)] shrink-0" />
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                              Segna come completato
                            </span>
                          </button>

                          {/* Richiedi assistenza */}
                          <button
                            className="flex items-center gap-[10px] w-full px-[14px] py-[10px] text-left hover:bg-[var(--muted)] transition-colors"
                            onClick={() => {
                              setOpenMenuId(null);
                              setTicketModal({ studentId: student.id, studentName: student.name });
                            }}
                          >
                            <LifeBuoy className="w-[15px] h-[15px] text-[var(--chart-2)] shrink-0" />
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                              Richiedi assistenza
                            </span>
                          </button>

                          {/* Divider */}
                          <div className="my-[4px] border-t border-[var(--border)]" />

                          {/* Rimuovi assegnazione */}
                          <button
                            className="flex items-center gap-[10px] w-full px-[14px] py-[10px] text-left hover:bg-[var(--muted)] transition-colors"
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmModal({ type: 'unassign', studentId: student.id, studentName: student.name });
                            }}
                          >
                            <UserMinus className="w-[15px] h-[15px] text-[var(--destructive-foreground)] shrink-0" />
                            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--destructive-foreground)' }}>
                              Rimuovi assegnazione
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Cell>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </>
      )}

      {/* ── Confirmation Modal (Completato / Rimuovi assegnazione) ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div
            className="bg-[var(--card)] border border-[var(--border)] w-full max-w-[440px] mx-4"
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-lg)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[12px]">
              <div className="flex items-center gap-[10px]">
                {confirmModal.type === 'complete' ? (
                  <div className="flex items-center justify-center w-[36px] h-[36px]" style={{ borderRadius: '50%', background: 'rgba(11,182,63,0.10)' }}>
                    <CheckCircle2 className="w-[18px] h-[18px] text-[var(--primary)]" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-[36px] h-[36px]" style={{ borderRadius: '50%', background: 'rgba(220,38,38,0.10)' }}>
                    <UserMinus className="w-[18px] h-[18px] text-[var(--destructive-foreground)]" />
                  </div>
                )}
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                  {confirmModal.type === 'complete' ? 'Conferma completamento' : 'Conferma rimozione'}
                </span>
              </div>
              <button
                className="flex items-center justify-center w-[28px] h-[28px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                style={{ borderRadius: 'var(--radius)' }}
                onClick={() => setConfirmModal(null)}
              >
                <X className="w-[16px] h-[16px]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-[24px] py-[12px]">
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                {confirmModal.type === 'complete'
                  ? <>Stai per segnare il percorso di <strong style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{confirmModal.studentName}</strong> come completato. Lo studente verra spostato nei percorsi passati. Questa azione non e facilmente reversibile.</>
                  : <>Stai per rimuovere l'assegnazione di <strong style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{confirmModal.studentName}</strong>. Lo studente non sara piu visibile nella tua lista. Questa azione non e facilmente reversibile.</>
                }
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-[10px] px-[24px] pb-[24px] pt-[12px]">
              <button
                className="px-[16px] py-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
                onClick={() => setConfirmModal(null)}
              >
                Annulla
              </button>
              <button
                className="px-[16px] py-[8px] transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  background: confirmModal.type === 'complete' ? 'var(--primary)' : 'var(--destructive-foreground)',
                  color: '#fff',
                }}
                onClick={handleConfirmAction}
              >
                {confirmModal.type === 'complete' ? 'Conferma completamento' : 'Rimuovi assegnazione'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticket Modal (Richiedi assistenza) ── */}
      {ticketModal && <TicketModalContent
        ticketModal={ticketModal}
        ticketMessage={ticketMessage}
        setTicketMessage={setTicketMessage}
        ticketSent={ticketSent}
        ticketFiles={ticketFiles}
        setTicketFiles={setTicketFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        onClose={() => { setTicketModal(null); setTicketMessage(''); setTicketFiles([]); setTicketSent(false); }}
        onSend={handleSendTicket}
      />}
    </div>
  );
}

/* ════════════════════════════════ Ticket Modal ════════════════════════════════ */

function TicketModalContent({
  ticketModal,
  ticketMessage,
  setTicketMessage,
  ticketSent,
  ticketFiles,
  setTicketFiles,
  isDragOver,
  setIsDragOver,
  onClose,
  onSend,
}: {
  ticketModal: { studentId: string; studentName: string };
  ticketMessage: string;
  setTicketMessage: (v: string) => void;
  ticketSent: boolean;
  ticketFiles: File[];
  setTicketFiles: Dispatch<SetStateAction<File[]>>;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  const student = STUDENTS_DATA.find(s => s.id === ticketModal.studentId);
  const referente = ADMIN_REFERENTI.find(a => a.id === student?.adminReferenteId) || ADMIN_REFERENTI[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="bg-[var(--card)] border border-[var(--border)] w-full max-w-[500px] mx-4"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-lg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[12px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center justify-center w-[36px] h-[36px]" style={{ borderRadius: '50%', background: 'rgba(46,144,250,0.10)' }}>
              <LifeBuoy className="w-[18px] h-[18px] text-[var(--chart-2)]" />
            </div>
            <div className="flex flex-col gap-[2px]">
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                Richiedi assistenza
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                Studente: {ticketModal.studentName}
              </span>
            </div>
          </div>
          <button
            className="flex items-center justify-center w-[28px] h-[28px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
            onClick={onClose}
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-[24px] py-[12px]">
          {/* Destinatario referente card */}
          <div
            className="flex items-center gap-[12px] p-[12px] mb-[16px] border border-[var(--border)]"
            style={{ borderRadius: 'var(--radius)', background: 'var(--muted)' }}
          >
            <img
              src={referente.avatarUrl}
              alt={referente.name}
              className="shrink-0 object-cover"
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--border)' }}
            />
            <div className="flex flex-col gap-[1px] min-w-0">
              <span
                className="truncate"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}
              >
                {referente.name}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                {referente.role}
              </span>
            </div>
            <span
              className="ml-auto shrink-0 px-[8px] py-[2px]"
              style={{
                borderRadius: 'var(--radius-badge)',
                background: 'rgba(46,144,250,0.10)',
                color: 'var(--chart-2)',
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Destinatario
            </span>
          </div>

          <p className="mb-[12px]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            Il ticket verra inviato direttamente a <strong style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{referente.name}</strong> e sara visibile nella tua dashboard.
          </p>

          {/* Messaggio */}
          <span
            className="block mb-[6px]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}
          >
            Messaggio
          </span>
          <textarea
            value={ticketMessage}
            onChange={e => setTicketMessage(e.target.value)}
            placeholder="Descrivi brevemente la richiesta di assistenza..."
            className="w-full border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
              padding: '12px',
              minHeight: '100px',
            }}
            disabled={ticketSent}
          />

          {/* Allegati */}
          <div className="mt-[14px]">
            <span
              className="block mb-[6px]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}
            >
              Allegati <span style={{ fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>(opzionale)</span>
            </span>

            {/* Drag-and-drop zone — drop only (click-to-browse not supported in sandbox) */}
            <div
              className="relative transition-colors"
              style={{
                border: isDragOver
                  ? '2px dashed var(--primary)'
                  : '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: isDragOver
                  ? 'rgba(11, 182, 63, 0.04)'
                  : 'var(--muted)',
                padding: '20px',
              }}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (!ticketSent) setIsDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                if (ticketSent) return;
                const droppedFiles = e.dataTransfer.files;
                if (droppedFiles && droppedFiles.length > 0) {
                  setTicketFiles(prev => [...prev, ...Array.from(droppedFiles)]);
                }
              }}
            >
              <div className="flex flex-col items-center gap-[6px]">
                <Upload
                  className="w-[20px] h-[20px]"
                  style={{ color: isDragOver ? 'var(--primary)' : 'var(--muted-foreground)' }}
                />
                <p style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: isDragOver ? 'var(--primary)' : 'var(--foreground)',
                }}>
                  {isDragOver ? 'Rilascia qui' : 'Trascina i file qui per allegarli'}
                </p>
                <p style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}>
                  PDF, DOC, DOCX, JPG, PNG, XLS...
                </p>
              </div>
            </div>

            {/* Uploaded files list */}
            {ticketFiles.length > 0 && (
              <div className="flex flex-col gap-[6px] mt-[10px]">
                {ticketFiles.map((file, index) => {
                  const fileInfo = getFileTypeFromName(file.name);
                  const FileIcon = fileInfo.icon;
                  const ext = getFileExtension(file.name);
                  const typeLabel = FILE_TYPE_LABELS[fileInfo.type];
                  return (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-[10px] px-[12px] py-[10px] border border-[var(--border)]"
                      style={{ borderRadius: 'calc(var(--radius) - 2px)', background: 'var(--background)' }}
                    >
                      {/* File type icon */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{ width: '32px', height: '32px', borderRadius: 'calc(var(--radius) - 4px)', background: 'var(--muted)' }}
                      >
                        <FileIcon className={`w-[16px] h-[16px] ${fileInfo.color}`} />
                      </div>

                      {/* File details */}
                      <div className="flex flex-col gap-[1px] flex-1 min-w-0">
                        <span
                          className="truncate"
                          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}
                        >
                          {file.name}
                        </span>
                        <div className="flex items-center gap-[8px]">
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                            {ext}
                          </span>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--muted-foreground)', opacity: 0.4, display: 'inline-block' }} />
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                            {typeLabel}
                          </span>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--muted-foreground)', opacity: 0.4, display: 'inline-block' }} />
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        className="shrink-0 flex items-center justify-center w-[26px] h-[26px] text-[var(--muted-foreground)] hover:text-[var(--destructive-foreground)] hover:bg-[var(--muted)] transition-colors"
                        style={{ borderRadius: 'calc(var(--radius) - 4px)' }}
                        onClick={() => setTicketFiles(prev => prev.filter((_, i) => i !== index))}
                        disabled={ticketSent}
                        title="Rimuovi"
                      >
                        <Trash2 className="w-[13px] h-[13px]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-[24px] pb-[24px] pt-[10px]">
          {ticketSent ? (
            <span className="flex items-center gap-[6px]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>
              <CheckCircle2 className="w-[14px] h-[14px]" />
              Ticket inviato con successo
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-[10px]">
            <button
              className="px-[16px] py-[8px] border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
              onClick={onClose}
              disabled={ticketSent}
            >
              Annulla
            </button>
            <button
              className="px-[16px] py-[8px] transition-colors disabled:opacity-40"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                background: 'var(--chart-2)',
                color: '#fff',
              }}
              onClick={onSend}
              disabled={!ticketMessage.trim() || ticketSent}
            >
              Invia ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════ Sub-components ════════════════════════════════ */

function TabButton({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-[20px] py-[12px] transition-colors relative ${active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
    >
      {children}
      {count !== undefined && (
        <span
          className="ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-[6px]"
          style={{
            background: active ? 'var(--foreground)' : 'var(--muted)',
            color: active ? 'var(--background)' : 'var(--muted-foreground)',
            borderRadius: '10px', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {count}
        </span>
      )}
      {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]" />}
    </button>
  );
}

function HeaderCell({ id, label, field, width, onSort, SortIcon, onResize }: {
  id: CoachTableColumnKey;
  label: string;
  field?: SortField;
  width: number;
  onSort?: (f: SortField) => void;
  SortIcon?: React.FC<{ field: SortField }>;
  onResize?: (columnKey: string, e: React.MouseEvent) => void;
}) {
  const isSortable = Boolean(field && onSort);
  return (
    <div
      className={`px-[16px] shrink-0 relative ${isSortable ? 'cursor-pointer select-none' : ''}`}
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        height: '100%',
        backgroundColor: 'var(--muted)',
        borderBottom: '1px solid var(--border)',
      }}
      onClick={() => field && onSort?.(field)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: label ? (field ? 'space-between' : 'center') : 'center',
          height: '100%',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            lineHeight: '1.5',
            textTransform: 'none',
            letterSpacing: 'normal',
          }}
        >
          {label}
        </span>
        {field && SortIcon && <SortIcon field={field} />}
      </div>
      {onResize && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            borderRight: '1px solid var(--border)',
            transition: 'border-color 0.15s ease',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResize(id, e);
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRight = '2px solid var(--primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderRight = '1px solid var(--border)';
          }}
        />
      )}
    </div>
  );
}

function Cell({ children, width }: { children: React.ReactNode; width: number }) {
  return (
    <div
      className="px-[16px] py-[12px] shrink-0 flex items-center text-[var(--foreground)]"
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)',
      }}
    >
      {children}
    </div>
  );
}

function TicketBadgeButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${count} ticket`}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0.25rem',
        color: count > 0 ? 'var(--chart-2)' : 'var(--muted-foreground)',
      }}
    >
      <LifeBuoy size={18} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--chart-2)',
            color: 'var(--background)',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium)',
            fontFamily: 'var(--font-inter)',
            lineHeight: '1',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function normalizeCoachStatus(status: StudentStatus): Exclude<StudentStatus, 'pending_payment'> {
  if (status === 'pending_payment') return 'active';
  return status;
}

function getProgressRatio(currentPhase: string, status: StudentStatus): number {
  const { completed, total } = getTimelineProgress(currentPhase, status);
  if (total <= 0) return -1;
  return completed / total;
}

function getTimelineProgress(currentPhase: string, status: StudentStatus): { completed: number; total: number } {
  if (status === 'completed') {
    const completedMatch = currentPhase.match(/(\d+)\s*\/\s*(\d+)/);
    if (completedMatch) {
      return { completed: parseInt(completedMatch[2], 10), total: parseInt(completedMatch[2], 10) };
    }
  }

  const phaseMatch = currentPhase.match(/fase\s+(\d+)\s+di\s+(\d+)/i);
  if (!phaseMatch) return { completed: 0, total: 0 };

  const current = parseInt(phaseMatch[1], 10);
  const total = parseInt(phaseMatch[2], 10);
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return { completed: 0, total: 0 };

  return { completed: Math.max(0, Math.min(current, total)), total };
}

function TimelineProgressCell({ completed, total }: { completed: number; total: number }) {
  if (total === 0) {
    return (
      <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5' }}>
        —
      </span>
    );
  }

  const pct = Math.round((completed / total) * 100);
  const barColor = pct === 100 ? 'var(--primary)' : pct >= 50 ? 'var(--chart-2)' : 'var(--chart-3)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '60px' }}>
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
          lineHeight: '1.5',
        }}
      >
        {completed}/{total}
      </span>
      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '2px',
            background: barColor,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
