import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Download, Trash2, Eye, MessageSquare, ShieldCheck } from 'lucide-react';
import { getFileTypeFromName } from '../../utils/fileTypeUtils';

export interface StepDocument {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string;
  size?: string;
  isNew?: boolean;
  plagiarismStatus?: 'none' | 'pending' | 'clear' | 'flagged';
  note?: string;
}

interface StepArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string;
  stepTitle: string;
  phaseNumber: string;
  stepStatus: 'active' | 'completed' | 'upcoming';
  documents: StepDocument[];
  onUploadDocuments?: (stepId: string, files: File[], note?: string) => void;
  onViewDocument?: (docId: string) => void;
  onDownloadDocument?: (docId: string) => void;
  onDeleteDocument?: (docId: string) => void;
  onRunPlagiarismCheck?: (docId: string) => void;
}

export function StepArchiveDrawer({
  isOpen,
  onClose,
  stepId,
  stepTitle,
  phaseNumber,
  stepStatus,
  documents,
  onUploadDocuments,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onRunPlagiarismCheck,
}: StepArchiveDrawerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showNoteField, setShowNoteField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmUpload = () => {
    if (pendingFiles.length === 0) return;
    onUploadDocuments?.(stepId, pendingFiles, uploadNote.trim() || undefined);
    setPendingFiles([]);
    setUploadNote('');
    setShowNoteField(false);
  };

  const handleCancelUpload = () => {
    setPendingFiles([]);
    setUploadNote('');
    setShowNoteField(false);
  };

  const statusLabel = stepStatus === 'active' ? 'Attiva' : stepStatus === 'completed' ? 'Completata' : 'Prossima';
  const statusColors = stepStatus === 'active'
    ? { bg: 'rgba(11, 182, 63, 0.1)', text: 'var(--primary)' }
    : stepStatus === 'completed'
      ? { bg: 'var(--muted)', text: 'var(--muted-foreground)' }
      : { bg: 'rgba(46, 144, 250, 0.1)', text: 'var(--chart-2)' };

  const getPlagiarismLabel = (status?: string) => {
    switch (status) {
      case 'clear': return { label: 'Nessun plagio', color: 'var(--primary)' };
      case 'flagged': return { label: 'Segnalato', color: 'var(--destructive-foreground)' };
      case 'pending': return { label: 'In corso...', color: 'var(--chart-3)' };
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(10, 10, 10, 0.2)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-xl z-50 overflow-y-auto"
        style={{
          backgroundColor: 'var(--card)',
          boxShadow: '0 0 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5"
          style={{
            backgroundColor: 'var(--card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p
                className="uppercase tracking-wider mb-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {phaseNumber}
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-alegreya)',
                  fontSize: 'var(--text-h3)',
                  fontWeight: 'var(--font-weight-bold)',
                  lineHeight: 1.3,
                  color: 'var(--foreground)',
                }}
              >
                {stepTitle}
              </h2>
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-2 py-0.5"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    borderRadius: 'var(--radius-badge)',
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    lineHeight: 1.5,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Zone */}
          <div>
            <h3
              className="mb-3"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              Carica documento
            </h3>

            <div
              className="relative transition-colors"
              style={{
                border: isDragOver
                  ? '2px dashed var(--primary)'
                  : '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: isDragOver
                  ? 'rgba(11, 182, 63, 0.04)'
                  : 'var(--muted)',
                padding: '24px',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload
                  className="w-6 h-6"
                  style={{ color: isDragOver ? 'var(--primary)' : 'var(--muted-foreground)' }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: isDragOver ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  {isDragOver ? 'Rilascia qui' : 'Trascina i file qui per caricarli'}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  PDF, DOC, DOCX, JPG, PNG...
                </p>
              </div>
            </div>

            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingFiles.map((file, idx) => {
                  const fileInfo = getFileTypeFromName(file.name);
                  const FileIcon = fileInfo.icon;
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-3 px-3 py-2"
                      style={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    >
                      <FileIcon className={`w-4 h-4 flex-shrink-0 ${fileInfo.color}`} />
                      <span
                        className="flex-1 min-w-0 truncate"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {file.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemovePendingFile(idx); }}
                        className="p-1 hover:bg-[var(--muted)] transition-colors"
                        style={{ borderRadius: 'calc(var(--radius) - 4px)' }}
                      >
                        <X className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                    </div>
                  );
                })}

                {/* Optional note for upload */}
                {!showNoteField ? (
                  <button
                    onClick={() => setShowNoteField(true)}
                    className="flex items-center gap-1.5 px-2 py-1.5 transition-colors hover:bg-[var(--muted)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--muted-foreground)',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Aggiungi una nota a questo caricamento
                  </button>
                ) : (
                  <div
                    className="p-3"
                    style={{
                      backgroundColor: 'var(--muted)',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  >
                    <textarea
                      value={uploadNote}
                      onChange={(e) => setUploadNote(e.target.value)}
                      placeholder="Descrivi il documento o aggiungi istruzioni per lo studente..."
                      rows={3}
                      className="w-full resize-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                        lineHeight: 1.5,
                        color: 'var(--foreground)',
                        backgroundColor: 'var(--input-background)',
                        border: '1px solid var(--border)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    />
                  </div>
                )}

                {/* Upload actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleConfirmUpload}
                    className="flex items-center gap-2 px-4 py-2 transition-opacity hover:opacity-90"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Carica {pendingFiles.length > 1 ? `${pendingFiles.length} file` : 'file'}
                  </button>
                  <button
                    onClick={handleCancelUpload}
                    className="px-4 py-2 transition-colors hover:bg-[var(--muted)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Documents list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                }}
              >
                Documenti della fase
              </h3>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {documents.length} {documents.length === 1 ? 'documento' : 'documenti'}
              </span>
            </div>

            {documents.length === 0 ? (
              <div
                className="flex flex-col items-center py-10 px-6"
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--muted)',
                }}
              >
                <FileText className="w-10 h-10 mb-3" style={{ color: 'var(--border)' }} />
                <p
                  className="text-center mb-1"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Nessun documento in questa fase
                </p>
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Trascina un file nella zona sopra per iniziare
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const fileInfo = getFileTypeFromName(doc.fileName);
                  const FileIcon = fileInfo.icon;
                  const plagiarism = getPlagiarismLabel(doc.plagiarismStatus);

                  return (
                    <div
                      key={doc.id}
                      className="p-4"
                      style={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <FileIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${fileInfo.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="truncate"
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: 'var(--text-label)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--foreground)',
                              }}
                            >
                              {doc.fileName}
                            </p>
                            {doc.isNew && (
                              <span
                                className="flex-shrink-0 inline-block px-1.5 py-0.5 uppercase"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '11px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                  backgroundColor: 'rgba(11, 182, 63, 0.1)',
                                  color: 'var(--primary)',
                                  lineHeight: 1.5,
                                }}
                              >
                                nuovo
                              </span>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-2 flex-wrap mt-1"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            <span>{doc.uploadedBy}</span>
                            <span>·</span>
                            <span>{doc.uploadDate}</span>
                            {doc.size && (
                              <>
                                <span>·</span>
                                <span>{doc.size}</span>
                              </>
                            )}
                          </div>

                          {/* Plagiarism status */}
                          {plagiarism && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <ShieldCheck className="w-3.5 h-3.5" style={{ color: plagiarism.color }} />
                              <span
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: plagiarism.color,
                                }}
                              >
                                {plagiarism.label}
                              </span>
                            </div>
                          )}

                          {/* Document note */}
                          {doc.note && (
                            <div
                              className="mt-2 p-2.5"
                              style={{
                                backgroundColor: 'var(--muted)',
                                borderRadius: 'calc(var(--radius) - 2px)',
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-regular)',
                                  lineHeight: 1.5,
                                  color: 'var(--muted-foreground)',
                                }}
                              >
                                {doc.note}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 mt-3 flex-wrap">
                            {onViewDocument && (
                              <button
                                onClick={() => onViewDocument(doc.id)}
                                className="flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-[var(--muted)]"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--muted-foreground)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Visualizza
                              </button>
                            )}
                            {onDownloadDocument && (
                              <button
                                onClick={() => onDownloadDocument(doc.id)}
                                className="flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-[var(--muted)]"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--muted-foreground)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                }}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Scarica
                              </button>
                            )}
                            {onRunPlagiarismCheck && doc.plagiarismStatus !== 'clear' && (
                              <button
                                onClick={() => onRunPlagiarismCheck(doc.id)}
                                className="flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-[var(--muted)]"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--muted-foreground)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                }}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Check plagio
                              </button>
                            )}
                            {onDeleteDocument && (
                              <button
                                onClick={() => {
                                  if (confirm(`Eliminare "${doc.fileName}"?`)) {
                                    onDeleteDocument(doc.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 ml-auto transition-colors hover:bg-[var(--destructive)]"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--destructive-foreground)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Elimina
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}