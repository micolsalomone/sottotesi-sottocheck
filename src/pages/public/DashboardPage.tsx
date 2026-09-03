import { useNavigate } from 'react-router';
import { ArrowRight, ClipboardCheck, ExternalLink } from 'lucide-react';
import PlanningSticker from '@/imports/Planning.png';
import MatchSticker from '@/imports/Match.png';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="py-[32px]">
      <header className="mb-8 md:mb-10">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Dashboard
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Da qui puoi avviare e visualizzare i tuoi servizi online con Sottotesi.
        </p>
      </header>

      <section
        className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-7"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-6 items-start">
          <div>
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
              Servizio disponibile
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                lineHeight: 1.3,
              }}
            >
              Tesi Check
            </h2>
            <p
              className="mt-1 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              Controllo automatico plagio + AI
            </p>

            <div
              className="mt-5 border border-[var(--border)] bg-[var(--background)] p-5"
              style={{ borderRadius: 'var(--radius)', maxWidth: '720px' }}
            >
              <p
                className="mb-3"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Include
              </p>

              <ul
                className="list-disc pl-5 text-[var(--muted-foreground)] space-y-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                <li>report dettagliato</li>
                <li>analisi plagio</li>
                <li>analisi contenuti AI</li>
                <li>controllo pagina per pagina</li>
                <li>risultato rapido online</li>
              </ul>

              <div className="mt-5 pt-4 border-t border-[var(--border)]">
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}
                >
                  Prezzo
                </p>
                <p
                  className="mt-1 text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  Sara' generato automaticamente a seconda del numero di caratteri da esaminare.
                </p>
              </div>
            </div>
          </div>

          <div
            className="border border-[var(--border)] bg-[var(--muted)] p-3 mx-auto md:mx-0"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <img
              src={PlanningSticker}
              alt="Sticker mappa TESI CHECK"
              className="w-[150px] h-auto md:w-[190px]"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            <SottocheckActionButton
              onClick={() => navigate('/public-view/sottocheck')}
              icon={<ClipboardCheck className="w-4 h-4" />}
              className="px-[16px] py-[11px]"
            >
              Vai al check plagio
              <ArrowRight className="w-4 h-4" />
            </SottocheckActionButton>

            <a
              href="https://sottotesi.it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Scopri dettagli servizio
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section
        className="mt-6 border border-[var(--border)] bg-[var(--card)] p-6 md:p-7"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
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
              Attiva un Servizio Coaching
            </p>
            <h2
              className="mt-1"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                lineHeight: 1.3,
              }}
            >
              Ottieni supporto su misura per te
            </h2>
            <p
              className="mt-2 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                maxWidth: '760px',
              }}
            >
              Attiva un percorso coaching dedicato, contattaci per maggiori informazioni e per ricevere un preventivo personalizzato in base alle tue esigenze.
            </p>
          </div>

          <div
            className="border border-[var(--border)] bg-[var(--muted)] p-3 mx-auto md:mx-0"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <img
              src={MatchSticker}
              alt="Sticker cuore per il servizio coaching"
              className="w-[150px] h-auto md:w-[190px]"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <a
            href="https://sottotesi.it"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-[16px] py-[11px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            Scopri il coaching
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
