import React, { useState, useEffect } from 'react';
import {
  ExternalLink, Plus, TrendingUp, Mail, MessageCircle,
  Phone, Pencil, Save, Trash2, CheckCircle, Circle,
  GraduationCap, ChevronRight, AlertTriangle,
  User, FileText, Tag, Settings2, Hash, X,
} from 'lucide-react';


import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useLavorazioni, ADMIN_USERS, SERVICE_CATALOG } from '../data/LavorazioniContext';
import type { Pipeline, Quote, QuoteStatus, DegreeLevel, ThesisType } from '../data/LavorazioniContext';

const CURRENT_ADMIN = 'Francesca';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCollapsibleSection,
  DrawerEmptyState,
  DrawerChip,
  DrawerMicroLabel,
  DrawerAddButton,
  DrawerLinkedServiceCard,
  DrawerAcademicSnippet,
  DrawerInfoNote,
  DrawerMetaRow,
  DRAWER_WIDTH_DEFAULT,
  drawerInputStyle,
  drawerSelectStyle,
  DrawerSearchSelect,
} from './DrawerPrimitives';

// ─── Helpers ──────────────────────────────────────────────────
const fmtTimestamp = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Service link label map ────────────────────────────────────
const SERVICE_LINK_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
  starter_pack: 'Starter Pack',
  check_plagio: 'Check plagio/AI',
  'SRV-001': 'Starter Pack',
  'SRV-002': 'Coaching',
  'SRV-003': 'Coaching Plus',
};

const SERVICE_LINK_OPTIONS: { value: string; label: string }[] = SERVICE_CATALOG.map((service) => {
  if (service.name === 'Starter Pack') return { value: 'starter_pack', label: service.name };
  if (service.name === 'Coaching Plus') return { value: 'coaching_plus', label: service.name };
  if (service.name === 'Coaching') return { value: 'coaching', label: service.name };
  return { value: service.id, label: service.name };
});

// ─── Costanti dati accademici ──────────────────────────────────
const DEGREE_LEVELS: { value: DegreeLevel; label: string }[] = [
  { value: 'triennale', label: 'Triennale' },
  { value: 'magistrale', label: 'Magistrale' },
  { value: 'ciclo_unico', label: 'A ciclo unico' },
  { value: 'master', label: 'Master' },
  { value: 'dottorato', label: 'Dottorato' },
];

const THESIS_TYPES: { value: ThesisType; label: string }[] = [
  { value: 'compilativa', label: 'Compilativa' },
  { value: 'sperimentale', label: 'Sperimentale' },
];

interface PipelineDetailDrawerProps {
  pipeline: Pipeline;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToLavorazione: (pipeline: Pipeline, quoteId?: string) => void;
  onOpenStudentProfile?: (studentId: string) => void;
}

// ─── Stile save button (riusato in tutto il drawer) ───────────
const saveBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  border: 'none',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

// ─── Label micro uppercase ─────────────────────────────────────
const microLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '11px',
  fontWeight: 'var(--font-weight-medium)',
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};


