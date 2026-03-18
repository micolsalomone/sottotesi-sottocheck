import React, { useState, useMemo } from 'react';
import { Plus, MoreVertical, X, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Edit2, Pause, Copy, Archive, Check } from 'lucide-react';
import { toast } from 'sonner';

type ServiceStatus = 'draft' | 'active' | 'paused' | 'archived';
type TargetUser = 'student' | 'graduating' | 'phd';
type PriceType = 'free' | 'paid' | 'credits';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  targetUser: TargetUser;
  status: ServiceStatus;
  durationMinutes: number;
  maxSessions: number;
  coachAssignment: 'auto' | 'manual';
  priceType: PriceType;
  priceAmount: number;
  availableFrom: string;
  availableTo?: string;
  createdAt: string;
  updatedAt: string;
  // Metriche
  totalActivated: number;
  totalCompleted: number;
  completionRate: number;
  lastUsed?: string;
}

const mockServices: Service[] = [
  {
    id: 'SRV-001',
    name: 'Starter Pack',
    category: 'Starter Pack',
    description: 'Primo incontro conoscitivo e orientamento iniziale sulla tesi',
    targetUser: 'student',
    status: 'active',
    durationMinutes: 60,
    maxSessions: 1,
    coachAssignment: 'auto',
    priceType: 'paid',
    priceAmount: 99,
    availableFrom: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2026-02-05',
    totalActivated: 487,
    totalCompleted: 465,
    completionRate: 95.5,
    lastUsed: '2026-02-09'
  },
  {
    id: 'SRV-002',
    name: 'Coaching',
    category: 'Coaching',
    description: 'Percorso di coaching standard per tesi triennale',
    targetUser: 'graduating',
    status: 'active',
    durationMinutes: 17280, // 4 mesi
    maxSessions: 16,
    coachAssignment: 'manual',
    priceType: 'paid',
    priceAmount: 1200,
    availableFrom: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2026-02-07',
    totalActivated: 234,
    totalCompleted: 189,
    completionRate: 80.8,
    lastUsed: '2026-02-09'
  },
  {
    id: 'SRV-003',
    name: 'Coaching Plus',
    category: 'Coaching',
    description: 'Percorso di coaching avanzato per tesi magistrale o dottorato',
    targetUser: 'graduating',
    status: 'active',
    durationMinutes: 25920, // 6 mesi
    maxSessions: 24,
    coachAssignment: 'manual',
    priceType: 'paid',
    priceAmount: 1800,
    availableFrom: '2024-01-01',
    createdAt: '2024-01-01',
    updatedAt: '2026-02-08',
    totalActivated: 178,
    totalCompleted: 124,
    completionRate: 69.7,
    lastUsed: '2026-02-09'
  },
  {
    id: 'SRV-004',
    name: 'Sottocheck',
    category: 'Check plagio/AI',
    description: 'Verifica automatica plagio e contenuto AI generato - Prezzo in base al numero di pagine',
    targetUser: 'graduating',
    status: 'active',
    durationMinutes: 30,
    maxSessions: 1,
    coachAssignment: 'auto',
    priceType: 'paid',
    priceAmount: 0, // Prezzo variabile per pagina
    availableFrom: '2024-03-01',
    createdAt: '2024-02-20',
    updatedAt: '2026-02-09',
    totalActivated: 892,
    totalCompleted: 889,
    completionRate: 99.7,
    lastUsed: '2026-02-09'
  },
];

