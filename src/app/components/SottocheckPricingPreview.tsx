import { Loader2 } from 'lucide-react';
import { formatCheckoutPrice } from '@/app/utils/formatCheckoutPrice';

interface SottocheckPricingPreviewProps {
  className?: string;
  isUpdated?: boolean;
  isLoading?: boolean;
  characterCount?: number | null;
  price?: number | null;
}

export function SottocheckPricingPreview({
  className,
  isUpdated = false,
  isLoading = false,
  characterCount,
  price,
}: SottocheckPricingPreviewProps) {
  const hasPrice = characterCount !== null && characterCount !== undefined && price !== null && price !== undefined;
  const isReady = isUpdated || hasPrice;

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
            {isLoading ? 'Calcolo in corso...' : isReady ? `${characterCount?.toLocaleString('it-IT') ?? '28.500'} caratteri` : 'Calcolo automatico'}
          </p>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Costo indicativo: EUR 0,52/1000cc.
          </p>
        </div>

        <div
          className={`border bg-[var(--background)] p-3 transition-all duration-300 ${isReady ? 'animate-[pulse_1.1s_ease-in-out_1]' : ''}`}
          style={{
            borderRadius: 'var(--radius)',
            borderColor: isReady ? 'var(--primary)' : 'var(--border)',
            boxShadow: isReady ? '0 0 0 2px var(--selected-row-bg)' : 'none',
          }}
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
              color: isReady ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcolo in corso...
              </span>
            ) : isReady ? formatCheckoutPrice(price ?? 14.9) : 'Il prezzo sara mostrato qui'}
          </p>
        </div>
      </div>
    </div>
  );
}
