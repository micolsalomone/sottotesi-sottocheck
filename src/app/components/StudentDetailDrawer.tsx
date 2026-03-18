import React, { useState } from 'react';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle,
  FileText, StickyNote, UserPlus, UserMinus,
  ChevronDown, ChevronUp, TicketIcon, Undo2,
  Upload, Download, ExternalLink, Eye, Pencil, X, Hash,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import type { StudentData, AdminNote, Installment, CoachingStep, Ticket } from '../pages/TimelinePage';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerCloseButton,
  DrawerBody,
  DrawerCollapsibleSection,
  DrawerInfoGrid,
  DrawerInfoGridItem,
  DrawerEmptyState,
  DRAWER_WIDTH_DEFAULT,
} from './DrawerPrimitives';

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
const CLOSED_REASON_LABELS: Record<string, string> = {
  concluso: 'Concluso',
  upgrade: 'Upgrade',
  annullato: 'Annullato',
  abbandono: 'Abbandono',
};

interface Props {
  student: StudentData;
  notes: AdminNote[];
  onAddNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onClose: () => void;
  onOpenNotes: () => void;
  onReassignCoach: () => void;
  onMarkComplete: () => void;
  onRemove: () => void;
  onMarkInstallmentPaid: (installmentId: string, paidDate: string) => void;
  onRevertInstallment: (installmentId: string) => void;
  onUpdateInstallmentAmount: (installmentId: string, newAmount: number) => void;
  onUploadContract: () => void;
  onDownloadContract: () => void;
}

