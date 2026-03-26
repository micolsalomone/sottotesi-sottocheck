import * as React from 'react';
import { useState, useEffect, useMemo, useRef, MouseEvent, CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLavorazioni, SERVICE_CATALOG } from '../../app/data/LavorazioniContext';
import type { Pipeline, Quote, StudentService, Student, StudentAcademicRecord } from '../../app/data/LavorazioniContext';
import { PipelineDetailDrawer } from '../../app/components/PipelineDetailDrawer';
import { CreatePipelineDrawer } from '../../app/components/CreatePipelineDrawer';
import { CreateStudentDrawer } from '../../app/components/CreateStudentDrawer';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { ConfirmDialog } from '../../app/components/ConfirmDialog';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import { 
  ResponsiveTableLayout,
  ResponsiveMobileCards,
  ResponsiveMobileCard,
  TableRoot, 
  TableHeaderCell, 
  TableRow, 
  TableCell, 
  TableEmptyState,
  StudentTypeBadge,
  CellTextPrimary,
  CellTextSecondary,
  CellContentStack,
  StatusPill
} from '../../app/components/TablePrimitives';

type SortKey = 'student_name' | 'email' | 'created_at' | 'lavorazioni_count' | null;
type GroupingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface PipelineGroup {
  key: string;
  label: string;
  pipelines: Pipeline[];
  sortTimestamp: number;
}

const SERVICE_LINK_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  coaching_plus: 'Coaching Plus',
  starter_pack: 'Starter Pack',
  check_plagio: 'Check plagio/AI',
  'SRV-001': 'Starter Pack',
  'SRV-002': 'Coaching',
  'SRV-003': 'Coaching Plus',
};

const CURRENT_ADMIN = 'Francesca';

const PIPELINE_SERVICE_TO_SERVICE_ID: Record<string, string> = {
  starter_pack: 'SRV-001',
  coaching: 'SRV-002',
  coaching_plus: 'SRV-003',
  check_plagio: 'SRV-004',
};

const resolveServiceIdFromQuote = (quote?: Quote, pipeline?: Pipeline): string => {
  const raw = quote?.service_link || pipeline?.service_link || '';
  if (!raw) return '';
  const direct = SERVICE_CATALOG.find(s => s.id === raw);
  if (direct) return direct.id;
  return PIPELINE_SERVICE_TO_SERVICE_ID[raw] || '';
};

const isQuoteEligibleForConversion = (quote: Quote): boolean => {
  return quote.status === 'paid' && typeof quote.amount_gross === 'number' && quote.amount_gross > 0;
};

type QuoteDisplayStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'expiring_soon' | 'expired';

const getQuoteDisplayStatus = (quote?: Quote): QuoteDisplayStatus | undefined => {
  if (!quote) return undefined;
  if (quote.status === 'paid') return 'paid';
  if (quote.status === 'accepted') return 'accepted';
  if (quote.status === 'draft') return 'draft';
  if (!quote.expires_at) return 'sent';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(today.getDate() + 5);

  const expiryDate = new Date(quote.expires_at);
  if (Number.isNaN(expiryDate.getTime())) return 'sent';

  if (today >= expiryDate) return 'expired';
  if (expiryDate <= fiveDaysFromNow) return 'expiring_soon';
  return 'sent';
};

