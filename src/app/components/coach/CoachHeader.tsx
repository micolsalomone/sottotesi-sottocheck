import { Link } from 'react-router';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';
import { useCoachViewProfile } from './CoachViewProfileContext';

interface CoachHeaderProps {
  sidebarCollapsed?: boolean;
}

export function CoachHeader({ sidebarCollapsed }: CoachHeaderProps) {
  // Coach-view-local prototype identity (CoachViewProfileContext, scoped to
  // CoachLayout — not a shared CRM) — reacts to Profile/Account updates
  // immediately within this view, no more hardcoded display string. See
  // coachView.ts and CoachViewProfileContext.tsx for what this is and isn't.
  const { profile } = useCoachViewProfile();

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
        <Link to="/coach-view" className="admin-logo">
          {!sidebarCollapsed && <SottotesiLogodefDefault />}
        </Link>
      </div>

      {/* Right section — user menu, stretches to fill */}
      <div className="admin-header-right">
        <div className="admin-user">
          <span className="admin-username">coach</span>
          <UserTopbarMenu
            displayName={profile.fullName}
            accountPath="/coach-view/account"
            logoutPath="/"
          />
        </div>
      </div>
    </header>
  );
}



