import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  CheckCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { getViewBasePath } from './viewBasePath';
import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SottocheckSuccessPanel } from '@/app/components/SottocheckSuccessPanel';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type CheckStatus = 'created' | 'processing' | 'completed' | 'error';
type PlanType = 'starter_pack' | 'coaching' | 'coaching_plus';

interface TimelinePath {
  id: string;
  studentName: string;
  serviceName: string;
  timelineLabel: string;
  planType: PlanType;
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

export function SottocheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewBasePath = getViewBasePath(location.pathname);

  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [draftUsedCreditsByPath, setDraftUsedCreditsByPath] = useState<Record<string, number>>(MOCK_USED_CREDITS_BY_PATH);

  const eligibleTimelinePaths = MOCK_TIMELINE_PATHS.filter(path => path.planType === ELIGIBLE_PLAN);
  const selectedPath = eligibleTimelinePaths.find(path => path.id === selectedPathId) || null;
  const selectedPlanType = selectedPath?.planType;
  const draftUsedCredits = selectedPath ? (draftUsedCreditsByPath[selectedPath.id] ?? 0) : 0;

  const isCoachingPlan = selectedPlanType === ELIGIBLE_PLAN;
  const availableCredits = selectedPath ? Math.max(0, MAX_FREE_CHECK_CREDITS - draftUsedCredits) : 0;

  const handleStartCheck = () => {
    if (!selectedPath || !document || documentStatus !== 'valid' || pagesSelected <= 0 || !isCoachingPlan || availableCredits <= 0) {
      return;
    }

    setDraftUsedCreditsByPath(prev => ({
      ...prev,
      [selectedPath.id]: Math.min(MAX_FREE_CHECK_CREDITS, (prev[selectedPath.id] ?? 0) + MOCK_CREDIT_COST_PER_CHECK),
    }));
    setCheckStatus('processing');

    setTimeout(() => {
      setCheckStatus('completed');
    }, 3000);
  };

  const canStartCheck = Boolean(selectedPath) && document && documentStatus === 'valid' && pagesSelected > 0 && isCoachingPlan && availableCredits > 0 && checkStatus !== 'processing';

  if (checkStatus === 'processing' || checkStatus === 'completed') {
    return (
      <div className="px-[40px] py-[32px]">
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
            Sottocheck – Verifica plagio
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
              : 'Il controllo è in corso'}
          </p>
        </div>

        <div
          className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[44px] text-center"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {checkStatus === 'processing' ? (
            <>
              <div
                className="w-[92px] h-[92px] mx-auto mb-6 flex items-center justify-center"
                style={{ borderRadius: '50%', background: 'rgba(11,182,63,0.10)' }}
              >
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
              </div>
              <h3
                className="mb-2"
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Controllo in elaborazione
              </h3>
              <p
                className="mb-6 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il controllo richiede alcuni minuti. Riceverai una notifica al completamento.
              </p>
              <Progress value={60} className="w-full" />
            </>
          ) : (
            <SottocheckSuccessPanel
              description="Il report di verifica plagio è pronto per questa lavorazione."
              primaryActionLabel="Visualizza il report"
              onPrimaryAction={() => navigate(`${viewBasePath}/output-preview`)}
              secondaryActionLabel="Vai allo storico Sottocheck"
              onSecondaryAction={() => navigate(`${viewBasePath}/archivio`)}
              footerNote="Il report è disponibile nello storico della vista coach."
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-[40px] py-[32px]">
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
          Sottocheck – Verifica plagio
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
                Il Sottocheck è disponibile solo per servizi Coaching. Seleziona prima un percorso idoneo.
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
                    {`${path.studentName} · ${path.serviceName} · ${path.timelineLabel}`}
                  </option>
                ))}
              </select>

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
                    {`${selectedPath.studentName} · ${selectedPath.timelineLabel}`}
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
                Il Sottocheck gratuito è disponibile solo per piani Coaching.
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
                      {!selectedPath ? 'Percorso non selezionato' : availableCredits > 0 ? 'Disponibile' : 'Esaurita'}
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
                        ? 'Dettaglio numerico visibile solo in caso di crediti insufficienti.'
                        : 'Seleziona una lavorazione per verificare lo stato crediti'}
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
                  ? 'Piano idoneo al Sottocheck incluso.'
                  : 'Il Sottocheck incluso è disponibile solo per piani Coaching.'}
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
                    : !document || documentStatus !== 'valid'
                      ? 'Carica prima un documento valido per avviare il controllo.'
                      : !isCoachingPlan
                        ? 'Questo piano non include l’accesso al Sottocheck.'
                        : `Crediti insufficienti su questa timeline: disponibili ${availableCredits}, utilizzati ${draftUsedCredits} su ${MAX_FREE_CHECK_CREDITS}.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
