import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckPaymentGatewayBoundary } from '@/app/components/SottocheckPaymentGatewayBoundary';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';
import { COACH_VIEW_COACH_ID } from '@/app/utils/coachView';
import {
  createCoachExecutionReference,
  createCoachFreeCheck,
  createCoachFreePaymentReference,
  createCoachPathBoundCheck,
  type CoachFreeCheck,
  type CoachPathBoundCheck,
} from '@/app/data/tesicheckCoachCheck';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type PathCheckStatus = 'created' | 'processing' | 'error';
type FreeStage = 'form' | 'payment' | 'redirecting';
type PaymentNotice = 'failed' | 'cancelled' | null;
type PlanType = 'starter_pack' | 'coaching' | 'coaching_plus';

/** Explicit sentinel for the paid free-check context. Never derived from `''`. */
const FREE_CHECK_CONTEXT = 'check_libero';

interface TimelinePath {
  id: string;
  studentName: string;
  serviceName: string;
  timelineLabel: string;
  planType: PlanType;
  /**
   * Grounded Coach-view Student id (`STUDENTS_DATA` / `/coach-view/studenti/:studentId`).
   * Optional: only a path carrying a real id can enter the persistent-check flow.
   * Ids are never derived from `studentName` at runtime.
   */
  studentId?: string;
}

const MAX_FREE_CHECK_CREDITS = 100;
const MOCK_CREDIT_COST_PER_CHECK = 8;
const ELIGIBLE_PLAN: PlanType = 'coaching';

/**
 * Prototype consistency decision (not a production pricing rule): the Coach
 * `Check libero` reuses the SAME mock character-count / price the Student and
 * Public paid flows already use. The known `EUR 0,52/1000cc` vs `€14,90`
 * arithmetic inconsistency in `SottocheckPricingPreview` is out of scope here
 * and remains open.
 */
const FREE_CHECK_DEMO_CHARACTER_COUNT = 28500;
const FREE_CHECK_DEMO_PRICE = 14.9;

const PLAN_LABELS: Record<PlanType, string> = {
  starter_pack: 'Starter Pack',
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
};

const MOCK_TIMELINE_PATHS: TimelinePath[] = [
  {
    id: 'svc-giulia-verdi',
    studentName: 'Giulia Verdi',
    serviceName: 'Coaching',
    timelineLabel: 'Timeline Tesi Magistrale',
    planType: 'coaching',
    studentId: 'S-034',
  },
  {
    id: 'svc-sara-martini',
    studentName: 'Sara Martini',
    serviceName: 'Coaching Plus',
    timelineLabel: 'Timeline Revisione Finale',
    planType: 'coaching_plus',
  },
  {
    id: 'svc-luca-neri',
    studentName: 'Luca Neri',
    serviceName: 'Starter Pack',
    timelineLabel: 'Timeline Base',
    planType: 'starter_pack',
  },
];

const MOCK_USED_CREDITS_BY_PATH: Record<string, number> = {
  'svc-giulia-verdi': 36,
  'svc-sara-martini': 12,
  'svc-luca-neri': 8,
};

interface PendingPathCheck {
  studentId: string;
  studentName: string;
  pathId: string;
  pathLabel: string;
  document: UploadedDocument;
  executionReference: string;
}

/**
 * Prototype-only: `?paymentDemo=reportfail` makes the first automatic free-check
 * materialization fail once, so the post-payment recovery state is exercisable.
 * Same meaning as the consumer paid flows.
 */
function isReportFailDemo() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paymentDemo') === 'reportfail';
}

/**
 * Coach TesiCheck entry page.
 *
 * ONE context selector decides everything: an explicit coaching path → the
 * entitlement-based path-bound flow (no payment); the explicit
 * `Check libero a pagamento` option → the paid free-check flow (no Student, no
 * path, no coaching credits). The empty placeholder is never treated as a paid
 * choice — absence of a choice must not become a financial decision.
 *
 * The uploaded document + its validation state are mode-agnostic and are
 * preserved across context changes; only context-specific transient state is
 * cleared. Student/path is snapshotted only when `Avvia controllo` is accepted;
 * a free check never snapshots a Student/path.
 */
