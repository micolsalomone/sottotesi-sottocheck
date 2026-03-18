import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, Mail, MessageCircle, Phone, Trash2, Save, CheckCircle, Circle, Pencil, X, Search, GraduationCap, UserPlus, User, Calendar, Tag, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useLavorazioni, ADMIN_USERS } from '../data/LavorazioniContext';
import type { Pipeline, Quote, QuoteStatus, Student, DegreeLevel, ThesisType } from '../data/LavorazioniContext';
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
  DrawerChip,
  DrawerAddButton,
  DrawerAcademicSnippet,
  drawerInputStyle,
  drawerSelectStyle,
  drawerLabelStyle,
  drawerFieldGroupStyle,
  drawerSectionTitleStyle,
  DrawerSearchSelect,
} from './DrawerPrimitives';

interface CreatePipelineDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAndConvert?: (pipeline: Pipeline) => void;
}

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

// ─── Stile riga consenso marketing (specifico di questo drawer) ──
const consentRowStyle: React.CSSProperties = {
  padding: '0.5rem 0.625rem',
  backgroundColor: 'var(--background)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginTop: '0.375rem',
};

// ─── Marketing consent row ────────────────────────────────────
function MarketingConsentRow({
  contactKey,
  consents,
  editingKey,
  onEdit,
  onSave,
  onChange,
}: {
  contactKey: string;
  consents: Record<string, boolean>;
  editingKey: string | null;
  onEdit: (key: string) => void;
  onSave: () => void;
  onChange: (key: string, value: boolean) => void;
}) {
  const isEditing = editingKey === contactKey;
  const hasConsent = consents[contactKey] || false;

  if (isEditing) {
    return (
      <div style={{ ...consentRowStyle, backgroundColor: 'var(--muted)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={e => onChange(contactKey, e.target.checked)}
            style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--foreground)', lineHeight: '1.5' }}>
            Consenso marketing
          </span>
        </label>
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: '0.25rem 0.5rem',
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          title="Salva consenso"
        >
          <Save size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(contactKey)}
      onKeyDown={e => e.key === 'Enter' && onEdit(contactKey)}
      style={{ ...consentRowStyle, cursor: 'pointer' }}
      title="Clicca per modificare consenso"
    >
      {hasConsent ? (
        <CheckCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      ) : (
        <Circle size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
      )}
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          color: hasConsent ? 'var(--primary)' : 'var(--muted-foreground)',
          lineHeight: '1.5',
          flex: 1,
          fontWeight: hasConsent ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
        }}
      >
        {hasConsent ? 'Consenso marketing attivo' : 'Nessun consenso marketing'}
      </span>
      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.5, flexShrink: 0 }} />
    </div>
  );
}

