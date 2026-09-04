import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  confirmAccountEmail,
  findRegisteredAccount,
  getAccountSession,
  registerAccount,
  signInAccount,
} from '@/app/data/tesicheckAccountSession';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import { ensureTesiCheckPipeline } from '@/app/data/tesicheckLeadEnrichment';
import { LoginForm, RegisterForm, VerifyEmailForm } from './standaloneAuthForms';

type AuthStep = 'login' | 'register' | 'verify';

/**
 * Direct standalone account entry from the `/public` landing — independent of the
 * upload-first paid checkout (no pre-check session, no fake quote, no payment).
 *
 * - `/public/login`  → sign in → `/public-view`
 * - `/public/register` → prototype email verification → CRM Pipeline
 *   create/dedupe (canonical acquisition rule) → `/public-view`
 *
 * Prototype-only auth: see `tesicheckAccountSession.ts`. Production auth is
 * delegated to the real application.
 */
export function PublicStandaloneAuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { pipelines, students, addPipeline, updatePipeline } = useLavorazioni();
  const [step, setStep] = useState<AuthStep>(mode);
  const [pendingEmail, setPendingEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // A visitor who already has a session doesn't need this surface — send them to
  // the workspace. Runs once, before any local registration sets a session.
  const hadSessionOnMount = useRef(getAccountSession() != null);
  useEffect(() => {
    if (hadSessionOnMount.current) navigate('/public-view', { replace: true });
  }, [navigate]);

  const goToLogin = () => {
    setLoginError(null);
    setStep('login');
    navigate('/public/login', { replace: true });
  };

  const goToRegister = () => {
    setLoginError(null);
    setStep('register');
    navigate('/public/register', { replace: true });
  };

  const handleLogin = (email: string, password: string) => {
    const known = findRegisteredAccount(email);
    if (known && known.password && known.password !== password) {
      setLoginError('Email o password non corretti.');
      return;
    }
    setLoginError(null);
    signInAccount(email);
    navigate('/public-view', { replace: true });
  };

  const handleRegister = (firstName: string, email: string, password: string) => {
    registerAccount(firstName, email, password);
    setPendingEmail(email);
    setStep('verify');
  };

  const handleConfirmEmail = () => {
    const verified = confirmAccountEmail();
    if (verified) {
      // A verified new standalone registration projects into the CRM immediately
      // — same canonical acquisition rule as the in-checkout gate. Idempotent +
      // Student-safe (see `ensureTesiCheckPipeline`).
      ensureTesiCheckPipeline({
        accountEmail: verified.email,
        firstName: verified.firstName,
        students,
        pipelines,
        addPipeline,
        updatePipeline,
      });
    }
    navigate('/public-view', { replace: true });
  };

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

          {step === 'login' && (
            <LoginForm onSubmit={handleLogin} onSwitchToRegister={goToRegister} externalError={loginError} />
          )}

          {step === 'register' && (
            <RegisterForm onSubmit={handleRegister} onSwitchToLogin={goToLogin} />
          )}

          {step === 'verify' && (
            <VerifyEmailForm email={pendingEmail} onConfirm={handleConfirmEmail} />
          )}
        </section>
      </div>
    </main>
  );
}
