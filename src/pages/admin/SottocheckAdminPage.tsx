import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { useLavorazioni } from '@/app/data/LavorazioniContext';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type CheckStatus = 'created' | 'processing' | 'completed';

interface UploadedDocument {
  name: string;
  size: number;
  pages: number;
  format: string;
}

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

export function SottocheckAdminPage() {
  const navigate = useNavigate();
  const { data: serviziStudenti, students } = useLavorazioni();

  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');
  const [isDragging, setIsDragging] = useState(false);
  const [usedCredits, setUsedCredits] = useState<number>(0);
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
    if (!selectedStudentId || !selectedServiceId || !document || documentStatus !== 'valid' || pagesSelected <= 0) {
      return;
    }

    const now = new Date();
    const existing: PersistedAdminCheck[] = (() => {
      try {
        const raw = localStorage.getItem(ADMIN_SOTTOCHECK_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as PersistedAdminCheck[]) : [];
      } catch {
        return [];
      }
    })();

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
      localStorage.setItem(ADMIN_SOTTOCHECK_STORAGE_KEY, JSON.stringify([nextJob, ...existing]));
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
                Il report e stato generato correttamente.
              </p>
              <button
                onClick={() => navigate('/sottocheck/lavorazioni')}
                className="w-full px-[24px] py-[12px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Vai a Lavorazioni sottocheck
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
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
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
                    className="mt-2 w-full h-[40px] px-[10px] border border-[var(--border)] bg-[var(--card)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <option value="">Seleziona lavorazione...</option>
                    {serviceOptions.map(service => (
                      <option key={service.id} value={service.id}>{`${service.id} - ${service.service_name}`}</option>
                    ))}
                  </select>
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

              {!document ? (
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
                          Formato valido - Puoi procedere
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
                            Il file caricato non e in un formato supportato. Carica un file PDF o DOCX.
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
                Nessun limite crediti per admin. Viene tracciato solo il totale usato.
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
                      Crediti utilizzati (sessione)
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h2)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {usedCredits}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      Costo esempio per check: {MOCK_CREDIT_COST_PER_CHECK} crediti
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
