import React from 'react';
import { Settings } from 'lucide-react';

export function ImpostazioniSottocheckPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Impostazioni Sottocheck</h1>
        <p className="page-subtitle">Configurazione del sistema Sottocheck</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
          marginBottom: '1.5rem',
        }}>
          <Settings size={28} />
        </div>
        <h3 style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'var(--text-h3)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--foreground)',
          marginBottom: '0.5rem',
          lineHeight: '1.5',
        }}>
          Pagina in costruzione
        </h3>
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          maxWidth: '400px',
          lineHeight: '1.5',
          margin: 0,
        }}>
          Le impostazioni del sistema Sottocheck saranno disponibili qui. Parametri di controllo, soglie e configurazioni globali.
        </p>
      </div>
    </div>
  );
}