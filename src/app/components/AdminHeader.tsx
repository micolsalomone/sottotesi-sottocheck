import React from 'react';
import { Link } from 'react-router';
import { ChevronDown } from 'lucide-react';
import SottotesiLogodefDefault from '../../imports/SottotesiLogodefDefault';

interface AdminHeaderProps {
  sidebarCollapsed?: boolean;
}

export function AdminHeader({ sidebarCollapsed }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      {/* Logo area — fixed left, independent from sidebar state */}
      <div
        className="admin-header-logo"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-expanded-width)',
          transition: 'width 0.25s ease',
        }}
      >
        <Link to="/" className="admin-logo">
          {!sidebarCollapsed && <SottotesiLogodefDefault />}
        </Link>
      </div>

      {/* Right section — user menu, stretches to fill */}
      <div className="admin-header-right">
        <div className="admin-user">
          <span className="admin-username">admin</span>
          <button className="admin-badge">
            Francesca
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
