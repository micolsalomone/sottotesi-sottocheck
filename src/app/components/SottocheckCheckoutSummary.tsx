interface SottocheckCheckoutSummaryProps {
  documentName: string;
  characterCount: number;
  price: number;
  className?: string;
}

function formatPrice(price: number) {
  return price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Order summary shown alongside every checkout step (account, email verification,
 * payment, redirecting). Always titled "Riepilogo TesiCheck" — never "riepilogo
 * pagamento" — because it represents the current purchase, not a single step.
 * Desktop: sticky right rail. Mobile: compact collapsible row.
 */
export function SottocheckCheckoutSummary({
  documentName,
  characterCount,
  price,
  className = '',
}: SottocheckCheckoutSummaryProps) {
  return (
    <div className={`md:sticky md:top-[24px] md:self-start ${className}`}>
      {/* Mobile: compact, collapsible */}
      <details
        className="md:hidden border border-[var(--border)] bg-[var(--card)] p-4"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        <summary
          className="control-focus-ring flex cursor-pointer list-none items-center justify-between gap-3"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}
        >
          <span>Riepilogo TesiCheck · EUR {formatPrice(price)}</span>
          <span className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>Mostra dettagli</span>
        </summary>
        <div className="mt-4">
          <SummaryFields documentName={documentName} characterCount={characterCount} price={price} />
        </div>
      </details>

      {/* Desktop: sticky right rail */}
      <aside
        className="hidden border border-[var(--border)] bg-[var(--card)] p-5 md:block"
        style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}
      >
        <p
          className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}
        >
          Riepilogo TesiCheck
        </p>
        <div className="mt-4">
          <SummaryFields documentName={documentName} characterCount={characterCount} price={price} />
        </div>
      </aside>
    </div>
  );
}

function SummaryFields({
  documentName,
  characterCount,
  price,
}: {
  documentName: string;
  characterCount: number;
  price: number;
}) {
  return (
    <>
      <p className="break-words" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }}>
        {documentName}
      </p>
      <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>
        {characterCount.toLocaleString('it-IT')} caratteri
      </p>
      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <p className="text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>Totale</p>
        <p className="mt-1" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>
          EUR {formatPrice(price)}
        </p>
      </div>
    </>
  );
}
