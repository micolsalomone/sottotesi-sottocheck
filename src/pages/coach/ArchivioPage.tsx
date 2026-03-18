import { Archive } from 'lucide-react';

export function ArchivioPage() {
  return (
    <div className="px-[40px] py-[32px]">
      <div className="mb-6">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Archivio
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Archivio documenti di tutti i percorsi coaching
        </p>
      </div>

      <div
        className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border)] bg-[var(--muted)]"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div
          className="flex items-center justify-center w-14 h-14 mb-4 bg-[var(--card)] border border-[var(--border)]"
          style={{ borderRadius: '50%' }}
        >
          <Archive className="w-6 h-6 text-[var(--muted-foreground)]" />
        </div>
        <p
          className="text-[var(--foreground)] mb-1 text-center"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Sezione in arrivo
        </p>
        <p
          className="text-[var(--muted-foreground)] text-center max-w-sm"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          L'archivio globale dei documenti sarà disponibile prossimamente.
        </p>
      </div>
    </div>
  );
}
