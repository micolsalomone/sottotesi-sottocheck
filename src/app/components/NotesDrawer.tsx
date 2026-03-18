import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { AuditLog, AuditEntry } from './AuditLog';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerAddButton,
  DrawerInfoNote,
  drawerInputStyle,
  drawerSectionTitleStyle,
} from './DrawerPrimitives';

export interface Note {
  id: string;
  content: string;
  admin: string;
  timestamp: string;
}

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: string;
  entityName: string;
  notes: Note[];
  onAddNote: (content: string) => void;
  currentAdmin: string;
}

export function NotesDrawer({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
  notes,
  onAddNote,
  currentAdmin,
}: NotesDrawerProps) {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddNote();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewNote('');
    }
  };

  // Converti note in AuditEntry per riutilizzare AuditLog
  const auditEntries: AuditEntry[] = notes.map(note => ({
    id: note.id,
    action: 'Nota aggiunta',
    description: note.content,
    admin: note.admin,
    timestamp: note.timestamp,
  }));

  if (!isOpen) return null;

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell>
        <DrawerHeader
          icon={<MessageSquare size={20} />}
          title="Note interne"
          subtitle={`${entityType}: ${entityName}`}
          onClose={onClose}
        />

        <DrawerBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Form aggiunta nota ── */}
            {isAdding ? (
              <div
                style={{
                  padding: '0.875rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
              >
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrivi una nota interna..."
                  autoFocus
                  rows={4}
                  style={{
                    ...drawerInputStyle,
                    resize: 'vertical',
                    minHeight: '96px',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                      marginRight: 'auto',
                    }}
                  >
                    ⌘↵ per salvare
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewNote('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="btn btn-primary"
                    style={{
                      padding: '0.375rem 0.75rem',
                      opacity: newNote.trim() ? 1 : 0.5,
                    }}
                    disabled={!newNote.trim()}
                  >
                    Salva nota
                  </button>
                </div>
              </div>
            ) : (
              <DrawerAddButton onClick={() => setIsAdding(true)}>
                <Plus size={14} />
                Aggiungi nota
              </DrawerAddButton>
            )}

            {/* ── Storico note ── */}
            <div>
              <div style={{ ...drawerSectionTitleStyle, marginBottom: '0.75rem' }}>
                Storico note ({notes.length})
              </div>
              <AuditLog
                entries={auditEntries}
                emptyMessage="Nessuna nota presente. Aggiungi la prima nota per questa entità."
              />
            </div>

            {/* ── Nota informativa ── */}
            <DrawerInfoNote>
              Le note sono visibili solo agli amministratori
            </DrawerInfoNote>

          </div>
        </DrawerBody>
      </DrawerShell>
    </>
  );
}
