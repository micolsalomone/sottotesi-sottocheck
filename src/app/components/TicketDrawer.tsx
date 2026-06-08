import React, { useEffect, useState } from 'react';
import { Send, Ticket, Save } from 'lucide-react';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  DrawerFieldGroup,
  DrawerLabel,
  DrawerMetaRow,
  DrawerChip,
  DRAWER_WIDTH_DEFAULT,
  drawerInputStyle,
  drawerSelectStyle,
} from './DrawerPrimitives';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

export interface TicketMessage {
  id: string;
  content: string;
  author: string;
  authorType: 'admin' | 'coach' | 'student';
  timestamp: string;
}

export interface TicketData {
  id: string;
  subject: string;
  status: 'aperto' | 'in_lavorazione' | 'risolto';
  priority: 'alta' | 'media' | 'bassa';
  source: 'coach' | 'studente';
  category: string;
  createdAt: string;
  requesterName: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData | null;
  onSendMessage: (ticketId: string, content: string) => void;
  onSaveChanges: (ticketId: string, changes: { status: TicketData['status']; assignedTo?: string }) => void;
  currentAdmin: string;
  availableAdmins?: { id: string; name: string }[];
}

export function TicketDrawer({
  isOpen,
  onClose,
  ticket,
  onSendMessage,
  onSaveChanges,
  currentAdmin,
  availableAdmins = []
}: TicketDrawerProps) {
  const [newMessage, setNewMessage] = useState('');
  const [draftStatus, setDraftStatus] = useState<TicketData['status']>('aperto');
  const [draftAssignedTo, setDraftAssignedTo] = useState<string>('unassigned');
  const statusLabels: Record<TicketData['status'], string> = {
    aperto: 'Aperto',
    in_lavorazione: 'Preso in carico',
    risolto: 'Risolto',
  };

  const sourceLabels: Record<TicketData['source'], string> = {
    coach: 'Da coach',
    studente: 'Da studente',
  };

  useEffect(() => {
    if (!isOpen || !ticket) return;
    setDraftStatus(ticket.status);
    setDraftAssignedTo(ticket.assignedTo || 'unassigned');
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(ticket.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const hasPendingChanges = draftStatus !== ticket.status || draftAssignedTo !== (ticket.assignedTo || 'unassigned');

  const handleSaveChanges = () => {
    onSaveChanges(ticket.id, {
      status: draftStatus,
      assignedTo: draftAssignedTo === 'unassigned' ? undefined : draftAssignedTo,
    });
  };

  const getAuthorLabel = (authorType: string) => {
    switch (authorType) {
      case 'admin':
        return 'Admin';
      case 'coach':
        return 'Coach';
      case 'student':
        return 'Studente';
      default:
        return 'Utente';
    }
  };

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell width={DRAWER_WIDTH_DEFAULT}>
        <DrawerHeader
          icon={<Ticket size={20} />}
          title={ticket.subject}
          subtitle={`${ticket.id} · ${ticket.requesterName}`}
          onClose={onClose}
        />

        <DrawerMetaRow>
          Fonte: {sourceLabels[ticket.source]} · Priorita: {ticket.priority} · Stato: {statusLabels[ticket.status]} · Data: {formattedDate}
        </DrawerMetaRow>

        <DrawerBody>
          <DrawerSection title="Dettaglio ticket" bordered={false}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <DrawerChip label={sourceLabels[ticket.source]} />
              <DrawerChip label={`Priorita: ${ticket.priority}`} />
              <DrawerChip label={`Categoria: ${ticket.category}`} />
              <DrawerChip label={`Data: ${formattedDate}`} />
            </div>
          </DrawerSection>

          <DrawerSection title="Gestione ticket">
            <DrawerFieldGroup>
              <DrawerLabel htmlFor="ticket-status">Stato</DrawerLabel>
              <select
                id="ticket-status"
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as TicketData['status'])}
                style={drawerSelectStyle}
              >
                <option value="aperto">Aperto</option>
                <option value="in_lavorazione">Preso in carico</option>
                <option value="risolto">Risolto</option>
              </select>
            </DrawerFieldGroup>

            {availableAdmins.length > 0 && (
              <DrawerFieldGroup style={{ marginBottom: 0 }}>
                <DrawerLabel htmlFor="ticket-assignee">Assegnato a</DrawerLabel>
                <select
                  id="ticket-assignee"
                  value={draftAssignedTo}
                  onChange={(e) => setDraftAssignedTo(e.target.value)}
                  style={drawerSelectStyle}
                >
                  <option value="unassigned">Non assegnato</option>
                  {availableAdmins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.name}</option>
                  ))}
                </select>
              </DrawerFieldGroup>
            )}

            {hasPendingChanges && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--chart-3)',
                    lineHeight: '1.5',
                  }}
                >
                  Hai modifiche non salvate
                </p>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  title="Salva modifiche ticket"
                >
                  <Save size={16} /> Salva modifiche
                </button>
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Conversazione">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ticket.messages.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--muted)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                  }}
                >
                  Nessun messaggio. Inizia la conversazione.
                </div>
              ) : (
                ticket.messages.map((message) => {
                  const isAdminMessage = message.authorType === 'admin';
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isAdminMessage ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          borderRadius: 'var(--radius)',
                          padding: '0.625rem 0.75rem',
                          backgroundColor: isAdminMessage ? 'var(--primary)' : 'var(--muted)',
                          color: isAdminMessage ? 'var(--primary-foreground)' : 'var(--foreground)',
                          border: isAdminMessage ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-xs)',
                            lineHeight: '1.5',
                            opacity: 0.85,
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{message.author}</span>
                          <span>({getAuthorLabel(message.authorType)})</span>
                          <span>•</span>
                          <span>{message.timestamp}</span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            lineHeight: '1.5',
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DrawerSection>
        </DrawerBody>

        <DrawerFooter direction="column">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Scrivi un messaggio come ${currentAdmin}...`}
            style={{ ...drawerInputStyle, minHeight: '5rem', resize: 'vertical' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
              }}
            >
              Premi Invio per inviare, Shift+Invio per andare a capo
            </p>
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="gap-2">
              <Send size={16} />
              Invia
            </Button>
          </div>
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}