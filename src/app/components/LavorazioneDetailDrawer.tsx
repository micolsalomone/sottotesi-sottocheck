import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  FileText, User, Briefcase, CreditCard,
  Calendar, AlertTriangle, Check, Pencil, ExternalLink,
  Plus, Save, Trash2, Settings, Hash, GraduationCap,
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
  type CoachPayout,
  type TaxRate,
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

type NotulaWorkflowStatus = 'da_programmare' | 'creata' | 'da_pagare' | 'pagata';

const createDefaultCoachPayout = (serviceId: string, idSuffix = `${Date.now()}`): CoachPayout => ({
  id: `CP-${serviceId}-${idSuffix}`,
  document_type: 'notula',
  status: 'pending_invoice',
  notula_status: 'da_programmare',
  invoice_status: 'da_ricevere',
  tax_rate: 0,
  sent_manually: false,
});

const normalizeNotulaStatus = (status?: CoachPayout['notula_status']): NotulaWorkflowStatus => {
  if (status === 'pagata') return 'pagata';
  if (status === 'inviata' || status === 'da_pagare') return 'da_pagare';
  if (status === 'creata' || status === 'programmata') return 'creata';
  return 'da_programmare';
};

const getPayoutIssueDate = (payout?: Partial<CoachPayout>): string | undefined => {
  if (!payout) return undefined;
  return payout.document_type === 'fattura'
    ? payout.invoice_date
    : payout.notula_issue_date;
};

const resolveNotulaStatus = (payout?: Partial<CoachPayout>): NotulaWorkflowStatus => {
  if (!payout) return 'da_programmare';
  const isFattura = payout.document_type === 'fattura';

  if (payout.paid_at) return 'pagata';
  if (isFattura) {
    if (payout.invoice_status === 'ricevuta') return 'da_pagare';
    if (payout.invoice_date) return 'creata';
    return 'da_programmare';
  }

  if (payout.sent_manually || normalizeNotulaStatus(payout.notula_status) === 'da_pagare') return 'da_pagare';
  if (payout.notula_issue_date) return 'creata';
  return 'da_programmare';
};

const withSyncedNotulaStatus = (payout: CoachPayout): CoachPayout => ({
  ...payout,
  notula_status: resolveNotulaStatus(payout),
});

const buildCoachPayoutsFromService = (service: StudentService): CoachPayout[] => {
  const fromList = service.coach_payouts && service.coach_payouts.length > 0
    ? service.coach_payouts
    : service.coach_payout
      ? [service.coach_payout]
      : service.coach_fee !== undefined
        ? [{ ...createDefaultCoachPayout(service.id, 'legacy'), notula_amount: service.coach_fee }]
        : [];
  return fromList.map((p, idx) => withSyncedNotulaStatus({
    ...createDefaultCoachPayout(service.id, `${idx}`),
    ...p,
    id: p.id || `CP-${service.id}-${idx}`,
  }));
};

const INVOICE_STATUS_OPTIONS: { value: NonNullable<CoachPayout['invoice_status']>; label: string }[] = [
  { value: 'da_ricevere', label: 'Da ricevere' },
  { value: 'ricevuta', label: 'Ricevuta' },
];

const getNotulaStatusColor = (status?: CoachPayout['notula_status'] | NotulaWorkflowStatus): string => {
  switch (normalizeNotulaStatus(status)) {
    case 'pagata': return 'var(--primary)';
    case 'da_pagare': return 'var(--chart-3)';
    case 'creata': return 'var(--chart-2)';
    case 'da_programmare': return 'var(--muted-foreground)';
    default: return 'var(--muted-foreground)';
  }
};

