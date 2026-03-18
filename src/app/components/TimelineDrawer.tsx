import React, { useState } from 'react';
import {
  CheckCircle2, Clock,
  StickyNote, UserPlus, UserMinus,
  TicketIcon, Eye, FolderOpen, ExternalLink,
  Mail, Phone, Copy, CheckCircle, Circle, Key, Send, Calendar, Hash,
  ListChecks, ShieldCheck, User,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { StudentData, AdminNote, CoachingStep, Ticket } from '../pages/TimelinePage';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerMetaRow,
  DrawerBody,
  DrawerCollapsibleSection,
  DrawerInfoGrid,
  DrawerInfoGridItem,
  DrawerEmptyState,
  DRAWER_WIDTH_DEFAULT,
} from './DrawerPrimitives';
import { useLavorazioni } from '../data/LavorazioniContext';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'In attesa di pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};
const STATUS_DOT_COLORS: Record<string, string> = {
  pending_payment: 'var(--chart-3)',
  active: 'var(--primary)',
  paused: 'var(--muted-foreground)',
  completed: 'var(--chart-2)',
  cancelled: 'var(--destructive-foreground)',
  expired: 'var(--muted-foreground)',
};
const SERVICE_TYPE_LABELS: Record<string, string> = {
  starter_pack: 'Starter Pack',
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
  sottocheck: 'SottoCheck',
};

interface Props {
  student: StudentData;
  notes: AdminNote[];
  onClose: () => void;
  onOpenNotes: () => void;
  onReassignCoach: () => void;
  onMarkComplete: () => void;
  onRemove: () => void;
  onOpenStudentDetail?: () => void;
}

