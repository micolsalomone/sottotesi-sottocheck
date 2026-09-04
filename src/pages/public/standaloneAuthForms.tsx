import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';

/**
 * Standalone TesiCheck auth form components, shared by the in-checkout account
 * gate (`PublicAccountGatePage`) and the direct landing auth surface
 * (`PublicStandaloneAuthPage`). Prototype-only: no real credential store, no
 * backend — production auth is delegated to the real application.
 */

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

export function LoginForm({
  onSubmit,
  onSwitchToRegister,
  externalError,
}: {
  onSubmit: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  externalError?: string | null;
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

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Accedi per continuare
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Accedi al tuo account per completare il TesiCheck che hai già configurato.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <TextField id="login-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField id="login-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>

      <button
        type="button"
        onClick={() => toast('Ti invieremo un link per reimpostare la password.')}
        className="control-focus-ring mt-3 inline-block text-[var(--foreground)] hover:underline"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}
      >
        Password dimenticata?
      </button>

      {shownError && <div className="mt-4"><FormError message={shownError} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        Accedi e continua
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
}: {
  onSubmit: (firstName: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}) {
  // Required first name; surname is never asked at registration.
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setError(null);
    onSubmit(firstName.trim(), email.trim(), password);
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

      {error && <div className="mt-4"><FormError message={error} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        Crea account e continua
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
