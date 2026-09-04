import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { EMAIL_PATTERN, FormError, TextField } from './standaloneAuthForms';

/**
 * Prototype password-recovery GUI for developer handoff. GUI + navigation only —
 * NO real recovery: no email is sent, no reset token is generated or checked, no
 * password is stored or changed. It exists to specify the intended screens and
 * journey. Production must implement recovery in the real application.
 *
 * Two surfaces, one component:
 *   - `mode="recovery"` → `/public/password-recovery`: request → "check your email"
 *   - `mode="reset"`    → `/public/reset-password`:    new password → "updated"
 *
 * Origin is preserved with a `returnTo` query param so `Torna ad accedere`
 * returns to the surface the user came from (`/public/account` keeps its
 * in-progress pre-check session; `/public/login` otherwise). No auth state is
 * introduced.
 */

const ALLOWED_RETURN_TO = ['/public/login', '/public/account'] as const;
type ReturnTo = (typeof ALLOWED_RETURN_TO)[number];

function resolveReturnTo(raw: string | null): ReturnTo {
  return (ALLOWED_RETURN_TO as readonly string[]).includes(raw ?? '')
    ? (raw as ReturnTo)
    : '/public/login';
}

/** `mario.rossi@example.com` → `m•••@example.com`. Presentation only. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const head = local.slice(0, 1) || '•';
  return `${head}•••@${domain}`;
}

export function PublicPasswordRecoveryPage({ mode }: { mode: 'recovery' | 'reset' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = resolveReturnTo(searchParams.get('returnTo'));
  const returnToLabel = returnTo === '/public/account' ? "Torna al checkout" : 'Torna ad accedere';

  return (
    <main className="min-h-screen bg-[var(--background)] px-[20px] py-[40px] text-[var(--foreground)] md:px-[40px] md:py-[56px]">
      <div className="mx-auto max-w-[560px]">
        <button
          type="button"
          onClick={() => navigate('/public')}
          className="control-focus-ring inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </button>

        <section
          className="mt-5 border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <p
            className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Account TesiCheck
          </p>

          {mode === 'recovery' ? (
            <RecoveryRequest onBackToLogin={() => navigate(returnTo)} backToLoginLabel={returnToLabel} />
          ) : (
            <ResetPassword onDone={() => navigate(returnTo)} />
          )}
        </section>
      </div>
    </main>
  );
}

function RecoveryRequest({ onBackToLogin, backToLoginLabel }: { onBackToLogin: () => void; backToLoginLabel: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError('Inserisci un indirizzo email valido.');
      return;
    }
    setError(null);
    // Prototype: no email is actually sent — this only advances the GUI.
    setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <>
        <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
          Controlla la tua email
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
          Abbiamo inviato le istruzioni per reimpostare la password a{' '}
          <span className="text-[var(--foreground)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>{maskEmail(sentTo)}</span>.
        </p>

        <SottocheckActionButton className="mt-6" onClick={onBackToLogin}>
          {backToLoginLabel}
        </SottocheckActionButton>

        <p className="mt-5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
          Non hai ricevuto niente?{' '}
          <button
            type="button"
            onClick={() => setResent(true)}
            className="control-focus-ring text-[var(--foreground)] hover:underline"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
          >
            Invia di nuovo
          </button>
          {resent && <span className="ml-2 text-[var(--primary)]">Istruzioni inviate di nuovo.</span>}
        </p>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Recupera la password
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Inserisci l'email associata al tuo account. Ti invieremo le istruzioni per impostare una nuova password.
      </p>

      <div className="mt-6">
        <TextField id="recovery-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      </div>

      {error && <div className="mt-4"><FormError message={error} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        Invia istruzioni
      </SottocheckActionButton>

      <p className="mt-5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
        <button
          type="button"
          onClick={onBackToLogin}
          className="control-focus-ring text-[var(--foreground)] hover:underline"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          {backToLoginLabel}
        </button>
      </p>
    </form>
  );
}

function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    setError(null);
    // Prototype: nothing is stored or changed — this only advances the GUI.
    setDone(true);
  };

  if (done) {
    return (
      <>
        <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
          Password aggiornata
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
          Ora puoi accedere con la nuova password.
        </p>
        <SottocheckActionButton className="mt-6" onClick={onDone}>
          Accedi
        </SottocheckActionButton>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Imposta una nuova password
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Scegli una nuova password per il tuo account TesiCheck.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <TextField id="reset-password" label="Nuova password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <TextField id="reset-confirm-password" label="Conferma nuova password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      </div>

      {error && <div className="mt-4"><FormError message={error} /></div>}

      <SottocheckActionButton className="mt-6" type="submit">
        Salva nuova password
      </SottocheckActionButton>
    </form>
  );
}
