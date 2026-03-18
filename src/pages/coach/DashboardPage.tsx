import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Users,
  ChevronRight,
  Circle,
  MessageSquare,
  Clock,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { STUDENTS_DATA, STATUS_LABELS, STATUS_STYLES } from './studentsData';
import { getViewBasePath } from './viewBasePath';

/* ── Availability types ── */
type CoachAvailability = 'disponibile' | 'limitata' | 'pieno' | 'non_disponibile';

const AVAILABILITY_CONFIG: Record<
  CoachAvailability,
  { label: string; color: string; bg: string }
> = {
  disponibile: {
    label: 'Disponibile',
    color: 'var(--primary)',
    bg: 'rgba(11,182,63,0.10)',
  },
  limitata: {
    label: 'Limitata',
    color: 'var(--chart-3)',
    bg: 'rgba(247,144,9,0.10)',
  },
  pieno: {
    label: 'Pieno',
    color: 'var(--chart-2)',
    bg: 'rgba(46,144,250,0.10)',
  },
  non_disponibile: {
    label: 'Non disponibile',
    color: 'var(--destructive-foreground)',
    bg: 'rgba(220,38,38,0.10)',
  },
};

const AVAILABILITY_OPTIONS: CoachAvailability[] = [
  'disponibile',
  'limitata',
  'pieno',
  'non_disponibile',
];

/* ── Mock tickets ── */
interface Ticket {
  id: string;
  subject: string;
  from: string;
  fromRole: 'admin' | 'coach' | 'student';
  date: string;
  status: 'open' | 'closed';
  snippet: string;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'T-201',
    subject: 'Richiesta estensione piano per S-034',
    from: 'Admin · Laura Ricci',
    fromRole: 'admin',
    date: '26 feb 2026',
    status: 'open',
    snippet: 'Lo studente ha richiesto un\'estensione di 2 settimane. Puoi confermare?',
  },
  {
    id: 'T-198',
    subject: 'Problema fatturazione servizio Revisione',
    from: 'Admin · Laura Ricci',
    fromRole: 'admin',
    date: '24 feb 2026',
    status: 'open',
    snippet: 'Il pagamento per il servizio Revisione di Luca Neri risulta incompleto.',
  },
  {
    id: 'T-195',
    subject: 'Nuovo materiale didattico disponibile',
    from: 'Admin · Marco Belli',
    fromRole: 'admin',
    date: '20 feb 2026',
    status: 'closed',
    snippet: 'Abbiamo aggiornato le linee guida per la revisione tesi. Scarica dalla libreria.',
  },
  {
    id: 'T-190',
    subject: 'Feedback check plagio — falso positivo',
    from: 'Giulia Verdi',
    fromRole: 'student',
    date: '18 feb 2026',
    status: 'closed',
    snippet: 'Il check plagio ha segnalato un paragrafo che è una citazione diretta, non plagio.',
  },
];

