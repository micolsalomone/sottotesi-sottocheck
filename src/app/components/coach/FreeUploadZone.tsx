import { Upload, FileText, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { AssignStepModal, StepOption } from './AssignStepModal';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
}

interface FreeUploadZoneProps {
  onFilesUploaded?: (files: File[]) => void;
  steps?: StepOption[];
  onAssignFileToStep?: (fileId: string, fileName: string, stepId: string | null) => void;
  onOpenArchive?: () => void;
}

export function FreeUploadZone({ onFilesUploaded, steps, onAssignFileToStep, onOpenArchive }: FreeUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Bibliografia_Preliminare.pdf',
      size: '1.2 MB',
      uploadDate: '05/02/2026 h:10.20',
      uploadedBy: 'Alex Johnson'
    },
    {
      id: '2',
      name: 'Note_Ricerca_Campo.docx',
      size: '856 KB',
      uploadDate: '04/02/2026 h:15.45',
      uploadedBy: 'Alex Johnson'
    }
  ]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentFileToAssign, setCurrentFileToAssign] = useState<{ id: string; name: string } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Create mock uploaded files
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: formatFileSize(file.size),
      uploadDate: new Date().toLocaleDateString('it-IT') + ' h:' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Marco Bianchi' // Current coach
    }));

    setUploadedFiles(prev => [...newFiles, ...prev]);
    onFilesUploaded?.(files);
    
    // Show assign modal for the first file
    if (newFiles.length > 0 && steps && steps.length > 0) {
      setCurrentFileToAssign({ id: newFiles[0].id, name: newFiles[0].name });
      setAssignModalOpen(true);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAssignFile = (fileId: string, fileName: string) => {
    setCurrentFileToAssign({ id: fileId, name: fileName });
    setAssignModalOpen(true);
  };

  const handleAssignStep = (stepId: string | null) => {
    if (currentFileToAssign) {
      onAssignFileToStep?.(currentFileToAssign.id, currentFileToAssign.name, stepId);
      setAssignModalOpen(false);
      setShowSuccessMessage(true);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      {/* Header */}


      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 transition-colors
          ${isDragging 
            ? 'border-black bg-gray-50' 
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Trascina i file qui o{' '}
            <label className="text-black underline cursor-pointer hover:text-gray-700">
              sfoglia
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
            </label>
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, TXT, immagini fino a 50MB
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mt-4 p-4 bg-muted rounded-[--radius] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-foreground/10 flex items-center justify-center">
              <span className="text-accent-foreground text-sm">✓</span>
            </div>
            <p className="text-[--text-label] font-[--font-weight-medium --font-inter] text-accent-foreground">
              File caricato con successo
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onOpenArchive && (
              <button
                onClick={onOpenArchive}
                className="text-[--text-label] font-[--font-weight-medium --font-inter] text-accent-foreground underline hover:no-underline"
              >
                Visualizza in archivio
              </button>
            )}
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="flex-shrink-0 p-1 hover:bg-accent-foreground/10 rounded transition-colors"
              aria-label="Chiudi notifica"
            >
              <X className="w-4 h-4 text-accent-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Assign Step Modal */}
      {steps && (
        <AssignStepModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          fileName={currentFileToAssign?.name || ''}
          steps={steps}
          onAssign={handleAssignStep}
        />
      )}
    </div>
  );
}