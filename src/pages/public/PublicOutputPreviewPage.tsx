import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { ExternalLink, Globe, Mail, Send } from 'lucide-react';

export function PublicOutputPreviewPage() {
  const location = useLocation();
  const isPublicLanding = location.pathname.startsWith('/public/');
  const [reportEmail, setReportEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(1280);
  const previewMode = isPublicLanding ? 'public-landing' : 'app';
  const backTarget = isPublicLanding
    ? '/public/sottocheck'
    : location.pathname.startsWith('/coach-view/')
      ? '/coach-view/sottocheck'
      : location.pathname.startsWith('/student-view/')
        ? '/student-view/sottocheck'
        : '/public-view/sottocheck';
  const previewUrl = new URL('sottocheck-output-preview.html', window.location.origin + import.meta.env.BASE_URL);
  previewUrl.searchParams.set('mode', previewMode);
  previewUrl.searchParams.set('back', backTarget);

  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.endsWith('.css'));

  cssLinks.forEach((href) => {
    const absoluteHref = new URL(href, window.location.origin).toString();
    previewUrl.searchParams.append('css', absoluteHref);
  });

  const previewSrc = previewUrl.toString();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportEmail.trim());

  useEffect(() => {
    if (!isPublicLanding) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'sc-height') {
        return;
      }

      const nextHeight = Number(event.data.height);
      if (Number.isFinite(nextHeight) && nextHeight > 0) {
        setIframeHeight(nextHeight);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isPublicLanding]);

  const handleSendEmail = () => {
    if (!isEmailValid) {
      return;
    }

    setEmailSent(true);
  };

  if (isPublicLanding) {
    return (
      <main
        style={{
          width: '100%',
          minHeight: '100vh',
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--background) 95%, transparent)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '1160px',
              margin: '0 auto',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <a href="/public" style={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}>
              <SottotesiLogodefDefault />
            </a>

            <a
              href="https://www.sottotesi.it/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Vai su Sottotesi.it
              <ExternalLink size={16} />
            </a>
          </div>
        </header>

        <section
          style={{
            width: '100%',
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '24px 20px 0',
          }}
        >
          <iframe
            title="TesiCheck Output Preview"
            src={previewSrc}
            style={{
              width: '100%',
              height: `${iframeHeight}px`,
              border: '0',
              display: 'block',
              borderRadius: 'var(--radius)',
              background: 'var(--background)',
            }}
          />
        </section>

        <section
          style={{
            width: '100%',
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '24px 20px 48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          <article
            style={{
              padding: '24px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--card)',
              boxShadow: 'var(--elevation-sm)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
              }}
            >
              Invia il report
            </p>
            <h2
              style={{
                margin: '10px 0 0',
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}
            >
              Ricevi il link via email
            </h2>
            <p
              style={{
                margin: '10px 0 0',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.6,
                color: 'var(--muted-foreground)',
              }}
            >
              Inserisci il tuo indirizzo per ricevere una conferma con accesso al report. Se chiudi il browser senza salvarlo, potresti non ritrovarlo nella prossima sessione.
            </p>

            <label
              htmlFor="public-report-email"
              style={{
                display: 'block',
                marginTop: '16px',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Email per conferma e link report
            </label>
            <input
              id="public-report-email"
              type="email"
              value={reportEmail}
              onChange={(event) => {
                setReportEmail(event.target.value);
                setEmailSent(false);
              }}
              placeholder="nome@dominio.it"
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {!!reportEmail && !isEmailValid && (
              <p
                style={{
                  margin: '10px 0 0',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--destructive)',
                }}
              >
                Inserisci un indirizzo email valido.
              </p>
            )}

            {emailSent && (
              <p
                style={{
                  margin: '10px 0 0',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--primary)',
                }}
              >
                Conferma inviata correttamente a {reportEmail.trim()}.
              </p>
            )}

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!isEmailValid}
              style={{
                marginTop: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: isEmailValid ? 'var(--foreground)' : 'var(--muted)',
                color: isEmailValid ? 'var(--background)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: isEmailValid ? 'pointer' : 'not-allowed',
              }}
            >
              Invia conferma via email
              <Send size={16} />
            </button>
          </article>

          <article
            style={{
              padding: '24px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--muted) 78%, white) 0%, color-mix(in srgb, var(--surface-chart-2-soft) 60%, white) 100%)',
              boxShadow: 'var(--elevation-sm)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
              }}
            >
              Supporto Sottotesi
            </p>
            <h2
              style={{
                margin: '10px 0 0',
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h3)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}
            >
              Hai bisogno di aiuto sul report?
            </h2>
            <p
              style={{
                margin: '10px 0 0',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.6,
                color: 'var(--muted-foreground)',
              }}
            >
              Se vuoi approfondire l esito del controllo o ricevere supporto operativo, puoi contattare Sottotesi oppure visitare il sito per scoprire i servizi dedicati.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
              <a
                href="https://www.sottotesi.it/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Globe size={18} color="#0F766E" />
                Sottotesi.it
              </a>
              <a
                href="mailto:info@sottotesi.it?subject=Richiesta%20supporto%20report%20TesiCheck&body=Ciao%2C%20vorrei%20ricevere%20supporto%20sul%20report%20TesiCheck."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Mail size={18} color="#DB2777" />
                info@sottotesi.it
              </a>
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--background)',
      }}
    >
      <iframe
        title="TesiCheck Output Preview"
        src={previewSrc}
        style={{
          width: '100%',
          height: '100vh',
          border: '0',
          display: 'block',
        }}
      />
    </div>
  );
}
