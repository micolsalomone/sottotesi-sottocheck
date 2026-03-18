import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';

const SIDEBAR_STORAGE_KEY = 'student-sidebar-collapsed';

export function StudentLayout() {
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
      <StudentHeader sidebarCollapsed={sidebarCollapsed} />

      <div className="admin-layout-body">
        <StudentSidebar
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
