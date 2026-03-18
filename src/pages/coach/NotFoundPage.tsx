import { useLocation, useNavigate } from 'react-router';
import { getViewBasePath } from './viewBasePath';

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewBasePath = getViewBasePath(location.pathname);

  return (
    <div className="px-[40px] py-[32px] flex flex-col items-center justify-center min-h-[400px]">
      <p
        className="text-[var(--muted-foreground)] mb-4"
        style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h2)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--foreground)',
        }}
      >
        Pagina non trovata
      </p>
      <p
        className="text-[var(--muted-foreground)] mb-6"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
        }}
      >
        La pagina che stai cercando non esiste.
      </p>
      <button
        onClick={() => navigate(viewBasePath)}
        className="px-5 py-3 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
        style={{
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        Torna alla Dashboard
      </button>
    </div>
  );
}
