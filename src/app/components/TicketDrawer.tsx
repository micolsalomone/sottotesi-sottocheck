import React, { useState } from 'react';
import { X, Send, Ticket } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { StatusBadge, StatusType } from './StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface TicketMessage {
  id: string;
  content: string;
  author: string;
  authorType: 'admin' | 'coach' | 'student';
  timestamp: string;
}

export interface TicketData {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'pending';
  assignedTo?: string;
  messages: TicketMessage[];
  entityType: string;
  entityName: string;
}

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData | null;
  onSendMessage: (ticketId: string, content: string) => void;
  onChangeStatus: (ticketId: string, status: 'active' | 'completed' | 'pending') => void;
  onAssign: (ticketId: string, adminId: string) => void;
  currentAdmin: string;
  availableAdmins?: { id: string; name: string }[];
}

export function TicketDrawer({
  isOpen,
  onClose,
  ticket,
  onSendMessage,
  onChangeStatus,
  onAssign,
  currentAdmin,
  availableAdmins = []
}: TicketDrawerProps) {
  const [newMessage, setNewMessage] = useState('');

  if (!ticket) return null;

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(ticket.id, newMessage.trim());
      setNewMessage('');
    }
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[600px] flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="h-5 w-5 text-primary" />
                <SheetTitle>{ticket.title}</SheetTitle>
              </div>
              <SheetDescription>
                {ticket.entityType}: {ticket.entityName}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Controlli ticket */}
          <div className="flex items-center gap-3 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Stato:</span>
              <Select
                value={ticket.status}
                onValueChange={(value) => onChangeStatus(ticket.id, value as any)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableAdmins.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Assegnato a:</span>
                <Select
                  value={ticket.assignedTo || 'unassigned'}
                  onValueChange={(value) => onAssign(ticket.id, value)}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assegnato</SelectItem>
                    {availableAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Messaggi */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {ticket.messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun messaggio. Inizia la conversazione.
            </div>
          ) : (
            ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.authorType === 'admin' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] space-y-2 ${
                    message.authorType === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  } rounded-lg p-3`}
                >
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <span className="font-medium">{message.author}</span>
                    <span>({getAuthorLabel(message.authorType)})</span>
                    <span>•</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form risposta */}
        <div className="border-t border-border pt-4 space-y-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="min-h-20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Premi Invio per inviare, Shift+Invio per andare a capo
            </p>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Invia
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}