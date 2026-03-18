import { X, Lock, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export interface TimelineStepEdit {
  id: string;
  title: string;
  date: string; // For completed steps
  startDate?: string; // For active step
  endDate?: string; // For active and upcoming steps
  status: 'completed' | 'active' | 'upcoming';
  isLocked: boolean;
  description?: string;
  modifiedByCoach?: boolean; // Track if coach modified this step
}

export interface TimelineOverview {
  planStatus: string;
  startDate: string;
  expectedEndDate: string;
  studentName: string;
}

interface TimelineEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  overview: TimelineOverview;
  steps: TimelineStepEdit[];
  onSave: (updatedSteps: TimelineStepEdit[]) => void;
}

export function TimelineEditDrawer({ 
  isOpen, 
  onClose, 
  overview,
  steps: initialSteps,
  onSave 
}: TimelineEditDrawerProps) {
  const [steps, setSteps] = useState<TimelineStepEdit[]>(initialSteps);
  const [hasChanges, setHasChanges] = useState(false);
  const [addingStepType, setAddingStepType] = useState<'completed' | 'active' | 'upcoming' | null>(null);
  const [newStepData, setNewStepData] = useState({
    title: '',
    date: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleDateChange = (stepId: string, newDate: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, date: newDate, modifiedByCoach: true } : step
    ));
    setHasChanges(true);
  };

  const handleEndDateChange = (stepId: string, newEndDate: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, endDate: newEndDate, modifiedByCoach: true } : step
    ));
    setHasChanges(true);
  };

  const handleStartDateChange = (stepId: string, newStartDate: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, startDate: newStartDate, modifiedByCoach: true } : step
    ));
    setHasChanges(true);
  };

  const handleTitleChange = (stepId: string, newTitle: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, title: newTitle, modifiedByCoach: true } : step
    ));
    setHasChanges(true);
  };

  const handleDescriptionChange = (stepId: string, newDescription: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, description: newDescription, modifiedByCoach: true } : step
    ));
    setHasChanges(true);
  };

  const handleAddStep = (afterStepId: string) => {
    // Determine type based on afterStepId
    if (afterStepId === 'completed-new') {
      setAddingStepType('completed');
    } else if (afterStepId === 'active-new') {
      setAddingStepType('active');
    } else {
      setAddingStepType('upcoming');
    }
    setNewStepData({
      title: '',
      date: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleSaveNewStep = () => {
    if (!newStepData.title || !addingStepType) return;

    const newStep: TimelineStepEdit = {
      id: `step-${Date.now()}`,
      title: newStepData.title,
      date: addingStepType === 'completed' ? newStepData.date : newStepData.startDate || newStepData.date,
      startDate: addingStepType === 'active' ? newStepData.startDate : undefined,
      endDate: newStepData.endDate || undefined,
      status: addingStepType,
      isLocked: false,
      description: newStepData.description || undefined,
      modifiedByCoach: true
    };

    setSteps([...steps, newStep]);
    setAddingStepType(null);
    setNewStepData({
      title: '',
      date: '',
      startDate: '',
      endDate: '',
      description: ''
    });
    setHasChanges(true);
  };

  const handleCancelNewStep = () => {
    setAddingStepType(null);
    setNewStepData({
      title: '',
      date: '',
      startDate: '',
      endDate: '',
      description: ''
    });
  };

  const handleRemoveStep = (stepId: string) => {
    console.log('Remove/skip step:', stepId);
    // Placeholder for removing or skipping step
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(steps);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('Hai modifiche non salvate. Vuoi davvero annullare?');
      if (!confirm) return;
    }
    setSteps(initialSteps);
    setHasChanges(false);
    onClose();
  };

  const completedSteps = steps.filter(s => s.status === 'completed');
  const activeSteps = steps.filter(s => s.status === 'active');
  const upcomingSteps = steps.filter(s => s.status === 'upcoming');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl mb-1">Modifica Timeline</h2>
            <p className="text-sm text-gray-600">Gestisci le fasi future del piano di coaching</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Chiudi"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          
          {/* Steps List */}
          <div className="space-y-6">
            
            {/* Completed Steps - Fully Editable */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[--text-label] text-[rgba(10,10,10,0.8)]">
                  Fasi Completate ({completedSteps.length})
                </p>
              </div>
              
              {/* Existing Completed Steps */}
              <div className="space-y-2">
                {completedSteps.map((step) => (
                  <div 
                    key={step.id}
                    className="bg-white relative rounded-[8px]"
                  >
                    <div className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" aria-hidden="true" />
                    <div className="flex flex-col items-start pt-[17px] px-[17px] pb-px relative w-full">
                      <div className="flex items-start justify-between pb-[12px] w-full">
                        <div className="flex-1 space-y-3">
                          {/* Title Editor */}
                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Titolo fase
                            </label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleTitleChange(step.id, e.target.value)}
                              className="w-full text-[--text-label] text-[#0a0a0a] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring"
                              placeholder="es. Consulenza Iniziale"
                            />
                          </div>
                          
                          {/* Completion Date Editor */}
                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Data di completamento
                            </label>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#717680]" />
                              <input
                                type="date"
                                value={step.date}
                                onChange={(e) => handleDateChange(step.id, e.target.value)}
                                className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </div>
                          </div>

                          {/* Description Editor */}
                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Note (opzionali)
                            </label>
                            <textarea
                              value={step.description || ''}
                              onChange={(e) => handleDescriptionChange(step.id, e.target.value)}
                              className="w-full text-[--text-label] px-3 py-2 bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                              placeholder="Note interne sulla fase completata..."
                              rows={2}
                            />
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="ml-3">
                          <span className="inline-block text-xs px-2 py-1 bg-[#d4ff00] text-[#0a0a0a] rounded">
                            Completata
                          </span>
                        </div>
                      </div>
                      
                      {/* Step Actions */}
                      <div className="border-t border-[#e5e7eb] w-full pt-[8px]">
                        <button
                          onClick={() => handleRemoveStep(step.id)}
                          className="flex items-center gap-1.5 text-[--text-label] text-[#b42318] hover:text-[#9b1f13] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Rimuovi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Step Form - Completed */}
                {addingStepType === 'completed' && (
                  <div className="bg-white relative rounded-[8px] border-2 border-accent">
                    <div className="flex flex-col items-start pt-[17px] px-[17px] pb-px relative w-full">
                      <div className="flex items-start justify-between pb-[12px] w-full">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Titolo fase
                            </label>
                            <input
                              type="text"
                              value={newStepData.title}
                              onChange={(e) => setNewStepData({...newStepData, title: e.target.value})}
                              className="w-full text-[--text-label] text-[#0a0a0a] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="es. Consulenza Iniziale"
                              autoFocus
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Data di completamento
                            </label>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#717680]" />
                              <input
                                type="date"
                                value={newStepData.date}
                                onChange={(e) => setNewStepData({...newStepData, date: e.target.value})}
                                className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[--text-label] text-[#717680] mb-1">
                              Note (opzionali)
                            </label>
                            <textarea
                              value={newStepData.description}
                              onChange={(e) => setNewStepData({...newStepData, description: e.target.value})}
                              className="w-full text-[--text-label] px-3 py-2 bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                              placeholder="Note interne sulla fase completata..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-[#e5e7eb] w-full pt-[8px] flex items-center gap-3">
                        <button
                          onClick={handleSaveNewStep}
                          disabled={!newStepData.title || !newStepData.date}
                          className="text-[--text-label] text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Salva fase
                        </button>
                        <span className="text-[#e5e7eb]">·</span>
                        <button
                          onClick={handleCancelNewStep}
                          className="text-[--text-label] text-[#717680] hover:text-[#0a0a0a] transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Completed Step Button */}
              {completedSteps.length > 0 && addingStepType !== 'completed' && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => handleAddStep('completed-new')}
                    className="px-4 py-1 bg-white border border-[#e5e7eb] rounded-full text-[--text-label] text-[#0a0a0a] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Aggiungi fase</span>
                  </button>
                </div>
              )}
            </div>

            {/* Active Step - Fully Editable */}
            {activeSteps.length > 0 && (
              <div>
                <p className="text-[--text-label] text-[rgba(10,10,10,0.8)] mb-3">
                  Fase Corrente
                </p>
                <div className="space-y-2">
                  {activeSteps.map((step) => (
                    <div 
                      key={step.id}
                      className="bg-[#fafafa] relative rounded-[8px]"
                    >
                      <div className="absolute border-2 border-[#0a0a0a] border-solid inset-0 pointer-events-none rounded-[8px]" aria-hidden="true" />
                      <div className="flex flex-col items-start pt-[18px] px-[18px] pb-[16px] relative w-full">
                        <div className="flex items-start justify-between pb-[8px] w-full">
                          <div className="flex-1 space-y-3">
                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Titolo fase
                              </label>
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => handleTitleChange(step.id, e.target.value)}
                                className="w-full text-[--text-label] text-[#0a0a0a] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
                                placeholder="es. Revisione Introduzione"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Data di inizio
                              </label>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#0a0a0a]" />
                                <input
                                  type="date"
                                  value={step.startDate || ''}
                                  onChange={(e) => handleStartDateChange(step.id, e.target.value)}
                                  className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Data di fine prevista
                              </label>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#0a0a0a]" />
                                <input
                                  type="date"
                                  value={step.endDate || ''}
                                  onChange={(e) => handleEndDateChange(step.id, e.target.value)}
                                  className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Descrizione (visibile allo studente)
                              </label>
                              <textarea
                                value={step.description || ''}
                                onChange={(e) => handleDescriptionChange(step.id, e.target.value)}
                                className="w-full text-[--text-label] px-3 py-2 bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] resize-none"
                                placeholder="es. Ricorda di includere almeno 3 fonti secondarie..."
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <div className="ml-3">
                            <span className="inline-block text-xs px-2 py-1 bg-[rgba(10,10,10,0.8)] text-white rounded">
                              In corso
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t border-[#e5e7eb] w-full pt-[8px]">
                          <button
                            onClick={() => handleRemoveStep(step.id)}
                            className="flex items-center gap-1.5 text-[--text-label] text-[#b42318] hover:text-[#9b1f13] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Rimuovi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Steps - Fully Editable */}
            {upcomingSteps.length > 0 && (
              <div>
                <p className="text-[--text-label] text-[rgba(10,10,10,0.8)] mb-3">
                  Fasi Future ({upcomingSteps.length})
                </p>
                <div className="space-y-2">
                  {upcomingSteps.map((step, index) => (
                    <div key={step.id}>
                      <div className="bg-white relative rounded-[8px]">
                        <div className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" aria-hidden="true" />
                        <div className="flex flex-col items-start pt-[17px] px-[17px] pb-px relative w-full">
                          <div className="flex items-start w-full">
                            <div className="flex-1 space-y-3 pb-[12px]">
                              <div>
                                <label className="block text-[--text-label] text-[#717680] mb-1">
                                  Titolo fase
                                </label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => handleTitleChange(step.id, e.target.value)}
                                  className="w-full text-[--text-label] text-[#0a0a0a] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                  placeholder="es. Revisione Finale"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[--text-label] text-[#717680] mb-1">
                                  Data di inizio prevista
                                </label>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-[#717680]" />
                                  <input
                                    type="date"
                                    value={step.date}
                                    onChange={(e) => handleDateChange(step.id, e.target.value)}
                                    className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[--text-label] text-[#717680] mb-1">
                                  Data fine prevista
                                </label>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-[#717680]" />
                                  <input
                                    type="date"
                                    value={step.endDate || ''}
                                    onChange={(e) => handleEndDateChange(step.id, e.target.value)}
                                    className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[--text-label] text-[#717680] mb-1">
                                  Descrizione (opzionale, visibile allo studente)
                                </label>
                                <textarea
                                  value={step.description || ''}
                                  onChange={(e) => handleDescriptionChange(step.id, e.target.value)}
                                  className="w-full text-[--text-label] px-3 py-2 bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                  placeholder="es. Preparati a discutere della metodologia di ricerca utilizzata..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t border-[#e5e7eb] w-full pt-[8px]">
                            <button
                              onClick={() => handleRemoveStep(step.id)}
                              className="flex items-center gap-1.5 text-[--text-label] text-[#b42318] hover:text-[#9b1f13] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Rimuovi</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Add Step Button Between Steps */}
                      {index < upcomingSteps.length - 1 && addingStepType !== 'upcoming' && (
                        <div className="flex justify-center my-2">
                          <button
                            onClick={() => handleAddStep('upcoming-new')}
                            className="px-4 py-1 bg-white border border-[#e5e7eb] rounded-full text-[--text-label] text-[#0a0a0a] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Aggiungi fase</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New Step Form - Upcoming */}
                  {addingStepType === 'upcoming' && (
                    <div className="bg-white relative rounded-[8px] border-2 border-accent mt-2">
                      <div className="flex flex-col items-start pt-[17px] px-[17px] pb-px relative w-full">
                        <div className="flex items-start w-full">
                          <div className="flex-1 space-y-3 pb-[12px]">
                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Titolo fase
                              </label>
                              <input
                                type="text"
                                value={newStepData.title}
                                onChange={(e) => setNewStepData({...newStepData, title: e.target.value})}
                                className="w-full text-[--text-label] text-[#0a0a0a] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="es. Revisione Finale"
                                autoFocus
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Data di inizio prevista
                              </label>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#717680]" />
                                <input
                                  type="date"
                                  value={newStepData.startDate}
                                  onChange={(e) => setNewStepData({...newStepData, startDate: e.target.value})}
                                  className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Data fine prevista
                              </label>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#717680]" />
                                <input
                                  type="date"
                                  value={newStepData.endDate}
                                  onChange={(e) => setNewStepData({...newStepData, endDate: e.target.value})}
                                  className="flex-1 text-[--text-label] px-3 py-[6px] h-[38px] bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[--text-label] text-[#717680] mb-1">
                                Descrizione (opzionale, visibile allo studente)
                              </label>
                              <textarea
                                value={newStepData.description}
                                onChange={(e) => setNewStepData({...newStepData, description: e.target.value})}
                                className="w-full text-[--text-label] px-3 py-2 bg-white border border-[#e5e7eb] rounded focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                placeholder="es. Preparati a discutere della metodologia di ricerca utilizzata..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-[#e5e7eb] w-full pt-[8px] flex items-center gap-3">
                          <button
                            onClick={handleSaveNewStep}
                            disabled={!newStepData.title}
                            className="text-[--text-label] text-accent hover:text-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Salva fase
                          </button>
                          <span className="text-[#e5e7eb]">·</span>
                          <button
                            onClick={handleCancelNewStep}
                            className="text-[--text-label] text-[#717680] hover:text-[#0a0a0a] transition-colors"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Upcoming Step Button at End */}
                {addingStepType !== 'upcoming' && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => handleAddStep('upcoming-new')}
                      className="px-4 py-1 bg-white border border-[#e5e7eb] rounded-full text-[--text-label] text-[#0a0a0a] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Aggiungi fase</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {upcomingSteps.length === 0 && activeSteps.length === 0 && completedSteps.length === 0 && (
              <div className="text-center py-8 text-[#717680]">
                <p className="text-[--text-label]">Nessuna fase presente nella timeline</p>
                <button
                  onClick={() => handleAddStep('upcoming-new')}
                  className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
                >
                  Crea prima fase
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {hasChanges ? 'Modifiche non salvate' : 'Nessuna modifica'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Salva modifiche
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}