import React, { useState, useMemo } from 'react';
import { MoreVertical, AlertCircle, Clock, FileCheck, Pause, CheckCircle } from 'lucide-react';
import { useTableResize } from '@/app/hooks/useTableResize';
import { StatusBadge } from '@/app/components/StatusBadge';
import {
  CellTextPrimary,
  ResponsiveMobileCard,
  ResponsiveMobileCardHeader,
  ResponsiveMobileCards,
  ResponsiveMobileCardSection,
  ResponsiveMobileFieldLabel,
  ResponsiveTableLayout,
  TableCell,
  TableHeaderActionCell,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from '@/app/components/TablePrimitives';

interface CriticalService {
  id: string;
  student: string;
  service: string;
  coach: string;
  status: 'in_ritardo' | 'bloccato';
  daysLate: number;
}

interface CoachWorkload {
  id: string;
  coach: string;
  activeServices: number;
  lateServices: number;
  utilizationRate: number;
}

interface CheckActivity {
  id: string;
  document: string;
  student: string;
  checkStatus: 'completato' | 'in_corso' | 'fallito';
  date: string;
  outcome: string;
}

const mockCriticalServices: CriticalService[] = [
  { id: 'SRV-034', student: 'Giulia Verdi', service: 'Tesi completa', coach: 'Laura Bianchi', status: 'in_ritardo', daysLate: 12 },
  { id: 'SRV-041', student: 'Luca Neri', service: 'Revisione tesi', coach: 'Marco Ferri', status: 'in_ritardo', daysLate: 8 },
  { id: 'SRV-062', student: 'Paolo Russo', service: 'Tesi completa', coach: 'Andrea Romano', status: 'bloccato', daysLate: 15 },
  { id: 'SRV-055', student: 'Chiara Galli', service: 'Consulenza avanzata', coach: 'Laura Bianchi', status: 'in_ritardo', daysLate: 9 },
  { id: 'SRV-048', student: 'Matteo Conti', service: 'Tesi completa', coach: 'Francesca Conti', status: 'bloccato', daysLate: 18 },
];

const mockCoachWorkload: CoachWorkload[] = [
  { id: 'C-001', coach: 'Laura Bianchi', activeServices: 8, lateServices: 2, utilizationRate: 80 },
  { id: 'C-002', coach: 'Marco Ferri', activeServices: 6, lateServices: 1, utilizationRate: 60 },
  { id: 'C-003', coach: 'Andrea Romano', activeServices: 7, lateServices: 1, utilizationRate: 70 },
  { id: 'C-004', coach: 'Francesca Conti', activeServices: 9, lateServices: 1, utilizationRate: 90 },
  { id: 'C-005', coach: 'Giuseppe Verdi', activeServices: 5, lateServices: 0, utilizationRate: 50 },
];

const mockCheckActivity: CheckActivity[] = [
  { id: 'CHK-501', document: 'capitolo_1.docx', student: 'Giulia Verdi', checkStatus: 'completato', date: '2026-02-09', outcome: 'Nessun plagio rilevato' },
  { id: 'CHK-502', document: 'tesi_completa.pdf', student: 'Paolo Russo', checkStatus: 'in_corso', date: '2026-02-09', outcome: '-' },
  { id: 'CHK-503', document: 'metodologia.docx', student: 'Luca Neri', checkStatus: 'completato', date: '2026-02-08', outcome: 'Warning: 2 fonti simili' },
  { id: 'CHK-504', document: 'bibliografia.pdf', student: 'Sara Martini', checkStatus: 'fallito', date: '2026-02-08', outcome: 'Errore timeout' },
  { id: 'CHK-505', document: 'capitolo_2.docx', student: 'Chiara Galli', checkStatus: 'completato', date: '2026-02-07', outcome: 'Nessun plagio rilevato' },
  { id: 'CHK-506', document: 'tesi_finale.pdf', student: 'Alessandro Brun', checkStatus: 'completato', date: '2026-02-07', outcome: 'Nessun plagio rilevato' },
];

export function KpiMonitoraggioPage() {
  // KPI data
  const kpiData = {
    activeServices: 35,
    lateServices: 5,
    pendingDocuments: 12,
    blockedSteps: 3,
    checksLastMonth: 47,
  };

  // Sorting states for each table
  type CriticalSortKey = 'student' | 'service' | 'coach' | 'status' | 'daysLate' | null;
  const [criticalSortColumn, setCriticalSortColumn] = useState<CriticalSortKey>(null);
  const [criticalSortDirection, setCriticalSortDirection] = useState<'asc' | 'desc'>('asc');

  type WorkloadSortKey = 'coach' | 'activeServices' | 'lateServices' | 'utilizationRate' | null;
  const [workloadSortColumn, setWorkloadSortColumn] = useState<WorkloadSortKey>(null);
  const [workloadSortDirection, setWorkloadSortDirection] = useState<'asc' | 'desc'>('asc');

  type CheckSortKey = 'document' | 'student' | 'checkStatus' | 'date' | null;
  const [checkSortColumn, setCheckSortColumn] = useState<CheckSortKey>(null);
  const [checkSortDirection, setCheckSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleCriticalSort = (column: CriticalSortKey) => {
    if (criticalSortColumn === column) {
      setCriticalSortDirection(criticalSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCriticalSortColumn(column);
      setCriticalSortDirection('asc');
    }
  };

  const handleWorkloadSort = (column: WorkloadSortKey) => {
    if (workloadSortColumn === column) {
      if (workloadSortDirection === 'asc') {
        setWorkloadSortDirection('desc');
      } else {
        setWorkloadSortColumn(null);
        setWorkloadSortDirection('asc');
      }
    } else {
      setWorkloadSortColumn(column);
      setWorkloadSortDirection('asc');
    }
  };

  const handleCheckSort = (column: CheckSortKey) => {
    if (checkSortColumn === column) {
      if (checkSortDirection === 'asc') {
        setCheckSortDirection('desc');
      } else {
        setCheckSortColumn(null);
        setCheckSortDirection('asc');
      }
    } else {
      setCheckSortColumn(column);
      setCheckSortDirection('asc');
    }
  };

  const { columnWidths: criticalColumnWidths, handleResize: handleCriticalResize } = useTableResize({
    student: 200,
    service: 220,
    coach: 180,
    status: 140,
    daysLate: 170,
    actions: 90,
  });

  const { columnWidths: workloadColumnWidths, handleResize: handleWorkloadResize } = useTableResize({
    coach: 220,
    activeServices: 170,
    lateServices: 190,
    utilizationRate: 240,
    actions: 90,
  });

  const { columnWidths: checkColumnWidths, handleResize: handleCheckResize } = useTableResize({
    document: 220,
    student: 200,
    checkStatus: 150,
    date: 140,
    outcome: 260,
    actions: 90,
  });

  const sortedCriticalServices = useMemo(() => {
    let data = [...mockCriticalServices];
    if (criticalSortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[criticalSortColumn];
        let bVal: any = b[criticalSortColumn];
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return criticalSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return criticalSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [criticalSortColumn, criticalSortDirection]);

  const sortedCoachWorkload = useMemo(() => {
    let data = [...mockCoachWorkload];
    if (workloadSortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[workloadSortColumn];
        let bVal: any = b[workloadSortColumn];
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return workloadSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return workloadSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [workloadSortColumn, workloadSortDirection]);

  const sortedCheckActivity = useMemo(() => {
    let data = [...mockCheckActivity];
    if (checkSortColumn) {
      data.sort((a, b) => {
        let aVal: any = a[checkSortColumn];
        let bVal: any = b[checkSortColumn];
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return checkSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return checkSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [checkSortColumn, checkSortDirection]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">KPI & Monitoraggio</h1>
        <p className="page-subtitle">Indicatori operativi e situazioni critiche</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Servizi Attivi */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Servizi Attivi
            </span>
            <CheckCircle size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1 }}>
            {kpiData.activeServices}
          </div>
        </div>

        {/* Servizi in Ritardo */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Servizi in Ritardo
            </span>
            <AlertCircle size={20} style={{ color: 'hsl(25, 95%, 53%)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'hsl(25, 95%, 53%)', lineHeight: 1 }}>
            {kpiData.lateServices}
          </div>
        </div>

        {/* Documenti in Attesa */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Documenti in Attesa
            </span>
            <FileCheck size={20} style={{ color: 'hsl(200, 60%, 50%)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1 }}>
            {kpiData.pendingDocuments}
          </div>
        </div>

        {/* Step Bloccati */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Step Bloccati (&gt;7gg)
            </span>
            <Pause size={20} style={{ color: 'hsl(0, 70%, 50%)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'hsl(0, 70%, 50%)', lineHeight: 1 }}>
            {kpiData.blockedSteps}
          </div>
        </div>

        {/* Check Plagio */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)' }}>
              Check Plagio (30gg)
            </span>
            <Clock size={20} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1 }}>
            {kpiData.checksLastMonth}
          </div>
        </div>
      </div>

      {/* Servizi Critici Table */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-4)' }}>
          Servizi Critici
        </h2>
        <ResponsiveTableLayout
          desktop={(
            <TableRoot minWidth="1000px">
              <thead>
                <tr>
                  <TableHeaderCell id="student" label="Studente" width={criticalColumnWidths.student} sortable sortDirection={criticalSortColumn === 'student' ? criticalSortDirection : null} onSort={(id) => handleCriticalSort(id as CriticalSortKey)} onResize={handleCriticalResize} />
                  <TableHeaderCell id="service" label="Servizio" width={criticalColumnWidths.service} sortable sortDirection={criticalSortColumn === 'service' ? criticalSortDirection : null} onSort={(id) => handleCriticalSort(id as CriticalSortKey)} onResize={handleCriticalResize} />
                  <TableHeaderCell id="coach" label="Coach" width={criticalColumnWidths.coach} sortable sortDirection={criticalSortColumn === 'coach' ? criticalSortDirection : null} onSort={(id) => handleCriticalSort(id as CriticalSortKey)} onResize={handleCriticalResize} />
                  <TableHeaderCell id="status" label="Stato" width={criticalColumnWidths.status} sortable sortDirection={criticalSortColumn === 'status' ? criticalSortDirection : null} onSort={(id) => handleCriticalSort(id as CriticalSortKey)} onResize={handleCriticalResize} />
                  <TableHeaderCell id="daysLate" label="Giorni di Ritardo" width={criticalColumnWidths.daysLate} sortable sortDirection={criticalSortColumn === 'daysLate' ? criticalSortDirection : null} onSort={(id) => handleCriticalSort(id as CriticalSortKey)} onResize={handleCriticalResize} />
                  <TableHeaderActionCell width={criticalColumnWidths.actions} />
                </tr>
              </thead>
              <tbody>
                {sortedCriticalServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell><CellTextPrimary>{service.student}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{service.service}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{service.coach}</CellTextPrimary></TableCell>
                    <TableCell>
                      <StatusBadge status={service.status === 'in_ritardo' ? 'overdue' : 'blocked'} label={service.status === 'in_ritardo' ? 'In Ritardo' : 'Bloccato'} />
                    </TableCell>
                    <TableCell>
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: service.daysLate > 10 ? 'hsl(0, 70%, 50%)' : 'hsl(25, 95%, 53%)',
                        lineHeight: '1.5',
                      }}>
                        {service.daysLate}
                      </span>
                    </TableCell>
                    <TableCell align="center" sticky="right" width={criticalColumnWidths.actions}>
                      <button className="actions-button"><MoreVertical size={18} /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableRoot>
          )}
          mobile={(
            <ResponsiveMobileCards>
              {sortedCriticalServices.map((service) => (
                <ResponsiveMobileCard key={service.id}>
                  <ResponsiveMobileCardHeader>
                    <div>
                      <CellTextPrimary>{service.student}</CellTextPrimary>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{service.service}</div>
                    </div>
                    <StatusBadge status={service.status === 'in_ritardo' ? 'overdue' : 'blocked'} label={service.status === 'in_ritardo' ? 'In Ritardo' : 'Bloccato'} />
                  </ResponsiveMobileCardHeader>
                  <ResponsiveMobileCardSection marginBottom="0.75rem">
                    <ResponsiveMobileFieldLabel>Coach</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{service.coach}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                  <ResponsiveMobileCardSection marginBottom="0">
                    <ResponsiveMobileFieldLabel>Giorni di Ritardo</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{service.daysLate}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                </ResponsiveMobileCard>
              ))}
            </ResponsiveMobileCards>
          )}
        />
      </div>

      {/* Carico Coach Table */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-4)' }}>
          Carico Coach
        </h2>
        <ResponsiveTableLayout
          desktop={(
            <TableRoot minWidth="900px">
              <thead>
                <tr>
                  <TableHeaderCell id="coach" label="Coach" width={workloadColumnWidths.coach} sortable sortDirection={workloadSortColumn === 'coach' ? workloadSortDirection : null} onSort={(id) => handleWorkloadSort(id as WorkloadSortKey)} onResize={handleWorkloadResize} />
                  <TableHeaderCell id="activeServices" label="Servizi Attivi" width={workloadColumnWidths.activeServices} sortable sortDirection={workloadSortColumn === 'activeServices' ? workloadSortDirection : null} onSort={(id) => handleWorkloadSort(id as WorkloadSortKey)} onResize={handleWorkloadResize} />
                  <TableHeaderCell id="lateServices" label="Servizi in Ritardo" width={workloadColumnWidths.lateServices} sortable sortDirection={workloadSortColumn === 'lateServices' ? workloadSortDirection : null} onSort={(id) => handleWorkloadSort(id as WorkloadSortKey)} onResize={handleWorkloadResize} />
                  <TableHeaderCell id="utilizationRate" label="Utilizzo" width={workloadColumnWidths.utilizationRate} sortable sortDirection={workloadSortColumn === 'utilizationRate' ? workloadSortDirection : null} onSort={(id) => handleWorkloadSort(id as WorkloadSortKey)} onResize={handleWorkloadResize} />
                  <TableHeaderActionCell width={workloadColumnWidths.actions} />
                </tr>
              </thead>
              <tbody>
                {sortedCoachWorkload.map((coach) => (
                  <TableRow key={coach.id}>
                    <TableCell><CellTextPrimary>{coach.coach}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{coach.activeServices}</CellTextPrimary></TableCell>
                    <TableCell>
                      <span style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: coach.lateServices > 0 ? 'hsl(25, 95%, 53%)' : 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {coach.lateServices}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: 'var(--muted)',
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${coach.utilizationRate}%`,
                            backgroundColor: coach.utilizationRate > 85 ? 'hsl(25, 95%, 53%)' : coach.utilizationRate > 70 ? 'hsl(45, 95%, 53%)' : 'var(--primary)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)', minWidth: '40px' }}>
                          {coach.utilizationRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="center" sticky="right" width={workloadColumnWidths.actions}>
                      <button className="actions-button"><MoreVertical size={18} /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableRoot>
          )}
          mobile={(
            <ResponsiveMobileCards>
              {sortedCoachWorkload.map((coach) => (
                <ResponsiveMobileCard key={coach.id}>
                  <ResponsiveMobileCardHeader>
                    <div>
                      <CellTextPrimary>{coach.coach}</CellTextPrimary>
                    </div>
                    <button className="actions-button"><MoreVertical size={18} /></button>
                  </ResponsiveMobileCardHeader>
                  <ResponsiveMobileCardSection marginBottom="0.75rem">
                    <ResponsiveMobileFieldLabel>Servizi Attivi</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{coach.activeServices}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                  <ResponsiveMobileCardSection marginBottom="0.75rem">
                    <ResponsiveMobileFieldLabel>Servizi in Ritardo</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{coach.lateServices}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                  <ResponsiveMobileCardSection marginBottom="0">
                    <ResponsiveMobileFieldLabel>Utilizzo</ResponsiveMobileFieldLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        backgroundColor: 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${coach.utilizationRate}%`,
                          backgroundColor: coach.utilizationRate > 85 ? 'hsl(25, 95%, 53%)' : coach.utilizationRate > 70 ? 'hsl(45, 95%, 53%)' : 'var(--primary)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <CellTextPrimary>{coach.utilizationRate}%</CellTextPrimary>
                    </div>
                  </ResponsiveMobileCardSection>
                </ResponsiveMobileCard>
              ))}
            </ResponsiveMobileCards>
          )}
        />
      </div>

      {/* Attività Sottocheck Table */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-4)' }}>
          Attività Sottocheck
        </h2>
        <ResponsiveTableLayout
          desktop={(
            <TableRoot minWidth="1060px">
              <thead>
                <tr>
                  <TableHeaderCell id="document" label="Documento" width={checkColumnWidths.document} sortable sortDirection={checkSortColumn === 'document' ? checkSortDirection : null} onSort={(id) => handleCheckSort(id as CheckSortKey)} onResize={handleCheckResize} />
                  <TableHeaderCell id="student" label="Studente" width={checkColumnWidths.student} sortable sortDirection={checkSortColumn === 'student' ? checkSortDirection : null} onSort={(id) => handleCheckSort(id as CheckSortKey)} onResize={handleCheckResize} />
                  <TableHeaderCell id="checkStatus" label="Stato Check" width={checkColumnWidths.checkStatus} sortable sortDirection={checkSortColumn === 'checkStatus' ? checkSortDirection : null} onSort={(id) => handleCheckSort(id as CheckSortKey)} onResize={handleCheckResize} />
                  <TableHeaderCell id="date" label="Data" width={checkColumnWidths.date} sortable sortDirection={checkSortColumn === 'date' ? checkSortDirection : null} onSort={(id) => handleCheckSort(id as CheckSortKey)} onResize={handleCheckResize} />
                  <TableHeaderCell id="outcome" label="Esito" width={checkColumnWidths.outcome} onResize={handleCheckResize} />
                  <TableHeaderActionCell width={checkColumnWidths.actions} />
                </tr>
              </thead>
              <tbody>
                {sortedCheckActivity.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell><CellTextPrimary>{check.document}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{check.student}</CellTextPrimary></TableCell>
                    <TableCell>
                      <StatusBadge
                        status={check.checkStatus === 'completato' ? 'active' : check.checkStatus === 'in_corso' ? 'in-progress' : 'inactive'}
                        label={check.checkStatus === 'completato' ? 'Completato' : check.checkStatus === 'in_corso' ? 'In Corso' : 'Fallito'}
                      />
                    </TableCell>
                    <TableCell><CellTextPrimary>{check.date}</CellTextPrimary></TableCell>
                    <TableCell><CellTextPrimary>{check.outcome}</CellTextPrimary></TableCell>
                    <TableCell align="center" sticky="right" width={checkColumnWidths.actions}>
                      <button className="actions-button"><MoreVertical size={18} /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableRoot>
          )}
          mobile={(
            <ResponsiveMobileCards>
              {sortedCheckActivity.map((check) => (
                <ResponsiveMobileCard key={check.id}>
                  <ResponsiveMobileCardHeader>
                    <div>
                      <CellTextPrimary>{check.document}</CellTextPrimary>
                      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>{check.student}</div>
                    </div>
                    <StatusBadge
                      status={check.checkStatus === 'completato' ? 'active' : check.checkStatus === 'in_corso' ? 'in-progress' : 'inactive'}
                      label={check.checkStatus === 'completato' ? 'Completato' : check.checkStatus === 'in_corso' ? 'In Corso' : 'Fallito'}
                    />
                  </ResponsiveMobileCardHeader>
                  <ResponsiveMobileCardSection marginBottom="0.75rem">
                    <ResponsiveMobileFieldLabel>Data</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{check.date}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                  <ResponsiveMobileCardSection marginBottom="0">
                    <ResponsiveMobileFieldLabel>Esito</ResponsiveMobileFieldLabel>
                    <CellTextPrimary>{check.outcome}</CellTextPrimary>
                  </ResponsiveMobileCardSection>
                </ResponsiveMobileCard>
              ))}
            </ResponsiveMobileCards>
          )}
        />
      </div>
    </div>
  );
}