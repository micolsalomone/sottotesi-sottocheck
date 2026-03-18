import React, { useState, useMemo } from 'react';
import { MoreVertical, AlertCircle, Clock, FileCheck, Pause, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

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

  const getSortIcon = (column: any, currentColumn: any, direction: 'asc' | 'desc') => {
    if (currentColumn !== column) {
      return <ChevronsUpDown size={14} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    }
    return direction === 'asc' 
      ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />;
  };

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
        <div className="data-table">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCriticalSort('student')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Studente</span>
                      {getSortIcon('student', criticalSortColumn, criticalSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCriticalSort('service')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Servizio</span>
                      {getSortIcon('service', criticalSortColumn, criticalSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCriticalSort('coach')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Coach</span>
                      {getSortIcon('coach', criticalSortColumn, criticalSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCriticalSort('status')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Stato</span>
                      {getSortIcon('status', criticalSortColumn, criticalSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCriticalSort('daysLate')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Giorni di Ritardo</span>
                      {getSortIcon('daysLate', criticalSortColumn, criticalSortDirection)}
                    </div>
                  </th>
                  <th><span>Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {sortedCriticalServices.map((service) => (
                  <tr key={service.id}>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.student}</td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.service}</td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{service.coach}</td>
                    <td>
                      <span className={`status-badge ${service.status === 'in_ritardo' ? 'pending' : 'inactive'}`}>
                        {service.status === 'in_ritardo' ? 'In Ritardo' : 'Bloccato'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: service.daysLate > 10 ? 'hsl(0, 70%, 50%)' : 'hsl(25, 95%, 53%)',
                        lineHeight: '1.5',
                      }}>
                        {service.daysLate}
                      </span>
                    </td>
                    <td><button className="actions-button"><MoreVertical size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Carico Coach Table */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-4)' }}>
          Carico Coach
        </h2>
        <div className="data-table">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleWorkloadSort('coach')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Coach</span>
                      {getSortIcon('coach', workloadSortColumn, workloadSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleWorkloadSort('activeServices')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Servizi Attivi</span>
                      {getSortIcon('activeServices', workloadSortColumn, workloadSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleWorkloadSort('lateServices')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Servizi in Ritardo</span>
                      {getSortIcon('lateServices', workloadSortColumn, workloadSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleWorkloadSort('utilizationRate')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Utilizzo</span>
                      {getSortIcon('utilizationRate', workloadSortColumn, workloadSortDirection)}
                    </div>
                  </th>
                  <th><span>Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {sortedCoachWorkload.map((coach) => (
                  <tr key={coach.id}>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{coach.coach}</td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{coach.activeServices}</td>
                    <td>
                      <span style={{ 
                        fontFamily: 'var(--font-inter)',
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: coach.lateServices > 0 ? 'hsl(25, 95%, 53%)' : 'var(--muted-foreground)',
                        lineHeight: '1.5',
                      }}>
                        {coach.lateServices}
                      </span>
                    </td>
                    <td>
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
                    </td>
                    <td><button className="actions-button"><MoreVertical size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attività Sottocheck Table */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: 'var(--spacing-4)' }}>
          Attività Sottocheck
        </h2>
        <div className="data-table">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCheckSort('document')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Documento</span>
                      {getSortIcon('document', checkSortColumn, checkSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCheckSort('student')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Studente</span>
                      {getSortIcon('student', checkSortColumn, checkSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCheckSort('checkStatus')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Stato Check</span>
                      {getSortIcon('checkStatus', checkSortColumn, checkSortDirection)}
                    </div>
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleCheckSort('date')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Data</span>
                      {getSortIcon('date', checkSortColumn, checkSortDirection)}
                    </div>
                  </th>
                  <th><span>Esito</span></th>
                  <th><span>Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {sortedCheckActivity.map((check) => (
                  <tr key={check.id}>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: '1.5' }}>{check.document}</td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{check.student}</td>
                    <td>
                      <span className={`status-badge ${check.checkStatus === 'completato' ? 'active' : check.checkStatus === 'in_corso' ? 'pending' : 'inactive'}`}>
                        {check.checkStatus === 'completato' ? 'Completato' : check.checkStatus === 'in_corso' ? 'In Corso' : 'Fallito'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{check.date}</td>
                    <td style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--foreground)', lineHeight: '1.5' }}>{check.outcome}</td>
                    <td><button className="actions-button"><MoreVertical size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}