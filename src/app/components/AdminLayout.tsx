import * as React from 'react';
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { LavorazioniProvider } from '../data/LavorazioniContext';
import { AreeTematicheProvider } from '../data/AreeTematicheContext';

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';

export function AdminLayout() {
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

  const toggleCollapse = () => setSidebarCollapsed(prev => !prev);

  return (
    <LavorazioniProvider>
    <AreeTematicheProvider>
    <div className="admin-layout">
      <AdminHeader sidebarCollapsed={sidebarCollapsed} />

      <div className="admin-layout-body">
        <AdminSidebar
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
    </AreeTematicheProvider>
    </LavorazioniProvider>
  );
}
