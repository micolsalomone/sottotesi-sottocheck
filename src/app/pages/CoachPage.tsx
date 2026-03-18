import React, { useState, useMemo, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Edit, Trash2, Power, StickyNote, AlertCircle, CheckCircle, Users, Briefcase, UserCheck, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAreeTematiche } from '../data/AreeTematicheContext';
import { useLavorazioni } from '../data/LavorazioniContext';
import { CreateCoachDrawer, type Coach } from '../components/CreateCoachDrawer';
import { StatusBadge, type StatusType } from '../components/StatusBadge';
import { TableActions, type TableAction } from '../components/TableActions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../components/BulkActionsBar';
import { NotesDrawer, type Note } from '../components/NotesDrawer';
import { useDrawer } from '../hooks/useDrawer';
import { Checkbox } from '../components/ui/checkbox';
import { TableHeader } from '../components/ui/TableHeader';
import { useTableResize } from '../hooks/useTableResize';
import { toast } from 'sonner';

// ─── Mock admin corrente ───────────────────────────────────
const CURRENT_ADMIN = 'Francesca';

// ─── Initial mock coaches ───────────────────────────────────
const initialMockCoaches: Coach[] = [
  {
    id: 'C-07',
    fullName: 'Martina Rossi',
    email: 'martina.rossi@coach.com',
    phone: '+39 333 1112233',
    contacts: {
      emails: [
        { email: 'martina.rossi@coach.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2024-09-01T10:00:00Z' },
      ],
      phones: [
        { phone: '+39 333 1112233', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2024-09-01T10:00:00Z' },
      ],
    },
    status: 'active',
    activationDate: '2024-09-01',
    availability: ['Disponibilità limitata'],
    payment_reference: 'IT60 X054 2811 1010 0000 0123 456',
  },
  {
    id: 'C-12',
    fullName: 'Marco Bianchi',
    email: 'marco.bianchi@coach.com',
    phone: '+39 340 4445566',
    contacts: {
      emails: [
        { email: 'marco.bianchi@coach.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2024-10-15T10:00:00Z' },
        { email: 'marco.bianchi.alt@gmail.com', is_primary: false, purposes: ['generic'], source: 'manual', added_at: '2024-10-15T10:00:00Z' },
      ],
      phones: [
        { phone: '+39 340 4445566', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2024-10-15T10:00:00Z' },
      ],
    },
    status: 'active',
    activationDate: '2024-10-15',
    availability: ['Disponibile', 'Mattina'],
    payment_reference: 'IT40 S054 2811 1020 0000 0789 012',
  },
  {
    id: 'C-08',
    fullName: 'Andrea Conti',
    email: 'andrea.conti@coach.com',
    phone: '+39 349 7778899',
    contacts: {
      emails: [
        { email: 'andrea.conti@coach.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2024-08-12T10:00:00Z' },
      ],
      phones: [
        { phone: '+39 349 7778899', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2024-08-12T10:00:00Z' },
        { phone: '+39 349 0001111', is_primary: false, purposes: ['coaching'], source: 'manual', added_at: '2024-08-12T10:00:00Z' },
      ],
    },
    status: 'active',
    activationDate: '2024-08-12',
    availability: ['Pieno'],
    payment_reference: 'IT20 L030 6909 6061 0000 0654 321',
  },
  {
    id: 'C-15',
    fullName: 'Elena Ferretti',
    email: 'elena.ferretti@coach.com',
    phone: '+39 338 2223344',
    contacts: {
      emails: [
        { email: 'elena.ferretti@coach.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2025-01-10T10:00:00Z' },
      ],
      phones: [
        { phone: '+39 338 2223344', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2025-01-10T10:00:00Z' },
      ],
    },
    status: 'active',
    activationDate: '2025-01-10',
    availability: ['Disponibile', 'Weekend'],
    payment_reference: '',
  },
  {
    id: 'C-20',
    fullName: 'Lucia Marchetti',
    email: 'lucia.marchetti@coach.com',
    phone: '+39 320 5556677',
    contacts: {
      emails: [
        { email: 'lucia.marchetti@coach.com', is_primary: true, purposes: ['generic'], source: 'manual', added_at: '2024-06-01T10:00:00Z' },
      ],
      phones: [
        { phone: '+39 320 5556677', is_primary: true, purposes: ['communications'], source: 'manual', added_at: '2024-06-01T10:00:00Z' },
      ],
    },
    status: 'inactive',
    activationDate: '2024-06-01',
    availability: ['Temporaneamente non disponibile'],
    payment_reference: 'IT80 B030 6909 6061 0000 0111 222',
  },
];

// ─── Extended Coach type con tracking ──────────────────────
interface ExtendedCoach extends Coach {
  notes?: Note[];
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// ─── Helpers ────────────────────────────────────────────────
const AVAILABILITY_STATUS_MAP_KEYS: Record<string, StatusType> = {
  'Disponibile': 'active',
  'Disponibilità limitata': 'pending',
  'Pieno': 'inactive',
  'Temporaneamente non disponibile': 'archived',
  // legacy enum keys
  available: 'active',
  limited: 'pending',
  full: 'inactive',
  temporarily_unavailable: 'archived',
};

const getCoachAvailabilityStatus = (coach: Coach): StatusType => {
  const arr = Array.isArray(coach.availability)
    ? coach.availability
    : coach.availability ? [coach.availability as unknown as string] : [];
  return AVAILABILITY_STATUS_MAP_KEYS[arr[0]] ?? 'pending';
};

const getCoachAvailabilityLabel = (coach: Coach): string => {
  const arr = Array.isArray(coach.availability)
    ? coach.availability
    : coach.availability ? [coach.availability as unknown as string] : [];
  if (arr.length === 0) return '—';
  if (arr.length === 1) return arr[0];
  return `${arr[0]} +${arr.length - 1}`;
};

const SERVICE_STATUS_MAP: Record<string, StatusType> = {
  pending_payment: 'pending',
  active: 'active',
  paused: 'warning',
  completed: 'completed',
  cancelled: 'inactive',
  expired: 'overdue',
};

const SERVICE_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'In attesa pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

export function CoachPage() {
  const { getAreasForCoach, aree } = useAreeTematiche();
  const { data: lavorazioni } = useLavorazioni();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State base
  const [coaches, setCoaches] = useState<ExtendedCoach[]>(
    initialMockCoaches.map(c => ({
      ...c,
      notes: [],
      created_by: 'Francesca',
      created_at: c.activationDate + 'T10:00:00Z',
      updated_by: 'Francesca',
      updated_at: c.activationDate + 'T15:20:00Z',
    }))
  );

  // Filtri
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Drawer management
  const coachDrawer = useDrawer();

  // ─── Auto-open "Nuovo coach" from quick action ──────────
  const azioneParam = searchParams.get('azione');
  useEffect(() => {
    if (azioneParam === 'nuovo') {
      coachDrawer.open(undefined, 'create');
      setSearchParams({}, { replace: true });
    }
  }, [azioneParam, setSearchParams]);

  // Note drawer
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [selectedCoachForNotes, setSelectedCoachForNotes] = useState<ExtendedCoach | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    coach: ExtendedCoach | null;
  }>({ open: false, coach: null });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Expandable rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sort
  type SortKey = 'id' | 'fullName' | 'lavorazioniCount' | 'status' | 'activationDate' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column widths
  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    id: 80,
    fullName: 160,
    areeTematiche: 200,
    lavorazioni: 110,
    status: 100,
    availability: 150,
    referente: 130,
    activationDate: 130,
    notes: 60,
    actions: 80,
  });

  const uniqueAreaNames = aree.map(a => a.name);

  // ─── Lavorazioni count per coach ──────────────────────────
  const lavorazioniPerCoach = useMemo(() => {
    const map: Record<string, number> = {};
    lavorazioni.forEach(l => {
      if (l.coach_name) {
        map[l.coach_name] = (map[l.coach_name] || 0) + 1;
      }
    });
    return map;
  }, [lavorazioni]);

  const getLavorazioniCount = (coach: ExtendedCoach): number => {
    return lavorazioniPerCoach[coach.fullName] || 0;
  };

  // ─── Lavorazioni items per coach ──────────────────────────
  const getCoachLavorazioni = (coach: ExtendedCoach) => {
    return lavorazioni.filter(l => l.coach_name === coach.fullName);
  };

  // ─── Referenti unici per coach ────────────────────────────
  const getCoachReferenti = (coach: ExtendedCoach): string[] => {
    const refs = getCoachLavorazioni(coach)
      .map(l => l.referente)
      .filter((r): r is string => !!r);
    return [...new Set(refs)];
  };

  // ─── Navigate to lavorazione ──────────────────────────────
  const navigateToLavorazione = (svcId: string) => {
    navigate(`/lavorazioni?highlight=${svcId}`);
  };

  // ─── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = coaches.filter(c => c.status === 'active').length;
    const totalCoaches = coaches.length;
    const totalLavorazioni = coaches.reduce((sum, c) => sum + getLavorazioniCount(c), 0);
    const avgLavorazioni = active > 0 ? (totalLavorazioni / active).toFixed(1) : '0';
    return { active, totalCoaches, totalLavorazioni, avgLavorazioni };
  }, [coaches, lavorazioniPerCoach]);

  // ─── Sort ─────────────────────────────────────────────────
  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortKey) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />;
  };

  // ─── Filtered + sorted data ───────────────────────────────
  const filteredData = useMemo(() => {
    let data = [...coaches];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterStatus !== 'all') {
      data = data.filter(c => c.status === filterStatus);
    }
    if (filterSpecialization !== 'all') {
      data = data.filter(c => {
        const areas = getAreasForCoach(c.id);
        return areas.some(a => a.name === filterSpecialization);
      });
    }
    if (filterAvailability !== 'all') {
      data = data.filter(c => {
        const arr = Array.isArray(c.availability)
          ? c.availability
          : c.availability ? [c.availability as unknown as string] : [];
        return arr.some(v => v === filterAvailability || v.toLowerCase().includes(filterAvailability.toLowerCase()));
      });
    }
    if (filterDateFrom) {
      data = data.filter(c => c.activationDate >= filterDateFrom);
    }
    if (filterDateTo) {
      data = data.filter(c => c.activationDate <= filterDateTo);
    }

    // Sort
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (sortColumn === 'lavorazioniCount') {
          aVal = getLavorazioniCount(a);
          bVal = getLavorazioniCount(b);
        } else {
          aVal = a[sortColumn];
          bVal = b[sortColumn];
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [coaches, searchQuery, filterStatus, filterSpecialization, filterAvailability, filterDateFrom, filterDateTo, sortColumn, sortDirection, getAreasForCoach, lavorazioniPerCoach]);

  // ─── Actions ──────────────────────────────────────────────
  const handleToggleStatus = (coach: ExtendedCoach) => {
    setCoaches(prev => prev.map(c =>
      c.id === coach.id
        ? {
            ...c,
            status: c.status === 'active' ? 'inactive' : 'active',
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString()
          }
        : c
    ));
    toast.success(coach.status === 'active' ? 'Coach disattivato' : 'Coach attivato');
  };

  const handleEditCoach = (coach: ExtendedCoach) => {
    coachDrawer.open(coach, 'edit');
  };

  const handleOpenNotesDrawer = (coach: ExtendedCoach) => {
    setSelectedCoachForNotes(coach);
    setNotesDrawerOpen(true);
  };

  const handleAddNote = (content: string) => {
    if (!selectedCoachForNotes) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      admin: CURRENT_ADMIN,
      timestamp: new Date().toISOString()
    };

    setCoaches(prev => prev.map(c =>
      c.id === selectedCoachForNotes.id
        ? {
            ...c,
            notes: [...(c.notes || []), newNote],
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString()
          }
        : c
    ));

    // Aggiorna anche lo stato locale del drawer
    setSelectedCoachForNotes(prev => prev ? {
      ...prev,
      notes: [...(prev.notes || []), newNote]
    } : null);

    toast.success('Nota aggiunta');
  };

  const handleRemoveCoach = (coach: ExtendedCoach) => {
    const lavorazioniCount = getLavorazioniCount(coach);
    const areas = getAreasForCoach(coach.id);
    
    setConfirmDialog({
      open: true,
      coach: coach
    });
  };

  const confirmRemoveCoach = () => {
    if (!confirmDialog.coach) return;

    setCoaches(prev => prev.filter(c => c.id !== confirmDialog.coach!.id));
    toast.success('Coach rimosso');
    setConfirmDialog({ open: false, coach: null });
  };

  const handleSaveCoach = (coach: Coach) => {
    if (coachDrawer.mode === 'edit') {
      setCoaches(prev => prev.map(c => c.id === coach.id ? {
        ...coach,
        notes: c.notes,
        created_by: c.created_by,
        created_at: c.created_at,
        updated_by: CURRENT_ADMIN,
        updated_at: new Date().toISOString()
      } : c));
      toast.success('Coach aggiornato');
    } else {
      const newCoach: ExtendedCoach = {
        ...coach,
        notes: [],
        created_by: CURRENT_ADMIN,
        created_at: new Date().toISOString()
      };
      setCoaches(prev => [newCoach, ...prev]);
      toast.success('Coach creato');
    }
    coachDrawer.close();
  };

  // ─── Bulk Actions ─────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(c => c.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Attiva',
      icon: <CheckCircle size={16} />,
      onClick: (ids) => {
        setCoaches(prev => prev.map(c =>
          ids.includes(c.id) ? {
            ...c,
            status: 'active',
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString()
          } : c
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} coach attivati`);
      },
      variant: 'default'
    },
    {
      label: 'Disattiva',
      icon: <AlertCircle size={16} />,
      onClick: (ids) => {
        setCoaches(prev => prev.map(c =>
          ids.includes(c.id) ? {
            ...c,
            status: 'inactive',
            updated_by: CURRENT_ADMIN,
            updated_at: new Date().toISOString()
          } : c
        ));
        setSelectedIds([]);
        toast.success(`${ids.length} coach disattivati`);
      },
      variant: 'secondary'
    },
  ];

  // ─── Table Actions ────────────────────────────────────────
  const getTableActions = (coach: ExtendedCoach): TableAction[] => {
    const lavorazioniCount = getLavorazioniCount(coach);
    const noteCount = coach.notes?.length || 0;

    return [
      {
        label: 'Modifica',
        icon: <Edit size={16} />,
        onClick: () => handleEditCoach(coach)
      },
      {
        label: `Note interne${noteCount > 0 ? ` (${noteCount})` : ''}`,
        icon: <StickyNote size={16} />,
        onClick: () => handleOpenNotesDrawer(coach)
      },
      {
        label: coach.status === 'active' ? 'Disattiva' : 'Attiva',
        icon: <Power size={16} />,
        onClick: () => handleToggleStatus(coach),
        divider: true
      },
      {
        label: 'Rimuovi',
        icon: <Trash2 size={16} />,
        onClick: () => handleRemoveCoach(coach),
        variant: 'destructive'
      }
    ];
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Gestione Coach</h1>
        <p className="page-subtitle">Gestione coach e carico lavoro</p>
        <style>{`
          @media (max-width: 768px) {
            .page-header {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
            }
          }
        `}</style>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Coach attivi</span>
            <div className="stat-icon">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.active}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            su {stats.totalCoaches} totali
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Lavorazioni assegnate</span>
            <div className="stat-icon">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalLavorazioni}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            con coach assegnato
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Media per coach</span>
            <div className="stat-icon">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.avgLavorazioni}</div>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            lineHeight: '1.5',
          }}>
            lavorazioni per coach attivo
          </div>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          flex: 1,
          width: '100%',
        }}>
          <input
            type="text"
            placeholder="Cerca per nome, ID o email..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              minWidth: 0,
              maxWidth: 'none',
            }}
          />
        </div>

        <div className="action-toolbar-right">
          <button
            className="btn btn-primary"
            onClick={() => coachDrawer.open(undefined, 'create')}
          >
            <Plus size={18} />
            Nuovo Coach
          </button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .action-toolbar {
              margin-left: var(--spacing-4) !important;
              margin-right: var(--spacing-4) !important;
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .action-toolbar > div {
              width: 100% !important;
            }
            .action-toolbar-right {
              width: 100% !important;
              justify-content: stretch !important;
            }
            .action-toolbar-right .btn {
              width: 100% !important;
              justify-content: center !important;
            }
          }
        `}</style>
      </div>

      {/* Filtri multipli */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Stato
          </label>
          <select
            className="select-dropdown"
            style={{ width: '100%' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="inactive">Inattivo</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Area Tematica
          </label>
          <select
            className="select-dropdown"
            style={{ width: '100%' }}
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
          >
            <option value="all">Tutte</option>
            {uniqueAreaNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Disponibilità
          </label>
          <select
            className="select-dropdown"
            style={{ width: '100%' }}
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
          >
            <option value="all">Tutte</option>
            <option value="available">Disponibile</option>
            <option value="limited">Limitata</option>
            <option value="full">Pieno</option>
            <option value="temporarily_unavailable">Non disponibile</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Attivato da
          </label>
          <input
            type="date"
            className="search-input"
            style={{ width: '100%' }}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            marginBottom: '0.5rem',
            lineHeight: '1.5',
          }}>
            Attivato fino a
          </label>
          <input
            type="date"
            className="search-input"
            style={{ width: '100%' }}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>

        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('all');
              setFilterSpecialization('all');
              setFilterAvailability('all');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
            style={{ height: 'fit-content' }}
          >
            Reset filtri
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Table - Desktop */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1200px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: `${columnWidths.checkbox}px`, position: 'relative', background: 'var(--muted)', borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
                  <Checkbox
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px', background: 'var(--border)' }} />
                </th>
                <TableHeader label="ID" columnKey="id" width={columnWidths.id} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Nome" columnKey="fullName" width={columnWidths.fullName} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Aree Tematiche" columnKey="areeTematiche" width={columnWidths.areeTematiche} onResize={handleMouseDown} />
                <TableHeader label="Lavorazioni" columnKey="lavorazioniCount" width={columnWidths.lavorazioni} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Stato" columnKey="status" width={columnWidths.status} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Disponibilità" columnKey="availability" width={columnWidths.availability} onResize={handleMouseDown} />
                <TableHeader label="Referente" columnKey="referente" width={columnWidths.referente} onResize={handleMouseDown} />
                <TableHeader label="Attivazione" columnKey="activationDate" width={columnWidths.activationDate} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} onResize={handleMouseDown} />
                <TableHeader label="Note" columnKey="notes" width={columnWidths.notes} onResize={handleMouseDown} align="center" />
                <th style={{ width: `${columnWidths.actions}px`, background: 'var(--muted)', borderBottom: '1px solid var(--border)' }} />
              </tr>
            </thead>
            {filteredData.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      Nessun coach trovato
                    </span>
                  </td>
                </tr>
              </tbody>
            ) : (
              filteredData.map((coach) => {
                const lavorazioniCount = getLavorazioniCount(coach);
                const coachLavorazioni = getCoachLavorazioni(coach);
                const hasLavorazioni = coachLavorazioni.length > 0;
                const isExpanded = expandedRows.has(coach.id);
                const noteCount = coach.notes?.length || 0;
                const isSelected = selectedIds.includes(coach.id);

                return (
                  <tbody key={coach.id}>
                    <tr 
                      onClick={() => handleEditCoach(coach)}
                      style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--selected-row-bg)' : undefined }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(coach.id)}
                        />
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {coach.id}
                      </td>
                      <td>
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                          }}>
                            {coach.fullName}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {coach.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const areas = getAreasForCoach(coach.id);
                          if (areas.length === 0) {
                            return <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>Nessuna</span>;
                          }
                          return (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {areas.map(area => (
                                <span key={area.id} style={{
                                  display: 'inline-block',
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: 'var(--muted)',
                                  borderRadius: 'var(--radius-badge)',
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--foreground)',
                                  lineHeight: '1.5',
                                }}>
                                  {area.name}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Lavorazioni — expandable */}
                      <td onClick={(e) => { e.stopPropagation(); if (hasLavorazioni) toggleRowExpand(coach.id); }} style={{ cursor: hasLavorazioni ? 'pointer' : 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {hasLavorazioni && (
                            <ChevronRight
                              size={14}
                              style={{
                                color: 'var(--muted-foreground)',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.15s ease',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: hasLavorazioni ? 'var(--foreground)' : 'var(--muted-foreground)',
                          }}>
                            {hasLavorazioni ? (
                              <>{lavorazioniCount} {lavorazioniCount === 1 ? 'servizio' : 'servizi'}</>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>—</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          status={coach.status === 'active' ? 'active' : 'inactive'}
                        />
                      </td>
                      <td>
                        <StatusBadge
                          status={getCoachAvailabilityStatus(coach)}
                          label={getCoachAvailabilityLabel(coach)}
                        />
                      </td>
                      <td>
                        {(() => {
                          const referenti = getCoachReferenti(coach);
                          if (referenti.length === 0) {
                            return <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>—</span>;
                          }
                          return (
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {referenti.map(ref => (
                                <span key={ref} style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: 'var(--text-label)',
                                  color: 'var(--foreground)',
                                  lineHeight: '1.5',
                                }}>
                                  {ref}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        color: 'var(--foreground)',
                        lineHeight: '1.5',
                      }}>
                        {coach.activationDate}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenNotesDrawer(coach)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: '0.25rem',
                            color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                          }}
                          title={`${noteCount} note`}
                        >
                          <StickyNote size={18} />
                          {noteCount > 0 && (
                            <span style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              backgroundColor: 'var(--primary)',
                              color: 'var(--primary-foreground)',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'var(--font-weight-medium)',
                              fontFamily: 'var(--font-inter)',
                            }}>
                              {noteCount}
                            </span>
                          )}
                        </button>
                      </td>
                      <td 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          position: 'sticky', 
                          right: 0, 
                          backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--background)', 
                          zIndex: 10,
                          boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <TableActions actions={getTableActions(coach)} />
                      </td>
                    </tr>

                    {/* ─── Expanded lavorazioni rows ──────────────── */}
                    {isExpanded && coachLavorazioni.map((svc) => (
                      <tr
                        key={svc.id}
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        {/* Spacer for checkbox */}
                        <td />
                        {/* ID lavorazione — link */}
                        <td
                          onClick={() => navigateToLavorazione(svc.id)}
                          style={{
                            fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)',
                            color: 'var(--primary)', cursor: 'pointer',
                            textDecoration: 'underline', textDecorationColor: 'transparent',
                            textUnderlineOffset: '2px', transition: 'text-decoration-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableCellElement).style.textDecorationColor = 'var(--primary)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableCellElement).style.textDecorationColor = 'transparent'; }}
                          title="Vai alla lavorazione"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {svc.id}
                            <ExternalLink size={11} style={{ opacity: 0.6 }} />
                          </div>
                        </td>
                        {/* Studente + Servizio */}
                        <td>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                            {svc.student_name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {svc.service_name}
                          </div>
                        </td>
                        {/* Aree tematiche spacer */}
                        <td />
                        {/* Compenso lavorazione */}
                        <td>
                          {svc.coach_fee !== undefined && svc.coach_fee !== null && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontFamily: 'var(--font-inter)',
                              fontSize: 'var(--text-label)',
                              lineHeight: '1.5',
                            }}>
                              <span style={{
                                color: 'var(--muted-foreground)',
                                fontWeight: 'var(--font-weight-regular)',
                              }}>
                                Compenso:
                              </span>
                              <span style={{
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--foreground)',
                              }}>
                                €{svc.coach_fee.toLocaleString('it-IT')}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* Stato lavorazione */}
                        <td>
                          <StatusBadge
                            status={SERVICE_STATUS_MAP[svc.status] || 'inactive'}
                            label={SERVICE_STATUS_LABELS[svc.status] || svc.status}
                          />
                        </td>
                        {/* Date (Disponibilità col) */}
                        <td>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                            {(() => {
                              const startDate = svc.start_date || svc.plan_start_date;
                              const endDate = svc.end_date || svc.plan_end_date;

                              if (!startDate) {
                                return <span style={{ fontStyle: 'italic' }}>Non avviato</span>;
                              }

                              return (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'wrap' }}>
                                  <span>{startDate}</span>
                                  <span>→</span>
                                  {endDate ? (
                                    <span style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: 'var(--text-label)',
                                      fontWeight: 'var(--font-weight-medium)',
                                      color: 'var(--foreground)',
                                    }}>
                                      {endDate}
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: '11px',
                                      fontWeight: 'var(--font-weight-medium)',
                                      color: 'var(--chart-2)',
                                      fontStyle: 'italic',
                                    }}>
                                      in corso
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        {/* Referente lavorazione */}
                        <td>
                          <div style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            color: svc.referente ? 'var(--foreground)' : 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {svc.referente || '—'}
                          </div>
                        </td>
                        {/* Attivazione spacer */}
                        <td>
                          
                        </td>
                        {/* Empty note */}
                        <td />
                        {/* Empty actions */}
                        <td style={{
                          position: 'sticky', right: 0,
                          backgroundColor: 'var(--muted)',
                          zIndex: 10, boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)'
                        }} />
                      </tr>
                    ))}
                  </tbody>
                );
              })
            )}
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredData.map((coach) => {
          const lavorazioniCount = getLavorazioniCount(coach);
          const coachLavorazioniMobile = getCoachLavorazioni(coach);
          const isExpandedMobile = expandedRows.has(coach.id);
          const noteCount = coach.notes?.length || 0;
          const isSelected = selectedIds.includes(coach.id);

          return (
            <div
              key={coach.id}
              style={{
                backgroundColor: isSelected ? 'var(--selected-row-bg)' : 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSelectRow(coach.id)}
                  />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      {coach.id}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {coach.fullName}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {coach.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={coach.status === 'active' ? 'active' : 'inactive'} />
                  <TableActions actions={getTableActions(coach)} />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '0.25rem',
                    lineHeight: '1.5',
                  }}>
                    Aree Tematiche
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {(() => {
                      const areas = getAreasForCoach(coach.id);
                      if (areas.length === 0) {
                        return <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>Nessuna area assegnata</span>;
                      }
                      return areas.map(area => (
                        <span key={area.id} style={{
                          display: 'inline-block',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: 'var(--muted)',
                          borderRadius: 'var(--radius-badge)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}>
                          {area.name}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Lavorazioni
                    </div>
                    {coachLavorazioniMobile.length > 0 ? (
                      <button
                        onClick={() => toggleRowExpand(coach.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)',
                        }}
                      >
                        {lavorazioniCount} {lavorazioniCount === 1 ? 'servizio' : 'servizi'}
                        <ChevronRight size={12} style={{ transform: isExpandedMobile ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                      </button>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>—</span>
                    )}
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Disponibilità
                    </div>
                    <StatusBadge
                      status={getCoachAvailabilityStatus(coach)}
                      label={getCoachAvailabilityLabel(coach)}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem',
                      lineHeight: '1.5',
                    }}>
                      Note
                    </div>
                    <button
                      onClick={() => handleOpenNotesDrawer(coach)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: noteCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      <StickyNote size={16} />
                      {noteCount}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded lavorazioni mobile */}
              {isExpandedMobile && coachLavorazioniMobile.length > 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  padding: '0.75rem', backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)', marginBottom: '0.75rem',
                }}>
                  {coachLavorazioniMobile.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => navigateToLavorazione(svc.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', padding: '0.375rem 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)', lineHeight: '1.5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {svc.id} <ExternalLink size={10} style={{ opacity: 0.5 }} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                          {svc.student_name} · {svc.service_name}
                        </div>
                      </div>
                      <StatusBadge status={SERVICE_STATUS_MAP[svc.status] || 'inactive'} label={SERVICE_STATUS_LABELS[svc.status] || svc.status} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                color: 'var(--muted-foreground)',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                lineHeight: '1.5',
              }}>
                Attivazione: {coach.activationDate}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Coach */}
      <CreateCoachDrawer
        isOpen={coachDrawer.isOpen}
        onClose={coachDrawer.close}
        editCoach={coachDrawer.mode === 'edit' ? coachDrawer.data : undefined}
        onSave={handleSaveCoach}
        auditInfo={coachDrawer.mode === 'edit' && coachDrawer.data ? {
          created_by: coachDrawer.data.created_by,
          created_at: coachDrawer.data.created_at,
          updated_by: coachDrawer.data.updated_by,
          updated_at: coachDrawer.data.updated_at,
        } : undefined}
      />

      {/* Notes Drawer */}
      {selectedCoachForNotes && (
        <NotesDrawer
          isOpen={notesDrawerOpen}
          onClose={() => {
            setNotesDrawerOpen(false);
            setSelectedCoachForNotes(null);
          }}
          entityId={selectedCoachForNotes.id}
          entityType="Coach"
          entityName={selectedCoachForNotes.fullName}
          notes={selectedCoachForNotes.notes || []}
          onAddNote={handleAddNote}
          currentAdmin={CURRENT_ADMIN}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.coach && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={`Rimuovere ${confirmDialog.coach.fullName}?`}
          description="Questa azione è irreversibile. Il coach verrà rimosso dal sistema."
          confirmLabel="Rimuovi"
          cancelLabel="Annulla"
          onConfirm={confirmRemoveCoach}
          variant="destructive"
          itemsList={[
            `Coach: ${confirmDialog.coach.fullName}`,
            `Lavorazioni assegnate: ${getLavorazioniCount(confirmDialog.coach)}`,
            `Aree tematiche: ${getAreasForCoach(confirmDialog.coach.id).length}`,
            `Note interne: ${confirmDialog.coach.notes?.length || 0}`
          ]}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .data-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
        
        .data-table tbody tr {
          transition: background-color 0.15s ease;
        }
        
        .data-table tbody tr:hover {
          background-color: var(--muted);
        }
      `}</style>
    </div>
  );
}