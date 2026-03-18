import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, FileText, Upload, Plus, Trash2, CheckCircle2, Pencil, Check, X, MoveUp, MoveDown, Calendar, Eye, EyeOff, MessageSquare, Clock, AlertTriangle, Lock, Unlock, MoreVertical, Send } from 'lucide-react';

export interface TimelineStepData {
  id: string;
  phaseNumber: string;
  title: string;
  description?: string;
  startDate?: string;
  deadline: string;
  originalDeadline?: string;
  completedDate?: string;
  completionStatus?: 'on-time' | 'early' | 'late';
  status: 'active' | 'completed' | 'upcoming';
  isDraft?: boolean;
  isVisibleToStudent?: boolean;
  documents: DocumentItem[];
  activities: ActivityItem[];
}

export interface DocumentItem {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string;
  isNew?: boolean;
}

export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isNew?: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'document' | 'note';
  timestamp: string;
  author: string;
  isNew?: boolean;
  // For documents
  fileName?: string;
  description?: string;
  // For notes
  content?: string;
}

interface CoachTimelineListProps {
  steps: TimelineStepData[];
  filterMode: 'open' | 'upcoming' | 'completed' | 'all';
  canManageSteps?: boolean;
  onAddStep?: (afterStepId: string | null, status?: 'active' | 'upcoming') => void;
  onRemoveStep?: (stepId: string) => void;
  onToggleStepStatus?: (stepId: string, newStatus: 'active' | 'upcoming') => void;
  onMarkStepCompleted?: (stepId: string) => void;
  onUpdateStepTitle?: (stepId: string, newTitle: string) => void;
  onUpdateStepDescription?: (stepId: string, newDescription: string) => void;
  onUpdateStepStartDate?: (stepId: string, newStartDate: string) => void;
  onUpdateStepDeadline?: (stepId: string, newDeadline: string) => void;
  onMoveStep?: (stepId: string, direction: 'up' | 'down') => void;
  onToggleVisibility?: (stepId: string) => void;
  onConfirmDraft?: (stepId: string) => void;
  onAddNote?: (stepId: string, content: string) => void;
  onOpenStepArchive?: (stepId: string) => void;
  onBulkImport?: () => void;
}

