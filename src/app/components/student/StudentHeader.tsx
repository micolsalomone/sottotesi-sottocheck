import { Link } from 'react-router';
import { getStudentViewStudent } from '@/app/utils/studentView';
import SottotesiLogodefDefault from '@/imports/SottotesiLogodefDefault';
import { UserTopbarMenu } from '@/app/components/UserTopbarMenu';

interface StudentHeaderProps {
  sidebarCollapsed?: boolean;
}

export function StudentHeader({ sidebarCollapsed }: StudentHeaderProps) {
  const currentStudent = getStudentViewStudent();

  return (
    <header className="admin-header">
      <div
        className="admin-header-logo"
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-expanded-width)',
          transition: 'width 0.25s ease',
        }}
      >
        <Link to="/student-view" className="admin-logo">
          {!sidebarCollapsed && <SottotesiLogodefDefault />}
        </Link>
      </div>

      <div className="admin-header-right">
        <div className="admin-user">
          <span className="admin-username">studente</span>
          <UserTopbarMenu
            displayName={currentStudent.name}
            profilePath="/student-view/profilo"
            logoutPath="/"
          />
        </div>
      </div>
    </header>
  );
}
