import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Loader2,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';
type CheckStatus = 'created' | 'processing' | 'completed' | 'error';

interface UploadedDocument {
  name: string;
  size: number;
  pages: number;
  format: string;
}

export function SottocheckPage() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [pagesSelected, setPagesSelected] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');
  const [isDragging, setIsDragging] = useState(false);

  const pricePerPage = 0.5;
  const totalPrice = pagesSelected * pricePerPage;

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

  const handlePayment = async () => {
    setPaymentStatus('processing');

    setTimeout(() => {
      setPaymentStatus('paid');
      setCheckStatus('processing');

      setTimeout(() => {
        setCheckStatus('completed');
      }, 3000);
    }, 2000);
  };

  const canProceedToPayment = document && documentStatus === 'valid' && pagesSelected > 0;

  if (paymentStatus === 'paid') {
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
            Il controllo è in corso
          </p>
        </div>

        <div
          className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[44px] text-center"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {checkStatus === 'processing' && (
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
          )}

          {checkStatus === 'completed' && (
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
                onClick={() => navigate('/student-view/history')}
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
          Carica il documento, verifica il formato e avvia il controllo
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
                Requisiti del documento
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Assicurati che il documento rispetti questi requisiti prima di procedere
              </p>

              <div
                className="mt-4 p-4"
                style={{
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(247,144,9,0.35)',
                  background: 'rgba(247,144,9,0.08)',
                }}
              >
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 mt-[2px] text-[var(--chart-3)] shrink-0" />
                  <div>
                    <p
                      className="mb-2 text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      Requisiti obbligatori
                    </p>
                    <ul
                      className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      <li>Formato supportato: PDF o DOCX</li>
                      <li>Formattazione standard (margini corretti, interlinea 1.5, font leggibile)</li>
                      <li>Documento finale, non bozze o versioni incomplete</li>
                    </ul>
                    <p
                      className="mt-3 text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      ⚠️ Documenti non conformi non verranno analizzati
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="#"
                className="mt-4 inline-flex items-center gap-2 text-[var(--primary)] hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Scarica linee guida di formattazione
              </a>
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
                Trascina il file o selezionalo dal tuo computer
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
                Conferma e pagamento
              </h3>
              <p
                className="mt-1 text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Il prezzo è calcolato automaticamente in base al numero di pagine selezionate
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
                      Totale da pagare
                    </p>
                    <p
                      className="text-[var(--foreground)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h2)',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      €{totalPrice.toFixed(2)}
                    </p>
                    <p
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {pagesSelected} pagine × €{pricePerPage.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!canProceedToPayment || paymentStatus === 'processing'}
                    className={`inline-flex items-center gap-2 px-6 py-3 transition-opacity ${
                      canProceedToPayment && paymentStatus !== 'processing'
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
                    {paymentStatus === 'processing' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Elaborazione...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Procedi al pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!canProceedToPayment && (
                <p
                  className="mt-3 text-[var(--chart-3)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  Carica prima un documento valido per procedere con il pagamento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
