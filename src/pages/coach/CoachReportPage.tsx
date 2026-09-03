import { Download, LifeBuoy } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CoachCheckLiberoBadge } from '@/app/components/CoachCheckLiberoBadge';
import { getCoachPersistentCheck, isCoachFreeCheck } from '@/app/data/tesicheckCoachCheck';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';
import { COACH_VIEW_COACH_ID } from '@/app/utils/coachView';

const HISTORY_PATH = '/coach-view/archivio';

/**
 * Narrow, local type-safe read of Vite's base URL. The repo has no `vite/client`
 * types wired up, so `import.meta.env` is untyped project-wide (the sibling
 * report pages just let it error). This keeps the new file at the baseline
 * without touching tsconfig or global declarations. Behaviour is identical.
 */
const VITE_BASE_URL = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Coach TesiCheck report — serves both Coach record modes off one route.
 *
 * Separate wrapper from `PublicReportPage` / `StudentReportPage`: same static
 * report CONTENT, but Coach shell, Coach ownership guard and Coach support
 * semantics. Reads the Coach store (`coach-tesicheck-checks-v1`); never the
 * consumer paid store. Ownership / availability / expiry are mode-agnostic; only
 * the header + download metadata branch on `binding.mode` (via `isCoachFreeCheck`):
 * `coaching_path` shows Student · Percorso, `check_libero` shows the
 * `Check libero` badge + price paid and never a Student/path.
 */
export function CoachReportPage() {
  const navigate = useNavigate();
  const { checkId } = useParams();
  const check = checkId ? getCoachPersistentCheck(checkId) : null;

  const completedAt = check ? new Date(check.completedAt) : null;
  const expiresAt = check ? new Date(check.expiresAt) : null;
  const isValidCheck = Boolean(
    check
    && check.owner.context === 'coach'
    && check.owner.id === COACH_VIEW_COACH_ID
    && check.status === 'completed'
    && check.report.availability === 'available'
    && completedAt
    && expiresAt
    && !Number.isNaN(completedAt.getTime())
    && !Number.isNaN(expiresAt.getTime()),
  );
  const isExpired = Boolean(isValidCheck && expiresAt && expiresAt < new Date());

  const downloadReport = () => {
    if (!check) return;
    const lines = [
      'Report TesiCheck',
      `Check ID: ${check.id}`,
      `Documento: ${check.document.name}`,
    ];
    if (isCoachFreeCheck(check)) {
      lines.push('Tipo: Check libero');
      lines.push(`Prezzo pagato: ${formatCheckoutPrice(check.price)}`);
    } else {
      lines.push(`Studente: ${check.binding.studentName}`);
      lines.push(`Percorso: ${check.binding.pathLabel}`);
    }
    lines.push(`Completato: ${formatDate(check.completedAt)}`);
    lines.push(`Disponibile fino al: ${formatDate(check.expiresAt)}`);
    const content = lines.join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-tesicheck-${check.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isValidCheck || !check) {
    return (
      <CoachReportState
        title="Report non disponibile"
        description="Non abbiamo trovato un report disponibile per questo controllo."
        actionLabel="Vai allo storico TesiCheck"
        onAction={() => navigate(HISTORY_PATH)}
      />
    );
  }

  if (isExpired) {
    return (
      <CoachReportState
        title="Report non più disponibile"
        description={`Il report di questo controllo era disponibile fino al ${formatDate(check.expiresAt)}. Il documento e il report non sono più consultabili.`}
        actionLabel="Vai allo storico TesiCheck"
        onAction={() => navigate(HISTORY_PATH)}
      />
    );
  }

  const previewUrl = new URL('sottocheck-output-preview.html', window.location.origin + VITE_BASE_URL);
  previewUrl.searchParams.set('mode', 'authenticated-public');
  previewUrl.searchParams.set('back', HISTORY_PATH);
  previewUrl.searchParams.set('documentName', check.document.name);
  previewUrl.searchParams.set('completedAt', formatDate(check.completedAt));
  Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.endsWith('.css'))
    .forEach((href) => previewUrl.searchParams.append('css', new URL(href, window.location.origin).toString()));

  return (
    <div className="py-[32px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.3 }}>
              Report TesiCheck
            </h1>
            {isCoachFreeCheck(check) && <CoachCheckLiberoBadge />}
          </div>
          <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
            {isCoachFreeCheck(check)
              ? `${check.document.name} · ${formatCheckoutPrice(check.price)}`
              : `${check.document.name} · ${check.binding.studentName} · ${check.binding.pathLabel}`}
          </p>
          <p className="mt-0.5 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
            Completato il {formatDate(check.completedAt)}
          </p>
        </div>
        <SottocheckActionButton onClick={downloadReport} icon={<Download className="h-4 w-4" />}>
          Scarica report
        </SottocheckActionButton>
      </header>

      <iframe
        title={`Report TesiCheck ${check.document.name}`}
        src={previewUrl.toString()}
        className="w-full border-0 bg-[var(--background)]"
        style={{ height: '820px', borderRadius: 'var(--radius)' }}
      />

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="border border-[var(--border)] bg-[var(--card)] p-6" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Conserva il report
          </p>
          <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>
            Disponibile fino al {formatDate(check.expiresAt)}
          </h2>
          <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}>
            Scarica il report entro questa data se vuoi conservarne una copia.
          </p>
          <SottocheckActionButton className="mt-5" onClick={downloadReport} icon={<Download className="h-4 w-4" />}>
            Scarica report
          </SottocheckActionButton>
        </article>

        <article className="border border-[var(--border)] bg-[var(--card)] p-6" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            Supporto Sottotesi
          </p>
          <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>
            Serve un'escalation sul report?
          </h2>
          <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}>
            Segnala a Sottotesi eventuali anomalie o richieste di verifica su questo controllo.
          </p>
          <a
            href="mailto:info@sottotesi.it?subject=Escalation%20report%20TesiCheck%20(coach)"
            className="mt-5 inline-flex items-center gap-2 text-[var(--foreground)] hover:underline"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
          >
            <LifeBuoy className="h-4 w-4" /> Contatta Sottotesi
          </a>
        </article>
      </section>
    </div>
  );
}

function CoachReportState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="py-[32px]">
      <section className="max-w-[720px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)' }}>
        <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)' }}>{title}</h1>
        <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>{description}</p>
        <SottocheckActionButton className="mt-6" onClick={onAction}>{actionLabel}</SottocheckActionButton>
      </section>
    </div>
  );
}
