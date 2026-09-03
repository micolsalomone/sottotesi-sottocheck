/**
 * Contextual "Check libero" marker for Coach TesiCheck records.
 *
 * This is a context/type label, NOT an availability status. `Completato` /
 * `Scaduto` remain the only availability statuses and stay on
 * `SottocheckHistoryStatusBadge`. Restrained neutral treatment (border + muted
 * text, no icon, no success/warning colour) so it distinguishes the record
 * without competing with the status badge. Shared by Coach History and the
 * Coach report header.
 */
export function CoachCheckLiberoBadge() {
  return (
    <span
      className="inline-flex items-center px-[10px] py-[4px]"
      style={{
        borderRadius: 'var(--radius-badge)',
        border: '1px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--muted-foreground)',
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      Check libero
    </span>
  );
}
