import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { getViewBasePath } from '@/pages/coach/viewBasePath';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { SottocheckSuccessPanel } from '@/app/components/SottocheckSuccessPanel';

type DocumentStatus = 'idle' | 'valid' | 'invalid';
type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';
type CheckStatus = 'created' | 'processing' | 'completed' | 'error';

export function SottocheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('created');

  const historyPath = `${getViewBasePath(location.pathname)}/history`;

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

  const canProceedToPayment = document && documentStatus === 'valid';

  if (paymentStatus === 'paid') {
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
            <SottocheckSuccessPanel
              description="Il report di verifica plagio è pronto."
              primaryActionLabel="Visualizza il report"
              onPrimaryAction={() => navigate(`${getViewBasePath(location.pathname)}/output-preview`)}
              secondaryActionLabel="Vai allo storico Sottocheck"
              onSecondaryAction={() => navigate(historyPath)}
              footerNote="Il report resta disponibile nel tuo storico utente."
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
              <div className="mt-4">
                <SottocheckUploadForm
                  onFileSelected={setDocument}
                  onStatusChange={setDocumentStatus}
                  onFileCleared={() => setDocument(null)}
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
                Conferma i dettagli e avvia il pagamento. Potrai salvare il link del report via email dopo il completamento del check.
              </p>

              <div className="mt-4 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <SottocheckPricingPreview />
                  <SottocheckActionButton
                    onClick={handlePayment}
                    disabled={!canProceedToPayment || paymentStatus === 'processing'}
                    loading={paymentStatus === 'processing'}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    {paymentStatus === 'processing' ? 'Elaborazione...' : 'Procedi al pagamento'}
                  </SottocheckActionButton>
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