export function CoachTimelineList({ 
  steps, 
  filterMode,
  canManageSteps = true,
  onAddStep,
  onRemoveStep,
  onToggleStepStatus,
  onMarkStepCompleted,
  onUpdateStepTitle,
  onUpdateStepDescription,
  onUpdateStepStartDate,
  onUpdateStepDeadline,
  onMoveStep,
  onToggleVisibility,
  onConfirmDraft,
  onAddNote,
  onOpenStepArchive,
  onBulkImport,
}: CoachTimelineListProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ stepId: string; field: 'title' | 'description' | 'startDate' | 'deadline' } | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [isCompletedSectionExpanded, setIsCompletedSectionExpanded] = useState(true);
  const [isUpcomingSectionExpanded, setIsUpcomingSectionExpanded] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [addingNoteToStep, setAddingNoteToStep] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (filterMode === 'all') {
      setExpandedSteps(new Set());
      setIsCompletedSectionExpanded(true);
      setIsUpcomingSectionExpanded(true);
    }
  }, [filterMode, steps]);

  // Auto-expand draft steps and trigger title editing
  useEffect(() => {
    const draftSteps = steps.filter(s => s.isDraft);
    if (draftSteps.length > 0) {
      setExpandedSteps(prev => {
        const newSet = new Set(prev);
        let changed = false;
        draftSteps.forEach(s => {
          if (!newSet.has(s.id)) {
            newSet.add(s.id);
            changed = true;
          }
        });
        return changed ? newSet : prev;
      });
      // Auto-trigger title editing for new drafts
      const latestDraft = draftSteps[draftSteps.length - 1];
      if (latestDraft && latestDraft.title === 'Nuova Fase' && !editingField) {
        setEditingField({ stepId: latestDraft.id, field: 'title' });
        setEditDraft(latestDraft.title);
      }
    }
  }, [steps]);

  // Close overflow menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const filteredSteps = steps.filter(step => {
    if (filterMode === 'open') return step.status === 'active';
    if (filterMode === 'upcoming') return step.status === 'upcoming';
    if (filterMode === 'completed') return step.status === 'completed';
    return true;
  });

  const sortedSteps = [...filteredSteps].sort((a, b) => {
    const getPhaseNum = (pn: string) => {
      const match = pn.match(/FASE\s+(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    return getPhaseNum(a.phaseNumber) - getPhaseNum(b.phaseNumber);
  });

  function getActivityCounts(step: TimelineStepData) {
    const docCount = step.activities.filter(a => a.type === 'document').length;
    const noteCount = step.activities.filter(a => a.type === 'note').length;
    const newDocCount = step.activities.filter(a => a.type === 'document' && a.isNew).length;
    const newNoteCount = step.activities.filter(a => a.type === 'note' && a.isNew).length;
    const total = docCount + noteCount;
    const totalNew = newDocCount + newNoteCount;
    return { docCount, noteCount, newDocCount, newNoteCount, total, totalNew };
  }

  function renderActivitySummaryBar(step: TimelineStepData, isActivityExpanded: boolean) {
    const { docCount, noteCount, totalNew, total } = getActivityCounts(step);

    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] cursor-pointer hover:bg-[rgba(0,0,0,0.02)] transition-colors"
        style={{
          backgroundColor: 'var(--muted)',
          borderRadius: isActivityExpanded ? '0' : '0 0 var(--radius) var(--radius)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          toggleStep(step.id);
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          {total === 0 ? (
            <span
              className="text-[var(--muted-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                fontStyle: 'italic',
              }}
            >
              Nessuna attività
            </span>
          ) : (
            <>
              {docCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStepArchive?.(step.id);
                  }}
                  title="Apri archivio documenti della fase"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {docCount} {docCount === 1 ? 'documento' : 'documenti'}
                </span>
              )}
              {docCount > 0 && noteCount > 0 && (
                <span
                  className="text-[var(--border)]"
                  style={{ fontSize: '12px' }}
                >
                  ·
                </span>
              )}
              {noteCount > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)]"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {noteCount} {noteCount === 1 ? 'nota' : 'note'}
                </span>
              )}
              {totalNew > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5"
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
                  {totalNew} {totalNew === 1 ? 'nuovo' : 'nuovi'}
                </span>
              )}
            </>
          )}
        </div>
        <span
          className="text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {isActivityExpanded ? 'Nascondi attività' : 'Mostra attività'}
        </span>
        {isActivityExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        )}
      </div>
    );
  }

  function renderStepActions(step: TimelineStepData, index: number) {
    if (!canManageSteps) {
      return null;
    }

    const canMoveUp = index > 0;
    const canMoveDown = index < sortedSteps.length - 1;

    return (
      <div className="flex items-center gap-1.5">
        {/* Draft: Confirm button */}
        {step.isDraft && onConfirmDraft && (() => {
          const isReady = step.title !== 'Nuova Fase' && step.deadline !== 'Data da definire';
          return (
            <button
              onClick={(e) => { e.stopPropagation(); if (isReady) onConfirmDraft(step.id); }}
              disabled={!isReady}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-opacity ${
                isReady
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
              }`}
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
              }}
              title={isReady ? 'Conferma e rendi visibile allo studente' : 'Compila almeno titolo e scadenza per confermare'}
            >
              <Check className="w-4 h-4" />
              <span className="hidden lg:inline">Conferma fase</span>
            </button>
          );
        })()}

        {/* Active (non-draft): Complete button */}
        {!step.isDraft && step.status === 'active' && onMarkStepCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkStepCompleted(step.id); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] text-[var(--primary)] hover:bg-[rgba(11,182,63,0.08)] hover:border-[var(--primary)] transition-colors cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
            }}
            title="Segna come completata"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden lg:inline">Completa fase</span>
          </button>
        )}

        {/* Upcoming (non-draft): Activate button */}
        {!step.isDraft && step.status === 'upcoming' && onToggleStepStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStepStatus(step.id, 'active'); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] text-[var(--primary)] hover:bg-[rgba(11,182,63,0.08)] hover:border-[var(--primary)] transition-colors cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
            }}
            title="Attiva questa fase per lo studente"
          >
            <Unlock className="w-4 h-4" />
            <span className="hidden lg:inline">Attiva fase</span>
          </button>
        )}

        {/* Completed: Reopen button */}
        {!step.isDraft && step.status === 'completed' && onToggleStepStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStepStatus(step.id, 'active'); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
            }}
            title="Riapri questa fase"
          >
            Riapri fase
          </button>
        )}

        {/* Overflow menu */}
        {(onRemoveStep || onMoveStep || onToggleVisibility || (step.status === 'active' && onToggleStepStatus)) && (
          <div className="relative" ref={openMenuId === step.id ? menuRef : undefined}>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === step.id ? null : step.id); }}
              className="p-2 border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--foreground)] transition-colors cursor-pointer"
              style={{ borderRadius: 'var(--radius)' }}
              title="Altre azioni"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {openMenuId === step.id && (
              <div
                className="absolute right-0 top-full mt-1 z-50 bg-[var(--popover)] border border-[var(--border)] py-1 min-w-[200px]"
                style={{
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--elevation-sm)',
                }}
              >
                {/* Deactivate active phase */}
                {!step.isDraft && step.status === 'active' && onToggleStepStatus && (
                  <>
                    <button
                      onClick={() => { onToggleStepStatus(step.id, 'upcoming'); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      Disattiva fase
                    </button>
                    {(onToggleVisibility || onMoveStep || onRemoveStep) && <div className="my-1 border-t border-[var(--border)]" />}
                  </>
                )}
                {/* Visibility toggle */}
                {!step.isDraft && onToggleVisibility && (
                  <>
                    <button
                      onClick={() => { onToggleVisibility(step.id); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {step.isVisibleToStudent ? (
                        <>
                          <EyeOff className="w-4 h-4 flex-shrink-0" />
                          Nascondi allo studente
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 flex-shrink-0" />
                          Mostra allo studente
                        </>
                      )}
                    </button>
                    {(onMoveStep || onRemoveStep) && <div className="my-1 border-t border-[var(--border)]" />}
                  </>
                )}
                {onMoveStep && (
                  <>
                    <button
                      onClick={() => { onMoveStep(step.id, 'up'); setOpenMenuId(null); }}
                      disabled={!canMoveUp}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        canMoveUp
                          ? 'text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer'
                          : 'text-[var(--border)] cursor-not-allowed'
                      }`}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      <MoveUp className="w-4 h-4 flex-shrink-0" />
                      Sposta su
                    </button>
                    <button
                      onClick={() => { onMoveStep(step.id, 'down'); setOpenMenuId(null); }}
                      disabled={!canMoveDown}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        canMoveDown
                          ? 'text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer'
                          : 'text-[var(--border)] cursor-not-allowed'
                      }`}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      <MoveDown className="w-4 h-4 flex-shrink-0" />
                      Sposta giù
                    </button>
                    {onRemoveStep && <div className="my-1 border-t border-[var(--border)]" />}
                  </>
                )}
                {onRemoveStep && (
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      if (confirm(`Sei sicuro di voler eliminare la fase "${step.title}"?`)) {
                        onRemoveStep(step.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    Elimina fase
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderCompactStep(step: TimelineStepData, index: number) {
    const hasNewDocs = step.documents.some(d => d.isNew);

    return (
      <div
        key={step.id}
        className={`transition-colors ${
          step.isDraft
            ? 'bg-[rgba(247,144,9,0.02)] border-2 border-dashed border-[rgba(247,144,9,0.3)]'
            : 'bg-[var(--card)] border border-[var(--border)]'
        }`}
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div
          className="p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors"
          style={{ borderRadius: 'var(--radius) var(--radius) 0 0' }}
          onClick={() => toggleStep(step.id)}
        >
          <div className="flex items-center gap-3">
            <p
              className="uppercase tracking-wider text-[var(--muted-foreground)] flex-shrink-0"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {step.phaseNumber}
            </p>
            {step.isDraft && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 flex-shrink-0"
                style={{
                  borderRadius: 'var(--radius-badge)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: 1.5,
                  backgroundColor: 'rgba(247, 144, 9, 0.08)',
                  border: '1px solid rgba(247, 144, 9, 0.35)',
                  color: 'var(--chart-3)',
                }}
              >
                Bozza
              </span>
            )}
            <h3
              className="flex-1"
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: 'var(--text-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}
            >
              {step.title}
            </h3>
            {hasNewDocs && (
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] border border-[var(--foreground)] flex-shrink-0" />
            )}
            <span
              className="text-[var(--muted-foreground)] flex-shrink-0"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
              }}
            >
              {formatCollapsedDeadline(step)}
            </span>
            {!step.isDraft && !step.isVisibleToStudent && (
              <EyeOff className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chart-3)' }} />
            )}
            {renderStepActions(step, index)}
          </div>
        </div>
        {renderActivitySummaryBar(step, false)}
      </div>
    );
  }

  function renderExpandedStep(step: TimelineStepData, index: number) {
    const isExpanded = expandedSteps.has(step.id);
    const hasNewDocs = step.documents.some(d => d.isNew);
    
    return (
      <div key={step.id}>
        <div 
          className={`${
            step.isDraft 
              ? 'bg-[rgba(247,144,9,0.02)] border-2 border-dashed border-[rgba(247,144,9,0.3)]' 
              : 'bg-[var(--card)] border border-[var(--border)]'
          }`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p
                    className="uppercase tracking-wider text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {step.phaseNumber}
                  </p>
                  {hasNewDocs && (
                    <div className="relative flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[var(--accent)] border border-[var(--foreground)]" />
                    </div>
                  )}
                </div>
                
                {editingField?.stepId === step.id && editingField.field === 'title' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateStepTitle?.(step.id, editDraft);
                          setEditingField(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      style={{
                        fontFamily: 'var(--font-alegreya)',
                        fontSize: 'var(--text-h3)',
                        fontWeight: 'var(--font-weight-bold)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    />
                    <button
                      onClick={() => {
                        onUpdateStepTitle?.(step.id, editDraft);
                        setEditingField(null);
                      }}
                      className="p-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                      style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                      title="Salva"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-2 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                      style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                      title="Annulla"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 
                    className={`mb-3 transition-colors ${canManageSteps && onUpdateStepTitle ? 'cursor-pointer hover:text-[var(--muted-foreground)]' : ''}`}
                    style={{
                      fontFamily: 'var(--font-alegreya)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-bold)',
                      lineHeight: 1.5,
                      color: 'var(--foreground)',
                    }}
                    onClick={() => {
                      if (canManageSteps && onUpdateStepTitle) {
                        setEditingField({ stepId: step.id, field: 'title' });
                        setEditDraft(step.title);
                      }
                    }}
                    title={canManageSteps && onUpdateStepTitle ? 'Clicca per modificare' : undefined}
                  >
                    {step.title}
                  </h3>
                )}
                
                {editingField?.stepId === step.id && editingField.field === 'description' ? (
                  <div className="flex items-start gap-2 mb-3">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          onUpdateStepDescription?.(step.id, editDraft);
                          setEditingField(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      rows={3}
                      className="flex-1 px-3 py-2 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                        lineHeight: 1.5,
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          onUpdateStepDescription?.(step.id, editDraft);
                          setEditingField(null);
                        }}
                        className="p-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                        style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                        title="Salva"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className="p-2 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                        style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                        title="Annulla"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  step.description ? (
                    <p
                      className={`mb-3 text-[var(--muted-foreground)] transition-colors ${canManageSteps && onUpdateStepDescription ? 'cursor-pointer hover:text-[var(--foreground)]' : ''}`}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                      onClick={() => {
                        if (canManageSteps && onUpdateStepDescription) {
                          setEditingField({ stepId: step.id, field: 'description' });
                          setEditDraft(step.description);
                        }
                      }}
                      title={canManageSteps && onUpdateStepDescription ? 'Clicca per modificare' : undefined}
                    >
                      {step.description}
                    </p>
                  ) : canManageSteps && onUpdateStepDescription ? (
                    <p
                      className="mb-3 cursor-pointer hover:text-[var(--muted-foreground)] transition-colors"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                        lineHeight: 1.5,
                        color: 'var(--border)',
                        fontStyle: 'italic',
                      }}
                      onClick={() => {
                        setEditingField({ stepId: step.id, field: 'description' });
                        setEditDraft('');
                      }}
                      title="Clicca per aggiungere una descrizione"
                    >
                      + Aggiungi descrizione...
                    </p>
                  ) : null
                )}
                
                {editingField?.stepId === step.id && (editingField.field === 'startDate' || editingField.field === 'deadline') ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      {editingField.field === 'startDate' ? 'Inizio:' : 'Scadenza:'}
                    </span>
                    <input
                      type="date"
                      value={editDraft}
                      onChange={(e) => {
                        setEditDraft(e.target.value);
                        // Auto-save on date selection
                        if (e.target.value) {
                          const italianDate = isoToItalianDate(e.target.value);
                          if (editingField.field === 'startDate') {
                            onUpdateStepStartDate?.(step.id, italianDate);
                          } else {
                            onUpdateStepDeadline?.(step.id, italianDate);
                          }
                          setEditingField(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      autoFocus
                      className="px-2 py-1 border border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      style={{ 
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                      style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                      title="Annulla"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span
                      className="text-[var(--muted-foreground)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-regular)',
                      }}
                    >
                      {step.startDate ? (
                        <>
                          <span
                            style={{
                              fontWeight: 'var(--font-weight-medium)',
                            }}
                          >
                            Inizio:{' '}
                          </span>
                          <span
                            className={canManageSteps && onUpdateStepStartDate ? 'cursor-pointer hover:text-[var(--foreground)] transition-colors' : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canManageSteps && onUpdateStepStartDate) {
                                setEditingField({ stepId: step.id, field: 'startDate' });
                                setEditDraft(italianDateToISO(step.startDate));
                              }
                            }}
                            title={canManageSteps && onUpdateStepStartDate ? 'Clicca per modificare data inizio' : undefined}
                          >
                            {stripDatePrefix(step.startDate)}
                          </span>
                        </>
                      ) : canManageSteps && onUpdateStepStartDate ? (
                        <span
                          className="cursor-pointer hover:text-[var(--foreground)] transition-colors"
                          style={{ fontStyle: 'italic', color: 'var(--border)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingField({ stepId: step.id, field: 'startDate' });
                            setEditDraft('');
                          }}
                          title="Imposta data inizio"
                        >
                          + Data inizio
                        </span>
                      ) : null}
                      {(step.startDate || onUpdateStepStartDate) && ' · '}
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        Scadenza:{' '}
                      </span>
                      <span
                        className={canManageSteps && onUpdateStepDeadline ? 'cursor-pointer hover:text-[var(--foreground)] transition-colors' : undefined}
                        style={step.deadline === 'Data da definire' ? { fontStyle: 'italic', color: 'var(--border)' } : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canManageSteps && onUpdateStepDeadline) {
                            setEditingField({ stepId: step.id, field: 'deadline' });
                            setEditDraft(italianDateToISO(step.deadline));
                          }
                        }}
                        title={canManageSteps && onUpdateStepDeadline ? 'Clicca per modificare scadenza' : undefined}
                      >
                        {stripDatePrefix(step.deadline)}
                      </span>
                    </span>
                    {(() => {
                      const info = getDeadlineInfo(step);
                      if (!info) return null;
                      const colorMap = {
                        success: {
                          bg: 'var(--primary)',
                          text: 'var(--primary-foreground)',
                        },
                        warning: {
                          bg: 'var(--chart-3)',
                          text: '#fff',
                        },
                        danger: {
                          bg: 'var(--destructive)',
                          text: 'var(--destructive-foreground)',
                        },
                        neutral: {
                          bg: 'var(--muted)',
                          text: 'var(--muted-foreground)',
                        },
                      };
                      const colors = colorMap[info.type];
                      return (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-medium)',
                            borderRadius: 'var(--radius-badge)',
                            backgroundColor: colors.bg,
                            color: colors.text,
                            lineHeight: 1.5,
                          }}
                        >
                          {info.type === 'danger' && <AlertTriangle className="w-3 h-3" />}
                          {info.type === 'warning' && <Clock className="w-3 h-3" />}
                          {info.label}
                        </span>
                      );
                    })()}
                  </div>
                )}
                
                {step.status === 'completed' && step.completionStatus && (
                  <div
                    className="px-2 py-0.5 text-[11px] uppercase flex items-center gap-1"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontWeight: 'var(--font-weight-medium)',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      backgroundColor: 
                        step.completionStatus === 'early' ? 'rgba(11, 182, 63, 0.1)' :
                        step.completionStatus === 'on-time' ? 'rgba(11, 182, 63, 0.1)' :
                        'var(--destructive)',
                      color: 
                        step.completionStatus === 'early' ? 'var(--primary)' :
                        step.completionStatus === 'on-time' ? 'var(--primary)' :
                        'var(--destructive-foreground)',
                    }}
                  >
                    {step.completionStatus === 'early' && '✓ Completata in anticipo'}
                    {step.completionStatus === 'on-time' && '✓ Completata in tempo'}
                    {step.completionStatus === 'late' && '⚠ Completata in ritardo'}
                  </div>
                )}
              </div>
              
              {/* === ACTION AREA === */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Row 1: Status indicator chips (read-only) */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Draft chip */}
                  {step.isDraft && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 border"
                      style={{
                        borderRadius: 'var(--radius-badge)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                        lineHeight: 1.5,
                        backgroundColor: 'rgba(247, 144, 9, 0.08)',
                        borderColor: 'rgba(247, 144, 9, 0.35)',
                        color: 'var(--chart-3)',
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Bozza
                    </span>
                  )}

                  {/* Hidden chip (confirmed phases manually hidden) */}
                  {!step.isDraft && !step.isVisibleToStudent && step.status !== 'completed' && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 border"
                      style={{
                        borderRadius: 'var(--radius-badge)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                        lineHeight: 1.5,
                        backgroundColor: 'rgba(247, 144, 9, 0.08)',
                        borderColor: 'rgba(247, 144, 9, 0.35)',
                        color: 'var(--chart-3)',
                      }}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Nascosta
                    </span>
                  )}
                </div>

                {/* Row 2: Primary action + overflow menu + chevron */}
                {renderStepActions(step, index)}
              </div>
            </div>
          </div>

          {/* Action bar: quick actions for the step */}
          <div
            className="flex items-center gap-2 px-6 pb-4"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (addingNoteToStep === step.id) {
                  setAddingNoteToStep(null);
                  setNoteText('');
                } else {
                  setAddingNoteToStep(step.id);
                  setNoteText('');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors hover:bg-[var(--muted)] cursor-pointer"
              style={{
                borderColor: addingNoteToStep === step.id ? 'var(--foreground)' : 'var(--border)',
                backgroundColor: addingNoteToStep === step.id ? 'var(--muted)' : 'var(--background)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              Aggiungi nota
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStepArchive?.(step.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] bg-[var(--background)] transition-colors hover:bg-[var(--muted)] cursor-pointer"
              style={{
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              <Upload className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              Carica documento
            </button>
          </div>

          {/* Inline note form */}
          {addingNoteToStep === step.id && (
            <div className="px-6 pb-4">
              <div
                className="p-3"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Scrivi una nota per questa fase..."
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      if (noteText.trim()) {
                        onAddNote?.(step.id, noteText.trim());
                        setAddingNoteToStep(null);
                        setNoteText('');
                      }
                    }
                    if (e.key === 'Escape') {
                      setAddingNoteToStep(null);
                      setNoteText('');
                    }
                  }}
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
                <div className="flex items-center justify-between mt-2">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    Ctrl+Invio per inviare · Esc per annullare
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAddingNoteToStep(null);
                        setNoteText('');
                      }}
                      className="px-3 py-1.5 transition-colors hover:bg-[var(--background)]"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--muted-foreground)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => {
                        if (noteText.trim()) {
                          onAddNote?.(step.id, noteText.trim());
                          setAddingNoteToStep(null);
                          setNoteText('');
                        }
                      }}
                      disabled={!noteText.trim()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-opacity ${
                        noteText.trim()
                          ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 cursor-pointer'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                      }`}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                        borderRadius: 'calc(var(--radius) - 2px)',
                      }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Invia nota
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity summary bar */}
          {renderActivitySummaryBar(step, isExpanded)}

          {/* Activity feed */}
          {isExpanded && (
            <div
              className="px-6 pb-6"
              style={{
                backgroundColor: 'var(--muted)',
                borderRadius: '0 0 var(--radius) var(--radius)',
              }}
            >
              <ActivityFeedSection step={step} onOpenStepArchive={onOpenStepArchive} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper: group steps by month based on deadline/completion date (Approach B)
  // Always uses the deadline — the coach monitors deadlines, start dates are indicative
  function getMonthKey(step: TimelineStepData): string {
    // Priority: deadline (contains completion date for completed, deadline for others)
    // Fallback to startDate only if deadline is missing
    const dateStr = step.deadline || step.startDate;
    const parsed = parseItalianDate(stripDatePrefix(dateStr));
    if (!parsed) return 'Senza data';
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${monthNames[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  function groupByMonth(stepsToGroup: TimelineStepData[]): { month: string; steps: TimelineStepData[] }[] {
    const map = new Map<string, TimelineStepData[]>();
    stepsToGroup.forEach(step => {
      const key = getMonthKey(step);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(step);
    });
    return Array.from(map.entries()).map(([month, stps]) => ({ month, steps: stps }));
  }

  // Status group chip config
  const groupCfg = {
    completed: {
      label: 'Completate',
      dotColor: 'var(--primary)',
      chipBg: 'rgba(11, 182, 63, 0.08)',
      chipBorder: 'rgba(11, 182, 63, 0.25)',
      chipText: 'var(--primary)',
      lineColor: 'rgba(11, 182, 63, 0.25)',
    },
    active: {
      label: 'Aperte',
      dotColor: 'var(--chart-3)',
      chipBg: 'rgba(247, 144, 9, 0.08)',
      chipBorder: 'rgba(247, 144, 9, 0.30)',
      chipText: 'var(--chart-3)',
      lineColor: 'rgba(247, 144, 9, 0.25)',
    },
    upcoming: {
      label: 'Prossime fasi',
      dotColor: 'var(--muted-foreground)',
      chipBg: 'var(--muted)',
      chipBorder: 'var(--border)',
      chipText: 'var(--muted-foreground)',
      lineColor: 'var(--border)',
    },
  };

  function renderGroupChip(
    status: 'completed' | 'active' | 'upcoming',
    count: number,
    isCollapsible: boolean,
    isSectionExpanded: boolean,
    onToggle?: () => void,
  ) {
    const cfg = groupCfg[status];
    return (
      <div className="flex items-center gap-3 relative" style={{ zIndex: 1 }}>
        {/* Node dot */}
        <div
          className="shrink-0"
          style={{
            width: '11px',
            height: '11px',
            borderRadius: '50%',
            background: cfg.dotColor,
            border: '2px solid var(--background)',
            boxShadow: `0 0 0 2px ${cfg.dotColor}`,
          }}
        />
        {/* Chip */}
        <button
          onClick={isCollapsible ? onToggle : undefined}
          className={`inline-flex items-center gap-2 px-3 py-1.5 transition-colors ${isCollapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          style={{
            borderRadius: 'var(--radius-badge)',
            background: cfg.chipBg,
            border: `1px solid ${cfg.chipBorder}`,
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            color: cfg.chipText,
          }}
        >
          <span>{cfg.label}</span>
          <span
            className="inline-flex items-center justify-center"
            style={{
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: cfg.dotColor,
              color: status === 'upcoming' ? 'var(--background)' : '#fff',
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              padding: '0 5px',
            }}
          >
            {count}
          </span>
          {isCollapsible && (
            isSectionExpanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  }

  function renderMonthNode(month: string, lineColor: string) {
    return (
      <div className="flex items-center gap-3 relative" style={{ zIndex: 1, marginLeft: '2px' }}>
        <div
          className="shrink-0"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: lineColor,
            opacity: 0.8,
          }}
        />
        <span
          className="uppercase tracking-wider"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            letterSpacing: '0.5px',
          }}
        >
          {month}
        </span>
      </div>
    );
  }

  function renderMonthSteps(stepsInMonth: TimelineStepData[], statusGroup: 'completed' | 'active' | 'upcoming') {
    return (
      <div className="flex flex-col gap-2" style={{ marginLeft: '22px', paddingLeft: '14px' }}>
        {stepsInMonth.map((step, index) => {
          const isExp = expandedSteps.has(step.id);
          if (statusGroup === 'active' || isExp) {
            return renderExpandedStep(step, index);
          }
          return renderCompactStep(step, index);
        })}
      </div>
    );
  }

  function renderTimelineSection(
    status: 'completed' | 'active' | 'upcoming',
    sectionSteps: TimelineStepData[],
    isCollapsible: boolean,
    isSectionExpanded: boolean,
    onToggle?: () => void,
    showAddButton?: boolean,
  ) {
    if (sectionSteps.length === 0) return null;
    const cfg = groupCfg[status];
    const monthGroups = groupByMonth(sectionSteps);

    return (
      <div className="relative">
        {/* Timeline vertical line */}
        <div
          className="absolute"
          style={{
            left: '4.5px',
            top: '11px',
            bottom: isSectionExpanded ? '0' : '11px',
            width: '2px',
            background: isSectionExpanded ? cfg.lineColor : 'transparent',
          }}
        />

        <div className="flex flex-col gap-4">
          {renderGroupChip(status, sectionSteps.length, isCollapsible, isSectionExpanded, onToggle)}

          {isSectionExpanded && (
            <div className="flex flex-col gap-5">
              {monthGroups.map(({ month, steps: monthSteps }) => (
                <div key={month} className="flex flex-col gap-2">
                  {renderMonthNode(month, cfg.dotColor)}
                  {renderMonthSteps(monthSteps, status)}
                </div>
              ))}

              {canManageSteps && showAddButton && onAddStep && (
                <div className="flex items-center justify-center gap-2" style={{ marginLeft: '22px' }}>
                  <button
                    onClick={() => {
                      const lastStep = sectionSteps[sectionSteps.length - 1];
                      onAddStep(lastStep?.id || null, status === 'upcoming' ? 'upcoming' : 'active');
                    }}
                    className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    style={{
                      borderRadius: 'var(--radius)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                    title={status === 'active' ? 'Aggiungi fase aperta' : 'Aggiungi prossima fase'}
                  >
                    <Plus className="w-3 h-3" />
                    {status === 'active' ? 'Aggiungi fase aperta' : 'Aggiungi prossima fase'}
                  </button>
                  {status === 'upcoming' && onBulkImport && (
                    <button
                      onClick={onBulkImport}
                      className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] hover:border-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      style={{
                        borderRadius: 'var(--radius)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                      title="Aggiungi più fasi"
                    >
                      <Upload className="w-3 h-3" />
                      Aggiungi fasi
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {filterMode === 'all' ? (
        <div className="flex flex-col gap-8">
          {renderTimelineSection(
            'completed',
            sortedSteps.filter(s => s.status === 'completed'),
            true,
            isCompletedSectionExpanded,
            () => setIsCompletedSectionExpanded(!isCompletedSectionExpanded),
            false,
          )}

          {renderTimelineSection(
            'active',
            sortedSteps.filter(s => s.status === 'active'),
            false,
            true,
            undefined,
            true,
          )}

          {renderTimelineSection(
            'upcoming',
            sortedSteps.filter(s => s.status === 'upcoming'),
            true,
            isUpcomingSectionExpanded,
            () => setIsUpcomingSectionExpanded(!isUpcomingSectionExpanded),
            true,
          )}
        </div>
      ) : (
        <div className="relative">
          <div
            className="absolute"
            style={{
              left: '4.5px',
              top: '0',
              bottom: '0',
              width: '2px',
              background: 'var(--border)',
              opacity: 0.5,
            }}
          />
          <div className="flex flex-col gap-5">
            {(() => {
              const monthGroups = groupByMonth(sortedSteps);
              const filterStatus = filterMode === 'open' ? 'active' : filterMode === 'upcoming' ? 'upcoming' : 'completed';
              return monthGroups.map(({ month, steps: monthSteps }) => (
                <div key={month} className="flex flex-col gap-2">
                  {renderMonthNode(month, groupCfg[filterStatus]?.dotColor || 'var(--muted-foreground)')}
                  {renderMonthSteps(monthSteps, filterStatus)}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityFeedSection({ step, onOpenStepArchive }: { step: TimelineStepData; onOpenStepArchive?: (stepId: string) => void }) {
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');

  // Get activities or create from documents if activities don't exist
  const activities = step.activities && step.activities.length > 0 
    ? step.activities 
    : [];

  // Sort activities
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.timestamp.split(' alle ')[0].split('/').reverse().join('-'));
    const dateB = new Date(b.timestamp.split(' alle ')[0].split('/').reverse().join('-'));
    
    if (sortOrder === 'recent') {
      return dateB.getTime() - dateA.getTime();
    } else {
      return dateA.getTime() - dateB.getTime();
    }
  });

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4
          className="text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Attività:
        </h4>
        
        <div className="flex items-center gap-2">
          <p
            className="text-[var(--muted-foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Ordina per:
          </p>
          <div 
            className="flex items-center overflow-hidden"
            style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
          >
            <button
              onClick={() => setSortOrder('recent')}
              className="px-2 py-1 border-b-2 transition-colors"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: sortOrder === 'recent' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                backgroundColor: sortOrder === 'recent' ? 'var(--border)' : 'var(--card)',
                borderBottomColor: sortOrder === 'recent' ? 'var(--foreground)' : 'var(--border)',
                color: 'var(--foreground)',
              }}
            >
              Più recente
            </button>
            <div className="w-px h-7 bg-[var(--border)]" />
            <button
              onClick={() => setSortOrder('oldest')}
              className="px-2 py-1 border-b transition-colors"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: sortOrder === 'oldest' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                backgroundColor: sortOrder === 'oldest' ? 'var(--border)' : 'var(--card)',
                borderBottomColor: sortOrder === 'oldest' ? 'var(--foreground)' : 'var(--border)',
                borderBottomWidth: sortOrder === 'oldest' ? '2px' : '1px',
                color: 'var(--foreground)',
              }}
            >
              Più vecchio
            </button>
          </div>
        </div>
      </div>

      {sortedActivities.length > 0 ? (
        <div className="space-y-2 mt-5">
          {sortedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 py-2">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                {activity.type === 'document' ? (
                  <FileText className="w-full h-full text-[var(--muted-foreground)]" />
                ) : (
                  <MessageSquare className="w-full h-full text-[var(--chart-2)]" />
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <p
                    className="text-[var(--foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {activity.type === 'document' 
                      ? `${activity.author} ha caricato un documento:` 
                      : `${activity.author} ha scritto:`}
                  </p>
                  <p
                    className="text-[var(--muted-foreground)] whitespace-nowrap"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                    }}
                  >
                    {activity.timestamp}
                  </p>
                </div>

                {activity.type === 'note' && activity.content && (
                  <p
                    className="text-[var(--muted-foreground)]"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-regular)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {activity.content}
                  </p>
                )}

                {activity.type === 'document' && (
                  <>
                    {activity.description && (
                      <p
                        className="text-[var(--muted-foreground)]"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                          lineHeight: 1.5,
                        }}
                      >
                        {activity.description}
                      </p>
                    )}
                    
                    <div 
                      className="mt-2 p-4 bg-[var(--card)] border border-[var(--border)]"
                      style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
                    >
                      <div className="flex items-end justify-between">
                        <div className="flex-1 space-y-1">
                          <p
                            className="text-[var(--foreground)]"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              fontWeight: 'var(--font-weight-medium)',
                            }}
                          >
                            {activity.fileName}
                          </p>
                          <p
                            className="text-[var(--muted-foreground)]"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)',
                            }}
                          >
                            caricato da: {activity.author}
                          </p>
                          {activity.isNew && (
                            <div className="mt-1.5">
                              <span
                                className="inline-block px-1.5 py-1 uppercase"
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '11px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                  lineHeight: 1.5,
                                  backgroundColor: 'rgba(11, 182, 63, 0.1)',
                                  color: 'var(--primary)',
                                }}
                              >
                                nuovo
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            className="px-2 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              borderRadius: 'calc(var(--radius) - 4px)',
                            }}
                          >
                            Visualizza
                          </button>
                          <button
                            className="px-2 py-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              borderRadius: 'calc(var(--radius) - 4px)',
                            }}
                          >
                            Scarica
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-10 px-6 border border-dashed border-[var(--border)] bg-[var(--card)]"
          style={{ borderRadius: 'var(--radius)' }}
        >
          
          <p
            className="text-[var(--foreground)] mb-1 text-center"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Nessuna attività per questa fase
          </p>
          <p
            className="text-[var(--muted-foreground)] mb-5 text-center max-w-xs"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
            }}
          >
            Carica un documento o aggiungi una nota per iniziare.
          </p>
          <button
            onClick={() => onOpenStepArchive?.(step.id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity cursor-pointer"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              borderRadius: 'var(--radius)',
            }}
          >
            <Upload className="w-4 h-4" />
            Carica documento
          </button>
        </div>
      )}
    </div>
  );
}

// Helper: parse Italian date strings like "Inizio 5 gennaio 2026", "Scadenza 5 marzo 2026", "Completato il 18 gennaio 2026"
const ITALIAN_MONTHS: Record<string, number> = {
  'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
  'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11,
};

function parseItalianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try to extract "day month year" from the string
  const match = dateStr.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/i);
  if (match) {
    const day = parseInt(match[1]);
    const month = ITALIAN_MONTHS[match[2].toLowerCase()];
    const year = parseInt(match[3]);
    if (month !== undefined) return new Date(year, month, day);
  }
  // Try dd/mm/yyyy
  const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(parseInt(slashMatch[3]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }
  return null;
}

// Formats the deadline for collapsed step cards with clear context
function formatCollapsedDeadline(step: TimelineStepData): string {
  if (!step.deadline || step.deadline === 'Data da definire') return step.deadline;
  if (step.status === 'completed') {
    // Already has "Completato il" prefix
    if (/^Completat[oa]\s+il/i.test(step.deadline)) return step.deadline;
    return `Completato il ${stripDatePrefix(step.deadline)}`;
  }
  // For active/upcoming: show "Scade il {date}"
  const rawDate = stripDatePrefix(step.deadline);
  return `Scade il ${rawDate}`;
}

// Strips prefixes like "Inizio", "Scadenza", "Completato il" from date strings
function stripDatePrefix(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr
    .replace(/^(Inizio|Scadenza|Completato il|Completata il)\s+/i, '')
    .trim();
}

const ITALIAN_MONTH_NAMES = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

// Convert Italian date string (e.g. "5 marzo 2026") to ISO "YYYY-MM-DD"
function italianDateToISO(dateStr: string): string {
  const stripped = stripDatePrefix(dateStr);
  const parsed = parseItalianDate(stripped);
  if (!parsed) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Convert ISO "YYYY-MM-DD" to Italian date string (e.g. "5 marzo 2026")
function isoToItalianDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const year = parseInt(parts[0]);
  const monthIdx = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  if (monthIdx < 0 || monthIdx > 11 || isNaN(day) || isNaN(year)) return isoStr;
  return `${day} ${ITALIAN_MONTH_NAMES[monthIdx]} ${year}`;
}

interface DeadlineInfo {
  label: string;
  type: 'success' | 'warning' | 'danger' | 'neutral';
}

function getDeadlineInfo(step: TimelineStepData): DeadlineInfo | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // For completed steps, the badge is already shown elsewhere
  if (step.status === 'completed') return null;

  const deadlineDate = parseItalianDate(stripDatePrefix(step.deadline));
  if (!deadlineDate) return null;
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (step.status === 'upcoming') {
    if (diffDays > 14) return { label: `Tra ${diffDays} giorni`, type: 'neutral' };
    if (diffDays > 7) return { label: `Tra ${diffDays} giorni`, type: 'neutral' };
    if (diffDays > 0) return { label: `Tra ${diffDays} giorni`, type: 'warning' };
    if (diffDays === 0) return { label: 'Scade oggi', type: 'danger' };
    return { label: `Scaduta da ${Math.abs(diffDays)} giorni`, type: 'danger' };
  }

  // active step
  if (diffDays < 0) {
    return { label: `In ritardo di ${Math.abs(diffDays)} giorni`, type: 'danger' };
  }
  if (diffDays === 0) {
    return { label: 'Scade oggi', type: 'danger' };
  }
  if (diffDays <= 3) {
    return { label: `${diffDays} giorni rimasti`, type: 'danger' };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays} giorni rimasti`, type: 'warning' };
  }
  if (diffDays <= 14) {
    return { label: `${diffDays} giorni rimasti`, type: 'neutral' };
  }
  return { label: `${diffDays} giorni rimasti`, type: 'success' };
}