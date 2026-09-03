import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SottocheckSuccessPanel } from '@/app/components/SottocheckSuccessPanel';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type CheckStatus = 'created' | 'processing' | 'completed';

const MOCK_CREDIT_COST_PER_CHECK = 8;
const ADMIN_SOTTOCHECK_STORAGE_KEY = 'admin-sottocheck-jobs-v1';
const CURRENT_ADMIN = 'Francesca';

type PersistedAdminCheck = {
  id: string;
  admin_name: string;
  student: string;
  student_id: string;
  service_id?: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  startedAt: string;
  completedAt: string | null;
  document_name?: string;
  characters: number;
  pages: number;
  copyleaks_credits: number;
  report?: {
    id: string;
    similarityPercentage: number;
    plagiarismDetected: boolean;
    aiDetectionPercentage: number;
    generatedAt: string;
    pdfUrl: string;
  };
  notes?: Array<{ id: string; content: string; admin: string; timestamp: string }>;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
};

const toDateTimeLabel = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

const getStoredAdminChecks = (): PersistedAdminCheck[] => {
  try {
    const raw = localStorage.getItem(ADMIN_SOTTOCHECK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedAdminCheck[]) : [];
  } catch {
    return [];
  }
};

export function SottocheckAdminPage() {
  const navigate = useNavigate();
  const { data: serviziStudenti, students } = useLavorazioni();

  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');
  const [usedCredits, setUsedCredits] = useState<number>(0);
  const [totalConsumedCredits, setTotalConsumedCredits] = useState<number>(() =>
    getStoredAdminChecks().reduce((sum, job) => sum + (job.copyleaks_credits || 0), 0)
  );
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const studentOptions = useMemo(() => {
    const unique = new Map<string, string>();
    serviziStudenti.forEach(service => {
      if (!unique.has(service.student_id)) {
        unique.set(service.student_id, service.student_name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [serviziStudenti]);

  const selectedStudentName = studentOptions.find(student => student.id === selectedStudentId)?.name || '';

  const serviceOptions = useMemo(
    () => serviziStudenti.filter(service => service.student_id === selectedStudentId),
    [serviziStudenti, selectedStudentId]
  );

  useEffect(() => {
    if (!selectedServiceId) return;
    const stillAvailable = serviceOptions.some(service => service.id === selectedServiceId);
    if (!stillAvailable) {
      setSelectedServiceId('');
    }
  }, [selectedServiceId, serviceOptions]);

  const handleStartCheck = () => {
    if (!selectedStudentId || !selectedServiceId || !document || documentStatus !== 'valid' || pagesSelected <= 0) {
      return;
    }

    const now = new Date();
    const existing = getStoredAdminChecks();

    const newId = `ADM-CHK-${Date.now().toString().slice(-6)}`;
    const selectedService = serviziStudenti.find(service => service.id === selectedServiceId);
    const selectedStudent = students.find(student => student.id === selectedStudentId);

    const nextJob: PersistedAdminCheck = {
      id: newId,
      admin_name: CURRENT_ADMIN,
      student: selectedStudentName || selectedStudent?.name || selectedService?.student_name || 'Studente',
      student_id: selectedStudentId,
      service_id: selectedServiceId,
      status: 'running',
      startedAt: toDateTimeLabel(now),
      completedAt: null,
      document_name: document.name,
      characters: pagesSelected * 2500,
      pages: pagesSelected,
      copyleaks_credits: MOCK_CREDIT_COST_PER_CHECK,
      notes: [],
      created_by: CURRENT_ADMIN,
      created_at: now.toISOString(),
      updated_by: CURRENT_ADMIN,
      updated_at: now.toISOString(),
    };

    try {
      const updatedJobs = [nextJob, ...existing];
      localStorage.setItem(ADMIN_SOTTOCHECK_STORAGE_KEY, JSON.stringify(updatedJobs));
      setTotalConsumedCredits(updatedJobs.reduce((sum, job) => sum + (job.copyleaks_credits || 0), 0));
    } catch {
      // Ignore localStorage errors.
    }

    setUsedCredits(prev => prev + MOCK_CREDIT_COST_PER_CHECK);
    setRunningJobId(newId);
    setCheckStatus('processing');

    setTimeout(() => {
      try {
        const raw = localStorage.getItem(ADMIN_SOTTOCHECK_STORAGE_KEY);
        const items: PersistedAdminCheck[] = raw ? JSON.parse(raw) : [];
        const updated = items.map(job => {
          if (job.id !== newId) return job;
          const completedAt = toDateTimeLabel(new Date());
          return {
            ...job,
            status: 'completed' as const,
            completedAt,
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString(),
            report: {
              id: `REP-${newId.replace('ADM-CHK-', '')}`,
              similarityPercentage: 14.2,
              plagiarismDetected: false,
              aiDetectionPercentage: 6.8,
              generatedAt: completedAt.slice(0, 10),
              pdfUrl: `/reports/${newId}.pdf`,
            },
          };
        });
        localStorage.setItem(ADMIN_SOTTOCHECK_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors.
      }
      setCheckStatus('completed');
    }, 3000);
  };

  const canStartCheck = Boolean(selectedStudentId) && Boolean(selectedServiceId) && Boolean(document) && documentStatus === 'valid' && pagesSelected > 0 && checkStatus !== 'processing';

  if (checkStatus === 'processing' || checkStatus === 'completed') {
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
            Sottocheck Admin - Verifica plagio
          </h1>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            {checkStatus === 'processing'
              ? `Controllo in corso per ${selectedStudentName || 'studente selezionato'}`
              : `Controllo completato${runningJobId ? ` (${runningJobId})` : ''}`}
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
                Il report sara disponibile nello storico lavorazioni Sottocheck.
              </p>
              <Progress value={60} className="w-full" />
            </>
          ) : (
            <SottocheckSuccessPanel
              description="Il report è stato generato correttamente e associato alla lavorazione selezionata."
              primaryActionLabel="Visualizza il report"
              onPrimaryAction={() => navigate('/sottocheck/output-preview')}
              secondaryActionLabel="Vai a Lavorazioni sottocheck"
              onSecondaryAction={() => navigate('/sottocheck/lavorazioni')}
              footerNote="Il report è tracciato nello storico Sottocheck amministrativo."
            />
          )}
        </div>
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
          Sottocheck Admin - Verifica plagio
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Carica documento e avvia il controllo senza limitazioni di crediti
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
                Seleziona studente e lavorazione
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il check admin viene correlato a una lavorazione di Servizi Studenti.
              </p>

              <div className="mt-4" style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Studente
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setSelectedServiceId('');
                    }}
                    className="mt-2 w-full h-[40px] px-[10px] border border-[var(--border)] bg-[var(--card)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <option value="">Seleziona studente...</option>
                    {studentOptions.map(student => (
                      <option key={student.id} value={student.id}>{`${student.name} · ID ${student.id}`}</option>
                    ))}
                  </select>
                  <p
                    className="mt-2 text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    Dopo aver selezionato lo studente si attiva il menu della lavorazione.
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Lavorazione
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    disabled={!selectedStudentId}
                    className="mt-2 w-full h-[40px] px-[10px] border border-[var(--border)] bg-[var(--card)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] disabled:cursor-not-allowed"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                      opacity: !selectedStudentId ? 0.75 : 1,
                    }}
                  >
                    <option value="">{selectedStudentId ? 'Seleziona lavorazione...' : 'Seleziona prima uno studente'}</option>
                    {serviceOptions.map(service => (
                      <option key={service.id} value={service.id}>{`${service.id} - ${service.service_name}`}</option>
                    ))}
                  </select>
                  {!selectedStudentId && (
                    <p
                      className="mt-2 text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      Il selettore lavorazione resta bloccato finché non scegli uno studente.
                    </p>
                  )}
                </div>
              </div>
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

              <div className="mt-4">
                <SottocheckUploadForm
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
                Nessun limite crediti per admin. Il consumo viene monitorato su tutto lo storico controlli.
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
                      Crediti consumati complessivamente
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h1)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {totalConsumedCredits}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      Sessione corrente: {usedCredits} crediti
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      Costo operativo per check: {MOCK_CREDIT_COST_PER_CHECK} crediti
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

              {!canStartCheck && (
                <p
                  className="mt-3 text-[var(--chart-3)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  {!selectedStudentId || !selectedServiceId
                    ? 'Seleziona studente e lavorazione prima di avviare il controllo.'
                    : 'Carica prima un documento valido per avviare il controllo.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
