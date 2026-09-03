import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';

interface SottocheckPaymentGatewayBoundaryProps {
  onCancelled: () => void;
  onFailed: () => void;
  onSuccess: () => void;
}

/** Simulated time spent "at the provider" before it returns success. */
const SIMULATED_REDIRECT_MS = 1500;

/** `?paymentDemo=1` keeps the return outcomes manual so edge cases stay testable. */
function isPaymentDemoMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paymentDemo') === '1';
}

/**
 * Transient boundary between the checkout and the (simulated) payment provider.
 * It is a system transition, not a checkout step: minimal Sottotesi brand mark,
 * no topbar, no order summary, no fake bank/card UI, no invented provider brand.
 *
 * Normal flow: after a short delay the simulated provider returns success and
 * the host page moves on to report generation.
 *
 * Test mode (`?paymentDemo=1`): success / failed / cancelled stay manual so the
 * deployed prototype can still reproduce every return path.
 */
export function SottocheckPaymentGatewayBoundary({
  onCancelled,
  onFailed,
  onSuccess,
}: SottocheckPaymentGatewayBoundaryProps) {
  const demoMode = isPaymentDemoMode();

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (demoMode) return;
    const timer = window.setTimeout(() => onSuccessRef.current(), SIMULATED_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [demoMode]);

  return (
    <div className="flex flex-col items-center text-center">
      <SottotesiLogodefDefault />

      <h1
        className="mt-6"
        style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}
      >
        Reindirizzamento al pagamento
      </h1>

      <p
        className="mt-4 flex items-center gap-2 text-[var(--muted-foreground)]"
        style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Reindirizzamento in corso…
      </p>

      {demoMode && (
        <div className="mt-8 w-full border-t border-[var(--border)] pt-4">
          <p
            className="text-[var(--muted-foreground)]"
            style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}
          >
            Modalità demo pagamento — simula l'esito di ritorno dal provider.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <SottocheckActionButton variant="secondary" className="px-[12px] py-[8px]" onClick={onSuccess}>
              Esito positivo
            </SottocheckActionButton>
            <SottocheckActionButton variant="secondary" className="px-[12px] py-[8px]" onClick={onFailed}>
              Esito negativo
            </SottocheckActionButton>
            <SottocheckActionButton variant="secondary" className="px-[12px] py-[8px]" onClick={onCancelled}>
              Annullato
            </SottocheckActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
