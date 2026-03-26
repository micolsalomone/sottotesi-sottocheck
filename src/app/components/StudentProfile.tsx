import { useState, useCallback, useRef } from 'react';
import { ChevronRight, Folder, User, Upload, Pencil, Check, X, Phone, MessageCircle, Mail, Copy } from 'lucide-react';
import { AssignStepModal, StepOption } from './coach/AssignStepModal';

/* ─── Info Coaching Card ─── */

interface InfoCoachingCardProps {
  thesisSubject: string;
  thesisMatter?: string;
  degree: string;
  thesisLevel: string;
  thesisType: string;
  supervisor: string;
  studentPhone?: string;
  studentEmail?: string;
  // Kept in props for future use, not displayed here
  startDate?: string;
  endDate?: string;
  referent?: string;
  onSaveThesisSubject?: (newSubject: string) => void;
}

export function InfoCoachingCard({
  thesisSubject,
  thesisMatter,
  degree,
  thesisLevel,
  thesisType,
  supervisor,
  studentPhone,
  studentEmail,
  onSaveThesisSubject,
}: InfoCoachingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(thesisSubject);

  function handleStartEdit() {
    setDraft(thesisSubject);
    setIsEditing(true);
  }

  function handleSave() {
    onSaveThesisSubject?.(draft);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(thesisSubject);
    setIsEditing(false);
  }

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] relative"
      style={{ borderRadius: 'var(--radius)', padding: '17px' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-0">
        <p
          className="text-[var(--foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-medium)',
            lineHeight: '27px',
            letterSpacing: '-0.44px',
          }}
        >
          Info coaching
        </p>
        {onSaveThesisSubject && !isEditing && (
          <button
            onClick={handleStartEdit}
            className="shrink-0 flex items-center justify-center border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius)',
            }}
            title="Modifica oggetto tesi"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Oggetto tesi */}
      <div className="mt-[24px]">
        <p
          className="text-[var(--muted-foreground)] mb-[6px]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            lineHeight: '18px',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
          }}
        >
          Oggetto tesi
        </p>
        {isEditing ? (
          <div className="flex flex-col gap-[8px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={3}
              className="w-full bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] px-[12px] py-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: '26px',
                borderRadius: 'var(--radius)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
            <div className="flex gap-[6px] justify-end">
              <button
                onClick={handleCancel}
                className="shrink-0 px-[12px] py-[6px] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors flex items-center gap-[6px]"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <X className="w-3.5 h-3.5" />
                Annulla
              </button>
              <button
                onClick={handleSave}
                className="shrink-0 px-[12px] py-[6px] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity flex items-center gap-[6px]"
                style={{
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                <Check className="w-3.5 h-3.5" />
                Salva
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-[var(--foreground)]"
            style={{
              fontFamily: 'var(--font-alegreya)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-medium)',
              lineHeight: '26px',
            }}
          >
            {thesisSubject || (
              <span
                className="text-[var(--muted-foreground)] italic"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: '20px',
                  letterSpacing: '-0.14px',
                }}
              >
                Nessun oggetto tesi definito
              </span>
            )}
          </p>
        )}
      </div>

      {/* Info grid - 2 columns */}
      <div
        className="grid grid-cols-2 mt-[24px]"
        style={{ gap: '24px' }}
      >
        <InfoField label="Corso di laurea" value={degree} />
        <InfoField label="Materia di tesi" value={thesisMatter || '(mancante)'} isMissing={!thesisMatter} />
        <InfoField label="Livello tesi" value={thesisLevel} />
        <InfoField label="Tipologia tesi" value={thesisType} />
        <InfoField
          label="Relatore"
          value={supervisor}
          isMissing={!supervisor || supervisor === '(mancante)'}
        />
      </div>

      {/* Contatti studente */}
      {(studentPhone || studentEmail) && (
        <div className="mt-[24px] pt-[8px]">
          <p
            className="text-[var(--muted-foreground)] mb-[10px]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              lineHeight: '18px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
            }}
          >
            Contatti studente
          </p>
          <div className="flex flex-col gap-[12px]">
            {studentPhone && (
              <ContactRow
                value={studentPhone}
                actions={[
                  { icon: <Phone className="w-[14px] h-[14px]" />, label: 'Chiama', href: `tel:${studentPhone}` },
                  { icon: <MessageCircle className="w-[14px] h-[14px]" />, label: 'SMS', href: `sms:${studentPhone}` },
                  { icon: <WhatsAppIcon />, label: 'WhatsApp', href: `https://wa.me/${studentPhone.replace(/\s+/g, '').replace('+', '')}` },
                ]}
              />
            )}
            {studentEmail && (
              <ContactRow
                value={studentEmail}
                actions={[
                  { icon: <Mail className="w-[14px] h-[14px]" />, label: 'Invia email', href: `mailto:${studentEmail}` },
                ]}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  isMissing,
}: {
  label: string;
  value: string;
  isMissing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-px">
      <p
        className="text-[var(--muted-foreground)]"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: '21px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: '20px',
          letterSpacing: '-0.14px',
          color: isMissing ? 'var(--destructive-foreground)' : 'var(--foreground)',
        }}
      >
        {isMissing ? '(mancante)' : value}
      </p>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface ContactAction {
  icon: React.ReactNode;
  label: string;
  href: string;
}

