import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface HistoryCheckTitleProps {
  /** Current effective title of the check. */
  title: string;
  /**
   * Persist a new title. The parent owns the store mutation and the list
   * refresh; this component only drives the local edit UI. An empty string is a
   * valid argument — the store resolves it to a safe non-blank value.
   */
  onRename: (nextTitle: string) => void;
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-alegreya)',
  fontSize: 'var(--text-h3)',
  fontWeight: 'var(--font-weight-medium)',
  lineHeight: 1.3,
  color: 'var(--foreground)',
};

/**
 * The check title in a persistent History row, with an inline rename affordance.
 *
 * Role-agnostic: it knows nothing about standalone / Student / Coach. The parent
 * passes the current title and an `onRename` callback that performs the actual
 * store mutation and refreshes the list. Smallest interaction: a pencil button
 * that swaps the heading for a compact input with Salva / Annulla (Enter saves,
 * Esc cancels). It never competes with the row's primary `Apri report` action.
 */
export function HistoryCheckTitle({ title, onRename }: HistoryCheckTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const startEditing = () => {
    setDraft(title);
    setIsEditing(true);
  };

  const save = () => {
    onRename(draft);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              cancel();
            }
          }}
          aria-label="Titolo del TesiCheck"
          className="w-full border border-[var(--border)] bg-[var(--background)] px-[10px] py-[6px] control-focus-ring"
          style={{
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1 border border-[var(--border)] bg-[var(--background)] px-[10px] py-[6px] hover:bg-[var(--muted)] transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            <Check className="h-3.5 w-3.5" /> Salva
          </button>
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center gap-1 px-[10px] py-[6px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            <X className="h-3.5 w-3.5" /> Annulla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 min-w-0">
      <h3 className="truncate" style={titleStyle}>
        {title}
      </h3>
      <button
        type="button"
        onClick={startEditing}
        aria-label="Rinomina TesiCheck"
        title="Rinomina"
        className="shrink-0 mt-[3px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
