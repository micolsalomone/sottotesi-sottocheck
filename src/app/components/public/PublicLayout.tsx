import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { PublicHeader } from './PublicHeader';
import { PublicSidebar } from './PublicSidebar';
import { getAccountSession } from '@/app/data/tesicheckAccountSession';

const SIDEBAR_STORAGE_KEY = 'public-sidebar-collapsed';

export function PublicLayout() {
  // Prototype guard: the authenticated standalone workspace needs a standalone
  // account session. Without one, go to the landing instead of rendering an
  // apparently-authenticated shell. Scoped to `/public-view` only — Student,
  // Coach and Admin shells are untouched.
  const hasAccountSession = getAccountSession() != null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // localStorage not available
    }
  }, [sidebarCollapsed]);

  const toggleCollapse = () => setSidebarCollapsed((prev) => !prev);

  if (!hasAccountSession) {
    return <Navigate to="/public" replace />;
  }

  return (
    <div className="admin-layout">
      <PublicHeader sidebarCollapsed={sidebarCollapsed} />

      <div className="admin-layout-body">
        <PublicSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}