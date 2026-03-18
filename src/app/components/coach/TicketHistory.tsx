import { MessageSquare } from 'lucide-react';
import { Ticket } from './MessagingDrawer';

interface TicketHistoryProps {
  tickets: Ticket[];
  onOpenTicket: (ticket: Ticket) => void;
  highlightedTicketId?: string; // For highlighting after sending
}

export function TicketHistory({ tickets, onOpenTicket, highlightedTicketId }: TicketHistoryProps) {
  if (tickets.length === 0) {
    return null;
  }

  return (
    <div id="message-history" className="mt-16 pt-12 border-t-2 border-gray-300">
      <div className="mb-8">
        <h3 className="text-xl mb-2">Cronologia Messaggi</h3>
        <p className="text-sm text-gray-600">
          Tutte le conversazioni relative alle tue fasi di coaching
        </p>
      </div>
      
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const isWaiting = ticket.status === 'waiting';
          const lastMessage = ticket.messages[ticket.messages.length - 1];
          const messagePreview = lastMessage?.content.substring(0, 100) + (lastMessage?.content.length > 100 ? '...' : '');
          const isHighlighted = ticket.id === highlightedTicketId;
          
          return (
            <button
              key={ticket.id}
              onClick={() => onOpenTicket(ticket)}
              className={`w-full bg-white border-2 rounded-lg p-6 hover:border-gray-400 transition-all text-left ${
                isHighlighted 
                  ? 'border-green-400 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="size-4 text-gray-500" />
                    <p className="font-medium text-gray-900">
                      {ticket.context.type === 'general' 
                        ? 'Domanda Generale' 
                        : `Fase: ${ticket.context.stepTitle}`}
                    </p>
                  </div>
                  {messagePreview && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {messagePreview}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    isWaiting 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isWaiting ? 'In attesa di risposta' : 'Tutor ha risposto'}
                  </span>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{ticket.lastUpdate}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}