function ContactRow({ value, actions }: { value: string; actions: ContactAction[] }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex items-center justify-between gap-[8px]">
      {/* Value label */}
      <span
        className="text-[var(--foreground)] min-w-0 truncate"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: '20px',
        }}
      >
        {value}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-[4px] shrink-0">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            target={action.href.startsWith('https') ? '_blank' : undefined}
            rel={action.href.startsWith('https') ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius)',
            }}
            title={action.label}
          >
            {action.icon}
          </a>
        ))}
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center transition-colors ${
            copied
              ? 'text-[var(--primary)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
          }`}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius)',
          }}
          title={copied ? 'Copiato!' : 'Copia'}
        >
          {copied ? <Check className="w-[14px] h-[14px]" /> : <Copy className="w-[14px] h-[14px]" />}
        </button>
      </div>
    </div>
  );
}

/* ─── Share With Student Card ─── */

interface ShareWithStudentCardProps {
  archiveCount?: number;
  newDocCount?: number;
  onOpenArchive: () => void;
  onOpenProfile: () => void;
  onFilesUploaded?: (files: File[]) => void;
  steps?: StepOption[];
  onAssignFileToStep?: (fileId: string, fileName: string, stepId: string | null) => void;
}

export function ShareWithStudentCard({
  archiveCount,
  newDocCount,
  onOpenArchive,
  onOpenProfile,
  onFilesUploaded,
  steps,
  onAssignFileToStep,
}: ShareWithStudentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentFileToAssign, setCurrentFileToAssign] = useState<{ id: string; name: string } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFilesInternal = useCallback(
    (files: File[]) => {
      onFilesUploaded?.(files);

      // After uploading, show assign modal for the first file
      if (files.length > 0 && steps && steps.length > 0) {
        const fileId = `file-${Date.now()}-${Math.random()}`;
        setCurrentFileToAssign({ id: fileId, name: files[0].name });
        setAssignModalOpen(true);
      } else {
        setShowSuccessMessage(true);
      }
    },
    [onFilesUploaded, steps]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFilesInternal(droppedFiles);
      }
    },
    [handleFilesInternal]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        handleFilesInternal(selectedFiles);
      }
      e.target.value = '';
    },
    [handleFilesInternal]
  );

  const handleAssignStep = (stepId: string | null) => {
    if (currentFileToAssign) {
      onAssignFileToStep?.(currentFileToAssign.id, currentFileToAssign.name, stepId);
      setAssignModalOpen(false);
      setShowSuccessMessage(true);
      setCurrentFileToAssign(null);
    }
  };

  // Compute badge text
  const badgeText = newDocCount && newDocCount > 0
    ? `${newDocCount} nuov${newDocCount === 1 ? 'o' : 'i'}`
    : archiveCount && archiveCount > 0
      ? `${archiveCount}`
      : null;

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] flex flex-col"
      style={{ borderRadius: 'var(--radius)' }}
    >
      {/* Header */}
      <div className="pt-[24px] px-[24px]">
        <p
          className="text-[var(--foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-medium)',
            lineHeight: '27px',
            letterSpacing: '-0.44px',
          }}
        >
          Condividi con lo studente
        </p>
      </div>

      {/* Upload zone */}
      <div className="px-[24px] mt-[16px]">
        <div
          className={`flex flex-col items-center justify-center py-[32px] px-[32px] border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-[var(--ring)] bg-[var(--ring)]/5'
              : 'border-[var(--border)] bg-[var(--card)]'
          }`}
          style={{ borderRadius: 'var(--radius)' }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Upload icon circle */}
          <div
            className="flex items-center justify-center mb-[10px]"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--muted)',
            }}
          >
            <Upload className="w-6 h-6 text-[var(--secondary)]" />
          </div>

          {/* Text */}
          <p
            className="text-[var(--foreground)] text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              lineHeight: '20px',
              letterSpacing: '-0.15px',
            }}
          >
            Trascina i file qui per condividerli
          </p>

          {/* Supported formats */}
          <p
            className="text-[var(--muted-foreground)] text-center mt-[10px]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              lineHeight: '16px',
            }}
          >
            PDF, DOC, DOCX, TXT, immagini fino a 50MB
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div
          className="mx-[24px] mt-[12px] px-[12px] py-[10px] bg-[var(--muted)] flex items-center justify-between"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="flex items-center gap-[8px]">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
              }}
            >
              <Check className="w-3 h-3 text-[var(--accent-foreground)]" />
            </div>
            <p
              className="text-[var(--foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: '20px',
              }}
            >
              File caricato
            </p>
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onOpenArchive}
              className="text-[var(--foreground)] underline hover:no-underline"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: '20px',
              }}
            >
              Archivio
            </button>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="flex-shrink-0 p-[2px] hover:bg-[var(--border)] transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
              aria-label="Chiudi notifica"
            >
              <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col mt-[16px]">
        {/* Archivio condiviso */}
        <button
          onClick={onOpenArchive}
          className="w-full flex items-center justify-between px-[25px] py-[17px] border-t border-[var(--border)] group hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-center gap-[8px]">
            <Folder className="w-4 h-4 text-[var(--secondary)] group-hover:text-[var(--foreground)] transition-colors" />
            <span
              className="text-[var(--secondary)] group-hover:text-[var(--foreground)] transition-colors"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
              }}
            >
              Archivio condiviso
            </span>
            {badgeText && (
              <span
                className="bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center px-[8px]"
                style={{
                  borderRadius: '4px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: '16px',
                  height: 24,
                  textTransform: 'uppercase',
                }}
              >
                {badgeText}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
        </button>

        {/* Profilo studente */}
        
      </div>

      {/* Assign Step Modal */}
      {steps && (
        <AssignStepModal
          isOpen={assignModalOpen}
          onClose={() => { setAssignModalOpen(false); setCurrentFileToAssign(null); }}
          fileName={currentFileToAssign?.name || ''}
          steps={steps}
          onAssign={handleAssignStep}
        />
      )}
    </div>
  );
}