export function StudentDetailDrawer({
  student, notes, onClose,
  onOpenNotes, onReassignCoach, onMarkComplete, onRemove,
  onMarkInstallmentPaid, onRevertInstallment,
  onUpdateInstallmentAmount, onUploadContract, onDownloadContract,
}: Props) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    payments: true,
    coach: false,
    timeline: false,
    tickets: false,
    riferimenti: false,
  });

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const pct = student.stepsTotal ? Math.round(((student.stepsCompleted ?? 0) / student.stepsTotal) * 100) : 0;

  const totalInstallments = student.installments?.length ?? 0;
  const paidCount = student.installments?.filter(i => i.status === 'paid').length ?? 0;
  const overdueCount = student.installments?.filter(i => i.status === 'overdue').length ?? 0;
  const pendingCount = student.installments?.filter(i => i.status === 'pending').length ?? 0;
  const totalAmount = student.installments?.reduce((sum, i) => sum + i.amount, 0) ?? 0;
  const paidAmount = student.installments?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) ?? 0;

  return (
    <>
      <DrawerOverlay onClose={onClose} />
      <DrawerShell width={DRAWER_WIDTH_DEFAULT}>

        {/* ─── Custom header (complex content) ─────────────── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-h4)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                {student.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '3px', background: STATUS_DOT_COLORS[student.status] }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: STATUS_DOT_COLORS[student.status], lineHeight: '18px' }}>
                  {STATUS_LABELS[student.status]}
                </span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
              {SERVICE_TYPE_LABELS[student.serviceType]}
              {student.university && ` · ${student.university}`}
              {` · ${student.degree}`}
            </div>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '18px', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>Coach: <span style={{ color: student.assignedCoachName ? 'var(--foreground)' : 'var(--chart-3)', fontWeight: 'var(--font-weight-medium)' }}>{student.assignedCoachName || 'Non assegnato'}</span></span>
              {student.planStartDate && <span>{student.planStartDate} → {student.planEndDate || '—'}</span>}
            </div>
          </div>
          <DrawerCloseButton onClose={onClose} />
        </div>

        <DrawerBody padding="0">

          {/* ─── Audit card (full-bleed) ──────────────────── */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <DrawerInfoGrid>
              <DrawerInfoGridItem label="Prezzo finale" value={student.finalPrice !== undefined ? `€ ${student.finalPrice.toLocaleString('it-IT')}` : '—'} />
              {student.discountAmount !== undefined && student.discountAmount > 0
                ? <DrawerInfoGridItem label="Sconto applicato" value={`€ ${student.discountAmount.toLocaleString('it-IT')}`} />
                : <DrawerInfoGridItem label="Sconto" value="—" />}
              <DrawerInfoGridItem label="Attivato il" value={student.activatedAt || '—'} />
              {student.closedAt
                ? <DrawerInfoGridItem label="Chiuso il" value={student.closedAt} />
                : <DrawerInfoGridItem label="Scadenza piano" value={student.planEndDate || '—'} />}
              {student.closedReason && <DrawerInfoGridItem label="Motivo chiusura" value={CLOSED_REASON_LABELS[student.closedReason]} />}
              <DrawerInfoGridItem label="Timeline" value={student.hasTimeline ? 'Presente' : 'Mancante'} valueColor={student.hasTimeline ? 'var(--primary)' : 'var(--chart-3)'} />
              {student.isUpgradeFrom && <DrawerInfoGridItem label="Upgrade da" value={student.isUpgradeFrom} />}
              {student.plagiarismPagesLimit !== undefined && <DrawerInfoGridItem label="Plagiarism" value={`${student.plagiarismPagesUsed ?? 0} / ${student.plagiarismPagesLimit} pagine`} />}
              <DrawerInfoGridItem label="ID servizio" value={student.id} />
            </DrawerInfoGrid>
          </div>

          {/* ─── Quick actions (full-bleed) ───────────────── */}
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <QuickActionBtn icon={<StickyNote size={14} />} label={`Note (${notes.length})`} onClick={onOpenNotes} color="var(--chart-5)" />
            <QuickActionBtn icon={<UserPlus size={14} />} label="Riassegna" onClick={onReassignCoach} color="var(--chart-2)" />
            <QuickActionBtn icon={<Eye size={14} />} label="Timeline coach" onClick={() => alert('Pagina timeline vista coach — in sviluppo')} color="var(--foreground)" />
            <QuickActionBtn icon={<CheckCircle2 size={14} />} label="Completa" onClick={onMarkComplete} color="var(--primary)" />
            <QuickActionBtn icon={<UserMinus size={14} />} label="Rimuovi" onClick={onRemove} color="var(--destructive-foreground)" />
          </div>

          {/* ─── Pagamenti e contratto ───────────────────── */}
          <DrawerCollapsibleSection
            title="Pagamenti e contratto"
            badge={overdueCount > 0 ? `${overdueCount} scadut${overdueCount > 1 ? 'e' : 'a'}` : pendingCount > 0 ? `${pendingCount} da verificare` : undefined}
            badgeColor={overdueCount > 0 ? 'var(--destructive-foreground)' : 'var(--chart-3)'}
            isOpen={expandedSections.payments}
            onToggle={() => toggleSection('payments')}
          >
            {/* Contract row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: student.contractStatus === 'signed' ? 'var(--muted)' : 'rgba(247, 144, 9, 0.06)', borderRadius: 'var(--radius)', marginBottom: '12px', border: student.contractStatus === 'signed' ? '1px solid transparent' : '1px solid rgba(247, 144, 9, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={14} style={{ color: student.contractStatus === 'signed' ? 'var(--primary)' : 'var(--chart-3)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', display: 'block' }}>Contratto</span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: student.contractStatus === 'signed' ? 'var(--primary)' : 'var(--chart-3)', lineHeight: '16px' }}>
                    {student.contractStatus === 'signed' ? 'Firmato' : 'In attesa di firma'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {student.contractFileUrl && (
                  <button onClick={onDownloadContract} title="Scarica contratto" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}>
                    <Download size={12} />
                  </button>
                )}
                <button onClick={onUploadContract} title={student.contractFileUrl ? 'Ricarica contratto' : 'Carica contratto'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--card)', color: student.contractFileUrl ? 'var(--foreground)' : 'var(--chart-3)', cursor: 'pointer', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}>
                  <Upload size={12} />
                </button>
              </div>
            </div>

            {/* Payment summary */}
            {totalInstallments > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '18px' }}>
                  {paidCount}/{totalInstallments} rate pagate
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: paidAmount >= totalAmount ? 'var(--primary)' : 'var(--foreground)', lineHeight: '18px' }}>
                  € {paidAmount.toLocaleString('it-IT')} / {totalAmount.toLocaleString('it-IT')}
                </span>
              </div>
            )}

            {/* Installments */}
            {student.installments && student.installments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {student.installments.map(inst => (
                  <EditableInstallmentRow
                    key={inst.id}
                    installment={inst}
                    onMarkPaid={(paidDate) => onMarkInstallmentPaid(inst.id, paidDate)}
                    onRevert={() => onRevertInstallment(inst.id)}
                    onUpdateAmount={(newAmount) => onUpdateInstallmentAmount(inst.id, newAmount)}
                  />
                ))}
              </div>
            ) : (
              <DrawerEmptyState>Nessuna rata registrata</DrawerEmptyState>
            )}

            {/* Status hints */}
            {student.status === 'pending_payment' && student.contractStatus === 'signed' && pendingCount > 0 && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'color-mix(in srgb, var(--primary) 6%, transparent)', borderRadius: 'var(--radius)', border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--primary)', lineHeight: '16px' }}>
                  Segna almeno una rata come pagata per attivare il servizio.
                </span>
              </div>
            )}
            {student.status === 'paused' && overdueCount > 0 && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--destructive)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--destructive-foreground)', lineHeight: '16px' }}>
                  Servizio in pausa per rate scadute. Segna le rate come pagate per riattivare.
                </span>
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Compenso coach ───────────────────────────── */}
          <DrawerCollapsibleSection
            title="Compenso coach"
            isOpen={expandedSections.coach}
            onToggle={() => toggleSection('coach')}
          >
            {student.assignedCoachName ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', lineHeight: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                      Compenso per questa lavorazione
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      € {(student.coachFee ?? 0).toLocaleString('it-IT')}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '18px' }}>
                    {student.assignedCoachName}
                  </div>
                </div>
                <a href="/coaching/compensi" onClick={e => { e.preventDefault(); alert('Pagina Compensi Coach — in sviluppo'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: 'var(--chart-2)', lineHeight: '18px', textDecoration: 'none', cursor: 'pointer', padding: '4px 0' }}>
                  <ExternalLink size={12} /> Vai a Compensi Coach
                </a>
              </div>
            ) : (
              <DrawerEmptyState>Nessun coach assegnato</DrawerEmptyState>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Progresso timeline ───────────────────────── */}
          <DrawerCollapsibleSection
            title="Progresso timeline"
            badge={student.stepsTotal ? `${student.stepsCompleted ?? 0}/${student.stepsTotal}` : undefined}
            badgeColor={pct === 100 ? 'var(--primary)' : 'var(--chart-2)'}
            isOpen={expandedSections.timeline}
            onToggle={() => toggleSection('timeline')}
          >
            {student.coachingSteps && student.coachingSteps.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: pct === 100 ? 'var(--primary)' : pct >= 50 ? 'var(--chart-2)' : 'var(--chart-3)' }} />
                </div>
                {student.coachingSteps.map(step => <StepRow key={step.id} step={step} />)}
              </div>
            ) : (
              <DrawerEmptyState>Nessuno step configurato</DrawerEmptyState>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Ticket ──────────────────────────────────── */}
          <DrawerCollapsibleSection
            title="Ticket"
            badge={student.openTicketCount ? `${student.openTicketCount} aperti` : undefined}
            badgeColor="var(--chart-4)"
            isOpen={expandedSections.tickets}
            onToggle={() => toggleSection('tickets')}
          >
            {student.tickets && student.tickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {student.tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}
              </div>
            ) : (
              <DrawerEmptyState>Nessun ticket</DrawerEmptyState>
            )}
          </DrawerCollapsibleSection>

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

              {/* Tipo servizio + Stato */}
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

          <div style={{ height: '24px' }} />
        </DrawerBody>
      </DrawerShell>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function QuickActionBtn({ icon, label, onClick, color }: {
  icon: React.ReactNode; label: string; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', background: 'var(--card)',
        fontFamily: 'var(--font-inter)', fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)', color,
        cursor: 'pointer', lineHeight: '18px', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
    >
      {icon} {label}
    </button>
  );
}

