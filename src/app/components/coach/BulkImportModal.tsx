import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ListPlus } from 'lucide-react';

export interface ParsedPhase {
  title: string;
  startDate: string | null;
  deadline: string | null;
  description: string | null;
}

interface PhaseRow {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD or ''
  deadline: string;  // YYYY-MM-DD or ''
  description: string;
}

/** Formats a YYYY-MM-DD string to Italian locale, e.g. "15 aprile 2026" */
function formatDateIT(isoDate: string): string | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

function createEmptyRow(): PhaseRow {
  return { id: crypto.randomUUID(), title: '', startDate: '', deadline: '', description: '' };
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-regular)',
  borderRadius: 'var(--radius)',
};

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (phases: ParsedPhase[]) => void;
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [rows, setRows] = useState<PhaseRow[]>([createEmptyRow()]);

  const updateRow = useCallback((id: string, field: keyof PhaseRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      return next.length === 0 ? [createEmptyRow()] : next;
    });
  }, []);

  const validRows = rows.filter(r => r.title.trim().length > 0);
  const hasValidPhases = validRows.length > 0;

  const handleImport = useCallback(() => {
    if (!hasValidPhases) return;
    const phases: ParsedPhase[] = validRows.map(r => ({
      title: r.title.trim(),
      startDate: formatDateIT(r.startDate),
      deadline: formatDateIT(r.deadline),
      description: r.description.trim() || null,
    }));
    onImport(phases);
    setRows([createEmptyRow()]);
    onClose();
  }, [hasValidPhases, validRows, onImport, onClose]);

  const handleClose = useCallback(() => {
    setRows([createEmptyRow()]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onMouseDown={handleClose}
    >
      <div
        className="bg-[var(--card)] border border-[var(--border)] w-full max-w-[720px] max-h-[90vh] flex flex-col"
        style={{
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--elevation-md, 0 4px 24px rgba(0,0,0,0.12))',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 bg-[var(--muted)]"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <ListPlus className="w-4 h-4 text-[var(--muted-foreground)]" />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Aggiungi fasi
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            style={{ borderRadius: 'var(--radius)', border: 'none', background: 'none' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Column headers */}
          <div className="flex items-center gap-2" style={{ paddingLeft: '28px', paddingRight: '36px' }}>
            <span
              className="flex-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Titolo *
            </span>
            <span
              className="w-[130px] flex-shrink-0"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Inizio
            </span>
            <span
              className="w-[130px] flex-shrink-0"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Scadenza
            </span>
          </div>

          {/* Phase rows */}
          <div className="flex flex-col gap-2">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex flex-col gap-1.5">
                {/* Main row */}
                <div className="flex items-center gap-2">
                  <span
                    className="flex-shrink-0 w-6 text-center text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* Title */}
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                    placeholder="Nome della fase"
                    className="flex-1 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
                    style={inputStyle}
                  />

                  {/* Start date */}
                  <input
                    type="date"
                    value={row.startDate}
                    onChange={(e) => updateRow(row.id, 'startDate', e.target.value)}
                    className="w-[130px] flex-shrink-0 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] px-2 py-2 focus:outline-none focus:border-[var(--foreground)] transition-colors"
                    style={inputStyle}
                  />

                  {/* Deadline */}
                  <input
                    type="date"
                    value={row.deadline}
                    onChange={(e) => updateRow(row.id, 'deadline', e.target.value)}
                    className="w-[130px] flex-shrink-0 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] px-2 py-2 focus:outline-none focus:border-[var(--foreground)] transition-colors"
                    style={inputStyle}
                  />

                  {/* Delete */}
                  <button
                    onClick={() => removeRow(row.id)}
                    className="flex-shrink-0 p-1.5 text-[var(--muted-foreground)] hover:text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] transition-colors cursor-pointer"
                    style={{ borderRadius: 'var(--radius)', border: 'none', background: 'none' }}
                    title="Rimuovi fase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Description row (appears when title is filled) */}
                {row.title.trim().length > 0 && (
                  <div className="flex items-center gap-2" style={{ paddingLeft: '28px', paddingRight: '36px' }}>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      placeholder="Descrizione (opzionale)"
                      className="flex-1 border border-[var(--border)] bg-[var(--input-background)] text-[var(--muted-foreground)] px-3 py-1.5 focus:outline-none focus:border-[var(--foreground)] focus:text-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
                      style={{
                        ...inputStyle,
                        fontSize: '12px',
                        borderStyle: 'dashed',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add phase button */}
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer self-start"
            style={{
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            <Plus className="w-4 h-4" />
            Aggiungi fase
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <p
            className="text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              margin: 0,
            }}
          >
            {hasValidPhases
              ? <>Le fasi verranno create come <strong style={{ fontWeight: 'var(--font-weight-medium)' }}>confermate</strong> con stato "Prossima fase"</>
              : 'Inserisci almeno un titolo per continuare'
            }
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleImport}
              disabled={!hasValidPhases}
              className={`px-4 py-2 transition-colors ${
                hasValidPhases
                  ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 cursor-pointer'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
              }`}
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                border: 'none',
              }}
            >
              {hasValidPhases
                ? `Aggiungi ${validRows.length} ${validRows.length === 1 ? 'fase' : 'fasi'}`
                : 'Aggiungi fasi'
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}