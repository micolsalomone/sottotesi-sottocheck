import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { CoachSidebar } from './CoachSidebar';
import { CoachHeader } from './CoachHeader';

const SIDEBAR_STORAGE_KEY = 'coach-sidebar-collapsed';

export function CoachLayout() {
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

  return (
    <div className="admin-layout">
      <CoachHeader sidebarCollapsed={sidebarCollapsed} />

      <div className="admin-layout-body">
        <CoachSidebar
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
