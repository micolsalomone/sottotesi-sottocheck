import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { EMAIL_PATTERN, TextField } from '@/pages/public/standaloneAuthForms';

type ChangeEmailModalStep = 'edit' | 'verify';

interface ChangeEmailModalProps {
  isOpen: boolean;
  /** Current, already-verified account/login email. Shown nowhere editable here — only used for the "must differ" check. */
  currentEmail: string;
  onClose: () => void;
  /**
   * Cheap prototype "already registered" collision check (e.g. the
   * standalone account registry). Omit for domains with no such registry
   * (Student has none) — no fabricated uniqueness check is invented there.
   */
  isEmailTaken?: (email: string) => boolean;
  /**
   * Called ONLY after the verification code passes the format check (same
   * prototype rule as the existing registration `VerifyEmailForm`: any
   * well-formed 6-digit code succeeds — no real code comparison, no
   * correct/wrong-code state). The caller performs the actual
   * domain-specific persistence (session/registry rename for standalone, or
   * Student contact update) and owns closing the modal + the `Email
   * aggiornata` toast — this component never persists anything itself and
   * never mutates before this fires.
   */
  onVerified: (newEmail: string) => void;
}

/**
 * Shared two-step "Modifica email" modal, used by both the Public and
 * Student Account pages (each supplies its own `isEmailTaken` / `onVerified`
 * for its own persistence domain). Modelled on the existing bespoke
 * fixed-overlay modal shell (`StandaloneProfileCompletionModal`) and the
 * existing registration verification UI (`VerifyEmailForm`) — reuses its
 * exact verification rule (any well-formed 6-digit code succeeds, format
 * error only) and its `InputOTP` field. No new visual language, no new
 * verification convention, no demo-code hint anywhere in the UI.
 *
 * **Verification is the ONLY mutation boundary.** Nothing is written
 * anywhere — no session, registry, Profile or Student write, no reserved /
 * pending email — until `onVerified` fires on a well-formed code. Every
 * close path before that is a pure local-state reset:
 *  - Step 1 (`Annulla` or X): closes immediately, no confirmation — nothing
 *    entered here is at risk of looking silently lost.
 *  - Step 2 (X or the overlay): the user has gone further, so closing asks
 *    first via a small inline confirm (`Annullare la modifica dell'email?`).
 *    `Continua modifica` just dismisses it; `Annulla modifica` discards the
 *    whole flow. `Indietro` is NOT a close — it stays inside the flow
 *    (Step 2 → Step 1), so it never asks.
 * A cancelled attempt reserves nothing: retrying with the very same
 * candidate email afterwards re-runs `isEmailTaken` / the "must differ"
 * check exactly as a first attempt would (there is no attempt history to
 * consult — the component holds no state once closed).
 */
export function ChangeEmailModal({ isOpen, currentEmail, onClose, isEmailTaken, onVerified }: ChangeEmailModalProps) {
  const [step, setStep] = useState<ChangeEmailModalStep>('edit');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  // Only asked on Step 2 — the user has already entered a new address, so a
  // bare X there could look like it silently discards progress. Step 1's X /
  // Annulla stay immediate: nothing has been entered that isn't still on
  // screen to just re-type.
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('edit');
    setNewEmail('');
    setEmailError(null);
    setCode('');
    setCodeError(null);
    setShowCloseConfirm(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // The X / overlay-click "close" gesture: immediate on Step 1 (nothing is
  // at risk of looking silently lost), gated behind a lightweight confirm on
  // Step 2. Either way NOTHING has been persisted yet — verification is the
  // only mutation boundary (see `onVerified`) — so both paths are pure local
  // state resets, never a partial account/session/CRM write.
  const handleAttemptClose = () => {
    if (step === 'verify') {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const handleConfirmCloseDiscard = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleContinue = () => {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailError('Inserisci la nuova email.');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError('Inserisci un indirizzo email valido.');
      return;
    }
    if (trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
      setEmailError('La nuova email deve essere diversa da quella attuale.');
      return;
    }
    if (isEmailTaken?.(trimmed)) {
      setEmailError('Questa email è già associata a un altro account.');
      return;
    }
    setEmailError(null);
    setCode('');
    setCodeError(null);
    setStep('verify');
  };

  const handleConfirmCode = () => {
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Inserisci il codice a 6 cifre che ti abbiamo inviato.');
      return;
    }
    setCodeError(null);
    onVerified(newEmail.trim());
  };

  const trimmedNewEmail = newEmail.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}
      onClick={handleAttemptClose}
    >
      <div
        className="w-full max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          maxWidth: '440px',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--card)',
          boxShadow: 'var(--elevation-lg)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b p-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}
            >
              {step === 'edit' ? 'Modifica email' : 'Verifica la nuova email'}
            </h2>
            <button
              onClick={handleAttemptClose}
              className="flex-shrink-0 p-2 hover:opacity-70 transition-opacity"
              style={{ borderRadius: 'var(--radius)' }}
              aria-label="Chiudi"
            >
              <X className="size-5" style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
          <p
            className="mt-2"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}
          >
            {step === 'edit' ? (
              'La nuova email diventerà il tuo indirizzo di accesso.'
            ) : (
              <>
                Abbiamo inviato un codice a{' '}
                <span className="text-[var(--foreground)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  {trimmedNewEmail}
                </span>
                .
              </>
            )}
          </p>
        </div>

        <div className="overflow-y-auto p-6">
          {step === 'edit' ? (
            <TextField
              id="change-email-new-email"
              label="Nuova email"
              type="email"
              value={newEmail}
              onChange={setNewEmail}
              autoComplete="email"
              error={emailError ?? undefined}
            />
          ) : (
            <div>
              <p
                className="text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
              >
                Codice di verifica
              </p>
              <div className="mt-2">
                <InputOTP maxLength={6} value={code} onChange={setCode} containerClassName="control-focus-ring">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {codeError && (
                <p className="mt-2 text-[var(--destructive)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                  {codeError}
                </p>
              )}
              <p
                className="mt-3 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
              >
                La tua email attuale resterà invariata fino alla verifica.
              </p>
            </div>
          )}
        </div>

        <div
          className="border-t p-6 flex items-center justify-end gap-3"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
        >
          {step === 'edit' ? (
            <>
              <SottocheckActionButton variant="secondary" onClick={onClose}>
                Annulla
              </SottocheckActionButton>
              <SottocheckActionButton variant="primary" onClick={handleContinue}>
                Continua
              </SottocheckActionButton>
            </>
          ) : (
            <>
              <SottocheckActionButton variant="secondary" onClick={() => setStep('edit')}>
                Indietro
              </SottocheckActionButton>
              <SottocheckActionButton variant="primary" onClick={handleConfirmCode}>
                Conferma email
              </SottocheckActionButton>
            </>
          )}
        </div>
      </div>

      {showCloseConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="w-full"
            style={{
              maxWidth: '380px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--card)',
              boxShadow: 'var(--elevation-lg)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6">
              <h3
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--foreground)',
                }}
              >
                Annullare la modifica dell&apos;email?
              </h3>
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
              >
                La nuova email non verrà salvata.
              </p>
            </div>
            <div
              className="border-t p-6 flex items-center justify-end gap-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <SottocheckActionButton variant="secondary" onClick={() => setShowCloseConfirm(false)}>
                Continua modifica
              </SottocheckActionButton>
              <SottocheckActionButton variant="primary" onClick={handleConfirmCloseDiscard}>
                Annulla modifica
              </SottocheckActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
