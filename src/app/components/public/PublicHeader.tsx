import { Link, useNavigate } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';
import {
  clearAccountSession,
  getAccountFirstName,
  getAccountSession,
} from '@/app/data/tesicheckAccountSession';

interface PublicHeaderProps {
  sidebarCollapsed?: boolean;
}

export function PublicHeader({ sidebarCollapsed }: PublicHeaderProps) {
  const navigate = useNavigate();
  const session = getAccountSession();
  const accountLabel = getAccountFirstName(session) || session?.email || 'Cliente TesiCheck';

  function handleLogout() {
    // Only the standalone account session is authentication state — see
    // `clearAccountSession`. Route to the public landing, never Admin `/`.
    clearAccountSession();
    navigate('/public', { replace: true });
  }

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
          <span className="admin-username">{session?.email ?? 'Utente TesiCheck'}</span>
          <UserTopbarMenu
            displayName={accountLabel}
            profilePath="/public-view/profilo"
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
