import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { STUDENT_VIEW_STUDENT_ID } from '@/app/utils/studentView';
import { createPersistentStudentCheck, createStudentPaymentReference, type PersistentTesiCheck } from '@/app/data/tesicheckPersistentCheck';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CheckTitleField } from '@/app/components/CheckTitleField';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckUploadForm, type UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckPaymentGatewayBoundary } from '@/app/components/SottocheckPaymentGatewayBoundary';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';
import { deriveDefaultCheckTitle } from '@/app/utils/deriveCheckTitle';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type StudentFlowStage = 'form' | 'payment' | 'redirecting';
type PaymentNotice = 'failed' | 'cancelled' | null;

const DEMO_CHARACTER_COUNT = 28500;
const DEMO_PRICE = 14.9;

/**
 * Prototype-only: `?paymentDemo=reportfail` makes the first automatic
 * persistent-check materialization fail once, so the post-payment recovery
 * state is exercisable. Same meaning as the standalone checkout flow.
 */
function isReportFailDemo() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paymentDemo') === 'reportfail';
}

export function StudentPaidSottocheckPage() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  // Semantic check title — seeded from the filename on upload, editable, and
  // passed explicitly to materialization (initial + retry). React state only.
  const [title, setTitle] = useState('');
  const [isPricing, setIsPricing] = useState(false);
  const [quote, setQuote] = useState<{ characterCount: number; price: number } | null>(null);
  const [flowStage, setFlowStage] = useState<StudentFlowStage>('form');
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [completedCheck, setCompletedCheck] = useState<PersistentTesiCheck | null>(null);
  const pricingTimerRef = useRef<number | null>(null);
  const hasCreatedCheckRef = useRef(false);
  const paymentReferenceRef = useRef<string | null>(null);
  const reportFailDemoRef = useRef(false);

  useEffect(() => {
    if (!completedCheck) return;
    const timer = window.setTimeout(() => navigate(`/student-view/report/${completedCheck.id}`), 1200);
    return () => window.clearTimeout(timer);
  }, [completedCheck, navigate]);

  // Payment verified: materialize the persistent Student check (+ report). On
  // failure the paid state is kept (document / quote / payment reference intact)
  // and the recovery screen offers a retry of *only* this materialization.
  useEffect(() => {
    if (
      !isProcessing ||
      completedCheck ||
      hasCreatedCheckRef.current ||
      !document ||
      !quote ||
      !paymentReferenceRef.current
    ) {
      return;
    }
    hasCreatedCheckRef.current = true;

    if (isReportFailDemo() && !reportFailDemoRef.current) {
      // Prototype: fail this first automatic attempt once; keep the guard closed
      // so no auto-retry fires — recovery is the on-screen button.
      reportFailDemoRef.current = true;
      setCompletionError(true);
      setIsProcessing(false);
      return;
    }

    const check = createPersistentStudentCheck({
      studentId: STUDENT_VIEW_STUDENT_ID,
      title,
      document,
      characterCount: quote.characterCount,
      price: quote.price,
      sourcePaymentReference: paymentReferenceRef.current,
    });
    if (check) {
      setCompletedCheck(check);
      return;
    }
    // Nothing was written; reopen the guard and surface a recoverable error.
    hasCreatedCheckRef.current = false;
    setCompletionError(true);
    setIsProcessing(false);
  }, [completedCheck, document, isProcessing, quote]);

  // Retry the persistent Student check materialization, nothing else: no gateway,
  // no new payment, no pricing change. Idempotent — `createPersistentStudentCheck`
  // dedupes by `sourcePaymentReference`, so a check written by an earlier attempt
  // is reused rather than duplicated.
  const handleRetryReportCreation = () => {
    if (completedCheck || !document || !quote || !paymentReferenceRef.current) return;

    const check = createPersistentStudentCheck({
      studentId: STUDENT_VIEW_STUDENT_ID,
      title,
      document,
      characterCount: quote.characterCount,
      price: quote.price,
      sourcePaymentReference: paymentReferenceRef.current,
    });
    if (!check) {
      setCompletionError(true);
      return;
    }

    hasCreatedCheckRef.current = true;
    setCompletionError(false);
    setIsProcessing(true);
    setCompletedCheck(check);
  };

  const clearPricingTimer = () => {
    if (pricingTimerRef.current) {
      window.clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = null;
    }
  };

  const handleFileSelected = (nextDocument: UploadedDocument, status: DocumentStatus) => {
    setDocument(nextDocument);
    setDocumentStatus(status);
    setQuote(null);
    clearPricingTimer();

    if (status !== 'valid') {
      setTitle('');
      setIsPricing(false);
      return;
    }

    // A new document always derives a fresh default title.
    setTitle(deriveDefaultCheckTitle(nextDocument.name));
    setIsPricing(true);
    pricingTimerRef.current = window.setTimeout(() => {
      setQuote({ characterCount: DEMO_CHARACTER_COUNT, price: DEMO_PRICE });
      setIsPricing(false);
      pricingTimerRef.current = null;
    }, 700);
  };

  const handleFileCleared = () => {
    clearPricingTimer();
    setDocument(null);
    setDocumentStatus('idle');
    setTitle('');
    setQuote(null);
    setIsPricing(false);
  };

  const canContinue = documentStatus === 'valid' && !!quote && !isPricing;

  if (isProcessing) {
    return (
      <div className="py-[32px]">
        <section className="mx-auto flex max-w-[620px] items-start gap-4 border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <div>
            <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>Pagamento ricevuto</h1>
            <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)' }}>Stiamo generando il report...</p>
          </div>
          <Loader2 className="ml-auto h-5 w-5 shrink-0 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
        </section>
      </div>
    );
  }

  // Payment succeeded but the report could not be materialized. The paid state is
  // preserved; this is a recoverable retry of the materialization only — no
  // pricing, no payment CTA, no gateway.
  if (completionError) {
    return (
      <div className="py-[32px]">
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
      </div>
    );
  }

  return (
    <div className="py-[32px]">
      <header className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.5 }}>
          TesiCheck
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)' }}>
          Carica il documento, verifica il formato e completa il pagamento per avviare il controllo.
        </p>
      </header>

      {flowStage === 'form' && (
        <div className="flex flex-col gap-6">
          <StepCard number="1" title="Requisiti del documento" description="Assicurati che il documento rispetti questi requisiti prima di procedere.">
            <div className="mt-4 border border-[var(--warning)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex gap-3">
                <AlertCircle className="mt-[2px] h-5 w-5 shrink-0 text-[var(--warning)]" />
                <div>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Requisiti obbligatori</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
                    <li>Formato supportato: PDF o DOCX</li>
                    <li>Dimensione massima: 50 MB</li>
                    <li>Documento finale e conforme ai requisiti di formattazione</li>
                  </ul>
                </div>
              </div>
            </div>
            <a href="#" className="mt-4 inline-flex items-center gap-2 text-[var(--primary)] hover:opacity-80" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
              <ExternalLink className="h-4 w-4" /> Scarica linee guida di formattazione
            </a>
          </StepCard>

          <StepCard number="2" title="Carica documento" description="Trascina il file o selezionalo dal tuo computer.">
            <div className="mt-4">
              <SottocheckUploadForm
                onFileSelected={handleFileSelected}
                onStatusChange={setDocumentStatus}
                onFileCleared={handleFileCleared}
                showHeading={false}
              />
            </div>
            {documentStatus === 'valid' && (
              <CheckTitleField
                className="mt-4"
                value={title}
                onChange={setTitle}
                onBlur={() => {
                  if (!title.trim() && document) setTitle(deriveDefaultCheckTitle(document.name));
                }}
              />
            )}
          </StepCard>

          <StepCard number="3" title="Conferma e pagamento" description="Il TesiCheck personale è un servizio self-service a pagamento.">
            <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SottocheckPricingPreview isLoading={isPricing} isUpdated={!!quote} characterCount={quote?.characterCount} price={quote?.price} />
                <SottocheckActionButton onClick={() => setFlowStage('payment')} disabled={!canContinue} icon={<CreditCard className="h-4 w-4" />}>
                  Procedi al pagamento
                </SottocheckActionButton>
              </div>
            </div>
            {!canContinue && (
              <p className="mt-3 text-[var(--warning)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
                Carica un documento valido per visualizzare il prezzo e procedere.
              </p>
            )}
          </StepCard>
        </div>
      )}

      {flowStage === 'payment' && quote && document && (
        <PaymentPanel
          document={document}
          quote={quote}
          notice={paymentNotice}
          onPay={() => {
            setPaymentNotice(null);
            setFlowStage('redirecting');
          }}
        />
      )}

      {flowStage === 'redirecting' && quote && document && (
        <GatewayPanel
          onCancelled={() => {
            setPaymentNotice('cancelled');
            setFlowStage('payment');
          }}
          onFailed={() => {
            setPaymentNotice('failed');
            setFlowStage('payment');
          }}
          onSuccess={() => {
            // One stable idempotency key per successful payment, kept across retries.
            if (!paymentReferenceRef.current) {
              paymentReferenceRef.current = createStudentPaymentReference();
            }
            setIsProcessing(true);
          }}
        />
      )}
    </div>
  );
}

function StepCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] p-6" style={{ borderRadius: 'var(--radius)' }}>
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--primary)] text-[var(--background)]" style={{ borderRadius: '50%', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>{number}</div>
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)' }}>{title}</h2>
          <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>{description}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

function PaymentPanel({ document, quote, notice, onPay }: { document: UploadedDocument; quote: { characterCount: number; price: number }; notice: PaymentNotice; onPay: () => void }) {
  return (
    <section className="max-w-[760px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
      <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>TesiCheck</p>
      <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>Completa il pagamento</h2>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>Verrai reindirizzato a un provider di pagamento esterno per completare la transazione.</p>
      <div className="mt-6 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>{document.name}</p>
        <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>{quote.characterCount.toLocaleString('it-IT')} caratteri · {formatCheckoutPrice(quote.price)}</p>
      </div>
      {notice === 'failed' && <PaymentNoticePanel title="Pagamento non riuscito" text="Il riepilogo è stato conservato. Puoi riprovare quando vuoi." destructive />}
      {notice === 'cancelled' && <PaymentNoticePanel title="Pagamento annullato" text="Nessun pagamento è stato effettuato. Puoi riprendere il checkout." />}
      <SottocheckActionButton className="mt-6" onClick={onPay} icon={<CreditCard className="h-4 w-4" />}>
        {notice === 'failed' ? 'Riprova pagamento' : 'Vai al pagamento'}
      </SottocheckActionButton>
    </section>
  );
}

function PaymentNoticePanel({ title, text, destructive = false }: { title: string; text: string; destructive?: boolean }) {
  return (
    <div className={`mt-5 border bg-[var(--background)] p-4 ${destructive ? 'border-[var(--destructive)]' : 'border-[var(--border)]'}`} style={{ borderRadius: 'var(--radius)' }}>
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>{title}</p>
      <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>{text}</p>
    </div>
  );
}

function GatewayPanel({ onCancelled, onFailed, onSuccess }: { onCancelled: () => void; onFailed: () => void; onSuccess: () => void }) {
  return (
    <section className="max-w-[760px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
      <SottocheckPaymentGatewayBoundary onCancelled={onCancelled} onFailed={onFailed} onSuccess={onSuccess} />
    </section>
  );
}
