import * as React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LavorazioniProvider } from './data/LavorazioniContext';

// Sottotesi Admin Dashboard v2.0 — clean render
function App() {
  return (
    <ErrorBoundary>
      {/*
        Single CRM data instance for the whole SPA session: Admin and the
        authenticated public shell (/public-view) consume the same
        LavorazioniProvider, so a Pipeline created from /public-view/profilo is
        visible in Admin Pipelines without a full reload. In-memory only —
        a full browser reload restores the seeded state.
      */}
      <LavorazioniProvider>
        <RouterProvider router={router} />
      </LavorazioniProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            borderRadius: 'var(--radius)',
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default App;