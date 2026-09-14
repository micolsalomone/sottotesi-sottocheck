import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { DEMO_ACCOUNT_ID, getAccountSession } from '@/app/data/tesicheckAccountSession';
import {
  createPersistentStandaloneCheck,
  createStandalonePaymentReference,
  type PersistentTesiCheck,
} from '@/app/data/tesicheckPersistentCheck';
import {
  applyStandaloneAcademicReview,
  resolveStandaloneAcademicReview,
  standaloneAcademicValuesForRecord,
  type AcademicRecordOption,
  type PostPaymentAcademicValues,
} from '@/app/data/standaloneProfile';
import {
  clearPendingEnrichmentCheckId,
  readPendingEnrichmentCheckId,
  writePendingEnrichmentCheckId,
} from '@/app/data/pendingEnrichmentBreadcrumb';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CheckTitleField } from '@/app/components/CheckTitleField';
import { PostPaymentEnrichmentInterstitial } from '@/app/components/tesicheck/PostPaymentEnrichmentInterstitial';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckUploadForm, type UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckPaymentGatewayBoundary } from '@/app/components/SottocheckPaymentGatewayBoundary';
import { deriveDefaultCheckTitle } from '@/app/utils/deriveCheckTitle';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type FlowStage = 'form' | 'redirecting';
type PaymentNotice = 'failed' | 'cancelled' | null;

const DEMO_CHARACTER_COUNT = 28500;
const DEMO_PRICE = 14.9;

/**
 * Authenticated standalone self-service paid TesiCheck (`/public-view/sottocheck`),
 * inside `PublicLayout`. The visitor already has a standalone account session
 * (`PublicLayout` guard) — no account / login / registration / email
 * verification step. Canonical grammar, same as Student / Coach free:
 *
 *   upload → title → mock count/price → ONE "Vai al pagamento"
 *   → SottocheckPaymentGatewayBoundary → payment success
 *   → brief "Pagamento ricevuto / Stiamo generando il report..."
 *   → createPersistentStandaloneCheck (owner.context 'standalone', DEMO_ACCOUNT_ID)
 *   → navigate('/public-view/report/:checkId')
 *
 * No final success page, no manual "Visualizza il report", no History action.
 * Persistent store: the shared consumer `public-tesicheck-checks-v1`; the record
 * shows in `/public-view/history` and opens via `/public-view/report/:checkId`.
 * This is a role-specific page — it deliberately does NOT reuse the Student page.
 *
 * Post-payment academic-profile review: AFTER the persistent check exists, a
 * lightweight review interstitial shows all four academic fields (degree level
 * / university / course / typology) PREFILLED with the current values from the
 * user's own standalone Profile (`standaloneProfile.ts`, the SAME store
 * `/public-view/profilo` reads/writes) — the user confirms, corrects, completes
 * or skips. A Profile with >1 academic record also gets a `Percorso accademico`
 * selector to choose which EXISTING record to review (preselecting the current
 * one). This is deliberately CRM-free: no Pipeline, no Student, no identity
 * resolution — the review only ever depends on the authenticated account's own
 * Profile, so its shape never changes based on Pipeline-vs-Student matching. It
 * asks for academic context only — never surname / phone / contacts / identity;
 * it never associates the check with a record. It never blocks the report,
 * never runs before `completedCheck`, and never touches payment /
 * materialization / recovery / the check schema. A transient `{ checkId }`
 * breadcrumb (`pendingEnrichmentBreadcrumb`) lets a refresh on the interstitial
 * fall forward to the already-paid report.
 */
function isReportFailDemo() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paymentDemo') === 'reportfail';
}

