import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';
import {
  clearStandaloneSession,
  getAccountFirstName,
  getAccountSession,
  subscribeToAccountSession,
} from '@/app/data/tesicheckAccountSession';

interface PublicHeaderProps {
  sidebarCollapsed?: boolean;
}

export function PublicHeader({ sidebarCollapsed }: PublicHeaderProps) {
  const navigate = useNavigate();

  // `PublicHeader` is mounted once by the persistent `PublicLayout` shell and
  // is never remounted by route navigation — a plain `getAccountSession()`
  // call here would only ever reflect the value from this component's OWN
  // last render, not a session write made from a sibling route (e.g. the
  // Account page's `Modifica email`). Subscribing re-renders the topbar the
  // moment the session actually changes, without a page refresh.
  const [session, setSession] = useState(() => getAccountSession());
  useEffect(() => subscribeToAccountSession(() => setSession(getAccountSession())), []);

  const accountLabel = getAccountFirstName(session) || session?.email || 'Cliente TesiCheck';

  function handleLogout() {
    // Explicit logout ends both transient domains: the standalone account session
    // and any in-progress checkout / pre-check purchase (`clearStandaloneSession`).
    // Persistent checks, History, the registered-accounts registry and CRM data
    // are left intact. Route to the public landing, never Admin `/`.
    clearStandaloneSession();
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
            accountPath="/public-view/account"
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
