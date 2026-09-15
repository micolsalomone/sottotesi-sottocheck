import { ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { FormSection, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { AccountInfoRow, CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';
import { ChangeEmailModal } from '@/app/components/account/ChangeEmailModal';
import { changeAccountEmail, findRegisteredAccount, getAccountSession } from '@/app/data/tesicheckAccountSession';
import {
  getStandaloneProfile,
  readStandaloneCommercialConsent,
  readStandalonePhoneConsent,
  renameStandaloneProfileEmail,
  updateStandaloneProfile,
  writeStandaloneCommercialConsent,
  writeStandalonePhoneConsent,
} from '@/app/data/standaloneProfile';

/**
 * Authenticated standalone Account page (`/public-view/account`).
 *
 * Account/access/legal surface — distinct from the Profile page
 * (`/public-view/profilo`, personal/profile data). It does NOT reuse
 * `/public/account`, which is and stays the paid-checkout account gate.
 *
 * Self-service IA rule: account email, phone (Recapiti), the
 * commercial-communications preferences, and Terms/Privacy status all belong
 * here, not on Profile — Profile owns only personal info and academic
 * history.
 *
 * Legal state: this page represents an already-active account — registration
 * (`RegisterForm`) already required accepting Terms and acknowledging Privacy
 * before the account could be created — so it is presented as one quiet,
 * unconditional secondary sentence near the bottom of the page (no card, no
 * per-item rows, no icons, no read from the registered-account registry's
 * `termsAccepted`/`privacyAcknowledged` booleans). "Termini e condizioni" is
 * plain, non-clickable text: no real Terms destination exists anywhere in
 * this repo/prototype, and none is invented — the production URL is pending
 * (see `production-handoff.md`). "Informativa privacy" links to the real,
 * currently-known Sottotesi privacy policy
 * (`https://www.sottotesi.it/cookie-privacy-policy/`), consistent with the
 * external `sottotesi.it` links already used elsewhere in this prototype.
 *
 * MODEL B — commercial consent is PER CONTACT DETAIL, not per person: the
 * account email and the current phone each carry their own independent
 * tri-state preference, both read/written through the SAME standalone
 * Profile-local store (`standaloneProfile.ts`, `commercial_consents`, now
 * keyed by whichever contact string — email or phone — is being read/written)
 * the registration flow already seeds — never a new store, never CRM/Pipeline.
 * Changing which contact is primary, or editing the phone value, never moves
 * consent between contacts: a genuinely new phone number always starts at
 * "Non richiesto" (see `readStandaloneContactConsent`).
 *
 * Canonical prototype meaning of each consent (semantic/copy simplification —
 * NOT a data-model change): EMAIL consent = permission for the Sottotesi
 * newsletter / promotional email. PHONE consent = permission for promotional
 * WhatsApp communication on that number ONLY — it does NOT cover commercial
 * phone calls. Operational/service contact (by email or phone) is a separate
 * concern, always allowed regardless of this preference. Commercial voice-call
 * permission is out of scope of this prototype and is a production/legal
 * decision, not modelled here.
 *
 * IA: there is no standalone "Comunicazioni commerciali" section any more —
 * each consent control sits directly under the contact it belongs to
 * (CONTACT → VALUE → PREFERENCE), inside `Accesso` (email) and `Recapiti`
 * (phone). No status pill and no extra explanatory copy beyond a short
 * service-contact line and the Sì/No question itself — an unselected state is
 * self-explanatory, never treated as an error/validation state.
 *
 * Interaction: two different grammars, deliberately.
 *  - **CONTACT VALUE edit (phone number) → explicit save.** `phoneDraft` vs
 *    `phoneValue`: `Salva numero` appears only while they differ, hides again
 *    once saved. No autosave while typing.
 *  - **BINARY COMMERCIAL PREFERENCE (Sì/No) → immediate autosave.** Selecting
 *    Sì/No writes straight to the store and fires a transient toast — no
 *    Save button, nothing pending. This is safe because it's a single atomic
 *    choice, unlike the phone number which is free text the user may still
 *    be editing.
 *  - **Dirty-phone guard.** While `phoneValueDirty` (an unsaved edit sits in
 *    the phone field), the WhatsApp preference control is `disabled`: the
 *    displayed preference still belongs to the currently PERSISTED number,
 *    and must never be edited against a number that hasn't been saved yet
 *    (that would silently apply to the wrong contact key). A short inline
 *    note explains why. The moment the number is saved, `phoneConsent` is
 *    re-read from the store using the NEW phone as the key — a genuinely new
 *    number never inherits the old one's consent; it normally comes back
 *    "Non richiesto" (`null`), and the WhatsApp control re-enables, unknown.
 *  - Every successful action (email preference, phone number, WhatsApp
 *    preference) fires a transient confirmation via the app-wide `sonner`
 *    `toast` (already mounted in `App.tsx`, already used throughout Admin —
 *    reused as-is, nothing new invented) — never a persistent inline
 *    "Salvato" left sitting in the page.
 *
 * Both Sì/No controls use `CommercialConsentField`'s `variant="segmented"`:
 * a stronger `[ Sì ] [ No ]` selectable-button presentation (still a true
 * `role="radiogroup"`) instead of the small dot-radio indicator, which read
 * as too weak and used the brand green rather than the repo's near-black
 * `action-primary` selected treatment.
 *
 * **Modifica email.** `Email account` now carries a `Modifica email` action
 * that opens the shared `ChangeEmailModal` (two steps: enter new email →
 * verify — same prototype verification rule as registration's
 * `VerifyEmailForm`, any well-formed 6-digit code succeeds, no real email
 * delivery). Nothing is written anywhere until that step succeeds; on
 * success `changeAccountEmail`
 * (session + `tesicheck-registered-accounts-v1` registry rename) and
 * `renameStandaloneProfileEmail` (moves the whole `standaloneProfile.ts`
 * record — personal info, phone, academic records — to the new email key)
 * both run, the local `email` state updates, and a shared toast confirms
 * (`Email aggiornata`). The account-email consent preference is deliberately
 * NOT carried over: the new email's `commercial_consents` entry is never
 * seeded from the old one, so it reads back unexpressed (neither Sì nor No)
 * until the user picks again — consent belongs to the exact contact, not the
 * person (MODEL B, same invariant as a changed phone number). See
 * `ChangeEmailModal` for the interaction and the production-handoff doc for
 * what a real implementation must add (re-authentication, real delivery,
 * uniqueness, session/CRM identity replacement, audit logging).
 */

const PASSWORD_RECOVERY_PATH = '/public/password-recovery?returnTo=/public-view/account';

export function PublicAccountPage() {
  const session = useMemo(() => getAccountSession(), []);

  // The account/login email itself is the one piece of `session` this page
  // can change (via `Modifica email`) — tracked as its own state, kept in
  // sync with the session/registry/profile writes on successful verification.
  // Every other session field (`id`, `firstName`, legal flags) is immutable
  // here and still read straight from `session`.
  const [email, setEmail] = useState<string>(session?.email ?? '');
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);

  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(() =>
    session ? readStandaloneCommercialConsent(session.email) : null,
  );

  const [phoneValue, setPhoneValue] = useState<string>(
    () => (session ? getStandaloneProfile(session.email)?.phone ?? '' : ''),
  );
  const [phoneDraft, setPhoneDraft] = useState<string>(phoneValue);

  const [phoneConsent, setPhoneConsent] = useState<boolean | null>(() =>
    session ? readStandalonePhoneConsent(session.email, phoneValue) : null,
  );

  // `PublicLayout` already guards the session; keep a neutral fallback anyway.
  if (!session) {
    return (
      <PageShell>
        <NeutralCard
          title="Account non disponibile"
          body="Accedi con un account TesiCheck per gestire i dati dell'account."
        />
      </PageShell>
    );
  }

  const phoneValueDirty = phoneDraft.trim() !== phoneValue;

  // Binary preference: autosave, no dirty-tracking needed — the write and the
  // displayed value happen together.
  const handleChangeCommercialConsent = (next: boolean) => {
    setCommercialConsent(next);
    writeStandaloneCommercialConsent(email, next);
    toast.success('Preferenza aggiornata');
  };

  const handleChangePhoneConsent = (next: boolean) => {
    if (phoneValueDirty) return; // guarded by `disabled` below too
    setPhoneConsent(next);
    writeStandalonePhoneConsent(email, phoneValue, next);
    toast.success('Preferenza WhatsApp aggiornata');
  };

  // Explicit save for the phone VALUE only — free text, never autosaved.
  // Never carries the old number's consent over: re-reads whatever the
  // (possibly brand new) number already has on file, normally "Non richiesto".
  const handleSavePhoneValue = () => {
    const trimmedPhone = phoneDraft.trim();
    if (trimmedPhone === phoneValue) return;
    updateStandaloneProfile(email, (profile) => ({ ...profile, phone: trimmedPhone }));
    setPhoneValue(trimmedPhone);
    setPhoneConsent(readStandalonePhoneConsent(email, trimmedPhone));
    toast.success('Recapito aggiornato');
  };

  // Confirmed account-email replacement — called only after the modal's demo
  // verification code succeeds; no earlier partial mutation exists. Renames
  // the session/registry entry and moves the whole standalone Profile record
  // to the new email key, then re-reads the email consent from that new key
  // (never copied from the old one — starts unexpressed, MODEL B).
  const handleEmailVerified = (newEmail: string) => {
    changeAccountEmail(newEmail);
    renameStandaloneProfileEmail(email, newEmail);
    setEmail(newEmail);
    setCommercialConsent(readStandaloneCommercialConsent(newEmail));
    setIsChangeEmailOpen(false);
    toast.success('Email aggiornata');
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <FormSection title="Accesso">
          <div className="flex flex-col gap-6">
            <div>
              <AccountInfoRow
                label="Email account"
                value={email}
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
              <p
                className="text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
              >
                Vuoi ricevere la newsletter Sottotesi?
              </p>
              <div className="mt-3">
                <CommercialConsentField
                  idPrefix="standalone-account-commercial-consent-email"
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
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <AccountInfoRow
                label="Password"
                value="Gestisci o reimposta la password"
                action={
                  <Link
                    to={PASSWORD_RECOVERY_PATH}
                    className="control-focus-ring inline-flex items-center border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    Gestisci password
                  </Link>
                }
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Recapiti">
          <div className="flex flex-col gap-6">
            <div>
              <div className="grid grid-cols-1 gap-4 md:max-w-[360px]">
                <TextField
                  id="standalone-account-phone"
                  label="Telefono / WhatsApp (facoltativo)"
                  type="tel"
                  value={phoneDraft}
                  onChange={setPhoneDraft}
                  autoComplete="tel"
                />
              </div>
              {phoneValue && (
                <p
                  className="mt-4 text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
                >
                  Per assistenza e comunicazioni di servizio.
                </p>
              )}
              {phoneValueDirty && (
                <div className="mt-4 flex items-center gap-3">
                  <SottocheckActionButton onClick={handleSavePhoneValue}>Salva numero</SottocheckActionButton>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              {phoneValue ? (
                <>
                  <p
                    className="text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
                  >
                    Vuoi ricevere aggiornamenti e offerte Sottotesi su WhatsApp?
                  </p>
                  <div className="mt-3">
                    <CommercialConsentField
                      idPrefix="standalone-account-commercial-consent-phone"
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
            lightest thing on the page. "Termini e condizioni" is plain text —
            no real Terms destination exists in this prototype, so it is never
            rendered as a link (see module doc comment). "Informativa privacy"
            links out to the real, currently-known Sottotesi privacy policy,
            consistent with the external links already used elsewhere in this
            prototype (landing, report, output-preview pages). */}
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
          <CrossSurfaceLink to="/public-view/profilo" label="Vai al profilo personale" />
        </div>
      </div>

      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        currentEmail={email}
        onClose={() => setIsChangeEmailOpen(false)}
        isEmailTaken={(candidate) => findRegisteredAccount(candidate) !== null}
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
          Gestisci l&apos;accesso al tuo account, il telefono di contatto, le preferenze di comunicazioni
          commerciali e consulta lo stato di Termini e Informativa privacy.
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