export function SottocheckPage() {
  const navigate = useNavigate();

  const [contextValue, setContextValue] = useState<string>('');

  // Shared, mode-agnostic — preserved across context changes.
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);

  // Path-bound transient state.
  const [pathCheckStatus, setPathCheckStatus] = useState<PathCheckStatus>('created');
  const [pathCompletedCheck, setPathCompletedCheck] = useState<CoachPathBoundCheck | null>(null);
  const [draftUsedCreditsByPath, setDraftUsedCreditsByPath] =
    useState<Record<string, number>>(MOCK_USED_CREDITS_BY_PATH);
  const pendingPathCheckRef = useRef<PendingPathCheck | null>(null);
  const hasCreatedPathCheckRef = useRef(false);

  // Free-check transient state.
  const [isPricing, setIsPricing] = useState(false);
  const [quote, setQuote] = useState<{ characterCount: number; price: number } | null>(null);
  const [freeStage, setFreeStage] = useState<FreeStage>('form');
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice>(null);
  const [freeIsProcessing, setFreeIsProcessing] = useState(false);
  const [freeCompletionError, setFreeCompletionError] = useState(false);
  const [freeCompletedCheck, setFreeCompletedCheck] = useState<CoachFreeCheck | null>(null);
  const pricingTimerRef = useRef<number | null>(null);
  const hasCreatedFreeCheckRef = useRef(false);
  const paymentReferenceRef = useRef<string | null>(null);
  const reportFailDemoRef = useRef(false);

  const eligibleTimelinePaths = MOCK_TIMELINE_PATHS.filter(path => path.planType === ELIGIBLE_PLAN);
  const selectedPath = eligibleTimelinePaths.find(path => path.id === contextValue) || null;
  const isFreeContext = contextValue === FREE_CHECK_CONTEXT;
  const isPathContext = Boolean(selectedPath);
  const hasContext = isFreeContext || isPathContext;

  const selectedPlanType = selectedPath?.planType;
  const isCoachingPlan = selectedPlanType === ELIGIBLE_PLAN;
  const draftUsedCredits = selectedPath ? (draftUsedCreditsByPath[selectedPath.id] ?? 0) : 0;
  const availableCredits = selectedPath ? Math.max(0, MAX_FREE_CHECK_CREDITS - draftUsedCredits) : 0;

  const canStartPathCheck = Boolean(selectedPath)
    && Boolean(selectedPath?.studentId)
    && document
    && documentStatus === 'valid'
    && pagesSelected > 0
    && isCoachingPlan
    && availableCredits > 0
    && pathCheckStatus !== 'processing';

  const canGoToPayment = isFreeContext && documentStatus === 'valid' && !!quote && !isPricing;

  const clearPricingTimer = () => {
    if (pricingTimerRef.current) {
      window.clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = null;
    }
  };

  const startPricing = () => {
    clearPricingTimer();
    setQuote(null);
    setIsPricing(true);
    pricingTimerRef.current = window.setTimeout(() => {
      setQuote({ characterCount: FREE_CHECK_DEMO_CHARACTER_COUNT, price: FREE_CHECK_DEMO_PRICE });
      setIsPricing(false);
      pricingTimerRef.current = null;
    }, 700);
  };

  // Context change: clear ONLY the other mode's transient/action state. The
  // uploaded document + validation state survive. Nothing is snapshotted here.
  const handleContextChange = (nextValue: string) => {
    setContextValue(nextValue);

    // Always drop free-mode payment + materialization state on any context change
    // so stale payment metadata can never reach a path-bound record.
    clearPricingTimer();
    setIsPricing(false);
    setQuote(null);
    setPaymentNotice(null);
    setFreeStage('form');
    setFreeIsProcessing(false);
    setFreeCompletionError(false);
    setFreeCompletedCheck(null);
    hasCreatedFreeCheckRef.current = false;
    paymentReferenceRef.current = null;
    reportFailDemoRef.current = false;

    // Always drop the pending path binding + execution state so stale Student/path
    // metadata can never reach a free record.
    pendingPathCheckRef.current = null;
    hasCreatedPathCheckRef.current = false;
    setPathCheckStatus('created');
    setPathCompletedCheck(null);

    // Entering the free context with a document already validated: re-derive the
    // quote from the existing document — no re-upload required.
    if (nextValue === FREE_CHECK_CONTEXT && documentStatus === 'valid') {
      startPricing();
    }
  };

  const handleFileSelected = (nextDocument: UploadedDocument, status: DocumentStatus) => {
    setDocument(nextDocument);
    setDocumentStatus(status);
    clearPricingTimer();
    setQuote(null);
    setIsPricing(false);

    if (status === 'valid') {
      setPagesSelected(Math.floor(Math.random() * 50) + 10);
      if (contextValue === FREE_CHECK_CONTEXT) {
        startPricing();
      }
    } else {
      setPagesSelected(0);
    }
  };

  const handleFileCleared = () => {
    clearPricingTimer();
    setDocument(null);
    setDocumentStatus('idle');
    setPagesSelected(0);
    setQuote(null);
    setIsPricing(false);
  };

  // Path-bound: materialize exactly one persistent check when processing starts.
  // Guarded against the StrictMode double-invoke; `createCoachPathBoundCheck`
  // also dedupes by `sourceExecutionReference`.
  useEffect(() => {
    if (pathCheckStatus !== 'processing' || pathCompletedCheck || hasCreatedPathCheckRef.current) {
      return;
    }
    const pending = pendingPathCheckRef.current;
    if (!pending) {
      return;
    }
    hasCreatedPathCheckRef.current = true;

    const check = createCoachPathBoundCheck({
      coachId: COACH_VIEW_COACH_ID,
      studentId: pending.studentId,
      studentName: pending.studentName,
      pathId: pending.pathId,
      pathLabel: pending.pathLabel,
      document: pending.document,
      creditsUsed: MOCK_CREDIT_COST_PER_CHECK,
      sourceExecutionReference: pending.executionReference,
    });

    if (check) {
      setPathCompletedCheck(check);
    } else {
      hasCreatedPathCheckRef.current = false;
      setPathCheckStatus('error');
    }
  }, [pathCheckStatus, pathCompletedCheck]);

  // Free: payment verified → materialize exactly one persistent free check. On
  // failure the paid state is kept (document / quote / payment reference intact)
  // and the recovery screen retries ONLY this materialization.
  useEffect(() => {
    if (
      !freeIsProcessing ||
      freeCompletedCheck ||
      hasCreatedFreeCheckRef.current ||
      !document ||
      !quote ||
      !paymentReferenceRef.current
    ) {
      return;
    }
    hasCreatedFreeCheckRef.current = true;

    if (isReportFailDemo() && !reportFailDemoRef.current) {
      reportFailDemoRef.current = true;
      setFreeCompletionError(true);
      setFreeIsProcessing(false);
      return;
    }

    const check = createCoachFreeCheck({
      coachId: COACH_VIEW_COACH_ID,
      document,
      characterCount: quote.characterCount,
      price: quote.price,
      sourcePaymentReference: paymentReferenceRef.current,
    });
    if (check) {
      setFreeCompletedCheck(check);
      return;
    }
    hasCreatedFreeCheckRef.current = false;
    setFreeCompletionError(true);
    setFreeIsProcessing(false);
  }, [freeCompletedCheck, document, freeIsProcessing, quote]);

  // Brief, neutral transition into the report — the work is effectively instant.
  useEffect(() => {
    const completed = pathCompletedCheck || freeCompletedCheck;
    if (!completed) {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate(`/coach-view/report/${completed.id}`);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [pathCompletedCheck, freeCompletedCheck, navigate]);

  const handleStartPathCheck = () => {
    if (!canStartPathCheck || !selectedPath || !selectedPath.studentId || !document) {
      return;
    }

    setDraftUsedCreditsByPath(prev => ({
      ...prev,
      [selectedPath.id]: Math.min(MAX_FREE_CHECK_CREDITS, (prev[selectedPath.id] ?? 0) + MOCK_CREDIT_COST_PER_CHECK),
    }));

    // Student/path snapshotted ONLY here, on an accepted action.
    pendingPathCheckRef.current = {
      studentId: selectedPath.studentId,
      studentName: selectedPath.studentName,
      pathId: selectedPath.id,
      pathLabel: selectedPath.timelineLabel,
      document,
      executionReference: createCoachExecutionReference(),
    };
    hasCreatedPathCheckRef.current = false;
    setPathCheckStatus('processing');
  };

  const handleRetryPathCheck = () => {
    if (!pendingPathCheckRef.current) {
      setPathCheckStatus('created');
      return;
    }
    hasCreatedPathCheckRef.current = false;
    setPathCheckStatus('processing');
  };

  // Retry the free-check materialization only: no gateway, no new payment, no
  // pricing change. Idempotent — `createCoachFreeCheck` dedupes by
  // `sourcePaymentReference`.
  const handleRetryFreeReportCreation = () => {
    if (freeCompletedCheck || !document || !quote || !paymentReferenceRef.current) return;

    const check = createCoachFreeCheck({
      coachId: COACH_VIEW_COACH_ID,
      document,
      characterCount: quote.characterCount,
      price: quote.price,
      sourcePaymentReference: paymentReferenceRef.current,
    });
    if (!check) {
      setFreeCompletionError(true);
      return;
    }

    hasCreatedFreeCheckRef.current = true;
    setFreeCompletionError(false);
    setFreeIsProcessing(true);
    setFreeCompletedCheck(check);
  };

  if (pathCheckStatus === 'processing') {
    return (
      <div className="py-[32px]">
        <div className="mb-8">
          <h1
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h1)',
              fontWeight: 'var(--font-weight-bold)',
              lineHeight: 1.5,
              color: 'var(--foreground)',
            }}
          >
            TesiCheck – Verifica plagio
          </h1>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            {selectedPath
              ? `Percorso: ${selectedPath.studentName} · ${selectedPath.timelineLabel}`
              : 'Controllo in corso'}
          </p>
        </div>

        <section
          className="mx-auto flex max-w-[620px] items-start gap-4 border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <Loader2 className="mt-1 h-6 w-6 shrink-0 animate-spin text-[var(--primary)]" aria-hidden="true" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
              Stiamo preparando il report
            </h2>
            <p
              className="mt-2 text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
            >
              Tra pochi istanti verrai portato al report del controllo.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (pathCheckStatus === 'error') {
    return (
      <div className="py-[32px]">
        <section
          className="mx-auto max-w-[620px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-[var(--destructive)]" aria-hidden="true" />
            <div>
              <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
                Non siamo riusciti ad avviare il controllo
              </h1>
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
              >
                Puoi riprovare: nessun credito aggiuntivo viene consumato.
              </p>
            </div>
          </div>
          <SottocheckActionButton className="mt-6" onClick={handleRetryPathCheck}>
            Riprova
          </SottocheckActionButton>
        </section>
      </div>
    );
  }

  if (freeIsProcessing) {
    return (
      <div className="py-[32px]">
        <section
          className="mx-auto flex max-w-[620px] items-start gap-4 border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <div>
            <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
              Pagamento ricevuto
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)' }}>
              Stiamo generando il report...
            </p>
          </div>
          <Loader2 className="ml-auto h-5 w-5 shrink-0 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
        </section>
      </div>
    );
  }

  if (freeCompletionError) {
    return (
      <div className="py-[32px]">
        <section
          className="mx-auto max-w-[620px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
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
          <SottocheckActionButton className="mt-6" onClick={handleRetryFreeReportCreation}>
            Riprova a generare il report
          </SottocheckActionButton>
        </section>
      </div>
    );
  }

  const showFreePaymentPanel = isFreeContext && freeStage === 'payment' && quote && document;
  const showFreeGateway = isFreeContext && freeStage === 'redirecting' && quote && document;

  return (
    <div className="py-[32px]">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          TesiCheck – Verifica plagio
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Scegli il contesto, carica il documento e avvia il controllo.
        </p>
      </div>

      {showFreePaymentPanel ? (
        <CoachFreePaymentPanel
          document={document!}
          quote={quote!}
          notice={paymentNotice}
          onPay={() => {
            setPaymentNotice(null);
            setFreeStage('redirecting');
          }}
        />
      ) : showFreeGateway ? (
        <section
          className="max-w-[760px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <SottocheckPaymentGatewayBoundary
            onCancelled={() => {
              setPaymentNotice('cancelled');
              setFreeStage('payment');
            }}
            onFailed={() => {
              setPaymentNotice('failed');
              setFreeStage('payment');
            }}
            onSuccess={() => {
              if (!paymentReferenceRef.current) {
                paymentReferenceRef.current = createCoachFreePaymentReference();
              }
              setFreeIsProcessing(true);
            }}
          />
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          <CoachStepCard
            number="1"
            title="Contesto del check"
            description="Seleziona un percorso per utilizzare i crediti TesiCheck associati. Per un documento non legato a uno studente o percorso, scegli Check libero a pagamento."
          >
            <select
              aria-label="Percorso del check"
              value={contextValue}
              onChange={(e) => handleContextChange(e.target.value)}
              className="mt-4 w-full h-[44px] px-[12px] border border-[var(--border)] bg-[var(--card)]"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">Seleziona un percorso o fai un Check libero…</option>
              <optgroup label="Percorsi coaching">
                {eligibleTimelinePaths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {`${path.studentName} — ${path.timelineLabel}`}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Altro">
                <option value={FREE_CHECK_CONTEXT}>Check libero a pagamento</option>
              </optgroup>
            </select>

            {!hasContext && (
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)' }}
              >
                Nessun contesto selezionato: scegli un percorso o Check libero a pagamento per continuare.
              </p>
            )}

            {selectedPath && (
              <div
                className="mt-3 p-3"
                style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                  {`${selectedPath.studentName} · ${selectedPath.timelineLabel}`}
                </p>
                <p className="mt-1" style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                  Percorso coaching · Piano {PLAN_LABELS[selectedPath.planType]} · usa l'entitlement del percorso, senza pagamento.
                </p>
              </div>
            )}

            {isFreeContext && (
              <div
                className="mt-3 p-3"
                style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)' }}
              >
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                  Check libero a pagamento
                </p>
                <p className="mt-1" style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                  Controllo indipendente, non associato a uno studente o a un percorso. Nessun credito coaching.
                </p>
              </div>
            )}
          </CoachStepCard>

          <CoachStepCard
            number="2"
            title="Carica documento"
            description="Formati supportati: PDF e DOCX · Dimensione massima 50MB."
          >
            <div className="mt-4">
              <SottocheckUploadForm
                onFileSelected={handleFileSelected}
                onStatusChange={setDocumentStatus}
                onFileCleared={handleFileCleared}
                showHeading={false}
              />
            </div>
          </CoachStepCard>

          {!hasContext && (
            <CoachStepCard
              number="3"
              title="Avvia il controllo"
              description="Scegli un percorso o il Check libero a pagamento per continuare."
            >
              <p
                className="mt-4 text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)' }}
              >
                Dopo aver scelto il contesto e caricato un documento valido potrai avviare il controllo.
              </p>
            </CoachStepCard>
          )}

          {isPathContext && (
            <CoachStepCard
              number="3"
              title="Conferma e avvia controllo"
              description="Il TesiCheck su percorso coaching usa l'entitlement del percorso, senza pagamento."
            >
              <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}
                    >
                      Disponibilità crediti
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}
                    >
                      {availableCredits > 0 ? 'Disponibile' : 'Non sufficiente'}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)' }}
                    >
                      Lo stato dei crediti del percorso viene verificato automaticamente.
                    </p>
                  </div>

                  <SottocheckActionButton
                    onClick={handleStartPathCheck}
                    disabled={!canStartPathCheck}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Avvia controllo
                  </SottocheckActionButton>
                </div>
              </div>

              <p
                className="mt-3"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}
              >
                {isCoachingPlan
                  ? 'Piano idoneo al TesiCheck su percorso coaching.'
                  : 'Il TesiCheck su percorso coaching è disponibile solo per piani Coaching.'}
              </p>

              {!canStartPathCheck && (
                <p
                  className="mt-3 text-[var(--chart-3)]"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}
                >
                  {!selectedPath?.studentId
                    ? 'Questo percorso non è ancora collegato a uno studente valido per il controllo.'
                    : !document || documentStatus !== 'valid'
                      ? 'Carica prima un documento valido per avviare il controllo.'
                      : !isCoachingPlan
                        ? 'Questo piano non include l’accesso al TesiCheck.'
                        : 'I crediti TesiCheck disponibili per questo percorso non sono sufficienti per avviare un nuovo controllo.'}
                </p>
              )}
            </CoachStepCard>
          )}

          {isFreeContext && (
            <CoachStepCard
              number="3"
              title="Conferma e pagamento"
              description="Il check libero è un controllo a pagamento, indipendente dai percorsi coaching."
            >
              <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <SottocheckPricingPreview
                    isLoading={isPricing}
                    isUpdated={!!quote}
                    characterCount={quote?.characterCount}
                    price={quote?.price}
                  />
                  <SottocheckActionButton
                    onClick={() => setFreeStage('payment')}
                    disabled={!canGoToPayment}
                    icon={<CreditCard className="h-4 w-4" />}
                  >
                    Vai al pagamento
                  </SottocheckActionButton>
                </div>
              </div>
              {!canGoToPayment && (
                <p className="mt-3 text-[var(--warning)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
                  Carica un documento valido per visualizzare il prezzo e procedere.
                </p>
              )}
            </CoachStepCard>
          )}
        </div>
      )}
    </div>
  );
}

