import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  claimPrecheckSession,
  getPrecheckSession,
  setPrecheckFlowStage,
  type PrecheckFlowStage,
} from '@/app/data/tesicheckPrecheckSession';
import { LoginForm, RegisterForm, VerifyEmailForm, type RegisterSubmitValues } from './standaloneAuthForms';
import {
  confirmAccountEmail,
  getAccountSession,
  isPaymentEnabled,
  registerAccount,
  signInAccount,
  type TesiCheckAccountSession,
} from '@/app/data/tesicheckAccountSession';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SottocheckCheckoutSummary } from '@/app/components/SottocheckCheckoutSummary';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import { applyStandaloneRegistrationConsent } from '@/app/data/tesicheckLeadEnrichment';
import { createPersistentCheckFromPaidPrecheck, type PersistentTesiCheck } from '@/app/data/tesicheckPersistentCheck';
import { SottocheckPaymentGatewayBoundary } from '@/app/components/SottocheckPaymentGatewayBoundary';

type PaymentNotice = 'failed' | 'cancelled' | null;
type AuthMode = 'login' | 'register';

/**
 * Prototype-only: `?paymentDemo=reportfail` makes the first automatic
 * paid-pre-check → persistent-check conversion fail once, so the post-payment
 * recovery state can be exercised without provoking a real storage error.
 * Recovery is then via the on-screen retry button (no gateway, no new payment).
 */
function isReportFailDemo() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paymentDemo') === 'reportfail';
}

