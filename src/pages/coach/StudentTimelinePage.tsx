import { useState, useMemo, useEffect } from 'react';
import {
  STUDENTS_DATA,
  STATUS_LABELS,
  STATUS_STYLES,
  THESIS_TYPE_LABELS
} from './studentsData';
import { useLocation, useParams, useNavigate } from 'react-router';
import { InfoCoachingCard, ShareWithStudentCard } from '../../app/components/StudentProfile';
import { DocumentArchiveDrawer, Document } from '../../app/components/coach/DocumentArchiveDrawer';
import { TimelineEditDrawer, TimelineStepEdit, TimelineOverview } from '../../app/components/coach/TimelineEditDrawer';
import { CoachTimelineList, TimelineStepData, ActivityItem } from '../../app/components/coach/CoachTimelineList';
import { StepArchiveDrawer, StepDocument } from '../../app/components/coach/StepArchiveDrawer';
import { TimelineControls } from '../../app/components/coach/TimelineControls';
import { PlagiarismCheckDrawer } from '../../app/components/coach/PlagiarismCheckDrawer';
import { StepOption } from '../../app/components/coach/AssignStepModal';
import { Calendar, Plus, ClipboardList, ListPlus } from 'lucide-react';
import { getStudentTimeline } from './studentTimelines';
import { BulkImportModal, ParsedPhase } from '../../app/components/coach/BulkImportModal';
import { getViewBasePath } from './viewBasePath';
import { getStudentViewStudent, getStudentViewTimelinePath, isStudentViewPath } from '@/app/utils/studentView';
import { useLavorazioni } from '@/app/data/LavorazioniContext';

