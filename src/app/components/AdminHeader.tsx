import { Link } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';

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
          <UserTopbarMenu
            displayName="Francesca"
            profilePath="/impostazioni/account"
            logoutPath="/"
          />
        </div>
      </div>
    </header>
  );
}
