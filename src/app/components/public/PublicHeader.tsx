import { Link } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';

interface PublicHeaderProps {
  sidebarCollapsed?: boolean;
}

export function PublicHeader({ sidebarCollapsed }: PublicHeaderProps) {
  return (
    <header className="admin-header">
      <div
        className="admin-header-logo"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-expanded-width)',
          transition: 'width 0.25s ease',
        }}
      >
        <Link to="/public-view" className="admin-logo">
          {!sidebarCollapsed && <SottotesiLogodefDefault />}
        </Link>
      </div>

      <div className="admin-header-right">
        <div className="admin-user">
          <span className="admin-username">utente public</span>
          <UserTopbarMenu
            displayName="Cliente Sottocheck"
            profilePath="/public-view/profilo"
            logoutPath="/"
          />
        </div>
      </div>
    </header>
  );
}