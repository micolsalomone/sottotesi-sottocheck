import { SottocheckPage as StudentSottocheckPage } from '@/pages/student/SottocheckPage';

export function PublicLandingPage() {
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
          Landing in costruzione: qui presenteremo il servizio, i punti di affidabilita e il check plagio integrato.
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article
            className="border border-[var(--border)] bg-[var(--card)] p-6"
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
          >
            <h2
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
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Come funziona
            </h2>
            <p
              className="mt-2 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              Sezione placeholder per spiegare processo, tempi e accesso ai report.
            </p>
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
            <a
              href="/public/output-preview"
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
            </a>
          </div>

          <StudentSottocheckPage />
        </div>
      </section>
    </main>
  );
}