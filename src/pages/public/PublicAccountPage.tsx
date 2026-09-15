import { ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { FormSection } from '@/app/components/profile/ProfileFormPrimitives';
import { CommercialConsentField } from '@/app/components/profile/CommercialConsentField';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import {
  AccountInfoRow,
  CrossSurfaceLink,
  LegalStatusRow,
} from '@/app/components/account/AccountPrimitives';
import { findRegisteredAccount, getAccountSession } from '@/app/data/tesicheckAccountSession';
import { readStandaloneCommercialConsent, writeStandaloneCommercialConsent } from '@/app/data/standaloneProfile';

/**
 * Authenticated standalone Account page (`/public-view/account`).
 *
 * Account/access/legal surface — distinct from the Profile page
 * (`/public-view/profilo`, personal/profile data). It does NOT reuse
 * `/public/account`, which is and stays the paid-checkout account gate.
 *
 * Self-service IA rule: account email, the commercial-communications
 * preference, and Terms/Privacy status all belong here, not on Profile —
 * Profile owns only personal info, phone and academic history.
 *
 * Legal state is read from the Slice A prototype persistence: the
 * registered-account registry (source of truth), falling back to the mirrored
 * account session. Absent booleans (legacy accounts) render as
 * "Stato non registrato nel prototipo" — never silently treated as accepted.
 * No dates / versions / URLs / legal text are invented; Terms & Privacy are
 * informational here. Production must supply real account/legal semantics.
 *
 * The commercial preference is read/written through the SAME standalone
 * Profile-local store (`standaloneProfile.ts`, `commercial_consents`) the
 * registration flow already seeds — never a new store, never CRM/Pipeline.
 */

const PASSWORD_RECOVERY_PATH = '/public/password-recovery?returnTo=/public-view/account';

export function PublicAccountPage() {
  const session = useMemo(() => getAccountSession(), []);
  const registered = useMemo(
    () => (session ? findRegisteredAccount(session.email) : null),
    [session],
  );

  const [commercialConsent, setCommercialConsent] = useState<boolean | null>(() =>
    session ? readStandaloneCommercialConsent(session.email) : null,
  );
  const [commercialSaved, setCommercialSaved] = useState(false);

  // `PublicLayout` already guards the session; keep a neutral fallback anyway.
  if (!session) {
    return (
      <PageShell>
        <NeutralCard
          title="Account non disponibile"
          body="Accedi con un account TesiCheck per gestire i dati dell'account."
        />
      </PageShell>
    );
  }

  const termsAccepted = registered?.termsAccepted ?? session.termsAccepted;
  const privacyAcknowledged = registered?.privacyAcknowledged ?? session.privacyAcknowledged;

  const handleSaveCommercialConsent = () => {
    if (commercialConsent === null) return;
    writeStandaloneCommercialConsent(session.email, commercialConsent);
    setCommercialSaved(true);
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <FormSection title="Accesso">
          <div className="divide-y divide-[var(--border)]">
            <AccountInfoRow label="Email account" value={session.email} />
            <AccountInfoRow
              label="Password"
              value="Gestisci o reimposta la password"
              action={
                <Link
                  to={PASSWORD_RECOVERY_PATH}
                  className="control-focus-ring inline-flex items-center border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Gestisci password
                </Link>
              }
            />
          </div>
        </FormSection>

        <FormSection title="Comunicazioni">
          <CommercialConsentField
            idPrefix="standalone-account-commercial-consent"
            value={commercialConsent}
            onChange={(v) => {
              setCommercialConsent(v);
              setCommercialSaved(false);
            }}
          />
          <p
            className="mt-2 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
          >
            Riferito all&apos;indirizzo {session.email}.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <SottocheckActionButton onClick={handleSaveCommercialConsent} disabled={commercialConsent === null}>
              Salva preferenza
            </SottocheckActionButton>
            {commercialSaved && (
              <span
                className="inline-flex items-center gap-1.5 text-[var(--foreground)]"
                style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}
              >
                <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
                Salvata
              </span>
            )}
          </div>
        </FormSection>

        <FormSection title="Termini e privacy">
          <div className="divide-y divide-[var(--border)]">
            <LegalStatusRow
              label="Termini e condizioni"
              statusText={termsAccepted === true ? 'Accettati' : 'Stato non registrato nel prototipo'}
              recorded={termsAccepted === true}
            />
            <LegalStatusRow
              label="Informativa privacy"
              statusText={
                privacyAcknowledged === true
                  ? 'Presa visione registrata'
                  : 'Stato non registrato nel prototipo'
              }
              recorded={privacyAcknowledged === true}
            />
          </div>
          <p
            className="mt-4 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
          >
            Informazioni di sola lettura. Testo, versione e link saranno definiti dal team legale.
          </p>
        </FormSection>

        <div>
          <CrossSurfaceLink to="/public-view/profilo" label="Vai al profilo personale" />
        </div>
      </div>
    </PageShell>
  );
}

// ─── Layout primitives (local, neutral-first — same pattern as the Profile page) ──
function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="py-[32px]">
      <header className="mb-8 max-w-[760px]">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.3,
            color: 'var(--foreground)',
          }}
        >
          Account
        </h1>
        <p
          className="mt-2 text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
        >
          Gestisci l&apos;accesso al tuo account, la preferenza di comunicazioni commerciali e consulta lo
          stato di Termini e Informativa privacy.
        </p>
      </header>
      <div className="max-w-[760px]">{children}</div>
    </div>
  );
}

function NeutralCard({ title, body }: { title: string; body: string }) {
  return (
    <section
      className="border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
      style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h2>
      <p
        className="mt-2 text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}
      >
        {body}
      </p>
    </section>
  );
}