export function PipelinesPage() {
  const { pipelines, removePipeline, students, updateStudent, addService, data, updatePipeline, addStudent } = useLavorazioni();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  // ─── Search & Filters ─────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [groupingPeriod, setGroupingPeriod] = useState<GroupingPeriod>('daily');
  
  // ─── Sort ─────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // ─── Bulk selection ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // ─── Drawers & Modals ─────────────────────────────────────
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);

  const [studentProfileDrawerOpen, setStudentProfileDrawerOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

  // Effect to handle highlight
  useEffect(() => {
    if (highlightId) {
      setSearchQuery('');
      setSourceFilter('all');
      const found = pipelines.find(p => p.id === highlightId);
      if (found) {
        setSelectedPipeline(found);
        setDetailDrawerOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [highlightId, pipelines, setSearchParams]);
  
  // ─── Column widths ────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 50,
    name: 230,
    email: 200,
    phone: 140,
    sources: 200,
    service: 150,
    created_at: 120,
    quote_status: 150,
    lavorazioni: 100,
    actions: 80,
  });

  // ─── Column resize ────────────────────────────────────────
  const handleMouseDown = (columnKey: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: any) => {
      const diff = e.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ─── Unique sources for filter ────────────────────────────
  const availableSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    pipelines.forEach(p => p.sources.forEach(s => sourcesSet.add(s)));
    return Array.from(sourcesSet).sort();
  }, [pipelines]);

  const availableServices = useMemo(() => {
    const servicesSet = new Set<string>();
    pipelines.forEach((p) => {
      if (p.service_link) {
        servicesSet.add(p.service_link);
      }
    });

    return Array.from(servicesSet)
      .map((service) => ({
        value: service,
        label: SERVICE_LINK_LABELS[service] ?? service,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'it-IT'));
  }, [pipelines]);

  // ─── Sort handler (3-state cycle) ─────────────────────────
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

  // ─── Filtered & sorted data ───────────────────────────────
  const filteredData = useMemo(() => {
    let data = [...pipelines];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p =>
        p.student_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== 'all') {
      data = data.filter(p => p.sources.includes(sourceFilter));
    }

    if (serviceFilter !== 'all') {
      data = data.filter((p) => p.service_link === serviceFilter);
    }

    if (quoteStatusFilter !== 'all') {
      data = data.filter(p => p.quotes?.some(q => q.status === quoteStatusFilter));
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'student_name':
            aVal = a.student_name.toLowerCase();
            bVal = b.student_name.toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          case 'lavorazioni_count':
            aVal = a.lavorazioni_ids.length;
            bVal = b.lavorazioni_ids.length;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [pipelines, searchQuery, sourceFilter, serviceFilter, sortColumn, sortDirection, quoteStatusFilter]);

  // ─── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = pipelines.length;
    const withLavorazioni = pipelines.filter(p => p.lavorazioni_ids.length > 0).length;
    const converted = pipelines.filter(p => p.lavorazioni_ids.length > 0).length;
    const expiringSoon = pipelines.filter(p => p.quotes?.some(q => getQuoteDisplayStatus(q) === 'expiring_soon')).length;
    const expired = pipelines.filter(p => p.quotes?.some(q => getQuoteDisplayStatus(q) === 'expired')).length;
    return { total, withLavorazioni, converted, expiringSoon, expired };
  }, [pipelines]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleRowClick = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setDetailDrawerOpen(true);
  };

  const handleConvertToLavorazione = (pipeline: Pipeline, quoteId?: string) => {
    const pipelineCurrent = pipelines.find(p => p.id === pipeline.id) || pipeline;
    const quotes = pipelineCurrent.quotes || [];
    const eligibleQuotes = quotes.filter(isQuoteEligibleForConversion);

    if (eligibleQuotes.length === 0) {
      toast.error('Serve almeno un preventivo pagato con importo per creare la lavorazione');
      return;
    }

    let selectedQuote: Quote | undefined;
    if (quoteId) {
      selectedQuote = eligibleQuotes.find(q => q.id === quoteId);
      if (!selectedQuote) {
        toast.error('Il preventivo selezionato non è convertibile');
        return;
      }
    } else if (eligibleQuotes.length === 1) {
      selectedQuote = eligibleQuotes[0];
    } else {
      setSelectedPipeline(pipeline);
      setDetailDrawerOpen(true);
      toast.info('Seleziona dal drawer quale preventivo convertire');
      return;
    }

    const alreadyConverted = data.some(s => s.pipeline_id === pipelineCurrent.id && s.quote_id === selectedQuote.id);
    if (alreadyConverted) {
      toast.error('Esiste gia una lavorazione creata da questo preventivo');
      return;
    }

    const serviceId = resolveServiceIdFromQuote(selectedQuote, pipelineCurrent);
    const selectedService = SERVICE_CATALOG.find(s => s.id === serviceId);
    if (!selectedService) {
      toast.error('Definisci il servizio del preventivo prima della conversione');
      setSelectedPipeline(pipelineCurrent);
      setDetailDrawerOpen(true);
      return;
    }

    if (!selectedQuote.amount_gross || selectedQuote.amount_gross <= 0) {
      toast.error('Il preventivo selezionato non ha un importo lordo valido');
      setSelectedPipeline(pipelineCurrent);
      setDetailDrawerOpen(true);
      return;
    }

    const maxLavId = data.reduce((max, s) => {
      const num = parseInt(s.id.replace('SS-', ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newLavId = `SS-${maxLavId + 1}`;

    const existingStudent = students.find(s => s.id === pipelineCurrent.student_id);
    const today = new Date().toISOString().split('T')[0];
    const newAcademicRecordId = !existingStudent ? `AR-${Math.floor(Math.random() * 9000) + 1000}` : undefined;
    const existingAcademicRecordId = existingStudent
      ? (existingStudent.academic_records?.find(r => r.is_current)?.id || existingStudent.academic_records?.[0]?.id)
      : undefined;
    const linkedAcademicRecordId = newAcademicRecordId ?? existingAcademicRecordId;

    const newLavorazione: StudentService = {
      id: newLavId,
      student_id: pipelineCurrent.student_id || `STU-${Math.floor(Math.random() * 9000) + 1000}`,
      student_name: pipelineCurrent.student_name || `${pipelineCurrent.first_name || ''} ${pipelineCurrent.last_name || ''}`.trim() || 'Studente senza nome',
      service_id: selectedService.id,
      service_name: selectedService.name,
      service_category: selectedService.category,
      quote_id: selectedQuote.id,
      status: 'active',
      created_at: today,
      created_by: CURRENT_ADMIN,
      referente: pipelineCurrent.assigned_to || CURRENT_ADMIN,
      installments: [{
        id: `INS-${Date.now()}`,
        amount: selectedQuote.amount_gross,
        dueDate: today,
        status: 'pending',
      }],
      pipeline_id: pipelineCurrent.id,
      academic_record_id: linkedAcademicRecordId,
      needs_timeline: selectedService.category === 'Coaching',
      quoted_gross_amount: selectedQuote.amount_gross,
    };

    addService(newLavorazione);

    if (!existingStudent) {
      const ad = pipelineCurrent.academic_data;
      const newAcademicRecord: StudentAcademicRecord | null = newAcademicRecordId ? {
        id: newAcademicRecordId,
        student_id: newLavorazione.student_id,
        degree_level: ad?.degree_level || '',
        course_name: ad?.course_name || '',
        university_name: ad?.university_name || '',
        thesis_professor: ad?.thesis_professor || '',
        thesis_subject: ad?.thesis_subject || '',
        foreign_language: ad?.foreign_language || false,
        thesis_language: ad?.thesis_language || '',
        thesis_type: ad?.thesis_type || '',
        is_current: true,
        created_at: today,
        updated_at: today,
      } : null;

      const pipelineSource = `pipeline:${pipelineCurrent.id}`;
      const contactEmails = pipelineCurrent.email ? [{
        email: pipelineCurrent.email,
        is_primary: true,
        purposes: ['generic', 'service_access'] as ('generic' | 'service_access')[],
        source: pipelineSource,
        added_at: today,
      }] : [];
      const additionalEmails = (pipelineCurrent.emails || []).map(email => ({
        email,
        is_primary: false,
        purposes: ['generic'] as ('generic' | 'service_access')[],
        source: pipelineSource,
        added_at: today,
      }));
      const contactPhones = pipelineCurrent.phone ? [{
        phone: pipelineCurrent.phone,
        is_primary: true,
        purposes: ['communications'] as ('communications' | 'coaching')[],
        source: pipelineSource,
        added_at: today,
      }] : [];
      const additionalPhones = (pipelineCurrent.phones || []).map(phone => ({
        phone,
        is_primary: false,
        purposes: ['communications'] as ('communications' | 'coaching')[],
        source: pipelineSource,
        added_at: today,
      }));

      const newStudent: Student = {
        id: newLavorazione.student_id,
        name: newLavorazione.student_name,
        first_name: pipelineCurrent.first_name || newLavorazione.student_name.split(' ').slice(0, -1).join(' ') || newLavorazione.student_name,
        last_name: pipelineCurrent.last_name || newLavorazione.student_name.split(' ').slice(-1).join('') || '',
        email: pipelineCurrent.email || '',
        phone: pipelineCurrent.phone || '',
        contacts: {
          emails: [...contactEmails, ...additionalEmails],
          phones: [...contactPhones, ...additionalPhones],
        },
        status: 'active',
        marketing_consent: !!(pipelineCurrent.marketing_consents && pipelineCurrent.email && pipelineCurrent.marketing_consents[pipelineCurrent.email]),
        academic_records: newAcademicRecord ? [newAcademicRecord] : [],
        created_at: today,
      };

      addStudent(newStudent);
    }

    updatePipeline(pipelineCurrent.id, p => ({
      ...p,
      lavorazioni_ids: [...p.lavorazioni_ids, newLavId],
      updated_at: new Date().toISOString(),
      updated_by: CURRENT_ADMIN,
    }));

    toast.success(`Lavorazione ${newLavId} creata dal preventivo ${selectedQuote.number}`);
    navigate(`/lavorazioni?highlight=${newLavId}`);
  };

  const handleDeletePipeline = (pipeline: Pipeline) => {
    setPipelineToDelete(pipeline);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (pipelineToDelete) {
      removePipeline(pipelineToDelete.id);
      setDeleteDialogOpen(false);
      setPipelineToDelete(null);
    }
  };

  const getActions = (pipeline: Pipeline): TableAction[] => [
    { label: 'Visualizza dettagli', onClick: () => handleRowClick(pipeline) },
    { label: 'Crea Lavorazione', onClick: () => handleConvertToLavorazione(pipeline) },
    { label: 'Elimina', onClick: () => handleDeletePipeline(pipeline), variant: 'destructive' },
  ];

  // ─── Bulk actions ─────────────────────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(p => p.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Elimina selezionate',
      onClick: () => {
        selectedIds.forEach(id => removePipeline(id));
        setSelectedIds([]);
      },
      variant: 'destructive',
    },
  ];

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setServiceFilter('all');
    setQuoteStatusFilter('all');
    setSortColumn('created_at');
    setSortDirection('desc');
  };

  const toLocalDate = (dateStr: string) => {
    if (dateStr.includes('T')) return new Date(dateStr);
    return new Date(`${dateStr}T00:00:00`);
  };

  const getDayKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startOfWeek = (date: Date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = normalized.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day;
    normalized.setDate(normalized.getDate() + distanceToMonday);
    return normalized;
  };

  const endOfWeek = (weekStart: Date) => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  };

  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  const formatDailyLabel = (date: Date) =>
    capitalize(
      date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );

  const formatWeeklyLabel = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart);
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear();

    if (sameMonth) {
      const monthYear = weekEnd.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      return `${weekStart.getDate()}–${weekEnd.getDate()} ${monthYear}`;
    }

    const startLabel = weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  };

  const formatMonthlyLabel = (date: Date) =>
    capitalize(date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));

  const formatYearlyLabel = (date: Date) => `${date.getFullYear()}`;

  const groupedPipelines = useMemo((): PipelineGroup[] => {
    const groupMap = new Map<string, PipelineGroup>();

    filteredData.forEach((pipeline) => {
      const date = toLocalDate(pipeline.created_at);
      let groupKey = '';
      let label = '';
      let sortTimestamp = 0;

      if (groupingPeriod === 'daily') {
        groupKey = getDayKey(date);
        label = formatDailyLabel(date);
        sortTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      } else if (groupingPeriod === 'weekly') {
        const weekStart = startOfWeek(date);
        groupKey = getDayKey(weekStart);
        label = formatWeeklyLabel(weekStart);
        sortTimestamp = weekStart.getTime();
      } else if (groupingPeriod === 'monthly') {
        groupKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
        label = formatMonthlyLabel(date);
        sortTimestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      } else {
        groupKey = `${date.getFullYear()}`;
        label = formatYearlyLabel(date);
        sortTimestamp = new Date(date.getFullYear(), 0, 1).getTime();
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          key: groupKey,
          label,
          pipelines: [],
          sortTimestamp,
        });
      }

      groupMap.get(groupKey)!.pipelines.push(pipeline);
    });

    return Array.from(groupMap.values()).sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  }, [filteredData, groupingPeriod]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getQuoteVariant = (quote?: Quote): any => {
    const status = getQuoteDisplayStatus(quote);
    switch (status) {
      case 'paid': return 'success';
      case 'accepted': return 'success';
      case 'sent': return 'info';
      case 'expired': return 'error';
      case 'expiring_soon': return 'warning';
      case 'draft': return 'neutral';
      default: return 'neutral';
    }
  };

  const getQuoteLabel = (quote?: Quote) => {
    const status = getQuoteDisplayStatus(quote);
    switch (status) {
      case 'paid': return 'Pagato';
      case 'accepted': return 'Accettato';
      case 'sent': return 'Inviato';
      case 'expired': return 'Scaduto';
      case 'expiring_soon': return 'In scadenza';
      case 'draft': return 'Bozza';
      default: return '—';
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Pipelines</h1>
        <p className="page-subtitle">Acquisizione lead e conversione in lavorazioni</p>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Totale Pipelines</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Con Lavorazioni</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.withLavorazioni}</div>
        </div>

        <div className="stat-card" style={{ border: '1px solid var(--warning)', background: 'rgba(247, 144, 9, 0.05)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--warning)' }}>In Scadenza (5gg)</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.expiringSoon}</div>
        </div>

        <div className="stat-card" style={{ border: '1px solid var(--destructive-foreground)', background: 'var(--destructive)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--destructive-foreground)' }}>Scaduti</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--destructive-foreground)' }}>{stats.expired}</div>
        </div>
      </div>

      {/* ACTION TOOLBAR */}
      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca per nome, email, telefono o ID..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
        </div>

        <div className="action-toolbar-right">
          <button className="btn btn-primary" onClick={() => setCreateDrawerOpen(true)}>
            <Plus size={18} />
            Nuova Pipeline
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem',
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Fonte acquisizione</label>
          <select className="select-dropdown w-full" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">Tutte le fonti</option>
            {availableSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Stato preventivo</label>
          <select className="select-dropdown w-full" value={quoteStatusFilter} onChange={(e) => setQuoteStatusFilter(e.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="sent">Inviato</option>
            <option value="accepted">Accettato</option>
            <option value="paid">Pagato</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label className="block mb-2 font-medium text-sm">Servizio</label>
          <select className="select-dropdown w-full" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="all">Tutti i servizi</option>
            {availableServices.map((service) => (
              <option key={service.value} value={service.value}>{service.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button className="btn btn-secondary h-fit" onClick={resetFilters}>Reset filtri</button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {([
          { key: 'daily', label: 'Giornaliero' },
          { key: 'weekly', label: 'Settimanale' },
          { key: 'monthly', label: 'Mensile' },
          { key: 'yearly', label: 'Annuale' },
        ] as Array<{ key: GroupingPeriod; label: string }>).map(tab => {
          const isActive = groupingPeriod === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setGroupingPeriod(tab.key);
                setSelectedIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                border: '2px solid transparent',
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: isActive ? 'var(--primary)' : 'transparent',
                borderRadius: '0',
                background: 'none',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-label)',
                fontWeight: isActive ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                lineHeight: '1.5',
                transition: 'border-color 0.15s ease, color 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BULK ACTIONS BAR */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* DATA TABLE (desktop) + CARDS (mobile) */}
      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1200px">
        <thead>
          <tr>
            <TableHeaderCell id="checkbox" label="" width={columnWidths.checkbox} onResize={handleMouseDown}>
              <Checkbox
                checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHeaderCell>

            <TableHeaderCell
              id="student_name"
              label="Nome"
              width={columnWidths.name}
              sortable
              sortDirection={sortColumn === 'student_name' ? sortDirection : null}
              onSort={() => handleSort('student_name')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell
              id="email"
              label="Email"
              width={columnWidths.email}
              sortable
              sortDirection={sortColumn === 'email' ? sortDirection : null}
              onSort={() => handleSort('email')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="phone" label="Telefono" width={columnWidths.phone} onResize={handleMouseDown} />
            <TableHeaderCell id="sources" label="Fonti" width={columnWidths.sources} onResize={handleMouseDown} />
            <TableHeaderCell id="service" label="Servizio" width={columnWidths.service} onResize={handleMouseDown} />

            <TableHeaderCell
              id="created_at"
              label="Data acq."
              width={columnWidths.created_at}
              sortable
              sortDirection={sortColumn === 'created_at' ? sortDirection : null}
              onSort={() => handleSort('created_at')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="quote_status" label="Stato Prev." width={columnWidths.quote_status} onResize={handleMouseDown} />

            <TableHeaderCell
              id="lavorazioni_count"
              label="N° Lav."
              width={columnWidths.lavorazioni}
              sortable
              sortDirection={sortColumn === 'lavorazioni_count' ? sortDirection : null}
              onSort={() => handleSort('lavorazioni_count')}
              onResize={handleMouseDown}
            />

            <TableHeaderCell id="actions" label="Azioni" width={columnWidths.actions} sticky="right" align="center" />
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <TableEmptyState message="Nessuna pipeline trovata" colSpan={10} />
          ) : (
            groupedPipelines.flatMap(group => [
              <TableRow key={`group-${group.key}`} style={{ backgroundColor: 'var(--muted)', borderTop: '2px solid var(--border)' }}>
                <TableCell colSpan={10} style={{ padding: '0.5rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {group.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {group.pipelines.length} {group.pipelines.length === 1 ? 'pipeline' : 'pipelines'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>,
              ...group.pipelines.map(pipeline => {
                const quote = pipeline.quotes?.[0];

                return (
                  <TableRow
                    key={pipeline.id}
                    onClick={() => handleRowClick(pipeline)}
                    highlighted={highlightId === pipeline.id}
                  >
                    <TableCell width={columnWidths.checkbox} align="center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(pipeline.id)}
                        onCheckedChange={() => handleSelectRow(pipeline.id)}
                      />
                    </TableCell>

                    <TableCell width={columnWidths.name}>
                      <CellContentStack>
                        <div className="flex items-center gap-2">
                          <CellTextPrimary>{pipeline.student_name}</CellTextPrimary>
                          <StudentTypeBadge isStudent={pipeline.lavorazioni_ids.length > 0 || pipeline.linked_existing_student === true} />
                        </div>
                        <CellTextSecondary>{pipeline.id}</CellTextSecondary>
                      </CellContentStack>
                    </TableCell>

                    <TableCell width={columnWidths.email}>
                      <CellTextSecondary>{pipeline.email}</CellTextSecondary>
                    </TableCell>

                    <TableCell width={columnWidths.phone}>
                      <CellTextSecondary>{pipeline.phone}</CellTextSecondary>
                    </TableCell>

                    <TableCell width={columnWidths.sources}>
                      <div className="flex flex-wrap gap-1">
                        {pipeline.sources.map(source => (
                          <StatusPill key={source} label={source} variant="neutral" />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell width={columnWidths.service}>
                      {pipeline.service_link ? (
                        <StatusPill label={SERVICE_LINK_LABELS[pipeline.service_link] ?? pipeline.service_link} variant="neutral" />
                      ) : (
                        <CellTextSecondary>—</CellTextSecondary>
                      )}
                    </TableCell>

                    <TableCell width={columnWidths.created_at}>
                      <CellTextSecondary>{formatDate(pipeline.created_at)}</CellTextSecondary>
                    </TableCell>

                    <TableCell width={columnWidths.quote_status}>
                      {quote ? (
                        <CellContentStack>
                          <StatusPill label={getQuoteLabel(quote)} variant={getQuoteVariant(quote)} />
                          <CellTextSecondary>
                            {typeof quote.amount_gross === 'number' && quote.amount_gross > 0
                              ? `€${quote.amount_gross.toLocaleString('it-IT')}`
                              : 'Importo non definito'}
                          </CellTextSecondary>
                        </CellContentStack>
                      ) : (
                        <CellTextSecondary>—</CellTextSecondary>
                      )}
                    </TableCell>

                    <TableCell width={columnWidths.lavorazioni} align="center">
                      <CellTextPrimary>{pipeline.lavorazioni_ids.length}</CellTextPrimary>
                    </TableCell>

                    <TableCell width={columnWidths.actions} sticky="right" align="center" onClick={(e) => e.stopPropagation()}>
                      <TableActions actions={getActions(pipeline)} />
                    </TableCell>
                  </TableRow>
                );
              })
            ])
          )}
        </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.length === 0 ? (
              <ResponsiveMobileCard>
                <div style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                  padding: '1rem 0',
                }}>
                  Nessuna pipeline trovata
                </div>
              </ResponsiveMobileCard>
            ) : (
              groupedPipelines.flatMap((group) => [
                <ResponsiveMobileCard key={`mobile-group-${group.key}`}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      lineHeight: '1.5',
                    }}>
                      {group.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {group.pipelines.length}
                    </div>
                  </div>
                </ResponsiveMobileCard>,
                ...group.pipelines.map((pipeline) => {
                  const quote = pipeline.quotes?.[0];
                  const isSelected = selectedIds.includes(pipeline.id);

                  return (
                    <ResponsiveMobileCard key={pipeline.id}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(pipeline.id)}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <div style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--foreground)',
                                lineHeight: '1.5',
                              }}>
                                {pipeline.student_name}
                              </div>
                              <StudentTypeBadge isStudent={pipeline.lavorazioni_ids.length > 0 || pipeline.linked_existing_student === true} />
                            </div>
                            <div style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '12px',
                              color: 'var(--muted-foreground)',
                              lineHeight: '1.5',
                            }}>
                              {pipeline.id}
                            </div>
                          </div>
                        </div>

                        <TableActions actions={getActions(pipeline)} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => handleRowClick(pipeline)}>
                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}>
                          {pipeline.email}
                        </div>

                        <div style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}>
                          {pipeline.phone}
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {pipeline.sources.map((source) => (
                            <StatusPill key={source} label={source} variant="neutral" />
                          ))}
                        </div>

                        {pipeline.service_link && (
                          <StatusPill label={SERVICE_LINK_LABELS[pipeline.service_link] ?? pipeline.service_link} variant="neutral" />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <StatusPill
                              label={quote ? getQuoteLabel(quote) : '—'}
                              variant={quote ? getQuoteVariant(quote) : 'neutral'}
                            />
                            {quote && (
                              <div style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '11px',
                                color: 'var(--muted-foreground)',
                                lineHeight: '1.5',
                              }}>
                                {typeof quote.amount_gross === 'number' && quote.amount_gross > 0
                                  ? `Lordo prev. €${quote.amount_gross.toLocaleString('it-IT')}`
                                  : 'Importo non definito'}
                              </div>
                            )}
                          </div>

                          <div style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: 'var(--text-label)',
                            color: 'var(--muted-foreground)',
                            lineHeight: '1.5',
                          }}>
                            {pipeline.lavorazioni_ids.length} lav. · {formatDate(pipeline.created_at)}
                          </div>
                        </div>
                      </div>
                    </ResponsiveMobileCard>
                  );
                })
              ])
            )}
          </ResponsiveMobileCards>
        )}
      />

      {/* DRAWERS */}
      {selectedPipeline && (
        <PipelineDetailDrawer
          pipeline={selectedPipeline}
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          onConvertToLavorazione={handleConvertToLavorazione}
          onOpenStudentProfile={(studentId) => {
            setSelectedStudentId(studentId);
            setStudentProfileDrawerOpen(true);
          }}
        />
      )}

      {selectedStudent && (
        <CreateStudentDrawer
          open={studentProfileDrawerOpen}
          onClose={() => setStudentProfileDrawerOpen(false)}
          onStudentCreated={() => {}}
          editStudent={selectedStudent}
          onStudentUpdated={(updated) => {
            updateStudent(updated.id, () => updated);
            setStudentProfileDrawerOpen(false);
            toast.success('Studente aggiornato');
          }}
        />
      )}

      <CreatePipelineDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Elimina Pipeline"
        description={`Sei sicuro di voler eliminare la pipeline di ${pipelineToDelete?.student_name}?`}
        confirmLabel="Elimina"
        variant="destructive"
      />
    </div>
  );
}