export function TimelineDrawer({
  student, notes, onClose,
  onOpenNotes, onReassignCoach, onMarkComplete, onRemove,
  onOpenStudentDetail,
}: Props) {
  const navigate = useNavigate();
  const { students, updateStudent, updateService } = useLavorazioni();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timeline: true,
    tickets: false,
    contacts: false,
    serviceAccess: false,
    riferimenti: false,
  });

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const pct = student.stepsTotal ? Math.round(((student.stepsCompleted ?? 0) / student.stepsTotal) * 100) : 0;

  // Real student data from context
  const realStudent = students.find(s => s.id === student.studentId);
  const emails = realStudent?.contacts?.emails || [];
  const phones = realStudent?.contacts?.phones || [];
  const serviceAccessEmail = emails.find(e => e.purposes.includes('service_access'));

  // ── Invite state machine ─────────────────────────────────
  const [localInviteStatus, setLocalInviteStatus] = useState<'not_sent' | 'sent' | 'active'>(
    student.inviteStatus || 'not_sent'
  );
  const [localInviteEmail, setLocalInviteEmail] = useState<string>(
    student.inviteEmail || serviceAccessEmail?.email || emails[0]?.email || ''
  );

  const handleSendInvite = () => {
    if (!localInviteEmail) {
      toast.error('Seleziona un\'email prima di inviare l\'invito');
      return;
    }
    const serviceId = student.lavorazioneId || student.id;

    // Aggiorna servizio
    updateService(serviceId, (s) => ({
      ...s,
      coaching_access_enabled: true,
      invite_status: 'sent',
      invite_email: localInviteEmail,
      invite_sent_at: new Date().toISOString(),
    }));

    // Aggiorna email studente: radio — service_access solo su questa email
    if (realStudent) {
      updateStudent(realStudent.id, (s) => ({
        ...s,
        contacts: {
          ...s.contacts,
          emails: (s.contacts?.emails || []).map(e => ({
            ...e,
            purposes: (e.email === localInviteEmail
              ? [...new Set([...e.purposes, 'service_access'])]
              : e.purposes.filter(p => p !== 'service_access')
            ) as ('generic' | 'service_access')[],
          })),
        },
      }));
    }

    // Apri mailto simulato
    window.open(
      `mailto:${localInviteEmail}?subject=Accesso alla piattaforma - Sottotesi&body=Ciao! Clicca il link per accedere alla piattaforma e impostare la tua password.`,
      '_blank'
    );

    setLocalInviteStatus('sent');
    toast.success(`Invito inviato a ${localInviteEmail}`);
  };

  const handleSendCredentials = () => {
    const emailToUse = localInviteEmail || serviceAccessEmail?.email || realStudent?.email;
    if (!emailToUse) {
      toast.error('Nessuna email di accesso configurata');
      return;
    }
    window.open(
      `mailto:${emailToUse}?subject=Reset password - Sottotesi&body=Clicca qui per reimpostare la tua password e riottenere accesso alla piattaforma.`,
      '_blank'
    );
    toast.success('Link reset credenziali inviato');
  };

  // ── Status badge passed as `actions` to DrawerHeader ──────
  const statusBadge = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <span style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '3px',
        background: STATUS_DOT_COLORS[student.status],
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)',
        color: STATUS_DOT_COLORS[student.status],
        lineHeight: '1.5',
        whiteSpace: 'nowrap',
      }}>
        {STATUS_LABELS[student.status]}
      </span>
    </div>
  );

  // ── Subtitle: service type + university + degree ───────────
  const subtitleParts = [
    SERVICE_TYPE_LABELS[student.serviceType],
    student.university,
    student.degree,
  ].filter(Boolean);

  return (
    <>
      <DrawerOverlay onClose={onClose} />
      <DrawerShell width={DRAWER_WIDTH_DEFAULT}>

        {/* ─── Header ──────────────────────────────────────── */}
        <DrawerHeader
          icon={<Calendar size={20} />}
          title={student.name}
          subtitle={subtitleParts.join(' · ')}
          onClose={onClose}
          actions={statusBadge}
        />

        {/* ─── Meta row: coach + piano ─────────────────────── */}
        <DrawerMetaRow>
          Coach:{' '}
          <span style={{
            fontFamily: 'var(--font-inter)',
            color: student.assignedCoachName ? 'var(--foreground)' : 'var(--chart-3)',
            fontWeight: 'var(--font-weight-medium)',
          }}>
            {student.assignedCoachName || 'Non assegnato'}
          </span>
          {student.planStartDate && (
            <span style={{ marginLeft: '0.75rem' }}>
              {student.planStartDate} → {student.planEndDate || '—'}
            </span>
          )}
        </DrawerMetaRow>

        <DrawerMetaRow>
          Ultimo aggiornamento: {student.updated_by || '—'} —{' '}
          {student.updated_at
            ? new Date(student.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : student.created_at
              ? new Date(student.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
        </DrawerMetaRow>

        <DrawerBody padding="0">

          {/* ─── Audit card (full-bleed) ──────────────────── */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <DrawerInfoGrid>
              <DrawerInfoGridItem label="Attivato il" value={student.activatedAt || '—'} />
              <DrawerInfoGridItem label="Scadenza piano" value={student.planEndDate || '—'} />
              <DrawerInfoGridItem
                label="Progresso"
                value={student.stepsTotal ? `${student.stepsCompleted ?? 0}/${student.stepsTotal} step (${pct}%)` : '—'}
                valueColor={pct === 100 ? 'var(--primary)' : undefined}
              />
              <DrawerInfoGridItem
                label="Ticket aperti"
                value={String(student.openTicketCount ?? 0)}
                valueColor={student.openTicketCount ? 'var(--chart-4)' : undefined}
              />
            </DrawerInfoGrid>
          </div>

          {/* ─── Quick actions (full-bleed) ───────────────── */}
          <div style={{
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <QuickActionBtn icon={<StickyNote size={14} />} label={`Note (${notes.length})`} onClick={onOpenNotes} color="var(--chart-5)" />
            <QuickActionBtn icon={<UserPlus size={14} />} label="Riassegna" onClick={onReassignCoach} color="var(--chart-2)" />
            <QuickActionBtn icon={<CheckCircle2 size={14} />} label="Completa" onClick={onMarkComplete} color="var(--primary)" />
            <QuickActionBtn icon={<UserMinus size={14} />} label="Rimuovi" onClick={onRemove} color="var(--destructive-foreground)" />
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 }} />
            <QuickActionBtn
              icon={<Eye size={13} />}
              label="Vista coach"
              onClick={() => alert('Vista timeline coach — pagina in sviluppo')}
              color="var(--muted-foreground)"
              small
            />
            <QuickActionBtn
              icon={<FolderOpen size={13} />}
              label="Archivio docs"
              onClick={() => alert('Archivio documenti timeline — pagina in sviluppo')}
              color="var(--muted-foreground)"
              small
            />
          </div>

          {/* ─── Progresso timeline ───────────────────────── */}
          <DrawerCollapsibleSection
            icon={ListChecks}
            title="Progresso timeline"
            badge={student.stepsTotal ? `${student.stepsCompleted ?? 0}/${student.stepsTotal}` : undefined}
            badgeColor={pct === 100 ? 'var(--primary)' : 'var(--chart-2)'}
            isOpen={expandedSections.timeline}
            onToggle={() => toggleSection('timeline')}
          >
            {student.coachingSteps && student.coachingSteps.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--border)',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: pct === 100 ? 'var(--primary)' : pct >= 50 ? 'var(--chart-2)' : 'var(--chart-3)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                {student.coachingSteps.map(step => (
                  <StepRow key={step.id} step={step} />
                ))}
              </div>
            ) : (
              <DrawerEmptyState>Nessuno step configurato</DrawerEmptyState>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Ticket ───────────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={TicketIcon}
            title="Ticket"
            badge={student.openTicketCount ? `${student.openTicketCount} aperti` : undefined}
            badgeColor="var(--chart-4)"
            isOpen={expandedSections.tickets}
            onToggle={() => toggleSection('tickets')}
          >
            {student.tickets && student.tickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {student.tickets.map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <DrawerEmptyState>Nessun ticket</DrawerEmptyState>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Contatti studente ────────────────────────── */}
          {realStudent && (emails.length > 0 || phones.length > 0) && (
            <DrawerCollapsibleSection
              icon={Phone}
              title="Contatti studente"
              badge={`${emails.length} email, ${phones.length} tel`}
              isOpen={expandedSections.contacts}
              onToggle={() => toggleSection('contacts')}
            >
              {/* Emails */}
              {emails.length > 0 && (
                <div style={{ marginBottom: phones.length > 0 ? '1rem' : 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                    lineHeight: '1.5',
                  }}>
                    Email
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {emails.map((email, idx) => (
                      <div key={idx} style={{
                        padding: '0.625rem 0.75rem',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}>
                            {email.email}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <a
                              href={`mailto:${email.email}`}
                              title="Invia email"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px', borderRadius: 'var(--radius)',
                                border: 'none', background: 'none', color: 'var(--muted-foreground)',
                                cursor: 'pointer', textDecoration: 'none',
                              }}
                            >
                              <Mail size={13} />
                            </a>
                            <button
                              onClick={() => { navigator.clipboard.writeText(email.email); toast.success('Email copiata'); }}
                              title="Copia email"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px', borderRadius: 'var(--radius)',
                                border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer',
                              }}
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {email.is_primary && (
                            <span style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--primary)',
                              lineHeight: '1.4',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius)',
                              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                            }}>
                              Principale
                            </span>
                          )}
                          {email.purposes.map(p => (
                            <span key={p} style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--muted-foreground)',
                              lineHeight: '1.4',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius)',
                              background: 'var(--background)',
                            }}>
                              {p === 'generic' ? 'Generico' : 'Accesso servizio'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phones */}
              {phones.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                    lineHeight: '1.5',
                  }}>
                    Telefoni
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {phones.map((phone, idx) => (
                      <div key={idx} style={{
                        padding: '0.625rem 0.75rem',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            {phone.phone}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <a
                              href={`tel:${phone.phone.replace(/\s/g, '')}`}
                              title="Chiama"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px', borderRadius: 'var(--radius)',
                                border: 'none', background: 'none', color: 'var(--muted-foreground)',
                                cursor: 'pointer', textDecoration: 'none',
                              }}
                            >
                              <Phone size={13} />
                            </a>
                            <button
                              onClick={() => { navigator.clipboard.writeText(phone.phone); toast.success('Numero copiato'); }}
                              title="Copia numero"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px', borderRadius: 'var(--radius)',
                                border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer',
                              }}
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {phone.is_primary && (
                            <span style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--primary)',
                              lineHeight: '1.4',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius)',
                              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                            }}>
                              Principale
                            </span>
                          )}
                          {phone.purposes.map(p => (
                            <span key={p} style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--muted-foreground)',
                              lineHeight: '1.4',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius)',
                              background: 'var(--background)',
                            }}>
                              {p === 'communications' ? 'Comunicazioni' : 'Coaching'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DrawerCollapsibleSection>
          )}

          {/* ─── Accesso al servizio ──────────────────────── */}
          {realStudent && (() => {
            const statusConfig = {
              not_sent: { label: 'Non inviato', color: 'var(--muted-foreground)', icon: <Circle size={18} />, bg: 'var(--muted)', border: 'var(--border)' },
              sent:     { label: 'In attesa',   color: 'var(--chart-3)',          icon: <Clock size={18} />,  bg: 'color-mix(in srgb, var(--chart-3) 8%, transparent)', border: 'color-mix(in srgb, var(--chart-3) 40%, transparent)' },
              active:   { label: 'Attivo',      color: 'var(--primary)',          icon: <CheckCircle size={18} />, bg: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: 'color-mix(in srgb, var(--primary) 40%, transparent)' },
            }[localInviteStatus];

            return (
              <DrawerCollapsibleSection
                icon={ShieldCheck}
                title="Accesso al servizio"
                badge={statusConfig.label}
                badgeColor={statusConfig.color}
                isOpen={expandedSections.serviceAccess}
                onToggle={() => toggleSection('serviceAccess')}
              >
                {/* ── Status card ── */}
                <div style={{
                  padding: '0.875rem 1rem',
                  backgroundColor: statusConfig.bg,
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${statusConfig.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.875rem',
                }}>
                  <span style={{ color: statusConfig.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {statusConfig.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: statusConfig.color,
                      lineHeight: '1.5',
                    }}>
                      {localInviteStatus === 'not_sent' && 'Invito non inviato'}
                      {localInviteStatus === 'sent' && 'In attesa di attivazione'}
                      {localInviteStatus === 'active' && 'Accesso attivo'}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                      marginTop: '0.125rem',
                    }}>
                      {localInviteStatus === 'not_sent' && 'Lo studente non ha ancora ricevuto il link di accesso'}
                      {localInviteStatus === 'sent' && 'Invito inviato — lo studente non ha ancora effettuato il primo accesso'}
                      {localInviteStatus === 'active' && 'Lo studente ha effettuato il primo accesso alla piattaforma'}
                    </div>
                  </div>
                </div>

                {/* ── Email di accesso ── */}
                <div style={{ marginBottom: '0.875rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem',
                    lineHeight: '1.5',
                  }}>
                    Email di accesso
                  </div>

                  {emails.length === 0 ? (
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                    }}>
                      Nessuna email disponibile — aggiungila nel profilo studente
                    </div>
                  ) : emails.length === 1 ? (
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                      padding: '0.5rem 0.625rem',
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}>
                      {emails[0].email}
                    </div>
                  ) : (
                    <select
                      value={localInviteEmail}
                      onChange={e => setLocalInviteEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 2rem 0.5rem 0.625rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        backgroundColor: 'var(--input-background)',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23717680' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        lineHeight: '1.5',
                        outline: 'none',
                      }}
                    >
                      {emails.map(e => (
                        <option key={e.email} value={e.email}>
                          {e.email}{e.is_primary ? ' (principale)' : ''}{e.purposes.includes('service_access') ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* ── Azioni ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Invia / Reinvia invito — non mostrato se già attivo */}
                  {localInviteStatus !== 'active' && (
                    <button
                      type="button"
                      onClick={handleSendInvite}
                      className="btn btn-primary"
                      disabled={!localInviteEmail}
                      style={{ justifyContent: 'center', opacity: localInviteEmail ? 1 : 0.5 }}
                    >
                      <Send size={15} />
                      {localInviteStatus === 'sent' ? 'Reinvia invito' : 'Invia invito'}
                    </button>
                  )}

                  {/* Reset credenziali — solo se invito già inviato o attivo */}
                  {localInviteStatus !== 'not_sent' && (
                    <button
                      type="button"
                      onClick={handleSendCredentials}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'center' }}
                    >
                      <Key size={15} />
                      Invia reset credenziali
                    </button>
                  )}

                  {/* Segna come attivo (debug / override manuale) — solo se sent */}
                  {localInviteStatus === 'sent' && (
                    <button
                      type="button"
                      onClick={() => {
                        const serviceId = student.lavorazioneId || student.id;
                        updateService(serviceId, (s) => ({ ...s, invite_status: 'active' }));
                        setLocalInviteStatus('active');
                        toast.success('Accesso confermato come attivo');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        padding: '0.25rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        alignSelf: 'center',
                        lineHeight: '1.5',
                      }}
                    >
                      <CheckCircle size={11} />
                      Segna come attivo manualmente
                    </button>
                  )}
                </div>
              </DrawerCollapsibleSection>
            );
          })()}

          {/* ─── Audit e Riferimenti ─────────────────────── */}
          <DrawerCollapsibleSection
            icon={Hash}
            title="Audit e Riferimenti"
            isOpen={expandedSections.riferimenti}
            onToggle={() => toggleSection('riferimenti')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ID servizio + ID studente */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>ID servizio</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {student.id}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>ID studente</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {student.studentId || '—'}
                  </span>
                </div>
              </div>

              {/* Lavorazione collegata */}
              {student.lavorazioneId && (
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Lavorazione collegata</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0.625rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {student.lavorazioneId}
                    </span>
                    <button
                      onClick={() => { onClose(); navigate(`/lavorazioni?highlight=${student.lavorazioneId}`); }}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '11px', flexShrink: 0 }}
                    >
                      Apri <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Profilo studente */}
              {student.studentId && (
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Profilo studente</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0.625rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <User size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                      {student.name}
                    </span>
                    <button
                      onClick={() => onOpenStudentDetail ? onOpenStudentDetail() : navigate(`/studenti?id=${student.studentId}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '11px', flexShrink: 0 }}
                    >
                      Apri <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Link rapidi */}
              <div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.375rem' }}>Link rapidi</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <AuditLink
                    label="Dettaglio servizio e pagamenti"
                    onClick={() => { onClose(); navigate(`/lavorazioni?highlight=${student.lavorazioneId || student.id}`); }}
                  />
                  {student.coachFee !== undefined && (
                    <AuditLink
                      label="Compensi coach"
                      onClick={() => alert('Pagina Compensi Coach — in sviluppo')}
                    />
                  )}
                </div>
              </div>

              {/* Tipo servizio + Attivato il */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Tipo servizio</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {SERVICE_TYPE_LABELS[student.serviceType] ?? student.serviceType}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Attivato il</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {student.activatedAt || '—'}
                  </span>
                </div>
              </div>

              {/* Coach + Coach fee */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Coach assegnato</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: student.assignedCoachName ? 'var(--foreground)' : 'var(--muted-foreground)', fontStyle: student.assignedCoachName ? 'normal' : 'italic', lineHeight: '1.5' }}>
                    {student.assignedCoachName || '—'}
                  </span>
                </div>
                {student.coachFee !== undefined && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Compenso coach</div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      € {student.coachFee.toLocaleString('it-IT')}
                    </span>
                  </div>
                )}
              </div>

              {/* Creato + Aggiornato */}
              {(student.created_at || student.updated_at) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {student.created_at && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Creato il</div>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {new Date(student.created_at).toLocaleDateString('it-IT')}
                        {student.created_by && <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>da {student.created_by}</div>}
                      </span>
                    </div>
                  )}
                  {student.updated_at && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Ultimo aggiornamento</div>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {new Date(student.updated_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {student.updated_by && <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>da {student.updated_by}</div>}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </DrawerCollapsibleSection>

          <div style={{ height: '1.5rem' }} />
        </DrawerBody>
      </DrawerShell>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function QuickActionBtn({ icon, label, onClick, color, small }: {
  icon: React.ReactNode; label: string; onClick: () => void; color: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: small ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        fontFamily: 'var(--font-inter)',
        fontSize: small ? '11px' : '12px',
        fontWeight: 'var(--font-weight-medium)',
        color,
        cursor: 'pointer',
        lineHeight: '1.5',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
    >
      {icon}
      {label}
    </button>
  );
}

function AuditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--chart-2)',
        lineHeight: '1.5',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.25rem 0',
        textDecoration: 'none',
        alignSelf: 'flex-start',
      }}
      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
    >
      <ExternalLink size={13} />
      {label}
    </button>
  );
}

function StepRow({ step }: { step: CoachingStep }) {
  const iconMap: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />,
    in_progress: <Clock size={14} style={{ color: 'var(--chart-2)' }} />,
    pending: (
      <div style={{
        width: '14px',
        height: '14px',
        borderRadius: '7px',
        border: '2px solid var(--border)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }} />
    ),
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.375rem 0',
    }}>
      <div style={{ flexShrink: 0 }}>{iconMap[step.status]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: step.status === 'in_progress' ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
          color: step.status === 'pending' ? 'var(--muted-foreground)' : 'var(--foreground)',
          lineHeight: '1.5',
        }}>
          {step.title}
        </span>
      </div>
      {step.completedAt && (
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
          flexShrink: 0,
        }}>
          {step.completedAt}
        </span>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const isOpen = ticket.status === 'open';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.625rem 0.75rem',
      background: 'var(--muted)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        <TicketIcon size={14} style={{ color: isOpen ? 'var(--chart-4)' : 'var(--muted-foreground)', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            lineHeight: '1.5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {ticket.subject}
          </div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
          }}>
            {ticket.createdAt} · {ticket.messageCount} messaggi
          </div>
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-medium)',
        color: isOpen ? 'var(--chart-4)' : 'var(--muted-foreground)',
        lineHeight: '1.5',
        flexShrink: 0,
        marginLeft: '0.5rem',
      }}>
        {isOpen ? 'Aperto' : 'Chiuso'}
      </span>
    </div>
  );
}
