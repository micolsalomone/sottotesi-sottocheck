import React, { useState, useEffect } from 'react';
import { UserCheck, Hash } from 'lucide-react';
import { useAreeTematiche } from '../data/AreeTematicheContext';
import type { ContactEmail, ContactPhone } from '../data/LavorazioniContext';
import { ContactManager } from './ContactManager';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  DrawerFieldGroup,
  DrawerLabel,
  DrawerCollapsibleSection,
  DrawerMetaRow,
  DrawerInfoGrid,
  DrawerInfoGridItem,
  DrawerSearchSelect,
  drawerInputStyle,
} from './DrawerPrimitives';

// ─── Types ──────────────────────────────────────────────────
/** @deprecated use string[] on Coach.availability */
export type CoachAvailability = 'available' | 'limited' | 'full' | 'temporarily_unavailable';

export interface Coach {
  id: string;
  fullName: string;
  /** Email principale — deprecated, usare contacts.emails */
  email: string;
  /** Telefono principale — deprecated, usare contacts.phones */
  phone: string;
  /** Contatti strutturati (email e telefoni multipli) */
  contacts?: {
    emails: ContactEmail[];
    phones: ContactPhone[];
  };
  status: 'active' | 'inactive';
  activationDate: string;
  /** Array of availability labels (e.g. ['Disponibile', 'Weekend']) */
  availability: string[];
  payment_reference: string;
}

interface AuditInfo {
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

interface CreateCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coach: Coach) => void;
  editCoach?: Coach | null;
  auditInfo?: AuditInfo;
}

// Opzioni standard di disponibilità — espandibili via DrawerSearchSelect
const DEFAULT_AVAILABILITY_OPTIONS: string[] = [
  'Disponibile',
  'Disponibilità limitata',
  'Pieno',
  'Temporaneamente non disponibile',
  'Mattina',
  'Pomeriggio',
  'Sera',
  'Weekend',
];

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

// ─── Helper: build initial ContactEmail from a raw email string ──
function makeEmailContact(email: string, isPrimary = true): ContactEmail {
  return {
    email,
    is_primary: isPrimary,
    purposes: ['generic'],
    source: 'manual',
    added_at: new Date().toISOString(),
  };
}

// ─── Helper: build initial ContactPhone from a raw phone string ──
function makePhoneContact(phone: string, isPrimary = true): ContactPhone {
  return {
    phone,
    is_primary: isPrimary,
    purposes: ['communications'],
    source: 'manual',
    added_at: new Date().toISOString(),
  };
}