// ─── Academic record card (pipeline — singolo record, coerente con AcademicRecordPanel) ──
function PipelineAcademicCard({
  data,
  expanded,
  onToggle,
  onChange,
}: {
  data: {
    degree_level: DegreeLevel | '';
    course_name: string;
    university_name: string;
    thesis_professor: string;
    thesis_subject: string;
    thesis_type: ThesisType | '';
    foreign_language: boolean;
    thesis_language: string;
  };
  expanded: boolean;
  onToggle: () => void;
  onChange: (key: string, value: string | boolean) => void;
}) {
  const hasData = !!(
    data.degree_level || data.course_name || data.university_name ||
    data.thesis_subject || data.thesis_professor || data.thesis_type
  );

  // ── Collapsed: snippet preview or "compila" button ──────────
  if (!expanded) {
    if (hasData) {
      return (
        <div style={{ position: 'relative' }}>
          <DrawerAcademicSnippet record={data} />
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              padding: '0.25rem 0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Pencil size={11} /> Modifica
          </button>
        </div>
      );
    }
    return (
      <DrawerAddButton onClick={onToggle}>
        <Plus size={14} /> Compila dati accademici
      </DrawerAddButton>
    );
  }

  // ── Expanded: form inside specchietto-styled container ──────
  return (
    <div
      style={{
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '0.75rem',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={drawerFieldGroupStyle}>
          <label style={drawerLabelStyle}>Livello</label>
          <select
            value={data.degree_level}
            onChange={e => onChange('degree_level', e.target.value)}
            style={drawerSelectStyle}
          >
            <option value="">Seleziona...</option>
            {DEGREE_LEVELS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div style={drawerFieldGroupStyle}>
          <label style={drawerLabelStyle}>Tipo tesi</label>
          <select
            value={data.thesis_type}
            onChange={e => onChange('thesis_type', e.target.value)}
            style={drawerSelectStyle}
          >
            <option value="">Seleziona...</option>
            {THESIS_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={drawerFieldGroupStyle}>
        <label style={drawerLabelStyle}>Corso di studi</label>
        <input
          type="text"
          placeholder="es. Economia Aziendale"
          value={data.course_name}
          onChange={e => onChange('course_name', e.target.value)}
          style={drawerInputStyle}
        />
      </div>

      <div style={drawerFieldGroupStyle}>
        <label style={drawerLabelStyle}>Università (opzionale)</label>
        <input
          type="text"
          placeholder="es. Università di Bologna"
          value={data.university_name}
          onChange={e => onChange('university_name', e.target.value)}
          style={drawerInputStyle}
        />
      </div>

      <div style={drawerFieldGroupStyle}>
        <label style={drawerLabelStyle}>Relatore tesi</label>
        <input
          type="text"
          placeholder="es. Prof. Rossi"
          value={data.thesis_professor}
          onChange={e => onChange('thesis_professor', e.target.value)}
          style={drawerInputStyle}
        />
      </div>

      <div style={drawerFieldGroupStyle}>
        <label style={drawerLabelStyle}>Materia di tesi</label>
        <input
          type="text"
          placeholder="es. Marketing Strategico"
          value={data.thesis_subject}
          onChange={e => onChange('thesis_subject', e.target.value)}
          style={drawerInputStyle}
        />
      </div>

      <div style={{ ...drawerFieldGroupStyle, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <label
          style={{
            ...drawerLabelStyle,
            marginBottom: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <input
            type="checkbox"
            checked={data.foreign_language}
            onChange={e => onChange('foreign_language', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          Tesi in lingua straniera
        </label>
      </div>

      {data.foreign_language && (
        <div style={drawerFieldGroupStyle}>
          <label style={drawerLabelStyle}>Lingua tesi</label>
          <input
            type="text"
            placeholder="es. Inglese"
            value={data.thesis_language}
            onChange={e => onChange('thesis_language', e.target.value)}
            style={drawerInputStyle}
          />
        </div>
      )}

      {/* Comprimi */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          marginTop: '0.25rem',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <ChevronUp size={12} /> Comprimi
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export function CreatePipelineDrawer({ open, onOpenChange, onCreateAndConvert }: CreatePipelineDrawerProps) {
  const { addPipeline, students, sources, communicationChannels, pipelines, addSource, addCommunicationChannel } = useLavorazioni();

  // Stato espansione card accademica
  const [academicExpanded, setAcademicExpanded] = useState(true);

  // 'new' = nuovo lead (non ancora studente), 'existing' = re-enrollment studente già in anagrafica
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Duplicate detection: studente esistente trovato per email/telefono
  const [duplicateStudent, setDuplicateStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    sources: [] as string[],
    communication_channels: [] as string[],
    assigned_to: '',
    quote_sent: false,
    service_link: '',
    external_link: '',
    notes: '',
    created_at: new Date().toISOString().split('T')[0],
    quotes: [] as Quote[],
  });

  const [academicData, setAcademicData] = useState({
    degree_level: '' as DegreeLevel | '',
    course_name: '',
    university_name: '',
    thesis_professor: '',
    thesis_subject: '',
    thesis_type: '' as ThesisType | '',
    foreign_language: false,
    thesis_language: '',
  });

  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [marketingConsents, setMarketingConsents] = useState<Record<string, boolean>>({});
  const [editingConsent, setEditingConsent] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');


  // Cerca in anagrafica studenti (solo per re-enrollment)
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 5);
    const q = studentSearch.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.email.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [students, studentSearch]);

  // Duplicate detection: quando l'utente digita email nel form "Nuovo Lead"
  const checkDuplicate = (email: string) => {
    if (!email || mode !== 'new') { setDuplicateStudent(null); return; }
    const found = students.find(s => s.email.toLowerCase() === email.toLowerCase().trim());
    setDuplicateStudent(found || null);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student.id);
    setFormData(prev => ({
      ...prev,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
    }));
    setStudentSearch(student.name);
  };

  const handleConsentChange = (key: string, value: boolean) => {
    setMarketingConsents(prev => ({ ...prev, [key]: value }));
  };

  const handleConsentSave = () => {
    toast.success('Consenso marketing aggiornato');
    setEditingConsent(null);
  };

  const resetForm = () => {
    setMode('new');
    setSelectedStudentId('');
    setStudentSearch('');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      sources: [],
      communication_channels: [],
      assigned_to: '',
      quote_sent: false,
      service_link: '',
      external_link: '',
      notes: '',
      created_at: new Date().toISOString().split('T')[0],
      quotes: [],
    });
    setAcademicData({
      degree_level: '',
      course_name: '',
      university_name: '',
      thesis_professor: '',
      thesis_subject: '',
      thesis_type: '',
      foreign_language: false,
      thesis_language: '',
    });
    setAdditionalEmails([]);
    setAdditionalPhones([]);
    setMarketingConsents({});
    setEditingConsent(null);
    setNewEmail('');
    setNewPhone('');
    setDuplicateStudent(null);
    setAcademicExpanded(true);
  };

  const buildPipeline = (): Pipeline | null => {
    if (mode === 'new') {
      if (!formData.first_name || !formData.last_name || !formData.email || formData.sources.length === 0) {
        toast.error('Compila tutti i campi obbligatori (Nome, Cognome, Email, Fonte)');
        return null;
      }
    } else {
      if (!selectedStudentId || formData.sources.length === 0) {
        toast.error('Seleziona lo studente e specifica la fonte');
        return null;
      }
    }

    // In modalità 'new': genera un ID temporaneo che diventerà student_id alla conversione in lavorazione.
    // In modalità 'existing': usa l'ID dello studente già in anagrafica (re-enrollment).
    const studentId = mode === 'existing'
      ? selectedStudentId
      : `STU-${Math.floor(Math.random() * 9000) + 1000}`;

    const maxId = pipelines.reduce((max, p) => {
      const num = parseInt(p.id.replace('PIP-', ''));
      return num > max ? num : max;
    }, 0);

    // Dati accademici preliminari (solo modalità 'new', vengono usati alla conversione in lavorazione)
    const hasAcademicData = mode === 'new' && (
      academicData.degree_level || academicData.course_name || academicData.university_name ||
      academicData.thesis_professor || academicData.thesis_subject || academicData.thesis_type
    );

    const newPipeline: Pipeline = {
      id: `PIP-${String(maxId + 1).padStart(3, '0')}`,
      student_id: studentId,
      student_name: `${formData.first_name} ${formData.last_name}`,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || '',
      emails: additionalEmails.length > 0 ? additionalEmails : undefined,
      phones: additionalPhones.length > 0 ? additionalPhones : undefined,
      marketing_consents: Object.keys(marketingConsents).length > 0 ? marketingConsents : undefined,
      sources: formData.sources,
      communication_channels: formData.communication_channels.length > 0 ? formData.communication_channels : undefined,
      assigned_to: formData.assigned_to || undefined,
      quote_sent: formData.quote_sent,
      service_link: formData.service_link || undefined,
      external_link: formData.external_link || undefined,
      created_at: formData.created_at,
      quotes: formData.quotes.length > 0 ? formData.quotes : undefined,
      notes: formData.notes || undefined,
      lavorazioni_ids: [],
      academic_data: hasAcademicData ? {
        degree_level: academicData.degree_level || undefined,
        course_name: academicData.course_name || undefined,
        university_name: academicData.university_name || undefined,
        thesis_professor: academicData.thesis_professor || undefined,
        thesis_subject: academicData.thesis_subject || undefined,
        thesis_type: academicData.thesis_type || undefined,
        foreign_language: academicData.foreign_language || undefined,
        thesis_language: academicData.thesis_language || undefined,
      } : undefined,
      linked_existing_student: mode === 'existing' ? true : undefined,
    };

    return newPipeline;
  };

  const handleAddToPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    const pipeline = buildPipeline();
    if (!pipeline) return;
    
    addPipeline(pipeline);
    toast.success('Lead aggiunto alla pipeline');
    onOpenChange(false);
    resetForm();
  };

  const handleCreateLavorazione = (e: React.FormEvent) => {
    e.preventDefault();
    const pipeline = buildPipeline();
    if (!pipeline) return;

    addPipeline(pipeline);
    toast.success('Pipeline creata — procedi con la conversione in lavorazione');
    resetForm();
    onOpenChange(false);
    if (onCreateAndConvert) onCreateAndConvert(pipeline);
  };

  const toggleSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source],
    }));
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      communication_channels: prev.communication_channels.includes(channel)
        ? prev.communication_channels.filter(c => c !== channel)
        : [...prev.communication_channels, channel],
    }));
  };



  const handleAddEmail = () => {
    const val = newEmail.trim();
    if (val && !additionalEmails.includes(val)) {
      setAdditionalEmails(prev => [...prev, val]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails(prev => prev.filter(e => e !== email));
    const updConsents = { ...marketingConsents };
    delete updConsents[email];
    setMarketingConsents(updConsents);
  };

  const handleAddPhone = () => {
    const val = newPhone.trim();
    if (val && !additionalPhones.includes(val)) {
      setAdditionalPhones(prev => [...prev, val]);
      setNewPhone('');
    }
  };

  const handleRemovePhone = (phone: string) => {
    setAdditionalPhones(prev => prev.filter(p => p !== phone));
    const updConsents = { ...marketingConsents };
    delete updConsents[phone];
    setMarketingConsents(updConsents);
  };

  if (!open) return null;

  // ── Stili locali specifici di questo drawer ──
  const contactCardMuted: React.CSSProperties = {
    padding: '0.75rem',
    backgroundColor: 'var(--muted)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    marginBottom: '0.5rem',
  };
  const contactCardBase: React.CSSProperties = {
    padding: '0.75rem',
    backgroundColor: 'var(--background)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    marginBottom: '0.5rem',
  };

  return (
    <>
      <DrawerOverlay onClose={() => { onOpenChange(false); resetForm(); }} />

      <DrawerShell>
        <DrawerHeader
          icon={<TrendingUp size={20} />}
          title="Nuova Pipeline"
          onClose={() => { onOpenChange(false); resetForm(); }}
        />

        <DrawerBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── SELEZIONE LEAD / STUDENTE ── */}
            <DrawerSection title="Lead" icon={<User size={16} />} bordered={false}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setMode('new'); setDuplicateStudent(null); setSelectedStudentId(''); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: mode === 'new' ? 'var(--primary)' : 'var(--background)',
                    color: mode === 'new' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <UserPlus size={14} />
                  Nuovo Lead
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('existing'); setDuplicateStudent(null); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: mode === 'existing' ? 'var(--primary)' : 'var(--background)',
                    color: mode === 'existing' ? 'var(--primary-foreground)' : 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Search size={14} />
                  Re-enrollment
                </button>
              </div>

              {mode === 'existing' ? (
                <div style={{ position: 'relative' }}>
                  <DrawerLabel required>Cerca studente in anagrafica</DrawerLabel>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.75rem',
                    backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                  }}>
                    Usa questa modalità solo per studenti già presenti in anagrafica (hanno già avuto almeno una lavorazione). La nuova pipeline verrà collegata al loro profilo esistente.
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                    <input
                      type="text"
                      style={{ ...drawerInputStyle, paddingLeft: '2.25rem' }}
                      placeholder="Cerca per nome, email o ID..."
                      value={studentSearch}
                      onChange={e => {
                        setStudentSearch(e.target.value);
                        if (!e.target.value) setSelectedStudentId('');
                      }}
                    />
                  </div>
                  {studentSearch && !selectedStudentId && filteredStudents.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: 50,
                      marginTop: '0.25rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}>
                      {filteredStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleStudentSelect(s)}
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>{s.name}</span>
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)' }}>{s.email} • {s.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <DrawerFieldGroup style={{ marginBottom: 0 }}>
                    <DrawerLabel required>Nome</DrawerLabel>
                    <input
                      type="text"
                      style={drawerInputStyle}
                      value={formData.first_name}
                      onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Nome"
                    />
                  </DrawerFieldGroup>
                  <DrawerFieldGroup style={{ marginBottom: 0 }}>
                    <DrawerLabel required>Cognome</DrawerLabel>
                    <input
                      type="text"
                      style={drawerInputStyle}
                      value={formData.last_name}
                      onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Cognome"
                    />
                  </DrawerFieldGroup>
                </div>
              )}
            </DrawerSection>

            {/* ── ACADEMIC RECORD (Solo per nuovo studente) ── */}
            {mode === 'new' && (
              <DrawerSection title="Carriera Accademica" icon={<GraduationCap size={16} />}>
                <PipelineAcademicCard
                  data={academicData}
                  expanded={academicExpanded}
                  onToggle={() => setAcademicExpanded(prev => !prev)}
                  onChange={(key, value) => setAcademicData(prev => ({ ...prev, [key]: value }))}
                />
              </DrawerSection>
            )}

            {/* ── EMAIL ── */}
            <DrawerSection title="Email" icon={<Mail size={16} />}>
              {/* Duplicate detection banner */}
              {duplicateStudent && mode === 'new' && (
                <div style={{
                  padding: '0.625rem 0.75rem',
                  marginBottom: '0.75rem',
                  backgroundColor: 'color-mix(in srgb, var(--warning, #f59e0b) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--warning, #f59e0b) 35%, transparent)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.5', flex: 1 }}>
                    ⚠️ Questa email corrisponde a uno studente già in anagrafica: <strong>{duplicateStudent.name}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '0.25rem 0.5rem', flexShrink: 0 }}
                    onClick={() => {
                      setMode('existing');
                      handleStudentSelect(duplicateStudent);
                      setDuplicateStudent(null);
                    }}
                  >
                    Collega profilo esistente
                  </button>
                </div>
              )}
              {/* Email principale */}
              <div style={contactCardMuted}>
                <DrawerMicroLabel>Email principale *</DrawerMicroLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <input
                    type="email"
                    style={{ ...drawerInputStyle, flex: 1 }}
                    value={formData.email}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      checkDuplicate(e.target.value);
                    }}
                    placeholder="email@esempio.it"
                    readOnly={mode === 'existing' && !!selectedStudentId}
                  />
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => window.open(`mailto:${formData.email}`, '_blank')}
                      className="btn btn-secondary"
                      style={{ padding: '0.375rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
                      title="Invia email"
                    >
                      <Mail size={14} />
                    </button>
                  )}
                </div>
                <MarketingConsentRow
                  contactKey={formData.email || '__main_email__'}
                  consents={marketingConsents}
                  editingKey={editingConsent}
                  onEdit={setEditingConsent}
                  onSave={handleConsentSave}
                  onChange={handleConsentChange}
                />
              </div>

              {/* Email aggiuntive */}
              {additionalEmails.map(email => (
                <div key={email} style={contactCardBase}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
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
                      <Mail size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0, color: 'var(--destructive-foreground)' }}
                      title="Rimuovi email"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <MarketingConsentRow
                    contactKey={email}
                    consents={marketingConsents}
                    editingKey={editingConsent}
                    onEdit={setEditingConsent}
                    onSave={handleConsentSave}
                    onChange={handleConsentChange}
                  />
                </div>
              ))}

              {/* Aggiungi email */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Aggiungi email aggiuntiva"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
                  style={{ ...drawerInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="btn btn-secondary"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} />
                  Aggiungi
                </button>
              </div>
            </DrawerSection>

            {/* ── TELEFONI ── */}
            <DrawerSection title="Telefoni" icon={<Phone size={16} />}>
              {/* Telefono principale */}
              <div style={contactCardMuted}>
                <DrawerMicroLabel>Telefono principale</DrawerMicroLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <input
                    type="tel"
                    style={{ ...drawerInputStyle, flex: 1 }}
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+39 333 1234567"
                    readOnly={mode === 'existing' && !!selectedStudentId}
                  />
                  {formData.phone && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open(`https://wa.me/${formData.phone.replace(/[^\d+]/g, '')}`, '_blank')}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
                        title="Apri WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(`tel:${formData.phone}`, '_blank')}
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
                        title="Chiama"
                      >
                        <Phone size={14} />
                      </button>
                    </>
                  )}
                </div>
                <MarketingConsentRow
                  contactKey={formData.phone || '__main_phone__'}
                  consents={marketingConsents}
                  editingKey={editingConsent}
                  onEdit={setEditingConsent}
                  onSave={handleConsentSave}
                  onChange={handleConsentChange}
                />
              </div>

              {/* Telefoni aggiuntivi */}
              {additionalPhones.map(phone => (
                <div key={phone} style={contactCardBase}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                        flex: 1,
                      }}
                    >
                      {phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(`https://wa.me/${phone.replace(/[^\d+]/g, '')}`, '_blank')}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
                      title="Apri WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`tel:${phone}`, '_blank')}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0 }}
                      title="Chiama"
                    >
                      <Phone size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(phone)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', flexShrink: 0, color: 'var(--destructive-foreground)' }}
                      title="Rimuovi telefono"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <MarketingConsentRow
                    contactKey={phone}
                    consents={marketingConsents}
                    editingKey={editingConsent}
                    onEdit={setEditingConsent}
                    onSave={handleConsentSave}
                    onChange={handleConsentChange}
                  />
                </div>
              ))}

              {/* Aggiungi telefono */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Aggiungi telefono aggiuntivo"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhone(); } }}
                  style={{ ...drawerInputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="btn btn-secondary"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} />
                  Aggiungi
                </button>
              </div>
            </DrawerSection>

            {/* ── FONTI ACQUISIZIONE ── */}
            <DrawerSection title="Fonti acquisizione" icon={<Tag size={16} />}>
              <DrawerSearchSelect
                options={sources}
                selected={formData.sources}
                onSelect={(val) => {
                  if (!sources.includes(val)) addSource(val);
                  if (!formData.sources.includes(val)) toggleSource(val);
                }}
                onRemove={toggleSource}
                placeholder="Cerca o aggiungi fonte..."
              />
            </DrawerSection>

            {/* ── CANALE ── */}
            <DrawerSection title="Dove ci parliamo" icon={<MessageCircle size={16} />}>
              <DrawerSearchSelect
                options={communicationChannels}
                selected={formData.communication_channels}
                onSelect={(val) => {
                  if (!communicationChannels.includes(val)) addCommunicationChannel(val);
                  if (!formData.communication_channels.includes(val)) toggleChannel(val);
                }}
                onRemove={toggleChannel}
                placeholder="Cerca o aggiungi canale..."
              />
            </DrawerSection>

            {/* ── IN CARICO A ── */}
            <DrawerSection title="In carico a" icon={<User size={16} />}>
              <select
                style={drawerSelectStyle}
                value={formData.assigned_to}
                onChange={e => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              >
                <option value="">Non assegnato</option>
                {ADMIN_USERS.filter(u => u !== 'Non assegnato').map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </DrawerSection>

            {/* ── DATA ACQUISIZIONE ── */}
            <DrawerSection title="Data di acquisizione" icon={<Calendar size={16} />}>
              <DrawerFieldGroup style={{ marginBottom: 0 }}>
                <DrawerLabel>Data di acquisizione</DrawerLabel>
                <input
                  type="date"
                  style={drawerInputStyle}
                  value={formData.created_at}
                  onChange={e => setFormData(prev => ({ ...prev, created_at: e.target.value }))}
                />
              </DrawerFieldGroup>
            </DrawerSection>

            {/* ── NOTE ── */}
            <DrawerSection title="Note" icon={<FileText size={16} />} bordered={false}>
              <textarea
                style={{ ...drawerInputStyle, minHeight: '100px', resize: 'vertical' }}
                placeholder="Aggiungi note sulla pipeline..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </DrawerSection>

          </div>
        </DrawerBody>

        <DrawerFooter direction="column">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToPipeline}
            style={{ width: '100%', justifyContent: 'center', height: '2.75rem' }}
          >
            Aggiungi alla Pipeline
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCreateLavorazione}
            style={{ width: '100%', justifyContent: 'center', height: '2.75rem' }}
          >
            Crea subito Lavorazione
          </button>
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}