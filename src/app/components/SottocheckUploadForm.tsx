import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
} from 'lucide-react';

type DocumentStatus = 'idle' | 'valid' | 'invalid';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export interface UploadedDocument {
  name: string;
  size: number;
  format: string;
}

interface SottocheckUploadFormProps {
  onFileSelected: (document: UploadedDocument, status: DocumentStatus) => void;
  onStatusChange: (status: DocumentStatus) => void;
  onFileCleared?: () => void;
  disabled?: boolean;
  showHeading?: boolean;
}

export function SottocheckUploadForm({
  onFileSelected,
  onStatusChange,
  onFileCleared,
  disabled = false,
  showHeading = true,
}: SottocheckUploadFormProps) {
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('idle');
  const [validationError, setValidationError] = useState<'format' | 'size' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const validFormats = ['pdf', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const hasValidFormat = validFormats.includes(extension);
    const exceedsMaxSize = file.size > MAX_FILE_SIZE_BYTES;
    const isValid = hasValidFormat && !exceedsMaxSize;

    const uploadedDoc: UploadedDocument = {
      name: file.name,
      size: file.size,
      format: extension.toUpperCase(),
    };

    setDocument(uploadedDoc);
    const status = isValid ? 'valid' : 'invalid';
    setDocumentStatus(status);
    setValidationError(isValid ? null : !hasValidFormat ? 'format' : 'size');
    onStatusChange(status);
    onFileSelected(uploadedDoc, status);
  };

  const handleReset = () => {
    setDocument(null);
    setDocumentStatus('idle');
    setValidationError(null);
    onStatusChange('idle');
    onFileCleared?.();
  };

  return (
    <div className="flex flex-col gap-4">
      {showHeading && (
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            Carica documento
          </h3>
          <p
            className="mt-1 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Carica il tuo documento in modo sicuro per avviare la verifica.
          </p>
        </div>
      )}

      {!document ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="p-8 text-center transition-colors"
          style={{
            borderRadius: 'var(--radius)',
            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
            background: isDragging ? 'rgba(11,182,63,0.06)' : 'var(--background)',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[var(--muted)]"
            style={{ borderRadius: '50%' }}
          >
            <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <p
            className="text-[var(--foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Trascina qui il documento o
          </p>
          <label
            className="inline-block mt-1 text-[var(--primary)] hover:opacity-80"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              disabled={disabled}
              className="hidden"
            />
            seleziona dal computer
          </label>
          <p
            className="mt-2 text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            PDF o DOCX (max 50MB)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="border border-[var(--border)] bg-[var(--background)] p-4" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4 min-w-0">
                <FileText className="w-5 h-5 text-[var(--muted-foreground)] shrink-0 mt-[2px]" />
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {document.name}
                  </p>
                  <p
                    className="text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    {(document.size / 1024 / 1024).toFixed(2)} MB • pronto per il check
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {documentStatus === 'valid' && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1"
                    style={{
                      borderRadius: '999px',
                      border: '1px solid rgba(11,182,63,0.25)',
                      background: 'rgba(11,182,63,0.08)',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    documento valido
                  </span>
                )}
                {documentStatus === 'invalid' && <XCircle className="w-5 h-5 text-[var(--destructive)]" />}

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={disabled}
                  className="inline-flex h-8 w-8 items-center justify-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                  title="Elimina allegato"
                  aria-label="Elimina allegato"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {documentStatus === 'invalid' && (
            <div
              className="p-4"
              style={{
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(220,38,38,0.25)',
                background: 'rgba(220,38,38,0.08)',
              }}
            >
              <div className="flex gap-2">
                <XCircle className="w-4 h-4 text-[var(--destructive)] shrink-0 mt-[2px]" />
                <div>
                  <p
                    className="text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                    >{validationError === 'format' ? 'Formato non valido' : 'File troppo grande'}</p>
                  <p
                    className="mt-1 text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                    >
                      {validationError === 'format'
                        ? 'Il file caricato non è in un formato supportato. Carica un file PDF o DOCX.'
                        : 'Il file supera la dimensione massima di 50 MB. Carica un file più piccolo.'}
                    </p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
