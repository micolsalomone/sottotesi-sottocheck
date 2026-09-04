import { FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { CoachCheckLiberoBadge } from '@/app/components/CoachCheckLiberoBadge';
import { HistoryCheckTitle } from '@/app/components/HistoryCheckTitle';
import { getCoachPersistentChecksForOwner, isCoachFreeCheck, renameCoachCheckTitle } from '@/app/data/tesicheckCoachCheck';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';
import { COACH_VIEW_COACH_ID } from '@/app/utils/coachView';
import { getFileTypeFromName } from '@/app/utils/fileTypeUtils';

/**
 * Coach Storico TesiCheck — persistent archive of the Coach's checks.
 *
 * Reads the Coach store (`coach-tesicheck-checks-v1`) filtered by the Coach
 * owner id; never the consumer paid store. Shares the consumer History visual
 * grammar (compact card, identity left, action right). Every completed record
 * stays openable — there is no expiry. Two record contexts, branched on
 * `binding.mode`: `coaching_path` shows Student · Percorso and the credits
 * consumed by THIS check; `check_libero` shows the `Check libero` context badge
 * and the price paid. Remaining / total / cumulative credits are never surfaced,
 * and a free check never shows a Student or a path. The semantic check title is
 * the primary identity; the original filename is secondary metadata.
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
  // Prototype localStorage store: bump a local counter to re-read after a rename.
  const [renameVersion, setRenameVersion] = useState(0);
  const checks = useMemo(() => getCoachPersistentChecksForOwner(COACH_VIEW_COACH_ID), [renameVersion]);

  const handleRename = (checkId: string, nextTitle: string) => {
    renameCoachCheckTitle(checkId, nextTitle);
    setRenameVersion((value) => value + 1);
  };

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
          I TesiCheck completati — sui percorsi coaching e liberi a pagamento — restano sempre disponibili qui: puoi riaprire ogni report quando vuoi.
        </p>
      </div>

      {checks.length === 0 ? (
        <HistoryEmptyState onNewCheck={() => navigate(NEW_CHECK_PATH)} />
      ) : (
        <div className="flex flex-col gap-4">
          {checks.map((check) => {
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
                      <HistoryCheckTitle
                        title={check.title}
                        onRename={(nextTitle) => handleRename(check.id, nextTitle)}
                      />

                      <div
                        className="mt-1 flex flex-col gap-0.5"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                        }}
                      >
                        <span className="truncate text-[var(--muted-foreground)]">
                          {check.document.name}
                        </span>
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
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-[60px] sm:flex-col sm:items-end sm:gap-3 sm:pl-0">
                    <SottocheckActionButton
                      className="px-[16px] py-[10px]"
                      onClick={() => navigate(`${REPORT_BASE_PATH}/${check.id}`)}
                    >
                      Apri report
                    </SottocheckActionButton>
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
        I TesiCheck completati compariranno qui — sui percorsi coaching con studente e percorso, quelli liberi con il prezzo pagato — con titolo, documento e data di completamento.
      </p>
      <SottocheckActionButton className="mt-5 px-[16px] py-[10px]" onClick={onNewCheck}>
        Nuovo TesiCheck
      </SottocheckActionButton>
    </div>
  );
}
