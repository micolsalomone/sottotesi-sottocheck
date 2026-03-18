import React, { useState } from 'react';
import { Plus, X, Check, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useAreeTematiche, type AreaTematica } from '../data/AreeTematicheContext';

// Coach list — coerente con CoachPage e COACH_ID_MAP
const COACHES_LIST = [
  { id: 'C-07', name: 'Martina Rossi' },
  { id: 'C-08', name: 'Andrea Conti' },
  { id: 'C-12', name: 'Marco Bianchi' },
  { id: 'C-15', name: 'Elena Ferretti' },
  { id: 'C-20', name: 'Lucia Marchetti' },
];

const CURRENT_ADMIN = 'Francesca';

export function AreeTematichePage() {
  const {
    aree,
    addArea,
    updateArea,
    removeArea,
    toggleAreaActive,
    assignCoach,
    unassignCoach,
  } = useAreeTematiche();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [assigningAreaId, setAssigningAreaId] = useState<string | null>(null);
  const [selectedCoachToAdd, setSelectedCoachToAdd] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Inserisci un nome per l\'area tematica');
      return;
    }
    const newArea: AreaTematica = {
      id: `AT-${Date.now().toString().slice(-3)}`,
      name: newName.trim(),
      description: newDescription.trim(),
      coachIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      created_by: CURRENT_ADMIN,
      updated_by: CURRENT_ADMIN,
      updated_at: new Date().toISOString(),
    };
    addArea(newArea);
    toast.success(`Area "${newArea.name}" creata`);
    setNewName('');
    setNewDescription('');
    setShowNewForm(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error('Il nome non può essere vuoto');
      return;
    }
    updateArea(id, a => ({ ...a, name: editName.trim(), description: editDescription.trim(), updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() }));
    toast.success('Area aggiornata');
    setEditingId(null);
  };

  const startEdit = (area: AreaTematica) => {
    setEditingId(area.id);
    setEditName(area.name);
    setEditDescription(area.description);
  };

  const handleAssignCoach = (areaId: string) => {
    if (!selectedCoachToAdd) return;
    assignCoach(areaId, selectedCoachToAdd);
    const coach = COACHES_LIST.find(c => c.id === selectedCoachToAdd);
    toast.success(`${coach?.name} assegnato all'area`);
    setSelectedCoachToAdd('');
  };

  const handleUnassignCoach = (areaId: string, coachId: string) => {
    unassignCoach(areaId, coachId);
    const coach = COACHES_LIST.find(c => c.id === coachId);
    toast.success(`${coach?.name} rimosso dall'area`);
  };

  const handleDelete = (id: string) => {
    const area = aree.find(a => a.id === id);
    removeArea(id);
    toast.success(`Area "${area?.name}" rimossa`);
    setConfirmDeleteId(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--input-background)',
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-label)',
    fontWeight: 'var(--font-weight-regular)',
    color: 'var(--foreground)',
    lineHeight: '1.5',
    outline: 'none',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Aree Tematiche</h1>
        <p className="page-subtitle">Gestione aree tematiche e assegnazione coach</p>
      </div>

      {/* Action toolbar */}
      <div className="action-toolbar">
        <div style={{ flex: 1 }} />
        <div className="action-toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            <Plus size={18} />
            Nuova area
          </button>
        </div>
      </div>

      {/* New area form — Drawer (pattern CreateStudentDrawer) */}
      {showNewForm && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              animation: 'fadeIn 200ms ease-in-out',
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '500px', maxWidth: '100vw',
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
            animation: 'slideInFromRight 300ms ease-out',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Plus size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    Nuova area tematica
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    Crea una nuova area per raggruppare i coach
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.5rem', color: 'var(--muted-foreground)',
                  borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    lineHeight: '1.5',
                  }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    placeholder="es. Economia e Management"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    lineHeight: '1.5',
                  }}>
                    Descrizione
                  </label>
                  <input
                    type="text"
                    placeholder="Breve descrizione dell'area"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: '0.75rem', padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <button
                onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  lineHeight: '1.5',
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: 'var(--text-label)' }}
              >
                <Check size={14} />
                Crea area
              </button>
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          flex: '1 1 150px',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Totale aree
          </div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.5',
          }}>
            {aree.length}
          </div>
        </div>
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          flex: '1 1 150px',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Attive
          </div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--primary)',
            lineHeight: '1.5',
          }}>
            {aree.filter(a => a.isActive).length}
          </div>
        </div>
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          flex: '1 1 150px',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Senza coach
          </div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-h4)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--chart-3)',
            lineHeight: '1.5',
          }}>
            {aree.filter(a => a.coachIds.length === 0).length}
          </div>
        </div>
      </div>

      {/* Areas list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {aree.map(area => {
          const isEditing = editingId === area.id;
          const isAssigning = assigningAreaId === area.id;
          const assignedCoaches = COACHES_LIST.filter(c => area.coachIds.includes(c.id));
          const availableCoaches = COACHES_LIST.filter(c => !area.coachIds.includes(c.id));

          return (
            <div
              key={area.id}
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                opacity: area.isActive ? 1 : 0.6,
              }}
            >
              {/* Header row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ ...inputStyle, fontWeight: 'var(--font-weight-medium)' }}
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="Descrizione"
                        style={inputStyle}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                        marginBottom: '0.25rem',
                      }}>
                        {area.name}
                      </div>
                      {area.description && (
                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}>
                          {area.description}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  <span
                    className={`status-badge ${area.isActive ? 'active' : 'inactive'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      toggleAreaActive(area.id);
                      toast.success(area.isActive ? `Area "${area.name}" disattivata` : `Area "${area.name}" attivata`);
                    }}
                  >
                    {area.isActive ? 'Attiva' : 'Inattiva'}
                  </span>

                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(area.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--primary)',
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-medium)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          lineHeight: '1.5',
                        }}
                      >
                        <Check size={14} />
                        Salva
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          fontWeight: 'var(--font-weight-medium)',
                          cursor: 'pointer',
                          lineHeight: '1.5',
                        }}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(area)}
                        style={{
                          padding: '0.375rem',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--muted-foreground)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="Modifica"
                      >
                        <Pencil size={14} />
                      </button>
                      {confirmDeleteId === area.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <span style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            color: 'var(--destructive-foreground)',
                            lineHeight: '1.5',
                          }}>
                            Conferma?
                          </span>
                          <button
                            onClick={() => handleDelete(area.id)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--destructive-foreground)',
                              backgroundColor: 'var(--destructive)',
                              color: 'var(--destructive-foreground)',
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-medium)',
                              cursor: 'pointer',
                              lineHeight: '1.5',
                            }}
                          >
                            Rimuovi
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              lineHeight: '1.5',
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(area.id)}
                          style={{
                            padding: '0.375rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--destructive-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Rimuovi"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Coach section */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '0.75rem',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Coach assegnati ({assignedCoaches.length})
                  </span>
                  <button
                    onClick={() => setAssigningAreaId(isAssigning ? null : area.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      backgroundColor: isAssigning ? 'var(--primary)' : 'var(--card)',
                      color: isAssigning ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      lineHeight: '1.5',
                    }}
                  >
                    <UserPlus size={12} />
                    Assegna
                  </button>
                </div>

                {/* Assigned coaches list */}
                {assignedCoaches.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: isAssigning ? '0.75rem' : 0 }}>
                    {assignedCoaches.map(coach => (
                      <span
                        key={coach.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          backgroundColor: 'var(--muted)',
                          borderRadius: 'var(--radius-badge)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}
                      >
                        {coach.name}
                        <button
                          onClick={() => handleUnassignCoach(area.id, coach.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--muted-foreground)',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title={`Rimuovi ${coach.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                    marginBottom: isAssigning ? '0.75rem' : 0,
                    lineHeight: '1.5',
                  }}>
                    Nessun coach assegnato
                  </div>
                )}

                {/* Assign coach dropdown */}
                {isAssigning && availableCoaches.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={selectedCoachToAdd}
                      onChange={e => setSelectedCoachToAdd(e.target.value)}
                      style={{ ...inputStyle, flex: 1, maxWidth: '300px' }}
                    >
                      <option value="">Seleziona coach...</option>
                      {availableCoaches.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignCoach(area.id)}
                      disabled={!selectedCoachToAdd}
                      className="btn btn-primary"
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: 'var(--text-label)',
                        opacity: selectedCoachToAdd ? 1 : 0.5,
                      }}
                    >
                      <Check size={14} />
                      Aggiungi
                    </button>
                  </div>
                )}
                {isAssigning && availableCoaches.length === 0 && (
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                    lineHeight: '1.5',
                  }}>
                    Tutti i coach sono già assegnati a quest'area
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div style={{
                marginTop: '0.75rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
              }}>
                ID: {area.id} · Creata il {area.createdAt}
              </div>
            </div>
          );
        })}
      </div>

      {aree.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
        }}>
          Nessuna area tematica. Clicca "Nuova area" per crearne una.
        </div>
      )}
    </div>
  );
}