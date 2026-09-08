import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';

/**
 * Standalone TesiCheck auth form components, shared by the in-checkout account
 * gate (`PublicAccountGatePage`) and the direct landing auth surface
 * (`PublicStandaloneAuthPage`). Prototype-only: no real credential store, no
 * backend — production auth is delegated to the real application.
 *
 * `mode` only swaps copy: `'checkout'` (default) frames auth as a step of a
 * configured purchase; `'direct'` keeps it a plain account surface. It never
 * changes behaviour and never pulls in checkout data (no order summary, price or
 * progress) — those stay in `PublicAccountGatePage`.
 */
export type AuthFormMode = 'checkout' | 'direct';

/**
 * Explicit registration payload. The three consent / legal domains are kept
 * separate on purpose (canonical §33.5) and never merged into one checkbox:
 *  - Terms & Conditions acceptance — REQUIRED (service / account acceptance);
 *  - Privacy notice acknowledgement — REQUIRED (acknowledgement, not consent);
 *  - commercial communications consent — OPTIONAL, and never gates registration,
 *    email verification, payment or report access.
 *
 * Prototype wording only — final legal copy, versioning and any real policy
 * links / pages are the client / legal team's responsibility.
 */
export interface RegisterSubmitValues {
  firstName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  commercialConsent: boolean;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TextField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[var(--foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className="control-focus-ring mt-2 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--foreground)]"
        style={{ borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}
      />
      {error && (
        <p className="mt-2 text-[var(--destructive)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 text-[var(--destructive)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </p>
  );
}

/**
 * Neutral checkbox row for a registration consent / acknowledgement. Native
 * control (keyboard + screen-reader semantics for free); presentation only.
 */
function ConsentCheckbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 text-[var(--foreground)]"
      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.5 }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="control-focus-ring mt-[2px] h-4 w-4 shrink-0"
        style={{ accentColor: 'var(--primary)' }}
      />
      <span>{children}</span>
    </label>
  );
}

export function LoginForm({
  onSubmit,
  onSwitchToRegister,
  onForgotPassword,
  externalError,
  mode = 'checkout',
}: {
  onSubmit: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  /** Opens the password-recovery surface. The caller owns navigation + `returnTo`. */
  onForgotPassword?: () => void;
  externalError?: string | null;
  mode?: AuthFormMode;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }
    if (password.length === 0) {
      setError('Inserisci la password.');
      return;
    }
    setError(null);
    onSubmit(email.trim(), password);
  };

  const shownError = error ?? externalError ?? null;
  const isCheckout = mode === 'checkout';

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        {isCheckout ? 'Accedi per continuare' : 'Accedi'}
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        {isCheckout
          ? 'Accedi al tuo account per completare il TesiCheck che hai già configurato.'
          : 'Accedi al tuo account TesiCheck.'}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <TextField id="login-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField id="login-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>

      {onForgotPassword && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="control-focus-ring text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}
          >
            Password dimenticata?
          </button>
        </div>
      )}

      {shownError && <div className="mt-4"><FormError message={shownError} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        {isCheckout ? 'Accedi e continua' : 'Accedi'}
      </SottocheckActionButton>

      <p className="mt-5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
        Non hai ancora un account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="control-focus-ring text-[var(--foreground)] hover:underline"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          Crea account
        </button>
      </p>
    </form>
  );
}

export function RegisterForm({
  onSubmit,
  onSwitchToLogin,
  mode = 'checkout',
}: {
  onSubmit: (values: RegisterSubmitValues) => void;
  onSwitchToLogin: () => void;
  mode?: AuthFormMode;
}) {
  // Required first name; surname is never asked at registration.
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Three distinct consent / legal domains — kept separate, never combined.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [commercialConsent, setCommercialConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim().length === 0) {
      setError('Inserisci il tuo nome.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    if (!termsAccepted) {
      setError('Per creare l’account devi accettare i Termini e condizioni.');
      return;
    }
    if (!privacyAcknowledged) {
      setError('Per creare l’account devi dichiarare di aver preso visione dell’Informativa privacy.');
      return;
    }
    setError(null);
    onSubmit({
      firstName: firstName.trim(),
      email: email.trim(),
      password,
      termsAccepted,
      privacyAcknowledged,
      commercialConsent,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Crea il tuo account
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Ti servirà per accedere al report e allo storico dei tuoi TesiCheck.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <TextField id="register-name" label="Nome" type="text" value={firstName} onChange={setFirstName} autoComplete="given-name" />
        <TextField id="register-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField id="register-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <TextField id="register-confirm-password" label="Conferma password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </div>

      {/* Required acknowledgements — registration is blocked until both are checked.
          Legal titles render as plain text: there is no real policy page / URL in
          the prototype (see docs — final wording, version and links come from
          client / legal). */}
      <div className="mt-6 flex flex-col gap-3">
        <ConsentCheckbox id="register-terms" checked={termsAccepted} onChange={setTermsAccepted}>
          Accetto i{' '}
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Termini e condizioni</span>
        </ConsentCheckbox>
        <ConsentCheckbox id="register-privacy" checked={privacyAcknowledged} onChange={setPrivacyAcknowledged}>
          Dichiaro di aver preso visione dell&apos;
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Informativa privacy</span>
        </ConsentCheckbox>
      </div>

      {/* Optional, visually decoupled from the required block — never blocks
          registration, verification, payment or report access. */}
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <ConsentCheckbox id="register-commercial" checked={commercialConsent} onChange={setCommercialConsent}>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Comunicazioni commerciali</span>
          <span
            className="mt-1 block text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}
          >
            Acconsento a ricevere comunicazioni commerciali da Sottotesi. Facoltativo, puoi cambiare idea in qualsiasi momento.
          </span>
        </ConsentCheckbox>
      </div>

      {error && <div className="mt-4"><FormError message={error} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        {mode === 'checkout' ? 'Crea account e continua' : 'Crea account'}
      </SottocheckActionButton>

      <p className="mt-5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
        Hai già un account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="control-focus-ring text-[var(--foreground)] hover:underline"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          Accedi
        </button>
      </p>
    </form>
  );
}

export function VerifyEmailForm({ email, onConfirm }: { email: string; onConfirm: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Inserisci il codice a 6 cifre che ti abbiamo inviato.');
      return;
    }
    setError(null);
    onConfirm();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Verifica la tua email
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Abbiamo inviato un codice a{' '}
        <span className="text-[var(--foreground)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>{email}</span>.
        Confermalo per continuare.
      </p>

      <div className="mt-6">
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

      {error && <div className="mt-4"><FormError message={error} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        Conferma email
      </SottocheckActionButton>

      <p className="mt-5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
        Non hai ricevuto il codice?{' '}
        <button
          type="button"
          onClick={() => setResent(true)}
          className="control-focus-ring text-[var(--foreground)] hover:underline"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          Invia di nuovo il codice
        </button>
        {resent && <span className="ml-2 text-[var(--primary)]">Nuovo codice inviato.</span>}
      </p>
    </form>
  );
}
