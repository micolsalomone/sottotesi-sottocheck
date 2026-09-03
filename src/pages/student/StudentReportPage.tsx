import { Download, MessageSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { STUDENT_VIEW_STUDENT_ID } from '@/app/utils/studentView';
import { SottocheckActionButton } from '@/app/components/SottocheckActionButton';
import { getPersistentTesiCheck } from '@/app/data/tesicheckPersistentCheck';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function StudentReportPage() {
  const navigate = useNavigate();
  const { checkId } = useParams();
  const check = checkId ? getPersistentTesiCheck(checkId) : null;
  const completedAt = check ? new Date(check.completedAt) : null;
  const expiresAt = check ? new Date(check.expiresAt) : null;
  const isValidCheck = check
    && check.owner.context === 'student'
    && check.owner.id === STUDENT_VIEW_STUDENT_ID
    && check.status === 'completed'
    && check.report.availability === 'available'
    && completedAt
    && expiresAt
    && !Number.isNaN(completedAt.getTime())
    && !Number.isNaN(expiresAt.getTime());
  const isExpired = Boolean(isValidCheck && expiresAt && expiresAt < new Date());

  const downloadReport = () => {
    if (!check) return;
    const content = [
      'Report TesiCheck',
      `Check ID: ${check.id}`,
      `Documento: ${check.document.name}`,
      `Completato: ${formatDate(check.completedAt)}`,
      `Disponibile fino al: ${formatDate(check.expiresAt)}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-tesicheck-${check.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isValidCheck || isExpired) {
    return (
      <StudentReportState
        title={isExpired ? 'Report scaduto' : 'Report non disponibile'}
        description={isExpired ? 'Il report non è più disponibile. Puoi consultare i dati del check nello Storico TesiCheck.' : 'Non abbiamo trovato un report disponibile per questo controllo.'}
        onAction={() => navigate('/student-view/history')}
      />
    );
  }

  const previewUrl = new URL('sottocheck-output-preview.html', window.location.origin + import.meta.env.BASE_URL);
  previewUrl.searchParams.set('mode', 'authenticated-public');
  previewUrl.searchParams.set('back', '/student-view/history');
  previewUrl.searchParams.set('documentName', check.document.name);
  previewUrl.searchParams.set('completedAt', formatDate(check.completedAt));
  Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => href.endsWith('.css'))
    .forEach((href) => previewUrl.searchParams.append('css', new URL(href, window.location.origin).toString()));

  return (
    <div className="py-[32px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.3 }}>Report TesiCheck</h1>
          <p className="mt-1 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)' }}>{check.document.name} · Completato il {formatDate(check.completedAt)}</p>
        </div>
        <SottocheckActionButton onClick={downloadReport} icon={<Download className="h-4 w-4" />}>Scarica report</SottocheckActionButton>
      </header>

      <iframe title={`Report TesiCheck ${check.document.name}`} src={previewUrl.toString()} className="w-full border-0 bg-[var(--background)]" style={{ height: '820px', borderRadius: 'var(--radius)' }} />

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="border border-[var(--border)] bg-[var(--card)] p-6" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>Conserva il report</p>
          <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>Disponibile fino al {formatDate(check.expiresAt)}</h2>
          <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}>Scarica il report entro questa data se vuoi conservarne una copia.</p>
          <SottocheckActionButton className="mt-5" onClick={downloadReport} icon={<Download className="h-4 w-4" />}>Scarica report</SottocheckActionButton>
        </article>
        <article className="border border-[var(--border)] bg-[var(--card)] p-6" style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--elevation-sm)' }}>
          <p className="uppercase tracking-[0.08em] text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>Supporto percorso</p>
          <h2 className="mt-2" style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)' }}>Hai bisogno di aiuto sul report?</h2>
          <p className="mt-2 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', lineHeight: 1.6 }}>Confrontati con il tuo Coach per approfondire l'esito del controllo nel percorso di tesi.</p>
          <button type="button" className="mt-5 inline-flex items-center gap-2 text-[var(--foreground)] hover:underline" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)' }} onClick={() => navigate('/student-view/studenti')}>
            <MessageSquare className="h-4 w-4" /> Vai al tuo percorso
          </button>
        </article>
      </section>
    </div>
  );
}

function StudentReportState({ title, description, onAction }: { title: string; description: string; onAction: () => void }) {
  return (
    <div className="py-[32px]">
      <section className="max-w-[720px] border border-[var(--border)] bg-[var(--card)] p-6 md:p-8" style={{ borderRadius: 'var(--radius)' }}>
        <h1 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h1)', fontWeight: 'var(--font-weight-bold)' }}>{title}</h1>
        <p className="mt-3 text-[var(--muted-foreground)]" style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>{description}</p>
        <SottocheckActionButton className="mt-6" onClick={onAction}>Vai allo storico TesiCheck</SottocheckActionButton>
      </section>
    </div>
  );
}
