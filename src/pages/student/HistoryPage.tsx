import { FileText, Download } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { SottocheckHistoryStatusBadge, type SottocheckHistoryStatus } from '@/app/components/SottocheckHistoryStatusBadge';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { getPersistentTesiChecksForOwner } from '@/app/data/tesicheckPersistentCheck';
import { DEMO_ACCOUNT_ID } from '@/app/data/tesicheckAccountSession';
import { STUDENT_VIEW_STUDENT_ID } from '@/app/utils/studentView';
import { getFileTypeFromName } from '@/app/utils/fileTypeUtils';

/**
 * Consumer TesiCheck History / Storico.
 *
 * - `context="standalone"` → authenticated standalone workspace (`/public-view/history`)
 * - `context="student"`    → Student shell (`/student-view/history`)
 * - no `context`           → legacy `/public` acquisition route: unchanged mock
 *   behaviour, deliberately NOT wired to the persistent paid-check store.
 */
type ConsumerHistoryContext = 'standalone' | 'student';

interface HistoryPageProps {
  context?: ConsumerHistoryContext;
}

const CONTEXT_CONFIG: Record<
  ConsumerHistoryContext,
  {
    ownerContext: ConsumerHistoryContext;
    ownerId: string;
    reportBasePath: string;
    /** New-check entry point for the empty state, or null when none is safe. */
    newCheckPath: string | null;
    newCheckLabel: string;
  }
> = {
  standalone: {
    ownerContext: 'standalone',
    ownerId: DEMO_ACCOUNT_ID,
    reportBasePath: '/public-view/report',
    // `/public-view/sottocheck` still renders the legacy SottocheckPage (fake
    // payment, writes nothing, known getViewBasePath navigation bug — handoff §7).
    // Not a safe authenticated entry point, so the standalone empty state has no CTA.
    newCheckPath: null,
    newCheckLabel: 'Nuovo TesiCheck',
  },
  student: {
    ownerContext: 'student',
    ownerId: STUDENT_VIEW_STUDENT_ID,
    reportBasePath: '/student-view/report',
    newCheckPath: '/student-view/sottocheck',
    newCheckLabel: 'Nuovo TesiCheck',
  },
};

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function HistoryPage({ context }: HistoryPageProps) {
  if (!context) {
    return <LegacyPublicHistory />;
  }
  return <ConsumerTesiCheckHistory context={context} />;
}

