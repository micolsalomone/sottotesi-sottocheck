import { Clock } from 'lucide-react';

interface CoachingStatusProps {
  status: string;
  nextStep: string;
  deadline?: string;
}

export function CoachingStatus({ status, nextStep, deadline }: CoachingStatusProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">Stato Attuale</p>
          <h2 className="text-2xl mb-4">{status}</h2>
          <p className="text-gray-600 mb-4">{nextStep}</p>
          {deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="size-4" />
              <span>{deadline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