const getNotulaStatusLabel = (status?: CoachPayout['notula_status'] | NotulaWorkflowStatus): string => {
  switch (normalizeNotulaStatus(status)) {
    case 'pagata': return 'Pagata';
    case 'da_pagare': return 'Da pagare';
    case 'creata': return 'Creata';
    case 'da_programmare': return 'Da programmare';
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

const calculatePaymentDueDate = (serviceEndDate?: string): string | undefined => {
  if (!serviceEndDate) return undefined;
  const d = new Date(serviceEndDate);
  d.setDate(d.getDate() + 45);
  return d.toISOString().split('T')[0];
};

const computeScad45gg = (payout?: Partial<CoachPayout>, serviceEndDate?: string): { date: string; daysLeft: number } | null => {
  // Prefer payment_due_date, fallback to service end date + 45 days
  let dueDate: string | undefined = payout?.payment_due_date;
  
  if (!dueDate && serviceEndDate) {
    dueDate = calculatePaymentDueDate(serviceEndDate);
  }
  
  if (!dueDate) {
    // Fallback to issue date (legacy behavior)
    const issueDate = getPayoutIssueDate(payout);
    if (!issueDate) return null;
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 45);
    dueDate = d.toISOString().split('T')[0];
  }
  
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { date: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }), daysLeft };
};