export function StudentTimelinePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: services,
    students: realStudents,
    updateService,
    updateStudent,
    getServiceTimelineSteps,
    getServiceArchiveDocuments,
  } = useLavorazioni();
  const viewBasePath = getViewBasePath(location.pathname);
  const isStudentView = isStudentViewPath(location.pathname);
  const currentStudent = isStudentView ? getStudentViewStudent() : null;
  const effectiveStudentId = isStudentView ? currentStudent?.id : studentId;
  const legacyStudent = useMemo(
    () => (effectiveStudentId ? STUDENTS_DATA.find(entry => entry.id === effectiveStudentId) || null : null),
    [effectiveStudentId]
  );

  const matchedService = useMemo(() => {
    const candidates = services.filter(service => {
      if (effectiveStudentId && (service.id === effectiveStudentId || service.student_id === effectiveStudentId)) {
        return true;
      }
      if (currentStudent?.id && service.student_id === currentStudent.id) {
        return true;
      }
      if (currentStudent?.name && service.student_name === currentStudent.name) {
        return true;
      }
      if (legacyStudent?.name && service.student_name === legacyStudent.name) {
        return true;
      }
      return false;
    });
    if (candidates.length === 0) return null;
    return [...candidates].sort((left, right) => {
      const leftIsOpen = left.status === 'active' || left.status === 'paused';
      const rightIsOpen = right.status === 'active' || right.status === 'paused';
      if (leftIsOpen !== rightIsOpen) return leftIsOpen ? -1 : 1;
      return (right.updated_at || right.created_at).localeCompare(left.updated_at || left.created_at);
    })[0];
  }, [services, effectiveStudentId, currentStudent?.id, currentStudent?.name, legacyStudent?.name]);

  const realStudent = useMemo(() => {
    if (matchedService?.student_id) {
      return realStudents.find(entry => entry.id === matchedService.student_id) || null;
    }
    if (currentStudent?.id) {
      return realStudents.find(entry => entry.id === currentStudent.id) || null;
    }
    if (effectiveStudentId) {
      return realStudents.find(entry => entry.id === effectiveStudentId) || null;
    }
    if (legacyStudent?.name) {
      return realStudents.find(entry => entry.name === legacyStudent.name) || null;
    }
    return null;
  }, [matchedService?.student_id, currentStudent?.id, effectiveStudentId, legacyStudent?.name, realStudents]);

  const currentAcademicRecord = useMemo(() => {
    if (!realStudent) return null;
    return realStudent.academic_records.find(record => record.id === matchedService?.academic_record_id)
      || realStudent.academic_records.find(record => record.is_current)
      || realStudent.academic_records[0]
      || null;
  }, [realStudent, matchedService?.academic_record_id]);

  const studentName = matchedService?.student_name || realStudent?.name || legacyStudent?.name || currentStudent?.name || 'Studente';
  const initialThesisSubject = currentAcademicRecord?.thesis_topic || currentAcademicRecord?.thesis_subject || '';

  const [thesisSubject, setThesisSubject] = useState(initialThesisSubject);

  const [filterMode, setFilterMode] = useState<'open' | 'upcoming' | 'completed' | 'all'>('all');

  const [isArchiveDrawerOpen, setIsArchiveDrawerOpen] = useState(false);
  const [isTimelineEditDrawerOpen, setIsTimelineEditDrawerOpen] = useState(false);
  const [isPlagiarismDrawerOpen, setIsPlagiarismDrawerOpen] = useState(false);
  const [stepArchiveId, setStepArchiveId] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const initialTimeline = useMemo(() => {
    const legacyTimeline = effectiveStudentId
      ? getStudentTimeline(effectiveStudentId, studentName)
      : { steps: [], documents: [] as Document[] };

    if (!matchedService) {
      return legacyTimeline;
    }

    const sharedSteps = getServiceTimelineSteps(matchedService.id);
    const sharedDocuments = getServiceArchiveDocuments(matchedService.id);

    if (sharedSteps.length > 0 || sharedDocuments.length > 0) {
      return {
        steps: sharedSteps as TimelineStepData[],
        documents: sharedDocuments as Document[],
      };
    }

    if (legacyTimeline.steps.length > 0 || legacyTimeline.documents.length > 0) {
      return {
        steps: legacyTimeline.steps as TimelineStepData[],
        documents: legacyTimeline.documents as Document[],
      };
    }

    return {
      steps: [] as TimelineStepData[],
      documents: [] as Document[],
    };
  }, [matchedService, effectiveStudentId, studentName, getServiceTimelineSteps, getServiceArchiveDocuments]);

  const [timelineSteps, setTimelineSteps] = useState<TimelineStepData[]>(initialTimeline.steps);

  const [documents, setDocuments] = useState<Document[]>(initialTimeline.documents);

  const updateSharedTimeline = (updater: (previous: TimelineStepData[]) => TimelineStepData[]) => {
    setTimelineSteps(previous => {
      const next = updater(previous);
      if (matchedService) {
        updateService(matchedService.id, service => ({
          ...service,
          coaching_timeline_full: next,
        }));
      }
      return next;
    });
  };

  const updateSharedDocuments = (updater: (previous: Document[]) => Document[]) => {
    setDocuments(previous => {
      const next = updater(previous);
      if (matchedService) {
        updateService(matchedService.id, service => ({
          ...service,
          shared_documents: next,
        }));
      }
      return next;
    });
  };

  // Reset state when navigating to a different student
  useEffect(() => {
    if (isStudentView && studentId !== currentStudent?.id) {
      navigate(getStudentViewTimelinePath(), { replace: true });
      return;
    }

    setTimelineSteps(initialTimeline.steps);
    setDocuments(initialTimeline.documents);
    setFilterMode('all');
    setStepArchiveId(null);
    setThesisSubject(initialThesisSubject);
  }, [studentId, currentStudent?.id, initialTimeline, initialThesisSubject, isStudentView, navigate]);

  useEffect(() => {
    if (!matchedService || !effectiveStudentId) return;

    const sharedSteps = getServiceTimelineSteps(matchedService.id);
    const sharedDocuments = getServiceArchiveDocuments(matchedService.id);
    if (sharedSteps.length > 0 || sharedDocuments.length > 0) return;

    const legacyTimeline = getStudentTimeline(effectiveStudentId, studentName);
    if (legacyTimeline.steps.length === 0 && legacyTimeline.documents.length === 0) return;

    updateService(matchedService.id, service => ({
      ...service,
      coaching_timeline_full: legacyTimeline.steps as any,
      shared_documents: legacyTimeline.documents as any,
    }));
  }, [matchedService, effectiveStudentId, studentName, getServiceTimelineSteps, getServiceArchiveDocuments, updateService]);

  function handleOpenArchive() { setIsArchiveDrawerOpen(true); }
  function handleOpenStudentProfile() {
    alert('Questa azione porterebbe a una pagina separata di profilo studente esteso (read-only per il coach).');
  }
  function handleOpenPlagiarismCheck() { setIsPlagiarismDrawerOpen(true); }
  function handleEditTimeline() { setIsTimelineEditDrawerOpen(true); }
  function handleSaveTimelineChanges(updatedSteps: TimelineStepEdit[]) {
    console.log('Saving timeline changes:', updatedSteps);
    alert('Le modifiche alla timeline sono state salvate con successo.');
  }

  function handleAssignFileToStep(fileId: string, fileName: string, stepId: string | null) {
    const step = timelineSteps.find(s => s.id === stepId);
    updateSharedDocuments(prev => prev.map(doc => doc.id === fileId ? { ...doc, stepId, stepTitle: step?.title || null } : doc));
  }

  function handleAssignDocToStep(docId: string, stepId: string) {
    const step = timelineSteps.find(s => s.id === stepId);
    updateSharedDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, stepId, stepTitle: step?.title || null } : doc));
    alert(`Documento assegnato a: ${step?.title}`);
  }

  function handleViewDocument(docId: string) { const doc = documents.find(d => d.id === docId); alert(`Visualizzazione documento: ${doc?.name}`); }
  function handleDownloadDocument(docId: string) { const doc = documents.find(d => d.id === docId); alert(`Download documento: ${doc?.name}`); }
  function handleDeleteDocument(docId: string) {
    if (confirm('Sei sicuro di voler eliminare questo documento?')) {
      updateSharedDocuments(prev => prev.filter(d => d.id !== docId));
      alert('Documento eliminato');
    }
  }

  function handleRunPlagiarismCheck(docId: string) {
    updateSharedDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, plagiarismStatus: 'pending' as const } : doc));
    setIsPlagiarismDrawerOpen(true);
    setTimeout(() => {
      updateSharedDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, plagiarismStatus: 'clear' as const } : doc));
    }, 2000);
  }

  function handleAddNote(docId: string, note: string) {
    updateSharedDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, note } : doc));
    alert('Nota salvata');
  }

  // Timeline management handlers
  function handleAddStep(afterStepId: string | null, status?: 'active' | 'upcoming') {
    const newStepNumber = timelineSteps.length + 1;
    const newStep: TimelineStepData = {
      id: `step-${Date.now()}`,
      phaseNumber: `FASE ${newStepNumber} DI ${newStepNumber}`,
      title: 'Nuova Fase',
      deadline: 'Data da definire',
      status: status || 'upcoming',
      isDraft: true,
      isVisibleToStudent: false,
      documents: [],
      activities: []
    };
    
    if (afterStepId === null) {
      // Add at the beginning
      updateSharedTimeline(prev => [newStep, ...prev]);
    } else {
      // Add after specific step
      updateSharedTimeline(prev => {
        const index = prev.findIndex(s => s.id === afterStepId);
        const newSteps = [...prev];
        newSteps.splice(index + 1, 0, newStep);
        return newSteps;
      });
    }
    // Draft phase created — auto-expanded in CoachTimelineList with title editing
  }

  function handleRemoveStep(stepId: string) {
    updateSharedTimeline(prev => prev.filter(s => s.id !== stepId));
    alert('Fase rimossa con successo');
  }

  function handleToggleStepStatus(stepId: string, newStatus: 'active' | 'upcoming') {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    ));
  }

  function handleMarkStepCompleted(stepId: string) {
    if (confirm('Sei sicuro di voler marcare questa fase come completata?')) {
      const today = new Date();
      const completedDateStr = today.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const completedDisplayStr = `Completato il ${today.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      
      updateSharedTimeline(prev => prev.map(step => {
        if (step.id === stepId) {
          // Calculate completion status by comparing with original deadline
          let completionStatus: 'on-time' | 'early' | 'late' = 'on-time';
          
          if (step.deadline) {
            // Extract date from deadline string
            const deadlineMatch = step.deadline.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
            if (deadlineMatch) {
              const day = parseInt(deadlineMatch[1]);
              const monthName = deadlineMatch[2];
              const year = parseInt(deadlineMatch[3]);
              
              const months: Record<string, number> = {
                'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
                'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
              };
              
              const month = months[monthName.toLowerCase()];
              if (month !== undefined) {
                const deadlineDate = new Date(year, month, day);
                const daysDiff = Math.floor((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff < -1) {
                  completionStatus = 'early';
                } else if (daysDiff > 1) {
                  completionStatus = 'late';
                } else {
                  completionStatus = 'on-time';
                }
              }
            }
          }
          
          return {
            ...step,
            status: 'completed',
            originalDeadline: step.deadline,
            deadline: completedDisplayStr,
            completedDate: completedDateStr,
            completionStatus
          };
        }
        return step;
      }));
      alert('Fase marcata come completata');
    }
  }

  function handleUpdateStepTitle(stepId: string, newTitle: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, title: newTitle } : step
    ));
  }

  function handleUpdateStepDescription(stepId: string, newDescription: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, description: newDescription } : step
    ));
  }

  function handleUpdateStepStartDate(stepId: string, newStartDate: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, startDate: newStartDate } : step
    ));
  }

  function handleUpdateStepDeadline(stepId: string, newDeadline: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, deadline: newDeadline } : step
    ));
  }

  function handleMoveStep(stepId: string, direction: 'up' | 'down') {
    updateSharedTimeline(prev => {
      const index = prev.findIndex(s => s.id === stepId);
      if (index === -1) return prev;
      
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      
      // Swap the steps
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      
      return newSteps;
    });
  }

  function handleToggleVisibility(stepId: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, isVisibleToStudent: !step.isVisibleToStudent } : step
    ));
  }

  function handleConfirmDraft(stepId: string) {
    updateSharedTimeline(prev => prev.map(step => 
      step.id === stepId ? { ...step, isDraft: false, isVisibleToStudent: true } : step
    ));
  }

  function handleAddNoteToStep(stepId: string, content: string) {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} alle ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    const newActivity: ActivityItem = {
      id: `note-${Date.now()}`,
      type: 'note',
      timestamp,
      author: 'Coach',
      content,
      isNew: true,
    };
    updateSharedTimeline(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, activities: [newActivity, ...step.activities] }
        : step
    ));
  }

  function handleOpenStepArchive(stepId: string) {
    setStepArchiveId(stepId);
  }

  function handleBulkImport(phases: ParsedPhase[]) {
    const newSteps: TimelineStepData[] = phases.map((phase, idx) => ({
      id: `step-${Date.now()}-${idx}`,
      phaseNumber: '',
      title: phase.title,
      startDate: phase.startDate || undefined,
      deadline: phase.deadline || 'Data da definire',
      description: phase.description || undefined,
      status: 'upcoming' as const,
      isDraft: false,
      isVisibleToStudent: true,
      documents: [],
      activities: [],
    }));
    updateSharedTimeline(prev => [...prev, ...newSteps]);
  }

  function handleUploadDocumentsToStep(stepId: string, files: File[], note?: string) {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} alle ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    const step = timelineSteps.find(s => s.id === stepId);

    const newActivities: ActivityItem[] = [];
    const newDocItems: { id: string; fileName: string; uploadDate: string; uploadedBy: string; isNew: boolean }[] = [];
    const newArchiveDocs: Document[] = [];

    files.forEach((file) => {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const uploadDate = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

      newDocItems.push({
        id: docId,
        fileName: file.name,
        uploadDate: `${uploadDate} h:${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}`,
        uploadedBy: 'Coach',
        isNew: true,
      });

      newActivities.push({
        id: `act-${docId}`,
        type: 'document',
        timestamp,
        author: 'Coach',
        fileName: file.name,
        description: note || '',
        isNew: true,
      });

      newArchiveDocs.push({
        id: docId,
        name: file.name,
        sender: 'coach',
        stepId: stepId,
        stepTitle: step?.title || null,
        date: `${uploadDate} h:${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}`,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: 'Coach',
        plagiarismStatus: 'none',
        note: note || undefined,
      });
    });

    // If note is provided, also add a note activity
    if (note) {
      newActivities.push({
        id: `note-upload-${Date.now()}`,
        type: 'note',
        timestamp,
        author: 'Coach',
        content: note,
        isNew: true,
      });
    }

    updateSharedTimeline(prev => prev.map(s =>
      s.id === stepId
        ? {
          ...s,
          documents: [...newDocItems, ...s.documents],
          activities: [...newActivities, ...s.activities],
        }
        : s
    ));

    updateSharedDocuments(prev => [...newArchiveDocs, ...prev]);
  }

  // Compute phaseNumber dynamically based on position
  const computedTimelineSteps = useMemo(() => {
    const total = timelineSteps.length;
    return timelineSteps.map((step, idx) => ({
      ...step,
      phaseNumber: `FASE ${idx + 1} DI ${total}`,
    }));
  }, [timelineSteps]);

  const visibleTimelineSteps = useMemo(() => {
    if (!isStudentView) {
      return computedTimelineSteps;
    }

    const visibleSteps = computedTimelineSteps.filter((step) => step.isVisibleToStudent);

    if (visibleSteps.length === 0) {
      return [];
    }

    if (visibleSteps.some((step) => step.status === 'active')) {
      return visibleSteps;
    }

    let activeAssigned = false;

    return visibleSteps.map((step) => {
      if (!activeAssigned && step.status !== 'completed') {
        activeAssigned = true;
        return { ...step, status: 'active' as const };
      }

      return step;
    });
  }, [computedTimelineSteps, isStudentView]);

  const stepOptions: StepOption[] = visibleTimelineSteps.map(step => ({ id: step.id, phaseNumber: step.phaseNumber, title: step.title }));

  const planStartDate = matchedService?.plan_start_date || '';
  const planEndDate = matchedService?.plan_end_date || '';

  const daysRemaining = useMemo(() => {
    const months: Record<string, number> = {
      'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
      'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
    };
    const match = planEndDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return null;
    const endDate = new Date(parseInt(match[3]), months[match[2].toLowerCase()] ?? 0, parseInt(match[1]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [planEndDate]);

  const studentInitials = useMemo(() => {
    const parts = studentName.trim().split(/\s+/);
    return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2);
  }, [studentName]);

  const effectiveStatus = isStudentView ? 'active' : (matchedService?.status || 'active');
  const statusStyle = STATUS_STYLES[effectiveStatus];

  const activePhaseLabel = computedTimelineSteps.length > 0
    ? computedTimelineSteps.find(step => step.status === 'active')?.phaseNumber || computedTimelineSteps[0].phaseNumber
    : 'Timeline da definire';

  const serviceBadgeLabel = matchedService?.service_name || 'Coaching';

  const timelineOverview: TimelineOverview = {
    planStatus: `In corso · ${activePhaseLabel}`,
    startDate: planStartDate,
    expectedEndDate: planEndDate,
    studentName
  };

  const timelineStepsForEdit: TimelineStepEdit[] = timelineSteps.map(step => ({
    id: step.id, title: step.title, date: '', status: step.status, isLocked: step.status === 'completed', description: ''
  }));

  return (
    <div className="px-[40px] py-[32px]">
      {/* Breadcrumb */}
      <div className="mb-6">
        <p
          className="text-[var(--muted-foreground)]"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)' }}
        >
          <span
            className="hover:text-[var(--foreground)] cursor-pointer transition-colors"
            onClick={() => navigate(`${viewBasePath}/studenti`)}
          >
            Studenti
          </span>
          <span className="mx-2">→</span>
          <span className="text-[var(--foreground)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>{studentName}</span>
        </p>
      </div>

      {/* Plan Title */}
      <div className="mb-1">
        <div className="flex items-center gap-[24px] flex-wrap">
          {/* Avatar + Name + Badges */}
          <div className="flex items-center gap-[16px]">
            {/* Avatar */}
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 32,
                backgroundColor: 'var(--border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '20px',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: '30px',
                  letterSpacing: '-0.45px',
                  color: 'var(--foreground)',
                }}
              >
                {studentInitials}
              </span>
            </div>

            {/* Name */}
            <span
              style={{
                fontFamily: 'var(--font-alegreya)',
                fontSize: '32px',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: '36px',
                color: 'var(--foreground)',
              }}
            >
              {studentName}
            </span>

            {/* Service badge */}
            <div
              className="flex items-center shrink-0"
              style={{
                height: 20.5,
                paddingLeft: 9,
                paddingRight: 9,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--foreground)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: '16.5px',
                  textTransform: 'uppercase',
                  color: 'var(--foreground)',
                }}
              >
                {serviceBadgeLabel}
              </span>
            </div>

            {/* Status badge */}
            <div
              className="flex items-center shrink-0"
              style={{
                height: 20.5,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 2,
                paddingBottom: 2,
                borderRadius: 'var(--radius)',
                backgroundColor: statusStyle.bg,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: '16.5px',
                  textTransform: 'uppercase',
                  color: statusStyle.text,
                }}
              >
                {STATUS_LABELS[effectiveStatus]}
              </span>
            </div>
          </div>

          {/* Date pill */}
          {(planStartDate || planEndDate) ? (
          <div
            className="bg-[var(--card)] shrink-0"
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-[4px] px-[12px] py-[8px]">
              <div className="flex items-center gap-[8px] shrink-0">
                <Calendar className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    lineHeight: '21px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Inizio{' '}
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {planStartDate}
                  </span>
                  {' · Scadenza '}
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {planEndDate}
                  </span>
                </span>
              </div>
              {daysRemaining !== null && (
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    lineHeight: '20px',
                    letterSpacing: '-0.14px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {daysRemaining > 0
                    ? `(mancan${daysRemaining === 1 ? 'a' : 'o'} ${daysRemaining} giorn${daysRemaining === 1 ? 'o' : 'i'})`
                    : daysRemaining === 0
                      ? '(scade oggi)'
                      : `(scadut${Math.abs(daysRemaining) === 1 ? 'o' : 'i'} da ${Math.abs(daysRemaining)} giorn${Math.abs(daysRemaining) === 1 ? 'o' : 'i'})`
                  }
                </span>
              )}
            </div>
          </div>
          ) : (
          <div
            className="bg-[var(--card)] shrink-0"
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-[8px] px-[12px] py-[8px]">
              <Calendar className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Date piano non definite
              </span>
            </div>
          </div>
          )}
          <TimelineControls
            filterMode={filterMode}
            onFilterChange={setFilterMode}
          />
        </div>
        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
        <div className="min-w-0">
          
          <div className="mt-2">
            {visibleTimelineSteps.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-[80px] px-[32px] border border-dashed border-[var(--border)] bg-[var(--card)]"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <div
                  className="flex items-center justify-center mb-[20px]"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'var(--muted)',
                  }}
                >
                  <ClipboardList className="w-[24px] h-[24px] text-[var(--muted-foreground)]" />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-alegreya)',
                    fontSize: '20px',
                    fontWeight: 'var(--font-weight-bold)',
                    lineHeight: '28px',
                    color: 'var(--foreground)',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Nessuna fase nella timeline
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--font-weight-regular)',
                    lineHeight: '22px',
                    color: 'var(--muted-foreground)',
                    textAlign: 'center',
                    maxWidth: 420,
                    marginBottom: 24,
                  }}
                >
                  La timeline di {studentName} è ancora vuota. Aggiungi la prima fase per iniziare a strutturare il percorso di tesi.
                </p>
                <button
                  onClick={() => handleAddStep(null, 'upcoming')}
                  className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[var(--foreground)] hover:opacity-90 transition-opacity"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--background)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus className="w-[16px] h-[16px]" />
                  <span>Aggiungi prima fase</span>
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[var(--background)] border border-[var(--border)] hover:border-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                    marginTop: 12,
                  }}
                >
                  <ListPlus className="w-[16px] h-[16px]" />
                  <span>Aggiungi più fasi</span>
                </button>
              </div>
            ) : (
              <CoachTimelineList 
                steps={visibleTimelineSteps} 
                filterMode={filterMode} 
                canManageSteps={!isStudentView}
                onAddStep={handleAddStep}
                onRemoveStep={handleRemoveStep}
                onToggleStepStatus={handleToggleStepStatus}
                onMarkStepCompleted={handleMarkStepCompleted}
                onUpdateStepTitle={handleUpdateStepTitle}
                onUpdateStepDescription={handleUpdateStepDescription}
                onUpdateStepStartDate={handleUpdateStepStartDate}
                onUpdateStepDeadline={handleUpdateStepDeadline}
                onMoveStep={handleMoveStep}
                onToggleVisibility={handleToggleVisibility}
                onConfirmDraft={handleConfirmDraft}
                onAddNote={handleAddNoteToStep}
                onOpenStepArchive={handleOpenStepArchive}
                onBulkImport={() => setIsBulkImportOpen(true)}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <InfoCoachingCard
            thesisSubject={thesisSubject}
            thesisMatter={currentAcademicRecord?.thesis_subject || ''}
            degree={currentAcademicRecord?.course_name || 'Non specificato'}
            thesisLevel={currentAcademicRecord?.degree_level ? `${currentAcademicRecord.degree_level.charAt(0).toUpperCase()}${currentAcademicRecord.degree_level.slice(1)}` : 'Magistrale'}
            thesisType={currentAcademicRecord?.thesis_type ? THESIS_TYPE_LABELS[currentAcademicRecord.thesis_type] : 'Non specificata'}
            supervisor={currentAcademicRecord?.thesis_professor || 'Non assegnato'}
            studentPhone={realStudent?.contacts?.phones.find(phone => phone.is_primary)?.phone || realStudent?.phone || ''}
            studentEmail={realStudent?.contacts?.emails.find(email => email.is_primary)?.email || realStudent?.email || ''}
            startDate={planStartDate}
            endDate={planEndDate}
            referent={matchedService?.referente || 'Non assegnato'}
            onSaveThesisSubject={(newSubject) => {
              setThesisSubject(newSubject);
              if (realStudent && currentAcademicRecord) {
                updateStudent(realStudent.id, entry => ({
                  ...entry,
                  academic_records: entry.academic_records.map(record =>
                    record.id === currentAcademicRecord.id
                      ? {
                        ...record,
                        thesis_topic: newSubject,
                        thesis_subject: newSubject,
                        updated_at: new Date().toISOString(),
                      }
                      : record
                  ),
                }));
              }
            }}
          />
          <ShareWithStudentCard
            archiveCount={documents.length}
            newDocCount={documents.filter(d => d.plagiarismStatus === 'none' || !d.plagiarismStatus).length}
            onOpenArchive={handleOpenArchive}
            onOpenProfile={handleOpenStudentProfile}
            steps={stepOptions}
            onAssignFileToStep={handleAssignFileToStep}
            onFilesUploaded={(files) => {
              files.forEach(file => {
                const newDoc: Document = {
                  id: `doc-upload-${Date.now()}-${Math.random()}`,
                  name: file.name,
                  sender: 'coach',
                  stepId: null,
                  stepTitle: null,
                  date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                  size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                  uploadedBy: 'Coach',
                  plagiarismStatus: 'none',
                };
                updateSharedDocuments(prev => [newDoc, ...prev]);
              });
            }}
          />
        </div>
      </div>

      <DocumentArchiveDrawer
        isOpen={isArchiveDrawerOpen} onClose={() => setIsArchiveDrawerOpen(false)}
        studentName={studentName} documents={documents} availableSteps={stepOptions}
        onViewDocument={handleViewDocument} onDownloadDocument={handleDownloadDocument}
        onDeleteDocument={handleDeleteDocument} onRunPlagiarismCheck={handleRunPlagiarismCheck}
        onAddNote={handleAddNote} onAssignToStep={handleAssignDocToStep}
        onUploadDocuments={(files, note) => {
          files.forEach(file => {
            const newDoc: Document = {
              id: `doc-archive-${Date.now()}-${Math.random()}`,
              name: file.name,
              sender: 'coach',
              stepId: null,
              stepTitle: null,
              date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              uploadedBy: 'Coach',
              plagiarismStatus: 'none',
              note: note,
            };
            updateSharedDocuments(prev => [newDoc, ...prev]);
          });
        }}
      />
      <PlagiarismCheckDrawer isOpen={isPlagiarismDrawerOpen} onClose={() => setIsPlagiarismDrawerOpen(false)} />
      {stepArchiveId && (() => {
        const step = computedTimelineSteps.find(s => s.id === stepArchiveId);
        if (!step) return null;
        const stepDocs: StepDocument[] = step.activities
          .filter(a => a.type === 'document' && a.fileName)
          .map(a => {
            const matchingDoc = documents.find(d => d.name === a.fileName);
            return {
              id: a.id,
              fileName: a.fileName!,
              uploadDate: a.timestamp,
              uploadedBy: a.author,
              size: matchingDoc?.size,
              isNew: a.isNew,
              plagiarismStatus: matchingDoc?.plagiarismStatus,
              note: a.description || matchingDoc?.note,
            };
          });
        return (
          <StepArchiveDrawer
            isOpen={true}
            onClose={() => setStepArchiveId(null)}
            stepId={step.id}
            stepTitle={step.title}
            phaseNumber={step.phaseNumber}
            stepStatus={step.status}
            documents={stepDocs}
            onUploadDocuments={handleUploadDocumentsToStep}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
            onDeleteDocument={handleDeleteDocument}
            onRunPlagiarismCheck={handleRunPlagiarismCheck}
          />
        );
      })()}
      <TimelineEditDrawer
        isOpen={isTimelineEditDrawerOpen} onClose={() => setIsTimelineEditDrawerOpen(false)}
        overview={timelineOverview} steps={timelineStepsForEdit} onSave={handleSaveTimelineChanges}
      />
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}