function ConsumerTesiCheckHistory({ context }: { context: ConsumerHistoryContext }) {
  const navigate = useNavigate();
  const config = CONTEXT_CONFIG[context];
  const checks = useMemo(
    () => getPersistentTesiChecksForOwner(config.ownerContext, config.ownerId),
    [config.ownerContext, config.ownerId],
  );
  const now = Date.now();

  return (
    <div className="py-[32px]">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Storico TesiCheck
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          I TesiCheck completati restano disponibili qui fino alla data di scadenza del report.
        </p>
      </div>

      {checks.length === 0 ? (
        <HistoryEmptyState
          onNewCheck={config.newCheckPath ? () => navigate(config.newCheckPath as string) : undefined}
          newCheckLabel={config.newCheckLabel}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {checks.map((check) => {
            const isExpired = new Date(check.expiresAt).getTime() <= now;
            // Document identity visual: format-driven icon + colour from the shared
            // presentation-only utility (PDF red, DOC/DOCX blue, else muted).
            const fileInfo = getFileTypeFromName(check.document.name);
            const DocumentIcon = fileInfo.icon;
            return (
              <div
                key={check.id}
                className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[16px]"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="flex gap-4 min-w-0">
                    <div
                      className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--muted)]"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      <DocumentIcon className={`w-5 h-5 ${fileInfo.color}`} />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className="truncate"
                        style={{
                          fontFamily: 'var(--font-alegreya)',
                          fontSize: 'var(--text-h3)',
                          fontWeight: 'var(--font-weight-medium)',
                          lineHeight: 1.3,
                          color: 'var(--foreground)',
                        }}
                      >
                        {check.document.name}
                      </h3>

                      <div
                        className="mt-1 flex flex-col gap-0.5"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                        }}
                      >
                        <span className="text-[var(--muted-foreground)]">
                          Completato il {formatLongDate(check.completedAt)}
                        </span>
                        <span
                          style={{
                            color: isExpired ? 'var(--muted-foreground)' : 'var(--foreground)',
                            fontWeight: isExpired
                              ? 'var(--font-weight-regular)'
                              : 'var(--font-weight-medium)',
                          }}
                        >
                          {isExpired
                            ? `Scaduto il ${formatLongDate(check.expiresAt)}`
                            : `Disponibile fino al ${formatLongDate(check.expiresAt)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-[60px] sm:flex-col sm:items-end sm:gap-3 sm:pl-0">
                    <SottocheckHistoryStatusBadge status={isExpired ? 'expired' : 'completed'} />
                    {!isExpired && (
                      <SottocheckActionButton
                        className="px-[16px] py-[10px]"
                        onClick={() => navigate(`${config.reportBasePath}/${check.id}`)}
                      >
                        Apri report
                      </SottocheckActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryEmptyState({
  onNewCheck,
  newCheckLabel,
}: {
  onNewCheck?: () => void;
  newCheckLabel: string;
}) {
  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[40px] text-center"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div
        className="w-11 h-11 mx-auto flex items-center justify-center bg-[var(--muted)]"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <FileText className="w-5 h-5 text-[var(--muted-foreground)]" />
      </div>
      <h2
        className="mt-4"
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
        }}
      >
        Nessun TesiCheck nello storico
      </h2>
      <p
        className="mt-2 mx-auto max-w-[420px] text-[var(--muted-foreground)]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: 1.6,
        }}
      >
        I TesiCheck completati compariranno qui insieme alla data di disponibilità del report.
      </p>
      {onNewCheck && (
        <SottocheckActionButton className="mt-5 px-[16px] py-[10px]" onClick={onNewCheck}>
          {newCheckLabel}
        </SottocheckActionButton>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Legacy `/public/history` — unchanged. Not part of the paid-consumer        */
/* History redesign and deliberately not wired to `public-tesicheck-checks-v1`. */
/* -------------------------------------------------------------------------- */

interface LegacyHistoryItem {
  id: string;
  documentName: string;
  pagesSelected: number;
  price: number;
  status: SottocheckHistoryStatus;
  createdAt: string;
}

const mockHistory: LegacyHistoryItem[] = [
  {
    id: '1',
    documentName: 'Tesi_Capitolo_1.pdf',
    pagesSelected: 25,
    price: 12.5,
    status: 'completed',
    createdAt: '2026-02-08T14:30:00Z',
  },
  {
    id: '2',
    documentName: 'Ricerca_Bibliografica.docx',
    pagesSelected: 15,
    price: 7.5,
    status: 'processing',
    createdAt: '2026-02-09T10:15:00Z',
  },
];

function formatLegacyDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadLegacyReport(check: LegacyHistoryItem) {
  const reportLines = [
    'Report TesiCheck',
    `ID controllo: ${check.id}`,
    `Documento: ${check.documentName}`,
    `Pagine analizzate: ${check.pagesSelected}`,
    `Costo: EUR ${check.price.toFixed(2)}`,
    `Stato: ${check.status}`,
    `Creato il: ${formatLegacyDate(check.createdAt)}`,
  ];

  const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-tesicheck-${check.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function LegacyPublicHistory() {
  return (
    <div className="py-[32px]">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Storico TesiCheck
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Visualizza tutti i controlli plagio effettuati sul tuo percorso
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {mockHistory.map((check) => (
          <div
            key={check.id}
            className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[20px]"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className="flex gap-4">
              <div
                className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--muted)]"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <FileText className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3
                    className="truncate"
                    style={{
                      fontFamily: 'var(--font-alegreya)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-medium)',
                      lineHeight: 1.3,
                      color: 'var(--foreground)',
                    }}
                  >
                    {check.documentName}
                  </h3>
                  <SottocheckHistoryStatusBadge status={check.status} />
                </div>

                <div
                  className="flex gap-6 flex-wrap text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  <span>{check.pagesSelected} pagine</span>
                  <span>€{check.price.toFixed(2)}</span>
                  <span>{formatLegacyDate(check.createdAt)}</span>
                </div>

                {check.status === 'completed' && (
                  <button
                    onClick={() => downloadLegacyReport(check)}
                    className="mt-3 inline-flex items-center gap-2 px-[12px] py-[8px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Scarica report
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
