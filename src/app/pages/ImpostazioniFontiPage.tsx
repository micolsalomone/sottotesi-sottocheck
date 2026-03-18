import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLavorazioni } from '../data/LavorazioniContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.625rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-regular)',
  backgroundColor: 'var(--input-background)',
  color: 'var(--foreground)',
  outline: 'none',
  width: '100%',
  lineHeight: '1.5',
};

export function ImpostazioniFontiPage() {
  const { sources, addSource, removeSource } = useLavorazioni();
  const [newSourceName, setNewSourceName] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; source: string | null }>({
    open: false,
    source: null,
  });

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSourceName.trim()) {
      toast.error('Inserisci un nome per la fonte');
      return;
    }

    if (sources.includes(newSourceName.trim())) {
      toast.error('Questa fonte esiste già');
      return;
    }

    addSource(newSourceName.trim());
    toast.success('Fonte aggiunta con successo');
    setNewSourceName('');
  };

  const handleDeleteSource = (source: string) => {
    setDeleteDialog({ open: true, source });
  };

  const confirmDelete = () => {
    if (deleteDialog.source) {
      removeSource(deleteDialog.source);
      toast.success('Fonte eliminata');
      setDeleteDialog({ open: false, source: null });
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Fonti Acquisizione</h1>
        <p className="page-subtitle">Gestione fonti per pipeline di acquisizione lead</p>
        <style>{`
          @media (max-width: 768px) {
            .page-header {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
            }
          }
        `}</style>
      </div>

      {/* ADD NEW SOURCE */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          margin: '0 0 1rem 0',
          lineHeight: '1.5',
        }}>
          Aggiungi nuova fonte
        </h2>
        <form onSubmit={handleAddSource} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              marginBottom: '0.25rem',
              lineHeight: '1.5',
            }}>
              Nome fonte
            </label>
            <input
              type="text"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="es. LinkedIn, Facebook, ecc."
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: 'fit-content' }}
          >
            <Plus size={18} />
            Aggiungi
          </button>
        </form>
      </div>

      {/* SOURCES LIST */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          margin: '0 0 1rem 0',
          lineHeight: '1.5',
        }}>
          Fonti disponibili ({sources.length})
        </h2>
        
        {sources.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--muted)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            lineHeight: '1.5',
          }}>
            Nessuna fonte disponibile
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sources.map(source => (
              <div
                key={source}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--card)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  lineHeight: '1.5',
                }}>
                  {source}
                </span>
                <button
                  onClick={() => handleDeleteSource(source)}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.5rem',
                    minWidth: 'auto',
                    color: 'var(--destructive)',
                  }}
                  title="Elimina fonte"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, source: null })}
        onConfirm={confirmDelete}
        title="Elimina Fonte"
        description={`Sei sicuro di voler eliminare la fonte "${deleteDialog.source}"?`}
        confirmLabel="Elimina"
        variant="destructive"
      />
    </div>
  );
}
