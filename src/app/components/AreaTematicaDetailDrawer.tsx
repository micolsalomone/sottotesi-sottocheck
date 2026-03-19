import React, { useState, useEffect } from 'react';
import { FolderKanban, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAreeTematiche, type AreaTematica } from '@/app/data/AreeTematicheContext';
import {
  DrawerOverlay,
  DrawerShell,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  DrawerFieldGroup,
  DrawerLabel,
  DrawerSearchSelect,
  drawerInputStyle,
} from './DrawerPrimitives';

const COACHES_LIST = [
  { id: 'C-07', name: 'Martina Rossi' },
  { id: 'C-08', name: 'Andrea Conti' },
  { id: 'C-12', name: 'Marco Bianchi' },
  { id: 'C-15', name: 'Elena Ferretti' },
  { id: 'C-20', name: 'Lucia Marchetti' },
];

const CURRENT_ADMIN = 'Francesca';

interface AreaTematicaDetailDrawerProps {
  isOpen: boolean;
  areaId: string | null;
  onClose: () => void;
  onDelete?: (areaId: string) => void;
}

export function AreaTematicaDetailDrawer({
  isOpen,
  areaId,
  onClose,
  onDelete,
}: AreaTematicaDetailDrawerProps) {
  const { aree, updateArea, assignCoach, unassignCoach } = useAreeTematiche();

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);

  const area = aree.find(a => a.id === areaId);

  useEffect(() => {
    if (area) {
      setEditName(area.name);
      setEditDescription(area.description);
      setSelectedCoachIds([...area.coachIds]);
    } else {
      setEditName('');
      setEditDescription('');
      setSelectedCoachIds([]);
    }
  }, [area, isOpen]);

  const coachOptions = COACHES_LIST.map(c => c.name);
  const selectedCoachNames = COACHES_LIST.filter(c =>
    selectedCoachIds.includes(c.id)
  ).map(c => c.name);

  const coachNameToId = (name: string) =>
    COACHES_LIST.find(c => c.name === name)?.id;

  const coachIdToName = (id: string) =>
    COACHES_LIST.find(c => c.id === id)?.name ?? id;

  const handleSelectCoach = (coachName: string) => {
    const coachId = coachNameToId(coachName);
    if (coachId && !selectedCoachIds.includes(coachId)) {
      setSelectedCoachIds(prev => [...prev, coachId]);
    }
  };

  const handleRemoveCoach = (coachName: string) => {
    const coachId = coachNameToId(coachName);
    if (coachId) {
      setSelectedCoachIds(prev => prev.filter(id => id !== coachId));
    }
  };

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error('Il nome non può essere vuoto');
      return;
    }

    if (!area) return;

    // Risincronizza i coach: rimuovi quelli non più selezionati, aggiungi i nuovi
    const currentCoachIds = area.coachIds;

    // Rimuovi
    currentCoachIds.forEach(coachId => {
      if (!selectedCoachIds.includes(coachId)) {
        unassignCoach(area.id, coachId);
      }
    });

    // Aggiungi
    selectedCoachIds.forEach(coachId => {
      if (!currentCoachIds.includes(coachId)) {
        assignCoach(area.id, coachId);
      }
    });

    // Aggiorna i dati area
    updateArea(area.id, a => ({
      ...a,
      name: editName.trim(),
      description: editDescription.trim(),
      updated_by: CURRENT_ADMIN,
      updated_at: new Date().toISOString(),
    }));

    toast.success(`Area "${editName.trim()}" aggiornata`);
    onClose();
  };

  if (!isOpen || !area) return null;

  return (
    <>
      <DrawerOverlay onClose={onClose} />

      <DrawerShell>
        <DrawerHeader
          icon={<FolderKanban size={20} />}
          title={area.name}
          subtitle={`ID: ${area.id}`}
          onClose={onClose}
        />

        <DrawerBody>
          {/* ── Dati area ── */}
          <DrawerSection bordered={false} title="Dati area">
            <DrawerFieldGroup>
              <DrawerLabel required>Nome</DrawerLabel>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Es. Economia e Management"
                style={drawerInputStyle}
              />
            </DrawerFieldGroup>
            <DrawerFieldGroup>
              <DrawerLabel>Descrizione</DrawerLabel>
              <input
                type="text"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Breve descrizione dell'area"
                style={drawerInputStyle}
              />
            </DrawerFieldGroup>
          </DrawerSection>

          {/* ── Coach assegnati ── */}
          <DrawerSection title="Coach assegnati">
            {COACHES_LIST.length === 0 ? (
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                }}
              >
                Nessun coach disponibile
              </span>
            ) : (
              <DrawerFieldGroup style={{ marginBottom: 0 }}>
                <DrawerSearchSelect
                  options={coachOptions}
                  selected={selectedCoachNames}
                  onSelect={handleSelectCoach}
                  onRemove={handleRemoveCoach}
                  placeholder="Cerca coach da assegnare..."
                />
              </DrawerFieldGroup>
            )}
          </DrawerSection>
        </DrawerBody>

        <DrawerFooter>
          <button className="btn btn-secondary" onClick={onClose}>
            Annulla
          </button>

          {onDelete && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (
                  confirm(
                    `Sei sicuro di voler eliminare l'area "${area.name}"?`
                  )
                ) {
                  onDelete(area.id);
                  onClose();
                }
              }}
              style={{ color: 'var(--destructive)' }}
            >
              <X size={16} />
              Elimina
            </button>
          )}

          <button className="btn btn-primary" onClick={handleSave}>
            Salva
          </button>
        </DrawerFooter>
      </DrawerShell>
    </>
  );
}
