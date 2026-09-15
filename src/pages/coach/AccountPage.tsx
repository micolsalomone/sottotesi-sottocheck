import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { useCoachViewProfile } from '@/app/components/coach/CoachViewProfileContext';
import { FormSection, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { AccountInfoRow, CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';
import { ChangeEmailModal } from '@/app/components/account/ChangeEmailModal';

/**
 * Coach Account page (`/coach-view/account`).
 *
 * Account/access surface — distinct from the Coach Profile
 * (`/coach-view/profilo`, personal identity only). Same self-service IA rule
 * as Student/Public: email, phone and password live here, not on Profile.
 *
 * Domain: the Coach-view-local prototype fixture
 * (`CoachViewProfileContext`, scoped to `CoachLayout`) — flat `email` /
 * `phone` strings, NOT a shared CRM record, NOT Admin's `/coach` Coach data,
 * and never the standalone TesiCheck account registry/session (Coach does
 * not use standalone credentials). See that context's doc comment and
 * `docs/production-handoff.md` → "Coach Profile/Account" for the real
 * contract production must implement (binding this surface to the
 * authenticated Coach's backend record).
 *
 * Deliberately narrower than Student/Public Account:
 *  - **No commercial-communications preference control.** The prototype
 *    fixture models no consent field for Coach at all.
 *  - **No Terms/Privacy status line.** Student/Public's account pages state
 *    that acceptance/acknowledgement as a documented lifecycle assumption;
 *    Coach has no equivalent grounded legal-state model here, so nothing is
 *    asserted rather than fabricating a legal claim.
 *
 * **Modifica email.** Reuses the SAME shared `ChangeEmailModal` as
 * Student/Public (reauth → new email → verify). No `isEmailTaken` check is
 * offered — this fixture has no email registry to check against.
 *
 * **Password.** Same presentational-only inline form pattern as
 * Student/Public: local validation, a transient success toast, nothing
 * persisted anywhere.
 *
 * **Telefono di contatto / WhatsApp — PRIMARY phone only.** Product rule:
 * Admin may manage multiple Coach phone numbers, but self-service exposes
 * and edits only the ONE primary operational contact number — never a list.
 * Saving here updates only that primary value; it does not imply that any
 * additional Admin-managed numbers are deleted, replaced, or even exist.
 * This field carries no consent/marketing control, no "share with
 * students" toggle, and no visibility setting — see the helper copy on the
 * field itself for the (existing product-rule) framing of who may see it.
 * See `docs/views/coach.md` and `docs/production-handoff.md` → "Coach
 * Profile/Account" for the full data/UX contract.
 */
export function AccountPage() {
  const { profile, updateProfile } = useCoachViewProfile();

  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(profile.phone);

  // Presentation-only password-change affordance — see the module doc
  // comment. Nothing here is ever persisted anywhere, not even in this
  // component's state beyond the current render.
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const phoneValueDirty = phoneDraft.trim() !== profile.phone;

  // Confirmed account-email replacement — called only after the modal's demo
  // verification code succeeds.
  const handleEmailVerified = (newEmail: string) => {
    updateProfile({ email: newEmail });
    setIsChangeEmailOpen(false);
    toast.success('Email aggiornata');
  };

  // Explicit save for the phone VALUE only — free text, never autosaved.
  const handleSavePhone = () => {
    const trimmedPhone = phoneDraft.trim();
    if (trimmedPhone === profile.phone) return;
    updateProfile({ phone: trimmedPhone });
    toast.success('Recapito aggiornato');
  };

  // Presentation-only local validation — nothing checked against, stored to,
  // or synced with any credential store.
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
                value={profile.email || '—'}
                action={
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
                }
              />
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
              >
                Per accesso, assistenza e comunicazioni di servizio.
              </p>
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
                    id="coach-account-current-password"
                    label="Password attuale"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                  />
                  <TextField
                    id="coach-account-new-password"
                    label="Nuova password"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                  />
                  <TextField
                    id="coach-account-confirm-password"
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
          <div>
            <div className="grid grid-cols-1 gap-4 md:max-w-[360px]">
              <TextField
                id="coach-account-phone"
                label="Telefono di contatto / WhatsApp"
                type="tel"
                value={phoneDraft}
                onChange={setPhoneDraft}
                autoComplete="tel"
              />
            </div>
            {profile.phone && (
              <p
                className="mt-4 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
              >
                Questo recapito può essere condiviso con gli studenti assegnati per le comunicazioni relative al loro percorso.
              </p>
            )}
            {phoneValueDirty && (
              <div className="mt-4 flex items-center gap-3">
                <SottocheckActionButton onClick={handleSavePhone}>Salva numero</SottocheckActionButton>
              </div>
            )}
          </div>
        </FormSection>

        <div>
          <CrossSurfaceLink to="/coach-view/profilo" label="Vai al profilo personale" />
        </div>
      </div>

      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        currentEmail={profile.email}
        onClose={() => setIsChangeEmailOpen(false)}
        onVerified={handleEmailVerified}
      />
    </PageShell>
  );
}

// ─── Layout primitives (local, neutral-first — same pattern as Student/Public) ──
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
          Dati di accesso dell&apos;account e telefono di contatto.
        </p>
      </header>
      <div className="max-w-[760px]">{children}</div>
    </div>
  );
}
