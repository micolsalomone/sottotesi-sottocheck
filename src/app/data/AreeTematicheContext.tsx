import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Admin corrente ──────────────────────────────────────────
const CURRENT_ADMIN = 'Francesca';

// ─── Types ───────────────────────────────────────────────────
export interface AreaTematica {
  id: string;
  name: string;
  description: string;
  coachIds: string[];  // coach IDs assigned to this area
  createdAt: string;
  isActive: boolean;
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
}

// ─── Initial mock data ──────────────────────────────────────
const INITIAL_AREE: AreaTematica[] = [
  {
    id: 'AT-001',
    name: 'Economia e Management',
    description: 'Economia aziendale, marketing, finanza, gestione d\'impresa',
    coachIds: ['C-08'],
    createdAt: '2024-08-01',
    isActive: true,
    created_by: 'Francesca',
    updated_by: 'Francesca',
    updated_at: '2024-08-01',
  },
  {
    id: 'AT-002',
    name: 'Giurisprudenza',
    description: 'Diritto civile, penale, amministrativo, internazionale',
    coachIds: ['C-15'],
    createdAt: '2024-08-01',
    isActive: true,
    created_by: 'Claudia',
    updated_by: 'Claudia',
    updated_at: '2024-08-01',
  },
  {
    id: 'AT-003',
    name: 'Area Umanistica',
    description: 'Lettere, filosofia, storia, scienze della comunicazione',
    coachIds: ['C-07'],
    createdAt: '2024-09-01',
    isActive: true,
    created_by: 'Francesca',
    updated_by: 'Francesca',
    updated_at: '2024-09-01',
  },
  {
    id: 'AT-004',
    name: 'STEM',
    description: 'Ingegneria, informatica, matematica, fisica, chimica',
    coachIds: ['C-12'],
    createdAt: '2024-10-01',
    isActive: true,
    created_by: 'Claudia',
    updated_by: 'Francesca',
    updated_at: '2025-06-15',
  },
  {
    id: 'AT-005',
    name: 'Scienze Politiche',
    description: 'Relazioni internazionali, scienze politiche, sociologia',
    coachIds: [],
    createdAt: '2025-01-15',
    isActive: true,
    created_by: 'Francesca',
    updated_by: 'Francesca',
    updated_at: '2025-01-15',
  },
  {
    id: 'AT-006',
    name: 'Psicologia',
    description: 'Psicologia clinica, sociale, dello sviluppo',
    coachIds: [],
    createdAt: '2025-02-01',
    isActive: true,
    created_by: 'Francesca',
    updated_by: 'Claudia',
    updated_at: '2025-09-10',
  },
];

// ─── Context ────────────────────────────────────────────────
interface AreeTematicheContextType {
  aree: AreaTematica[];
  addArea: (area: AreaTematica) => void;
  updateArea: (id: string, updater: (a: AreaTematica) => AreaTematica) => void;
  removeArea: (id: string) => void;
  toggleAreaActive: (id: string) => void;
  assignCoach: (areaId: string, coachId: string) => void;
  unassignCoach: (areaId: string, coachId: string) => void;
  getAreasForCoach: (coachId: string) => AreaTematica[];
  getActiveAree: () => AreaTematica[];
}

// HMR-safe context: reuse existing context across hot reloads while preserving typings
type AreeGlobal = typeof globalThis & {
  __AreeTematicheContext?: React.Context<AreeTematicheContextType | null>;
};

const globalWithAree = globalThis as AreeGlobal;
const AreeTematicheContext: React.Context<AreeTematicheContextType | null> =
  globalWithAree.__AreeTematicheContext ?? createContext<AreeTematicheContextType | null>(null);
globalWithAree.__AreeTematicheContext = AreeTematicheContext;

export function AreeTematicheProvider({ children }: { children: React.ReactNode }) {
  const [aree, setAree] = useState(INITIAL_AREE);

  const addArea = useCallback((area: AreaTematica) => {
    setAree(prevAree => [...prevAree, area]);
  }, []);

  const updateArea = useCallback((id: string, updater: (a: AreaTematica) => AreaTematica) => {
    setAree(prevAree => prevAree.map(a => a.id === id ? updater(a) : a));
  }, []);

  const removeArea = useCallback((id: string) => {
    setAree(prevAree => prevAree.filter(a => a.id !== id));
  }, []);

  const toggleAreaActive = useCallback((id: string) => {
    setAree(prevAree => prevAree.map(a => a.id === id ? { ...a, isActive: !a.isActive, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : a));
  }, []);

  const assignCoach = useCallback((areaId: string, coachId: string) => {
    setAree(prevAree => prevAree.map(a => a.id === areaId ? { ...a, coachIds: [...a.coachIds, coachId], updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : a));
  }, []);

  const unassignCoach = useCallback((areaId: string, coachId: string) => {
    setAree(prevAree => prevAree.map(a => a.id === areaId ? { ...a, coachIds: a.coachIds.filter(c => c !== coachId), updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() } : a));
  }, []);

  const getAreasForCoach = useCallback((coachId: string) => {
    return aree.filter(a => a.coachIds.includes(coachId));
  }, [aree]);

  const getActiveAree = useCallback(() => {
    return aree.filter(a => a.isActive);
  }, [aree]);

  return (
    <AreeTematicheContext.Provider value={{
      aree,
      addArea,
      updateArea,
      removeArea,
      toggleAreaActive,
      assignCoach,
      unassignCoach,
      getAreasForCoach,
      getActiveAree,
    }}>
      {children}
    </AreeTematicheContext.Provider>
  );
}

export function useAreeTematiche() {
  const context = useContext(AreeTematicheContext);
  if (!context) {
    throw new Error('useAreeTematiche must be used within an AreeTematicheProvider');
  }
  return context;
}
