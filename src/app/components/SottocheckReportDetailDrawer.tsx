interface ReportSource {
  id: string;
  url: string;
  title: string;
  introduction: string;
  matchedWords: number;
  identicalWords: number;
  similarWords: number;
  paraphrasedWords: number;
  totalWords: number;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  color: 'var(--muted-foreground)',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-base)',
  color: 'var(--foreground)',
  lineHeight: '1.5',
};

const valueBoldStyle: React.CSSProperties = {
  ...valueStyle,
  fontWeight: 'var(--font-weight-medium)' as any,
};

import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { StatusBadge, type StatusType } from '@/app/components/StatusBadge';




export function SottocheckReportDetailDrawer({
  selectedJob,
  onClose,
  onOpenFullReport,
  onDownloadReport,
  getLavorazioneLabel,
  formatDateTimeIT,
  formatNumber,
  statusMap,
  statusLabels,
}: SottocheckReportDetailDrawerProps) {
  if (!selectedJob) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px',
        backgroundColor: 'var(--background)', zIndex: 50, boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: '0.25rem', lineHeight: '1.5' }}>
              Dettaglio Check Admin
            </h2>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: 0 }}>
              {selectedJob.id} - Check Plagio/AI
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
              Informazioni principali
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={labelStyle}>Studente</div>
                <div style={valueBoldStyle}>{selectedJob.student} ({selectedJob.student_id})</div>
              </div>
              <div>
                <div style={labelStyle}>Admin</div>
                <div style={valueBoldStyle}>{selectedJob.admin_name}</div>
              </div>
              <div>
                <div style={labelStyle}>Stato</div>
                <StatusBadge status={statusMap[selectedJob.status]} label={statusLabels[selectedJob.status]} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={labelStyle}>Lavorazione (opzionale)</div>
                <div style={valueStyle}>{getLavorazioneLabel(selectedJob.service_id)}</div>
              </div>
              {selectedJob.document_name && (
                <div>
                  <div style={labelStyle}>Documento</div>
                  <div style={valueBoldStyle}>{selectedJob.document_name}</div>
                </div>
              )}
              <div>
                <div style={labelStyle}>Data avvio</div>
                <div style={valueStyle}>{selectedJob.startedAt}</div>
              </div>
              {selectedJob.completedAt && (
                <div>
                  <div style={labelStyle}>Data completamento</div>
                  <div style={valueStyle}>{selectedJob.completedAt}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
              Dati documento & crediti
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={labelStyle}>Parole analizzate</div>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                  {selectedJob.report ? formatNumber(selectedJob.report.totalWords) : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={labelStyle}>Parole escluse</div>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                  {selectedJob.report ? formatNumber(selectedJob.report.totalExcluded) : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={labelStyle}>Crediti usati/attesi</div>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: '1.5' }}>
                  {selectedJob.report ? `${selectedJob.report.credits} / ${selectedJob.report.expectedCredits}` : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={labelStyle}>Lingua rilevata</div>
                <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', textTransform: 'uppercase', lineHeight: '1.5' }}>
                  {selectedJob.report?.detectedLanguage || '-'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
              Dati ottenuti dal payload API del report Sottocheck.
            </div>
          </div>

          {selectedJob.report && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.5' }}>
                Report
              </h3>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={labelStyle}>Scan ID</div>
                    <div style={{ ...valueBoldStyle, fontSize: '12px' }}>{selectedJob.report.scanId}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={labelStyle}>Punteggio aggregato</div>
                      <div style={{ ...valueBoldStyle, color: 'var(--destructive)' }}>
                        {selectedJob.report.score.aggregatedScore.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Parole identiche</div>
                      <div style={valueBoldStyle}>{formatNumber(selectedJob.report.score.identicalWords)}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Modifiche minori</div>
                      <div style={valueBoldStyle}>{formatNumber(selectedJob.report.score.minorChangedWords)}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Significato correlato</div>
                      <div style={valueBoldStyle}>{formatNumber(selectedJob.report.score.relatedMeaningWords)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', fontFamily: 'var(--font-inter)', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                    Creato il {formatDateTimeIT(selectedJob.report.creationTime)}
                  </div>
                </div>


                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
                  onClick={onOpenFullReport}
                >
                  <ExternalLink size={16} />
                  Vedi report completo
                </button>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onDownloadReport}>
                  <Download size={16} />
                  Scarica report PDF
                </button>
              </div>
            </div>
          )}

          {selectedJob.created_by && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Creato da</div>
                  <div style={valueStyle}>{selectedJob.created_by}</div>
                </div>
                <div>
                  <div style={labelStyle}>Creato il</div>
                  <div style={valueStyle}>{formatDateTimeIT(selectedJob.created_at)}</div>
                </div>
                <div>
                  <div style={labelStyle}>Aggiornato da</div>
                  <div style={valueStyle}>{selectedJob.updated_by}</div>
                </div>
                <div>
                  <div style={labelStyle}>Aggiornato il</div>
                  <div style={valueStyle}>{formatDateTimeIT(selectedJob.updated_at)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
