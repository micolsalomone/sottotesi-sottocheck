import { X, Paperclip, Send, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type TicketContext = {
  type: 'step' | 'general';
  stepId?: string;
  stepTitle?: string;
};

export interface Message {
  id: string;
  sender: 'student' | 'coach';
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface Ticket {
  id: string;
  context: TicketContext;
  status: 'waiting' | 'replied';
  messages: Message[];
  lastUpdate: string;
}

interface MessagingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  existingTicket?: Ticket;
  defaultContext?: TicketContext;
  availableSteps?: Array<{ id: string; title: string }>;
  coachName: string;
  onSendMessage: (context: TicketContext, message: string, attachments: File[]) => void;
  onViewHistory?: () => void; // Handler to scroll to message history
}

export function MessagingDrawer({
  isOpen,
  onClose,
  existingTicket,
  defaultContext,
  availableSteps = [],
  coachName,
  onSendMessage,
  onViewHistory
}: MessagingDrawerProps) {
  const [selectedContext, setSelectedContext] = useState<TicketContext>(
    existingTicket?.context || defaultContext || { type: 'general' }
  );
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [justSentMessageId, setJustSentMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [existingTicket?.messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!message.trim()) return;
    
    const messageId = `m${Date.now()}`;
    onSendMessage(selectedContext, message, attachments);
    
    // Set the just sent message ID for status display
    setJustSentMessageId(messageId);
    
    // Clear form immediately
    setMessage('');
    setAttachments([]);
    
    // Clear "just sent" status after 3 seconds
    setTimeout(() => {
      setJustSentMessageId(null);
    }, 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setAttachments([...attachments, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Viewing existing ticket
  const isViewingTicket = !!existingTicket;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl mb-2">
                {isViewingTicket 
                  ? `Messaggi – Fase: ${existingTicket.context.stepTitle || 'Generale'}` 
                  : `Nuovo Messaggio – Fase: ${selectedContext.stepTitle || 'Generale'}`}
              </h2>
              <p className="text-sm text-gray-600">
                Questo non è una chat in tempo reale. Il tuo tutor risponderà entro i tempi concordati.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Chiudi"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Existing ticket messages */}
          {isViewingTicket && existingTicket.messages.length > 0 && (
            <div className="space-y-6 mb-8">
              {existingTicket.messages.map((msg, index) => {
                const isLastMessage = index === existingTicket.messages.length - 1;
                const showWaitingStatus = isLastMessage && existingTicket.status === 'waiting' && msg.sender === 'student';
                
                return (
                  <div key={msg.id}>
                    <div 
                      className={`${msg.sender === 'student' ? 'bg-gray-50' : 'bg-blue-50'} border ${msg.sender === 'student' ? 'border-gray-200' : 'border-blue-200'} rounded-lg p-5`}
                    >
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="font-medium">
                          {msg.sender === 'student' ? 'Tu' : coachName}
                        </p>
                        <p className="text-sm text-gray-500">{msg.timestamp}</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Allegati:</p>
                          {msg.attachments.map((att, idx) => (
                            <p key={idx} className="text-sm text-gray-700">{att}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Inline status for last student message */}
                    {showWaitingStatus && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                        <CheckCircle2 className="size-4 text-green-600" />
                        <span>Inviato · In attesa di risposta dal tutor</span>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* New message form */}
          {/* Always show the form */}
          <>
            {/* Context selection (only for new tickets) */}
            {!isViewingTicket && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Contesto del messaggio
                </label>
                <select
                  value={selectedContext.type === 'general' ? 'general' : selectedContext.stepId}
                  onChange={(e) => {
                    if (e.target.value === 'general') {
                      setSelectedContext({ type: 'general' });
                    } else {
                      const step = availableSteps.find(s => s.id === e.target.value);
                      setSelectedContext({
                        type: 'step',
                        stepId: e.target.value,
                        stepTitle: step?.title
                      });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {availableSteps.map(step => (
                    <option key={step.id} value={step.id}>{step.title}</option>
                  ))}
                  <option value="general">Domanda Generale</option>
                </select>
              </div>
            )}

            {/* Message input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                {isViewingTicket ? 'La tua risposta' : 'Il tuo messaggio'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descrivi la tua domanda o ciò di cui hai bisogno aiuto…"
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">
                Allegati (opzionale)
              </label>
              
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              >
                <Paperclip className="size-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Trascina i file qui per allegarli
                </p>
                <p className="text-xs text-gray-500">
                  Gli allegati saranno salvati nei tuoi documenti
                </p>
              </div>

              {/* Attached files list */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex-1 bg-black text-white rounded-lg px-6 py-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="size-5" />
                <span>Invia Messaggio</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </>
        </div>
      </div>
    </>
  );
}