export function CatalogoServiziPage() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTarget, setFilterTarget] = useState('all');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Inline price editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  
  type SortKey = 'id' | 'name' | 'category' | 'targetUser' | 'status' | 'durationMinutes' | 'priceAmount' | 'updatedAt' | null;
  const [sortColumn, setSortColumn] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    category: 130,
    target: 120,
    status: 110,
    duration: 120,
    price: 130,
    updated: 130,
    actions: 150
  });

  const uniqueCategories = Array.from(new Set(services.map(s => s.category)));

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

  const filteredAndSortedData = useMemo(() => {
    let data = [...services];
    
    // Filtri
    if (searchQuery) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      data = data.filter(item => item.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      data = data.filter(item => item.category === filterCategory);
    }
    if (filterTarget !== 'all') {
      data = data.filter(item => item.targetUser === filterTarget);
    }
    
    // Ordinamento
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return data;
  }, [sortColumn, sortDirection, filterStatus, filterCategory, filterTarget, searchQuery, services]);

  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.pageX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const resizeHandle = (key: string) => (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        cursor: 'col-resize',
        borderRight: '2px solid var(--border)',
        transition: 'border-color 0.15s ease',
      }}
      onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(key, e); }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--primary)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderRightColor = 'var(--border)'; }}
    />
  );

  const handleOpenDetail = (service: Service) => {
    setSelectedService(service);
    setDetailDrawerOpen(true);
  };

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = [];
  if (filterStatus !== 'all') {
    const statusLabels: Record<string, string> = {
      'draft': 'Bozza',
      'active': 'Attivo',
      'paused': 'In pausa',
      'archived': 'Archiviato'
    };
    activeFilters.push({
      label: `Stato: ${statusLabels[filterStatus]}`,
      value: filterStatus,
      onRemove: () => setFilterStatus('all')
    });
  }
  if (filterCategory !== 'all') {
    activeFilters.push({
      label: `Categoria: ${filterCategory}`,
      value: filterCategory,
      onRemove: () => setFilterCategory('all')
    });
  }
  if (filterTarget !== 'all') {
    const targetLabels: Record<string, string> = {
      'student': 'Studente',
      'graduating': 'Laureando',
      'phd': 'Dottorando'
    };
    activeFilters.push({
      label: `Target: ${targetLabels[filterTarget]}`,
      value: filterTarget,
      onRemove: () => setFilterTarget('all')
    });
  }

  // Helper badges
  const getStatusBadge = (status: ServiceStatus) => {
    const config: Record<ServiceStatus, { label: string; className: string }> = {
      draft: { label: 'Bozza', className: 'inactive' },
      active: { label: 'Attivo', className: 'active' },
      paused: { label: 'In pausa', className: 'pending' },
      archived: { label: 'Archiviato', className: 'inactive' }
    };
    const { label, className } = config[status];
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  const getTargetLabel = (target: TargetUser) => {
    const labels: Record<TargetUser, string> = {
      student: 'Studente',
      graduating: 'Laureando',
      phd: 'Dottorando'
    };
    return labels[target];
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} ore`;
    const days = Math.round(minutes / 1440);
    if (days < 7) return `${days} giorni`;
    const weeks = Math.round(days / 7);
    if (weeks < 4) return `${weeks} settimane`;
    const months = Math.round(days / 30);
    return `${months} mesi`;
  };

  const formatPrice = (service: Service) => {
    if (service.priceType === 'free') return 'Gratuito';
    if (service.priceType === 'credits') return `${service.priceAmount} crediti`;
    if (service.priceAmount === 0) return 'Variabile';
    return `€${service.priceAmount.toLocaleString()}`;
  };

  const handleStartEditPrice = (service: Service, e: React.MouseEvent) => {
    e.stopPropagation();
    if (service.priceType === 'free') return;
    setEditingPriceId(service.id);
    setEditingPriceValue(String(service.priceAmount));
  };

  const handleSavePrice = (serviceId: string) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Inserisci un prezzo valido');
      return;
    }
    setServices(prev => prev.map(s =>
      s.id === serviceId
        ? { ...s, priceAmount: newPrice, updatedAt: new Date().toISOString().split('T')[0] }
        : s
    ));
    toast.success(`Prezzo aggiornato: €${newPrice.toLocaleString()}`);
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <h1 className="page-title">Servizi</h1>
        <p className="page-subtitle">Configurazione e monitoraggio servizi offerti</p>
      </div>

      <div className="action-toolbar" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, width: '100%' }}>
          <input
            type="text"
            placeholder="Cerca servizio..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }}
          />
          <button className="btn btn-secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            Cerca
          </button>
        </div>
        <div className="action-toolbar-right">
          <button className="btn btn-primary">
            <Plus size={18} />
            Nuovo Servizio
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }} className="filter-container">
        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Categoria
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Tutte</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Target
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="student">Studente</option>
            <option value="graduating">Laureando</option>
            <option value="phd">Dottorando</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Stato
          </label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="draft">Bozza</option>
            <option value="active">Attivo</option>
            <option value="paused">In pausa</option>
            <option value="archived">Archiviato</option>
          </select>
        </div>
      </div>

      {/* Filtri attivi */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
            Filtri attivi:
          </span>
          {activeFilters.map((filter, idx) => (
            <button
              key={idx}
              onClick={filter.onRemove}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', cursor: 'pointer' }}
            >
              {filter.label}
              <X size={14} />
            </button>
          ))}
          <button 
            onClick={() => { 
              setFilterStatus('all'); 
              setFilterCategory('all'); 
              setFilterTarget('all');
            }} 
            className="btn btn-secondary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}
          >
            Rimuovi tutti
          </button>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '1300px' }}>
            <thead>
              <tr>
                <th style={{ width: `${columnWidths.name}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Nome servizio</span>
                    {getSortIcon('name')}
                  </div>
                  {resizeHandle('name')}
                </th>
                <th style={{ width: `${columnWidths.category}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('category')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Categoria</span>
                    {getSortIcon('category')}
                  </div>
                  {resizeHandle('category')}
                </th>
                <th style={{ width: `${columnWidths.target}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('targetUser')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Target</span>
                    {getSortIcon('targetUser')}
                  </div>
                  {resizeHandle('target')}
                </th>
                <th style={{ width: `${columnWidths.status}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Stato</span>
                    {getSortIcon('status')}
                  </div>
                  {resizeHandle('status')}
                </th>
                <th style={{ width: `${columnWidths.duration}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('durationMinutes')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Durata</span>
                    {getSortIcon('durationMinutes')}
                  </div>
                  {resizeHandle('duration')}
                </th>
                <th style={{ width: `${columnWidths.price}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('priceAmount')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Prezzo</span>
                    {getSortIcon('priceAmount')}
                  </div>
                  {resizeHandle('price')}
                </th>
                <th style={{ width: `${columnWidths.updated}px`, position: 'relative', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('updatedAt')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                    <span>Ultima modifica</span>
                    {getSortIcon('updatedAt')}
                  </div>
                  {resizeHandle('updated')}
                </th>
                <th style={{ width: `${columnWidths.actions}px` }}>
                  <span>Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((service) => (
                <tr key={service.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(service)}>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.name}</td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.category}</td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{getTargetLabel(service.targetUser)}</td>
                  <td>{getStatusBadge(service.status)}</td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.name === 'Sottocheck' ? 'Non applicabile' : formatDuration(service.durationMinutes)}</td>
                  <td>
                    {editingPriceId === service.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          className="search-input"
                          style={{ width: '60px' }}
                          value={editingPriceValue}
                          onChange={(e) => setEditingPriceValue(e.target.value)}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}
                          onClick={() => handleSavePrice(service.id)}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: 'var(--text-label)' }}
                          onClick={handleCancelEditPrice}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: 'var(--text-label)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}
                        onClick={(e) => handleStartEditPrice(service, e)}
                      >
                        {formatPrice(service)}
                      </button>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{service.updatedAt}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.375rem 0.75rem',
                          fontSize: 'var(--text-label)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}
                        onClick={() => handleOpenDetail(service)}
                      >
                        <ExternalLink size={14} />
                        Apri
                      </button>
                      <button className="actions-button">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {filteredAndSortedData.map((service) => (
          <div 
            key={service.id} 
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                  {service.name}
                </div>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                  {service.category}
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                  {getTargetLabel(service.targetUser)}
                </span>
                <span style={{ color: 'var(--muted-foreground)' }}>•</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)' }}>
                  {service.name === 'Sottocheck' ? 'Non applicabile' : formatDuration(service.durationMinutes)}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                {formatPrice(service)}
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleOpenDetail(service)}
            >
              <ExternalLink size={14} />
              Apri Dettagli
            </button>
          </div>
        ))}
      </div>

      {/* Drawer dettaglio servizio */}
      {detailDrawerOpen && selectedService && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => {
            setDetailDrawerOpen(false);
            setSelectedService(null);
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '40%',
              minWidth: '500px',
              backgroundColor: 'var(--card)',
              boxShadow: 'var(--elevation-sm)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-alegreya)',
                    fontSize: 'var(--text-h3)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--foreground)',
                    margin: 0,
                    marginBottom: '0.5rem'
                  }}>
                    {selectedService.name}
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                    margin: 0
                  }}>
                    {selectedService.id}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    setSelectedService(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted-foreground)'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {getStatusBadge(selectedService.status)}
              </div>

              {/* CTA principali */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Edit2 size={16} />
                  Modifica servizio
                </button>
                <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                  {selectedService.status === 'active' ? (
                    <>
                      <Pause size={16} />
                      Metti in pausa
                    </>
                  ) : (
                    <>
                      <Pause size={16} />
                      Riattiva
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div style={{ 
              padding: '1.5rem',
              flex: 1,
              overflowY: 'auto'
            }}>
              {/* SEZIONE Informazioni generali */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Informazioni generali
                </h3>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Service ID <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(read-only)</span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)'
                    }}>
                      {selectedService.id}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Categoria <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <select className="select-dropdown" style={{ width: '100%' }} defaultValue={selectedService.category}>
                      <option>Starter Pack</option>
                      <option>Coaching</option>
                      <option>Check plagio/AI</option>
                    </select>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Descrizione breve <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <textarea 
                      className="search-input"
                      style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                      defaultValue={selectedService.description}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Target utenti <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <select className="select-dropdown" style={{ width: '100%' }} defaultValue={selectedService.targetUser}>
                      <option value="student">Studente</option>
                      <option value="graduating">Laureando</option>
                      <option value="phd">Dottorando</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEZIONE Configurazione operativa */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Configurazione operativa
                </h3>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Durata standard <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)'
                    }}>
                      {selectedService.name === 'Sottocheck' ? 'Non applicabile' : `${formatDuration(selectedService.durationMinutes)} (${selectedService.durationMinutes} minuti)`}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Numero massimo sessioni <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <input 
                      type="number" 
                      className="search-input"
                      style={{ width: '100%' }}
                      defaultValue={selectedService.maxSessions}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Assegnazione coach <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <select className="select-dropdown" style={{ width: '100%' }} defaultValue={selectedService.coachAssignment}>
                      <option value="auto">Automatica</option>
                      <option value="manual">Manuale</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEZIONE Regole di attivazione */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Regole di attivazione
                </h3>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Disponibile dal <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <input 
                      type="date" 
                      className="search-input"
                      style={{ width: '100%' }}
                      defaultValue={selectedService.availableFrom}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Disponibile fino al <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(opzionale, modificabile)</span>
                    </div>
                    <input 
                      type="date" 
                      className="search-input"
                      style={{ width: '100%' }}
                      defaultValue={selectedService.availableTo}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Prerequisiti <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                        <input type="checkbox" />
                        Tesi caricata
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                        <input type="checkbox" defaultChecked />
                        Pagamento completato
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
                        <input type="checkbox" />
                        Contratto firmato
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE Pricing */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Pricing
                </h3>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Tipo prezzo <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <select className="select-dropdown" style={{ width: '100%' }} defaultValue={selectedService.priceType}>
                      <option value="free">Gratuito</option>
                      <option value="paid">A pagamento</option>
                      <option value="credits">A crediti</option>
                    </select>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Prezzo <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <input 
                      type="number" 
                      className="search-input"
                      style={{ width: '100%' }}
                      defaultValue={selectedService.priceAmount}
                      disabled={selectedService.priceType === 'free'}
                    />
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      IVA / Note fiscali <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>(modificabile)</span>
                    </div>
                    <input 
                      type="text" 
                      className="search-input"
                      style={{ width: '100%' }}
                      placeholder="es. IVA 22% inclusa"
                    />
                  </div>
                </div>
              </div>

              {/* SEZIONE Metriche di servizio */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Metriche di servizio <span style={{ fontSize: '0.75rem', fontStyle: 'italic', textTransform: 'none', letterSpacing: 'normal' }}>(read-only)</span>
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Servizi attivati
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--foreground)'
                    }}>
                      {selectedService.totalActivated}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Servizi completati
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--foreground)'
                    }}>
                      {selectedService.totalCompleted}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Tasso completamento
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-h3)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: selectedService.completionRate > 80 ? 'var(--primary)' : 'var(--foreground)'
                    }}>
                      {selectedService.completionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      Ultimo utilizzo
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)'
                    }}>
                      {selectedService.lastUsed || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE Eventi recenti */}
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Eventi recenti
                </h3>
                
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: 'var(--radius)'
                }}>
                  <div style={{ 
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      2026-02-09 14:22
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)'
                    }}>
                      Servizio attivato per: Giulia Verdi
                    </div>
                  </div>

                  <div style={{ 
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      2026-02-08 11:15
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)'
                    }}>
                      Servizio completato da: Marco Rossi
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '0.25rem'
                    }}>
                      2026-02-05 09:42
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)'
                    }}>
                      Modifica configurazione: Durata aggiornata
                    </div>
                  </div>

                  <button className="btn btn-secondary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                    Vedi tutti gli eventi
                  </button>
                </div>
              </div>
            </div>

            {/* FOOTER - Azioni secondarie */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <Copy size={16} />
                Duplica
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <Archive size={16} />
                Archivia
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (max-width: 1024px) {
          [style*="maxWidth: '40%'"] {
            max-width: 60% !important;
          }
        }

        @media (max-width: 768px) {
          .data-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .action-toolbar {
            flex-direction: column;
            gap: 1rem;
          }
          .action-toolbar-left,
          .action-toolbar-right {
            width: 100%;
          }
          .action-toolbar-left {
            flex-direction: column;
          }
          .search-input {
            max-width: 100%;
          }
          .filter-container {
            padding: 1rem !important;
          }
          [style*="maxWidth: '40%'"] {
            max-width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}