const normalizeTaxRate = (value?: number): TaxRate => (value === 0 || value === 4 || value === 22 ? value : 22);
const roundToCents = (value: number): number => Math.round(value * 100) / 100;

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
  const [confirmDeletePayoutId, setConfirmDeletePayoutId] = useState<string | null>(null);
  const [confirmTimelineToggle, setConfirmTimelineToggle] = useState(false);
  const lastKnownUpdate = useRef(service.updated_at || '');

  const [sections, setSections] = useState({
    operativi: true,
    contratto: false,
    pagamenti: false,
    payout: false,
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

  // ─── Rate: stato locale + dirty tracking ─────────────────
  const [localInstallments, setLocalInstallments] = useState([...service.installments]);
  const [localServiceTaxRate, setLocalServiceTaxRate] = useState<TaxRate>(normalizeTaxRate(service.total_tax_rate ?? taxPercent));
  const [dirtyInstallmentIds, setDirtyInstallmentIds] = useState<Set<string>>(new Set());

  const [localCoachPayouts, setLocalCoachPayouts] = useState<CoachPayout[]>(buildCoachPayoutsFromService(service));
  const [dirtyPayoutIds, setDirtyPayoutIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalInstallments([...service.installments]);
    setLocalServiceTaxRate(normalizeTaxRate(service.total_tax_rate ?? taxPercent));
    setDirtyInstallmentIds(new Set());
    setLocalCoachPayouts(buildCoachPayoutsFromService(service));
    setDirtyPayoutIds(new Set());
  }, [service.id, service.installments, service.total_tax_rate, service.coach_payouts, service.coach_payout, service.coach_fee, taxPercent]);

  const markInstDirty = (id: string) => setDirtyInstallmentIds(prev => { const n = new Set(prev); n.add(id); return n; });
  const clearInstDirty = (id: string) => setDirtyInstallmentIds(prev => { const n = new Set(prev); n.delete(id); return n; });

  const handleSaveInstallment = (instId: string) => {
    doUpdate(s => ({ ...s, installments: localInstallments }), 'Rata salvata');
    clearInstDirty(instId);
  };

  const markPayoutDirty = (id: string) => setDirtyPayoutIds(prev => { const n = new Set(prev); n.add(id); return n; });
  const clearPayoutDirty = (id: string) => setDirtyPayoutIds(prev => { const n = new Set(prev); n.delete(id); return n; });

  const handleSaveCoachPayout = (payoutId: string) => {
    const synced = localCoachPayouts.map(p => {
      const newPayout = withSyncedNotulaStatus(p);
      // Auto-set payment_due_date if service is completed and no due date is set
      if (service.status === 'completed' && serviceEndDate && !newPayout.payment_due_date) {
        newPayout.payment_due_date = calculatePaymentDueDate(serviceEndDate);
      }
      return newPayout;
    });
    const primary = synced[0];
    const totalCoachFee = roundToCents(synced.reduce((sum, p) => sum + (p.notula_amount || 0), 0));
    doUpdate(s => ({
      ...s,
      coach_payouts: synced.length > 0 ? synced : undefined,
      coach_payout: primary,
      coach_fee: synced.length > 0 ? totalCoachFee : undefined,
    }), 'Payout coach salvato');
    clearPayoutDirty(payoutId);
  };

  const getInstallmentTaxRate = (inst: { net_tax_rate?: TaxRate }): TaxRate => {
    return normalizeTaxRate(inst.net_tax_rate ?? localServiceTaxRate);
  };

  const getInstallmentNet = (inst: { amount: number; net_tax_rate?: TaxRate }): number => {
    const rate = getInstallmentTaxRate(inst);
    return roundToCents(inst.amount * (1 - rate / 100));
  };

  const totalLordo = localInstallments.reduce((sum, i) => sum + i.amount, 0);
  const quotedGrossFallback = service.quoted_gross_amount || 0;
  const displayedLordo = totalLordo > 0 ? totalLordo : quotedGrossFallback;
  const totalNetto = localInstallments.length > 0
    ? localInstallments.reduce((sum, i) => sum + getInstallmentNet(i), 0)
    : displayedLordo * (1 - localServiceTaxRate / 100);
  const paidTotal = localInstallments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = localInstallments.filter(i => i.status === 'overdue').length;
  const paidCount = localInstallments.filter(i => i.status === 'paid').length;

  const syncedCoachPayouts = localCoachPayouts.map(p => withSyncedNotulaStatus(p));
  const payoutDaPagareCount = syncedCoachPayouts.filter(p => resolveNotulaStatus(p) === 'da_pagare').length;
  const serviceEndDate = service.plan_end_date || service.end_date;
  const payoutScaduteCount = syncedCoachPayouts.filter(p => {
    const scad = computeScad45gg(p, serviceEndDate);
    return resolveNotulaStatus(p) === 'da_pagare' && !!scad && scad.daysLeft <= 0;
  }).length;
  const payoutInScadenzaCount = syncedCoachPayouts.filter(p => {
    const scad = computeScad45gg(p, serviceEndDate);
    return resolveNotulaStatus(p) === 'da_pagare' && !!scad && scad.daysLeft > 0 && scad.daysLeft <= 7;
  }).length;
  const coachCompensoLordo = roundToCents(syncedCoachPayouts.reduce((sum, p) => sum + (p.notula_amount || 0), 0));
  const coachCompensoNetto = roundToCents(syncedCoachPayouts.reduce((sum, p) => {
    const rate = normalizeTaxRate(p.tax_rate ?? 0);
    return sum + (p.notula_amount || 0) * (1 + rate / 100);
  }, 0));
  const coachCompensoPagato = roundToCents(syncedCoachPayouts.reduce((sum, p) => {
    if (resolveNotulaStatus(p) !== 'pagata') return sum;
    const rate = normalizeTaxRate(p.tax_rate ?? 0);
    return sum + (p.notula_amount || 0) * (1 + rate / 100);
  }, 0));

  const student = (students || []).find(s => s.id === service.student_id);
  const academicRecord = student?.academic_records?.find(r => r.id === service.academic_record_id)
    || student?.academic_records?.find(r => r.is_current)
    || student?.academic_records?.[0];

  const pipeline = (pipelines || []).find(p => p.id === service.pipeline_id || p.student_id === service.student_id);
  const quote = pipeline?.quotes?.find(q => q.id === service.quote_id);

  if (!isOpen) return null;

  // ─── Header actions: status select ───────────────────────
  const isCompletedStatus = service.status === 'completed';
  const statusSelect = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: 'var(--radius)',
        border: isCompletedStatus ? '1px solid var(--primary)' : '1px solid var(--border)',
        backgroundColor: isCompletedStatus
          ? 'color-mix(in srgb, var(--primary) 10%, var(--input-background))'
          : 'var(--input-background)',
        padding: '0.25rem 0.5rem',
        flexShrink: 0,
      }}
    >
      {isCompletedStatus && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
      <select
        value={service.status}
        onChange={(e) => {
          const newStatus = e.target.value as ServiceStatus;
          doUpdate(s => {
            const updated: Partial<StudentService> = { status: newStatus };
            if (newStatus === 'paused' && !s.pause_start_date) updated.pause_start_date = new Date().toISOString().split('T')[0];
            if (newStatus !== 'paused' && s.status === 'paused') updated.pause_end_date = s.pause_end_date || new Date().toISOString().split('T')[0];

            // Auto-set payment_due_date for payouts when marking as completed
            if (newStatus === 'completed' && s.status !== 'completed') {
              // Track completion timestamp and admin
              updated.completed_at = new Date().toISOString();
              updated.completed_by = currentAdmin;

              const serviceEndDate = s.plan_end_date || s.end_date;
              if (serviceEndDate) {
                const dueDate = calculatePaymentDueDate(serviceEndDate);
                if (dueDate) {
                  updated.coach_payouts = (s.coach_payouts || []).map(p => ({ ...p, payment_due_date: dueDate }));
                  if (s.coach_payout) {
                    updated.coach_payout = { ...s.coach_payout, payment_due_date: dueDate };
                  }
                }
              }
            }

            return { ...s, ...updated };
          }, `Stato lavorazione → ${SERVICE_STATUS_LABELS[newStatus]}`);
        }}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          fontFamily: 'var(--font-inter)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
          cursor: 'pointer',
          outline: 'none',
          padding: 0,
        }}
      >
        {Object.entries(SERVICE_STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
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

        {/* ─── Completion info ─────────────────────────────── */}
        {service.status === 'completed' && service.completed_at && (
          <DrawerMetaRow>
            Completato da: {service.completed_by || '—'} — {formatDateTimestamp(service.completed_at)}
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

            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: '1.5',
              }}>
                Aliquota default lavorazione
              </span>
              <select
                value={localServiceTaxRate}
                onChange={(e) => {
                  const nextRate = normalizeTaxRate(Number(e.target.value));
                  setLocalServiceTaxRate(nextRate);
                  doUpdate(s => ({ ...s, total_tax_rate: nextRate }), `Aliquota lavorazione → ${nextRate}%`);
                }}
                style={{
                  ...drawerInputStyle,
                  width: 'auto',
                  minWidth: '90px',
                  padding: '0.25rem 0.5rem',
                }}
              >
                <option value={0}>0%</option>
                <option value={4}>4%</option>
                <option value={22}>22%</option>
              </select>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                Le rate senza scelta specifica usano questa aliquota.
              </span>
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

            {localInstallments.length === 0 ? (
              <span style={{ ...drawerReadonlyValueStyle, color: 'var(--muted-foreground)' }}>Nessuna rata configurata</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {localInstallments.map((inst, idx) => {
                  const isDirty = dirtyInstallmentIds.has(inst.id);
                  return (
                    <div
                      key={inst.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: inst.status === 'overdue'
                          ? 'color-mix(in srgb, var(--destructive-foreground) 4%, var(--muted))'
                          : 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        position: 'relative',
                      }}
                    >
                      {/* Riga titolo + azioni */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                          Rata {idx + 1}/{localInstallments.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {inst.status !== 'paid' && (
                            confirmDeleteId === inst.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <button
                                  onClick={() => {
                                    const updated = localInstallments.filter(i => i.id !== inst.id);
                                    setLocalInstallments(updated);
                                    clearInstDirty(inst.id);
                                    doUpdate(s => ({ ...s, installments: updated }), `Rata ${idx + 1} rimossa`);
                                    setConfirmDeleteId(null);
                                  }}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--destructive-foreground)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', cursor: 'pointer' }}
                                >Conferma</button>
                                <button onClick={() => setConfirmDeleteId(null)} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}><X size={10} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(inst.id)} title="Rimuovi rata" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.25rem', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={12} /></button>
                            )
                          )}
                          <button
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              const updated = localInstallments.map(i => {
                                if (i.id !== inst.id) return i;
                                if (i.status === 'paid') return { ...i, status: 'pending' as InstallmentStatus, payment: undefined };
                                return { ...i, status: 'paid' as InstallmentStatus, payment: { id: `PAY-${Date.now()}`, amount: i.amount, paidAt: today, method: 'Bonifico' } };
                              });
                              setLocalInstallments(updated);
                              markInstDirty(inst.id);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: inst.status === 'paid' ? 'var(--primary)' : 'var(--card)', color: inst.status === 'paid' ? 'var(--primary-foreground)' : inst.status === 'overdue' ? 'var(--destructive-foreground)' : 'var(--foreground)', cursor: 'pointer' }}
                          >
                            {inst.status === 'paid' ? <><Check size={10} /> Pagata</> : inst.status === 'overdue' ? <><AlertTriangle size={10} /> Scaduta</> : <><Calendar size={10} /> Pending</>}
                          </button>
                        </div>
                      </div>

                      {/* Campi */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Importo</div>
                          <input
                            type="number" min="0" step="0.01"
                            style={drawerInputStyle}
                            value={inst.amount || ''}
                            placeholder="es. 1200"
                            onChange={(e) => {
                              const num = Number(e.target.value);
                              const updated = localInstallments.map(i => i.id === inst.id ? { ...i, amount: isNaN(num) ? 0 : num } : i);
                              setLocalInstallments(updated);
                              markInstDirty(inst.id);
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Scadenza</div>
                          <input
                            type="date"
                            style={drawerInputStyle}
                            value={inst.dueDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const today = new Date(); today.setHours(0, 0, 0, 0);
                              const due = new Date(newDate);
                              const updated = localInstallments.map(i => {
                                if (i.id !== inst.id) return i;
                                const isOvr = due < today && i.status !== 'paid';
                                return { ...i, dueDate: newDate, status: isOvr ? 'overdue' as InstallmentStatus : i.status === 'overdue' ? 'pending' as InstallmentStatus : i.status };
                              });
                              setLocalInstallments(updated);
                              markInstDirty(inst.id);
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Aliquota</div>
                          <select
                            style={drawerInputStyle}
                            value={inst.net_tax_rate ? String(inst.net_tax_rate) : 'default'}
                            onChange={(e) => {
                              const next = e.target.value;
                              const updated = localInstallments.map(i => {
                                if (i.id !== inst.id) return i;
                                if (next === 'default') {
                                  const { net_tax_rate, ...rest } = i;
                                  return rest;
                                }
                                return { ...i, net_tax_rate: normalizeTaxRate(Number(next)) };
                              });
                              setLocalInstallments(updated);
                              markInstDirty(inst.id);
                            }}
                          >
                            <option value="default">{localServiceTaxRate}%</option>
                            <option value="0">0% (sostituisci)</option>
                            <option value="4">4% (sostituisci)</option>
                            <option value="22">22% (sostituisci)</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Netto (preview)</div>
                          <div style={{ ...drawerReadonlyValueStyle, height: '36px', display: 'flex', alignItems: 'center' }}>
                            €{getInstallmentNet(inst).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>N. Fattura</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              type="text"
                              style={{ ...drawerInputStyle, flex: 1 }}
                              value={(inst.invoice_number || '').split('/')[0] || ''}
                              placeholder="es. 001"
                              onChange={(e) => {
                                const parts = (inst.invoice_number || '').split('/');
                                const year = parts[1] || new Date().getFullYear().toString();
                                const updated = localInstallments.map(i => i.id === inst.id ? { ...i, invoice_number: `${e.target.value}/${year}` } : i);
                                setLocalInstallments(updated);
                                markInstDirty(inst.id);
                              }}
                            />
                            <input
                              type="text"
                              style={{ ...drawerInputStyle, width: '65px' }}
                              value={(inst.invoice_number || '').split('/')[1] || new Date().getFullYear().toString()}
                              placeholder={new Date().getFullYear().toString()}
                              onChange={(e) => {
                                const parts = (inst.invoice_number || '').split('/');
                                const num = parts[0] || '';
                                const updated = localInstallments.map(i => i.id === inst.id ? { ...i, invoice_number: `${num}/${e.target.value}` } : i);
                                setLocalInstallments(updated);
                                markInstDirty(inst.id);
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Pagato il</div>
                          <input
                            type="date"
                            style={{ ...drawerInputStyle, color: inst.status === 'paid' ? 'var(--primary)' : undefined }}
                            value={inst.payment?.paidAt || ''}
                            onChange={(e) => {
                              const updated = localInstallments.map(i => i.id === inst.id ? { ...i, payment: i.payment ? { ...i.payment, paidAt: e.target.value } : { id: `PAY-${Date.now()}`, amount: i.amount, paidAt: e.target.value, method: 'Bonifico' } } : i);
                              setLocalInstallments(updated);
                              markInstDirty(inst.id);
                            }}
                          />
                        </div>
                      </div>

                      {/* Salva rata — visibile solo se dirty */}
                      {isDirty && (
                        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                          <button
                            onClick={() => handleSaveInstallment(inst.id)}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.375rem' }}
                          >
                            <Save size={14} /> Salva rata
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <DrawerAddButton onClick={() => {
                const nextDue = new Date(); nextDue.setMonth(nextDue.getMonth() + 1);
                const newInst = { id: `INST-${Date.now()}`, amount: 0, dueDate: nextDue.toISOString().split('T')[0], status: 'pending' as InstallmentStatus };
                setLocalInstallments(prev => [...prev, newInst]);
                markInstDirty(newInst.id);
                toast.success('Rata aggiunta. Premi Salva per registrarla');
              }}>
                <Plus size={14} /> Aggiungi rata
              </DrawerAddButton>
          </DrawerCollapsibleSection>

          {/* ═══ 4. COMPENSO COACH (PAYOUT) ════════════════════ */}
          <DrawerCollapsibleSection
            icon={Briefcase}
            title="Compenso Coach (Payout)"
            badge={`${localCoachPayouts.length} ${localCoachPayouts.length === 1 ? 'payout' : 'payout'}`}
            alertBadge={
              payoutScaduteCount > 0
                ? `${payoutScaduteCount} scadute`
                : payoutInScadenzaCount > 0
                  ? `${payoutInScadenzaCount} in scadenza`
                  : payoutDaPagareCount > 0
                    ? `${payoutDaPagareCount} da pagare`
                    : undefined
            }
            isOpen={sections.payout}
            onToggle={() => toggleSection('payout')}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <MiniInfo label="Compenso lordo" value={`€${coachCompensoLordo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <MiniInfo label="Totale da pagare al coach" value={`€${coachCompensoNetto.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <MiniInfo label="Pagato" value={`€${coachCompensoPagato.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            </div>

            {localCoachPayouts.length === 0 ? (
              <span style={{ ...drawerReadonlyValueStyle, color: 'var(--muted-foreground)' }}>Nessun payout configurato</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {localCoachPayouts.map((payout, idx) => {
                  const status = resolveNotulaStatus(payout);
                  const isFattura = payout.document_type === 'fattura';
                  const issueDate = getPayoutIssueDate(payout);
                  const documentLabel = isFattura ? 'Fattura' : 'Notula';
                  const scad = computeScad45gg(payout, serviceEndDate);
                  const isDirty = dirtyPayoutIds.has(payout.id);
                  return (
                    <div key={payout.id} style={{
                      padding: '1rem',
                      backgroundColor: status === 'da_pagare' && scad && scad.daysLeft <= 0
                        ? 'color-mix(in srgb, var(--destructive-foreground) 4%, var(--muted))'
                        : 'var(--muted)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                          Payout {idx + 1}/{localCoachPayouts.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {confirmDeletePayoutId === payout.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button
                                onClick={() => {
                                  const updated = localCoachPayouts.filter(p => p.id !== payout.id);
                                  setLocalCoachPayouts(updated);
                                  clearPayoutDirty(payout.id);
                                  const synced = updated.map(p => withSyncedNotulaStatus(p));
                                  const primary = synced[0];
                                  const totalCoachFee = roundToCents(synced.reduce((sum, p) => sum + (p.notula_amount || 0), 0));
                                  doUpdate(s => ({
                                    ...s,
                                    coach_payouts: synced.length > 0 ? synced : undefined,
                                    coach_payout: primary,
                                    coach_fee: synced.length > 0 ? totalCoachFee : undefined,
                                  }), `Payout ${idx + 1} rimosso`);
                                  setConfirmDeletePayoutId(null);
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--destructive-foreground)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', cursor: 'pointer' }}
                              >Conferma</button>
                              <button onClick={() => setConfirmDeletePayoutId(null)} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}><X size={10} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeletePayoutId(payout.id)} title="Rimuovi payout" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.25rem', borderRadius: 'var(--radius)', border: 'none', background: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={12} /></button>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', background: 'var(--card)', color: getNotulaStatusColor(status) }}>
                            {getNotulaStatusLabel(status)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Compenso lordo</div>
                          <input
                            type="number" min="0" step="0.01"
                            style={drawerInputStyle}
                            value={payout.notula_amount || ''}
                            placeholder="es. 480"
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setLocalCoachPayouts(prev => prev.map(p => p.id === payout.id ? withSyncedNotulaStatus({ ...p, notula_amount: Number.isNaN(value) ? 0 : value }) : p));
                              markPayoutDirty(payout.id);
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Aliquota coach</div>
                          <select
                            style={drawerInputStyle}
                            value={normalizeTaxRate(payout.tax_rate ?? 0)}
                            onChange={(e) => {
                              const rate = normalizeTaxRate(Number(e.target.value));
                              setLocalCoachPayouts(prev => prev.map(p => p.id === payout.id ? withSyncedNotulaStatus({ ...p, tax_rate: rate }) : p));
                              markPayoutDirty(payout.id);
                            }}
                          >
                            <option value={0}>0%</option>
                            <option value={4}>4%</option>
                            <option value={22}>22%</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Totale da pagare (preview)</div>
                          <div style={{ ...drawerReadonlyValueStyle, height: '36px', display: 'flex', alignItems: 'center' }}>
                            €{roundToCents((payout.notula_amount || 0) * (1 + normalizeTaxRate(payout.tax_rate ?? 0) / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Tipo documento</div>
                          <select
                            style={drawerInputStyle}
                            value={payout.document_type || 'notula'}
                            onChange={(e) => {
                              const nextType = e.target.value as 'notula' | 'fattura';
                              setLocalCoachPayouts(prev => prev.map(p => {
                                if (p.id !== payout.id) return p;
                                const base = {
                                  ...p,
                                  document_type: nextType,
                                  sent_manually: false,
                                };
                                return nextType === 'fattura'
                                  ? withSyncedNotulaStatus({
                                    ...base,
                                    notula_issue_date: undefined,
                                    notula_sent_date: undefined,
                                    notula_number: undefined,
                                    invoice_status: p.invoice_status || 'da_ricevere',
                                  })
                                  : withSyncedNotulaStatus({
                                    ...base,
                                    invoice_date: undefined,
                                    invoice_status: 'da_ricevere',
                                  });
                              }));
                              markPayoutDirty(payout.id);
                            }}
                          >
                            <option value="notula">Notula</option>
                            <option value="fattura">Fattura</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Data emissione {documentLabel.toLowerCase()}</div>
                          <input
                            type="date"
                            style={drawerInputStyle}
                            value={issueDate || ''}
                            onChange={(e) => {
                              setLocalCoachPayouts(prev => prev.map(p => {
                                if (p.id !== payout.id) return p;
                                const nextValue = e.target.value || undefined;
                                const next = isFattura
                                  ? { ...p, invoice_date: nextValue, notula_issue_date: undefined, sent_manually: false }
                                  : { ...p, notula_issue_date: nextValue, invoice_date: undefined, sent_manually: nextValue ? p.sent_manually : false };
                                return withSyncedNotulaStatus(next);
                              }));
                              markPayoutDirty(payout.id);
                            }}
                          />
                        </div>
                        {isFattura && (
                          <div>
                            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Fattura</div>
                            <select
                              style={drawerInputStyle}
                              value={payout.invoice_status || 'da_ricevere'}
                              onChange={(e) => {
                                const next = e.target.value as NonNullable<CoachPayout['invoice_status']>;
                                setLocalCoachPayouts(prev => prev.map(p => p.id === payout.id ? withSyncedNotulaStatus({ ...p, invoice_status: next }) : p));
                                markPayoutDirty(payout.id);
                              }}
                            >
                              {INVOICE_STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Pagato il</div>
                          <input
                            type="date"
                            style={drawerInputStyle}
                            value={payout.paid_at || ''}
                            onChange={(e) => {
                              setLocalCoachPayouts(prev => prev.map(p => p.id === payout.id ? withSyncedNotulaStatus({ ...p, paid_at: e.target.value || undefined }) : p));
                              markPayoutDirty(payout.id);
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Rif. pagamento</div>
                          <input
                            type="text"
                            style={drawerInputStyle}
                            value={payout.payment_reference || ''}
                            placeholder="—"
                            onChange={(e) => {
                              setLocalCoachPayouts(prev => prev.map(p => p.id === payout.id ? withSyncedNotulaStatus({ ...p, payment_reference: e.target.value || undefined }) : p));
                              markPayoutDirty(payout.id);
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', lineHeight: '1.5' }}>Scadenza 45gg</div>
                          <div style={{ ...drawerReadonlyValueStyle, height: '36px', display: 'flex', alignItems: 'center', color: status === 'pagata' ? 'var(--foreground)' : scad && scad.daysLeft <= 0 ? 'var(--destructive-foreground)' : scad && scad.daysLeft <= 7 ? getNotulaStatusColor(status) : 'var(--foreground)' }}>
                            {scad ? (
                              <>
                                {scad.date}
                                {status !== 'pagata' && scad.daysLeft <= 14 && (
                                  <span style={{ fontSize: '11px', marginLeft: '0.25rem' }}>({scad.daysLeft > 0 ? `-${scad.daysLeft}gg` : `+${Math.abs(scad.daysLeft)}gg`})</span>
                                )}
                              </>
                            ) : '—'}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setLocalCoachPayouts(prev => prev.map(p => {
                              if (p.id !== payout.id) return p;
                              return isFattura
                                ? withSyncedNotulaStatus({ ...p, sent_manually: false, invoice_status: 'ricevuta' })
                                : withSyncedNotulaStatus({ ...p, sent_manually: true, notula_sent_date: p.notula_sent_date || new Date().toISOString().split('T')[0], notula_status: 'da_pagare' });
                            }));
                            markPayoutDirty(payout.id);
                          }}
                          disabled={!issueDate || status === 'pagata'}
                          style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                          title={!issueDate ? `Inserisci prima la data emissione ${documentLabel.toLowerCase()}` : status === 'pagata' ? 'Payout già pagato' : isFattura ? 'Segna fattura ricevuta e passa in stato da pagare' : 'Segna notula inviata e passa in stato da pagare'}
                        >
                          {isFattura ? 'Segna fattura ricevuta (da pagare)' : 'Segna notula inviata (da pagare)'}
                        </button>

                        {isDirty && (
                          <button
                            onClick={() => handleSaveCoachPayout(payout.id)}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', gap: '0.375rem' }}
                          >
                            <Save size={14} /> Salva payout
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <DrawerAddButton onClick={() => {
              const newPayout = createDefaultCoachPayout(service.id);
              setLocalCoachPayouts(prev => [...prev, newPayout]);
              markPayoutDirty(newPayout.id);
              toast.success('Payout aggiunto. Premi Salva per registrarlo');
            }}>
              <Plus size={14} /> Aggiungi payout coach
            </DrawerAddButton>
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