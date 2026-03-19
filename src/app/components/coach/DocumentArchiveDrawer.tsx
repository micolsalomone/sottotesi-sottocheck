import { X, FileText, Download, Trash2, ShieldCheck, MessageSquare, ChevronDown, Eye, FolderInput, Upload } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { getFileTypeFromName } from '../../utils/fileTypeUtils';
import { AssignStepModal } from './AssignStepModal';

export interface Document {
  id: string;
  name: string;
  sender: 'student' | 'coach';
  stepId: string | null;
  stepTitle: string | null;
  date: string;
  size: string;
  uploadedBy: string;
  plagiarismStatus?: 'none' | 'pending' | 'clear' | 'flagged';
  plagiarismCheckDate?: string;
  plagiarismCheckedBy?: string;
  note?: string;
}

export interface StepOption {
  id: string;
  phaseNumber: string;
  title: string;
}

interface DocumentArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  documents?: Document[];
  availableSteps?: StepOption[];
  onViewDocument?: (docId: string) => void;
  onDownloadDocument?: (docId: string) => void;
  onDeleteDocument?: (docId: string) => void;
  onRunPlagiarismCheck?: (docId: string) => void;
  onAddNote?: (docId: string, note: string) => void;
  onAssignToStep?: (docId: string, stepId: string) => void;
  onUploadDocuments?: (files: File[], note?: string, fileStepAssignments?: Record<number, string | null>) => void;
}

const getPlagiarismLabel = (status?: string) => {
  switch (status) {
    case 'clear': return { label: 'Nessun plagio', color: 'var(--primary)' };
    case 'flagged': return { label: 'Segnalato', color: 'var(--destructive-foreground)' };
    case 'pending': return { label: 'In corso...', color: 'var(--chart-3)' };
    default: return null;
  }
};

