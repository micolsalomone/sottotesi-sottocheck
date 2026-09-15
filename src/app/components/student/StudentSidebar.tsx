import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, ClipboardCheck, History, Archive, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStudentViewTimelinePath } from '@/app/utils/studentView';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/student-view',
  },
  {
    label: 'Il mio percorso',
    icon: <Users size={20} />,
    path: getStudentViewTimelinePath(),
  },
  {
    label: 'TesiCheck',
    icon: <ClipboardCheck size={20} />,
    path: '/student-view/sottocheck',
  },
  {
    label: 'Storico',
    icon: <History size={20} />,
    path: '/student-view/history',
  },
  {
    label: 'Archivio',
    icon: <Archive size={20} />,
    path: '/student-view/archivio',
  },
];

interface StudentSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function StudentSidebar({ collapsed, onToggleCollapse }: StudentSidebarProps) {
  const location = useLocation();

  function isActive(path: string) {
    if (path === '/student-view') return location.pathname === '/student-view';
    return location.pathname.startsWith(path);
  }

  return (
    <>
      <button
        className={`sidebar-collapse-toggle ${collapsed ? 'collapsed' : 'expanded'}`}
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Espandi menu' : 'Comprimi menu'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <nav style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
            paddingTop: '8px',
          }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-item ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Account-oriented link — bottom slot, separated from main nav
              (same pattern as the Admin sidebar settings section). */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px', flexShrink: 0 }}>
            <Link
              to="/student-view/profilo"
              className={`sidebar-item ${isActive('/student-view/profilo') ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
              title={collapsed ? 'Profilo' : undefined}
            >
              <span className="sidebar-item-icon"><User size={20} /></span>
              {!collapsed && <span className="sidebar-item-label">Profilo</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
