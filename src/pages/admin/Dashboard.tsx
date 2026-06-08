import * as React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  UserCheck,
  Briefcase,
  Plus,
  Users,
  FileText,
} from 'lucide-react';
import { useLavorazioni } from '@/app/data/LavorazioniContext';

type QuickActionVariant = 'pipeline' | 'lavorazione' | 'coach';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  variant: QuickActionVariant;
}

interface OperationalCard {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { data: lavorazioni, students, pipelines } = useLavorazioni();

  const quickActions: QuickAction[] = [
    {
      label: 'Nuova pipeline',
      description: 'Aggiungi lead e preventivi',
      icon: <Users size={18} />,
      to: '/pipelines',
      variant: 'pipeline',
    },
    {
      label: 'Nuova lavorazione',
      description: 'Monitora pagamenti e fatture',
      icon: <Plus size={18} />,
      to: '/lavorazioni?azione=nuova',
      variant: 'lavorazione',
    },
    {
      label: 'Nuovo coach',
      description: 'Aggiungi contatti e disponibilità',
      icon: <UserCheck size={18} />,
      to: '/coach?azione=nuovo',
      variant: 'coach',
    },
  ];

  const operationalCards: OperationalCard[] = useMemo(() => {
    const activeServices = lavorazioni.filter(s =>
      s.status === 'active' || s.status === 'paused' || s.status === 'pending_payment'
    );

    const studentsWithoutTimeline = students.filter(student => {
      const studentServices = lavorazioni.filter(s => s.student_id === student.id);
      const needsTimeline = studentServices.some(s => s.needs_timeline === true);
      const hasTimeline = studentServices.some(
        s => Array.isArray(s.coaching_timeline) && s.coaching_timeline.length > 0
      );
      return needsTimeline && !hasTimeline;
    }).length;

    const servicesWithoutCoach = activeServices.filter(s => !s.coach_name).length;

    const overdueInstallments = activeServices.reduce((count, service) => {
      const overdue = (service.installments || []).some(i => i.status === 'overdue');
      return overdue ? count + 1 : count;
    }, 0);

    const servicesMissingContract = activeServices.filter(
      s => !s.contract || s.contract.status !== 'signed'
    ).length;

    const pipelinesWithoutQuote = pipelines.filter(
      p => !p.quotes || p.quotes.length === 0
    ).length;

    return [
      {
        label: 'Studenti senza timeline',
        value: String(studentsWithoutTimeline),
        description: 'onboarding timeline ancora da completare',
        icon: <Users size={20} />,
      },
      {
        label: 'Lavorazioni senza coach',
        value: String(servicesWithoutCoach),
        description: 'servizi attivi senza assegnazione coach',
        icon: <Briefcase size={20} />,
      },
      {
        label: 'Rate scadute',
        value: String(overdueInstallments),
        description: 'servizi con almeno una rata overdue',
        icon: <FileText size={20} />,
      },
      {
        label: 'Contratti incompleti',
        value: String(servicesMissingContract),
        description: 'servizi attivi senza contratto firmato',
        icon: <UserCheck size={20} />,
      },
      {
        label: 'Preventivi da emettere',
        value: String(pipelinesWithoutQuote),
        description: 'pipeline senza alcun preventivo',
        icon: <Plus size={20} />,
      },
    ];
  }, [lavorazioni, students, pipelines]);

  return (
    <div className="dashboard-home" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* ─── Card operative (CRUD-first) ─────────────────────── */}
        <div className="stats-grid dashboard-operational-grid" style={{ marginBottom: '1.5rem' }}>
        {operationalCards.map(card => (
            <div key={card.label} className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{card.label}</span>
              <div className="stat-icon">{card.icon}</div>
            </div>
            <div className="stat-value">{card.value}</div>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              color: 'var(--muted-foreground)',
              marginTop: '0.25rem',
              lineHeight: '1.5',
            }}>
              {card.description}
            </div>
          </div>
        ))}
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
        <div className="quick-actions-grid">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className={`quick-action-card ${action.variant}`}
            >
              <div className="quick-action-icon">{action.icon}</div>
              <div className="quick-action-content">
                <div className="quick-action-title">{action.label}</div>
                <div className="quick-action-description">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Sezioni (navigation links) ──────────────────────── */}
      
    </div>
  );
}