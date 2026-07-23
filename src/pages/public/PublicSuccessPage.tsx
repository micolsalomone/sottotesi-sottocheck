import { useNavigate } from 'react-router';
import { SottocheckSuccessPanel } from '@/app/components/SottocheckSuccessPanel';

export function PublicSuccessPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-[20px]">
      <div className="w-full max-w-[600px]">
        <SottocheckSuccessPanel
          description="Il controllo plagio è stato completato con successo. Il tuo report è pronto e accessibile."
          primaryActionLabel="Visualizza il report"
          onPrimaryAction={() => navigate('/public/output-preview')}
          showEmailCapture
          footerNote="Non archiviamo i tuoi file: vengono processati solo per il check. Se non salvi il link via email, alla prossima sessione il report potrebbe non essere piu disponibile."
        />
      </div>
    </main>
  );
}