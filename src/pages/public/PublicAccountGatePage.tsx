import { AlertCircle, ArrowRight, CheckCircle2, Circle, CreditCard, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  claimPrecheckSession,
  getPrecheckSession,
  setPrecheckFlowStage,
  type PrecheckFlowStage,
} from '@/app/data/tesicheckPrecheckSession';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { createPersistentCheckFromPaidPrecheck, type PersistentTesiCheck } from '@/app/data/tesicheckPersistentCheck';
import { SottocheckPaymentGatewayBoundary } from '@/app/components/SottocheckPaymentGatewayBoundary';

// The prototype has no auth provider; both account actions claim the session with this demo identity.
const DEMO_PUBLIC_ACCOUNT_ID = 'public-account-demo';
const DEMO_PUBLIC_ACCOUNT_LABEL = 'utente@tesicheck.demo';

type PaymentNotice = 'failed' | 'cancelled' | null;

export function PublicAccountGatePage() {
  const navigate = useNavigate();
  const [precheckSession, setPrecheckSession] = useState(() => getPrecheckSession());
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice>(null);
  const [completedCheck, setCompletedCheck] = useState<PersistentTesiCheck | null>(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(() => getPrecheckSession()?.flowStage === 'payment_success');
  const [completionError, setCompletionError] = useState(false);

  useEffect(() => {
    if (precheckSession?.flowStage !== 'payment_success' || completedCheck) {
      return;
    }

    const check = createPersistentCheckFromPaidPrecheck();
    if (!check) {
      setCompletionError(true);
      setIsCompletingPayment(false);
      return;
    }

    setCompletedCheck(check);
    setPrecheckSession(null);
  }, [completedCheck, precheckSession?.flowStage]);

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

  const continueToPayment = () => {
    const claimedSession = claimPrecheckSession(DEMO_PUBLIC_ACCOUNT_ID);
    if (!claimedSession) {
      navigate('/public');
      return;
    }

    const paymentSession = setPrecheckFlowStage('checkout_payment');
    if (!paymentSession) {
      navigate('/public');
      return;
    }
    setPrecheckSession(paymentSession);
  };

  const startRedirect = () => {
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
          <SottocheckActionButton className="mt-6" onClick={() => navigate('/public')} icon={<ArrowRight className="h-4 w-4" />}>
            Vai al check
          </SottocheckActionButton>
        </section>
      </main>
    );
  }

  const isAccountStep = precheckSession.flowStage === 'checkout_account' || precheckSession.flowStage === 'quote_ready';
  const isPaymentStep = precheckSession.flowStage === 'checkout_payment';
  const isRedirecting = precheckSession.flowStage === 'redirecting';
  const isPaymentSuccess = precheckSession.flowStage === 'payment_success';
  const accountCompleted = precheckSession.claim.status === 'claimed';

  return (
    <main className="min-h-screen bg-[var(--background)] px-[20px] py-[40px] text-[var(--foreground)] md:px-[40px] md:py-[56px]">
      <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <section className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Checkout TesiCheck
          </p>

          {isAccountStep && (
            <>
              <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
                Completa il tuo acquisto
              </h1>
              <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
                Accedi o crea un account per continuare con il TesiCheck che hai già configurato.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <SottocheckActionButton onClick={continueToPayment} icon={<LogIn className="h-4 w-4" />}>
                  Accedi
                </SottocheckActionButton>
                <SottocheckActionButton onClick={continueToPayment} variant="secondary" icon={<UserPlus className="h-4 w-4" />}>
                  Crea account
                </SottocheckActionButton>
              </div>
            </>
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

              <SottocheckActionButton className="mt-6" onClick={startRedirect} icon={<CreditCard className="h-4 w-4" />}>
                {paymentNotice === 'failed' ? 'Riprova pagamento' : 'Vai al pagamento'}
              </SottocheckActionButton>
            </>
          )}

          {isRedirecting && (
            <SottocheckPaymentGatewayBoundary
              onCancelled={() => returnFromPayment('cancelled')}
              onFailed={() => returnFromPayment('failed')}
              onSuccess={() => returnFromPayment('success')}
            />
          )}

          {completionError && (
            <div className="mt-5 border border-[var(--destructive)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Non è stato possibile preparare il report.</p>
              <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>Riprova ad aprire il checkout per continuare.</p>
            </div>
          )}

          <div className="mt-8 border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-3">
              {accountCompleted ? <CheckCircle2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" /> : <Circle className="h-5 w-5 text-[var(--muted-foreground)]" aria-hidden="true" />}
              <div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Account</p>
                <p className="text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                  {accountCompleted ? `${DEMO_PUBLIC_ACCOUNT_LABEL} · completato` : 'Da completare'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <CreditCard className={`h-5 w-5 ${isPaymentStep ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`} aria-hidden="true" />
              <div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Pagamento</p>
                <p className="text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                  {isPaymentStep ? 'Attivo' : isPaymentSuccess ? 'In verifica' : 'Prossimo step'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="border border-[var(--border)] bg-[var(--card)] p-5" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Riepilogo TesiCheck
          </p>
          <p className="mt-4 break-words" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
            {precheckSession.document.name}
          </p>
          <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
            {precheckSession.characterCount.toLocaleString('it-IT')} caratteri
          </p>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>Totale</p>
            <p className="mt-1" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>
              EUR {precheckSession.price.toFixed(2)}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