export function PublicAccountGatePage() {
  const navigate = useNavigate();
  const { pipelines, students, addPipeline, updatePipeline, updateStudent } = useLavorazioni();
  const [precheckSession, setPrecheckSession] = useState(() => getPrecheckSession());
  const [account, setAccount] = useState<TesiCheckAccountSession | null>(() => getAccountSession());
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice>(null);
  const [completedCheck, setCompletedCheck] = useState<PersistentTesiCheck | null>(null);
  // Optional commercial-communications choice from the in-checkout register form,
  // carried in component state until it is written to the Pipeline after email
  // verification. Not persisted — a reload during OTP loses the verify context.
  const [pendingCommercialConsent, setPendingCommercialConsent] = useState(false);
  const [isCompletingPayment, setIsCompletingPayment] = useState(() => getPrecheckSession()?.flowStage === 'payment_success');
  const [completionError, setCompletionError] = useState(false);

  const hasCreatedCheckRef = useRef(false);
  const didResolveAccountRef = useRef(false);
  const reportFailDemoRef = useRef(false);

  // A returning account skips the login/registration forms: verified users go
  // straight to payment, unverified users resume at the email-verification step.
  useEffect(() => {
    if (didResolveAccountRef.current) return;
    const stage = precheckSession?.flowStage;
    if (stage !== 'checkout_account' && stage !== 'quote_ready') return;
    if (!account) return;

    didResolveAccountRef.current = true;
    claimPrecheckSession(account.id);
    const nextStage: PrecheckFlowStage = account.emailVerified ? 'checkout_payment' : 'checkout_verify_email';
    const nextSession = setPrecheckFlowStage(nextStage);
    if (nextSession) setPrecheckSession(nextSession);
  }, [account, precheckSession?.flowStage]);

  // Payment is verified: materialize the paid pre-check into a persistent check
  // (+ report). On failure the paid state is kept — the pre-check session stays
  // at `payment_success`, still claimed — and the recovery screen offers a retry
  // of *only* this conversion. See `completionError` early return below.
  useEffect(() => {
    if (precheckSession?.flowStage !== 'payment_success' || completedCheck || hasCreatedCheckRef.current) {
      return;
    }

    hasCreatedCheckRef.current = true;

    if (isReportFailDemo() && !reportFailDemoRef.current) {
      // Prototype: fail this first automatic attempt once; keep the guard closed
      // so no auto-retry fires — recovery is the on-screen button.
      reportFailDemoRef.current = true;
      setCompletionError(true);
      setIsCompletingPayment(false);
      return;
    }

    const check = createPersistentCheckFromPaidPrecheck();
    if (!check) {
      // Nothing was written (guard reset so a later dep change can retry too).
      hasCreatedCheckRef.current = false;
      setCompletionError(true);
      setIsCompletingPayment(false);
      return;
    }

    setCompletedCheck(check);
    setPrecheckSession(null);
  }, [completedCheck, precheckSession?.flowStage]);

  // Retry the paid pre-check → persistent check conversion, nothing else: no
  // gateway, no new payment, no new session, no price change. Idempotent — it
  // reuses `createPersistentCheckFromPaidPrecheck`'s dedupe by
  // `sourceTemporaryDocumentRef`, so a record written by an earlier attempt is
  // reused rather than duplicated.
  const handleRetryReportCreation = () => {
    if (completedCheck) return;

    const check = createPersistentCheckFromPaidPrecheck();
    if (!check) {
      setCompletionError(true);
      return;
    }

    hasCreatedCheckRef.current = true;
    setCompletionError(false);
    setIsCompletingPayment(true);
    setCompletedCheck(check);
    setPrecheckSession(null);
  };

  useEffect(() => {
    if (!completedCheck) return;

    const timer = window.setTimeout(() => navigate(`/public-view/report/${completedCheck.id}`), 1200);
    return () => window.clearTimeout(timer);
  }, [completedCheck, navigate]);

  const updateCheckoutStage = (flowStage: PrecheckFlowStage) => {
    const nextSession = setPrecheckFlowStage(flowStage);
    if (!nextSession) {
      navigate('/public');
      return;
    }
    setPrecheckSession(nextSession);
  };

  const advanceAfterAuth = (nextAccount: TesiCheckAccountSession, nextStage: PrecheckFlowStage) => {
    setAccount(nextAccount);
    const claimedSession = claimPrecheckSession(nextAccount.id);
    if (!claimedSession) {
      navigate('/public');
      return;
    }
    updateCheckoutStage(nextStage);
  };

  const handleLogin = (email: string) => {
    advanceAfterAuth(signInAccount(email), 'checkout_payment');
  };

  const handleRegister = (values: RegisterSubmitValues) => {
    setPendingCommercialConsent(values.commercialConsent);
    advanceAfterAuth(
      registerAccount(values.firstName, values.email, values.password, {
        termsAccepted: values.termsAccepted,
        privacyAcknowledged: values.privacyAcknowledged,
      }),
      'checkout_verify_email',
    );
  };

  const handleConfirmEmail = () => {
    const verifiedAccount = confirmAccountEmail();
    if (verifiedAccount) {
      setAccount(verifiedAccount);
      // A verified new standalone registration must project into the CRM
      // immediately — independently of payment or the later enrichment form.
      // Idempotent + Student-safe. The optional commercial choice is written to
      // whichever identity domain resolution resolves: Pipeline
      // `marketing_consents[email]`, or (existing Student, no Pipeline) the
      // verified email contact's `contacts.emails[].marketing_consent`.
      applyStandaloneRegistrationConsent({
        accountEmail: verifiedAccount.email,
        firstName: verifiedAccount.firstName,
        students,
        pipelines,
        addPipeline,
        updatePipeline,
        updateStudent,
        commercialConsent: pendingCommercialConsent,
      });
    }
    updateCheckoutStage('checkout_payment');
  };

  const startRedirect = () => {
    if (!isPaymentEnabled(account)) return;
    setPaymentNotice(null);
    updateCheckoutStage('redirecting');
  };

  const returnFromPayment = (outcome: 'success' | 'failed' | 'cancelled') => {
    if (outcome === 'success') {
      setPaymentNotice(null);
      setIsCompletingPayment(true);
      updateCheckoutStage('payment_success');
      return;
    }

    setPaymentNotice(outcome);
    updateCheckoutStage('checkout_payment');
  };

  if (isCompletingPayment) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-[20px] py-[56px] text-[var(--foreground)] md:px-[40px]">
        <section className="mx-auto flex max-w-[620px] items-start gap-4 border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <div>
            <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>Pagamento ricevuto</h1>
            <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)' }}>Stiamo generando il report...</p>
          </div>
          <Loader2 className="ml-auto h-5 w-5 shrink-0 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
        </section>
      </main>
    );
  }

  // Payment succeeded but the report could not be materialized. The paid state is
  // preserved; this is a recoverable retry of the conversion only — no order
  // summary, no account/payment steps, no gateway.
  if (completionError) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-[20px] py-[56px] text-[var(--foreground)] md:px-[40px]">
        <section className="mx-auto max-w-[620px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <div className="flex items-start gap-4">
            <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-[var(--destructive)]" aria-hidden="true" />
            <div>
              <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
                Non siamo riusciti a generare il report
              </h1>
              <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
                Il pagamento è stato ricevuto. Puoi riprovare senza effettuare un nuovo pagamento.
              </p>
            </div>
          </div>
          <SottocheckActionButton className="mt-6" onClick={handleRetryReportCreation}>
            Riprova a generare il report
          </SottocheckActionButton>
        </section>
      </main>
    );
  }

  if (!precheckSession) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-[20px] py-[56px] text-[var(--foreground)] md:px-[40px]">
        <section className="mx-auto max-w-[640px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
            Inizia un nuovo check
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)' }}>
            Non abbiamo trovato un documento pronto per procedere. Torna alla landing per caricare il file e conoscere il prezzo.
          </p>
          <SottocheckActionButton className="mt-6" onClick={() => navigate('/public')}>
            Vai al check
          </SottocheckActionButton>
        </section>
      </main>
    );
  }

  const isAccountStep = precheckSession.flowStage === 'checkout_account' || precheckSession.flowStage === 'quote_ready';
  const isVerifyStep = precheckSession.flowStage === 'checkout_verify_email';
  const isPaymentStep = precheckSession.flowStage === 'checkout_payment';
  const isRedirecting = precheckSession.flowStage === 'redirecting';
  const paymentEnabled = isPaymentEnabled(account);

  // The redirect boundary is a system transition, not a checkout step: no card
  // chrome, no order summary rail — just the minimal branded interstitial.
  if (isRedirecting) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-[20px] py-[56px] text-[var(--foreground)] md:px-[40px]">
        <section className="mx-auto max-w-[440px] pt-[8vh]">
          <SottocheckPaymentGatewayBoundary
            onCancelled={() => returnFromPayment('cancelled')}
            onFailed={() => returnFromPayment('failed')}
            onSuccess={() => returnFromPayment('success')}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-[20px] py-[40px] text-[var(--foreground)] md:px-[40px] md:py-[56px]">
      <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <section className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Checkout TesiCheck
          </p>

          {isAccountStep && authMode === 'login' && (
            <LoginForm
              onSubmit={handleLogin}
              onSwitchToRegister={() => setAuthMode('register')}
              onForgotPassword={() => navigate('/public/password-recovery?returnTo=/public/account')}
            />
          )}

          {isAccountStep && authMode === 'register' && (
            <RegisterForm onSubmit={handleRegister} onSwitchToLogin={() => setAuthMode('login')} />
          )}

          {isVerifyStep && (
            <VerifyEmailForm email={account?.email ?? ''} onConfirm={handleConfirmEmail} />
          )}

          {isPaymentStep && (
            <>
              <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
                Completa il pagamento
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
                Verrai reindirizzato a un provider di pagamento esterno per completare la transazione.
              </p>

              {paymentNotice === 'failed' && (
                <div className="mt-5 border border-[var(--destructive)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
                    <AlertCircle className="h-4 w-4 text-[var(--destructive)]" /> Pagamento non riuscito
                  </p>
                  <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                    Il tuo riepilogo è stato conservato. Puoi riprovare quando vuoi.
                  </p>
                </div>
              )}

              {paymentNotice === 'cancelled' && (
                <div className="mt-5 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Pagamento annullato</p>
                  <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                    Nessun pagamento è stato effettuato. Puoi riprendere il checkout.
                  </p>
                </div>
              )}

              <SottocheckActionButton className="mt-6" onClick={startRedirect} disabled={!paymentEnabled} icon={<CreditCard className="h-4 w-4" />}>
                {paymentNotice === 'failed' ? 'Riprova pagamento' : 'Vai al pagamento'}
              </SottocheckActionButton>
            </>
          )}
        </section>

        <SottocheckCheckoutSummary
          className="order-first md:order-none"
          title={precheckSession.title}
          documentName={precheckSession.document.name}
          characterCount={precheckSession.characterCount}
          price={precheckSession.price}
        />
      </div>
    </main>
  );
}
