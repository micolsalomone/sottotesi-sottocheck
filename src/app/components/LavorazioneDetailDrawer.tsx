import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  FileText, User, Briefcase, CreditCard,
  Calendar, AlertTriangle, Check, Pencil, ExternalLink,
  Plus, Trash2, Settings, Hash, GraduationCap,
  Phone, Mail, Copy, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import {
  type StudentService,
  type Student,
  type Pipeline,
  type ServiceStatus,
  type ContractStatus,
  type InstallmentStatus,
  type PayoutStatus,
  type CoachPayout,
  REFERENTI_SOTTOTESI,
  ADMIN_PROFILES,
  SERVICE_CATALOG,
} from '../data/LavorazioniContext';
import { SmartCoachSelect } from './SmartCoachSelect';
import { ConfirmDialog } from './ConfirmDialog';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerCollapsibleSection,
  DrawerAlertBanner,
  DrawerMetaRow,
  DrawerAcademicSnippet,
  DrawerAddButton,
  DRAWER_WIDTH_WIDE,
  drawerInputStyle,
  drawerLabelStyle,
  drawerReadonlyValueStyle,
  drawerFieldGroupStyle,
} from './DrawerPrimitives';

// ─── Types ───────────────────────────────────────────────────
interface LavorazioneDetailDrawerProps {
  service: StudentService;
  isOpen: boolean;
  onClose: () => void;
  onUpdateService: (id: string, updater: (s: StudentService) => StudentService) => void;
  currentAdmin: string;
  taxPercent: number;
  openedAt: number;
  students: Student[];
  pipelines?: Pipeline[];
  availableAree: string[];
  onEditStudent?: (studentId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

const PAYOUT_STATUS_OPTIONS: { value: PayoutStatus; label: string }[] = [
  { value: 'pending_invoice', label: 'Attesa notula' },
  { value: 'waiting_due_date', label: 'In scadenza' },
  { value: 'ready_to_pay', label: 'Da pagare' },
  { value: 'paid', label: 'Pagato' },
  { value: 'disputed', label: 'Contestato' },
];

const getPayoutStatusColor = (status?: PayoutStatus): string => {
  switch (status) {
    case 'paid': return 'var(--primary)';
    case 'ready_to_pay': return 'var(--chart-3)';
    case 'waiting_due_date': return 'var(--chart-2)';
    case 'pending_invoice': return 'var(--muted-foreground)';
    case 'disputed': return 'var(--destructive-foreground)';
    default: return 'var(--muted-foreground)';
  }
};

const getPayoutStatusLabel = (status?: PayoutStatus): string => {
  switch (status) {
    case 'paid': return 'Pagato';
    case 'ready_to_pay': return 'Da pagare';
    case 'waiting_due_date': return 'In scadenza';
    case 'pending_invoice': return 'Attesa notula';
    case 'disputed': return 'Contestato';
    default: return 'N/D';
  }
};

const getQuoteLifecycleLabel = (quote: { status: 'draft' | 'sent' | 'accepted' | 'paid'; expires_at?: string }): 'Bozza' | 'Inviato' | 'Accettato' | 'Pagato' | 'In scadenza' | 'Scaduto' => {
  if (quote.status === 'paid') return 'Pagato';
  if (quote.status === 'accepted') return 'Accettato';
  if (quote.status === 'draft') return 'Bozza';
  if (!quote.expires_at) return 'Inviato';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(today.getDate() + 5);
  const expiryDate = new Date(quote.expires_at);

  if (!Number.isNaN(expiryDate.getTime()) && today >= expiryDate) return 'Scaduto';
  if (!Number.isNaN(expiryDate.getTime()) && expiryDate <= fiveDaysFromNow) return 'In scadenza';
  return 'Inviato';
};

const formatDateIT = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTimestamp = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const computeScad40gg = (notulaDate?: string): { date: string; daysLeft: number } | null => {
  if (!notulaDate) return null;
  const d = new Date(notulaDate);
  d.setDate(d.getDate() + 40);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { date: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), daysLeft };
};

// ─── Component ───────────────────────────────────────────────
export function LavorazioneDetailDrawer({
  service,
  isOpen,
  onClose,
  onUpdateService,
  currentAdmin,
  taxPercent,
  openedAt,
  students,
  pipelines = [],
  availableAree,
  onEditStudent,
}: LavorazioneDetailDrawerProps) {
  const navigate = useNavigate();

  const [isStale, setIsStale] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmTimelineToggle, setConfirmTimelineToggle] = useState(false);
  const lastKnownUpdate = useRef(service.updated_at || '');

