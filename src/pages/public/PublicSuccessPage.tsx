import { CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function PublicSuccessPage() {
  const navigate = useNavigate();
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail.trim());

  const handleSendEmail = () => {
    if (!isEmailValid) return;
    setEmailSent(true);
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-[20px]">
      <div className="w-full max-w-[600px]">
        <div
          className="text-center bg-[var(--card)] border border-[var(--border)] p-8 md:p-12"
          style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
        >
          <div
            className="w-[92px] h-[92px] mx-auto mb-6 flex items-center justify-center"
            style={{ borderRadius: '50%', background: 'rgba(11,182,63,0.10)' }}
          >
            <CheckCircle className="w-12 h-12 text-[var(--primary)]" />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h1)',
              fontWeight: 'var(--font-weight-bold)',
              lineHeight: 1.3,
              color: 'var(--foreground)',
            }}
          >
            Check completato
          </h1>

          <p
            className="mt-4 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Il controllo plagio è stato completato con successo. Il tuo report è pronto e accessibile.
          </p>

          <div
            className="mt-6 border border-[var(--border)] bg-[var(--background)] p-4 text-left"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Salva l accesso al report via email (facoltativo)
            </p>
            <p
              className="mt-1 text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              Se chiudi il browser senza salvare l accesso via email, potresti non ritrovare il report alla prossima sessione.
            </p>

            <label
              htmlFor="success-email"
              className="mt-3 block text-[var(--foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Email per conferma e link report
            </label>
            <input
              id="success-email"
              type="email"
              value={notificationEmail}
              onChange={(e) => {
                setNotificationEmail(e.target.value);
                setEmailSent(false);
              }}
              placeholder="nome@dominio.it"
              className="mt-2 w-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none focus:border-[var(--foreground)]"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            />

            {!!notificationEmail && !isEmailValid && (
              <p
                className="mt-2 text-[var(--destructive)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                }}
              >
                Inserisci un indirizzo email valido.
              </p>
            )}

            {emailSent && (
              <p
                className="mt-2 text-[var(--primary)]"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Conferma inviata correttamente a {notificationEmail.trim()}.
              </p>
            )}

            <button
              type="button"
              onClick={handleSendEmail}
              disabled={!isEmailValid}
              className="mt-3 inline-flex items-center justify-center px-[14px] py-[10px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Invia conferma via email
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/public/output-preview')}
              className="w-full px-[16px] py-[12px] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Visualizza il report
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/public/history')}
              className="w-full px-[16px] py-[12px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Vai allo storico
            </button>
          </div>

          <div
            className="mt-8 p-4 border border-[var(--border)] bg-[var(--background)]"
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
              Non archiviamo i tuoi file. Se non salvi il link via email, alla prossima sessione il report potrebbe non essere piu disponibile.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}