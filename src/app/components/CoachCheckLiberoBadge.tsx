/**
 * Contextual "Check libero" marker for Coach TesiCheck records.
 *
 * This is a context/type label, NOT an availability status. The Coach History
 * no longer renders an availability badge (every persistent record is completed
 * and stays openable — there is no expiry), so this is the only pill on a
 * `check_libero` row; it still must not read as a status. Restrained neutral
 * treatment (border + muted text, no icon, no success/warning colour). Shared by
 * Coach History and the Coach report header.
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