function CoachStepCard({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] p-6" style={{ borderRadius: 'var(--radius)' }}>
      <div className="flex gap-4">
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--background)] bg-[var(--primary)]"
          style={{ borderRadius: '50%' }}
        >
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
            {number}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}
          >
            {description}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

function CoachFreePaymentPanel({
  document,
  quote,
  notice,
  onPay,
}: {
  document: UploadedDocument;
  quote: { characterCount: number; price: number };
  notice: PaymentNotice;
  onPay: () => void;
}) {
  return (
    <section
      className="max-w-[760px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
      style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
    >
      <p
        className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}
      >
        Check libero
      </p>
      <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Completa il pagamento
      </h2>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Verrai reindirizzato a un provider di pagamento esterno per completare la transazione.
      </p>
      <div className="mt-6 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>{document.name}</p>
        <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
          {quote.characterCount.toLocaleString('it-IT')} caratteri · {formatCheckoutPrice(quote.price)}
        </p>
      </div>
      {notice === 'failed' && (
        <div className="mt-5 border border-[var(--destructive)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Pagamento non riuscito</p>
          <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
            Il riepilogo è stato conservato. Puoi riprovare quando vuoi.
          </p>
        </div>
      )}
      {notice === 'cancelled' && (
        <div className="mt-5 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>Pagamento annullato</p>
          <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
            Nessun pagamento è stato effettuato. Puoi riprendere il checkout.
          </p>
        </div>
      )}
      <SottocheckActionButton className="mt-6" onClick={onPay} icon={<CreditCard className="h-4 w-4" />}>
        {notice === 'failed' ? 'Riprova pagamento' : 'Vai al pagamento'}
      </SottocheckActionButton>
    </section>
  );
}
