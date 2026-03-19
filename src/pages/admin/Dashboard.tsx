import * as React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  GraduationCap,
  UserCheck,
  Briefcase,
  Plus,
  Users,
  MessageSquare,
  Wrench,
  ChevronRight,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { StatusPill } from '@/app/components/TablePrimitives';

/* ─── Mock ticket data ───────────────────────────────────────── */
type TicketPriority = 'alta' | 'media' | 'bassa';
type TicketStatus = 'aperto' | 'in_lavorazione' | 'risolto';
type TicketSource = 'coach' | 'studente';

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
}

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
  },
];

/* ─── Helpers ─────────────────────────────────────────────────── */
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

export function Dashboard() {
  const navigate = useNavigate();
  const [ticketFilter, setTicketFilter] = useState<'aperti' | 'coach' | 'studente'>('aperti');

  const filteredTickets = MOCK_TICKETS.filter(t => {
    if (ticketFilter === 'aperti') return t.status !== 'risolto';
    return t.source === ticketFilter && t.status !== 'risolto';
  });

  const openCount = MOCK_TICKETS.filter(t => t.status === 'aperto').length;
  const inProgressCount = MOCK_TICKETS.filter(t => t.status === 'in_lavorazione').length;

  return (
    <div style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* ─── Stat cards (Admin System State) ─────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Utenti (Studenti / Coach)</span>
            <div className="stat-icon" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">182 / 24</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            totale registrati a sistema
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Percorsi Attivi</span>
            <div className="stat-icon" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div className="stat-value">67</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            lavorazioni in corso
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Documenti Caricati</span>
            <div className="stat-icon" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">1.420</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            file archiviati (tesi, doc, rev)
          </div>
        </div>
      </div>

      {/* ─── Azioni rapide ────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
          marginBottom: '1rem',
          lineHeight: '1.5',
        }}>
          Azioni rapide
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
        }}>
  <button
            onClick={() => navigate('/pipelines')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, background 0.15s ease',
              boxShadow: 'var(--elevation-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--chart-5)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(122, 90, 248, 0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)';
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius)',
              background: 'var(--chart-5)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Users size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)',
                lineHeight: '1.5',
              }}>
                Nuova pipeline
              </div>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: '12px',
                color: 'var(--muted-foreground)', lineHeight: '1.5',
              }}>
                Aggiungi leads e preventivi
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/lavorazioni?azione=nuova')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, background 0.15s ease',
              boxShadow: 'var(--elevation-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--selected-row-bg)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)';
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius)',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Plus size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)',
                lineHeight: '1.5',
              }}>
                Nuova lavorazione
              </div>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: '12px',
                color: 'var(--muted-foreground)', lineHeight: '1.5',
              }}>
                Monitora pagamenti e fatture
              </div>
            </div>
          </button>

        

          <button
            onClick={() => navigate('/coach?azione=nuovo')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '1rem 1.25rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, background 0.15s ease',
              boxShadow: 'var(--elevation-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--chart-2)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(46, 144, 250, 0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)';
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius)',
              background: 'var(--chart-2)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserCheck size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)',
                lineHeight: '1.5',
              }}>
                Nuovo coach
              </div>
              <div style={{
                fontFamily: 'var(--font-inter)', fontSize: '12px',
                color: 'var(--muted-foreground)', lineHeight: '1.5',
              }}>
                Aggiungi contatti e disponibilità
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Ticket da timelines ──────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
            }}>
              Ticket
            </h2>
            {openCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.125rem 0.625rem',
                borderRadius: 'var(--radius-badge)',
                background: 'rgba(247, 144, 9, 0.1)',
                fontFamily: 'var(--font-inter)', fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--chart-3)',
                lineHeight: '1.5',
              }}>
                
                {openCount} aperti
              </span>
            )}
            {inProgressCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.125rem 0.625rem',
                borderRadius: 'var(--radius-badge)',
                background: 'rgba(46, 144, 250, 0.1)',
                fontFamily: 'var(--font-inter)', fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)', color: 'var(--chart-2)',
                lineHeight: '1.5',
              }}>
                
                {inProgressCount} in lavorazione
              </span>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem',
          marginBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0',
        }}>
          {([
            { key: 'aperti' as const, label: 'Aperti' },
            { key: 'coach' as const, label: 'Aperti (da coach)', icon: <GraduationCap size={14} /> },
            { key: 'studente' as const, label: 'Aperti (da studente)', icon: <Wrench size={14} /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setTicketFilter(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem',
                fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: ticketFilter === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: ticketFilter === tab.key ? '2px solid var(--foreground)' : '2px solid transparent',
                marginBottom: '-1px',
                lineHeight: '1.5',
                transition: 'color 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {filteredTickets.length === 0 ? (
          <div style={{
            padding: '2rem 1rem', textAlign: 'center',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <CheckCircle2 size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
            <div style={{
              fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)', lineHeight: '1.5',
            }}>
              Nessun ticket {ticketFilter !== 'aperti' ? (ticketFilter === 'coach' ? 'aperto da coach' : 'aperto da studente') : 'aperto'}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--elevation-sm)',
          }}>
            {filteredTickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1.25rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.125rem',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)',
                      lineHeight: '1.5',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ticket.subject}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontFamily: 'var(--font-inter)', fontSize: '12px',
                    color: 'var(--muted-foreground)', lineHeight: '1.5',
                  }}>
                    <span>{ticket.id}</span>
                    <span>·</span>
                    <span>{ticket.source === 'coach' ? ticket.coachName : ticket.studentName}</span>
                    <span>·</span>
                    <span>{ticket.category}</span>
                  </div>
                </div>

                {/* Priority badge */}
                <StatusPill label={ticket.priority} variant={priorityPillVariant[ticket.priority]} />

                {/* Status badge */}
                <StatusPill label={statusLabels[ticket.status]} variant={statusPillVariant[ticket.status]} />

                {/* Source badge */}
                <StatusPill label={sourceLabels[ticket.source]} variant="neutral" />

                {/* Date */}
                <span style={{
                  fontFamily: 'var(--font-inter)', fontSize: '12px',
                  color: 'var(--muted-foreground)', lineHeight: '1.5',
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {new Date(ticket.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>

                <ChevronRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Sezioni (navigation links) ──────────────────────── */}
      
    </div>
  );
}