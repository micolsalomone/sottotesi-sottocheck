import { Clock, Upload, Shield, FileText, CheckCircle2, Edit3 } from 'lucide-react';
import { useState } from 'react';

export type TimelineStepStatus = 'completed' | 'active' | 'upcoming';

export interface UploadedDocument {
  fileName: string;
  uploadDate: string;
  status: 'uploaded' | 'awaiting-verification' | 'verified' | 'not-verifiable' | 'pending' | 'submitted';
  skipVerification?: boolean;
  uploadedBy?: 'student' | 'coach';
  fileSize?: string;
  version?: string;
}

export interface PlagiarismCheck {
  status: 'not-started' | 'running' | 'completed' | 'error';
  result?: {
    similarity: number;
    sources: number;
  };
  startedAt?: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  status: TimelineStepStatus;
  deadline?: string;
  description?: string;
  uploadedDocument?: UploadedDocument;
  plagiarismCheck?: PlagiarismCheck;
  coachActions?: {
    onViewDocument?: () => void;
    onDownloadDocument?: () => void;
    onUploadForStudent?: () => void;
    onStartPlagiarismCheck?: () => void;
    onMarkStepCompleted?: () => void;
  };
  lastDocument?: {
    name: string;
    date: string;
    sender: 'student' | 'coach';
  };
  documentCount?: number;
  onOpenStepArchive?: () => void;
}

interface CoachingTimelineProps {
  steps: TimelineStep[];
  onEditDeadline?: (stepId: string, newDate: string) => void;
}

export function CoachingTimeline({ 
  steps,
  onEditDeadline
}: CoachingTimelineProps) {
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);

  // Group steps by status
  const completedSteps = steps.filter(s => s.status === 'completed');
  const activeStep = steps.find(s => s.status === 'active');
  const upcomingSteps = steps.filter(s => s.status === 'upcoming');

  if (!activeStep) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">Nessuno step attivo al momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* MAIN: Active Step - Dominant Block */}
      <div className="lg:col-span-3">
        <div className="bg-white border-2 border-[#0a0a0a] rounded-lg overflow-hidden">
          
          {/* Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[#0a0a0a] text-white text-xs font-medium px-3 py-1 rounded uppercase tracking-wider">
                    Step corrente
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {activeStep.title}
                </h2>
                {activeStep.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {activeStep.description}
                  </p>
                )}
              </div>
            </div>

            {/* Deadline - editable */}
            <div className="flex items-center gap-2 mt-4">
              <Clock className="size-4 text-gray-400" />
              {isEditingDeadline ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    defaultValue="2026-01-29"
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    onBlur={(e) => {
                      setIsEditingDeadline(false);
                      if (onEditDeadline) {
                        onEditDeadline(activeStep.id, e.target.value);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingDeadline(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingDeadline(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 group"
                >
                  <span>{activeStep.deadline || 'Nessuna scadenza'}</span>
                  <Edit3 className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Documenti</h3>
            
            {activeStep.uploadedDocument ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="size-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {activeStep.uploadedDocument.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Caricato {activeStep.uploadedDocument.uploadDate} · 
                        {activeStep.uploadedDocument.uploadedBy === 'student' ? ' Studente' : ' Coach'}
                      </p>
                      
                      {/* Document status badge */}
                      <div className="mt-2">
                        {activeStep.uploadedDocument.status === 'submitted' && (
                          <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
Nuovo                          </span>
                        )}
                        {activeStep.uploadedDocument.status === 'verified' && (
                          <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                            Revisionato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeStep.coachActions?.onViewDocument && (
                      <button
                        onClick={activeStep.coachActions.onViewDocument}
                        className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded"
                      >
                        Visualizza
                      </button>
                    )}
                    {activeStep.coachActions?.onDownloadDocument && (
                      <button
                        onClick={activeStep.coachActions.onDownloadDocument}
                        className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded"
                      >
                        Scarica
                      </button>
                    )}
                  </div>
                </div>

                {/* Plagiarism Check Section */}
                {activeStep.plagiarismCheck && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {activeStep.plagiarismCheck.status === 'not-started' && activeStep.coachActions?.onStartPlagiarismCheck && (
                      <button
                        onClick={activeStep.coachActions.onStartPlagiarismCheck}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <Shield className="size-4" />
                        <span>Avvia controllo plagio</span>
                      </button>
                    )}
                    
                    {activeStep.plagiarismCheck.status === 'running' && (
                      <div className="flex items-center gap-2 text-sm text-yellow-700">
                        <Shield className="size-4" />
                        <span>Controllo plagio in corso...</span>
                      </div>
                    )}
                    
                    {activeStep.plagiarismCheck.status === 'completed' && activeStep.plagiarismCheck.result && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Shield className="size-4" />
                        <span>
                          Similarità: {activeStep.plagiarismCheck.result.similarity}% · 
                          {activeStep.plagiarismCheck.result.sources} fonti
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">Nessun documento caricato per questo step</p>
              </div>
            )}

            {/* Archive link */}
            {activeStep.documentCount && activeStep.documentCount > 1 && (
              <button
                onClick={activeStep.onOpenStepArchive}
                className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Vedi tutti i documenti ({activeStep.documentCount})
              </button>
            )}
          </div>

          {/* Actions Section */}
          <div className="px-8 py-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Azioni</h3>
            
            <div className="space-y-3">
              {activeStep.coachActions?.onUploadForStudent && (
                <button
                  onClick={activeStep.coachActions.onUploadForStudent}
                  className="w-full bg-[#0a0a0a] text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <Upload className="size-4" />
                  <span>Carica documento per lo studente</span>
                </button>
              )}

              {activeStep.coachActions?.onMarkStepCompleted && (
                <button
                  onClick={activeStep.coachActions.onMarkStepCompleted}
                  className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Marca step come completato</span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Chiudere lo step non blocca il flusso. Lo studente verrà notificato del passaggio alla fase successiva.
            </p>
          </div>

        </div>
      </div>

      {/* SIDEBAR: Completed & Upcoming Steps - Compact */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Completed Steps */}
        {completedSteps.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Completati ({completedSteps.length})
            </h3>
            <div className="space-y-2">
              {completedSteps.map(step => (
                <div key={step.id} className="pb-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-700 font-medium">{step.title}</p>
                  {step.lastDocument && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.lastDocument.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Steps */}
        {upcomingSteps.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Prossimi ({upcomingSteps.length})
            </h3>
            <div className="space-y-2">
              {upcomingSteps.map(step => (
                <div key={step.id} className="pb-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-700 font-medium">{step.title}</p>
                  {step.deadline && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.deadline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
