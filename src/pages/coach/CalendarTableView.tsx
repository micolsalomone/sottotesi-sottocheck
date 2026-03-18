import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ExternalLink } from 'lucide-react';
import { STUDENTS_DATA, StudentData, STATUS_LABELS, STATUS_STYLES } from './studentsData';
import { getViewBasePath } from './viewBasePath';

/* ─── Types ─── */

interface TimelineEvent {
  date: Date;
  studentId: string;
  studentName: string;
  phase: string;
  phaseTitle: string;
  eventType: 'start' | 'deadline' | 'completed';
  status: StudentData['status'];
}

interface MonthGroup {
  label: string;       // e.g. "Marzo 2026"
  events: TimelineEvent[];
}

/* ─── Mock timeline events for each student with a timeline ─── */

function generateMockEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const studentTimelines: Record<string, { phase: string; phaseTitle: string; start: string; end: string; eventType: 'start' | 'deadline' | 'completed' }[]> = {
    'S-034': [
      { phase: 'Fase 1 di 6', phaseTitle: 'Impostazione del progetto', start: '2026-01-05', end: '2026-01-18', eventType: 'completed' },
      { phase: 'Fase 2 di 6', phaseTitle: 'Rassegna bibliografica', start: '2026-01-19', end: '2026-02-08', eventType: 'completed' },
      { phase: 'Fase 3 di 6', phaseTitle: 'Metodologia e analisi', start: '2026-02-09', end: '2026-03-02', eventType: 'deadline' },
      { phase: 'Fase 4 di 6', phaseTitle: 'Stesura capitoli centrali', start: '2026-03-03', end: '2026-03-25', eventType: 'start' },
      { phase: 'Fase 5 di 6', phaseTitle: 'Revisione critica', start: '2026-03-26', end: '2026-04-10', eventType: 'start' },
      { phase: 'Fase 6 di 6', phaseTitle: 'Editing finale', start: '2026-04-11', end: '2026-04-25', eventType: 'start' },
    ],
    'S-022': [
      { phase: 'Fase 1 di 4', phaseTitle: 'Analisi requisiti', start: '2026-02-15', end: '2026-03-07', eventType: 'deadline' },
      { phase: 'Fase 2 di 4', phaseTitle: 'Raccolta dati', start: '2026-03-08', end: '2026-04-01', eventType: 'start' },
      { phase: 'Fase 3 di 4', phaseTitle: 'Elaborazione risultati', start: '2026-04-02', end: '2026-05-05', eventType: 'start' },
      { phase: 'Fase 4 di 4', phaseTitle: 'Stesura e revisione', start: '2026-05-06', end: '2026-06-15', eventType: 'start' },
    ],
    'S-052': [
      { phase: 'Fase 1 di 6', phaseTitle: 'Impostazione del progetto e quadro teorico', start: '2026-01-05', end: '2026-01-18', eventType: 'completed' },
      { phase: 'Fase 2 di 6', phaseTitle: 'Rassegna bibliografica e stato dell\'arte', start: '2026-01-19', end: '2026-02-08', eventType: 'completed' },
      { phase: 'Fase 3 di 6', phaseTitle: 'Metodologia comparativa e analisi dei testi', start: '2026-02-09', end: '2026-03-05', eventType: 'deadline' },
      { phase: 'Fase 4 di 6', phaseTitle: 'Stesura dei capitoli centrali', start: '2026-03-06', end: '2026-03-25', eventType: 'start' },
      { phase: 'Fase 5 di 6', phaseTitle: 'Revisione critica e apparato note', start: '2026-03-26', end: '2026-04-02', eventType: 'start' },
      { phase: 'Fase 6 di 6', phaseTitle: 'Editing finale e preparazione alla discussione', start: '2026-04-03', end: '2026-04-05', eventType: 'start' },
    ],
    'S-015': [
      { phase: 'Fase 1 di 5', phaseTitle: 'Ricerca normativa', start: '2025-09-01', end: '2025-10-10', eventType: 'completed' },
      { phase: 'Fase 2 di 5', phaseTitle: 'Analisi comparata', start: '2025-10-11', end: '2025-11-20', eventType: 'completed' },
      { phase: 'Fase 3 di 5', phaseTitle: 'Stesura', start: '2025-11-21', end: '2026-01-15', eventType: 'completed' },
      { phase: 'Fase 4 di 5', phaseTitle: 'Revisione', start: '2026-01-16', end: '2026-02-10', eventType: 'completed' },
      { phase: 'Fase 5 di 5', phaseTitle: 'Consegna finale', start: '2026-02-11', end: '2026-02-20', eventType: 'completed' },
    ],
    'S-058': [
      { phase: 'Fase 1 di 5', phaseTitle: 'Analisi contesto digitale', start: '2026-03-01', end: '2026-03-20', eventType: 'start' },
      { phase: 'Fase 2 di 5', phaseTitle: 'Raccolta dati campagne', start: '2026-03-21', end: '2026-04-15', eventType: 'start' },
      { phase: 'Fase 3 di 5', phaseTitle: 'Analisi engagement', start: '2026-04-16', end: '2026-05-20', eventType: 'start' },
      { phase: 'Fase 4 di 5', phaseTitle: 'Stesura capitoli', start: '2026-05-21', end: '2026-06-30', eventType: 'start' },
      { phase: 'Fase 5 di 5', phaseTitle: 'Revisione finale', start: '2026-07-01', end: '2026-07-20', eventType: 'start' },
    ],
  };

  for (const [studentId, phases] of Object.entries(studentTimelines)) {
    const student = STUDENTS_DATA.find(s => s.id === studentId);
    if (!student) continue;

    for (const phase of phases) {
      // Add start event
      events.push({
        date: new Date(phase.start),
        studentId,
        studentName: student.name,
        phase: phase.phase,
        phaseTitle: phase.phaseTitle,
        eventType: phase.eventType === 'completed' ? 'completed' : 'start',
        status: student.status,
      });
      // Add deadline event
      events.push({
        date: new Date(phase.end),
        studentId,
        studentName: student.name,
        phase: phase.phase,
        phaseTitle: phase.phaseTitle,
        eventType: phase.eventType === 'completed' ? 'completed' : 'deadline',
        status: student.status,
      });
    }
  }

  return events;
}

