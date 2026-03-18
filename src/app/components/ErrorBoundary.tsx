import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1.5rem',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'var(--font-inter)'
        }}>
          <h1 style={{
            fontSize: 'var(--text-h1)',
            fontFamily: 'var(--font-alegreya)',
            color: 'var(--destructive-foreground)',
            marginBottom: '1rem'
          }}>
            Errore nell'applicazione
          </h1>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            marginBottom: '1rem'
          }}>
            Si è verificato un errore imprevisto. Ricarica la pagina per continuare.
          </p>
          {this.state.error && (
            <pre style={{
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              overflow: 'auto',
              color: 'var(--foreground)'
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '12px 24px',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            Ricarica pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}