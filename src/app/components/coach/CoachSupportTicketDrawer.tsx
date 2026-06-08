import { useMemo, useState } from 'react';
import { TicketDrawer, TicketData, TicketMessage } from '@/app/components/TicketDrawer';

interface CoachSupportTicketDrawerProps {
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
    id: `CS-${Date.now()}`,
    subject: `Supporto percorso coaching - ${studentName}`,
    status: 'aperto',
    priority: 'media',
    source: 'coach',
    category: 'Supporto percorso coaching',
    createdAt: nowIso(),
    requesterName: 'Coach',
    messages: [],
  };
}

export function CoachSupportTicketDrawer({ isOpen, onClose, studentName }: CoachSupportTicketDrawerProps) {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  const activeTicket = useMemo(() => {
    if (tickets.length > 0) return tickets[0];
    return buildTicket(studentName);
  }, [tickets, studentName]);

  const handleSendMessage = (ticketId: string, content: string) => {
    const message: TicketMessage = {
      id: `msg-${Date.now()}`,
      content,
      author: 'Coach',
      authorType: 'coach',
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
      currentAdmin="Coach"
      composerLabel="Coach"
      hideManagement={true}
    />
  );
}
