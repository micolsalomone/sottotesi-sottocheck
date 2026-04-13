import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  FileText,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { getViewBasePath } from './viewBasePath';

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

interface UploadedDocument {
  name: string;
  size: number;
  pages: number;
  format: string;
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
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [draftUsedCreditsByPath, setDraftUsedCreditsByPath] = useState<Record<string, number>>(MOCK_USED_CREDITS_BY_PATH);

  const eligibleTimelinePaths = MOCK_TIMELINE_PATHS.filter(path => path.planType === ELIGIBLE_PLAN);
  const selectedPath = eligibleTimelinePaths.find(path => path.id === selectedPathId) || null;
  const selectedPlanType = selectedPath?.planType;
  const draftUsedCredits = selectedPath ? (draftUsedCreditsByPath[selectedPath.id] ?? 0) : 0;

  const isCoachingPlan = selectedPlanType === ELIGIBLE_PLAN;
  const availableCredits = selectedPath ? Math.max(0, MAX_FREE_CHECK_CREDITS - draftUsedCredits) : 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const validFormats = ['pdf', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValid = validFormats.includes(extension);

    const mockPages = Math.floor(Math.random() * 50) + 10;

    setDocument({
      name: file.name,
      size: file.size,
      pages: mockPages,
      format: extension.toUpperCase(),
    });

    setDocumentStatus(isValid ? 'valid' : 'invalid');

    if (isValid) {
      setPagesSelected(mockPages);
    }
  };

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
            <>
              <div
                className="w-[92px] h-[92px] mx-auto mb-6 flex items-center justify-center"
                style={{ borderRadius: '50%', background: 'rgba(11,182,63,0.10)' }}
              >
                <CheckCircle className="w-12 h-12 text-[var(--primary)]" />
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
                Controllo completato
              </h3>
              <p
                className="mb-6 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il report di verifica plagio è pronto
              </p>
              <button
                onClick={() => navigate(`${viewBasePath}/archivio`)}
                className="w-full px-[24px] py-[12px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Vai allo storico Sottocheck
              </button>
            </>
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
              ) : !document ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="mt-4 p-8 text-center"
                  style={{
                    borderRadius: 'var(--radius)',
                    border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                    background: isDragging ? 'rgba(11,182,63,0.06)' : 'var(--background)',
                  }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[var(--muted)]"
                    style={{ borderRadius: '50%' }}
                  >
                    <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                  </div>
                  <p
                    className="text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    Trascina qui il documento o
                  </p>
                  <label
                    className="inline-block mt-1 text-[var(--primary)] hover:opacity-80 cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    seleziona dal computer
                  </label>
                  <p
                    className="mt-2 text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    PDF o DOCX (max 50MB)
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="flex items-start gap-4">
                      <FileText className="w-5 h-5 text-[var(--muted-foreground)] shrink-0 mt-[2px]" />
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-[var(--foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          {document.name}
                        </p>
                        <p
                          className="text-[var(--muted-foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-regular)',
                          }}
                        >
                          {(document.size / 1024 / 1024).toFixed(2)} MB • {document.pages} pagine rilevate
                        </p>
                      </div>
                      {documentStatus === 'valid' && <CheckCircle className="w-5 h-5 text-[var(--primary)] shrink-0" />}
                      {documentStatus === 'invalid' && <XCircle className="w-5 h-5 text-[var(--destructive-foreground)] shrink-0" />}
                    </div>
                  </div>

                  {documentStatus === 'valid' && (
                    <div
                      className="p-3"
                      style={{
                        borderRadius: 'var(--radius)',
                        border: '1px solid rgba(11,182,63,0.25)',
                        background: 'rgba(11,182,63,0.08)',
                      }}
                    >
                      <div className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--primary)] shrink-0 mt-[2px]" />
                        <p
                          className="text-[var(--foreground)]"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-regular)',
                          }}
                        >
                          Formato valido – Puoi procedere
                        </p>
                      </div>
                    </div>
                  )}

                  {documentStatus === 'invalid' && (
                    <div
                      className="p-4"
                      style={{
                        borderRadius: 'var(--radius)',
                        border: '1px solid rgba(220,38,38,0.25)',
                        background: 'rgba(220,38,38,0.08)',
                      }}
                    >
                      <div className="flex gap-2">
                        <XCircle className="w-4 h-4 text-[var(--destructive-foreground)] shrink-0 mt-[2px]" />
                        <div>
                          <p
                            className="text-[var(--foreground)]"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-medium)',
                            }}
                          >
                            Formato non valido
                          </p>
                          <p
                            className="mt-1 text-[var(--muted-foreground)]"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-regular)',
                            }}
                          >
                            Il file caricato non è in un formato supportato. Carica un file PDF o DOCX.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setDocument(null);
                      setDocumentStatus('idle');
                      setPagesSelected(0);
                    }}
                    className="self-start px-4 py-2 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Cambia documento
                  </button>
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
                Il Sottocheck è disponibile solo per piani Coaching.
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
                      Crediti disponibili
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h2)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {availableCredits}/{MAX_FREE_CHECK_CREDITS}
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
                        ? `Bozza prototipo: usati ${draftUsedCredits} crediti · costo esempio ${MOCK_CREDIT_COST_PER_CHECK} crediti/check`
                        : 'Seleziona un percorso per vedere i crediti associati'}
                    </p>
                  </div>

                  <button
                    onClick={handleStartCheck}
                    disabled={!canStartCheck}
                    className={`inline-flex items-center gap-2 px-6 py-3 transition-opacity ${
                      canStartCheck
                        ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 cursor-pointer'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                    }`}
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Avvia controllo
                    </>
                  </button>
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
                  ? 'Piano idoneo ai check liberi.'
                  : 'I check liberi sono disponibili solo per piani Coaching.'}
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
                        ? 'Questo piano non ha accesso ai check liberi.'
                        : 'Crediti esauriti: il limite prototipo di 100 crediti è stato raggiunto.'}
                </p>
              )}

              <p
                className="mt-2"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Nota prototipo: conteggio crediti in bozza, non ancora collegato al consumo reale per singola timeline/pagina.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