export function DocumentArchiveDrawer({
  isOpen,
  onClose,
  studentName,
  documents = [],
  availableSteps = [],
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onRunPlagiarismCheck,
  onAddNote,
  onAssignToStep,
  onUploadDocuments,
}: DocumentArchiveDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['uncategorized']));
  const [noteBeingEdited, setNoteBeingEdited] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadNote, setUploadNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [assignStepModalOpen, setAssignStepModalOpen] = useState(false);
  const [currentFileToAssign, setCurrentFileToAssign] = useState<{ index: number; name: string } | null>(null);
  const [fileStepAssignments, setFileStepAssignments] = useState<Record<number, string | null>>({});
  const [uploadedFilesByStep, setUploadedFilesByStep] = useState<Record<string, File[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handlers
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

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setFileStepAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[index];
      return newAssignments;
    });
  };

  const handleAssignFileToStep = (fileIndex: number, fileName: string) => {
    setCurrentFileToAssign({ index: fileIndex, name: fileName });
    setAssignStepModalOpen(true);
  };

  const handleStepAssignmentConfirm = (stepId: string | null) => {
    if (currentFileToAssign !== null && stepId) {
      // Get the file from pendingFiles at currentFileToAssign.index
      const fileToAssign = pendingFiles[currentFileToAssign.index];
      if (fileToAssign) {
        // Remove from pendingFiles
        setPendingFiles(prev => prev.filter((_, i) => i !== currentFileToAssign.index));
        
        // Add to uploadedFilesByStep
        setUploadedFilesByStep(prev => ({
          ...prev,
          [stepId]: [...(prev[stepId] || []), fileToAssign]
        }));
        
        // Remove from fileStepAssignments since we're moving the file
        setFileStepAssignments(prev => {
          const newAssignments = { ...prev };
          delete newAssignments[currentFileToAssign.index];
          return newAssignments;
        });
        
        // Open the section for this step
        setExpandedSections(prev => new Set([...prev, stepId]));
      }
    }
    setAssignStepModalOpen(false);
    setCurrentFileToAssign(null);
  };

  const handleConfirmUpload = () => {
    const filesInStepSections = Object.values(uploadedFilesByStep).flat();
    const allFiles = [...pendingFiles, ...filesInStepSections];
    if (allFiles.length === 0 || isUploading) return;

    const allFileStepAssignments: Record<number, string | null> = {};
    let assignmentIndex = 0;
    pendingFiles.forEach((_, index) => {
      allFileStepAssignments[assignmentIndex] = fileStepAssignments[index] ?? null;
      assignmentIndex += 1;
    });
    Object.entries(uploadedFilesByStep).forEach(([stepId, files]) => {
      files.forEach(() => {
        allFileStepAssignments[assignmentIndex] = stepId;
        assignmentIndex += 1;
      });
    });

    setIsUploading(true);

    // Simulated upload for prototype UX
    setTimeout(() => {
      onUploadDocuments?.(allFiles, uploadNote.trim() || undefined, allFileStepAssignments);
      setPendingFiles([]);
      setUploadNote('');
      setShowNoteField(false);
      setFileStepAssignments({});
      setUploadedFilesByStep({});
      setIsUploading(false);
    }, 1200);
  };

  const handleCancelUpload = () => {
    if (isUploading) return;
    setPendingFiles([]);
    setUploadNote('');
    setShowNoteField(false);
    setFileStepAssignments({});
    setCurrentFileToAssign(null);
    setUploadedFilesByStep({});
  };

  if (!isOpen) return null;

  // Group documents by step
  const uncategorizedDocs = documents.filter(doc => !doc.stepId);
  const stepGroups = documents.reduce((acc, doc) => {
    if (doc.stepId && doc.stepTitle) {
      if (!acc[doc.stepId]) {
        acc[doc.stepId] = { title: doc.stepTitle, documents: [] };
      }
      acc[doc.stepId].documents.push(doc);
    }
    return acc;
  }, {} as Record<string, { title: string; documents: Document[] }>);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  };

  const handleAddNote = (docId: string) => {
    if (noteBeingEdited === docId) {
      onAddNote?.(docId, noteText);
      setNoteBeingEdited(null);
      setNoteText('');
    } else {
      setNoteBeingEdited(docId);
      const doc = documents.find(d => d.id === docId);
      setNoteText(doc?.note || '');
    }
  };

  const renderDocumentItem = (doc: Document) => {
    const fileInfo = getFileTypeFromName(doc.name);
    const FileIcon = fileInfo.icon;
    const plagiarism = getPlagiarismLabel(doc.plagiarismStatus);
    const isUncategorized = !doc.stepId;

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
                {doc.name}
              </p>
              {/* Sender badge */}
              <span
                className="flex-shrink-0 inline-block px-1.5 py-0.5"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-medium)',
                  borderRadius: 'calc(var(--radius) - 4px)',
                  backgroundColor: doc.sender === 'coach'
                    ? 'rgba(46, 144, 250, 0.1)'
                    : 'rgba(11, 182, 63, 0.1)',
                  color: doc.sender === 'coach'
                    ? 'var(--chart-2)'
                    : 'var(--primary)',
                  lineHeight: 1.5,
                  textTransform: 'capitalize',
                }}
              >
                {doc.sender === 'coach' ? 'Coach' : 'Studente'}
              </span>
            </div>

            {/* Metadata */}
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
              <span>{doc.date}</span>
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
                {doc.plagiarismCheckDate && (
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    · {doc.plagiarismCheckDate}
                    {doc.plagiarismCheckedBy && ` da ${doc.plagiarismCheckedBy}`}
                  </span>
                )}
              </div>
            )}

            {/* Quick assign for uncategorized */}
            {isUncategorized && onAssignToStep && availableSteps.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <FolderInput className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                <select
                  onChange={(e) => {
                    if (e.target.value) onAssignToStep(doc.id, e.target.value);
                  }}
                  className="flex-1 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--input-background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'calc(var(--radius) - 2px)',
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Assegna a una fase...</option>
                  {availableSteps.map(step => (
                    <option key={step.id} value={step.id}>
                      {step.phaseNumber} · {step.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            {(doc.note || noteBeingEdited === doc.id) && (
              <div
                className="mt-2 p-2.5"
                style={{
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'calc(var(--radius) - 2px)',
                }}
              >
                {noteBeingEdited === doc.id ? (
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full resize-none px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    rows={3}
                    placeholder="Aggiungi una nota su questo documento..."
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                      lineHeight: 1.5,
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--input-background)',
                      border: '1px solid var(--border)',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  />
                ) : (
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
                )}
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
              {onAddNote && (
                <button
                  onClick={() => handleAddNote(doc.id)}
                  className="flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-[var(--muted)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    borderRadius: 'calc(var(--radius) - 4px)',
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {noteBeingEdited === doc.id ? 'Salva nota' : 'Nota'}
                </button>
              )}
              {onDeleteDocument && (
                <button
                  onClick={() => {
                    if (confirm(`Eliminare "${doc.name}"?`)) {
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
  };

  const renderSectionHeader = (sectionId: string, title: string, count: number) => (
    <button
      onClick={() => toggleSection(sectionId)}
      className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[var(--muted)]"
      style={{
        backgroundColor: 'var(--card)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-left">
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
            }}
          >
            {count} {count === 1 ? 'documento' : 'documenti'}
          </p>
        </div>
      </div>
      <ChevronDown
        className="w-5 h-5 transition-transform"
        style={{
          color: 'var(--muted-foreground)',
          transform: expandedSections.has(sectionId) ? 'rotate(180deg)' : 'none',
        }}
      />
    </button>
  );

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
                Archivio completo
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
                Archivio Documenti
              </h2>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.5,
                }}
              >
                Storico completo dei documenti scambiati con {studentName}, organizzati per fase.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] transition-colors"
              style={{ borderRadius: 'var(--radius)', border: 'none', background: 'none', cursor: 'pointer' }}
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
        </div>

        <div className="p-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <div className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingFiles.map((file, idx) => {
                  const fileInfo = getFileTypeFromName(file.name);
                  const FileIcon = fileInfo.icon;
                  const assignedStep = fileStepAssignments[idx];
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileIcon className={fileInfo.color} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--foreground)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
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
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemovePendingFile(idx); }}
                          className="p-1 hover:bg-[var(--muted)] transition-colors"
                          style={{ borderRadius: 'calc(var(--radius) - 4px)', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <X className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <button
                          onClick={() => handleAssignFileToStep(idx, file.name)}
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-medium)',
                            color: assignedStep ? 'var(--muted-foreground)' : 'var(--primary)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {assignedStep ? `Step assegnato` : `Assegna a uno step`}
                        </button>
                        {assignedStep && (
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--primary)',
                            }}
                          >
                            {assignedStep}
                          </span>
                        )}
                        {!assignedStep && (
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            (senza categoria)
                          </span>
                        )}
                      </div>
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
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
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
                    disabled={isUploading}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.8 : 1,
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading
                      ? 'Caricamento...'
                      : `Carica ${pendingFiles.length + Object.values(uploadedFilesByStep).flat().length > 1 ? `${pendingFiles.length + Object.values(uploadedFilesByStep).flat().length} file` : 'file'}`}
                  </button>
                  <button
                    onClick={handleCancelUpload}
                    className="px-4 py-2 transition-colors hover:bg-[var(--muted)]"
                    disabled={isUploading}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'transparent',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.6 : 1,
                    }}
                  >
                    Annulla
                  </button>
                  {isUploading && (
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      Upload in corso...
                    </span>
                  )}
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
                Tutti i documenti
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
                  Nessun documento caricato
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Uncategorized Documents */}
                {uncategorizedDocs.length > 0 && (
                  <div
                    className="overflow-hidden"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {renderSectionHeader(
                      'uncategorized',
                      'Documenti non categorizzati',
                      uncategorizedDocs.length
                    )}
                    {expandedSections.has('uncategorized') && (
                      <div
                        className="p-4"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          backgroundColor: 'var(--muted)',
                        }}
                      >
                        {uncategorizedDocs.map(renderDocumentItem)}
                      </div>
                    )}
                  </div>
                )}

                {/* Documents grouped by step */}
                {Object.entries(stepGroups).map(([stepId, group]) => (
                  <div
                    key={stepId}
                    className="overflow-hidden"
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {renderSectionHeader(stepId, group.title, (group.documents.length) + (uploadedFilesByStep[stepId]?.length || 0))}
                    {expandedSections.has(stepId) && (
                      <div
                        className="p-4"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          backgroundColor: 'var(--muted)',
                        }}
                      >
                        {/* Uploaded files pending confirmation */}
                        {uploadedFilesByStep[stepId]?.map((file, idx) => {
                          const fileInfo = getFileTypeFromName(file.name);
                          const FileIcon = fileInfo.icon;
                          return (
                            <div
                              key={`uploaded-${stepId}-${idx}`}
                              className="p-4"
                              style={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                opacity: 0.7,
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <FileIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${fileInfo.color}`} />
                                <div className="flex-1 min-w-0">
                                  <p
                                    style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: 'var(--text-label)',
                                      fontWeight: 'var(--font-weight-medium)',
                                      color: 'var(--foreground)',
                                      marginBottom: '4px'
                                    }}
                                  >
                                    {file.name}
                                  </p>
                                  <p
                                    style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: '12px',
                                      color: 'var(--muted-foreground)',
                                      marginBottom: '8px'
                                    }}
                                  >
                                    {(file.size / 1024 / 1024).toFixed(1)} MB • In caricamento...
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setUploadedFilesByStep(prev => ({
                                      ...prev,
                                      [stepId]: prev[stepId].filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="p-1 hover:bg-[var(--border)] transition-colors"
                                  style={{ borderRadius: 'calc(var(--radius) - 4px)', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                                >
                                  <X className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {group.documents.map(renderDocumentItem)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Step Modal for pending files */}
      {assignStepModalOpen && (
        <AssignStepModal
          isOpen={assignStepModalOpen}
          fileName={currentFileToAssign?.name || ''}
          steps={availableSteps || []}
          onAssign={(stepId) => handleStepAssignmentConfirm(stepId)}
          onClose={() => setAssignStepModalOpen(false)}
        />
      )}
    </>
  );
}