export function PublicPaidSottocheckPage() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  // Semantic check title — seeded from the filename on upload, editable, and
  // passed explicitly to materialization (initial + retry). React state only.
  const [title, setTitle] = useState('');
  const [isPricing, setIsPricing] = useState(false);
  const [quote, setQuote] = useState<{ characterCount: number; price: number } | null>(null);
  const [flowStage, setFlowStage] = useState<FlowStage>('form');
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const [completedCheck, setCompletedCheck] = useState<PersistentTesiCheck | null>(null);
  // `null` = post-materialization review decision not taken yet; an object =
  // show the academic-profile review interstitial (prefill values + optional
  // record-selector options, both sourced from the user's own standalone
  // Profile). `selectedRecordId` names the Profile academic record being
  // reviewed; `reviewEmail` is the verified account email the review resolved
  // for, captured once so later reads/writes target the same Profile.
  const [academicReview, setAcademicReview] = useState<{
    initialValues: PostPaymentAcademicValues;
    records?: AcademicRecordOption[];
  } | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [reviewEmail, setReviewEmail] = useState<string | null>(null);
  const pricingTimerRef = useRef<number | null>(null);
  const hasCreatedCheckRef = useRef(false);
  const paymentReferenceRef = useRef<string | null>(null);
  const reportFailDemoRef = useRef(false);

  // Refresh safety: the review interstitial widens the window between
  // materialization and report navigation, and the in-progress flow lives only
  // in React state. If a breadcrumb from a materialized check survives a reload,
  // fall forward to the already-paid report — the review is disposable, the paid
  // report is not. Never reopens payment, never re-materializes.
  useEffect(() => {
    if (completedCheck || academicReview !== null) return;
    const pendingCheckId = readPendingEnrichmentCheckId();
    if (!pendingCheckId) return;
    clearPendingEnrichmentCheckId();
    navigate(`/public-view/report/${pendingCheckId}`);
    // Mount-only: a genuine post-refresh recovery. Later-session state is checked
    // in the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Post-materialization: persist the transient breadcrumb, then decide whether
  // the academic-profile review interstitial applies before navigating. Only
  // this navigation is gated — the materialization effect is untouched. The
  // review reads/creates ONLY the user's own standalone Profile — no CRM
  // resolution, so it is always applicable for a verified account email.
  useEffect(() => {
    if (!completedCheck || academicReview !== null) return;

    writePendingEnrichmentCheckId(completedCheck.id);

    let review: ReturnType<typeof resolveStandaloneAcademicReview> = null;
    let email: string | null = null;
    try {
      const session = getAccountSession();
      email = session?.emailVerified ? session.email : null;
      review = resolveStandaloneAcademicReview(email);
    } catch {
      review = null;
    }

    if (review) {
      setAcademicReview({ initialValues: review.initialValues, records: review.records });
      setSelectedRecordId(review.selectedRecordId);
      setReviewEmail(email);
      setIsProcessing(false);
      return;
    }

    // No verified account email to resolve a Profile for — keep the brief
    // "Pagamento ricevuto" beat, then report.
    const timer = window.setTimeout(() => {
      clearPendingEnrichmentCheckId();
      navigate(`/public-view/report/${completedCheck.id}`);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [completedCheck, academicReview, navigate]);

  const goToReport = (checkId: string) => {
    clearPendingEnrichmentCheckId();
    navigate(`/public-view/report/${checkId}`);
  };

  // Both interstitial actions always reach the paid report. Save attempts the
  // Profile update and navigates regardless of its outcome — this review is
  // secondary to a paid result, so a failure here never shows a recovery
  // screen. Writes only the user's own standalone Profile — no Pipeline, no
  // Student.
  const handleAcademicSave = (values: PostPaymentAcademicValues) => {
    if (!completedCheck) return;
    try {
      if (selectedRecordId) {
        applyStandaloneAcademicReview(reviewEmail, selectedRecordId, values);
      }
    } catch {
      // Never block the report on the academic-profile review.
    }
    goToReport(completedCheck.id);
  };

  const handleAcademicSkip = () => {
    if (!completedCheck) return;
    goToReport(completedCheck.id);
  };

  const handleAcademicRecordChange = (recordId: string) => {
    setSelectedRecordId(recordId);
  };

  // Payment verified: materialize the persistent standalone check (+ report). On
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

    const check = createPersistentStandaloneCheck({
      accountId: DEMO_ACCOUNT_ID,
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

  // Retry the persistent-check materialization, nothing else: no gateway, no new
  // payment, no pricing change. Idempotent — `createPersistentStandaloneCheck`
  // dedupes by `sourcePaymentReference`, so a check written by an earlier attempt
  // is reused rather than duplicated.
  const handleRetryReportCreation = () => {
    if (completedCheck || !document || !quote || !paymentReferenceRef.current) return;

    const check = createPersistentStandaloneCheck({
      accountId: DEMO_ACCOUNT_ID,
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

  // Optional post-payment academic-profile review. The persistent check already
  // exists; both actions lead to its report. The prefill follows the selected
  // record so switching the selector updates the fields.
  if (academicReview) {
    const initialValues =
      (selectedRecordId ? standaloneAcademicValuesForRecord(reviewEmail, selectedRecordId) : null)
      ?? academicReview.initialValues;
    return (
      <PostPaymentEnrichmentInterstitial
        initialValues={initialValues}
        records={academicReview.records}
        selectedRecordId={selectedRecordId ?? undefined}
        onRecordChange={handleAcademicRecordChange}
        onSave={handleAcademicSave}
        onSkip={handleAcademicSkip}
      />
    );
  }

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

          <StepCard number="3" title="Conferma e pagamento" description="Il TesiCheck è un servizio a pagamento. Da qui vai direttamente al provider di pagamento.">
            {paymentNotice === 'failed' && (
              <div className="mt-4 border border-[var(--destructive)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p className="flex items-center gap-2" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
                  <AlertCircle className="h-4 w-4 text-[var(--destructive)]" /> Pagamento non riuscito
                </p>
                <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                  Documento, titolo e prezzo sono stati conservati. Puoi riprovare quando vuoi.
                </p>
              </div>
            )}
            {paymentNotice === 'cancelled' && (
              <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Pagamento annullato</p>
                <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
                  Nessun pagamento è stato effettuato. Documento, titolo e prezzo restano disponibili.
                </p>
              </div>
            )}
            <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SottocheckPricingPreview isLoading={isPricing} isUpdated={!!quote} characterCount={quote?.characterCount} price={quote?.price} />
                <SottocheckActionButton
                  onClick={() => {
                    setPaymentNotice(null);
                    setFlowStage('redirecting');
                  }}
                  disabled={!canContinue}
                  icon={<CreditCard className="h-4 w-4" />}
                >
                  {paymentNotice === 'failed' ? 'Riprova pagamento' : 'Vai al pagamento'}
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

      {flowStage === 'redirecting' && quote && document && (
        <GatewayPanel
          onCancelled={() => {
            setPaymentNotice('cancelled');
            setFlowStage('form');
          }}
          onFailed={() => {
            setPaymentNotice('failed');
            setFlowStage('form');
          }}
          onSuccess={() => {
            // One stable idempotency key per successful payment, kept across retries.
            if (!paymentReferenceRef.current) {
              paymentReferenceRef.current = createStandalonePaymentReference();
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

function GatewayPanel({ onCancelled, onFailed, onSuccess }: { onCancelled: () => void; onFailed: () => void; onSuccess: () => void }) {
  return (
    <section className="max-w-[760px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
      <SottocheckPaymentGatewayBoundary onCancelled={onCancelled} onFailed={onFailed} onSuccess={onSuccess} />
    </section>
  );
}