/* ─── Helpers ─── */

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const EVENT_TYPE_LABELS: Record<string, string> = {
  start: 'Inizio fase',
  deadline: 'Scadenza',
  completed: 'Completato',
};

function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].substring(0, 3)}`;
}

/* ─── Component ─── */

export function CalendarTableView() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewBasePath = getViewBasePath(location.pathname);
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(6);

  const allEvents = useMemo(() => generateMockEvents(), []);

  const monthGroups = useMemo(() => {
    const today = new Date(2026, 1, 27); // Feb 27, 2026
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + rangeMonths, 0);

    // Filter events in range
    const inRange = allEvents
      .filter(e => e.date >= startMonth && e.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by month
    const groups: MonthGroup[] = [];
    let currentKey = '';

    for (const evt of inRange) {
      const key = `${evt.date.getFullYear()}-${evt.date.getMonth()}`;
      if (key !== currentKey) {
        currentKey = key;
        groups.push({
          label: `${MONTH_NAMES[evt.date.getMonth()]} ${evt.date.getFullYear()}`,
          events: [],
        });
      }
      groups[groups.length - 1].events.push(evt);
    }

    return groups;
  }, [allEvents, rangeMonths]);

  const todayStr = '2026-02-27';

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <p
          className="text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Prossimi {rangeMonths} mesi · {monthGroups.reduce((s, g) => s + g.events.length, 0)} eventi
        </p>
        <div
          className="flex items-center gap-1 bg-[var(--muted)] p-1"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <button
            onClick={() => setRangeMonths(6)}
            className={`px-3 py-[6px] transition-colors ${
              rangeMonths === 6
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            style={{
              borderRadius: 'calc(var(--radius) - 2px)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            6 mesi
          </button>
          <button
            onClick={() => setRangeMonths(12)}
            className={`px-3 py-[6px] transition-colors ${
              rangeMonths === 12
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            style={{
              borderRadius: 'calc(var(--radius) - 2px)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            12 mesi
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="border border-[var(--border)] bg-[var(--card)] overflow-hidden"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        {/* Table header */}
        <div className="bg-[var(--muted)] border-b border-[var(--border)]">
          <div className="flex items-center h-[48px]">
            <div
              className="w-[140px] shrink-0 px-[16px] flex items-center"
            >
              <span
                className="text-[var(--muted-foreground)] uppercase tracking-[0.7px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Data
              </span>
            </div>
            <div className="w-[180px] shrink-0 px-[16px] flex items-center">
              <span
                className="text-[var(--muted-foreground)] uppercase tracking-[0.7px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Studente
              </span>
            </div>
            <div className="flex-1 px-[16px] flex items-center">
              <span
                className="text-[var(--muted-foreground)] uppercase tracking-[0.7px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Fase
              </span>
            </div>
            <div className="w-[140px] shrink-0 px-[16px] flex items-center">
              <span
                className="text-[var(--muted-foreground)] uppercase tracking-[0.7px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Tipo
              </span>
            </div>
            <div className="w-[130px] shrink-0 px-[16px] flex items-center">
              <span
                className="text-[var(--muted-foreground)] uppercase tracking-[0.7px]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Stato
              </span>
            </div>
            <div className="w-[60px] shrink-0" />
          </div>
        </div>

        {/* Body */}
        <div>
          {monthGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Nessun evento nel periodo selezionato
              </p>
            </div>
          ) : (
            monthGroups.map((group) => (
              <div key={group.label}>
                {/* Month header */}
                <div className="bg-[var(--muted)] border-b border-[var(--border)] px-[16px] py-[10px]">
                  <span
                    className="text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-alegreya)',
                      fontSize: 'var(--text-h4)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    {group.label}
                  </span>
                </div>

                {/* Event rows */}
                {group.events.map((evt, i) => {
                  const dateStr = evt.date.toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;
                  const isPast = dateStr < todayStr && evt.eventType !== 'completed';
                  const dayName = DAY_NAMES[evt.date.getDay()];

                  return (
                    <div
                      key={`${evt.studentId}-${evt.phase}-${evt.eventType}-${i}`}
                      className={`flex items-center border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${
                        isToday ? 'bg-[rgba(11,182,63,0.04)]' : ''
                      }`}
                      style={{ minHeight: '56px' }}
                    >
                      {/* Date */}
                      <div className="w-[140px] shrink-0 px-[16px] py-[10px]">
                        <div className="flex items-center gap-2">
                          {isToday && (
                            <span
                              className="w-[6px] h-[6px] shrink-0 bg-[var(--primary)]"
                              style={{ borderRadius: '50%' }}
                            />
                          )}
                          <div>
                            <span
                              className={isToday ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: 'var(--text-label)',
                                fontWeight: isToday ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                              }}
                            >
                              {evt.date.getDate()} {MONTH_NAMES[evt.date.getMonth()].substring(0, 3)}
                            </span>
                            <br />
                            <span
                              className="text-[var(--muted-foreground)]"
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '12px',
                                fontWeight: 'var(--font-weight-regular)',
                              }}
                            >
                              {dayName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Student */}
                      <div className="w-[180px] shrink-0 px-[16px] py-[10px]">
                        <span
                          className="text-[var(--foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          {evt.studentName}
                        </span>
                      </div>

                      {/* Phase */}
                      <div className="flex-1 px-[16px] py-[10px]">
                        <span
                          className="text-[var(--muted-foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-medium)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {evt.phase}
                        </span>
                        <br />
                        <span
                          className="text-[var(--foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-regular)',
                          }}
                        >
                          {evt.phaseTitle}
                        </span>
                      </div>

                      {/* Event type */}
                      <div className="w-[140px] shrink-0 px-[16px] py-[10px]">
                        <EventTypeBadge type={evt.eventType} isPast={isPast} />
                      </div>

                      {/* Status */}
                      <div className="w-[130px] shrink-0 px-[16px] py-[10px]">
                        <span
                          className="inline-flex items-center px-[10px] py-[3px] whitespace-nowrap"
                          style={{
                            background: STATUS_STYLES[evt.status].bg,
                            color: STATUS_STYLES[evt.status].text,
                            borderRadius: 'var(--radius-badge)',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          {STATUS_LABELS[evt.status]}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="w-[60px] shrink-0 px-[16px] py-[10px] flex items-center justify-center">
                        <button
                          onClick={() => navigate(`${viewBasePath}/studenti/${evt.studentId}`)}
                          className="p-[6px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                          style={{ borderRadius: 'calc(var(--radius) - 4px)' }}
                          title="Apri timeline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function EventTypeBadge({ type, isPast }: { type: string; isPast: boolean }) {
  let bg = 'var(--muted)';
  let color = 'var(--muted-foreground)';

  if (type === 'deadline') {
    bg = isPast ? 'rgba(220,38,38,0.10)' : 'rgba(247,144,9,0.10)';
    color = isPast ? 'var(--destructive-foreground)' : 'var(--chart-3)';
  } else if (type === 'start') {
    bg = 'rgba(46,144,250,0.10)';
    color = 'var(--chart-2)';
  } else if (type === 'completed') {
    bg = 'rgba(11,182,63,0.10)';
    color = 'var(--primary)';
  }

  return (
    <span
      className="inline-flex items-center px-[10px] py-[3px] whitespace-nowrap"
      style={{
        background: bg,
        color,
        borderRadius: 'var(--radius-badge)',
        fontFamily: 'var(--font-inter)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)',
      }}
    >
      {EVENT_TYPE_LABELS[type] || type}
    </span>
  );
}