export function PipelineDetailDrawer({
  pipeline, open, onOpenChange, onConvertToLavorazione, onOpenStudentProfile,
}: PipelineDetailDrawerProps) {
  const navigate = useNavigate();
  const { data, updatePipeline, sources, communicationChannels, students, addCommunicationChannel } = useLavorazioni();

  const lavorazioniCollegate = data.filter(l => pipeline.lavorazioni_ids.includes(l.id));

  // ─── Risoluzione studente collegato ───────────────────────
  // Un linkedStudent è valido SOLO se:
  //   1. la pipeline è stata convertita in almeno una lavorazione, OPPURE
  //   2. è un re-enrollment esplicito (linked_existing_student = true).
  // In tutti gli altri casi student_id è solo un ID temporaneo del lead
  // e non deve essere usato per cercare uno studente in anagrafica.
  const isConverted = pipeline.lavorazioni_ids.length > 0;
  const isReenrollment = pipeline.linked_existing_student === true;
  const linkedStudent = (isConverted || isReenrollment)
    ? students.find(s => s.id === pipeline.student_id)
    : undefined;

  // ─── Sections collapsible ─────────────────────────────────
  const [sections, setSections] = useState({
    anagrafica: true,
    profilo: true,
    email: true,
    telefoni: false,
    fonti: true,
    doveciparliamo: true,
    incarichi: true,
    operativo: true,
    preventivi: true,
    note: true,
    lavorazioni: true,
    riferimenti: false,
  });
  const toggleSection = (key: keyof typeof sections) =>
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Local editing state ───────────────────────────────────
  const [editingField, setEditingField] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(pipeline.first_name);
  const [lastName, setLastName] = useState(pipeline.last_name);
  const [primaryEmail, setPrimaryEmail] = useState(pipeline.email);
  const [primaryPhone, setPrimaryPhone] = useState(pipeline.phone);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>(pipeline.emails || []);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(pipeline.phones || []);
  const [pipelineSources, setPipelineSources] = useState<string[]>(pipeline.sources);
  const [pipelineChannels, setPipelineChannels] = useState<string[]>(
    pipeline.communication_channels || (pipeline.communication_channel ? [pipeline.communication_channel] : [])
  );
  const [assignedTo, setAssignedTo] = useState<string[]>(pipeline.assigned_to || []);
  const [serviceLink, setServiceLink] = useState(pipeline.service_link || '');
  const [externalLink, setExternalLink] = useState(pipeline.external_link || '');
  const [notes, setNotes] = useState(pipeline.notes || '');
  const [createdAt, setCreatedAt] = useState(pipeline.created_at);
  const [quotes, setQuotes] = useState<Quote[]>(pipeline.quotes || []);
  const [dirtyQuoteIds, setDirtyQuoteIds] = useState<Set<string>>(new Set());
  const [selectedQuoteForConversion, setSelectedQuoteForConversion] = useState<string | null>(null);
  const [marketingConsents, setMarketingConsents] = useState<Record<string, boolean>>(
    pipeline.marketing_consents || {}
  );
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [editingConsent, setEditingConsent] = useState<string | null>(null);

  // ─── Stato editing info operative ─────────────────────────
  const [isEditingOperativo, setIsEditingOperativo] = useState(false);

  // ─── Stato editing dati accademici preliminari ─────────────
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [academicData, setAcademicData] = useState<NonNullable<Pipeline['academic_data']>>(
    pipeline.academic_data ?? {}
  );
  const handleAcademicChange = <K extends keyof NonNullable<Pipeline['academic_data']>>(
    key: K, value: NonNullable<Pipeline['academic_data']>[K]
  ) => setAcademicData(prev => ({ ...prev, [key]: value }));

  const handleSaveOperativo = () => {
    updatePipeline(pipeline.id, (p) => ({
      ...p,
      assigned_to: assignedTo,
      service_link: serviceLink,
      external_link: externalLink,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
      updated_by: CURRENT_ADMIN,
    }));
    toast.success('Info operative aggiornate');
    setIsEditingOperativo(false);
  };

  // ─── Quote dirty tracking ──────────────────────────────────
  const markQuoteDirty = (quoteId: string) => {
    setDirtyQuoteIds((prev) => {
      const next = new Set(prev);
      next.add(quoteId);
      return next;
    });
  };

  const clearQuoteDirty = (quoteId: string) => {
    setDirtyQuoteIds((prev) => {
      const next = new Set(prev);
      next.delete(quoteId);
      return next;
    });
  };

  const handleSaveQuote = (quoteId: string) => {
    updatePipeline(pipeline.id, (p) => ({
      ...p,
      quotes: quotes.length > 0 ? quotes : undefined,
      quote_sent: quotes.some(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'paid'),
      updated_at: new Date().toISOString(),
      updated_by: CURRENT_ADMIN,
    }));
    clearQuoteDirty(quoteId);
    toast.success('Preventivo salvato');
  };

  const handleAddChannel = (ch: string) => {
    if (!pipelineChannels.includes(ch)) {
      const updated = [...pipelineChannels, ch];
      setPipelineChannels(updated);
      updatePipeline(pipeline.id, (p) => ({ ...p, communication_channels: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
      toast.success('Canale aggiunto');
    }
  };

  const handleRemoveChannel = (ch: string) => {
    const updated = pipelineChannels.filter(c => c !== ch);
    setPipelineChannels(updated);
    updatePipeline(pipeline.id, (p) => ({ ...p, communication_channels: updated.length > 0 ? updated : undefined, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Canale rimosso');
  };

  const handleAddAssignee = (assignee: string) => {
    if (!assignedTo.includes(assignee)) {
      const updated = [...assignedTo, assignee];
      setAssignedTo(updated);
      updatePipeline(pipeline.id, (p) => ({ ...p, assigned_to: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
      toast.success('Incarico aggiunto');
    }
  };

  const handleRemoveAssignee = (assignee: string) => {
    const updated = assignedTo.filter(a => a !== assignee);
    setAssignedTo(updated);
    updatePipeline(pipeline.id, (p) => ({ ...p, assigned_to: updated.length > 0 ? updated : undefined, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Incarico rimosso');
  };

  const handleSaveAcademicData = () => {
    updatePipeline(pipeline.id, (p) => ({ ...p, academic_data: academicData, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Dati accademici aggiornati');
    setIsEditingAcademic(false);
  };

  useEffect(() => {
    if (open) {
      setFirstName(pipeline.first_name);
      setLastName(pipeline.last_name);
      setPrimaryEmail(pipeline.email);
      setPrimaryPhone(pipeline.phone);
      setAdditionalEmails(pipeline.emails || []);
      setAdditionalPhones(pipeline.phones || []);
      setPipelineSources(pipeline.sources);
      setPipelineChannels(pipeline.communication_channels || (pipeline.communication_channel ? [pipeline.communication_channel] : []));
      setAssignedTo(pipeline.assigned_to || []);
      setServiceLink(pipeline.service_link || '');
      setExternalLink(pipeline.external_link || '');
      setNotes(pipeline.notes || '');
      setCreatedAt(pipeline.created_at);
      setQuotes(pipeline.quotes || []);
      setDirtyQuoteIds(new Set());
      const eligible = (pipeline.quotes || []).filter(q => q.status === 'paid');
      setSelectedQuoteForConversion(eligible[0]?.id || (pipeline.quotes || [])[0]?.id || null);
      setMarketingConsents(pipeline.marketing_consents || {});
      setEditingField(null);

      setEditingConsent(null);
      setAcademicData(pipeline.academic_data ?? {});
      setIsEditingAcademic(false);
      setIsEditingOperativo(false);
    }
  }, [open, pipeline]);

  const eligibleQuotes = quotes.filter(q => q.status === 'paid');
  const alreadyConvertedQuoteIds = new Set(
    data
      .filter((service) => service.pipeline_id === pipeline.id && service.quote_id)
      .map((service) => service.quote_id as string)
  );
  const convertibleQuotes = eligibleQuotes.filter((quote) => !alreadyConvertedQuoteIds.has(quote.id));
  const canConvertSelected = convertibleQuotes.length === 1
    ? true
    : (!!selectedQuoteForConversion && convertibleQuotes.some((q) => q.id === selectedQuoteForConversion));

  useEffect(() => {
    if (convertibleQuotes.length === 0) {
      return;
    }
    if (!selectedQuoteForConversion || !convertibleQuotes.some(q => q.id === selectedQuoteForConversion)) {
      setSelectedQuoteForConversion(convertibleQuotes[0].id);
    }
  }, [convertibleQuotes, selectedQuoteForConversion]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleSave = (field: string) => {
    updatePipeline(pipeline.id, (p) => ({
      ...p,
      first_name: firstName,
      last_name: lastName,
      student_name: `${firstName} ${lastName}`,
      email: primaryEmail,
      phone: primaryPhone,
      emails: additionalEmails.length > 0 ? additionalEmails : undefined,
      phones: additionalPhones.length > 0 ? additionalPhones : undefined,
      sources: pipelineSources,
      communication_channels: pipelineChannels.length > 0 ? pipelineChannels : undefined,
      assigned_to: assignedTo.length > 0 ? assignedTo : undefined,
      quote_sent: quotes.some(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'paid'),
      service_link: serviceLink,
      external_link: externalLink,
      created_at: createdAt,
      quotes: quotes.length > 0 ? quotes : undefined,
      notes: notes || undefined,
      marketing_consents: marketingConsents,
      updated_at: new Date().toISOString(),
      updated_by: CURRENT_ADMIN,
    }));
    toast.success('Modifiche salvate');
    setEditingField(null);
  };

  const handleAddSource = (source: string) => {
    if (!pipelineSources.includes(source)) {
      const updated = [...pipelineSources, source];
      setPipelineSources(updated);
      updatePipeline(pipeline.id, (p) => ({ ...p, sources: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
      toast.success('Fonte aggiunta');
    }
  };

  const handleRemoveSource = (source: string) => {
    if (pipelineSources.length === 1) { toast.error('Deve esserci almeno una fonte'); return; }
    const updated = pipelineSources.filter(s => s !== source);
    setPipelineSources(updated);
    updatePipeline(pipeline.id, (p) => ({ ...p, sources: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Fonte rimossa');
  };

  const handleAddEmail = () => {
    if (newEmail.trim() && !additionalEmails.includes(newEmail.trim())) {
      const updated = [...additionalEmails, newEmail.trim()];
      setAdditionalEmails(updated);
      setNewEmail('');
      updatePipeline(pipeline.id, (p) => ({ ...p, emails: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
      toast.success('Email aggiunta');
    }
  };

  const handleRemoveEmail = (email: string) => {
    const updated = additionalEmails.filter(e => e !== email);
    setAdditionalEmails(updated);
    updatePipeline(pipeline.id, (p) => ({ ...p, emails: updated.length > 0 ? updated : undefined, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Email rimossa');
  };

  const handleAddPhone = () => {
    if (newPhone.trim() && !additionalPhones.includes(newPhone.trim())) {
      const updated = [...additionalPhones, newPhone.trim()];
      setAdditionalPhones(updated);
      setNewPhone('');
      updatePipeline(pipeline.id, (p) => ({ ...p, phones: updated, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
      toast.success('Telefono aggiunto');
    }
  };

  const handleRemovePhone = (phone: string) => {
    const updated = additionalPhones.filter(p => p !== phone);
    setAdditionalPhones(updated);
    updatePipeline(pipeline.id, (p) => ({ ...p, phones: updated.length > 0 ? updated : undefined, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Telefono rimosso');
  };

  const saveConsent = () => {
    updatePipeline(pipeline.id, (p) => ({ ...p, marketing_consents: marketingConsents, updated_at: new Date().toISOString(), updated_by: CURRENT_ADMIN }));
    toast.success('Consenso marketing salvato');
    setEditingConsent(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (!open) return null;

  // ─── Consent row (riusabile) ──────────────────────────────
  const ConsentRow = ({ contactKey }: { contactKey: string }) => {
    if (editingConsent === contactKey) {
      return (
        <div style={{
          padding: '0.5rem 0.625rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.375rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
            <input
              type="checkbox"
              checked={marketingConsents[contactKey] || false}
              onChange={(e) => setMarketingConsents(prev => ({ ...prev, [contactKey]: e.target.checked }))}
              style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--foreground)', lineHeight: '1.5' }}>
              Consenso marketing
            </span>
          </label>
          <button onClick={saveConsent} style={saveBtnStyle} title="Salva consenso"><Save size={12} /></button>
        </div>
      );
    }
    return (
      <div
        onClick={() => setEditingConsent(contactKey)}
        style={{
          padding: '0.5rem 0.625rem',
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          marginTop: '0.375rem',
        }}
        title="Clicca per modificare consenso"
      >
        {marketingConsents[contactKey]
          ? <CheckCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          : <Circle size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
        <span style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          color: marketingConsents[contactKey] ? 'var(--primary)' : 'var(--muted-foreground)',
          lineHeight: '1.5',
          flex: 1,
          fontWeight: marketingConsents[contactKey] ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
        }}>
          {marketingConsents[contactKey] ? 'Consenso marketing attivo' : 'Nessun consenso marketing'}
        </span>
        <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
      </div>
    );
  };

  return (
    <>
      <DrawerOverlay onClose={() => onOpenChange(false)} />

      <DrawerShell width={DRAWER_WIDTH_DEFAULT}>
        <DrawerHeader
          icon={<TrendingUp size={20} />}
          title={`${firstName} ${lastName}`}
          subtitle={`Pipeline ${pipeline.id}`}
          onClose={() => onOpenChange(false)}
          actions={
            (isConverted || isReenrollment) ? (
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-badge)',
                padding: '0.125rem 0.5rem',
                lineHeight: '1.5',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                Studente
              </span>
            ) : (
              <span style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-badge)',
                padding: '0.125rem 0.5rem',
                lineHeight: '1.5',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                Lead
              </span>
            )
          }
        />

        <DrawerMetaRow>
          Ultimo aggiornamento: {pipeline.updated_by || '—'} — {pipeline.updated_at ? fmtTimestamp(pipeline.updated_at) : fmtTimestamp(pipeline.created_at)}
        </DrawerMetaRow>

        <DrawerBody padding="0">

          {/* ─── Anagrafica ─────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={User}
            title="Anagrafica"
            isOpen={sections.anagrafica}
            onToggle={() => toggleSection('anagrafica')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Nome */}
              <div>
                <div style={microLabelStyle}>Nome</div>
                {editingField === 'first_name' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave('first_name');
                        if (e.key === 'Escape') { setFirstName(pipeline.first_name); setEditingField(null); }
                      }}
                      style={{ ...drawerInputStyle, flex: 1 }}
                    />
                    <button onClick={() => handleSave('first_name')} style={saveBtnStyle}><Save size={14} /></button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingField('first_name')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    title="Clicca per modificare"
                  >
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{firstName}</span>
                    <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                  </div>
                )}
              </div>
              {/* Cognome */}
              <div>
                <div style={microLabelStyle}>Cognome</div>
                {editingField === 'last_name' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave('last_name');
                        if (e.key === 'Escape') { setLastName(pipeline.last_name); setEditingField(null); }
                      }}
                      style={{ ...drawerInputStyle, flex: 1 }}
                    />
                    <button onClick={() => handleSave('last_name')} style={saveBtnStyle}><Save size={14} /></button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingField('last_name')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    title="Clicca per modificare"
                  >
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{lastName}</span>
                    <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                  </div>
                )}
              </div>
            </div>
          </DrawerCollapsibleSection>

          {/* ─── Profilo Studente & Dati Accademici ─────── */}
          <DrawerCollapsibleSection
            icon={GraduationCap}
            title={(isConverted || isReenrollment) ? 'Profilo Studente & Dati Accademici' : 'Dati Accademici Preliminari'}
            isOpen={sections.profilo}
            onToggle={() => toggleSection('profilo')}
          >
            {linkedStudent ? (
              // ── Caso A: studente trovato in anagrafica ──────────────
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Link al profilo */}
                <div
                  onClick={() => {
                    if (onOpenStudentProfile) {
                      onOpenStudentProfile(linkedStudent.id);
                    } else {
                      onOpenChange(false);
                      navigate(`/studenti?id=${linkedStudent.id}`);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-bold)',
                    flexShrink: 0,
                  }}>
                    {linkedStudent.first_name[0]}{linkedStudent.last_name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {linkedStudent.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      ID Studente: {linkedStudent.id}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                </div>

                {/* Academic Records */}
                {linkedStudent.academic_records && linkedStudent.academic_records.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {linkedStudent.academic_records.map((record) => (
                      <div key={record.id} style={{ position: 'relative' }}>
                        {record.is_current && (
                          <span style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            padding: '0.125rem 0.375rem',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            borderRadius: 'var(--radius-badge)',
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-weight-bold)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            lineHeight: '1.5',
                            zIndex: 1,
                          }}>
                            Attuale
                          </span>
                        )}
                        <DrawerAcademicSnippet record={record} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <DrawerEmptyState>Nessun record accademico trovato per questo studente.</DrawerEmptyState>
                )}
              </div>
            ) : (isConverted || isReenrollment) ? (
              // ── Caso B: pipeline convertita ma studente non trovato (dato corrotto) ──
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--chart-3)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                    Profilo studente non collegato o non trovato.
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5', paddingLeft: '1.375rem' }}>
                  ID atteso: {pipeline.student_id}
                </span>
              </div>
            ) : (
              // ── Caso C: lead non ancora convertito — dati accademici preliminari (editabili) ──
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {isEditingAcademic ? (
                  /* ── Modalità modifica ── */
                  <div style={{
                    backgroundColor: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}>
                    {/* Livello + Tipo tesi */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={microLabelStyle}>Livello</label>
                        <select
                          value={academicData.degree_level ?? ''}
                          onChange={e => handleAcademicChange('degree_level', e.target.value as DegreeLevel)}
                          style={drawerSelectStyle}
                        >
                          <option value="">Seleziona...</option>
                          {DEGREE_LEVELS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={microLabelStyle}>Tipo tesi</label>
                        <select
                          value={academicData.thesis_type ?? ''}
                          onChange={e => handleAcademicChange('thesis_type', e.target.value as ThesisType)}
                          style={drawerSelectStyle}
                        >
                          <option value="">Seleziona...</option>
                          {THESIS_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Corso */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={microLabelStyle}>Corso di studi</label>
                      <input
                        type="text"
                        placeholder="es. Economia Aziendale"
                        value={academicData.course_name ?? ''}
                        onChange={e => handleAcademicChange('course_name', e.target.value)}
                        style={drawerInputStyle}
                      />
                    </div>

                    {/* Università */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={microLabelStyle}>Università</label>
                      <input
                        type="text"
                        placeholder="es. Università di Bologna"
                        value={academicData.university_name ?? ''}
                        onChange={e => handleAcademicChange('university_name', e.target.value)}
                        style={drawerInputStyle}
                      />
                    </div>

                    {/* Relatore */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={microLabelStyle}>Relatore tesi</label>
                      <input
                        type="text"
                        placeholder="es. Prof. Rossi"
                        value={academicData.thesis_professor ?? ''}
                        onChange={e => handleAcademicChange('thesis_professor', e.target.value)}
                        style={drawerInputStyle}
                      />
                    </div>

                    {/* Oggetto */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={microLabelStyle}>Oggetto tesi</label>
                      <input
                        type="text"
                        placeholder="es. L'impatto dell'AI nel marketing digitale"
                        value={academicData.thesis_topic ?? ''}
                        onChange={e => handleAcademicChange('thesis_topic', e.target.value)}
                        style={drawerInputStyle}
                      />
                    </div>

                    {/* Materia */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={microLabelStyle}>Materia di tesi</label>
                      <input
                        type="text"
                        placeholder="es. Marketing Strategico"
                        value={academicData.thesis_subject ?? ''}
                        onChange={e => handleAcademicChange('thesis_subject', e.target.value)}
                        style={drawerInputStyle}
                      />
                    </div>

                    {/* Lingua straniera */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      <input
                        type="checkbox"
                        checked={academicData.foreign_language ?? false}
                        onChange={e => handleAcademicChange('foreign_language', e.target.checked)}
                        style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      Tesi in lingua straniera
                    </label>

                    {academicData.foreign_language && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={microLabelStyle}>Lingua tesi</label>
                        <input
                          type="text"
                          placeholder="es. Inglese"
                          value={academicData.thesis_language ?? ''}
                          onChange={e => handleAcademicChange('thesis_language', e.target.value)}
                          style={drawerInputStyle}
                        />
                      </div>
                    )}

                    {/* Azioni */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                      <button
                        onClick={() => { setAcademicData(pipeline.academic_data ?? {}); setIsEditingAcademic(false); }}
                        className="btn btn-secondary"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleSaveAcademicData}
                        style={saveBtnStyle}
                      >
                        <Save size={14} /> Salva
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Modalità lettura ── */
                  <div style={{ position: 'relative' }}>
                    <DrawerAcademicSnippet
                      record={Object.keys(academicData).length > 0 ? academicData : null}
                      emptyMessage="Nessun dato accademico registrato per questo lead."
                    />
                    <button
                      onClick={() => setIsEditingAcademic(true)}
                      title="Modifica dati accademici"
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--muted-foreground)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
                <DrawerInfoNote>
                  Lo studente verrà creato automaticamente alla prima lavorazione.
                </DrawerInfoNote>
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Email ──────────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={Mail}
            title="Email"
            badge={`${1 + additionalEmails.length}`}
            isOpen={sections.email}
            onToggle={() => toggleSection('email')}
          >
            {/* Email principale */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
              <div style={microLabelStyle}>Email principale</div>
              {editingField === 'primary_email' ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave('primary_email');
                      if (e.key === 'Escape') { setPrimaryEmail(pipeline.email); setEditingField(null); }
                    }}
                    style={{ ...drawerInputStyle, flex: 1 }}
                  />
                  <button onClick={() => handleSave('primary_email')} style={saveBtnStyle}><Save size={14} /></button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <div
                      onClick={() => setEditingField('primary_email')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}
                      title="Clicca per modificare"
                    >
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{primaryEmail}</span>
                      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                    </div>
                    <button onClick={() => window.open(`mailto:${primaryEmail}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Invia email">
                      <Mail size={14} />
                    </button>
                  </div>
                  <ConsentRow contactKey={primaryEmail} />
                </>
              )}
            </div>

            {/* Email aggiuntive */}
            {additionalEmails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {additionalEmails.map(email => (
                  <div key={email} style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email}
                      </span>
                      <button onClick={() => window.open(`mailto:${email}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Invia email"><Mail size={14} /></button>
                      <button onClick={() => handleRemoveEmail(email)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'var(--destructive-foreground)' }} title="Rimuovi email"><Trash2 size={14} /></button>
                    </div>
                    <ConsentRow contactKey={email} />
                  </div>
                ))}
              </div>
            )}

            {/* Aggiungi email */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Aggiungi email aggiuntiva"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmail(); }}
                style={{ ...drawerInputStyle, flex: 1 }}
              />
              <button onClick={handleAddEmail} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Aggiungi
              </button>
            </div>
          </DrawerCollapsibleSection>

          {/* ─── Telefoni ───────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={Phone}
            title="Telefoni"
            badge={primaryPhone || additionalPhones.length > 0 ? `${(primaryPhone ? 1 : 0) + additionalPhones.length}` : undefined}
            isOpen={sections.telefoni}
            onToggle={() => toggleSection('telefoni')}
          >
            {/* Telefono principale */}
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
              <div style={microLabelStyle}>Telefono principale</div>
              {editingField === 'primary_phone' ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="tel"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave('primary_phone');
                      if (e.key === 'Escape') { setPrimaryPhone(pipeline.phone); setEditingField(null); }
                    }}
                    style={{ ...drawerInputStyle, flex: 1 }}
                  />
                  <button onClick={() => handleSave('primary_phone')} style={saveBtnStyle}><Save size={14} /></button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <div
                      onClick={() => setEditingField('primary_phone')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}
                      title="Clicca per modificare"
                    >
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: primaryPhone ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }}>
                        {primaryPhone || 'Non impostato'}
                      </span>
                      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                    </div>
                    {primaryPhone && (
                      <>
                        <button onClick={() => window.open(`https://wa.me/${primaryPhone.replace(/[^\d+]/g, '')}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Apri WhatsApp"><MessageCircle size={14} /></button>
                        <button onClick={() => window.open(`tel:${primaryPhone}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Chiama"><Phone size={14} /></button>
                      </>
                    )}
                  </div>
                  {primaryPhone && <ConsentRow contactKey={primaryPhone} />}
                </>
              )}
            </div>

            {/* Telefoni aggiuntivi */}
            {additionalPhones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {additionalPhones.map(phone => (
                  <div key={phone} style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5', flex: 1 }}>{phone}</span>
                      <button onClick={() => window.open(`https://wa.me/${phone.replace(/[^\d+]/g, '')}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Apri WhatsApp"><MessageCircle size={14} /></button>
                      <button onClick={() => window.open(`tel:${phone}`, '_blank')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }} title="Chiama"><Phone size={14} /></button>
                      <button onClick={() => handleRemovePhone(phone)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'var(--destructive-foreground)' }} title="Rimuovi telefono"><Trash2 size={14} /></button>
                    </div>
                    <ConsentRow contactKey={phone} />
                  </div>
                ))}
              </div>
            )}

            {/* Aggiungi telefono */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Aggiungi telefono aggiuntivo"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddPhone(); }}
                style={{ ...drawerInputStyle, flex: 1 }}
              />
              <button onClick={handleAddPhone} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Aggiungi
              </button>
            </div>
          </DrawerCollapsibleSection>

          {/* ─── Fonti acquisizione ──────────────────────── */}
          <DrawerCollapsibleSection
            icon={Tag}
            title="Fonti acquisizione"
            badge={pipelineSources.length > 0 ? String(pipelineSources.length) : undefined}
            isOpen={sections.fonti}
            onToggle={() => toggleSection('fonti')}
          >
            <DrawerSearchSelect
              options={sources}
              selected={pipelineSources}
              onSelect={(val) => {
                handleAddSource(val);
              }}
              onRemove={handleRemoveSource}
              placeholder="Cerca o aggiungi fonte..."
            />
          </DrawerCollapsibleSection>

          {/* ─── Dove ci parliamo ────────────────────────── */}
          <DrawerCollapsibleSection
            icon={MessageCircle}
            title="Dove ci parliamo"
            badge={pipelineChannels.length > 0 ? (pipelineChannels.length === 1 ? pipelineChannels[0] : String(pipelineChannels.length)) : undefined}
            isOpen={sections.doveciparliamo}
            onToggle={() => toggleSection('doveciparliamo')}
          >
            <DrawerSearchSelect
              options={communicationChannels}
              selected={pipelineChannels}
              onSelect={(val) => {
                if (!communicationChannels.includes(val)) addCommunicationChannel(val);
                handleAddChannel(val);
              }}
              onRemove={handleRemoveChannel}
              placeholder="Cerca o aggiungi canale..."
            />
          </DrawerCollapsibleSection>

          {/* ─── In carico a ──────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={User}
            title="In carico a"
            badge={assignedTo.length > 0 ? String(assignedTo.length) : undefined}
            isOpen={sections.incarichi}
            onToggle={() => toggleSection('incarichi')}
          >
            <DrawerSearchSelect
              options={[]}
              selected={assignedTo}
              onSelect={handleAddAssignee}
              onRemove={handleRemoveAssignee}
              placeholder="Cerca o aggiungi incarico..."
            />
          </DrawerCollapsibleSection>

          {/* ─── Info operative ──────────────────────────── */}
          <DrawerCollapsibleSection
            icon={Settings2}
            title="Info operative"
            isOpen={sections.operativo}
            onToggle={() => toggleSection('operativo')}
          >
            {isEditingOperativo ? (
              /* ── Modalità modifica ── */
              <div style={{
                backgroundColor: 'var(--muted)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                padding: '0.875rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={microLabelStyle}>Collegamento a servizio</label>
                  <select
                    value={serviceLink}
                    onChange={(e) => setServiceLink(e.target.value)}
                    style={drawerSelectStyle}
                  >
                    <option value="">Nessuno</option>
                    {SERVICE_LINK_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                    <option value="check_plagio">Check plagio/AI</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={microLabelStyle}>Link esterno</label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    style={drawerInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={microLabelStyle}>Data acquisizione</label>
                  <input
                    type="date"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    style={drawerInputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    onClick={() => {
                      setAssignedTo(pipeline.assigned_to || []);
                      setServiceLink(pipeline.service_link || '');
                      setExternalLink(pipeline.external_link || '');
                      setCreatedAt(pipeline.created_at);
                      setIsEditingOperativo(false);
                    }}
                    className="btn btn-secondary"
                  >
                    Annulla
                  </button>
                  <button onClick={handleSaveOperativo} style={saveBtnStyle}>
                    <Save size={14} /> Salva
                  </button>
                </div>
              </div>
            ) : (
              /* ── Modalità lettura ── */
              <div style={{ position: 'relative' }}>
                <div style={{
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  {/* Collegamento a servizio */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', lineHeight: '1.5', flexShrink: 0, minWidth: '155px' }}>
                      Collegamento servizio
                    </span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: serviceLink ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5', fontStyle: serviceLink ? 'normal' : 'italic' }}>
                      {serviceLink ? (SERVICE_LINK_LABELS[serviceLink] ?? serviceLink) : '—'}
                    </span>
                  </div>

                  {/* Link esterno */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', lineHeight: '1.5', flexShrink: 0, minWidth: '155px' }}>
                      Link esterno
                    </span>
                    {externalLink ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(externalLink, '_blank'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
                        title="Apri link"
                      >
                        <ExternalLink size={12} />
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: '1.5', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {externalLink}
                        </span>
                      </button>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>—</span>
                    )}
                  </div>

                  {/* Data acquisizione */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', lineHeight: '1.5', flexShrink: 0, minWidth: '155px' }}>
                      Data acquisizione
                    </span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {formatDate(createdAt)}
                    </span>
                  </div>
                </div>

                {/* Pencil overlay */}
                <button
                  onClick={() => setIsEditingOperativo(true)}
                  title="Modifica info operative"
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--muted-foreground)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Preventivi ──────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={FileText}
            title="Preventivi"
            badge={quotes.length > 0 ? String(quotes.length) : undefined}
            isOpen={sections.preventivi}
            onToggle={() => toggleSection('preventivi')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quotes.length === 0 ? (
                <DrawerEmptyState>Nessun preventivo inserito</DrawerEmptyState>
              ) : (
                quotes.map((quote, idx) => (
                  (() => {
                    const isPaid = quote.status === 'paid';
                    const isAlreadyConverted = alreadyConvertedQuoteIds.has(quote.id);
                    const isConvertible = isPaid && !isAlreadyConverted;
                    const isDirty = dirtyQuoteIds.has(quote.id);
                    const conversionBadgeLabel = isAlreadyConverted
                      ? 'Gia convertito'
                      : isConvertible
                        ? 'Pronto per conversione'
                        : 'Non convertibile';

                    return (
                  <div
                    key={quote.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => {
                          const updated = quotes.filter(q => q.id !== quote.id);
                          setQuotes(updated);
                          updatePipeline(pipeline.id, (p) => ({
                            ...p,
                            quotes: updated.length > 0 ? updated : undefined,
                            updated_at: new Date().toISOString(),
                            updated_by: CURRENT_ADMIN
                          }));
                          clearQuoteDirty(quote.id);
                          toast.success('Preventivo rimosso');
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--destructive-foreground)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Rimuovi preventivo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={microLabelStyle}>N. Preventivo</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <input
                            type="text"
                            style={{ ...drawerInputStyle, flex: 1 }}
                            value={quote.number.split('/')[0] || ''}
                            onChange={e => {
                              const parts = quote.number.split('/');
                              const year = parts[1] || new Date().getFullYear().toString();
                              const updated = [...quotes];
                              updated[idx].number = `${e.target.value}/${year}`;
                              setQuotes(updated);
                              markQuoteDirty(quote.id);
                            }}
                            placeholder="es. 001"
                          />

                          <input
                            type="text"
                            style={{ ...drawerInputStyle, width: '65px' }}
                            value={quote.number.split('/')[1] || new Date().getFullYear().toString()}
                            onChange={e => {
                              const parts = quote.number.split('/');
                              const num = parts[0] || '';
                              const updated = [...quotes];
                              updated[idx].number = `${num}/${e.target.value}`;
                              setQuotes(updated);
                              markQuoteDirty(quote.id);
                            }}
                            placeholder={new Date().getFullYear().toString()}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={microLabelStyle}>Stato</div>
                        <select
                          style={drawerSelectStyle}
                          value={quote.status}
                          onChange={e => {
                            const updated = [...quotes];
                            const nextStatus = e.target.value as QuoteStatus;
                            const todayIso = new Date().toISOString().split('T')[0];
                            if (nextStatus === 'paid' && (!updated[idx].amount_gross || updated[idx].amount_gross <= 0)) {
                              toast.error('Per impostare Pagato inserisci prima un importo lordo valido');
                              return;
                            }
                            updated[idx].status = nextStatus;
                            if (nextStatus === 'sent' && !updated[idx].sent_at) {
                              updated[idx].sent_at = todayIso;
                            }
                            if (nextStatus === 'accepted') {
                              if (!updated[idx].sent_at) updated[idx].sent_at = todayIso;
                              if (!updated[idx].accepted_at) updated[idx].accepted_at = todayIso;
                            } else if (nextStatus === 'draft' || nextStatus === 'sent') {
                              updated[idx].accepted_at = undefined;
                            }
                            setQuotes(updated);
                            markQuoteDirty(quote.id);
                          }}
                        >
                          <option value="draft">Bozza</option>
                          <option value="sent">Inviato</option>
                          <option value="accepted">Accettato</option>
                          <option value="paid">Pagato</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={microLabelStyle}>Importo lordo preventivo</div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        style={drawerInputStyle}
                        value={quote.amount_gross ?? ''}
                        placeholder="es. 1200"
                        onChange={(e) => {
                          const updated = [...quotes];
                          const nextRaw = e.target.value;
                          updated[idx].amount_gross = nextRaw === '' ? undefined : Number(nextRaw);
                          if (updated[idx].status === 'paid' && (!updated[idx].amount_gross || updated[idx].amount_gross <= 0)) {
                            updated[idx].status = 'accepted';
                            toast.error('Importo non valido: stato riportato ad Accettato');
                          }
                          setQuotes(updated);
                          markQuoteDirty(quote.id);
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={microLabelStyle}>Servizio preventivo</div>
                      <select
                        style={drawerSelectStyle}
                        value={quote.service_link || ''}
                        onChange={e => {
                          const updated = [...quotes];
                          updated[idx].service_link = e.target.value || undefined;
                          setQuotes(updated);
                          markQuoteDirty(quote.id);
                        }}
                      >
                        <option value="">Seleziona servizio...</option>
                        {SERVICE_LINK_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{
                      padding: '0.5rem 0.625rem',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--foreground)', lineHeight: '1.5' }}>
                        Conversione disponibile quando lo stato è Pagato
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '10px',
                        fontWeight: 'var(--font-weight-medium)',
                        borderRadius: 'var(--radius-badge)',
                        padding: '0.125rem 0.5rem',
                        border: isAlreadyConverted
                          ? '1px solid var(--chart-3)'
                          : isConvertible
                            ? '1px solid var(--primary)'
                            : '1px solid var(--border)',
                        color: isAlreadyConverted
                          ? 'var(--chart-3)'
                          : isConvertible
                            ? 'var(--primary)'
                            : 'var(--muted-foreground)',
                        backgroundColor: isAlreadyConverted
                          ? 'color-mix(in srgb, var(--chart-3) 12%, transparent)'
                          : isConvertible
                            ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                            : 'var(--muted)',
                        lineHeight: '1.5',
                      }}>
                        {conversionBadgeLabel}
                      </span>
                    </div>

                    {convertibleQuotes.length > 1 && (
                      <div style={{
                        padding: '0.5rem 0.625rem',
                        backgroundColor: selectedQuoteForConversion === quote.id
                          ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                          : 'var(--background)',
                        borderRadius: 'var(--radius)',
                        border: selectedQuoteForConversion === quote.id
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--foreground)', lineHeight: '1.5' }}>
                          Usa questo preventivo per la prossima lavorazione
                        </span>
                        <input
                          type="radio"
                          name="quote-for-conversion"
                          checked={selectedQuoteForConversion === quote.id}
                          onChange={() => setSelectedQuoteForConversion(quote.id)}
                          disabled={!isConvertible}
                          style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div style={microLabelStyle}>Inviato il</div>
                        <input
                          type="date"
                          style={drawerInputStyle}
                          value={quote.sent_at || ''}
                          onChange={e => {
                            const updated = [...quotes];
                            updated[idx].sent_at = e.target.value;
                            if (e.target.value && updated[idx].status === 'draft') updated[idx].status = 'sent';
                            setQuotes(updated);
                            markQuoteDirty(quote.id);
                          }}
                        />
                      </div>
                      <div>
                        <div style={microLabelStyle}>Scadenza</div>
                        <input
                          type="date"
                          style={drawerInputStyle}
                          value={quote.expires_at || ''}
                          onChange={e => {
                            const updated = [...quotes];
                            updated[idx].expires_at = e.target.value;
                            setQuotes(updated);
                            markQuoteDirty(quote.id);
                          }}
                        />
                      </div>
                    </div>
                    {isDirty && (
                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <button
                          onClick={() => handleSaveQuote(quote.id)}
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center', gap: '0.375rem' }}
                        >
                          <Save size={14} /> Salva preventivo
                        </button>
                      </div>
                    )}
                  </div>
                    );
                  })()
                ))
              )}

              <DrawerAddButton onClick={() => {
                const currentYear = new Date().getFullYear();
                const nextNum = String(quotes.length + 1).padStart(3, '0');
                const newQuote: Quote = {
                  id: `Q-${Math.random().toString(36).substr(2, 9)}`,
                  number: `${nextNum}/${currentYear}`,
                  status: 'draft',
                  created_at: new Date().toISOString().split('T')[0],
                  service_link: serviceLink || pipeline.service_link || undefined,
                };
                const updated = [...quotes, newQuote];
                setQuotes(updated);
                markQuoteDirty(newQuote.id);
                toast.success('Preventivo aggiunto. Premi Salva per registrarlo');
              }}>
                <Plus size={14} /> Nuovo preventivo
              </DrawerAddButton>
            </div>
          </DrawerCollapsibleSection>

          {/* ─── Note ───────────────────────────────────── */}
          <DrawerCollapsibleSection
            icon={FileText}
            title="Note"
            badge={notes ? 'Presenti' : undefined}
            isOpen={sections.note}
            onToggle={() => toggleSection('note')}
          >
            {editingField === 'notes' ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  autoFocus
                  rows={4}
                  style={{ ...drawerInputStyle, resize: 'vertical', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleSave('notes')} className="btn btn-primary" style={{ flex: 1 }}><Save size={16} /> Salva</button>
                  <button onClick={() => { setNotes(pipeline.notes || ''); setEditingField(null); }} className="btn btn-secondary" style={{ flex: 1 }}>Annulla</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingField('notes')}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  color: notes ? 'var(--foreground)' : 'var(--muted-foreground)',
                  padding: '0.75rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  lineHeight: '1.5',
                  cursor: 'pointer',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                title="Clicca per modificare"
              >
                <span style={{ flex: 1 }}>{notes || 'Nessuna nota. Clicca per aggiungere.'}</span>
                <Pencil size={12} style={{ color: 'var(--muted-foreground)', opacity: 0.4, flexShrink: 0 }} />
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Lavorazioni collegate ───────────────────── */}
          <DrawerCollapsibleSection
            icon={ExternalLink}
            title="Lavorazioni collegate"
            badge={lavorazioniCollegate.length > 0 ? String(lavorazioniCollegate.length) : undefined}
            isOpen={sections.lavorazioni}
            onToggle={() => toggleSection('lavorazioni')}
          >
            {lavorazioniCollegate.length === 0 ? (
              <DrawerEmptyState>Nessuna lavorazione ancora creata da questa pipeline</DrawerEmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lavorazioniCollegate.map(lav => (
                  <DrawerLinkedServiceCard
                    key={lav.id}
                    id={lav.id}
                    serviceName={lav.service_name}
                    status={lav.status}
                    coachName={lav.coach_name}
                    onNavigate={() => {
                      onOpenChange(false);
                      navigate(`/lavorazioni?highlight=${lav.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </DrawerCollapsibleSection>

          {/* ─── Audit e Riferimenti ─────────────────────── */}
          <DrawerCollapsibleSection
            icon={Hash}
            title="Audit e Riferimenti"
            isOpen={sections.riferimenti}
            onToggle={() => toggleSection('riferimenti')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ID + Stato affiancati */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={microLabelStyle}>ID Pipeline</div>
                  <span style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                  }}>
                    {pipeline.id}
                  </span>
                </div>
                <div>
                  <div style={microLabelStyle}>Stato</div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    lineHeight: '1.5',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-badge)',
                    border: '1px solid',
                    ...(isConverted || isReenrollment
                      ? {
                          color: 'var(--primary)',
                          borderColor: 'var(--primary)',
                          backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                        }
                      : {
                          color: 'var(--muted-foreground)',
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--muted)',
                        }
                    ),
                  }}>
                    {(isConverted || isReenrollment) ? 'Studente' : 'Lead'}
                  </span>
                </div>
              </div>

              {/* Studente collegato */}
              <div>
                <div style={microLabelStyle}>Studente collegato</div>
                {(isConverted || isReenrollment) ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      {linkedStudent ? (
                        <>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            {linkedStudent.name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {linkedStudent.id}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                          {pipeline.student_id}
                        </span>
                      )}
                    </div>
                    {linkedStudent && (
                      <button
                        onClick={() => {
                          if (onOpenStudentProfile) {
                            onOpenStudentProfile(linkedStudent.id);
                          } else {
                            onOpenChange(false);
                            navigate(`/studenti?id=${linkedStudent.id}`);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '11px', flexShrink: 0 }}
                      >
                        Apri <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>
                    Non ancora convertito
                  </span>
                )}
              </div>

              {/* Data acquisizione + N. lavorazioni */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={microLabelStyle}>Data acquisizione</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                    {formatDate(pipeline.created_at)}
                  </span>
                </div>
                <div>
                  <div style={microLabelStyle}>Lavorazioni collegate</div>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: pipeline.lavorazioni_ids.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: '1.5' }}>
                    {pipeline.lavorazioni_ids.length > 0
                      ? `${pipeline.lavorazioni_ids.length} ${pipeline.lavorazioni_ids.length === 1 ? 'lavorazione' : 'lavorazioni'}`
                      : '—'}
                  </span>
                </div>
              </div>

            </div>
          </DrawerCollapsibleSection>

          <div style={{ height: '0.5rem' }} />
        </DrawerBody>

        {/* ─── Footer CTA ──────────────────────────────── */}
        <DrawerFooter>
          {convertibleQuotes.length === 0 ? (
            <div style={{
              width: '100%',
              padding: '0.5rem 0.625rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              {eligibleQuotes.length === 0
                ? "Nessun preventivo pagato per la conversione. Per procedere imposta stato Pagato e inserisci l'importo lordo."
                : 'Tutti i preventivi pagati risultano gia convertiti. Per una nuova lavorazione crea un nuovo preventivo.'}
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!canConvertSelected || !selectedQuoteForConversion) {
                  toast.error('Seleziona un preventivo pagato per creare la lavorazione');
                  return;
                }
                onConvertToLavorazione({ ...pipeline, quotes }, selectedQuoteForConversion);
                onOpenChange(false);
              }}
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={!canConvertSelected}
            >
              <Plus size={16} />
              Crea Lavorazione dal preventivo selezionato
            </button>
          )}
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}
