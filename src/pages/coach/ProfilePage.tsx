import { ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCoachViewProfile } from '@/app/components/coach/CoachViewProfileContext';
import { FormSection, TextField } from '@/app/components/profile/ProfileFormPrimitives';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CrossSurfaceLink } from '@/app/components/account/AccountPrimitives';

/**
 * Coach Profile (`/coach-view/profilo`).
 *
 * Self-service IA rule (same as Student/Public): account email, phone and
 * password belong to Account (`/coach-view/account`), not here — this page
 * owns only personal identity.
 *
 * Identity: reads/writes the Coach-view-local prototype fixture
 * (`CoachViewProfileContext`, scoped to `CoachLayout`) — NOT a shared CRM,
 * NOT the same record Admin's `/coach` page owns. See that context's doc
 * comment and `docs/production-handoff.md` → "Coach Profile/Account" for the
 * data/UX contract production must implement instead (binding this shell to
 * the real authenticated Coach record).
 *
 * The fixture only has `fullName` (no first/last split). `splitCoachFullName`
 * derives Nome/Cognome for editing only; on save the two are rejoined into
 * `fullName` — no larger name-schema modelling.
 *
 * `Aree tematiche di specializzazione` is READ-ONLY here: it reads
 * `profile.areas`, representative presentation-only fixture data (see
 * `CoachViewProfileContext`'s doc comment) — NOT a live read of
 * `AreeTematicheContext`/Admin's real area-assignment relationship, and NOT
 * kept in sync with it. No local copy of anything Admin-owned, no
 * multiselect, no add/remove control. The `Salva modifiche` action only
 * ever submits the personal-info fields; nothing here can change `areas`.
 */

function splitCoachFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = trimmed.split(' ');
  return { firstName, lastName: rest.join(' ') };
}

export function ProfilePage() {
  const { profile, updateProfile } = useCoachViewProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Re-seed only when the fixture's fullName actually changes (e.g. after
  // this same page's own save), so an in-progress edit is never clobbered.
  const prefillKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prefillKeyRef.current === profile.fullName) return;
    prefillKeyRef.current = profile.fullName;
    const split = splitCoachFullName(profile.fullName);
    setFirstName(split.firstName);
    setLastName(split.lastName);
  }, [profile.fullName]);

  // Dirty only relative to the persisted fixture fullName — same "blank
  // input preserves the stored value" fallback the submit handler applies,
  // so an empty field never reads as a pending change.
  const persisted = splitCoachFullName(profile.fullName);
  const effectiveFirst = firstName.trim() || persisted.firstName;
  const effectiveLast = lastName.trim() || persisted.lastName;
  const isDirty = effectiveFirst !== persisted.firstName || effectiveLast !== persisted.lastName;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextFullName = `${effectiveFirst} ${effectiveLast}`.trim() || profile.fullName;
    if (nextFullName !== profile.fullName) {
      updateProfile({ fullName: nextFullName });
    }

    toast.success('Informazioni salvate');
  };

  return (
    <PageShell>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Informazioni personali">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              id="coach-profile-first-name"
              label="Nome"
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
            />
            <TextField
              id="coach-profile-last-name"
              label="Cognome"
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
            />
          </div>

          {isDirty && (
            <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-6">
              <SottocheckActionButton type="submit">Salva modifiche</SottocheckActionButton>
            </div>
          )}
        </FormSection>
      </form>

      <div className="mt-6">
        <FormSection title="Aree tematiche di specializzazione">
          {profile.areas.length === 0 ? (
            <p
              className="text-[var(--muted-foreground)]"
              style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontStyle: 'italic', lineHeight: 1.6 }}
            >
              Nessuna area tematica associata.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.areas.map((area) => (
                <span
                  key={area}
                  style={{
                    display: 'inline-block',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-badge)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          )}
          <p
            className="mt-4 text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
          >
            Le aree tematiche sono gestite da Sottotesi.
          </p>
        </FormSection>
      </div>

      <div className="mt-6">
        <CrossSurfaceLink to="/coach-view/account" label="Gestisci account" />
      </div>
    </PageShell>
  );
}

// ─── Layout primitives (local, neutral-first — same pattern as Student/Public) ──
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
          Profilo coach
        </h1>
        <p
          className="mt-2 text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}
        >
          Gestisci le informazioni personali e consulta le aree tematiche associate al tuo profilo coach.
        </p>
      </header>
      <div className="max-w-[760px]">{children}</div>
    </div>
  );
}
