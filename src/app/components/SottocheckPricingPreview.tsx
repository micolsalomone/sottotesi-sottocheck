interface SottocheckPricingPreviewProps {
  className?: string;
}

export function SottocheckPricingPreview({ className }: SottocheckPricingPreviewProps) {
  return (
    <div className={className}>
      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        style={{ maxWidth: '620px' }}
      >
        <div
          className="border border-[var(--border)] bg-[var(--background)] p-3"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <p
            className="text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Caratteri documento
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            28.500 caratteri
          </p>
        </div>

        <div
          className="border border-[var(--border)] bg-[var(--background)] p-3"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <p
            className="text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Prezzo check
          </p>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            EUR 14.90
          </p>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Prezzo reale del check per questo documento: visibile prima del pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}