/* ──────────────────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewBasePath = getViewBasePath(location.pathname);
  const [dashboardTab, setDashboardTab] = useState<'tickets' | 'unassigned'>('tickets');

  const assigned = STUDENTS_DATA.filter(s => s.assigned);
  const activeCount = assigned.filter(s => s.status === 'active').length;
  const pendingStudents = STUDENTS_DATA.filter(s => !s.assigned);
  const openTickets = MOCK_TICKETS.filter(t => t.status === 'open');

  return (
    <div className="px-[40px] py-[32px]">
      {/* ── Header ── */}
      <div className="mb-10">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Dashboard
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Panoramica e gestione della tua attività di coaching
        </p>
      </div>

      {/* ── Top row: Stats + Availability ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {/* Studenti attivi */}
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col justify-between cursor-pointer hover:border-[var(--primary)] transition-colors"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
          onClick={() => navigate(`${viewBasePath}/studenti`)}
        >
          <div className="flex items-center justify-between mb-4">
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
              Studenti attivi
            </span>
            <Users className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: '40px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              lineHeight: 1,
            }}
          >
            {activeCount}
          </p>
          <p
            className="mt-2 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            su {assigned.length} percorsi totali
          </p>
        </div>


        {/* Illustration placeholder */}
        <div
          className="border border-dashed border-[var(--border)] bg-[var(--muted)] flex flex-col items-center justify-center p-6"
          style={{ borderRadius: 'var(--radius)', minHeight: '160px' }}
        >
          
          <p
            className="text-[var(--muted-foreground)] text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Illustrazione / Animazione
          </p>
          
        </div>
      </div>

      {/* ── Tabbed section: Tickets + Senza assegnazione ── */}
      <div
        className="border border-[var(--border)] bg-[var(--card)]"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] px-6">
          <button
            onClick={() => setDashboardTab('tickets')}
            className="relative px-1 py-4 mr-6 transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: dashboardTab === 'tickets' ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
              color: dashboardTab === 'tickets' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Ticket recenti
              {openTickets.length > 0 && (
                <span
                  className="inline-flex items-center justify-center px-[7px]"
                  style={{
                    background: 'rgba(220,38,38,0.10)',
                    color: 'var(--destructive-foreground)',
                    borderRadius: 'var(--radius-badge)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    height: '20px',
                  }}
                >
                  {openTickets.length}
                </span>
              )}
            </span>
            {dashboardTab === 'tickets' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]"
                style={{ borderRadius: '1px' }}
              />
            )}
          </button>

          <button
            onClick={() => setDashboardTab('unassigned')}
            className="relative px-1 py-4 transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: dashboardTab === 'unassigned' ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
              color: dashboardTab === 'unassigned' ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <span className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Senza assegnazione
              {pendingStudents.length > 0 && (
                <span
                  className="inline-flex items-center justify-center px-[7px]"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    borderRadius: 'var(--radius-badge)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    height: '20px',
                  }}
                >
                  {pendingStudents.length}
                </span>
              )}
            </span>
            {dashboardTab === 'unassigned' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--foreground)]"
                style={{ borderRadius: '1px' }}
              />
            )}
          </button>
        </div>

        {/* Tab content */}
        {dashboardTab === 'tickets' ? (
          <div className="px-3 py-3">
            {MOCK_TICKETS.length === 0 ? (
              <p
                className="text-[var(--muted-foreground)] py-10 text-center"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Nessun ticket recente.
              </p>
            ) : (
              MOCK_TICKETS.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className={`p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer ${idx < MOCK_TICKETS.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                  style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p
                      className="text-[var(--foreground)] flex-1 min-w-0 truncate"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {ticket.subject}
                    </p>
                    <span
                      className="inline-flex items-center px-[8px] py-[2px] shrink-0"
                      style={{
                        background:
                          ticket.status === 'open'
                            ? 'rgba(11,182,63,0.10)'
                            : 'rgba(113,118,128,0.10)',
                        color:
                          ticket.status === 'open'
                            ? 'var(--primary)'
                            : 'var(--muted-foreground)',
                        borderRadius: 'var(--radius-badge)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {ticket.status === 'open' ? 'Aperto' : 'Chiuso'}
                    </span>
                  </div>
                  <p
                    className="text-[var(--muted-foreground)] mb-2 truncate"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    {ticket.snippet}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                    <span
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {ticket.date}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {ticket.from}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="px-3 py-3">
            {pendingStudents.length === 0 ? (
              <p
                className="text-[var(--muted-foreground)] py-10 text-center"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Nessuno studente senza assegnazione.
              </p>
            ) : (
              pendingStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer ${idx < pendingStudents.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                  style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 shrink-0 flex items-center justify-center"
                    style={{
                      background: 'rgba(11,182,63,0.10)',
                      borderRadius: '50%',
                    }}
                  >
                    <span
                      className="text-[var(--primary)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {student.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[var(--foreground)] truncate"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {student.name}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)] truncate"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {student.degree} · {student.service}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    className="inline-flex items-center px-[10px] py-[3px] shrink-0"
                    style={{
                      background: STATUS_STYLES[student.status].bg,
                      color: STATUS_STYLES[student.status].text,
                      borderRadius: 'var(--radius-badge)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {STATUS_LABELS[student.status]}
                  </span>

                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Quick link ── */}
      <div className="mt-10">
        
      </div>
    </div>
  );
}