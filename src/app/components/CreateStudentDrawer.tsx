import React, { useState, useEffect, useMemo } from 'react';
import { User, GraduationCap, Plus, Trash2, Mail, Briefcase, ChevronUp, ChevronDown, Hash, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Student, StudentAcademicRecord, DegreeLevel, ThesisType, ContactEmail, ContactPhone } from '../data/LavorazioniContext';
import { useLavorazioni } from '../data/LavorazioniContext';

import { ContactManager } from './ContactManager';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerAddButton,
  DrawerEmptyState,
  DrawerSectionToggle,
  DrawerLinkedServiceCard,
  DrawerCollapsibleSection,
  DrawerMetaRow,
  drawerInputStyle,
  drawerLabelStyle,
  drawerSelectStyle,
  drawerFieldGroupStyle,
} from './DrawerPrimitives';

// ─── Constants ──────────────────────────────────────────────
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

// ─── Single Academic Record Form ────────────────────────────
interface AcademicRecordFormData {
  id: string;
  degree_level: DegreeLevel | '';
  course_name: string;
  university_name: string;
  thesis_professor: string;
  thesis_subject: string;
  foreign_language: boolean;
  thesis_language: string;
  thesis_type: ThesisType | '';
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

function AcademicRecordPanel({
  record,
  index,
  totalCount,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onSetCurrent,
}: {
  record: AcademicRecordFormData;
  index: number;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updated: AcademicRecordFormData) => void;
  onRemove: () => void;
  onSetCurrent: () => void;
}) {
  const degreeLabelMap: Record<string, string> = {
    triennale: 'Triennale',
    magistrale: 'Magistrale',
    ciclo_unico: 'Ciclo unico',
    master: 'Master',
    dottorato: 'Dottorato',
  };

  const summary = [
    record.degree_level ? degreeLabelMap[record.degree_level] : null,
    record.course_name || null,
    record.university_name || null,
  ]
    .filter(Boolean)
    .join(' · ') || 'Nuovo record';

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '0.5rem',
        background: record.is_current ? 'var(--muted)' : 'var(--card)',
      }}
    >
      {/* Record header (clickable) */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              padding: '0.125rem 0.375rem',
              borderRadius: 'var(--radius-badge)',
              lineHeight: '1.5',
              flexShrink: 0,
            }}
          >
            #{index + 1}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'left',
            }}
          >
            {summary}
          </span>
          {record.is_current && (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                padding: '0.0625rem 0.375rem',
                borderRadius: 'var(--radius-badge)',
                lineHeight: '1.5',
                flexShrink: 0,
              }}
            >
              Corrente
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
      </button>

      {/* Expanded form */}
      {expanded && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Livello</label>
                <select
                  value={record.degree_level}
                  onChange={e => onChange({ ...record, degree_level: e.target.value as DegreeLevel | '' })}
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
                  value={record.thesis_type}
                  onChange={e => onChange({ ...record, thesis_type: e.target.value as ThesisType | '' })}
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
                value={record.course_name}
                onChange={e => onChange({ ...record, course_name: e.target.value })}
                style={drawerInputStyle}
              />
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Università (opzionale)</label>
              <input
                type="text"
                placeholder="es. Università di Bologna"
                value={record.university_name}
                onChange={e => onChange({ ...record, university_name: e.target.value })}
                style={drawerInputStyle}
              />
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Relatore tesi</label>
              <input
                type="text"
                placeholder="es. Prof. Rossi"
                value={record.thesis_professor}
                onChange={e => onChange({ ...record, thesis_professor: e.target.value })}
                style={drawerInputStyle}
              />
            </div>

            <div style={drawerFieldGroupStyle}>
              <label style={drawerLabelStyle}>Materia di tesi</label>
              <input
                type="text"
                placeholder="es. Marketing Strategico"
                value={record.thesis_subject}
                onChange={e => onChange({ ...record, thesis_subject: e.target.value })}
                style={drawerInputStyle}
              />
            </div>

            {/* Foreign language toggle */}
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
                  checked={record.foreign_language}
                  onChange={e => {
                    onChange({
                      ...record,
                      foreign_language: e.target.checked,
                      thesis_language: e.target.checked ? record.thesis_language : '',
                    });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                Tesi in lingua straniera
              </label>
            </div>

            {record.foreign_language && (
              <div style={drawerFieldGroupStyle}>
                <label style={drawerLabelStyle}>Lingua tesi</label>
                <input
                  type="text"
                  placeholder="es. Inglese"
                  value={record.thesis_language}
                  onChange={e => onChange({ ...record, thesis_language: e.target.value })}
                  style={drawerInputStyle}
                />
              </div>
            )}

            {/* Actions row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                marginTop: '0.25rem',
              }}
            >
              {!record.is_current ? (
                <button
                  onClick={onSetCurrent}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--primary)',
                    padding: '0.25rem 0',
                    lineHeight: '1.5',
                  }}
                >
                  Segna come corrente
                </button>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                  }}
                >
                  Record corrente
                </span>
              )}
              {totalCount > 1 && (
                <button
                  onClick={onRemove}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--destructive-foreground)',
                    padding: '0.25rem 0',
                    lineHeight: '1.5',
                  }}
                >
                  <Trash2 size={12} />
                  Rimuovi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────
interface CreateStudentDrawerProps {
  open: boolean;
  onClose: () => void;
  onStudentCreated: (student: Student) => void;
  /** Edit mode: pass existing student to pre-fill */
  editStudent?: Student | null;
  /** Edit mode: called on save with updated student */
  onStudentUpdated?: (student: Student) => void;
}

export function CreateStudentDrawer({
  open,
  onClose,
  onStudentCreated,
  editStudent,
  onStudentUpdated,
}: CreateStudentDrawerProps) {
  const isEditMode = !!editStudent;
  const navigate = useNavigate();
  const { data: lavorazioni, pipelines } = useLavorazioni();

  // Sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    anagrafica: true,
    academic: true,
    riferimenti: false,
  });
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Account fields ────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(''); // mantenuto per compatibilità
  const [phone, setPhone] = useState(''); // mantenuto per compatibilità
  const [marketingConsent, setMarketingConsent] = useState(false); // mantenuto per compatibilità

  // ─── Contatti strutturati ──────────────────────────────────
  const [emails, setEmails] = useState<ContactEmail[]>([]);
  const [phones, setPhones] = useState<ContactPhone[]>([]);

  // ─── Academic records (multiple) ───────────────────────────
  const [academicRecords, setAcademicRecords] = useState<AcademicRecordFormData[]>([]);
  const [expandedRecordIdx, setExpandedRecordIdx] = useState<number | null>(null);

  // ─── Populate fields when editStudent changes ─────────────
  useEffect(() => {
    if (editStudent) {
      setFirstName(editStudent.first_name || '');
      setLastName(editStudent.last_name || '');
      setEmail(editStudent.email || '');
      setPhone(editStudent.phone || '');
      setMarketingConsent(editStudent.marketing_consent || false);

      // Migra contatti alla struttura attuale
      if (editStudent.contacts && editStudent.contacts.emails.length > 0) {
        const migratedEmails = editStudent.contacts.emails.map(e => {
          const oldPurposes = e.purposes as any[];
          let newPurposes: ('generic' | 'service_access')[];
          if (oldPurposes.includes('service_access') || oldPurposes.includes('timeline')) {
            newPurposes = ['service_access'];
          } else {
            newPurposes = ['generic'];
          }
          return { ...e, purposes: newPurposes };
        });

        const migratedPhones = editStudent.contacts.phones.map(p => {
          const oldPurposes = p.purposes as any[];
          let newPurposes: ('communications' | 'coaching')[];
          if (oldPurposes.includes('coaching')) {
            newPurposes = ['coaching'];
          } else {
            newPurposes = ['communications'];
          }
          return { ...p, purposes: newPurposes };
        });

        setEmails(migratedEmails);
        setPhones(migratedPhones);
      } else {
        const migratedEmails: ContactEmail[] = editStudent.email
          ? [{ email: editStudent.email, is_primary: true, purposes: ['generic'], source: 'manual', added_at: editStudent.created_at }]
          : [];
        const migratedPhones: ContactPhone[] = editStudent.phone
          ? [{ phone: editStudent.phone, is_primary: true, purposes: ['communications'], source: 'manual', added_at: editStudent.created_at }]
          : [];
        setEmails(migratedEmails);
        setPhones(migratedPhones);
      }

      const records: AcademicRecordFormData[] = (editStudent.academic_records || []).map(ar => ({
        id: ar.id,
        degree_level: ar.degree_level || '',
        course_name: ar.course_name || '',
        university_name: ar.university_name || '',
        thesis_professor: ar.thesis_professor || '',
        thesis_subject: ar.thesis_subject || '',
        foreign_language: ar.foreign_language ?? false,
        thesis_language: ar.thesis_language || '',
        thesis_type: ar.thesis_type || '',
        is_current: ar.is_current ?? false,
        created_at: ar.created_at,
        updated_at: ar.updated_at,
      }));
      setAcademicRecords(records);
      setExpandedRecordIdx(records.length > 0 ? records.findIndex(r => r.is_current) : null);
      setExpandedSections({ anagrafica: true, academic: true });
    } else {
      // Reset per creazione
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMarketingConsent(false);
      setEmails([]);
      setPhones([]);

      const today = new Date().toISOString().split('T')[0];
      setAcademicRecords([{
        id: `AR-NEW-${Date.now()}`,
        degree_level: '',
        course_name: '',
        university_name: '',
        thesis_professor: '',
        thesis_subject: '',
        foreign_language: false,
        thesis_language: '',
        thesis_type: '',
        is_current: true,
        created_at: today,
        updated_at: today,
      }]);
      setExpandedRecordIdx(0);
      setExpandedSections({ anagrafica: true, academic: true });
    }
    setErrors({});
  }, [editStudent]);

  // ─── Academic record mutations ─────────────────────────────
  const handleRecordChange = (idx: number, updated: AcademicRecordFormData) => {
    const today = new Date().toISOString().split('T')[0];
    setAcademicRecords(prev => prev.map((r, i) => (i === idx ? { ...updated, updated_at: today } : r)));
  };

  const handleSetCurrent = (idx: number) => {
    setAcademicRecords(prev => prev.map((r, i) => ({ ...r, is_current: i === idx })));
  };

  const handleRemoveRecord = (idx: number) => {
    setAcademicRecords(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some(r => r.is_current)) {
        next[0].is_current = true;
      }
      return next;
    });
    if (expandedRecordIdx === idx) setExpandedRecordIdx(null);
    else if (expandedRecordIdx !== null && expandedRecordIdx > idx)
      setExpandedRecordIdx(expandedRecordIdx - 1);
  };

  const handleAddRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: AcademicRecordFormData = {
      id: `AR-NEW-${Date.now()}`,
      degree_level: '',
      course_name: '',
      university_name: '',
      thesis_professor: '',
      thesis_subject: '',
      foreign_language: false,
      thesis_language: '',
      thesis_type: '',
      is_current: academicRecords.length === 0,
      created_at: today,
      updated_at: today,
    };
    setAcademicRecords(prev => [...prev, newRecord]);
    setExpandedRecordIdx(academicRecords.length);
  };

  // ─── Validation ───────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Obbligatorio';
    if (!lastName.trim()) newErrors.lastName = 'Obbligatorio';
    if (!email.trim()) newErrors.email = 'Obbligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email non valida';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setExpandedSections(prev => ({ ...prev, anagrafica: true }));
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const today = new Date().toISOString().split('T')[0];
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const studentId = isEditMode ? editStudent!.id : `STU-${Date.now().toString().slice(-3)}`;

    const finalRecords: StudentAcademicRecord[] = academicRecords
      .filter(r => r.degree_level || r.course_name || r.university_name || r.thesis_professor || r.thesis_subject || r.thesis_type)
      .map(r => ({
        id: r.id,
        student_id: studentId,
        degree_level: r.degree_level,
        course_name: r.course_name.trim(),
        university_name: r.university_name.trim(),
        thesis_professor: r.thesis_professor.trim(),
        thesis_subject: r.thesis_subject.trim(),
        foreign_language: r.foreign_language,
        thesis_language: r.foreign_language ? r.thesis_language.trim() : '',
        thesis_type: r.thesis_type,
        is_current: r.is_current,
        created_at: r.created_at,
        updated_at: today,
      }));

    if (finalRecords.length > 0 && !finalRecords.some(r => r.is_current)) {
      finalRecords[finalRecords.length - 1].is_current = true;
    }

    const student: Student = {
      id: studentId,
      name: fullName,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: isEditMode ? editStudent!.status : 'active',
      academic_records: finalRecords,
      created_at: isEditMode ? editStudent!.created_at : today,
      marketing_consent: marketingConsent,
      contacts: { emails, phones },
    };

    if (isEditMode && onStudentUpdated) {
      onStudentUpdated(student);
    } else {
      onStudentCreated(student);
    }
  };

  // Badges
  const academicBadge = useMemo(() => {
    const filled = academicRecords.filter(r => r.degree_level || r.course_name || r.university_name).length;
    if (filled === 0) return undefined;
    return `${filled} record${filled > 1 ? 's' : ''}`;
  }, [academicRecords]);

  // ─── Pipeline contacts (solo in edit mode) ────────────────
  const pipelineContacts = useMemo(() => {
    if (!isEditMode || !editStudent) return undefined;

    const relatedPipelines = pipelines.filter(p => p.student_id === editStudent.id);
    if (relatedPipelines.length === 0) return undefined;

    const pipelineEmails = [
      ...new Set(
        relatedPipelines
          .flatMap(p => [p.email])
          .filter(e => e && !emails.some(existing => existing.email.toLowerCase() === e.toLowerCase()))
      ),
    ];

    const pipelinePhones = [
      ...new Set(
        relatedPipelines
          .flatMap(p => [p.phone])
          .filter(ph => ph && !phones.some(existing => existing.phone === ph))
      ),
    ];

    if (pipelineEmails.length === 0 && pipelinePhones.length === 0) return undefined;

    return {
      emails: pipelineEmails,
      phones: pipelinePhones,
      pipelineId: relatedPipelines.map(p => p.id).join(', '),
    };
  }, [isEditMode, editStudent, pipelines, emails, phones]);

  if (!open) return null;

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell>
        <DrawerHeader
          icon={<User size={20} />}
          title={isEditMode ? editStudent!.name : 'Nuovo studente'}
          subtitle={isEditMode ? `ID: ${editStudent!.id}` : undefined}
          onClose={onClose}
        />

        {isEditMode && (
          <DrawerMetaRow>
            Ultimo aggiornamento: {editStudent!.updated_by || '—'} —{' '}
            {editStudent!.updated_at
              ? new Date(editStudent!.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : new Date(editStudent!.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </DrawerMetaRow>
        )}

        <DrawerBody>
          {/* ─── Sezione 1: Anagrafica base ──────────────── */}
          <DrawerSectionToggle
            icon={User}
            title="Anagrafica"
            isOpen={expandedSections.anagrafica}
            onToggle={() => toggleSection('anagrafica')}
          />
          {expandedSections.anagrafica && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Nome *</label>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: '' })); }}
                    style={{
                      ...drawerInputStyle,
                      borderColor: errors.firstName ? 'var(--destructive-foreground)' : 'var(--border)',
                    }}
                  />
                  {errors.firstName && (
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--destructive-foreground)', lineHeight: '1.5' }}>
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div style={drawerFieldGroupStyle}>
                  <label style={drawerLabelStyle}>Cognome *</label>
                  <input
                    type="text"
                    placeholder="Cognome"
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: '' })); }}
                    style={{
                      ...drawerInputStyle,
                      borderColor: errors.lastName ? 'var(--destructive-foreground)' : 'var(--border)',
                    }}
                  />
                  {errors.lastName && (
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--destructive-foreground)', lineHeight: '1.5' }}>
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Manager */}
              <ContactManager
                emails={emails}
                phones={phones}
                onUpdateEmails={setEmails}
                onUpdatePhones={setPhones}
                pipelineContacts={pipelineContacts}
              />
            </div>
          )}

          {/* ─── Sezione 2: Profili Accademici (multiple) ───── */}
          <DrawerSectionToggle
            icon={GraduationCap}
            title="Profili Accademici"
            isOpen={expandedSections.academic}
            onToggle={() => toggleSection('academic')}
            badge={academicBadge}
          />
          {expandedSections.academic && (
            <div style={{ marginBottom: '1.5rem' }}>
              {academicRecords.length === 0 ? (
                <div style={{ marginBottom: '0.75rem' }}>
                  <DrawerEmptyState>
                    Nessun record accademico. Aggiungi un record per tracciare il percorso di studi.
                  </DrawerEmptyState>
                </div>
              ) : (
                academicRecords.map((rec, idx) => (
                  <AcademicRecordPanel
                    key={rec.id}
                    record={rec}
                    index={idx}
                    totalCount={academicRecords.length}
                    expanded={expandedRecordIdx === idx}
                    onToggle={() => setExpandedRecordIdx(expandedRecordIdx === idx ? null : idx)}
                    onChange={updated => handleRecordChange(idx, updated)}
                    onRemove={() => handleRemoveRecord(idx)}
                    onSetCurrent={() => handleSetCurrent(idx)}
                  />
                ))
              )}
              <DrawerAddButton onClick={handleAddRecord}>
                <Plus size={14} />
                Aggiungi record accademico
              </DrawerAddButton>
            </div>
          )}

          {/* ─── Sezione 3: Lavorazioni (solo in edit mode) ───── */}
          {isEditMode && editStudent && (() => {
            const studentLavorazioni = lavorazioni.filter(l => l.student_id === editStudent.id);
            return (
              <>
                <DrawerSectionToggle
                  icon={Briefcase}
                  title="Lavorazioni"
                  isOpen={expandedSections.lavorazioni !== false}
                  onToggle={() => toggleSection('lavorazioni')}
                  badge={studentLavorazioni.length > 0 ? `${studentLavorazioni.length}` : undefined}
                />
                {expandedSections.lavorazioni !== false && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    {studentLavorazioni.length === 0 ? (
                      <DrawerEmptyState>Nessuna lavorazione associata.</DrawerEmptyState>
                    ) : (
                      studentLavorazioni.map(svc => (
                        <div key={svc.id} style={{ marginBottom: '0.5rem' }}>
                          <DrawerLinkedServiceCard
                            id={svc.id}
                            serviceName={svc.service_name}
                            status={svc.status}
                            coachName={svc.coach_name}
                            referente={svc.referente}
                            onNavigate={() => {
                              onClose();
                              setTimeout(() => navigate(`/lavorazioni?highlight=${svc.id}`), 100);
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* ─── Sezione 4: Contatti da pipeline (solo in edit mode) ───── */}
          {isEditMode && editStudent && pipelineContacts && (() => {
            const { emails: pipelineEmails, phones: pipelinePhones } = pipelineContacts;

            return (
              <>
                <DrawerSectionToggle
                  icon={Mail}
                  title="Contatti da pipeline"
                  isOpen={expandedSections.pipelineContacts !== false}
                  onToggle={() => toggleSection('pipelineContacts')}
                  badge={
                    pipelineEmails.length + pipelinePhones.length > 0
                      ? `${pipelineEmails.length + pipelinePhones.length}`
                      : undefined
                  }
                />
                {expandedSections.pipelineContacts !== false && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    {pipelineEmails.length === 0 && pipelinePhones.length === 0 ? (
                      <DrawerEmptyState>Nessun contatto associato da pipeline.</DrawerEmptyState>
                    ) : (
                      <>
                        {pipelineEmails.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <h3
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: 'var(--text-label)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--foreground)',
                                lineHeight: '1.5',
                              }}
                            >
                              Email
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {pipelineEmails.map(email => (
                                <li key={email} style={{ marginBottom: '0.25rem' }}>
                                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                    {email}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {pipelinePhones.length > 0 && (
                          <div>
                            <h3
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: 'var(--text-label)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--foreground)',
                                lineHeight: '1.5',
                              }}
                            >
                              Telefoni
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {pipelinePhones.map(phone => (
                                <li key={phone} style={{ marginBottom: '0.25rem' }}>
                                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                    {phone}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            onClick={() => {
                              const newEmails = [
                                ...emails,
                                ...pipelineEmails.map(email => ({
                                  email,
                                  is_primary: false,
                                  purposes: ['generic'] as ('generic' | 'service_access')[],
                                  source: 'pipeline',
                                  added_at: new Date().toISOString().split('T')[0],
                                })),
                              ];
                              const newPhones = [
                                ...phones,
                                ...pipelinePhones.map(phone => ({
                                  phone,
                                  is_primary: false,
                                  purposes: ['communications', 'coaching'] as ('communications' | 'coaching')[],
                                  source: 'pipeline',
                                  added_at: new Date().toISOString().split('T')[0],
                                })),
                              ];
                              setEmails(newEmails);
                              setPhones(newPhones);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--muted-foreground)',
                              cursor: 'pointer',
                              lineHeight: '1.5',
                            }}
                          >
                            Aggiungi contatti
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* ─── Sezione Audit e Riferimenti (solo edit) ─── */}
          {isEditMode && editStudent && (
            <DrawerCollapsibleSection
              icon={Hash}
              title="Audit e Riferimenti"
              isOpen={expandedSections.riferimenti}
              onToggle={() => toggleSection('riferimenti')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* ID + Stato */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>ID Studente</div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {editStudent.id}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Stato</div>
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
                      ...(editStudent.status === 'active'
                        ? { color: 'var(--primary)', borderColor: 'var(--primary)', backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)' }
                        : editStudent.status === 'blocked'
                          ? { color: 'var(--destructive-foreground)', borderColor: 'var(--destructive-foreground)', backgroundColor: 'color-mix(in srgb, var(--destructive-foreground) 8%, transparent)' }
                          : { color: 'var(--muted-foreground)', borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }
                      ),
                    }}>
                      {editStudent.status === 'active' ? 'Attivo' : editStudent.status === 'blocked' ? 'Bloccato' : 'Invitato'}
                    </span>
                  </div>
                </div>

                {/* Lavorazioni collegate */}
                {(() => {
                  const studentLav = lavorazioni.filter(l => l.student_id === editStudent.id);
                  return studentLav.length > 0 ? (
                    <div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.375rem' }}>
                        Lavorazioni ({studentLav.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {studentLav.map(lav => (
                          <div key={lav.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.625rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5', display: 'block' }}>
                                {lav.id}
                              </span>
                              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                {lav.service_name}
                              </span>
                            </div>
                            <button
                              onClick={() => { onClose(); navigate(`/lavorazioni?highlight=${lav.id}`); }}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '11px', flexShrink: 0 }}
                            >
                              Apri <ExternalLink size={11} style={{ marginLeft: '3px' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Lavorazioni</div>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>Nessuna lavorazione collegata</span>
                    </div>
                  );
                })()}

                {/* N. record accademici + Data creazione */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Record accademici</div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {editStudent.academic_records?.length > 0
                        ? `${editStudent.academic_records.length} record`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5', marginBottom: '0.2rem' }}>Creato il</div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                      {editStudent.created_at
                        ? new Date(editStudent.created_at).toLocaleDateString('it-IT')
                        : '—'}
                    </span>
                  </div>
                </div>

              </div>
            </DrawerCollapsibleSection>
          )}
        </DrawerBody>

        <DrawerFooter>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: 'var(--text-label)' }}
          >
            {isEditMode ? 'Chiudi' : 'Annulla'}
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: 'var(--text-label)' }}
          >
            {isEditMode ? 'Salva modifiche' : 'Crea studente'}
          </button>
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}