import { FileText, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';

type HistoryItemStatus = 'completed' | 'processing' | 'error';

interface HistoryItem {
  id: string;
  documentName: string;
  pagesSelected: number;
  price: number;
  status: HistoryItemStatus;
  createdAt: string;
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    documentName: 'Tesi_Capitolo_1.pdf',
    pagesSelected: 25,
    price: 12.5,
    status: 'completed',
    createdAt: '2026-02-08T14:30:00Z',
  },
  {
    id: '2',
    documentName: 'Ricerca_Bibliografica.docx',
    pagesSelected: 15,
    price: 7.5,
    status: 'processing',
    createdAt: '2026-02-09T10:15:00Z',
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: HistoryItemStatus }) {
  if (status === 'completed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-[10px] py-[4px]"
        style={{
          borderRadius: 'var(--radius-badge)',
          background: 'rgba(11,182,63,0.10)',
          color: 'var(--primary)',
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <CheckCircle className="w-3 h-3" />
        Completato
      </span>
    );
  }

  if (status === 'processing') {
    return (
      <span
        className="inline-flex items-center gap-1 px-[10px] py-[4px]"
        style={{
          borderRadius: 'var(--radius-badge)',
          background: 'rgba(46,144,250,0.10)',
          color: 'var(--chart-2)',
          fontFamily: 'var(--font-inter)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-medium)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <Clock className="w-3 h-3" />
        In elaborazione
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-[10px] py-[4px]"
      style={{
        borderRadius: 'var(--radius-badge)',
        background: 'rgba(220,38,38,0.10)',
        color: 'var(--destructive-foreground)',
        fontFamily: 'var(--font-inter)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <AlertCircle className="w-3 h-3" />
      Errore
    </span>
  );
}

function downloadReport(check: HistoryItem) {
  const reportLines = [
    'Report Sottocheck',
    `ID controllo: ${check.id}`,
    `Documento: ${check.documentName}`,
    `Pagine analizzate: ${check.pagesSelected}`,
    `Costo: EUR ${check.price.toFixed(2)}`,
    `Stato: ${check.status}`,
    `Creato il: ${formatDate(check.createdAt)}`,
  ];

  const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-sottocheck-${check.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryPage() {
  return (
    <div className="px-[40px] py-[32px]">
      <div className="mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'var(--text-h1)',
            fontWeight: 'var(--font-weight-bold)',
            lineHeight: 1.5,
            color: 'var(--foreground)',
          }}
        >
          Storico Sottocheck
        </h1>
        <p
          className="mt-1 text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          Visualizza tutti i controlli plagio effettuati sul tuo percorso
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {mockHistory.map((check) => (
          <div
            key={check.id}
            className="bg-[var(--card)] border border-[var(--border)] px-[24px] py-[20px]"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <div className="flex gap-4">
              <div
                className="w-11 h-11 shrink-0 flex items-center justify-center bg-[var(--muted)]"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <FileText className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3
                    className="truncate"
                    style={{
                      fontFamily: 'var(--font-alegreya)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-medium)',
                      lineHeight: 1.3,
                      color: 'var(--foreground)',
                    }}
                  >
                    {check.documentName}
                  </h3>
                  <StatusBadge status={check.status} />
                </div>

                <div
                  className="flex gap-6 flex-wrap text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                  }}
                >
                  <span>{check.pagesSelected} pagine</span>
                  <span>€{check.price.toFixed(2)}</span>
                  <span>{formatDate(check.createdAt)}</span>
                </div>

                <button
                  onClick={() => downloadReport(check)}
                  className="mt-3 inline-flex items-center gap-2 px-[12px] py-[8px] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  Scarica report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
