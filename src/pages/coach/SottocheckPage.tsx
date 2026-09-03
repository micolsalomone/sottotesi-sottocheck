import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { COACH_VIEW_COACH_ID } from '@/app/utils/coachView';
import {
  createCoachExecutionReference,
  createCoachPathBoundCheck,
  type CoachPathBoundCheck,
} from '@/app/data/tesicheckCoachCheck';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type CheckStatus = 'created' | 'processing' | 'error';
type PlanType = 'starter_pack' | 'coaching' | 'coaching_plus';

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

interface PendingCoachCheck {
  studentId: string;
  studentName: string;
  pathId: string;
  pathLabel: string;
  document: UploadedDocument;
  executionReference: string;
}

export function SottocheckPage() {
  const navigate = useNavigate();

  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');
  const [completedCheck, setCompletedCheck] = useState<CoachPathBoundCheck | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  // Quota mock: kept internal only, to decide `canStartCheck`. Never surfaced as a
  // number — the Coach must not see remaining / total / cumulative-used credits.
  const [draftUsedCreditsByPath, setDraftUsedCreditsByPath] = useState<Record<string, number>>(MOCK_USED_CREDITS_BY_PATH);

  const pendingCheckRef = useRef<PendingCoachCheck | null>(null);
  const hasCreatedCheckRef = useRef(false);

  const eligibleTimelinePaths = MOCK_TIMELINE_PATHS.filter(path => path.planType === ELIGIBLE_PLAN);
  const selectedPath = eligibleTimelinePaths.find(path => path.id === selectedPathId) || null;
  const selectedPlanType = selectedPath?.planType;
  const draftUsedCredits = selectedPath ? (draftUsedCreditsByPath[selectedPath.id] ?? 0) : 0;

  const isCoachingPlan = selectedPlanType === ELIGIBLE_PLAN;
  const availableCredits = selectedPath ? Math.max(0, MAX_FREE_CHECK_CREDITS - draftUsedCredits) : 0;

  const canStartCheck = Boolean(selectedPath)
    && Boolean(selectedPath?.studentId)
    && document
    && documentStatus === 'valid'
    && pagesSelected > 0
    && isCoachingPlan
    && availableCredits > 0
    && checkStatus !== 'processing';

  // Materialize exactly one persistent Coach check when processing starts.
  // Guarded against the StrictMode double-invoke; `createCoachPathBoundCheck`
  // also dedupes by `sourceExecutionReference`.
  useEffect(() => {
    if (checkStatus !== 'processing' || completedCheck || hasCreatedCheckRef.current) {
      return;
    }
    const pending = pendingCheckRef.current;
    if (!pending) {
      return;
    }
    hasCreatedCheckRef.current = true;

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
      setCompletedCheck(check);
    } else {
      hasCreatedCheckRef.current = false;
      setCheckStatus('error');
    }
  }, [checkStatus, completedCheck]);

  // Brief, neutral transition into the report — the work is effectively instant.
  useEffect(() => {
    if (!completedCheck) {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate(`/coach-view/report/${completedCheck.id}`);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [completedCheck, navigate]);

  const handleStartCheck = () => {
    if (!canStartCheck || !selectedPath || !selectedPath.studentId || !document) {
      return;
    }

    setDraftUsedCreditsByPath(prev => ({
      ...prev,
      [selectedPath.id]: Math.min(MAX_FREE_CHECK_CREDITS, (prev[selectedPath.id] ?? 0) + MOCK_CREDIT_COST_PER_CHECK),
    }));

    pendingCheckRef.current = {
      studentId: selectedPath.studentId,
      studentName: selectedPath.studentName,
      pathId: selectedPath.id,
      pathLabel: selectedPath.timelineLabel,
      document,
      executionReference: createCoachExecutionReference(),
    };
    hasCreatedCheckRef.current = false;
    setCheckStatus('processing');
  };

  const handleRetry = () => {
    if (!pendingCheckRef.current) {
      setCheckStatus('created');
      return;
    }
    hasCreatedCheckRef.current = false;
    setCheckStatus('processing');
  };

  if (checkStatus === 'processing') {
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

  if (checkStatus === 'error') {
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
          <SottocheckActionButton className="mt-6" onClick={handleRetry}>
            Riprova
          </SottocheckActionButton>
        </section>
      </div>
    );
  }

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
          Seleziona percorso, carica documento e avvia il controllo
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] p-6" style={{ borderRadius: 'var(--radius)' }}>
          <div className="flex gap-4">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--background)] bg-[var(--primary)]" style={{ borderRadius: '50%' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                1
              </span>
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Seleziona percorso
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il TesiCheck è disponibile solo per servizi Coaching. Seleziona prima un percorso idoneo.
              </p>

              <select
                value={selectedPathId}
                onChange={(e) => {
                  setSelectedPathId(e.target.value);
                  setDocument(null);
                  setDocumentStatus('idle');
                  setPagesSelected(0);
                  setCheckStatus('created');
                }}
                className="mt-4 w-full h-[44px] px-[12px] border border-[var(--border)] bg-[var(--card)]"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--foreground)',
                }}
              >
                <option value="">Seleziona una lavorazione/timeline...</option>
                {eligibleTimelinePaths.map((path) => (
                  <option key={path.id} value={path.id}>
                    {`${path.studentName} · ID ${path.id} · ${path.serviceName} · ${path.timelineLabel}`}
                  </option>
                ))}
              </select>

              {!selectedPath && (
                <p
                  className="mt-2 text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  Seleziona prima una lavorazione/timeline per attivare il caricamento del documento.
                </p>
              )}

              {selectedPath && (
                <div
                  className="mt-3 p-3"
                  style={{
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--background)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                    {`${selectedPath.studentName} · ID ${selectedPath.id} · ${selectedPath.timelineLabel}`}
                  </p>
                  <p className="mt-1" style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                    Piano: {PLAN_LABELS[selectedPath.planType]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] p-6" style={{ borderRadius: 'var(--radius)' }}>
          <div className="flex gap-4">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--background)] bg-[var(--primary)]" style={{ borderRadius: '50%' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                2
              </span>
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Carica documento
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Formati supportati: PDF e DOCX
              </p>
              <p
                className="mt-2 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Dimensione massima file: 50MB
              </p>

              {!selectedPath ? (
                <div
                  className="mt-4 p-4"
                  style={{
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(247,144,9,0.35)',
                    background: 'rgba(247,144,9,0.08)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                    Seleziona prima una lavorazione/timeline
                  </p>
                  <p className="mt-1" style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)' }}>
                    Il controllo e i crediti vengono calcolati sul percorso selezionato.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <SottocheckUploadForm
                    key={selectedPath.id}
                    onFileSelected={setDocument}
                    onStatusChange={(status) => {
                      setDocumentStatus(status);
                      if (status === 'valid') {
                        setPagesSelected(Math.floor(Math.random() * 50) + 10);
                      } else {
                        setPagesSelected(0);
                      }
                    }}
                    onFileCleared={() => {
                      setDocument(null);
                      setPagesSelected(0);
                    }}
                    showHeading={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] p-6" style={{ borderRadius: 'var(--radius)' }}>
          <div className="flex gap-4">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center text-[var(--background)] bg-[var(--primary)]" style={{ borderRadius: '50%' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                3
              </span>
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Conferma e avvia controllo
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il TesiCheck su percorso coaching usa l'entitlement del percorso, senza pagamento.
              </p>

              <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      Disponibilità crediti
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h2)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {!selectedPath ? 'Percorso non selezionato' : availableCredits > 0 ? 'Disponibile' : 'Non sufficiente'}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {selectedPath
                        ? 'Lo stato dei crediti del percorso viene verificato automaticamente.'
                        : 'Seleziona una lavorazione per verificare lo stato dei crediti.'}
                    </p>
                  </div>

                  <SottocheckActionButton
                    onClick={handleStartCheck}
                    disabled={!canStartCheck}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Avvia controllo
                  </SottocheckActionButton>
                </div>
              </div>

              <p
                className="mt-3"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {isCoachingPlan
                  ? 'Piano idoneo al TesiCheck su percorso coaching.'
                  : 'Il TesiCheck su percorso coaching è disponibile solo per piani Coaching.'}
              </p>

              {!canStartCheck && (
                <p
                  className="mt-3 text-[var(--chart-3)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  {!selectedPath
                    ? 'Seleziona prima una lavorazione/timeline.'
                    : !selectedPath.studentId
                      ? 'Questo percorso non è ancora collegato a uno studente valido per il controllo.'
                      : !document || documentStatus !== 'valid'
                        ? 'Carica prima un documento valido per avviare il controllo.'
                        : !isCoachingPlan
                          ? 'Questo piano non include l’accesso al TesiCheck.'
                          : 'I crediti TesiCheck disponibili per questo percorso non sono sufficienti per avviare un nuovo controllo.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
