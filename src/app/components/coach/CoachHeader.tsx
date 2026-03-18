import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import SottotesiLogodefDefault from '../../../imports/SottotesiLogodefDefault';

interface CoachHeaderProps {
  sidebarCollapsed?: boolean;
}

export function CoachHeader({ sidebarCollapsed }: CoachHeaderProps) {
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
           <button className="admin-badge">
             Teresa P.
             <ChevronDown size={14} />
           </button>
         </div>
       </div>
      </header>
  );
}



