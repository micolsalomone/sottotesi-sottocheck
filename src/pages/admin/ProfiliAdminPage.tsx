import React, { useState } from 'react';
import { ShieldCheck, Users, Mail, Pencil, Check, X } from 'lucide-react';
import { ADMIN_PROFILES, type AdminProfile } from '../../app/data/LavorazioniContext';
import { toast } from 'sonner';

const CURRENT_ADMIN = 'Francesca';

export function ProfiliAdminPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>(ADMIN_PROFILES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const startEdit = (p: AdminProfile) => {
    setEditingId(p.id);
    setEditRole(p.role);
    setEditEmail(p.email);
  };

  const saveEdit = (id: string) => {
    setProfiles(prev => prev.map(p =>
      p.id === id ? { ...p, role: editRole, email: editEmail } : p
    ));
    setEditingId(null);
    toast.success('Profilo aggiornato');
  };

  const cancelEdit = () => setEditingId(null);

  const activeCount = profiles.length;
  const referentiCount = profiles.filter(p => p.role === 'Referente operativa').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profili Admin</h1>
        <p className="page-subtitle">Gestione utenti amministratori e permessi</p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: '1 1 140px',
          minWidth: '140px',
          padding: '0.75rem 1rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Profili totali
          </div>
          <div style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.2',
          }}>
            {activeCount}
          </div>
        </div>
        <div style={{
          flex: '1 1 140px',
          minWidth: '140px',
          padding: '0.75rem 1rem',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
            lineHeight: '1.5',
          }}>
            Referenti operativi
          </div>
          <div style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: '1.2',
          }}>
            {referentiCount}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="data-table" style={{ display: 'block' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '600px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ position: 'relative', width: '100px' }}>
                  <span>ID</span>
                </th>
                <th style={{ position: 'relative', width: '160px' }}>
                  <span>Nome</span>
                </th>
                <th style={{ position: 'relative', width: '200px' }}>
                  <span>Ruolo</span>
                </th>
                <th style={{ position: 'relative', width: '250px' }}>
                  <span>Email</span>
                </th>
                <th style={{
                  width: '80px',
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'var(--muted)',
                  zIndex: 11,
                  boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  userSelect: 'none',
                }}>
                  <span>Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      color: 'var(--muted-foreground)',
                      lineHeight: '1.5',
                    }}>
                      {p.id}
                    </td>
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: p.role === 'Amministratore' ? 'var(--primary)' : 'var(--muted)',
                          color: p.role === 'Amministratore' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                          flexShrink: 0,
                        }}>
                          {p.role === 'Amministratore' ? <ShieldCheck size={14} /> : <Users size={14} />}
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                        }}>
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="select-dropdown"
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.5rem',
                            fontSize: 'var(--text-label)',
                          }}
                        >
                          <option value="Amministratore">Amministratore</option>
                          <option value="Referente operativa">Referente operativa</option>
                          <option value="Supervisore">Supervisore</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.125rem 0.5rem',
                          borderRadius: 'var(--radius-badge)',
                          background: 'var(--muted)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--foreground)',
                          lineHeight: '1.5',
                          whiteSpace: 'nowrap',
                        }}>
                          {p.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="search-input"
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.5rem',
                            fontSize: 'var(--text-label)',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(p.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontFamily: 'var(--font-inter)',
                          fontSize: 'var(--text-label)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '1.5',
                        }}>
                          <Mail size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                          {p.email}
                        </div>
                      )}
                    </td>
                    <td style={{
                      position: 'sticky',
                      right: 0,
                      backgroundColor: 'var(--background)',
                      zIndex: 10,
                      boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.05)',
                      textAlign: 'center',
                    }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => saveEdit(p.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Salva"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              color: 'var(--muted-foreground)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Annulla"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            color: 'var(--muted-foreground)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                          }}
                          title="Modifica"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div style={{ display: 'none' }} className="mobile-cards">
        {profiles.map(p => (
          <div
            key={p.id}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: p.role === 'Amministratore' ? 'var(--primary)' : 'var(--muted)',
                  color: p.role === 'Amministratore' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}>
                  {p.role === 'Amministratore' ? <ShieldCheck size={16} /> : <Users size={16} />}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                    lineHeight: '1.5',
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                  }}>
                    {p.email}
                  </div>
                </div>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-badge)',
                background: 'var(--muted)',
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
                lineHeight: '1.5',
              }}>
                {p.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .data-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
