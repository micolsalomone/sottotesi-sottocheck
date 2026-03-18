import { X, Check } from 'lucide-react';
import { getFileTypeFromName } from '../../utils/fileTypeUtils';

export interface StepOption {
  id: string;
  phaseNumber: string;
  title: string;
}

interface AssignStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  steps: StepOption[];
  onAssign: (stepId: string | null) => void;
}

export function AssignStepModal({
  isOpen,
  onClose,
  fileName,
  steps,
  onAssign
}: AssignStepModalProps) {
  if (!isOpen) return null;

  const handleAssign = (stepId: string | null) => {
    onAssign(stepId);
    onClose();
  };

  const fileTypeInfo = getFileTypeFromName(fileName);
  const FileIcon = fileTypeInfo.icon;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-card rounded-[--radius-lg] shadow-[--shadow-sm] max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                 <h2 style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: 1.5
              }}>
                  Assegna a fase
                </h2>
                <div className="flex items-center gap-2">
                  <FileIcon className={`w-4 h-4 flex-shrink-0 ${fileTypeInfo.color}`} />
                  <p className="text-[--text-label] text-muted-foreground break-all">
                    {fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-[--radius] transition-colors ml-4 flex-shrink-0"
                aria-label="Chiudi"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
            <div className="p-6">
              <p className="text-[--text-label] text-muted-foreground mb-4">
                Seleziona una fase per organizzare questo documento, oppure lascialo senza categoria.
              </p>

              {/* Steps list */}
              <div className="space-y-2">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => handleAssign(step.id)}
                    className="w-full text-left p-4 rounded-[--radius] border border-border hover:border-foreground hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                          {step.phaseNumber}
                        </p>
                        <p className="text-[--text-label] font-[--font-weight-medium --font-inter] text-card-foreground">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-6 bg-muted">
            <button
              onClick={() => handleAssign(null)}
              className="w-full px-4 py-2 text-[--text-label] font-[--font-weight-medium --font-inter] text-muted-foreground bg-card border border-border rounded-[--radius] hover:bg-muted transition-colors"
            >
              Lascia senza categoria
            </button>
          </div>
        </div>
      </div>
    </>
  );
}