import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  ExternalLink,
  Plus,
  Archive
} from 'lucide-react';
import { getFileTypeFromName } from '../../app/utils/fileTypeUtils';
import { DocumentArchiveDrawer } from '../../app/components/coach/DocumentArchiveDrawer';
import { StepArchiveDrawer } from '../../app/components/coach/StepArchiveDrawer';
import { useTableResize } from '../../app/hooks/useTableResize';
import { TableActions, type TableAction } from '../../app/components/TableActions';
import { BulkActionsBar, type BulkAction } from '../../app/components/BulkActionsBar';
import { Checkbox } from '../../app/components/ui/checkbox';
import {
  CellContentStack,
  CellTextPrimary,
  CellTextSecondary,
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveMobileFieldLabel,
  ResponsiveTableLayout,
  TableActionCell,
  TableCell,
  TableEmptyState,
  TableHeaderActionCell,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableSelectionCell,
  TableSelectionHeaderCell,
} from '../../app/components/TablePrimitives';
import { toast } from 'sonner';

const formatDateIT = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface Document {
  id: string;
  name: string;
  step?: number;
  totalSteps?: number;
  author: string;
  authorType: 'studente' | 'coach' | 'admin';
  service: string;
  uploadedAt: string;
  status: 'visible' | 'hidden';
  size: string;
  note?: string;
}

