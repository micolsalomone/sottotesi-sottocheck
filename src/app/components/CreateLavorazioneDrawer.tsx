import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Briefcase, Mail, MessageCircle, Phone,
  CheckCircle, Circle, Search, TrendingUp, GraduationCap, User, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLavorazioni, REFERENTI_SOTTOTESI, SERVICE_CATALOG } from '../data/LavorazioniContext';
import type { StudentService, Pipeline, Student, StudentAcademicRecord, Quote } from '../data/LavorazioniContext';
import { useAreeTematiche } from '../data/AreeTematicheContext';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  DrawerFieldGroup,
  DrawerLabel,
  DrawerMicroLabel,
  DrawerReadonlyRow,
  DrawerInfoNote,
  DrawerAcademicSnippet,
  DrawerEmptyState,
  drawerInputStyle,
  drawerSelectStyle,
  drawerLabelStyle,
  drawerSectionTitleStyle,
  drawerMicroLabelStyle,
  drawerReadonlyValueStyle,
  drawerReadonlyEmptyStyle,
} from './DrawerPrimitives';

const CURRENT_ADMIN = 'Francesca';

interface CreateLavorazioneDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledPipeline?: Pipeline;
}

const PIPELINE_SERVICE_TO_SERVICE_ID: Record<string, string> = {
  starter_pack: 'SRV-001',
  coaching: 'SRV-002',
  coaching_plus: 'SRV-003',
};

const resolveServiceIdFromPipeline = (pipeline?: Pipeline | null): string => {
  if (!pipeline?.service_link) return '';
  const directMatch = SERVICE_CATALOG.find(s => s.id === pipeline.service_link);
  if (directMatch) return directMatch.id;
  return PIPELINE_SERVICE_TO_SERVICE_ID[pipeline.service_link] || '';
};

// ─── Read-only contact block ──────────────────────────────────
function ContactBlock({ pipeline }: { pipeline: Pipeline }) {
  const allEmails = [pipeline.email, ...(pipeline.emails || [])];
  const allPhones = [pipeline.phone, ...(pipeline.phones || [])];
  const consents = pipeline.marketing_consents || {};

  const contactCardStyle = (isPrimary: boolean): React.CSSProperties => ({
    padding: '0.625rem 0.75rem',
    backgroundColor: isPrimary ? 'var(--muted)' : 'var(--background)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  });

  const consentBadge = (key: string) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        marginTop: '0.375rem',
      }}
    >
      {consents[key]
        ? <CheckCircle size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        : <Circle size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          lineHeight: '1.5',
          color: consents[key] ? 'var(--primary)' : 'var(--muted-foreground)',
        }}
      >
        {consents[key] ? 'Consenso marketing' : 'Nessun consenso'}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {allEmails.map((email, idx) => (
        <div key={email} style={contactCardStyle(idx === 0)}>
          <DrawerMicroLabel>{idx === 0 ? 'Email principale' : 'Email aggiuntiva'}</DrawerMicroLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                ...drawerReadonlyValueStyle,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </span>
            <button
              type="button"
              onClick={() => window.open(`mailto:${email}`, '_blank')}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
              title="Invia email"
            >
              <Mail size={13} />
            </button>
          </div>
          {consentBadge(email)}
        </div>
      ))}

      <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

      {allPhones.filter(Boolean).map((phone, idx) => (
        <div key={phone} style={contactCardStyle(idx === 0)}>
          <DrawerMicroLabel>{idx === 0 ? 'Telefono principale' : 'Telefono aggiuntivo'}</DrawerMicroLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ ...drawerReadonlyValueStyle, flex: 1 }}>{phone}</span>
            <button
              type="button"
              onClick={() => window.open(`https://wa.me/${phone.replace(/[^\d+]/g, '')}`, '_blank')}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
              title="WhatsApp"
            >
              <MessageCircle size={13} />
            </button>
            <button
              type="button"
              onClick={() => window.open(`tel:${phone}`, '_blank')}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
              title="Chiama"
            >
              <Phone size={13} />
            </button>
          </div>
          {consentBadge(phone)}
        </div>
      ))}
    </div>
  );
}

// ─── Read-only academic record block ─────────────────────────
// RIMOSSO: sostituito da DrawerAcademicSnippet (DrawerPrimitives)

