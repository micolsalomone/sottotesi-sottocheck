import React, { useState } from 'react';
import { Mail, Phone, Plus, Trash2, Key, MessageCircle, Phone as PhoneIcon, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ContactEmail, ContactPhone } from '../data/LavorazioniContext';

interface ContactManagerProps {
  emails: ContactEmail[];
  phones: ContactPhone[];
  onUpdateEmails: (emails: ContactEmail[]) => void;
  onUpdatePhones: (phones: ContactPhone[]) => void;
  pipelineContacts?: {
    emails: string[];
    phones: string[];
    pipelineId: string;
  };
  mode?: 'student' | 'pipeline' | 'coach';
  marketingConsent?: boolean; // Marketing consent della pipeline/studente
  onUpdateMarketingConsent?: (consent: boolean) => void;
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.625rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-regular)',
  backgroundColor: 'var(--input-background)',
  color: 'var(--foreground)',
  outline: 'none',
  width: '100%',
  lineHeight: '1.5',
};

export function ContactManager({ 
  emails, 
  phones, 
  onUpdateEmails, 
  onUpdatePhones,
  pipelineContacts,
  mode = 'student',
  marketingConsent = false,
  onUpdateMarketingConsent,
}: ContactManagerProps) {
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editingEmailPurposes, setEditingEmailPurposes] = useState<string | null>(null);
  const [editingPhonePurposes, setEditingPhonePurposes] = useState<string | null>(null);
  const [tempEmailValue, setTempEmailValue] = useState('');
  const [tempPhoneValue, setTempPhoneValue] = useState('');
  const [editingMarketingConsent, setEditingMarketingConsent] = useState(false);

  const primaryEmail = emails.find(e => e.is_primary);
  const additionalEmails = emails.filter(e => !e.is_primary);
  const primaryPhone = phones.find(p => p.is_primary);
  const additionalPhones = phones.filter(p => !p.is_primary);

  // ─── Email Handlers ───────────────────────────────────────
  const handleAddEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Inserisci un\'email valida');
      return;
    }

    if (emails.some(e => e.email.toLowerCase() === newEmail.toLowerCase())) {
      toast.error('Email già presente');
      return;
    }

    const newContact: ContactEmail = {
      email: newEmail.trim(),
      is_primary: emails.length === 0,
      purposes: ['generic'],
      source: 'manual',
      added_at: new Date().toISOString(),
    };

    onUpdateEmails([...emails, newContact]);
    setNewEmail('');
    toast.success('Email aggiunta');
  };

  const handleRemoveEmail = (email: string) => {
    const emailData = emails.find(e => e.email === email);
    if (emailData?.is_primary && emails.length > 1) {
      toast.error('Non puoi eliminare l\'email principale. Imposta prima un\'altra email come principale.');
      return;
    }
    
    onUpdateEmails(emails.filter(e => e.email !== email));
    toast.success('Email rimossa');
  };

  const handleSetPrimaryEmail = (email: string) => {
    onUpdateEmails(
      emails.map(e => ({ ...e, is_primary: e.email === email }))
    );
    toast.success('Email principale aggiornata');
  };

  const handleStartEditEmail = (email: string) => {
    setEditingEmail(email);
    setTempEmailValue(email);
  };

  const handleSaveEditEmail = (oldEmail: string) => {
    if (!tempEmailValue.trim() || !tempEmailValue.includes('@')) {
      toast.error('Email non valida');
      return;
    }

    if (tempEmailValue !== oldEmail && emails.some(e => e.email.toLowerCase() === tempEmailValue.toLowerCase())) {
      toast.error('Email già presente');
      return;
    }

    onUpdateEmails(
      emails.map(e => e.email === oldEmail ? { ...e, email: tempEmailValue.trim() } : e)
    );
    setEditingEmail(null);
    toast.success('Email aggiornata');
  };

  const handleToggleEmailPurpose = (email: string, purpose: 'generic') => {
    onUpdateEmails(
      emails.map(e => {
        if (e.email !== email) return e;
        
        const currentPurposes = e.purposes;
        const hasPurpose = currentPurposes.includes(purpose);
        
        if (hasPurpose) {
          const newPurposes = currentPurposes.filter(p => p !== purpose);
          if (newPurposes.length === 0) {
            toast.error('L\'email deve avere almeno un tipo di utilizzo');
            return e;
          }
          return { ...e, purposes: newPurposes };
        } else {
          return { ...e, purposes: [...currentPurposes, purpose] };
        }
      })
    );
  };

  const handleSendPasswordReset = (email: string) => {
    toast.success(`Link reset password inviato a ${email}`);
  };

  // ─── Service Access ───────────────────────────────────────
  /** Imposta radio: rimuove service_access da tutte le email, aggiunge a targetEmail */
  const handleSetServiceAccess = (targetEmail: string) => {
    const label = mode === 'coach' ? 'accesso timeline coaching' : 'accesso servizi';
    onUpdateEmails(
      emails.map(e => ({
        ...e,
        purposes: (
          e.email === targetEmail
            ? [...new Set([...e.purposes, 'service_access'])]
            : e.purposes.filter(p => p !== 'service_access')
        ) as ('generic' | 'service_access')[],
      }))
    );
    toast.success(`Email di ${label} impostata`);
  };

  const serviceAccessLabel = mode === 'coach' ? 'Accesso timeline coaching' : 'Accesso servizi';

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  // ─── Phone Handlers ───────────────────────────────────────
  const handleAddPhone = () => {
    if (!newPhone.trim()) {
      toast.error('Inserisci un numero di telefono');
      return;
    }

    if (phones.some(p => p.phone === newPhone.trim())) {
      toast.error('Telefono già presente');
      return;
    }

    const newContact: ContactPhone = {
      phone: newPhone.trim(),
      is_primary: phones.length === 0,
      purposes: ['communications'],
      source: 'manual',
      added_at: new Date().toISOString(),
    };

    onUpdatePhones([...phones, newContact]);
    setNewPhone('');
    toast.success('Telefono aggiunto');
  };

  const handleRemovePhone = (phone: string) => {
    const phoneData = phones.find(p => p.phone === phone);
    if (phoneData?.is_primary && phones.length > 1) {
      toast.error('Non puoi eliminare il telefono principale. Imposta prima un altro telefono come principale.');
      return;
    }
    
    onUpdatePhones(phones.filter(p => p.phone !== phone));
    toast.success('Telefono rimosso');
  };

  const handleSetPrimaryPhone = (phone: string) => {
    onUpdatePhones(
      phones.map(p => ({ ...p, is_primary: p.phone === phone }))
    );
    toast.success('Telefono principale aggiornato');
  };

  const handleStartEditPhone = (phone: string) => {
    setEditingPhone(phone);
    setTempPhoneValue(phone);
  };

  const handleSaveEditPhone = (oldPhone: string) => {
    if (!tempPhoneValue.trim()) {
      toast.error('Telefono non valido');
      return;
    }

    if (tempPhoneValue !== oldPhone && phones.some(p => p.phone === tempPhoneValue)) {
      toast.error('Telefono già presente');
      return;
    }

    onUpdatePhones(
      phones.map(p => p.phone === oldPhone ? { ...p, phone: tempPhoneValue.trim() } : p)
    );
    setEditingPhone(null);
    toast.success('Telefono aggiornato');
  };

  const handleTogglePhonePurpose = (phone: string, purpose: 'communications' | 'coaching') => {
    onUpdatePhones(
      phones.map(p => {
        if (p.phone !== phone) return p;
        
        const currentPurposes = p.purposes;
        const hasPurpose = currentPurposes.includes(purpose);
        
        if (hasPurpose) {
          const newPurposes = currentPurposes.filter(pur => pur !== purpose);
          if (newPurposes.length === 0) {
            toast.error('Il telefono deve avere almeno un tipo di utilizzo');
            return p;
          }
          return { ...p, purposes: newPurposes };
        } else {
          return { ...p, purposes: [...currentPurposes, purpose] };
        }
      })
    );
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const openPhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  // ─── Import from Pipeline ─────────────────────────────────
  const handleImportFromPipeline = () => {
    if (!pipelineContacts) return;

    let addedCount = 0;
    const newEmails = [...emails];
    const newPhones = [...phones];

    pipelineContacts.emails.forEach(email => {
      if (!newEmails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
        const newContact: ContactEmail = {
          email,
          is_primary: newEmails.length === 0 && addedCount === 0,
          purposes: ['generic'],
          source: `pipeline:${pipelineContacts.pipelineId}`,
          added_at: new Date().toISOString(),
        };
        newEmails.push(newContact);
        addedCount++;
      }
    });

    pipelineContacts.phones.forEach(phone => {
      if (!newPhones.some(p => p.phone === phone)) {
        const newContact: ContactPhone = {
          phone,
          is_primary: newPhones.length === 0 && newEmails.length === 0,
          purposes: ['communications'],
          source: `pipeline:${pipelineContacts.pipelineId}`,
          added_at: new Date().toISOString(),
        };
        newPhones.push(newContact);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      onUpdateEmails(newEmails);
      onUpdatePhones(newPhones);
      toast.success(`${addedCount} contatti importati dalla pipeline`);
    } else {
      toast.info('Tutti i contatti sono già presenti');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Import da Pipeline */}
      {pipelineContacts && (pipelineContacts.emails.length > 0 || pipelineContacts.phones.length > 0) && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
              marginBottom: '0.125rem',
            }}>
              Contatti da Pipeline {pipelineContacts.pipelineId}
            </div>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              {pipelineContacts.emails.length} email, {pipelineContacts.phones.length} telefoni disponibili
            </div>
          </div>
          <button
            type="button"
            onClick={handleImportFromPipeline}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '0.375rem 0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} />
            Importa
          </button>
        </div>
      )}

      {/* Marketing Consent (solo per pipeline) */}
      {mode === 'pipeline' && onUpdateMarketingConsent && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
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
            Marketing
          </div>
          {editingMarketingConsent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                flex: 1,
              }}>
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => onUpdateMarketingConsent(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: marketingConsent ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                  color: marketingConsent ? 'var(--primary)' : 'var(--foreground)',
                  lineHeight: '1.5',
                }}>
                  Consenso attivo
                </span>
              </label>
              <button
                onClick={() => setEditingMarketingConsent(false)}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Salva"
              >
                <Save size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                onClick={() => setEditingMarketingConsent(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: marketingConsent ? 'var(--primary)' : 'var(--foreground)',
                  lineHeight: '1.5',
                  flex: 1,
                }}
                title="Clicca per modificare"
              >
                <span>{marketingConsent ? 'Consenso attivo' : 'Nessun consenso'}</span>
                <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EMAIL SECTION ────────────────────────────────────── */}
      <section>
        <h3 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          margin: '0 0 0.75rem 0',
          lineHeight: '1.5',
        }}>
          Email
        </h3>

        {/* Email principale */}
        {primaryEmail && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              lineHeight: '1.5',
            }}>
              Email principale
            </div>
            {editingEmail === primaryEmail.email ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="email"
                  value={tempEmailValue}
                  onChange={(e) => setTempEmailValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditEmail(primaryEmail.email);
                    if (e.key === 'Escape') { setEditingEmail(null); }
                  }}
                  style={{ ...inputStyle, fontSize: '12px', padding: '0.25rem 0.5rem', flex: 1 }}
                />
                <button
                  onClick={() => handleSaveEditEmail(primaryEmail.email)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div
                  onClick={() => handleStartEditEmail(primaryEmail.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                    flex: 1,
                  }}
                  title="Clicca per modificare"
                >
                  <span>{primaryEmail.email}</span>
                  <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                </div>
                <button
                  onClick={() => openEmail(primaryEmail.email)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                  title="Invia email"
                >
                  <Mail size={14} />
                </button>
              </div>
            )}

            {/* Purposes (editable solo con matitina) */}
            <div style={{ 
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              {editingEmailPurposes === primaryEmail.email ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={primaryEmail.purposes.includes('generic')}
                        onChange={() => handleToggleEmailPurpose(primaryEmail.email, 'generic')}
                        style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        Comunicazioni
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={() => setEditingEmailPurposes(null)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: 'none',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                  >
                    <Save size={12} style={{ marginRight: '0.25rem' }} />
                    Salva
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setEditingEmailPurposes(primaryEmail.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                  title="Clicca per modificare"
                >
                  <span style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                    flex: 1,
                  }}>
                    {primaryEmail.purposes.filter(p => p !== 'service_access').map(p => {
                      if (p === 'generic') return 'Comunicazioni';
                      return p;
                    }).join(' · ') || 'Nessun purpose'}
                  </span>
                  <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                </div>
              )}

              {/* ── Service access badge (non per pipeline) ── */}
              {mode !== 'pipeline' && (
                <div style={{ marginTop: '0.375rem' }}>
                  {primaryEmail.purposes.includes('service_access') ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--primary)',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius)',
                      background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                    }}>
                      <Key size={10} />
                      {serviceAccessLabel}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetServiceAccess(primaryEmail.email)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        padding: 0,
                        lineHeight: '1.5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Key size={10} />
                      Imposta come {serviceAccessLabel.toLowerCase()}
                    </button>
                  )}
                </div>
              )}
            </div>


          </div>
        )}

        {/* Email aggiuntive */}
        {additionalEmails.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {additionalEmails.map(emailData => (
              <div
                key={emailData.email}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                {editingEmail === emailData.email ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="email"
                      value={tempEmailValue}
                      onChange={(e) => setTempEmailValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditEmail(emailData.email);
                        if (e.key === 'Escape') { setEditingEmail(null); }
                      }}
                      style={{ ...inputStyle, fontSize: '12px', padding: '0.25rem 0.5rem', flex: 1 }}
                    />
                    <button
                      onClick={() => handleSaveEditEmail(emailData.email)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div
                      onClick={() => handleStartEditEmail(emailData.email)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                        flex: 1,
                      }}
                      title="Clicca per modificare"
                    >
                      <span>{emailData.email}</span>
                      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                    </div>
                    <button
                      onClick={() => openEmail(emailData.email)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                      title="Invia email"
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveEmail(emailData.email)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'var(--destructive)' }}
                      title="Rimuovi email"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Purposes + Imposta principale */}
                <div style={{ 
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border)',
                }}>
                  {editingEmailPurposes === emailData.email ? (
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        flexWrap: 'wrap',
                        marginBottom: '0.5rem',
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={emailData.purposes.includes('generic')}
                            onChange={() => handleToggleEmailPurpose(emailData.email, 'generic')}
                            style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                          />
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            Comunicazioni
                          </span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setEditingEmailPurposes(null)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            lineHeight: '1.5',
                          }}
                        >
                          <Save size={12} style={{ marginRight: '0.25rem' }} />
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryEmail(emailData.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--primary)',
                            padding: 0,
                            lineHeight: '1.5',
                          }}
                        >
                          Imposta principale
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        onClick={() => setEditingEmailPurposes(emailData.email)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                        title="Clicca per modificare"
                      >
                        <span style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}>
                          {emailData.purposes.filter(p => p !== 'service_access').map(p => {
                            if (p === 'generic') return 'Comunicazioni';
                            return p;
                          }).join(' · ') || 'Nessun purpose'}
                        </span>
                        <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryEmail(emailData.email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--primary)',
                          padding: 0,
                          lineHeight: '1.5',
                        }}
                      >
                        Imposta principale
                      </button>
                    </div>
                  )}

                  {/* ── Service access badge (non per pipeline) ── */}
                  {mode !== 'pipeline' && (
                    <div style={{ marginTop: '0.375rem' }}>
                      {emailData.purposes.includes('service_access') ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--primary)',
                          padding: '2px 7px',
                          borderRadius: 'var(--radius)',
                          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                        }}>
                          <Key size={10} />
                          {serviceAccessLabel}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetServiceAccess(emailData.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            padding: 0,
                            lineHeight: '1.5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Key size={10} />
                          Imposta come {serviceAccessLabel.toLowerCase()}
                        </button>
                      )}
                    </div>
                  )}
                </div>


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
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddEmail();
            }}
            style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '0.5rem' }}
          />
          <button
            onClick={handleAddEmail}
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            Aggiungi
          </button>
        </div>
      </section>

      {/* ─── PHONE SECTION ────────────────────────────────────── */}
      <section>
        <h3 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          margin: '0 0 0.75rem 0',
          lineHeight: '1.5',
        }}>
          Telefoni
        </h3>

        {/* Telefono principale */}
        {primaryPhone && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
              lineHeight: '1.5',
            }}>
              Telefono principale
            </div>
            {editingPhone === primaryPhone.phone ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="tel"
                  value={tempPhoneValue}
                  onChange={(e) => setTempPhoneValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditPhone(primaryPhone.phone);
                    if (e.key === 'Escape') { setEditingPhone(null); }
                  }}
                  style={{ ...inputStyle, fontSize: '12px', padding: '0.25rem 0.5rem', flex: 1 }}
                />
                <button
                  onClick={() => handleSaveEditPhone(primaryPhone.phone)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div
                  onClick={() => handleStartEditPhone(primaryPhone.phone)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                    flex: 1,
                  }}
                  title="Clicca per modificare"
                >
                  <span>{primaryPhone.phone}</span>
                  <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                </div>
                <button
                  onClick={() => openWhatsApp(primaryPhone.phone)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                  title="Apri WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>
                <button
                  onClick={() => openPhoneCall(primaryPhone.phone)}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                  title="Chiama"
                >
                  <PhoneIcon size={14} />
                </button>
              </div>
            )}

            {/* Purposes (editable solo con matitina) */}
            <div style={{ 
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              {editingPhonePurposes === primaryPhone.phone ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem',
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={primaryPhone.purposes.includes('communications')}
                        onChange={() => handleTogglePhonePurpose(primaryPhone.phone, 'communications')}
                        style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        Comunicazioni
                      </span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={primaryPhone.purposes.includes('coaching')}
                        onChange={() => handleTogglePhonePurpose(primaryPhone.phone, 'coaching')}
                        style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        Coaching
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={() => setEditingPhonePurposes(null)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: 'none',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      lineHeight: '1.5',
                    }}
                  >
                    <Save size={12} style={{ marginRight: '0.25rem' }} />
                    Salva
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setEditingPhonePurposes(primaryPhone.phone)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                  }}
                  title="Clicca per modificare"
                >
                  <span style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                    flex: 1,
                  }}>
                    {primaryPhone.purposes.map(p => {
                      if (p === 'communications') return 'Comunicazioni';
                      if (p === 'coaching') return 'Coaching';
                      return p;
                    }).join(' · ')}
                  </span>
                  <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Telefoni aggiuntivi */}
        {additionalPhones.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {additionalPhones.map(phoneData => (
              <div
                key={phoneData.phone}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                {editingPhone === phoneData.phone ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="tel"
                      value={tempPhoneValue}
                      onChange={(e) => setTempPhoneValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditPhone(phoneData.phone);
                        if (e.key === 'Escape') { setEditingPhone(null); }
                      }}
                      style={{ ...inputStyle, fontSize: '12px', padding: '0.25rem 0.5rem', flex: 1 }}
                    />
                    <button
                      onClick={() => handleSaveEditPhone(phoneData.phone)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div
                      onClick={() => handleStartEditPhone(phoneData.phone)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                        flex: 1,
                      }}
                      title="Clicca per modificare"
                    >
                      <span>{phoneData.phone}</span>
                      <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                    </div>
                    <button
                      onClick={() => openWhatsApp(phoneData.phone)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                      title="Apri WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={() => openPhoneCall(phoneData.phone)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                      title="Chiama"
                    >
                      <PhoneIcon size={14} />
                    </button>
                    <button
                      onClick={() => handleRemovePhone(phoneData.phone)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: 'var(--destructive)' }}
                      title="Rimuovi telefono"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Purposes + Imposta principale */}
                <div style={{ 
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border)',
                }}>
                  {editingPhonePurposes === phoneData.phone ? (
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.75rem', 
                        flexWrap: 'wrap',
                        marginBottom: '0.5rem',
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={phoneData.purposes.includes('communications')}
                            onChange={() => handleTogglePhonePurpose(phoneData.phone, 'communications')}
                            style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                          />
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            Comunicazioni
                          </span>
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={phoneData.purposes.includes('coaching')}
                            onChange={() => handleTogglePhonePurpose(phoneData.phone, 'coaching')}
                            style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                          />
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            Coaching
                          </span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setEditingPhonePurposes(null)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            lineHeight: '1.5',
                          }}
                        >
                          <Save size={12} style={{ marginRight: '0.25rem' }} />
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhone(phoneData.phone)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--primary)',
                            padding: 0,
                            lineHeight: '1.5',
                          }}
                        >
                          Imposta principale
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        onClick={() => setEditingPhonePurposes(phoneData.phone)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                        title="Clicca per modificare"
                      >
                        <span style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}>
                          {phoneData.purposes.map(p => {
                            if (p === 'communications') return 'Comunicazioni';
                            if (p === 'coaching') return 'Coaching';
                            return p;
                          }).join(' · ')}
                        </span>
                        <Pencil size={10} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryPhone(phoneData.phone)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--primary)',
                          padding: 0,
                          lineHeight: '1.5',
                        }}
                      >
                        Imposta principale
                      </button>
                    </div>
                  )}
                </div>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPhone();
            }}
            style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '0.5rem' }}
          />
          <button
            onClick={handleAddPhone}
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            Aggiungi
          </button>
        </div>
      </section>
    </div>
  );
}
