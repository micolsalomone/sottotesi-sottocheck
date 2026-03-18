import * as React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Sottotesi Admin Dashboard v2.0 — clean render
function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
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