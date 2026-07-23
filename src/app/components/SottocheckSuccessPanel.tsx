import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';

interface SottocheckSuccessPanelProps {
  title?: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showEmailCapture?: boolean;
  footerNote?: string;
}

export function SottocheckSuccessPanel({
  title = 'Check completato',
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  showEmailCapture = false,
  footerNote,
}: SottocheckSuccessPanelProps) {
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail.trim());

  const handleSendEmail = () => {
    if (!isEmailValid) return;
    setEmailSent(true);
  };

  return (
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
        {title}
      </h1>

      <p
        className="mt-4 text-[var(--muted-foreground)]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
        }}
      >
        {description}
      </p>

      {showEmailCapture && (
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

          <SottocheckActionButton
            type="button"
            onClick={handleSendEmail}
            disabled={!isEmailValid}
            variant="secondary"
            className="mt-3 px-[14px] py-[10px]"
          >
            Invia conferma via email
          </SottocheckActionButton>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <SottocheckActionButton
          onClick={onPrimaryAction}
          fullWidth
          icon={<ArrowRight className="w-4 h-4" />}
          className="px-[16px] py-[12px]"
        >
          {primaryActionLabel}
        </SottocheckActionButton>

        {secondaryActionLabel && onSecondaryAction && (
          <SottocheckActionButton
            onClick={onSecondaryAction}
            fullWidth
            variant="secondary"
            className="px-[16px] py-[12px]"
          >
            {secondaryActionLabel}
          </SottocheckActionButton>
        )}
      </div>

      {footerNote && (
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
            {footerNote}
          </p>
        </div>
      )}
    </div>
  );
}