function EditableInstallmentRow({ installment, onMarkPaid, onRevert, onUpdateAmount }: {
  installment: Installment;
  onMarkPaid: (paidDate: string) => void;
  onRevert: () => void;
  onUpdateAmount: (newAmount: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState(String(installment.amount));
  const [dateValue, setDateValue] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const isPaid = installment.status === 'paid';
  const isOverdue = installment.status === 'overdue';
  const statusIcon = isPaid ? <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} /> : isOverdue ? <AlertTriangle size={14} style={{ color: 'var(--destructive-foreground)' }} /> : <Clock size={14} style={{ color: 'var(--chart-3)' }} />;
  const statusLabel = isPaid ? 'Pagata' : isOverdue ? 'Scaduta' : 'In attesa';
  const statusColor = isPaid ? 'var(--primary)' : isOverdue ? 'var(--destructive-foreground)' : 'var(--chart-3)';

  const handleConfirmPaid = () => {
    if (dateValue) {
      const d = new Date(dateValue);
      onMarkPaid(d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }));
      setIsEditing(false);
    }
  };

  const handleConfirmAmount = () => {
    const parsed = parseFloat(amountValue);
    if (!isNaN(parsed) && parsed > 0) { onUpdateAmount(parsed); setIsEditingAmount(false); }
  };

  const inputBase: React.CSSProperties = {
    fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)',
    color: 'var(--foreground)', border: '1px solid var(--primary)', borderRadius: '4px',
    background: 'var(--input-background)', outline: 'none', lineHeight: '1.5',
  };

  return (
    <div style={{ padding: '10px 12px', background: isOverdue ? 'rgba(180, 35, 24, 0.04)' : 'var(--muted)', borderRadius: 'var(--radius)', border: isOverdue ? '1px solid rgba(180, 35, 24, 0.15)' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusIcon}
          <div>
            {isEditingAmount ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>€</span>
                <input type="number" value={amountValue} onChange={e => setAmountValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleConfirmAmount(); if (e.key === 'Escape') { setAmountValue(String(installment.amount)); setIsEditingAmount(false); } }} autoFocus style={{ ...inputBase, width: '80px', height: '24px', padding: '0 6px' }} />
                <button onClick={handleConfirmAmount} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', padding: 0 }}><CheckCircle2 size={10} /></button>
                <button onClick={() => { setAmountValue(String(installment.amount)); setIsEditingAmount(false); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                  € {installment.amount.toLocaleString('it-IT')}
                </span>
                {!isPaid && (
                  <button onClick={() => setIsEditingAmount(true)} title="Modifica importo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}>
                    <Pencil size={10} />
                  </button>
                )}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '16px' }}>Scadenza: {installment.dueDate}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: statusColor, lineHeight: '16px' }}>{statusLabel}</span>
          {isPaid && installment.paidAt && <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '16px' }}>· {installment.paidAt}</span>}
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        {isPaid ? (
          <button onClick={onRevert} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--card)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', cursor: 'pointer', lineHeight: '16px' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--destructive-foreground)'; e.currentTarget.style.borderColor = 'var(--destructive-foreground)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <Undo2 size={10} /> Annulla pagamento
          </button>
        ) : isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '16px', marginBottom: '4px' }}>Data bonifico ricevuto</label>
              <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} style={{ width: '100%', height: '32px', padding: '0 8px', fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--input-background)', outline: 'none', lineHeight: '1.5' }} />
            </div>
            <button onClick={handleConfirmPaid} disabled={!dateValue} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: 'none', background: dateValue ? 'var(--primary)' : 'var(--muted)', color: dateValue ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', cursor: dateValue ? 'pointer' : 'not-allowed', lineHeight: '18px', marginTop: '16px', whiteSpace: 'nowrap' }}>Conferma</button>
            <button onClick={() => setIsEditing(false)} style={{ padding: '6px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', lineHeight: '18px', marginTop: '16px' }}>Annulla</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', background: 'color-mix(in srgb, var(--primary) 6%, transparent)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', cursor: 'pointer', lineHeight: '16px' }} onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 12%, transparent)')} onMouseLeave={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 6%, transparent)')}>
            <CreditCard size={10} /> Segna come pagata
          </button>
        )}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: CoachingStep }) {
  const iconMap: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} />,
    in_progress: <Clock size={14} style={{ color: 'var(--chart-2)' }} />,
    pending: <div style={{ width: '14px', height: '14px', borderRadius: '7px', border: '2px solid var(--border)', boxSizing: 'border-box' }} />,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
      <div style={{ flexShrink: 0 }}>{iconMap[step.status]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: step.status === 'in_progress' ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)', color: step.status === 'pending' ? 'var(--muted-foreground)' : 'var(--foreground)', lineHeight: '1.5' }}>
          {step.title}
        </span>
      </div>
      {step.completedAt && <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '16px', flexShrink: 0 }}>{step.completedAt}</span>}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const isOpen = ticket.status === 'open';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <TicketIcon size={14} style={{ color: isOpen ? 'var(--chart-4)' : 'var(--muted-foreground)', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '16px' }}>{ticket.createdAt} · {ticket.messageCount} messaggi</div>
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: isOpen ? 'var(--chart-4)' : 'var(--muted-foreground)', padding: '2px 8px', borderRadius: 'var(--radius-badge)', background: 'var(--card)', border: '1px solid var(--border)', lineHeight: '16px', flexShrink: 0 }}>
        {isOpen ? 'Aperto' : 'Chiuso'}
      </span>
    </div>
  );
}