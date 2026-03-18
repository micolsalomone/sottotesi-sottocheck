import { X, Upload, FileText, Database, Shield, User, MessageCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface UploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepTitle: string;
  onUpload: (file: File, skipVerification: boolean) => void;
}

export function UploadDrawer({
  isOpen,
  onClose,
  stepTitle,
  onUpload
}: UploadDrawerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [skipVerification, setSkipVerification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, skipVerification);
      setSelectedFile(null);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl mb-2">
                Carica il Tuo Documento
              </h2>
              <p className="text-sm text-gray-600">
                {stepTitle}
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
          {/* Upload Area */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3">
              Seleziona il tuo file
            </label>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="size-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 mb-2">
                Trascina il tuo file qui per caricarlo
              </p>
              <p className="text-sm text-gray-500">
                PDF, DOC, DOCX fino a 25 MB
              </p>
            </div>

            {/* Selected file preview */}
            {selectedFile && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="size-5 text-gray-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 ml-4"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-medium mb-2">Dove finisce il tuo documento?</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Il file verrà salvato in un archivio condiviso con il tuo tutor. 
              Potrai sempre accedervi dalla sezione documenti e il tuo tutor lo 
              riceverà automaticamente per la revisione.
            </p>
          </div>

          
          {/* What happens next */}
          <div className="mb-8">
            <h3 className="font-medium mb-6">Cosa succede dopo</h3>
            
            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Database className="size-5 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium mb-1">Il documento viene archiviato</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Il file viene salvato nel tuo archivio personale e condiviso automaticamente con il tutor
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Shield className="size-5 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium mb-1">Controllo plagio automatico</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Il sistema avvia un check di originalità. I risultati saranno visibili solo al tutor
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="size-5 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium mb-1">Il tutor inizia la revisione</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Il tuo tutor riceve una notifica e inizia a leggere il documento entro i tempi concordati
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="size-5 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium mb-1">Ricevi il feedback</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Il tutor ti fornirà feedback dettagliato e potrai passare alla fase successiva
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="flex-1 bg-black text-white rounded-lg px-6 py-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Upload className="size-5" />
              <span>Carica Documento</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </>
  );
}