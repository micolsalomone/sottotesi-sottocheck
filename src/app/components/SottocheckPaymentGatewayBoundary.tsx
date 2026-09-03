import { Loader2 } from 'lucide-react';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';

interface SottocheckPaymentGatewayBoundaryProps {
  onCancelled: () => void;
  onFailed: () => void;
  onSuccess: () => void;
}

export function SottocheckPaymentGatewayBoundary({
  onCancelled,
  onFailed,
  onSuccess,
}: SottocheckPaymentGatewayBoundaryProps) {
  return (
    <>
      <h1 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h2)', fontWeight: 'var(--font-weight-bold)' }}>
        Reindirizzamento al pagamento
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        Stai per essere reindirizzato al provider di pagamento per completare la transazione.
      </p>
      <div className="mt-6 flex items-center gap-3 border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>Preparazione del pagamento...</span>
      </div>
      <SottocheckActionButton className="mt-5" variant="secondary" onClick={onCancelled}>
        Annulla e torna al checkout
      </SottocheckActionButton>
      <details className="mt-6 border-t border-[var(--border)] pt-4">
        <summary className="cursor-pointer text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-sm)' }}>
          Verifica gli esiti del pagamento
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <SottocheckActionButton variant="secondary" className="px-[12px] py-[8px]" onClick={onSuccess}>Ricevi esito positivo</SottocheckActionButton>
          <SottocheckActionButton variant="secondary" className="px-[12px] py-[8px]" onClick={onFailed}>Ricevi esito negativo</SottocheckActionButton>
        </div>
      </details>
    </>
  );
}