  const payoutNeedsAttention = service.coach_payout?.status === 'disputed'
    || service.coach_payout?.status === 'ready_to_pay';

  const [sections, setSections] = useState({
    operativi: true,
    contratto: false,
    pagamenti: true,
    payout: payoutNeedsAttention,
    preventivi: false,
    riferimenti: false,
  });

  const toggleSection = (key: keyof typeof sections) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (service.updated_at && service.updated_at !== lastKnownUpdate.current) {
      const updateTime = new Date(service.updated_at).getTime();
      if (updateTime > openedAt && service.updated_by !== currentAdmin) {
        setIsStale(true);
      }
      lastKnownUpdate.current = service.updated_at || '';
    }
  }, [service.updated_at, service.updated_by, openedAt, currentAdmin]);

  const handleRefresh = () => {
    setIsStale(false);
    lastKnownUpdate.current = service.updated_at || '';
  };

  const doUpdate = (updater: (s: StudentService) => StudentService, msg: string) => {
    onUpdateService(service.id, s => ({
      ...updater(s),
      updated_by: currentAdmin,
      updated_at: new Date().toISOString(),
    }));
    toast.success(msg);
  };

  const totalLordo = service.installments.reduce((sum, i) => sum + i.amount, 0);
  const quotedGrossFallback = service.quoted_gross_amount || 0;
  const displayedLordo = totalLordo > 0 ? totalLordo : quotedGrossFallback;
  const totalNetto = displayedLordo * (1 - taxPercent / 100);
  const paidTotal = service.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = service.installments.filter(i => i.status === 'overdue').length;
  const paidCount = service.installments.filter(i => i.status === 'paid').length;
  const scad40gg = computeScad40gg(service.coach_payout?.notula_issue_date);

  const student = (students || []).find(s => s.id === service.student_id);
  const academicRecord = student?.academic_records?.find(r => r.id === service.academic_record_id)
    || student?.academic_records?.find(r => r.is_current)
    || student?.academic_records?.[0];

  const pipeline = (pipelines || []).find(p => p.id === service.pipeline_id || p.student_id === service.student_id);
  const quote = pipeline?.quotes?.find(q => q.id === service.quote_id);

  if (!isOpen) return null;

  // ─── Header actions: status select ───────────────────────
  const statusSelect = (
    <select
      value={service.status}
      onChange={(e) => {
        const newStatus = e.target.value as ServiceStatus;
        doUpdate(s => {
          const updated: Partial<StudentService> = { status: newStatus };
          if (newStatus === 'paused' && !s.pause_start_date) updated.pause_start_date = new Date().toISOString().split('T')[0];
          if (newStatus !== 'paused' && s.status === 'paused') updated.pause_end_date = s.pause_end_date || new Date().toISOString().split('T')[0];
          return { ...s, ...updated };
        }, `Stato lavorazione → ${SERVICE_STATUS_LABELS[newStatus]}`);
      }}
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-inter)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-medium)',
        backgroundColor: 'var(--input-background)',
        color: 'var(--foreground)',
        cursor: 'pointer',
        outline: 'none',
        flexShrink: 0,
      }}
    >
      {Object.entries(SERVICE_STATUS_LABELS).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell width={DRAWER_WIDTH_WIDE}>

        <DrawerHeader
          icon={<FileText size={20} />}
          title={service.id}
          subtitle={`${service.service_name} — ${service.service_category}`}
          onClose={onClose}
          actions={statusSelect}
        />

        {/* ─── Stale warning / last update ─────────────────── */}
        {isStale ? (
          <DrawerAlertBanner onAction={handleRefresh} actionLabel="Aggiorna">
            <AlertTriangle size={14} />
            Record modificato da {service.updated_by} il {formatDateTimestamp(service.updated_at)}
          </DrawerAlertBanner>
        ) : (
          <DrawerMetaRow>
            Ultimo aggiornamento: {service.updated_by || '—'} — {formatDateTimestamp(service.updated_at)}
          </DrawerMetaRow>
        )}

        {/* ─── Pausa date strip ────────────────────────────── */}
        {service.status === 'paused' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            backgroundColor: 'color-mix(in srgb, var(--warning) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)',
            padding: '0.625rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.25rem', display: 'block', lineHeight: '1.5' }}>Inizio pausa</label>
              <input type="date" value={service.pause_start_date || ''} onChange={(e) => doUpdate(s => ({ ...s, pause_start_date: e.target.value || undefined }), e.target.value ? `Inizio pausa: ${e.target.value}` : 'Inizio pausa rimosso')} style={drawerInputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.25rem', display: 'block', lineHeight: '1.5' }}>Fine pausa</label>
              <input type="date" value={service.pause_end_date || ''} onChange={(e) => doUpdate(s => ({ ...s, pause_end_date: e.target.value || undefined }), e.target.value ? `Fine pausa: ${e.target.value}` : 'Fine pausa rimossa')} style={drawerInputStyle} />
            </div>
          </div>
        )}

        <DrawerBody padding="0">

          {/* ─── Student compact card ─────────────────────── */}
          <div style={{ padding: '1rem 1.5rem 0' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--muted)',
              marginBottom: '0.5rem',
            }}>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}><User size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {service.student_name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                    {service.student_id}
                  </span>
                </div>

                {/* Academic record */}
                {academicRecord && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <DrawerAcademicSnippet record={academicRecord} />
                  </div>
                )}

                {/* Contacts */}
                {student && (student.phone || student.email) && (
                  <div style={{ marginTop: '0.375rem', paddingTop: '0.375rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                      Contatti studente
                    </span>
                    {student.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{student.phone}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                          <a href={`tel:${student.phone.replace(/\s/g, '')}`} title="Chiama" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', textDecoration: 'none' }}><Phone size={13} /></a>
                          <button onClick={() => { navigator.clipboard.writeText(student.phone); toast.success('Numero copiato'); }} title="Copia numero" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}><Copy size={13} /></button>
                        </div>
                      </div>
                    )}
                    {student.email && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{student.email}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flexShrink: 0 }}>
                          <a href={`mailto:${student.email}`} title="Invia email" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', textDecoration: 'none' }}><Mail size={13} /></a>
                          <button onClick={() => { navigator.clipboard.writeText(student.email); toast.success('Email copiata'); }} title="Copia email" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}><Copy size={13} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {onEditStudent && (
                  <button onClick={() => onEditStudent(service.student_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem', padding: 0, border: 'none', background: 'none', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', cursor: 'pointer', lineHeight: '1.5' }}>
                    <Pencil size={10} /> Modifica profilo studente <ExternalLink size={10} style={{ opacity: 0.6 }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══ 1. DETTAGLI OPERATIVI ════════════════════════ */}
          <DrawerCollapsibleSection
            icon={Settings}
            title="Dettagli operativi"
            isOpen={sections.operativi}
            onToggle={() => toggleSection('operativi')}
          >
            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Servizio</label>
              <select value={service.service_id || ''} onChange={(e) => {
                const svc = SERVICE_CATALOG.find(s => s.id === e.target.value);
                if (svc) { doUpdate(s => ({ ...s, service_id: svc.id, service_name: svc.name, service_category: svc.category }), `Servizio: ${svc.name}`); }
                else { doUpdate(s => ({ ...s, service_id: '', service_name: 'Da definire', service_category: 'Coaching' }), 'Servizio rimosso'); }
              }} style={drawerInputStyle}>
                <option value="">Da definire</option>
                {SERVICE_CATALOG.filter(s => s.category !== 'Check plagio/AI').map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.category}</option>
                ))}
              </select>
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Note servizio</label>
              <textarea value={service.service_notes || ''} onChange={(e) => doUpdate(s => ({ ...s, service_notes: e.target.value || undefined }), 'Note servizio aggiornate')} placeholder="Es. richiesta speciale, dettagli aggiuntivi..." rows={2} style={{ ...drawerInputStyle, resize: 'vertical', minHeight: '3rem' }} />
            </div>

            <div style={{ ...drawerFieldGroupStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div>
                <label style={drawerLabelStyle}>Richiede timeline coaching</label>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5', opacity: 0.7 }}>
                  {service.needs_timeline !== false ? 'La timeline è prevista' : 'Nessuna timeline prevista'}
                </span>
              </div>
              <button type="button" onClick={() => setConfirmTimelineToggle(true)} style={{ position: 'relative', width: '36px', height: '20px', borderRadius: '10px', border: 'none', background: service.needs_timeline !== false ? 'var(--primary)' : 'var(--border)', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: '2px', left: service.needs_timeline !== false ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
              </button>
            </div>

            <div style={{ ...drawerFieldGroupStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={drawerLabelStyle}>Data inizio</label>
                <input type="date" value={service.plan_start_date || service.start_date || ''} onChange={(e) => doUpdate(s => ({ ...s, plan_start_date: e.target.value || undefined, start_date: e.target.value || s.start_date }), e.target.value ? `Data inizio: ${e.target.value}` : 'Data inizio rimossa')} style={drawerInputStyle} />
              </div>
              <div>
                <label style={drawerLabelStyle}>Data fine (scadenza piano)</label>
                <input type="date" value={service.plan_end_date || service.end_date || ''} onChange={(e) => doUpdate(s => ({ ...s, plan_end_date: e.target.value || undefined }), e.target.value ? `Data fine: ${e.target.value}` : 'Data fine rimossa')} style={drawerInputStyle} />
              </div>
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Prezzo totale (Lordo)</label>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '1.5', padding: '0.375rem 0' }}>
                {service.installments && service.installments.length > 0
                  ? `€${service.installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('it-IT')}`
                  : <span style={{ color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-regular)' }}>Da definire</span>}
                {service.installments && service.installments.length > 0 && (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                    ({service.installments.length} {service.installments.length === 1 ? 'rata' : 'rate'})
                  </span>
                )}
              </div>
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Area tematica</label>
              <select value={service.area_tematica || ''} onChange={(e) => doUpdate(s => ({ ...s, area_tematica: e.target.value || undefined }), e.target.value ? `Area tematica: ${e.target.value}` : 'Area tematica rimossa')} style={drawerInputStyle}>
                <option value="">Seleziona...</option>
                {(availableAree || []).map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Coach</label>
              <SmartCoachSelect value={service.coach_name || ''} onChange={(val) => doUpdate(s => ({ ...s, coach_name: val || undefined }), val ? `Coach assegnato: ${val}` : 'Coach rimosso')} areaTematica={service.area_tematica} style={drawerInputStyle} />
              {service.area_tematica && !service.coach_name && (
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--chart-3)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                  Seleziona un coach — i consigliati per l'area sono in evidenza
                </div>
              )}
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Compenso coach (€)</label>
              <EditableField value={service.coach_fee !== undefined ? `${service.coach_fee}` : ''} placeholder="Da definire" displayPrefix="€" type="number" onSave={(val) => { const num = Number(val); if (!isNaN(num) && num >= 0) doUpdate(s => ({ ...s, coach_fee: num }), 'Compenso coach aggiornato'); }} />
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Referente Sottotesi</label>
              <select value={service.referente || ''} onChange={(e) => doUpdate(s => ({ ...s, referente: e.target.value || undefined }), e.target.value ? `Referente: ${e.target.value}` : 'Referente rimosso')} style={drawerInputStyle}>
                <option value="">Seleziona...</option>
                {REFERENTI_SOTTOTESI.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              {service.referente && (() => {
                const profile = ADMIN_PROFILES.find(a => a.name === service.referente);
                return profile ? (
                  <div onClick={() => navigate('/impostazioni/profili')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--primary)', lineHeight: '1.5' }}>
                    {profile.email} <ExternalLink size={10} style={{ opacity: 0.6 }} />
                  </div>
                ) : null;
              })()}
            </div>
          </DrawerCollapsibleSection>

          {/* ═══ 2. CONTRATTO ══════════════════════════════════ */}
          <DrawerCollapsibleSection
            icon={FileText}
            title="Contratto"
            badge={service.contract?.status === 'signed' ? 'Firmato' : service.contract?.status === 'draft' ? 'Bozza' : service.contract?.status === 'cancelled' ? 'Annullato' : undefined}
            isOpen={sections.contratto}
            onToggle={() => toggleSection('contratto')}
          >
            {service.service_category === 'Check plagio/AI' ? (
              <span style={{ ...drawerReadonlyValueStyle, color: 'var(--muted-foreground)' }}>N/A — Check plagio/AI</span>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Stato</label>
                  <select value={service.contract?.status || ''} onChange={(e) => {
                    const newStatus = e.target.value as ContractStatus;
                    doUpdate(s => {
                      const now = new Date().toISOString();
                      if (!s.contract) return { ...s, contract: { id: `CTR-${s.id}`, status: newStatus, signedAt: newStatus === 'signed' ? now.split('T')[0] : undefined, documentUrl: '' } };
                      return { ...s, contract: { ...s.contract, status: newStatus, signedAt: newStatus === 'signed' ? now.split('T')[0] : s.contract.signedAt } };
                    }, `Contratto → ${newStatus === 'signed' ? 'Firmato' : newStatus === 'draft' ? 'Bozza' : 'Annullato'}`);
                  }} style={{ ...drawerInputStyle, color: service.contract?.status === 'signed' ? 'var(--primary)' : service.contract?.status === 'draft' ? 'var(--chart-5)' : 'var(--destructive-foreground)' }}>
                    <option value="">—</option>
                    <option value="draft">Bozza</option>
                    <option value="signed">Firmato</option>
                    <option value="cancelled">Annullato</option>
                  </select>
                </div>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Scadenza</label>
                  <input type="date" value={service.contract?.expiresAt || ''} onChange={(e) => doUpdate(s => { if (!s.contract) return s; return { ...s, contract: { ...s.contract, expiresAt: e.target.value } }; }, 'Scadenza aggiornata')} style={drawerInputStyle} />
                </div>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Firmato il</label>
                  <span style={drawerReadonlyValueStyle}>{formatDateIT(service.contract?.signedAt)}</span>
                </div>
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ═══ 3. PAGAMENTI ══════════════════════════════════ */}
          <DrawerCollapsibleSection
            icon={CreditCard}
            title="Pagamenti"
            badge={`${service.installments.length} rate`}
            alertBadge={overdueCount > 0 ? `${overdueCount} scadute` : undefined}
            isOpen={sections.pagamenti}
            onToggle={() => toggleSection('pagamenti')}
          >
            {/* Summary */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <MiniInfo label="Lordo" value={`€${displayedLordo.toLocaleString('it-IT')}`} />
              <MiniInfo label="Netto" value={`€${Math.round(totalNetto).toLocaleString('it-IT')}`} />
              <MiniInfo label="Incassato" value={`€${paidTotal.toLocaleString('it-IT')}`} color={paidTotal > 0 ? 'var(--primary)' : undefined} />
            </div>

            {service.installments.length === 0 && quotedGrossFallback > 0 && (
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.625rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
              }}>
                Importo origine preventivo: €{quotedGrossFallback.toLocaleString('it-IT')}. Rate non ancora definite.
              </div>
            )}

            {service.installments.length === 0 ? (
              <span style={{ ...drawerReadonlyValueStyle, color: 'var(--muted-foreground)' }}>Nessuna rata configurata</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {service.installments.map((inst, idx) => (
                  <div key={inst.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.625rem 0.75rem', background: inst.status === 'overdue' ? 'color-mix(in srgb, var(--destructive-foreground) 4%, transparent)' : 'var(--muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        Rata {idx + 1}/{service.installments.length}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {inst.status !== 'paid' && (
                          confirmDeleteId === inst.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button onClick={() => { doUpdate(s => ({ ...s, installments: s.installments.filter(i => i.id !== inst.id) }), `Rata ${idx + 1} rimossa`); setConfirmDeleteId(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--destructive-foreground)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', cursor: 'pointer' }}>Conferma</button>
                              <button onClick={() => setConfirmDeleteId(null)} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}><X size={10} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(inst.id)} title="Rimuovi rata" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.25rem', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={12} /></button>
                          )
                        )}
                        <button onClick={() => {
                          doUpdate(s => ({ ...s, installments: s.installments.map(i => {
                            if (i.id !== inst.id) return i;
                            if (i.status === 'paid') return { ...i, status: 'pending' as InstallmentStatus, payment: undefined };
                            const today = new Date().toISOString().split('T')[0];
                            return { ...i, status: 'paid' as InstallmentStatus, payment: { id: `PAY-${Date.now()}`, amount: i.amount, paidAt: today, method: 'Bonifico' } };
                          }) }), inst.status === 'paid' ? 'Rata riportata a pending' : 'Rata segnata come pagata');
                        }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: inst.status === 'paid' ? 'var(--primary)' : 'var(--card)', color: inst.status === 'paid' ? 'var(--primary-foreground)' : inst.status === 'overdue' ? 'var(--destructive-foreground)' : 'var(--foreground)', cursor: 'pointer' }}>
                          {inst.status === 'paid' ? <><Check size={10} /> Pagata</> : inst.status === 'overdue' ? <><AlertTriangle size={10} /> Scaduta</> : <><Calendar size={10} /> Pending</>}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <span style={{ ...drawerLabelStyle, fontSize: '11px' }}>Importo</span>
                        {inst.status === 'paid' ? (
                          <span style={{ ...drawerReadonlyValueStyle, fontSize: '12px' }}>€{inst.amount.toLocaleString('it-IT')}</span>
                        ) : (
                          <EditableField value={String(inst.amount)} displayPrefix="€" type="number" onSave={(val) => { const num = Number(val); if (!isNaN(num) && num > 0) doUpdate(s => ({ ...s, installments: s.installments.map(i => i.id === inst.id ? { ...i, amount: num } : i) }), 'Importo rata aggiornato'); }} />
                        )}
                      </div>
                      <div>
                        <span style={{ ...drawerLabelStyle, fontSize: '11px' }}>Scadenza</span>
                        {inst.status === 'paid' ? (
                          <span style={{ ...drawerReadonlyValueStyle, fontSize: '12px' }}>{formatDateIT(inst.dueDate)}</span>
                        ) : (
                          <input type="date" value={inst.dueDate} onChange={(e) => doUpdate(s => ({ ...s, installments: s.installments.map(i => { if (i.id !== inst.id) return i; const newDate = e.target.value; const today = new Date(); today.setHours(0,0,0,0); const due = new Date(newDate); const isOvr = due < today && i.status !== 'paid'; return { ...i, dueDate: newDate, status: isOvr ? 'overdue' as InstallmentStatus : i.status === 'overdue' ? 'pending' as InstallmentStatus : i.status }; }) }), 'Scadenza rata aggiornata')} style={{ ...drawerInputStyle, fontSize: '12px', padding: '0.25rem 0.5rem' }} />
                        )}
                      </div>
                      <div>
                        <span style={{ ...drawerLabelStyle, fontSize: '11px' }}>N. Fattura</span>
                        <EditableField value={inst.invoice_number || ''} placeholder="—" onSave={(val) => doUpdate(s => ({ ...s, installments: s.installments.map(i => i.id === inst.id ? { ...i, invoice_number: val || undefined } : i) }), val ? 'N. fattura aggiornato' : 'N. fattura rimosso')} />
                      </div>
                      {inst.status === 'paid' && inst.payment && (
                        <div>
                          <span style={{ ...drawerLabelStyle, fontSize: '11px' }}>Pagato il</span>
                          <input type="date" value={inst.payment.paidAt || ''} onChange={(e) => doUpdate(s => ({ ...s, installments: s.installments.map(i => i.id === inst.id && i.payment ? { ...i, payment: { ...i.payment, paidAt: e.target.value } } : i) }), 'Data pagamento aggiornata')} style={{ ...drawerInputStyle, fontSize: '12px', padding: '0.25rem 0.5rem', color: 'var(--primary)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(paidCount < service.installments.length || service.installments.length === 0) && (
              <DrawerAddButton onClick={() => {
                const nextDue = new Date(); nextDue.setMonth(nextDue.getMonth() + 1);
                doUpdate(s => ({ ...s, installments: [...s.installments, { id: `INST-${Date.now()}`, amount: 0, dueDate: nextDue.toISOString().split('T')[0], status: 'pending' as InstallmentStatus }] }), 'Rata aggiunta');
              }}>
                <Plus size={14} /> Aggiungi rata
              </DrawerAddButton>
            )}
          </DrawerCollapsibleSection>

          {/* ═══ 4. COMPENSO COACH (PAYOUT) ════════════════════ */}
          <DrawerCollapsibleSection
            icon={Briefcase}
            title="Compenso Coach (Payout)"
            badge={getPayoutStatusLabel(service.coach_payout?.status)}
            alertBadge={service.coach_payout?.status === 'disputed' ? 'Contestato' : undefined}
            isOpen={sections.payout}
            onToggle={() => toggleSection('payout')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>N. Notula</label>
                <EditableField value={service.coach_payout?.notula_number || ''} placeholder="—" onSave={(val) => doUpdate(s => ({ ...s, coach_payout: { ...(s.coach_payout || { id: `CP-${s.id}`, status: 'pending_invoice' as PayoutStatus }), notula_number: val || undefined } }), val ? 'N. notula aggiornato' : 'N. notula rimosso')} />
              </div>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Data notula</label>
                <input type="date" value={service.coach_payout?.notula_issue_date || ''} onChange={(e) => doUpdate(s => ({ ...s, coach_payout: { ...(s.coach_payout || { id: `CP-${s.id}`, status: 'pending_invoice' as PayoutStatus }), notula_issue_date: e.target.value || undefined } }), 'Data notula aggiornata')} style={drawerInputStyle} />
              </div>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Scadenza 40gg</label>
                {scad40gg ? (
                  <span style={{ ...drawerReadonlyValueStyle, fontWeight: scad40gg.daysLeft <= 0 && service.coach_payout?.status !== 'paid' ? 'var(--font-weight-bold)' : undefined, color: service.coach_payout?.status === 'paid' ? 'var(--foreground)' : scad40gg.daysLeft <= 0 ? 'var(--destructive-foreground)' : scad40gg.daysLeft <= 7 ? 'var(--chart-3)' : 'var(--foreground)' }}>
                    {scad40gg.date}
                    {service.coach_payout?.status !== 'paid' && scad40gg.daysLeft <= 14 && (
                      <span style={{ fontSize: '11px', marginLeft: '0.25rem' }}>({scad40gg.daysLeft > 0 ? `-${scad40gg.daysLeft}gg` : `+${Math.abs(scad40gg.daysLeft)}gg`})</span>
                    )}
                  </span>
                ) : <span style={{ ...drawerReadonlyValueStyle, color: 'var(--muted-foreground)' }}>—</span>}
              </div>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Stato pagamento</label>
                <select value={service.coach_payout?.status || 'pending_invoice'} onChange={(e) => { const newStatus = e.target.value as PayoutStatus; doUpdate(s => ({ ...s, coach_payout: { ...(s.coach_payout || { id: `CP-${s.id}`, status: 'pending_invoice' as PayoutStatus }), status: newStatus } }), `Stato pagamento → ${getPayoutStatusLabel(newStatus)}`); }} style={{ ...drawerInputStyle, color: '#fff', backgroundColor: getPayoutStatusColor(service.coach_payout?.status), fontWeight: 'var(--font-weight-medium)', textAlign: 'center', appearance: 'none', WebkitAppearance: 'none', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' }}>
                  {PAYOUT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Pagato il</label>
                <input type="date" value={service.coach_payout?.paid_at || ''} onChange={(e) => doUpdate(s => ({ ...s, coach_payout: { ...(s.coach_payout || { id: `CP-${s.id}`, status: 'pending_invoice' as PayoutStatus }), paid_at: e.target.value || undefined } }), 'Data pagamento aggiornata')} style={drawerInputStyle} />
              </div>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Rif. pagamento</label>
                <EditableField value={service.coach_payout?.payment_reference || ''} placeholder="—" onSave={(val) => doUpdate(s => ({ ...s, coach_payout: { ...(s.coach_payout || { id: `CP-${s.id}`, status: 'pending_invoice' as PayoutStatus }), payment_reference: val || undefined } }), val ? 'Rif. pagamento aggiornato' : 'Rif. pagamento rimosso')} />
              </div>
            </div>
          </DrawerCollapsibleSection>

          {/* ═══ 5. PREVENTIVI ════════════════════════════════ */}
          <DrawerCollapsibleSection
            icon={FileText}
            title="Preventivi"
            isOpen={sections.preventivi}
            onToggle={() => toggleSection('preventivi')}
          >
            {pipeline && pipeline.quotes && pipeline.quotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pipeline.quotes.map(q => {
                  const lifecycleLabel = getQuoteLifecycleLabel(q);
                  return (
                  <div key={q.id} style={{ 
                    padding: '0.625rem', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border)',
                    background: q.id === service.quote_id
                      ? 'color-mix(in srgb, var(--primary) 6%, transparent)'
                      : 'var(--muted)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '1.5' }}>{q.number}</span>
                        {q.id === service.quote_id && (
                          <span style={{ 
                            fontFamily: 'var(--font-inter)',
                            fontSize: '9px', 
                            backgroundColor: 'var(--primary)', 
                            color: 'var(--primary-foreground)', 
                            padding: '1px 5px', 
                            borderRadius: 'var(--radius-badge)',
                            fontWeight: 'var(--font-weight-semibold)',
                            letterSpacing: '0.025em',
                            lineHeight: '1.6',
                          }}>COLLEGATO</span>
                        )}
                      </div>
                      <span style={{ 
                        fontFamily: 'var(--font-inter)',
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: 'var(--radius-badge)', 
                        border: '1px solid var(--border)',
                        backgroundColor: lifecycleLabel === 'Accettato' || lifecycleLabel === 'Pagato'
                          ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                          : lifecycleLabel === 'Scaduto'
                            ? 'color-mix(in srgb, var(--destructive-foreground) 10%, transparent)'
                            : lifecycleLabel === 'In scadenza'
                              ? 'color-mix(in srgb, var(--chart-3) 10%, transparent)'
                            : 'var(--muted)',
                        color: lifecycleLabel === 'Accettato' || lifecycleLabel === 'Pagato'
                          ? 'var(--primary)'
                          : lifecycleLabel === 'Scaduto'
                            ? 'var(--destructive-foreground)'
                            : lifecycleLabel === 'In scadenza'
                              ? 'var(--chart-3)'
                            : 'var(--muted-foreground)',
                        fontWeight: 'var(--font-weight-semibold)',
                        textTransform: 'uppercase',
                        lineHeight: '1.6',
                      }}>
                        {lifecycleLabel.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '0.25rem', lineHeight: '1.5' }}>
                      {typeof q.amount_gross === 'number' && q.amount_gross > 0
                        ? `Lordo €${q.amount_gross.toLocaleString('it-IT')} · `
                        : ''}
                      {q.sent_at ? `Inviato il ${formatDateIT(q.sent_at)}` : 'Non ancora inviato'}
                      {q.expires_at && ` · Scad. ${formatDateIT(q.expires_at)}`}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                Nessun preventivo associato a questa lavorazione.
              </span>
            )}
          </DrawerCollapsibleSection>

          {/* ═══ 6. AUDIT E RIFERIMENTI ════════════════════════ */}
          <DrawerCollapsibleSection
            icon={Hash}
            title="Audit e Riferimenti"
            isOpen={sections.riferimenti}
            onToggle={() => toggleSection('riferimenti')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Pipeline di origine */}
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Pipeline di origine</label>
                {pipeline ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.5rem 0.625rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        {pipeline.student_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        {pipeline.id} · {formatDateIT(pipeline.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/pipelines?highlight=${pipeline.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '11px', flexShrink: 0 }}
                    >
                      Apri <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                    </button>
                  </div>
                ) : (
                  <span style={drawerReadonlyValueStyle}>—</span>
                )}
              </div>

              {service.needs_timeline !== false && (
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Timeline lavorazione</label>
                  <button
                    onClick={() => {
                      navigate(`/coaching/timeline?lavorazioneId=${service.id}&studentId=${service.student_id}`);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '11px', width: 'fit-content' }}
                  >
                    Apri timeline <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Servizio</label>
                  <span style={drawerReadonlyValueStyle}>
                    {service.service_name}
                    <span style={{ fontFamily: 'var(--font-inter)', color: 'var(--muted-foreground)', marginLeft: '0.375rem', fontWeight: 'var(--font-weight-regular)' }}>— {service.service_category}</span>
                  </span>
                </div>

                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Rif. preventivo</label>
                  {quote ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={drawerReadonlyValueStyle}>{quote.number}</span>
                      <span style={{ 
                        fontFamily: 'var(--font-inter)',
                        fontSize: '9px', 
                        padding: '1px 5px', 
                        borderRadius: 'var(--radius-badge)', 
                        backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                        color: 'var(--primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        border: '1px solid var(--primary)',
                        letterSpacing: '0.025em',
                        lineHeight: '1.6',
                      }}>
                        {quote.status.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <span style={drawerReadonlyValueStyle}>{service.quote_id || '—'}</span>
                  )}
                </div>

                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Creato il</label>
                  <span style={drawerReadonlyValueStyle}>
                    {formatDateIT(service.created_at)}
                    {service.created_by && <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-regular)', lineHeight: '1.5' }}>da {service.created_by}</div>}
                  </span>
                </div>
                
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Ultimo aggiornamento</label>
                  <span style={drawerReadonlyValueStyle}>
                    {formatDateTimestamp(service.updated_at)}
                    {service.updated_by && <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-regular)', lineHeight: '1.5' }}>da {service.updated_by}</div>}
                  </span>
                </div>
              </div>
            </div>
          </DrawerCollapsibleSection>

        </DrawerBody>
      </DrawerShell>

      <ConfirmDialog
        open={confirmTimelineToggle}
        onOpenChange={setConfirmTimelineToggle}
        title={service.needs_timeline !== false ? 'Disattivare la timeline?' : 'Attivare la timeline?'}
        description={service.needs_timeline !== false ? 'La timeline coaching verrà disattivata per questa lavorazione. Eventuali dati collegati non saranno più visibili.' : 'La timeline coaching verrà attivata per questa lavorazione.'}
        confirmLabel={service.needs_timeline !== false ? 'Disattiva' : 'Attiva'}
        cancelLabel="Annulla"
        variant="destructive"
        onConfirm={() => { doUpdate(s => ({ ...s, needs_timeline: s.needs_timeline === false ? true : false }), service.needs_timeline !== false ? 'Timeline disattivata' : 'Timeline attivata'); }}
      />
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function EditableField({ value, placeholder, displayPrefix, type = 'text', onSave }: {
  value: string; placeholder?: string; displayPrefix?: string;
  type?: 'text' | 'number'; onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const save = () => { if (draft !== value) onSave(draft); setEditing(false); };

  if (editing) {
    return (
      <input type={type} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        onBlur={save}
        style={{ ...drawerInputStyle, fontSize: '12px', padding: '0.25rem 0.5rem' }}
      />
    );
  }

  return (
    <div onClick={() => { setDraft(value); setEditing(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: value ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }} title="Clicca per modificare">
      <span>{displayPrefix && value ? `${displayPrefix}${type === 'number' ? Number(value).toLocaleString('it-IT') : value}` : value || placeholder || '—'}</span>
      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
    </div>
  );
}

function MiniInfo({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>{label}</span>
      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-bold)', color: color || 'var(--foreground)', lineHeight: '1.2' }}>{value}</div>
    </div>
  );
}