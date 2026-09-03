import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { SottocheckHistoryStatusBadge } from '@/app/components/SottocheckHistoryStatusBadge';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CoachCheckLiberoBadge } from '@/app/components/CoachCheckLiberoBadge';
import { getCoachPersistentChecksForOwner, isCoachFreeCheck } from '@/app/data/tesicheckCoachCheck';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';
import { COACH_VIEW_COACH_ID } from '@/app/utils/coachView';
import { getFileTypeFromName } from '@/app/utils/fileTypeUtils';

/**
 * Coach Storico TesiCheck — path-bound persistent records only.
 *
 * Reads the Coach store (`coach-tesicheck-checks-v1`) filtered by the Coach
 * owner id; never the consumer paid store. Shares the redesigned consumer
 * History visual grammar (compact card, document identity left, status/action
 * cluster right). Two record contexts, branched on `binding.mode`:
 * `coaching_path` shows Student · Percorso and the credits consumed by THIS
 * check; `check_libero` shows the `Check libero` context badge and the price
 * paid. Remaining / total / cumulative credits are never surfaced, and a free
 * check never shows a Student or a path.
 */
const REPORT_BASE_PATH = '/coach-view/report';
const NEW_CHECK_PATH = '/coach-view/sottocheck';

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function CoachHistoryPage() {
  const navigate = useNavigate();
  const checks = getCoachPersistentChecksForOwner(COACH_VIEW_COACH_ID);
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
          I TesiCheck completati — sui percorsi coaching e liberi a pagamento — restano disponibili qui fino alla data di scadenza del report.
        </p>
      </div>

      {checks.length === 0 ? (
        <HistoryEmptyState onNewCheck={() => navigate(NEW_CHECK_PATH)} />
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
                        {isCoachFreeCheck(check) ? (
                          <>
                            <span className="mt-0.5 mb-0.5 self-start">
                              <CoachCheckLiberoBadge />
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              Prezzo pagato: {formatCheckoutPrice(check.price)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[var(--foreground)]">
                              {check.binding.studentName} · {check.binding.pathLabel}
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              Crediti usati: {check.creditsUsed}
                            </span>
                          </>
                        )}
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
                        onClick={() => navigate(`${REPORT_BASE_PATH}/${check.id}`)}
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

function HistoryEmptyState({ onNewCheck }: { onNewCheck: () => void }) {
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
        I TesiCheck completati compariranno qui — sui percorsi coaching con studente e percorso, quelli liberi con il prezzo pagato — insieme alla data di disponibilità del report.
      </p>
      <SottocheckActionButton className="mt-5 px-[16px] py-[10px]" onClick={onNewCheck}>
        Nuovo TesiCheck
      </SottocheckActionButton>
    </div>
  );
}
