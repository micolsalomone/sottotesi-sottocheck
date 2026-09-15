import { ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import { STUDENT_VIEW_STUDENT_RECORD_ID } from '@/app/utils/studentView';
import { FormSection, ReadOnlyField, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { AccountInfoRow, CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';
import {
  readStudentEmailConsent,
  readStudentPhoneConsent,
  withStudentEmailConsent,
  withStudentPhoneConsent,
} from '@/app/data/marketingConsent';

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
 * Student Profile used to, with the SAME gap-fill-only edit semantics (a
 * phone can be added only when no primary phone value exists yet; an existing
 * one is read-only here). No flat `Student.phone` write path is introduced.
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
 *  - **CONTACT VALUE edit (phone, gap-fill only) → explicit save.** `Salva
 *    numero` appears only while `phoneDraft` is non-empty (there is no
 *    persisted phone yet to compare against); saving is the ONLY way a
 *    primary phone contact gets created here.
 *  - **BINARY COMMERCIAL PREFERENCE (Sì/No, email or phone) → immediate
 *    autosave.** Selecting Sì/No writes straight to `Student.contacts` and
 *    fires a transient toast — no Save button. The gap-fill/read-only split
 *    already keeps phone-value editing and phone-consent editing mutually
 *    exclusive in this UI (a primary phone can be set once, then only its
 *    consent is ever editable here), so there is no scenario where the
 *    WhatsApp preference could be edited against an unsaved number — unlike
 *    the standalone Account page, no extra `disabled` guard is needed.
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

  // Same structured source and gap-fill-only semantics the Student Profile
  // used: a primary phone contact that already has a value is read-only here;
  // an empty/absent one can be filled in once.
  const existingPrimaryPhone = useMemo(() => {
    if (!student) return '';
    return student.contacts?.phones?.find((entry) => entry.is_primary)?.phone ?? student.phone ?? '';
  }, [student]);
  const phoneIsGapFill = !existingPrimaryPhone.trim();

  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(() =>
    readStudentEmailConsent(student?.contacts?.emails, primaryEmail),
  );

  const [phoneDraft, setPhoneDraft] = useState('');

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

  // While gap-fill applies (no primary phone yet), the phone VALUE can be
  // dirty; once a primary phone exists it becomes read-only here and only
  // its CONSENT is editable (autosave) — the two are mutually exclusive.
  const phoneValueDirty = phoneIsGapFill && phoneDraft.trim() !== '';

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
    if (!existingPrimaryPhone) return;
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

  // Gap-fill only, same as the former Student Profile behaviour: fills the
  // EXISTING primary phone contact's value; never creates a new phone contact,
  // never overwrites an already-present number. Never requires a marketing
  // choice — the phone may be saved with consent still unknown.
  const handleSavePhone = () => {
    if (!phoneIsGapFill) return;
    const gapFilledPhone = phoneDraft.trim();
    if (!gapFilledPhone) return;
    updateStudent(student.id, (prev) => {
      const contacts = prev.contacts;
      if (!gapFilledPhone || !contacts?.phones?.some((entry) => entry.is_primary)) return prev;
      return {
        ...prev,
        contacts: {
          ...contacts,
          phones: contacts.phones.map((entry) =>
            entry.is_primary ? { ...entry, phone: gapFilledPhone } : entry,
          ),
        },
      };
    });
    // The phone becomes read-only immediately on the next render (the
    // structured record now has a primary value), which is when its own
    // consent question first appears.
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
              <AccountInfoRow label="Email" value={primaryEmail || '—'} />
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
                {phoneIsGapFill ? (
                  <TextField
                    id="student-account-phone"
                    label="Telefono / WhatsApp (facoltativo)"
                    type="tel"
                    value={phoneDraft}
                    onChange={setPhoneDraft}
                    autoComplete="tel"
                  />
                ) : (
                  <ReadOnlyField label="Telefono / WhatsApp" value={existingPrimaryPhone} />
                )}
              </div>
              {!phoneIsGapFill && (
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
              {phoneIsGapFill ? (
                <p
                  className="text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
                >
                  Aggiungi un numero per gestire la preferenza WhatsApp.
                </p>
              ) : (
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
                      showLabel={false}
                      showUnknownHint={false}
                      yesLabel="Sì"
                      noLabel="No"
                      helperText=""
                      ariaLabel="Vuoi ricevere aggiornamenti e offerte Sottotesi su WhatsApp?"
                    />
                  </div>
                </>
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
