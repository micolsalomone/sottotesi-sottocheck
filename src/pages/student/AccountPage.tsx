import { ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLavorazioni, type ContactEmail, type ContactPhone } from '@/app/data/LavorazioniContext';
import { STUDENT_VIEW_STUDENT_RECORD_ID } from '@/app/utils/studentView';
import { FormSection, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { AccountInfoRow, CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';
import { ChangeEmailModal } from '@/app/components/account/ChangeEmailModal';
import {
  readStudentEmailConsent,
  readStudentPhoneConsent,
  withStudentEmailConsent,
  withStudentPhoneConsent,
} from '@/app/data/marketingConsent';

/**
 * Return a NEW email array with the PRIMARY entry's `email` value replaced
 * (`Modifica email` flow only). Preserves that entry's `is_primary`,
 * `purposes`, `source`/`added_at` and every other email contact untouched —
 * this changes ONLY the value of the one contact this page ever exposes.
 * Because consent belongs to the exact address (MODEL B), the changed
 * entry's `marketing_consent` is reset to unset (unknown) rather than
 * carried over; it never touches any other contact's consent. A no-op when
 * no primary email entry exists to rename (not expected once this page's
 * `primaryEmail` is non-empty, but kept defensive).
 */
function withStudentPrimaryEmailChanged(emails: ContactEmail[] | undefined, newEmail: string): ContactEmail[] {
  const list: ContactEmail[] = emails ? emails.map((entry) => ({ ...entry })) : [];
  const index = list.findIndex((entry) => entry.is_primary);
  if (index === -1) return list;
  const { marketing_consent: _resetConsent, ...rest } = list[index];
  list[index] = { ...rest, email: newEmail };
  return list;
}

/**
 * Return a NEW phone array with the PRIMARY entry's `phone` value replaced
 * (`Salva numero` only) — same shape as `withStudentPrimaryEmailChanged`.
 * Preserves that entry's `is_primary`, `purposes`, `source`/`added_at` and
 * every other phone contact untouched. Because consent belongs to the exact
 * number (MODEL B), the changed entry's `marketing_consent` is reset to
 * unset (unknown) rather than carried over — the caller then re-reads
 * consent for the new number via `readStudentPhoneConsent`, which only
 * comes back non-null if some OTHER stored contact happens to already carry
 * that exact number. When no primary phone contact exists yet (this page
 * exposes only one), a new one is created — this is the same "gap-fill"
 * creation the previous implementation only allowed while the field was
 * empty; it is preserved here so a Student with no phone at all can still
 * add one from this now-always-editable field.
 */
function withStudentPrimaryPhoneChanged(phones: ContactPhone[] | undefined, newPhone: string): ContactPhone[] {
  const list: ContactPhone[] = phones ? phones.map((entry) => ({ ...entry })) : [];
  const index = list.findIndex((entry) => entry.is_primary);
  if (index === -1) {
    list.push({
      phone: newPhone,
      is_primary: true,
      purposes: ['communications'],
      source: 'student-account',
      added_at: new Date().toISOString(),
    });
    return list;
  }
  const { marketing_consent: _resetConsent, ...rest } = list[index];
  list[index] = { ...rest, phone: newPhone };
  return list;
}

/**
 * Student Account page (`/student-view/account`).
 *
 * Account/access/legal surface — distinct from the Student Profile
 * (`/student-view/profilo`, personal/academic data). Student-domain only: it
 * resolves the structured `Student` record via the prototype identity bridge,
 * the SAME source the Student Profile uses — never the standalone TesiCheck
 * account registry / session (Student does not use standalone credentials).
 *
 * Self-service IA rule: phone (Recapiti) and the commercial-communications
 * preferences belong here, not on the Student Profile — this page owns
 * access/email, phone, communications preferences and legal status; Profile
 * owns only personal/academic data.
 *
 * MODEL B — commercial consent is PER CONTACT DETAIL, not per person: the
 * primary email and the primary phone each carry their own independent
 * tri-state preference, written to the SAME `contacts.emails[].marketing_consent`
 * / `contacts.phones[].marketing_consent` fields (`marketingConsent.ts`
 * helpers) — never a global `Student.marketing_consent`, never `is_primary` /
 * `purposes` / `service_access` / other contacts.
 *
 * Canonical prototype meaning of each consent (semantic/copy simplification —
 * NOT a data-model change): EMAIL consent = permission for the Sottotesi
 * newsletter / promotional email. PHONE consent = permission for promotional
 * WhatsApp communication on that number ONLY — it does NOT cover commercial
 * phone calls. Operational/service contact is a separate concern (`purposes`
 * / `service_access`), always allowed regardless of this preference.
 * Commercial voice-call permission is out of scope of this prototype and is a
 * production/legal decision, not modelled here.
 *
 * Phone uses the SAME structured `Student.contacts.phones[]` source as the
 * Student Profile used to, now with the SAME always-editable + explicit-save
 * grammar as the standalone Account page's phone field: an existing primary
 * number is editable and replaceable here, not read-only (an earlier
 * gap-fill-only version of this page only allowed adding a phone when none
 * existed yet — corrected as a regression, since it made an already-stored
 * number permanently uneditable from self-service). No flat `Student.phone`
 * write path is introduced.
 *
 * Active-account lifecycle assumption (documented, not modelled in the
 * `Student` domain): an authenticated `/student-view/*` session IS an active
 * self-service account, which — same as any active account — must be able to
 * manage its password and must already have completed Terms acceptance and
 * Privacy acknowledgement. None of that is added to `Student`; it is
 * presented directly by this page as a documented prototype assumption:
 *  - **Password**: `Gestisci password` reveals an inline current/new/confirm
 *    form with local validation and a success message
 *    (`handleSubmitPasswordChange`) — presentation only. Nothing is checked
 *    against, stored to, or synced with any credential store, not even
 *    within this component beyond the current render (fields clear on
 *    success). Deliberately NOT routed through the standalone TesiCheck
 *    account registry/session (`tesicheckAccountSession.ts`) — Student and
 *    standalone are separate identities and must stay that way; no existing
 *    reusable Student-safe password flow was found, so this is the smallest
 *    local flow that demonstrates the intended UX. Production must delegate
 *    this entirely to the real Student authentication system.
 *  - **Terms/Privacy**: presented as ONE quiet, unconditional secondary
 *    sentence near the bottom of the page — no card, no per-item rows, no
 *    icons, no "Accettati"/"Presa visione registrata" labels (never "Privacy
 *    accettata": privacy acknowledgement is not marketing/legal consent).
 *    "Termini e condizioni" is plain, non-clickable text (no real Terms
 *    destination exists anywhere in this prototype); "Informativa privacy"
 *    links to the real, currently-known Sottotesi privacy policy. Production
 *    must supply real Student account/legal semantics (versioning,
 *    timestamps, an actual pending/inactive state if one exists).
 *
 * IA: there is no standalone "Comunicazioni commerciali" section any more —
 * each consent control sits directly under the contact it belongs to
 * (CONTACT → VALUE → PREFERENCE), inside `Accesso` (email) and `Recapiti`
 * (phone). No status pill and no extra explanatory copy beyond a short
 * service-contact line and the Sì/No question itself — an unselected state is
 * self-explanatory, never treated as an error/validation state.
 *
 * Interaction: two grammars, same as the standalone Account page.
 *  - **CONTACT VALUE edit (phone number) → explicit save.** `phoneDraft` vs
 *    `existingPrimaryPhone`: `Salva numero` appears only while they differ,
 *    hides again once saved. No autosave while typing. Works identically
 *    whether a primary phone already exists (replacing it) or not yet
 *    (creating it) — no longer two different code paths for those cases.
 *  - **BINARY COMMERCIAL PREFERENCE (Sì/No, email or phone) → immediate
 *    autosave.** Selecting Sì/No writes straight to `Student.contacts` and
 *    fires a transient toast — no Save button. **Dirty-phone guard**, same
 *    as the standalone Account page: while `phoneValueDirty` (an unsaved
 *    edit sits in the phone field), the WhatsApp preference control is
 *    `disabled` — the displayed preference still belongs to the currently
 *    PERSISTED number, and must never be edited against a number that
 *    hasn't been saved yet. A short inline note explains why. The moment
 *    the number is saved, `phoneConsent` is re-read from the store using
 *    the NEW phone as the key — a genuinely new number never inherits the
 *    old one's consent; it normally comes back "Non richiesto" (`null`),
 *    and the WhatsApp control re-enables, unknown.
 *  - Every successful action fires a transient confirmation via the app-wide
 *    `sonner` `toast` (already mounted in `App.tsx`, already used throughout
 *    Admin — reused as-is, nothing new invented) — no persistent inline
 *    "Salvato" / "Password aggiornata." is ever left in the page.
 *
 * Both Sì/No controls use `CommercialConsentField`'s `variant="segmented"`
 * (`[ Sì ] [ No ]`, still a true `role="radiogroup"`) instead of the default
 * dot-radio indicator, for a stronger, near-black selected-state treatment —
 * see that component for why.
 *
 * Self-service/Admin asymmetry, deliberate: this page exposes only the
 * primary email and the primary phone (one of each) — never additional
 * contacts. Multi-contact management stays an Admin-only capability
 * (`CreateStudentDrawer` → `ContactManager`), unaffected by this page.
 *
 * **Modifica email.** The `Email` row carries a `Modifica email` action that
 * opens the SAME shared `ChangeEmailModal` the standalone Account page uses
 * (two steps: new email → verification, same prototype rule as
 * registration's `VerifyEmailForm` — any well-formed 6-digit code succeeds,
 * no real email delivery). On success `withStudentPrimaryEmailChanged` replaces ONLY the PRIMARY
 * `contacts.emails[]` entry's `email` value via `updateStudent` — `is_primary`,
 * `purposes`, `source`/`added_at`, every OTHER email contact, every phone
 * contact, `StudentService` and all academic data are untouched. Because
 * consent belongs to the exact address (MODEL B), that entry's
 * `marketing_consent` is reset to unset in the same write — the new address
 * always starts unexpressed (neither Sì nor No), never inherited from the
 * old one. There is no Student-side "already registered" registry (unlike
 * standalone), so no email-uniqueness check is offered here — see the
 * production-handoff doc. This is a UI/domain handoff representation only;
 * production auth/CRM synchronization for a real Student identity change is
 * explicitly out of scope (no auth storage is added to the Student model).
 */
export function AccountPage() {
  const { students, updateStudent } = useLavorazioni();

  const student = useMemo(
    () => students.find((item) => item.id === STUDENT_VIEW_STUDENT_RECORD_ID) ?? null,
    [students],
  );

  const primaryEmail = useMemo(() => {
    if (!student) return '';
    return student.contacts?.emails?.find((entry) => entry.is_primary)?.email ?? student.email ?? '';
  }, [student]);

  // Same structured `contacts.phones[]` source the Student Profile used to
  // read, but now the SAME always-editable + explicit-save grammar as the
  // standalone Account page's phone field (`PublicAccountPage.tsx`): an
  // already-stored number is editable and replaceable, not read-only. See
  // `phoneValueDirty` below for the dirty-tracking this enables.
  const existingPrimaryPhone = useMemo(() => {
    if (!student) return '';
    return student.contacts?.phones?.find((entry) => entry.is_primary)?.phone ?? student.phone ?? '';
  }, [student]);

  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(() =>
    readStudentEmailConsent(student?.contacts?.emails, primaryEmail),
  );

  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);

  const [phoneDraft, setPhoneDraft] = useState(existingPrimaryPhone);

  const [phoneConsent, setPhoneConsent] = useState<boolean | null>(() =>
    readStudentPhoneConsent(student?.contacts?.phones, existingPrimaryPhone),
  );

  // Presentation-only password-change affordance — see the module doc
  // comment for why this exists and what production must replace it with.
  // Nothing here is ever persisted anywhere, not even in this component's
  // state beyond the current render (fields are cleared immediately on
  // success): no credential, hash, or token is stored.
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!student) {
    return (
      <PageShell>
        <NeutralCard
          title="Account non disponibile"
          body="Non è stato possibile caricare l'account studente associato a questa area. Riprova più tardi."
        />
      </PageShell>
    );
  }

  // Same dirty-tracking as the standalone Account page: `Salva numero`
  // appears only while the draft differs from the persisted primary phone,
  // whether that persisted value is empty (first phone) or already set
  // (replacing it) — no longer gated on "empty only".
  const phoneValueDirty = phoneDraft.trim() !== existingPrimaryPhone;

  // Binary preference: autosave, no dirty-tracking needed.
  const handleChangeCommercialConsent = (next: boolean) => {
    if (!primaryEmail) return;
    setCommercialConsent(next);
    updateStudent(student.id, (prev) => ({
      ...prev,
      contacts: {
        emails: withStudentEmailConsent(prev.contacts?.emails, primaryEmail, next, {
          source: 'student-account',
        }),
        phones: prev.contacts?.phones ?? [],
      },
    }));
    toast.success('Preferenza aggiornata');
  };

  const handleChangePhoneConsent = (next: boolean) => {
    if (!existingPrimaryPhone || phoneValueDirty) return; // guarded by `disabled` below too
    setPhoneConsent(next);
    updateStudent(student.id, (prev) => ({
      ...prev,
      contacts: {
        emails: prev.contacts?.emails ?? [],
        phones: withStudentPhoneConsent(prev.contacts?.phones, existingPrimaryPhone, next),
      },
    }));
    toast.success('Preferenza WhatsApp aggiornata');
  };

  // Confirmed account-email replacement — called only after the modal's demo
  // verification code succeeds; no earlier partial mutation exists. Replaces
  // ONLY the primary email contact's value, resetting its consent to unknown
  // in the same write (MODEL B — consent belongs to the exact address, never
  // carried over). Every other contact, phone, and Student field is
  // untouched by `withStudentPrimaryEmailChanged`.
  const handleEmailVerified = (newEmail: string) => {
    updateStudent(student.id, (prev) => ({
      ...prev,
      contacts: {
        emails: withStudentPrimaryEmailChanged(prev.contacts?.emails, newEmail),
        phones: prev.contacts?.phones ?? [],
      },
    }));
    setCommercialConsent(null);
    setIsChangeEmailOpen(false);
    toast.success('Email aggiornata');
  };

  // Explicit save for the phone VALUE only — free text, never autosaved.
  // Same grammar as the standalone Account page's `handleSavePhoneValue`:
  // replaces the persisted number outright (no longer gap-fill-only) and
  // never carries the old number's consent over — re-reads whatever the
  // (possibly brand new) number already has on file, normally "Non
  // richiesto". Never requires a marketing choice to save.
  const handleSavePhone = () => {
    const trimmedPhone = phoneDraft.trim();
    if (trimmedPhone === existingPrimaryPhone) return;
    const nextPhones = withStudentPrimaryPhoneChanged(student.contacts?.phones, trimmedPhone);
    updateStudent(student.id, (prev) => ({
      ...prev,
      contacts: {
        emails: prev.contacts?.emails ?? [],
        phones: nextPhones,
      },
    }));
    setPhoneConsent(readStudentPhoneConsent(nextPhones, trimmedPhone));
    toast.success('Recapito aggiornato');
  };

  // Presentation-only local validation. Nothing is checked against, stored
  // to, or synced with any credential store — see the module doc comment.
  const handleSubmitPasswordChange = (event: React.FormEvent) => {
    event.preventDefault();
    if (currentPassword.trim().length === 0) {
      setPasswordError('Inserisci la password attuale.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('La nuova password deve contenere almeno 8 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono.');
      return;
    }
    setPasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    toast.success('Password aggiornata');
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <FormSection title="Accesso">
          <div className="flex flex-col gap-6">
            <div>
              <AccountInfoRow
                label="Email"
                value={primaryEmail || '—'}
                action={
                  primaryEmail ? (
                    <button
                      type="button"
                      onClick={() => setIsChangeEmailOpen(true)}
                      className="control-focus-ring inline-flex items-center border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
                      style={{
                        borderRadius: 'var(--radius)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      Modifica email
                    </button>
                  ) : undefined
                }
              />
              {primaryEmail && (
                <p
                  className="mt-2 text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                >
                  Per accesso, assistenza e comunicazioni di servizio.
                </p>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              {primaryEmail ? (
                <>
                  <p
                    className="text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
                  >
                    Vuoi ricevere la newsletter Sottotesi?
                  </p>
                  <div className="mt-3">
                    <CommercialConsentField
                      idPrefix="student-account-commercial-consent-email"
                      value={commercialConsent}
                      onChange={handleChangeCommercialConsent}
                      variant="segmented"
                      showLabel={false}
                      showUnknownHint={false}
                      yesLabel="Sì"
                      noLabel="No"
                      helperText=""
                      ariaLabel="Vuoi ricevere la newsletter Sottotesi?"
                    />
                  </div>
                </>
              ) : (
                <p
                  className="text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
                >
                  Preferenza non disponibile: nessun indirizzo email registrato per questo account.
                </p>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <AccountInfoRow
                label="Password"
                value="Gestisci o modifica la password"
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm((open) => !open);
                      setPasswordError(null);
                    }}
                    className="control-focus-ring inline-flex items-center border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    Gestisci password
                  </button>
                }
              />

              {showPasswordForm && (
                <form onSubmit={handleSubmitPasswordChange} noValidate className="mt-4 flex max-w-[360px] flex-col gap-4">
                  <TextField
                    id="student-account-current-password"
                    label="Password attuale"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                  />
                  <TextField
                    id="student-account-new-password"
                    label="Nuova password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                  />
                  <TextField
                    id="student-account-confirm-password"
                    label="Conferma nuova password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p
                      className="text-[var(--destructive)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}
                    >
                      {passwordError}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <SottocheckActionButton type="submit">Aggiorna password</SottocheckActionButton>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordError(null);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="control-focus-ring text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
                    >
                      Annulla
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Recapiti">
          <div className="flex flex-col gap-6">
            <div>
              <div className="grid grid-cols-1 gap-4 md:max-w-[360px]">
                <TextField
                  id="student-account-phone"
                  label="Telefono / WhatsApp (facoltativo)"
                  type="tel"
                  value={phoneDraft}
                  onChange={setPhoneDraft}
                  autoComplete="tel"
                />
              </div>
              {existingPrimaryPhone && (
                <p
                  className="mt-4 text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                >
                  Per assistenza e comunicazioni di servizio.
                </p>
              )}
              {phoneValueDirty && (
                <div className="mt-4 flex items-center gap-3">
                  <SottocheckActionButton onClick={handleSavePhone}>Salva numero</SottocheckActionButton>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              {existingPrimaryPhone ? (
                <>
                  <p
                    className="text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
                  >
                    Vuoi ricevere aggiornamenti e offerte Sottotesi su WhatsApp?
                  </p>
                  <div className="mt-3">
                    <CommercialConsentField
                      idPrefix="student-account-commercial-consent-phone"
                      value={phoneConsent}
                      onChange={handleChangePhoneConsent}
                      variant="segmented"
                      disabled={phoneValueDirty}
                      showLabel={false}
                      showUnknownHint={false}
                      yesLabel="Sì"
                      noLabel="No"
                      helperText=""
                      ariaLabel="Vuoi ricevere aggiornamenti e offerte Sottotesi su WhatsApp?"
                    />
                  </div>
                  {phoneValueDirty && (
                    <p
                      className="mt-2 text-[var(--muted-foreground)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
                    >
                      Salva il numero per modificare questa preferenza.
                    </p>
                  )}
                </>
              ) : (
                <p
                  className="text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
                >
                  Aggiungi un numero per gestire la preferenza WhatsApp.
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* No dedicated card any more: one quiet secondary sentence, the
            lightest thing on the page.
            PROTOTYPE LIFECYCLE ASSUMPTION (documented, not modelled in the
            `Student` domain): the authenticated Student surface represents an
            ALREADY-ACTIVE self-service account. Production lifecycle — Admin
            creates the Student record → invite/activation → user accepts
            Terms → user acknowledges the Privacy notice → self-service access
            becomes active — is a precondition of reaching this page at all,
            not a state this page needs to check. This sentence is therefore
            unconditional, never read from `Student` (no legal fields exist
            there, and none are added for this). If production ever needs an
            inactive/pending Student account to reach this surface, that is a
            real gap to close with real data, not a case for this hardcoded
            copy. "Termini e condizioni" is plain, non-clickable text — no
            real Terms destination exists in this prototype; "Informativa
            privacy" links to the real, currently-known Sottotesi privacy
            policy. */}
        <p
          className="text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
        >
          Hai accettato i{' '}
          <span className="text-[var(--foreground)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>
            Termini e condizioni
          </span>{' '}
          e preso visione dell&apos;
          <a
            href="https://www.sottotesi.it/cookie-privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="control-focus-ring text-[var(--foreground)] hover:underline"
            style={{ fontWeight: 'var(--font-weight-medium)' }}
          >
            Informativa privacy
          </a>
          .
        </p>

        <div>
          <CrossSurfaceLink to="/student-view/profilo" label="Vai al profilo personale" />
        </div>
      </div>

      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        currentEmail={primaryEmail}
        onClose={() => setIsChangeEmailOpen(false)}
        onVerified={handleEmailVerified}
      />
    </PageShell>
  );
}

// ─── Layout primitives (local, neutral-first — same pattern as the Profile page) ──
function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="py-[32px]">
      <header className="mb-8 max-w-[760px]">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.3,
            color: 'var(--foreground)',
          }}
        >
          Account
        </h1>
        <p
          className="mt-2 text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
        >
          Dati di accesso dell&apos;account, telefono di contatto, preferenze di comunicazioni commerciali e
          stato di Termini e Informativa privacy.
        </p>
      </header>
      <div className="max-w-[760px]">{children}</div>
    </div>
  );
}

function NeutralCard({ title, body }: { title: string; body: string }) {
  return (
    <section
      className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
      style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h2>
      <p
        className="mt-2 text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
      >
        {body}
      </p>
    </section>
  );
}
