import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function PublicLandingPage() {
  const navigate = useNavigate();
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const canProceedToPayment = !!uploadedDocument && uploadStatus === 'valid';

  const handlePayment = () => {
    if (!canProceedToPayment || isPaymentProcessing) return;
    setIsPaymentProcessing(true);
    setTimeout(() => {
      navigate('/public/success');
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto w-full max-w-[1160px] px-[20px] py-[56px] md:px-[40px] md:py-[72px]">
        <p
          className="mb-3 uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Sottocheck
        </p>
        <h1
          className="max-w-[760px]"
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.2,
          }}
        >
          Verifica plagio online con report chiaro e supporto professionale
        </h1>
        <p
          className="mt-4 max-w-[760px] text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Carica il documento, avvia il controllo e consulta un report leggibile in pochi passaggi. La pagina e
          costruita per darti trasparenza operativa prima dell upload.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#check-plagio"
            className="inline-flex items-center justify-center px-[16px] py-[11px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Vai al check plagio
          </a>
          <a
            href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            Scopri il servizio
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-[20px] py-[24px] md:px-[40px] md:py-[32px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article
            className="border border-[var(--border)] bg-[var(--card)] p-6"
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
          >
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Processo
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Come funziona
            </h2>
            <ol
              className="mt-3 list-decimal pl-5 space-y-1 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              <li>Carichi il file in formato PDF o DOCX.</li>
              <li>Confermi il check e segui lo stato di elaborazione.</li>
              <li>Visualizzi il report con indicatori chiari.</li>
            </ol>
          </article>

          <article
            className="border border-[var(--border)] bg-[var(--card)] p-6"
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
          >
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Trust
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Affidabilita
            </h2>
            <p
              className="mt-2 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              Il servizio e progettato per darti un check chiaro e professionale, con un flusso orientato alla riservatezza.
            </p>

            <ul
              className="mt-4 list-disc pl-5 text-[var(--muted-foreground)] space-y-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              <li>Non archiviamo i file caricati dagli utenti.</li>
              <li>I file non sono visibili a Sottotesi.</li>
              <li>Il report resta consultabile dall utente nel suo flusso operativo.</li>
            </ul>
          </article>

          <article
            className="border border-[var(--border)] bg-[var(--card)] p-6"
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
          >
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Supporto
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Contesto professionale
            </h2>
            <p
              className="mt-2 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              Se vuoi approfondire il servizio, puoi consultare la pagina dedicata con maggiori dettagli sul metodo di
              verifica e sul supporto Sottotesi.
            </p>

            <a
              href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center px-[14px] py-[10px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Approfondisci il servizio
            </a>
          </article>
        </div>
      </section>

      <section
        id="check-plagio"
        className="mx-auto w-full max-w-[1160px] px-[20px] py-[24px] md:px-[40px] md:py-[32px]"
      >
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-6"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Avvia il tuo check
            </h2>
            <button
              type="button"
              onClick={() => navigate('/public/output-preview')}
              className="inline-flex items-center justify-center px-[14px] py-[10px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Apri anteprima report
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div
              className="border border-[var(--border)] bg-[var(--background)] p-4"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <p
                className="text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Prima di caricare: i file non vengono archiviati. Vengono processati solo per eseguire il check e generare il report.
              </p>
            </div>

            <SottocheckUploadForm
              onFileSelected={setUploadedDocument}
              onStatusChange={setUploadStatus}
              onFileCleared={() => setUploadedDocument(null)}
              disabled={false}
            />

            {uploadedDocument && uploadStatus === 'valid' && (
              <div
                className="border-t border-[var(--border)] pt-6"
                style={{ marginTop: '24px' }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-alegreya)',
                    fontSize: 'var(--text-h3)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Procedi al pagamento
                </h3>
                <p
                  className="mt-2 max-w-[600px] text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  Il documento e pronto. Dopo il check potrai scegliere se salvare il report via email.
                </p>

                <SottocheckPricingPreview className="mt-4" />

                <SottocheckActionButton
                  type="button"
                  onClick={handlePayment}
                  disabled={!canProceedToPayment}
                  loading={isPaymentProcessing}
                  className="mt-4 px-[16px] py-[11px]"
                >
                  {isPaymentProcessing ? 'Reindirizzamento al pagamento...' : 'Procedi al pagamento'}
                </SottocheckActionButton>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-[20px] py-[24px] pb-[56px] md:px-[40px] md:py-[32px] md:pb-[72px]">
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-7"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h2)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Vuoi prima vedere il formato del risultato?
          </h2>
          <p
            className="mt-2 max-w-[760px] text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Puoi aprire subito un anteprima del report per capire come vengono presentati i match e gli indicatori.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/public/output-preview')}
              className="inline-flex items-center justify-center px-[16px] py-[11px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Apri anteprima report
            </button>

            <a
              href="#check-plagio"
              className="inline-flex items-center justify-center px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Torna al check
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}