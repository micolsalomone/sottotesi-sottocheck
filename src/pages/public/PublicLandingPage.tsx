import { SottocheckUploadForm, UploadedDocument } from '@/app/components/SottocheckUploadForm';
import { SottocheckPricingPreview } from '@/app/components/SottocheckPricingPreview';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import PlanningSticker from '@/imports/Planning.png';
import MatchSticker from '@/imports/Match.png';
import {
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  CreditCard,
  Globe,
  Heart,
  Instagram,
  Mail,
  MessageSquare,
  ShieldCheck,
  Music2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  clearPrecheckSession,
  createTemporaryDocumentRef,
  getPrecheckSession,
  savePrecheckSession,
  setPrecheckFlowStage,
  type TesiCheckPrecheckSession,
} from '@/app/data/tesicheckPrecheckSession';

const DEMO_CHARACTER_COUNT = 28500;
const DEMO_PRICE = 14.9;

export function PublicLandingPage() {
  const navigate = useNavigate();
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(() => getPrecheckSession()?.document ?? null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'valid' | 'invalid'>(() => getPrecheckSession()?.validationState ?? 'idle');
  const [precheckSession, setPrecheckSession] = useState<TesiCheckPrecheckSession | null>(() => getPrecheckSession());
  const [isPriceCalculating, setIsPriceCalculating] = useState(false);
  const pricingTimerRef = useRef<number | null>(null);
  const canProceedToPayment = !!precheckSession && !isPriceCalculating;
  const isPricingUpdated = !!precheckSession && !isPriceCalculating;
  const isCheckoutInProgress = !!precheckSession && precheckSession.flowStage !== 'quote_ready';

  const clearPricingTimer = () => {
    if (pricingTimerRef.current) {
      window.clearTimeout(pricingTimerRef.current);
      pricingTimerRef.current = null;
    }
  };

  const runPriceCalculationLoader = (document: UploadedDocument, temporaryDocumentRef: string) => {
    clearPricingTimer();
    setIsPriceCalculating(true);
    pricingTimerRef.current = window.setTimeout(() => {
      const nextSession: TesiCheckPrecheckSession = {
        document,
        temporaryDocumentRef,
        validationState: 'valid',
        characterCount: DEMO_CHARACTER_COUNT,
        price: DEMO_PRICE,
        flowStage: 'quote_ready',
        claim: { status: 'guest' },
      };
      savePrecheckSession(nextSession);
      setPrecheckSession(nextSession);
      setIsPriceCalculating(false);
      pricingTimerRef.current = null;
    }, 700);
  };

  const handleUploadStatusChange = (status: 'idle' | 'valid' | 'invalid') => {
    setUploadStatus(status);
  };

  const handleUploadedDocument = (document: UploadedDocument, status: 'idle' | 'valid' | 'invalid') => {
    setUploadedDocument(document);
    clearPrecheckSession();
    setPrecheckSession(null);
    if (status === 'valid') {
      runPriceCalculationLoader(document, createTemporaryDocumentRef());
      return;
    }
    clearPricingTimer();
    setIsPriceCalculating(false);
  };

  const handleFileCleared = () => {
    setUploadedDocument(null);
    setPrecheckSession(null);
    clearPrecheckSession();
    clearPricingTimer();
    setIsPriceCalculating(false);
  };

  const handlePayment = () => {
    if (!canProceedToPayment) return;
    const checkoutSession = setPrecheckFlowStage('checkout_account');
    if (!checkoutSession) return;
    setPrecheckSession(checkoutSession);
    navigate('/public/account');
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 px-[20px] py-[16px] md:px-[40px]">
          <a href="/public" className="inline-flex items-center">
            <SottotesiLogodefDefault />
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.sottotesi.it/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-[14px] py-[10px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Accedi
            </a>
            <a
              href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-[14px] py-[10px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Registrati
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1160px] px-[20px] py-[56px] md:px-[40px] md:py-[72px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p
              className="mb-3 uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              TesiCheck
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
                className="inline-flex items-center justify-center gap-2 px-[16px] py-[11px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <ClipboardCheck className="w-4 h-4" />
                Vai al check plagio
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Scopri il servizio
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={PlanningSticker}
              alt="Illustrazione mappa TesiCheck"
              className="w-[240px] h-auto md:w-[300px] lg:w-[320px]"
            />
          </div>
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
              <span className="inline-flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#2563EB]" />
                Processo
              </span>
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-bold)',
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
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#059669]" />
                Trust
              </span>
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-bold)',
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
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#DB2777]" />
                Supporto
              </span>
            </p>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-bold)',
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
        style={{ scrollMarginTop: '110px' }}
      >
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-6"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <h2
              className="inline-flex items-center gap-3"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              <ClipboardCheck className="h-6 w-6 text-[#D97706]" />
              Avvia il tuo check
            </h2>
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
                <strong className="text-[var(--foreground)]">I file non vengono archiviati.</strong> Vengono processati solo per eseguire il check e generare il report.
              </p>
            </div>

            {isCheckoutInProgress ? (
              <div className="border border-[var(--border)] bg-[var(--background)] p-5" style={{ borderRadius: 'var(--radius)' }}>
                <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                  Hai un TesiCheck in corso
                </p>
                <p className="mt-3" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
                  {precheckSession.document.name}
                </p>
                <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
                  {precheckSession.characterCount.toLocaleString('it-IT')} caratteri · EUR {precheckSession.price.toFixed(2)}
                </p>
                <SottocheckActionButton className="mt-5" onClick={() => navigate('/public/account')} icon={<ArrowRight className="h-4 w-4" />}>
                  Riprendi il checkout
                </SottocheckActionButton>
              </div>
            ) : (
              <>
                <SottocheckUploadForm
                  onFileSelected={handleUploadedDocument}
                  onStatusChange={handleUploadStatusChange}
                  onFileCleared={handleFileCleared}
                  disabled={false}
                />

                <div
                  className="border border-[var(--border)] bg-[var(--background)] p-4"
                  style={{
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--elevation-sm)',
                  }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-[760px] space-y-4">
                      <SottocheckPricingPreview
                        isUpdated={isPricingUpdated}
                        isLoading={isPriceCalculating}
                        characterCount={precheckSession?.characterCount}
                        price={precheckSession?.price}
                      />
                      {isPricingUpdated && (
                        <p className="text-[var(--primary)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
                          Prezzo aggiornato in base al documento caricato.
                        </p>
                      )}
                    </div>

                    <SottocheckActionButton
                      type="button"
                      onClick={handlePayment}
                      disabled={!canProceedToPayment}
                      icon={<CreditCard className="w-4 h-4" />}
                      className="lg:mt-0"
                    >
                      Procedi al pagamento
                    </SottocheckActionButton>
                  </div>
                </div>

                {uploadedDocument && uploadStatus === 'valid' && (
                  <div className="border-t border-[var(--border)] pt-6" style={{ marginTop: '24px' }}>
                    <p className="max-w-[600px] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}>
                      Il documento e pronto. Il box prezzo qui sopra è stato aggiornato e il pagamento è disponibile.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-[20px] py-[24px] md:px-[40px] md:py-[32px]">
        <div
          className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-7"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div className="text-left">
              <p
                className="text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-medium)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Supporto coaching
              </p>
              <h2
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h2)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--foreground)',
                }}
              >
                Vuoi un aiuto in piu sul check o sul testo della tesi?
              </h2>
              <p
                className="mt-2 max-w-[760px] text-[var(--muted-foreground)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Subito dopo il check puoi approfondire i servizi Sottotesi, chiedere chiarimenti sul funzionamento del controllo oppure richiedere supporto dedicato per leggere il report e capire come intervenire sul documento.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-[16px] py-[11px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Scopri i servizi di coaching
                  <ExternalLink className="w-4 h-4" />
                </a>

                <a
                  href="mailto:info@sottotesi.it?subject=Richiesta%20informazioni%20TesiCheck&body=Ciao%2C%20vorrei%20maggiori%20informazioni%20sul%20check%20e%20sul%20supporto%20Sottotesi."
                  className="inline-flex items-center gap-2 px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}
                >
                  Scrivi a info@sottotesi.it
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div
              className="border border-[var(--border)] bg-[var(--muted)] p-3 mx-auto lg:ml-auto lg:mr-0"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <img
                src={MatchSticker}
                alt="Sticker supporto coaching Sottotesi"
                className="w-[150px] h-auto md:w-[190px]"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-[var(--border)] bg-[var(--muted)]/40">
        <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 gap-10 px-[20px] py-[32px] md:px-[40px] lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:gap-10">
          <div className="space-y-4">
            <a href="https://www.sottotesi.it/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              <SottotesiLogodefDefault />
            </a>
            <p
              className="max-w-[320px] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              <strong className="text-[var(--foreground)]">TesiCheck</strong> ti accompagna nel controllo del testo con un flusso chiaro, riservato e pensato per il lavoro sulla tesi.
            </p>

            <a
              href="mailto:info@sottotesi.it"
              className="inline-flex items-center gap-2 text-[var(--foreground)] hover:underline"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
              info@sottotesi.it
            </a>

            <div
              className="space-y-1 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              <p>P.IVA 03478871209</p>
              <p>Via Mascarella 10, 40126 Bologna (BO)</p>
            </div>
          </div>

          <div className="space-y-4">
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Sito
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <a
                href="https://www.sottotesi.it/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--foreground)] hover:underline"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Globe className="h-4 w-4 text-[#0F766E]" />
                Sottotesi.it
              </a>
              <a
                href="https://www.sottotesi.it/contatti/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--foreground)] hover:underline"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <ExternalLink className="h-4 w-4 text-[#2563EB]" />
                Contatti
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Servizi
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <a
                href="https://www.sottotesi.it/consulenza-tesi/coaching/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--foreground)] hover:underline"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <ExternalLink className="h-4 w-4 text-[#DB2777]" />
                Servizi coaching
              </a>
              <a
                href="https://www.sottotesi.it/consulenza-tesi/antiplagio-revisione/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--foreground)] hover:underline"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <ClipboardCheck className="h-4 w-4 text-[#F59E0B]" />
                Check plagio
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <p
              className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Social
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <a
                href="https://www.instagram.com/sottotesi/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                aria-label="Instagram Sottotesi"
                title="Instagram"
              >
                <Instagram className="h-4 w-4 text-[#E1306C]" />
              </a>
              <a
                href="https://www.tiktok.com/@sottotesi.it"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                aria-label="TikTok Sottotesi"
                title="TikTok"
              >
                <Music2 className="h-4 w-4 text-[#111827]" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)]">
          <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-3 px-[20px] py-[16px] text-[var(--muted-foreground)] md:flex-row md:items-center md:justify-between md:px-[40px]">
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.5,
              }}
            >
              developed with <Heart className="inline-block h-4 w-4 align-[-0.125em] text-[#E11D48]" /> by Emidio Torre and Micol Salomone
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.5,
              }}
            >
              Copyright © 2026 Sottotesi
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
