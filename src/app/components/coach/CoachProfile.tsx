import { MessageSquare } from 'lucide-react';

interface CoachProfileProps {
  name: string;
  role: string;
  background: string;
  photoUrl?: string;
  onMessageCoach: () => void;
}

export function CoachProfile({ 
  name, 
  role, 
  background, 
  photoUrl, 
  onMessageCoach 
}: CoachProfileProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Coach info */}
      <div className="flex items-start gap-4 mb-5">
        {/* Photo */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-medium">
              {name.charAt(0)}
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg mb-1">{name}</h3>
          <p className="text-sm text-gray-600 mb-1">{role}</p>
          <p className="text-sm text-gray-500">{background}</p>
        </div>
      </div>
      
      {/* Action */}
      <button
        onClick={onMessageCoach}
        className="w-full bg-black text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
      >
        <MessageSquare className="size-4" />
        <span className="text-sm">Invia Messaggio</span>
      </button>
    </div>
  );
}