const mockDocuments: Document[] = [
  { id: 'DOC-001', name: 'Contratto_Verdi_v1.pdf', step: 1, totalSteps: 6, author: 'Giulia Verdi', authorType: 'studente', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '1.2 MB', note: 'Versione firmata digitalmente' },
  { id: 'DOC-002', name: 'Capitolo_1_Rossi.docx', step: 3, totalSteps: 6, author: 'Marco Rossi', authorType: 'studente', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-09', status: 'visible', size: '450 KB' },
  { id: 'DOC-003', name: 'Correzioni_Cap1.pdf', step: 3, totalSteps: 6, author: 'Martina Rossi', authorType: 'coach', service: 'SS-102 (Coaching)', uploadedAt: '2026-03-10', status: 'visible', size: '2.1 MB', note: 'Revisione con commenti in margine' },
  { id: 'DOC-004', name: 'CI_Neri_Fronte.jpg', step: 1, totalSteps: 4, author: 'Luca Neri', authorType: 'studente', service: 'SS-103 (Catalogo)', uploadedAt: '2026-03-05', status: 'hidden', size: '890 KB' },
  { id: 'DOC-005', name: 'Piano_Studi_Bianchi.pdf', step: 2, totalSteps: 5, author: 'Elena Bianchi', authorType: 'studente', service: 'SS-104 (Coaching)', uploadedAt: '2026-03-01', status: 'visible', size: '5.4 MB', note: 'Piano aggiornato dopo colloquio' },
  { id: 'DOC-006', name: 'Report_Finale.pdf', step: 5, totalSteps: 6, author: 'Martina Rossi', authorType: 'coach', service: 'SS-101 (Coaching)', uploadedAt: '2026-03-12', status: 'visible', size: '1.8 MB' },
  { id: 'DOC-007', name: 'Contratto_Firma.pdf', step: 1, totalSteps: 5, author: 'Paolo Russo', authorType: 'studente', service: 'SS-105 (Coaching)', uploadedAt: '2026-02-28', status: 'visible', size: '1.5 MB' },
];

export function DocumentiPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAuthorType, setFilterAuthorType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [sortColumn, setSortColumn] = useState<keyof Document | null>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Archive drawer states
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isStepArchiveOpen, setIsStepArchiveOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const { columnWidths, handleResize: handleMouseDown } = useTableResize({
    checkbox: 50,
    author: 160,
    name: 220,
    step: 120,
    note: 200,
    service: 170,
    uploadedAt: 120,
    status: 100,
    id: 100,
    actions: 80,
  });

  const handleSort = (column: keyof Document) => {
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

  const filteredData = useMemo(() => {
    let data = [...documents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.author.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }
    if (filterAuthorType !== 'all') data = data.filter(d => d.authorType === filterAuthorType);
    if (filterStatus !== 'all') data = data.filter(d => d.status === filterStatus);

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = a[sortColumn] || '';
        let bVal = b[sortColumn] || '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [documents, searchQuery, filterAuthorType, filterStatus, sortColumn, sortDirection]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(d => d.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Transform documents for DocumentArchiveDrawer
  const getArchiveDocuments = () => {
    if (!selectedService) return [];
    return documents
      .filter(d => d.service === selectedService)
      .map(d => ({
        id: d.id,
        name: d.name,
        sender: (d.authorType === 'studente' ? 'student' : 'coach') as 'student' | 'coach',
        stepId: d.step ? `step-${d.step}` : null,
        stepTitle: d.step ? `Step ${d.step}` : null,
        date: d.uploadedAt,
        size: d.size,
        uploadedBy: d.author,
        note: d.note,
      }));
  };

  // Transform documents for StepArchiveDrawer
  const getStepArchiveDocuments = () => {
    if (!selectedService || !selectedStepId) return [];
    const stepNum = parseInt(selectedStepId.replace('step-', ''));
    return documents
      .filter(d => d.service === selectedService && d.step === stepNum)
      .map(d => ({
        id: d.id,
        fileName: d.name,
        uploadDate: d.uploadedAt,
        uploadedBy: d.author,
        size: d.size,
        note: d.note,
      }));
  };

  const getTableActions = (doc: Document): TableAction[] => [
    { label: 'Scarica', icon: <Download size={16} />, onClick: () => toast.success(`Download ${doc.name} avviato`) },
    { 
      label: doc.status === 'visible' ? 'Nascondi' : 'Mostra', 
      icon: doc.status === 'visible' ? <EyeOff size={16} /> : <Eye size={16} />, 
      onClick: () => toast.success(`Documento ${doc.status === 'visible' ? 'nascosto' : 'visibile'}`) 
    },
    { label: 'Archivio', icon: <Archive size={16} />, onClick: () => { setSelectedService(doc.service); setIsArchiveOpen(true); }, divider: true },
    { label: 'Vai al percorso', icon: <ExternalLink size={16} />, onClick: () => toast.info('Navigazione al percorso collegato') },
    { label: 'Elimina', icon: <Trash2 size={16} />, onClick: () => toast.error('Azione non disponibile in demo'), variant: 'destructive' },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Scarica selezionati', icon: <Download size={16} />, onClick: (ids) => toast.success(`Download di ${ids.length} documenti avviato`) },
    { label: 'Nascondi selezionati', icon: <EyeOff size={16} />, onClick: (ids) => toast.success(`${ids.length} documenti nascosti`) },
    { label: 'Elimina', icon: <Trash2 size={16} />, onClick: (ids) => toast.error('Azione non disponibile in demo'), variant: 'destructive' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Documenti</h1>
        <p className="page-subtitle">Modifica, nascondi e scarica i documenti caricati nel sistema</p>
      </div>

      <div className="action-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Cerca per nome, autore o ID..." 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>
        <div className="action-toolbar-right">
          <button className="btn btn-primary" onClick={() => toast.info('Solo Admin: caricamento manuale non previsto in MVP')}>
            <Plus size={18} />
            Carica documento
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Tipo Autore</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterAuthorType} onChange={(e) => setFilterAuthorType(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="studente">Studente</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: '180px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Visibilità</label>
          <select className="select-dropdown" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tutti</option>
            <option value="visible">Visibile</option>
            <option value="hidden">Nascosto</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setFilterAuthorType('all'); setFilterStatus('all'); }}>Reset</button>
      </div>

      <BulkActionsBar 
        selectedCount={selectedIds.length} 
        selectedIds={selectedIds} 
        actions={bulkActions} 
        onClearSelection={() => setSelectedIds([])} 
      />

      <ResponsiveTableLayout
        desktop={(
          <TableRoot minWidth="1100px">
            <thead>
              <tr>
                <TableSelectionHeaderCell
                  width={columnWidths.checkbox}
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <TableHeaderCell id="author" label="Autore" width={columnWidths.author} sortable sortDirection={sortColumn === 'author' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="name" label="Nome File" width={columnWidths.name} sortable sortDirection={sortColumn === 'name' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="step" label="Step Timeline" width={columnWidths.step} onResize={handleMouseDown} />
                <TableHeaderCell id="note" label="Note" width={columnWidths.note} onResize={handleMouseDown} />
                <TableHeaderCell id="service" label="Percorso" width={columnWidths.service} onResize={handleMouseDown} />
                <TableHeaderCell id="uploadedAt" label="Caricato" width={columnWidths.uploadedAt} sortable sortDirection={sortColumn === 'uploadedAt' ? sortDirection : null} onSort={(id) => handleSort(id as keyof Document)} onResize={handleMouseDown} />
                <TableHeaderCell id="status" label="Stato" width={columnWidths.status} onResize={handleMouseDown} />
                <TableHeaderCell id="id" label="ID Doc" width={columnWidths.id} onResize={handleMouseDown} />
                <TableHeaderActionCell width={columnWidths.actions} />
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <TableEmptyState message="Nessun documento trovato" colSpan={10} />
              ) : (
                filteredData.map((doc) => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <TableRow key={doc.id} selected={isSelected} selectedBackgroundColor="var(--selected-row-bg)">
                      <TableSelectionCell checked={isSelected} onCheckedChange={() => handleSelectRow(doc.id)} onClick={(e) => e.stopPropagation()} />
                      <TableCell>
                        <CellContentStack>
                          <CellTextPrimary>{doc.author}</CellTextPrimary>
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', lineHeight: '1.5' }}>{doc.authorType}</div>
                        </CellContentStack>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const fileInfo = getFileTypeFromName(doc.name);
                          const FileIcon = fileInfo.icon;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileIcon size={16} className={`flex-shrink-0 ${fileInfo.color}`} />
                              <CellContentStack>
                                <CellTextPrimary>{doc.name}</CellTextPrimary>
                                <CellTextSecondary>{doc.size}</CellTextSecondary>
                              </CellContentStack>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {doc.step !== undefined ? (
                          <span style={{ padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-badge)', background: 'var(--muted)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
                            Step {doc.step}{doc.totalSteps !== undefined ? ` di ${doc.totalSteps}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.note ? (
                          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>{doc.note}</div>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell><CellTextSecondary>{doc.service}</CellTextSecondary></TableCell>
                      <TableCell><CellTextPrimary>{formatDateIT(doc.uploadedAt)}</CellTextPrimary></TableCell>
                      <TableCell>
                        {doc.status === 'visible' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><Eye size={14} /> Visibile</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><EyeOff size={14} /> Nascosto</span>
                        )}
                      </TableCell>
                      <TableCell><CellTextSecondary>{doc.id}</CellTextSecondary></TableCell>
                      <TableActionCell width={columnWidths.actions} backgroundColor={isSelected ? 'var(--selected-row-bg)' : 'var(--background)'}>
                        <TableActions actions={getTableActions(doc)} />
                      </TableActionCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </TableRoot>
        )}
        mobile={(
          <ResponsiveMobileCards>
            {filteredData.map((doc) => (
              <ResponsiveMobileCard key={doc.id} backgroundColor={selectedIds.includes(doc.id) ? 'var(--selected-row-bg)' : 'var(--card)'}>
                <ResponsiveMobileCardHeader>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Checkbox checked={selectedIds.includes(doc.id)} onCheckedChange={() => handleSelectRow(doc.id)} />
                    <CellContentStack>
                      <CellTextPrimary>{doc.author}</CellTextPrimary>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', lineHeight: '1.5' }}>{doc.authorType}</div>
                      {(() => {
                        const fileInfo = getFileTypeFromName(doc.name);
                        const FileIcon = fileInfo.icon;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                            <FileIcon size={14} className={`flex-shrink-0 ${fileInfo.color}`} />
                            <CellTextPrimary>{doc.name}</CellTextPrimary>
                          </div>
                        );
                      })()}
                      <CellTextSecondary>{doc.size}</CellTextSecondary>
                    </CellContentStack>
                  </div>
                  <TableActions actions={getTableActions(doc)} />
                </ResponsiveMobileCardHeader>

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Step Timeline</ResponsiveMobileFieldLabel>
                  <CellTextPrimary>{doc.step !== undefined ? `Step ${doc.step}${doc.totalSteps !== undefined ? ` di ${doc.totalSteps}` : ''}` : '—'}</CellTextPrimary>
                </ResponsiveMobileCardSection>

                {doc.note && (
                  <ResponsiveMobileCardSection>
                    <ResponsiveMobileFieldLabel>Note</ResponsiveMobileFieldLabel>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>{doc.note}</div>
                  </ResponsiveMobileCardSection>
                )}

                <ResponsiveMobileCardSection>
                  <ResponsiveMobileFieldLabel>Percorso</ResponsiveMobileFieldLabel>
                  <CellTextSecondary>{doc.service}</CellTextSecondary>
                </ResponsiveMobileCardSection>

                <ResponsiveMobileCardSection marginBottom="0">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CellTextSecondary>{formatDateIT(doc.uploadedAt)}</CellTextSecondary>
                    {doc.status === 'visible' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><Eye size={14} /> Visibile</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}><EyeOff size={14} /> Nascosto</span>
                    )}
                  </div>
                </ResponsiveMobileCardSection>
              </ResponsiveMobileCard>
            ))}
          </ResponsiveMobileCards>
        )}
      />

      {/* Document Archive Drawer - All documents for a service */}
      <DocumentArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => {
          setIsArchiveOpen(false);
          setSelectedService(null);
          setSelectedStepId(null);
        }}
        studentName={selectedService || ''}
        documents={getArchiveDocuments()}
        availableSteps={
          selectedService
            ? Array.from(
                new Set(
                  documents
                    .filter(d => d.service === selectedService && d.step)
                    .map(d => d.step!)
                )
              )
              .sort((a, b) => a - b)
              .map(step => ({
                id: `step-${step}`,
                phaseNumber: `Step ${step}`,
                title: `Step ${step}`,
              }))
            : []
        }
        onViewDocument={(docId) => toast.info(`Visualizzazione documento: ${docId}`)}
        onDownloadDocument={(docId) => toast.success(`Download avviato: ${docId}`)}
        onDeleteDocument={(docId) => toast.info(`Eliminazione documento: ${docId}`)}
        onRunPlagiarismCheck={(docId) => toast.info(`Controllo plagio avviato: ${docId}`)}
        onAddNote={(docId, note) => toast.success(`Nota aggiunta: ${note}`)}
        onAssignToStep={(docId, stepId) => {
          setSelectedStepId(stepId);
          setIsStepArchiveOpen(true);
          toast.success(`Documento assegnato a ${stepId}`);
        }}
        onUploadDocuments={(files, note, fileStepAssignments) => {
          const now = new Date();
          const nowIso = now.toISOString();
          const createdDocuments: Document[] = files.map((file, index) => {
            const assignedStepId = fileStepAssignments?.[index] ?? null;
            const stepNumber = assignedStepId ? parseInt(assignedStepId.replace('step-', ''), 10) : undefined;
            const safeStep = Number.isNaN(stepNumber ?? NaN) ? undefined : stepNumber;
            return {
              id: `DOC-UPL-${now.getTime()}-${index + 1}`,
              name: file.name,
              step: safeStep,
              totalSteps: safeStep ? 6 : undefined,
              author: 'Admin',
              authorType: 'admin',
              service: selectedService || 'Servizio non specificato',
              uploadedAt: nowIso,
              status: 'visible',
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              note,
            };
          });

          setDocuments(prev => [...createdDocuments, ...prev]);

          let withCategory = 0;
          let withoutCategory = 0;
          if (fileStepAssignments) {
            Object.values(fileStepAssignments).forEach(stepId => {
              if (stepId) withCategory++;
              else withoutCategory++;
            });
          } else {
            withoutCategory = files.length;
          }
          const parts = [];
          if (withCategory > 0) parts.push(`${withCategory} in step`);
          if (withoutCategory > 0) parts.push(`${withoutCategory} senza categoria`);
          toast.success(`${files.length} file caricato(i): ${parts.join(', ')}` + (note ? ` con nota: "${note}"` : ''));
        }}
      />

      {/* Step Archive Drawer - Documents for a specific step */}
      {selectedStepId && (
        <StepArchiveDrawer
          isOpen={isStepArchiveOpen}
          onClose={() => {
            setIsStepArchiveOpen(false);
            setSelectedStepId(null);
          }}
          stepId={selectedStepId}
          stepTitle={`Fase ${selectedStepId.replace('step-', '')}`}
          phaseNumber={`Step ${selectedStepId.replace('step-', '')}`}
          stepStatus="active"
          documents={getStepArchiveDocuments()}
          onUploadDocuments={(stepId, files, note) => toast.success(`${files.length} file caricato(i) in ${stepId}`)}
          onViewDocument={(docId) => toast.info(`Visualizzazione documento: ${docId}`)}
          onDownloadDocument={(docId) => toast.success(`Download avviato: ${docId}`)}
          onDeleteDocument={(docId) => toast.info(`Eliminazione documento: ${docId}`)}
          onRunPlagiarismCheck={(docId) => toast.info(`Controllo plagio avviato: ${docId}`)}
        />
      )}
    </div>
  );
}
