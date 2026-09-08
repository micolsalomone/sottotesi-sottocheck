import { ReactNode, useMemo } from 'react';
import { useLavorazioni } from '@/app/data/LavorazioniContext';
import { STUDENT_VIEW_STUDENT_RECORD_ID } from '@/app/utils/studentView';
import { FormSection } from '@/app/components/profile/ProfileFormPrimitives';
import {
  AccountInfoRow,
  CrossSurfaceLink,
  LegalStatusRow,
} from '@/app/components/account/AccountPrimitives';

/**
 * Student Account page (`/student-view/account`).
 *
 * Account/access/legal surface — distinct from the Student Profile
 * (`/student-view/profilo`, personal/academic data). Student-domain only: it
 * resolves the structured `Student` record via the prototype identity bridge,
 * the SAME source the Student Profile uses — never the standalone TesiCheck
 * account registry / session (Student does not use standalone credentials).
 *
 * The prototype has no Student password flow and no Student legal-acceptance
 * model, so those rows are neutral informational states. Nothing is fabricated;
 * production must supply real Student account/legal semantics. No Terms/Privacy
 * fields are added to `Student` for this slice.
 */
export function AccountPage() {
  const { students } = useLavorazioni();

  const student = useMemo(
    () => students.find((item) => item.id === STUDENT_VIEW_STUDENT_RECORD_ID) ?? null,
    [students],
  );

  const primaryEmail = useMemo(() => {
    if (!student) return '';
    return student.contacts?.emails?.find((entry) => entry.is_primary)?.email ?? student.email ?? '';
  }, [student]);

  if (!student) {
    return (
      <PageShell>
        <NeutralCard
          title="Account non disponibile"
          body="Non è stato possibile caricare l'account studente associato a questa area. Riprova più tardi."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <FormSection title="Accesso">
          <div className="divide-y divide-[var(--border)]">
            <AccountInfoRow label="Email" value={primaryEmail || '—'} />
            <AccountInfoRow
              label="Password"
              value="Gestione password non disponibile da questa area"
            />
          </div>
        </FormSection>

        <FormSection title="Termini e privacy">
          <div className="divide-y divide-[var(--border)]">
            <LegalStatusRow label="Termini e condizioni" statusText="Stato non disponibile" />
            <LegalStatusRow label="Informativa privacy" statusText="Stato non disponibile" />
          </div>
          <p
            className="mt-4 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
          >
            Lo stato delle accettazioni non è disponibile per questo account.
          </p>
        </FormSection>

        <div>
          <CrossSurfaceLink to="/student-view/profilo" label="Vai al profilo personale" />
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
          Dati di accesso dell&apos;account e stato di Termini e Informativa privacy.
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