export function CreateCoachDrawer({ isOpen, onClose, onSave, editCoach, auditInfo }: CreateCoachDrawerProps) {
  const { getActiveAree, assignCoach, unassignCoach, getAreasForCoach } = useAreeTematiche();

  const [fullName, setFullName]       = useState('');
  const [emails, setEmails]           = useState<ContactEmail[]>([]);
  const [phones, setPhones]           = useState<ContactPhone[]>([]);
  const [availabilities, setAvailabilities] = useState<string[]>([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedAreaIds, setSelectedAreaIds]   = useState<string[]>([]);
  const [riferimentiOpen, setRiferimentiOpen]   = useState(false);

  // Opzioni disponibilità locali (si espandono con custom values)
  const [availabilityOptions, setAvailabilityOptions] = useState<string[]>(DEFAULT_AVAILABILITY_OPTIONS);

  const isEdit = !!editCoach;

  const activeAree = getActiveAree();

  // Mappa nome area → id e viceversa
  const areaNameToId = (name: string) => activeAree.find(a => a.name === name)?.id;
  const areaIdToName = (id: string)   => activeAree.find(a => a.id === id)?.name ?? id;
  const selectedAreaNames = selectedAreaIds.map(areaIdToName);
  const areaOptions = activeAree.map(a => a.name);

  useEffect(() => {
    if (editCoach) {
      setFullName(editCoach.fullName);

      // ── Emails ──────────────────────────────────────────────
      if (editCoach.contacts?.emails && editCoach.contacts.emails.length > 0) {
        setEmails(editCoach.contacts.emails);
      } else if (editCoach.email) {
        // Migrazione da campo legacy
        setEmails([makeEmailContact(editCoach.email, true)]);
      } else {
        setEmails([]);
      }

      // ── Phones ──────────────────────────────────────────────
      if (editCoach.contacts?.phones && editCoach.contacts.phones.length > 0) {
        setPhones(editCoach.contacts.phones);
      } else if (editCoach.phone) {
        // Migrazione da campo legacy
        setPhones([makePhoneContact(editCoach.phone, true)]);
      } else {
        setPhones([]);
      }

      // Supporto legacy: se il vecchio campo era una stringa singola, converti in array
      const avArr = Array.isArray(editCoach.availability)
        ? editCoach.availability
        : editCoach.availability
          ? [editCoach.availability as unknown as string]
          : [];
      setAvailabilities(avArr);
      setPaymentReference(editCoach.payment_reference);
      const coachAreas = getAreasForCoach(editCoach.id);
      setSelectedAreaIds(coachAreas.map(a => a.id));
    } else {
      setFullName('');
      setEmails([]);
      setPhones([]);
      setAvailabilities([]);
      setPaymentReference('');
      setSelectedAreaIds([]);
    }
  }, [editCoach, isOpen, getAreasForCoach]);

  const handleAddAvailability = (val: string) => {
    // Se è un valore custom, aggiungilo alle opzioni locali
    if (!availabilityOptions.includes(val)) {
      setAvailabilityOptions(prev => [...prev, val]);
    }
    setAvailabilities(prev => prev.includes(val) ? prev : [...prev, val]);
  };

  const handleRemoveAvailability = (val: string) => {
    setAvailabilities(prev => prev.filter(v => v !== val));
  };

  const handleSelectArea = (name: string) => {
    const id = areaNameToId(name);
    if (id && !selectedAreaIds.includes(id)) {
      setSelectedAreaIds(prev => [...prev, id]);
    }
  };

  const handleRemoveArea = (name: string) => {
    const id = areaNameToId(name);
    if (id) setSelectedAreaIds(prev => prev.filter(i => i !== id));
  };

  const handleSave = () => {
    if (!fullName.trim()) return;

    // Ricava email e telefono primari per retrocompatibilità
    const primaryEmail = emails.find(e => e.is_primary)?.email || emails[0]?.email || '';
    const primaryPhone = phones.find(p => p.is_primary)?.phone || phones[0]?.phone || '';

    const coach: Coach = {
      id: editCoach?.id || `C-${String(Math.floor(Math.random() * 900) + 100)}`,
      fullName: fullName.trim(),
      email: primaryEmail,
      phone: primaryPhone,
      contacts: { emails, phones },
      status: editCoach?.status || 'active',
      activationDate: editCoach?.activationDate || new Date().toISOString().split('T')[0],
      availability: availabilities,
      payment_reference: paymentReference.trim(),
    };

    if (editCoach) {
      const currentAreas = getAreasForCoach(editCoach.id);
      currentAreas.forEach(area => {
        if (!selectedAreaIds.includes(area.id)) unassignCoach(area.id, editCoach.id);
      });
      selectedAreaIds.forEach(areaId => {
        if (!currentAreas.find(a => a.id === areaId)) assignCoach(areaId, editCoach.id);
      });
    } else {
      selectedAreaIds.forEach(areaId => assignCoach(areaId, coach.id));
    }

    onSave(coach);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell>
        <DrawerHeader
          icon={<UserCheck size={20} />}
          title={isEdit ? editCoach!.fullName : 'Nuovo Coach'}
          subtitle={isEdit ? `ID: ${editCoach!.id}` : undefined}
          onClose={onClose}
        />

        {isEdit && auditInfo && (
          <DrawerMetaRow>
            Ultimo aggiornamento: {auditInfo.updated_by || '—'} —{' '}
            {auditInfo.updated_at ? fmtDateTime(auditInfo.updated_at) : fmtDate(auditInfo.created_at)}
          </DrawerMetaRow>
        )}

        <DrawerBody>

          {/* ── Dati personali ── */}
          <DrawerSection bordered={false} title="Dati personali">
            <DrawerFieldGroup>
              <DrawerLabel required>Nome completo</DrawerLabel>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Es. Maria Rossi"
                style={drawerInputStyle}
              />
            </DrawerFieldGroup>
          </DrawerSection>

          {/* ── Contatti (email e telefoni multipli) ── */}
          <DrawerSection title="Contatti">
            <ContactManager
              emails={emails}
              phones={phones}
              onUpdateEmails={setEmails}
              onUpdatePhones={setPhones}
              mode="coach"
            />
          </DrawerSection>

          {/* ── Disponibilità ── */}
          <DrawerSection title="Disponibilità">
            <DrawerFieldGroup style={{ marginBottom: 0 }}>
              <DrawerLabel>Stato / fasce orarie</DrawerLabel>
              <DrawerSearchSelect
                options={availabilityOptions}
                selected={availabilities}
                onSelect={handleAddAvailability}
                onRemove={handleRemoveAvailability}
                placeholder="Cerca o aggiungi disponibilità..."
              />
            </DrawerFieldGroup>
          </DrawerSection>

          {/* ── Aree Tematiche ── */}
          <DrawerSection title="Aree Tematiche">
            {activeAree.length === 0 ? (
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                }}
              >
                Nessuna area tematica attiva
              </span>
            ) : (
              <DrawerFieldGroup style={{ marginBottom: 0 }}>
                <DrawerSearchSelect
                  options={areaOptions}
                  selected={selectedAreaNames}
                  onSelect={handleSelectArea}
                  onRemove={handleRemoveArea}
                  placeholder="Cerca area tematica..."
                />
              </DrawerFieldGroup>
            )}
          </DrawerSection>

          {/* ── Dati pagamento ── */}
          <DrawerSection title="Dati pagamento">
            <DrawerFieldGroup style={{ marginBottom: 0 }}>
              <DrawerLabel>Riferimento pagamento (IBAN)</DrawerLabel>
              <input
                type="text"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="IT60 X054 2811 1010 0000 0123 456"
                style={drawerInputStyle}
              />
              <div
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--muted-foreground)',
                  marginTop: '0.375rem',
                  lineHeight: '1.5',
                }}
              >
                Utilizzato come riferimento per i pagamenti compensi
              </div>
            </DrawerFieldGroup>
          </DrawerSection>

          {/* ── Audit e Riferimenti (solo edit) ── */}
          {isEdit && editCoach && (
            <DrawerCollapsibleSection
              icon={Hash}
              title="Audit e Riferimenti"
              isOpen={riferimentiOpen}
              onToggle={() => setRiferimentiOpen(v => !v)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <DrawerInfoGrid>
                  <DrawerInfoGridItem label="ID Coach" value={editCoach.id} />
                  <DrawerInfoGridItem
                    label="Stato"
                    value={editCoach.status === 'active' ? 'Attivo' : 'Inattivo'}
                    valueColor={editCoach.status === 'active' ? 'var(--primary)' : 'var(--muted-foreground)'}
                  />
                  <DrawerInfoGridItem
                    label="Data attivazione"
                    value={fmtDate(editCoach.activationDate)}
                  />
                  <DrawerInfoGridItem
                    label="Aree tematiche"
                    value={selectedAreaIds.length > 0 ? `${selectedAreaIds.length} area${selectedAreaIds.length > 1 ? 'e' : ''}` : '—'}
                  />
                  <DrawerInfoGridItem
                    label="Email"
                    value={emails.length > 0 ? `${emails.length} contatt${emails.length > 1 ? 'i' : 'o'}` : '—'}
                  />
                  <DrawerInfoGridItem
                    label="Telefoni"
                    value={phones.length > 0 ? `${phones.length} contatt${phones.length > 1 ? 'i' : 'o'}` : '—'}
                  />
                  {auditInfo?.created_at && (
                    <DrawerInfoGridItem
                      label="Creato il"
                      value={`${fmtDate(auditInfo.created_at)}${auditInfo.created_by ? ` · ${auditInfo.created_by}` : ''}`}
                    />
                  )}
                  {auditInfo?.updated_at && (
                    <DrawerInfoGridItem
                      label="Ultimo aggiornamento"
                      value={`${fmtDateTime(auditInfo.updated_at)}${auditInfo.updated_by ? ` · ${auditInfo.updated_by}` : ''}`}
                    />
                  )}
                </DrawerInfoGrid>
              </div>
            </DrawerCollapsibleSection>
          )}

        </DrawerBody>

        <DrawerFooter>
          <button className="btn btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ opacity: fullName.trim() ? 1 : 0.5 }}
          >
            {isEdit ? 'Salva modifiche' : 'Crea Coach'}
          </button>
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}