const getQuoteLifecycleLabel = (quote: Quote): 'Bozza' | 'Inviato' | 'Accettato' | 'Pagato' | 'In scadenza' | 'Scaduto' => {
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

function QuoteCard({ quote, isLinked }: { quote: Quote; isLinked: boolean }) {
  const fmt = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const lifecycleLabel = getQuoteLifecycleLabel(quote);
  const statusBg = lifecycleLabel === 'Accettato' || lifecycleLabel === 'Pagato'
    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
    : lifecycleLabel === 'Scaduto'
      ? 'color-mix(in srgb, var(--destructive-foreground) 10%, transparent)'
      : lifecycleLabel === 'In scadenza'
        ? 'color-mix(in srgb, var(--chart-3) 10%, transparent)'
        : 'var(--muted)';

  const statusColor = lifecycleLabel === 'Accettato' || lifecycleLabel === 'Pagato'
    ? 'var(--primary)'
    : lifecycleLabel === 'Scaduto'
      ? 'var(--destructive-foreground)'
      : lifecycleLabel === 'In scadenza'
        ? 'var(--chart-3)'
        : 'var(--muted-foreground)';

  const statusLabel = lifecycleLabel.toUpperCase();

  return (
    <div style={{
      padding: '0.625rem',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      background: isLinked
        ? 'color-mix(in srgb, var(--primary) 6%, transparent)'
        : 'var(--muted)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            lineHeight: '1.5',
          }}>
            {quote.number}
          </span>
          {isLinked && (
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
          backgroundColor: statusBg,
          color: statusColor,
          fontWeight: 'var(--font-weight-semibold)',
          textTransform: 'uppercase',
          lineHeight: '1.6',
        }}>
          {statusLabel}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        color: 'var(--muted-foreground)',
        marginTop: '0.25rem',
        lineHeight: '1.5',
      }}>
        {typeof quote.amount_gross === 'number' && quote.amount_gross > 0
          ? `Lordo €${quote.amount_gross.toLocaleString('it-IT')} · `
          : ''}
        {quote.sent_at ? `Inviato il ${fmt(quote.sent_at)}` : 'Non ancora inviato'}
        {quote.expires_at && ` · Scad. ${fmt(quote.expires_at)}`}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export function CreateLavorazioneDrawer({
  open,
  onOpenChange,
  prefilledPipeline,
}: CreateLavorazioneDrawerProps) {
  const { addService, data, updatePipeline, addStudent, students, pipelines } = useLavorazioni();
  const { aree } = useAreeTematiche();

  // ── Pipeline selection ──
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(prefilledPipeline?.id || '');
  const [showPipelinePicker, setShowPipelinePicker] = useState(false);

  const selectedPipeline: Pipeline | null = useMemo(
    () => pipelines.find(p => p.id === selectedPipelineId) || null,
    [pipelines, selectedPipelineId]
  );

  // Existing student for this pipeline (if already converted before)
  const existingStudent: Student | null = useMemo(
    () => (selectedPipeline ? (students.find(s => s.id === selectedPipeline.student_id) || null) : null),
    [selectedPipeline, students]
  );

  // ── Form data (operational only) ──
  const [formData, setFormData] = useState({
    service_id: '',
    referente: '',
    area_tematica: '',
    plan_start_date: '',
    plan_end_date: '',
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedPipelineId(prefilledPipeline?.id || '');
      setPipelineSearch('');
      setShowPipelinePicker(false);
      setFormData({
        service_id: resolveServiceIdFromPipeline(prefilledPipeline),
        referente: '',
        area_tematica: '',
        plan_start_date: '',
        plan_end_date: '',
      });
    }
  }, [open, prefilledPipeline]);

  useEffect(() => {
    if (!open || !selectedPipeline) return;
    const autoServiceId = resolveServiceIdFromPipeline(selectedPipeline);
    if (!autoServiceId) return;
    setFormData(prev => (prev.service_id === autoServiceId ? prev : { ...prev, service_id: autoServiceId }));
  }, [open, selectedPipeline]);

  // ── Filtered pipelines for picker ──
  const filteredPipelines = useMemo(() => {
    const q = pipelineSearch.toLowerCase();
    return pipelines.filter(
      p =>
        p.student_name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [pipelines, pipelineSearch]);

  // ── Submit ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPipeline) {
      toast.error('Seleziona una pipeline');
      return;
    }
    if (!formData.service_id || !formData.referente) {
      toast.error('Seleziona Servizio e Referente');
      return;
    }

    const selectedService = SERVICE_CATALOG.find(s => s.id === formData.service_id);
    if (!selectedService) return;

    const maxLavId = data.reduce((max, s) => {
      const num = parseInt(s.id.replace('SS-', ''));
      return num > max ? num : max;
    }, 0);
    const newLavId = `SS-${maxLavId + 1}`;
    
    // Cerco se c'è un preventivo accettato nella pipeline
    const acceptedQuote = selectedPipeline.quotes?.find(q => q.status === 'accepted');
    const quoteId = acceptedQuote ? acceptedQuote.id : `QT-${Math.floor(Math.random() * 900) + 100}`;

    // ── Preparo l'ID del record accademico da linkare sulla lavorazione ──
    // Per nuovo studente: genera ID ora, usato sia per StudentService che per StudentAcademicRecord.
    // Per studente esistente: usa il record corrente se disponibile.
    const today = new Date().toISOString().split('T')[0];
    const newAcademicRecordId = !existingStudent
      ? `AR-${Math.floor(Math.random() * 9000) + 1000}`
      : undefined;
    const existingAcademicRecordId = existingStudent
      ? (existingStudent.academic_records?.find(r => r.is_current)?.id || existingStudent.academic_records?.[0]?.id)
      : undefined;
    const linkedAcademicRecordId = newAcademicRecordId ?? existingAcademicRecordId;

    const newLavorazione: StudentService = {
      id: newLavId,
      student_id: selectedPipeline.student_id,
      student_name: selectedPipeline.student_name,
      service_id: formData.service_id,
      service_name: selectedService.name,
      service_category: selectedService.category,
      quote_id: quoteId,
      status: 'pending_payment',
      created_at: new Date().toISOString().split('T')[0],
      created_by: CURRENT_ADMIN,
      referente: formData.referente,
      area_tematica: formData.area_tematica || undefined,
      plan_start_date: formData.plan_start_date || undefined,
      plan_end_date: formData.plan_end_date || undefined,
      installments: [],
      pipeline_id: selectedPipeline.id,
      academic_record_id: linkedAcademicRecordId,
    };

    addService(newLavorazione);

    // Auto-crea profilo studente se non esiste ancora.
    // Lo studente nasce QUI, al momento della conversione Pipeline → Lavorazione.
    // I dati accademici vengono prelevati da pipeline.academic_data se disponibili.
    if (!existingStudent && newAcademicRecordId) {
      const ad = selectedPipeline.academic_data;
      const newAcademicRecord: StudentAcademicRecord = {
        id: newAcademicRecordId,
        student_id: selectedPipeline.student_id,
        degree_level: ad?.degree_level || '',
        course_name: ad?.course_name || '',
        university_name: ad?.university_name || '',
        thesis_professor: ad?.thesis_professor || '',
        thesis_subject: ad?.thesis_subject || '',
        foreign_language: ad?.foreign_language || false,
        thesis_language: ad?.thesis_language || '',
        thesis_type: ad?.thesis_type || '',
        is_current: true,
        created_at: today,
        updated_at: today,
      };

      // Costruisce il campo contacts dal pipeline (email/telefoni principali + aggiuntivi)
      const pipelineSource = `pipeline:${selectedPipeline.id}`;
      const contactEmails = [
        {
          email: selectedPipeline.email,
          is_primary: true,
          purposes: ['generic', 'service_access'] as ('generic' | 'service_access')[],
          source: pipelineSource,
          added_at: today,
        },
        ...(selectedPipeline.emails || []).map(email => ({
          email,
          is_primary: false,
          purposes: ['generic'] as ('generic' | 'service_access')[],
          source: pipelineSource,
          added_at: today,
        })),
      ];
      const contactPhones = [
        ...(selectedPipeline.phone ? [{
          phone: selectedPipeline.phone,
          is_primary: true,
          purposes: ['communications'] as ('communications' | 'coaching')[],
          source: pipelineSource,
          added_at: today,
        }] : []),
        ...(selectedPipeline.phones || []).map(phone => ({
          phone,
          is_primary: false,
          purposes: ['communications'] as ('communications' | 'coaching')[],
          source: pipelineSource,
          added_at: today,
        })),
      ];

      const newStudent: Student = {
        id: selectedPipeline.student_id,
        name: selectedPipeline.student_name,
        first_name: selectedPipeline.first_name,
        last_name: selectedPipeline.last_name,
        email: selectedPipeline.email,
        phone: selectedPipeline.phone || '',
        contacts: {
          emails: contactEmails,
          phones: contactPhones,
        },
        status: 'active',
        marketing_consent: (selectedPipeline.marketing_consents && selectedPipeline.marketing_consents[selectedPipeline.email]) || false,
        academic_records: [newAcademicRecord],
        created_at: new Date().toISOString().split('T')[0],
      };

      addStudent(newStudent);
    }

    // Aggiorna pipeline
    updatePipeline(selectedPipeline.id, p => ({
      ...p,
      lavorazioni_ids: [...p.lavorazioni_ids, newLavId],
    }));

    toast.success('Lavorazione creata');
    onOpenChange(false);
    setFormData({ service_id: '', referente: '', area_tematica: '', plan_start_date: '', plan_end_date: '' });
  };

  if (!open) return null;

  return (
    <>
      <DrawerOverlay onClose={() => onOpenChange(false)} />

      <DrawerShell>
        <DrawerHeader
          icon={<Briefcase size={20} />}
          title="Nuova Lavorazione"
          subtitle={selectedPipeline ? `${selectedPipeline.student_name} · ${selectedPipeline.id}` : undefined}
          onClose={() => onOpenChange(false)}
        />

        <DrawerBody>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* ── 1. Pipeline ── */}
            <DrawerSection title="Pipeline" bordered={false}>
              {selectedPipeline ? (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <TrendingUp size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}
                    >
                      {selectedPipeline.student_name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}
                    >
                      {selectedPipeline.id} · {selectedPipeline.email}
                      {existingStudent && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}>
                          · Studente attivo
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPipelineId(''); setShowPipelinePicker(true); }}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.625rem', flexShrink: 0 }}
                  >
                    Cambia
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPipelinePicker(v => !v)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }}
                >
                  <Search size={15} />
                  Seleziona una pipeline…
                </button>
              )}

              {/* Picker */}
              {showPipelinePicker && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--card)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.625rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '0.5rem',
                          color: 'var(--muted-foreground)',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        value={pipelineSearch}
                        onChange={e => setPipelineSearch(e.target.value)}
                        placeholder="Cerca nome, ID, email…"
                        autoFocus
                        style={{ ...drawerInputStyle, paddingLeft: '2rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {filteredPipelines.length === 0 ? (
                      <div
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}
                      >
                        Nessuna pipeline trovata
                      </div>
                    ) : (
                      filteredPipelines.map(p => {
                        const isStudent = (p.lavorazioni_ids.length > 0 || p.linked_existing_student === true);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPipelineId(p.id);
                              setShowPipelinePicker(false);
                              setPipelineSearch('');
                            }}
                            style={{
                              width: '100%',
                              padding: '0.625rem 1rem',
                              background: 'none',
                              border: 'none',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.125rem',
                            }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--muted)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: 'var(--text-label)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--foreground)',
                                  lineHeight: '1.5',
                                }}
                              >
                                {p.student_name}
                              </span>
                              {isStudent ? (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '10px',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--primary)',
                                    lineHeight: '1.6',
                                    border: '1px solid var(--primary)',
                                    borderRadius: 'var(--radius-badge)',
                                    padding: '0 0.375rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  Studente
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '10px',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--muted-foreground)',
                                    lineHeight: '1.6',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-badge)',
                                    padding: '0 0.375rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  Lead
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '11px',
                                color: 'var(--muted-foreground)',
                                lineHeight: '1.5',
                              }}
                            >
                              {p.id} · {p.email}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => { setShowPipelinePicker(false); setPipelineSearch(''); }}
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </DrawerSection>

            {/* ── 2. Contatti (read-only) ── */}
            {selectedPipeline && (
              <DrawerSection
                title="Contatti"
                icon={<User size={14} />}
                hint="Gestisci da Pipeline"
              >
                <ContactBlock pipeline={selectedPipeline} />
              </DrawerSection>
            )}

            {/* ── 3. Dati accademici (read-only) ── */}
            {selectedPipeline && (
              <DrawerSection
                title="Dati accademici"
                icon={<GraduationCap size={14} />}
                hint={existingStudent ? 'Gestisci da Studenti' : undefined}
              >
                <DrawerAcademicSnippet
                  record={
                    existingStudent
                      ? (existingStudent.academic_records?.find(r => r.is_current) ?? existingStudent.academic_records?.[0])
                      : selectedPipeline.academic_data
                  }
                  emptyMessage="Nessun dato accademico — da completare nella sezione Studenti dopo la creazione."
                />
              </DrawerSection>
            )}

            {/* ── 4. Preventivi (read-only) ── */}
            {selectedPipeline && (
              <DrawerSection
                title="Preventivi"
                icon={<FileText size={14} />}
                hint="Gestisci da Pipeline"
              >
                {selectedPipeline.quotes && selectedPipeline.quotes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedPipeline.quotes.map(quote => {
                      const acceptedQuote = selectedPipeline.quotes?.find(q => q.status === 'accepted');
                      const isLinked = !!acceptedQuote && quote.id === acceptedQuote.id;
                      return <QuoteCard key={quote.id} quote={quote} isLinked={isLinked} />;
                    })}
                    {!selectedPipeline.quotes.some(q => q.status === 'accepted') && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'color-mix(in srgb, var(--chart-3) 8%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--chart-3) 25%, transparent)',
                        marginTop: '0.25rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--chart-3)', lineHeight: '1.5' }}>
                          Nessun preventivo accettato — verrà generato un ID preventivo automatico alla creazione.
                        </span>
                      </div>
                    )}
                  </div>
                ) : selectedPipeline.quote_sent ? (
                  <div style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid color-mix(in srgb, var(--chart-2) 30%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--chart-2) 8%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <FileText size={14} style={{ color: 'var(--chart-2)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--chart-2)', lineHeight: '1.5' }}>
                      Preventivo inviato
                    </span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      (dati dettaglio non disponibili — legacy)
                    </span>
                  </div>
                ) : (
                  <DrawerEmptyState>Nessun preventivo registrato per questa pipeline</DrawerEmptyState>
                )}
              </DrawerSection>
            )}

            {/* ── 5. Dettagli operativi ── */}
            {selectedPipeline && (
              <DrawerSection title="Dettagli operativi">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DrawerFieldGroup>
                    <DrawerLabel required>Servizio</DrawerLabel>
                    <select
                      value={formData.service_id}
                      onChange={e => setFormData(prev => ({ ...prev, service_id: e.target.value }))}
                      required
                      style={drawerSelectStyle}
                    >
                      <option value="">Seleziona servizio</option>
                      {SERVICE_CATALOG.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} (€{service.defaultPrice})
                        </option>
                      ))}
                    </select>
                  </DrawerFieldGroup>

                  <DrawerFieldGroup>
                    <DrawerLabel required>Referente Sottotesi</DrawerLabel>
                    <select
                      value={formData.referente}
                      onChange={e => setFormData(prev => ({ ...prev, referente: e.target.value }))}
                      required
                      style={drawerSelectStyle}
                    >
                      <option value="">Seleziona referente</option>
                      {REFERENTI_SOTTOTESI.map(ref => (
                        <option key={ref.id} value={ref.name}>{ref.name}</option>
                      ))}
                    </select>
                  </DrawerFieldGroup>

                  <DrawerFieldGroup>
                    <DrawerLabel>Area tematica</DrawerLabel>
                    <select
                      value={formData.area_tematica}
                      onChange={e => setFormData(prev => ({ ...prev, area_tematica: e.target.value }))}
                      style={drawerSelectStyle}
                    >
                      <option value="">Nessuna area</option>
                      {aree.map(area => (
                        <option key={area.id} value={area.name}>{area.name}</option>
                      ))}
                    </select>
                  </DrawerFieldGroup>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <DrawerFieldGroup style={{ marginBottom: 0 }}>
                      <DrawerLabel>Inizio piano</DrawerLabel>
                      <input
                        type="date"
                        value={formData.plan_start_date}
                        onChange={e => setFormData(prev => ({ ...prev, plan_start_date: e.target.value }))}
                        style={drawerInputStyle}
                      />
                    </DrawerFieldGroup>
                    <DrawerFieldGroup style={{ marginBottom: 0 }}>
                      <DrawerLabel>Scadenza piano</DrawerLabel>
                      <input
                        type="date"
                        value={formData.plan_end_date}
                        onChange={e => setFormData(prev => ({ ...prev, plan_end_date: e.target.value }))}
                        style={drawerInputStyle}
                      />
                    </DrawerFieldGroup>
                  </div>
                </div>
              </DrawerSection>
            )}

            {/* Note informativa creazione studente automatica */}
            {selectedPipeline && !existingStudent && (
              <DrawerInfoNote>
                Verrà creato automaticamente un profilo studente da questa pipeline.
                I dati accademici potranno essere completati nella sezione Studenti.
              </DrawerInfoNote>
            )}

            {/* Footer inline nel form (per submit) */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenChange(false)}
                style={{ flex: 1 }}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!selectedPipeline}
              >
                <Plus size={18} />
                Crea Lavorazione
              </button>
            </div>
          </form>
        </DrawerBody>
      </DrawerShell>
    </>
  );
}