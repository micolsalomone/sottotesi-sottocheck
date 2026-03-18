import { Upload, MessageSquare } from 'lucide-react';

interface PrimaryActionsProps {
  onUploadDocument: () => void;
  onSendMessage: () => void;
}

export function PrimaryActions({ onUploadDocument, onSendMessage }: PrimaryActionsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <h3 className="text-lg mb-6">Azioni Disponibili</h3>
      
      {/* Primary CTA */}
      <button 
        onClick={onUploadDocument}
        className="w-full bg-black text-white rounded-lg px-8 py-6 flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors mb-4"
      >
        <Upload className="size-6" />
        <span className="text-lg">Carica Documento per la Revisione</span>
      </button>
      
      {/* Secondary CTA */}
      <button 
        onClick={onSendMessage}
        className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg px-8 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <MessageSquare className="size-5" />
        <span>Invia Messaggio al Tutor</span>
      </button>
    </div>
  );
}
