import { useMemo, useState } from 'react';
import { TicketDrawer, TicketData, TicketMessage } from '@/app/components/TicketDrawer';

interface StudentSupportTicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
}

function nowIso() {
  return new Date().toISOString();
}

function nowDisplay() {
  return new Date().toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildTicket(studentName: string): TicketData {
  return {
    id: `SS-${Date.now()}`,
    subject: `Supporto percorso coaching - ${studentName}`,
    status: 'aperto',
    priority: 'media',
    source: 'studente',
    category: 'Supporto percorso coaching',
    createdAt: nowIso(),
    requesterName: studentName,
    messages: [],
  };
}

export function StudentSupportTicketDrawer({ isOpen, onClose, studentName }: StudentSupportTicketDrawerProps) {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  const activeTicket = useMemo(() => {
    if (tickets.length > 0) return tickets[0];
    return buildTicket(studentName);
  }, [tickets, studentName]);

  const handleSendMessage = (ticketId: string, content: string) => {
    const message: TicketMessage = {
      id: `msg-${Date.now()}`,
      content,
      author: studentName,
      authorType: 'student',
      timestamp: nowDisplay(),
    };

    setTickets((previous) => {
      const existing = previous.find((ticket) => ticket.id === ticketId);
      if (!existing) {
        return [{ ...activeTicket, messages: [message] }];
      }
      return previous.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              messages: [...ticket.messages, message],
              status: 'aperto',
            }
          : ticket
      );
    });
  };

  return (
    <TicketDrawer
      isOpen={isOpen}
      onClose={onClose}
      ticket={activeTicket}
      onSendMessage={handleSendMessage}
      onSaveChanges={() => undefined}
      currentAdmin={studentName}
      composerLabel="Studente"
      hideManagement={true}
    />
  );
}
