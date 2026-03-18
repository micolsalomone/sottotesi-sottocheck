import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Users, ClipboardCheck, Archive, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/coach-view',
  },
  {
    label: 'Studenti',
    icon: <Users size={20} />,
    path: '/coach-view/studenti',
  },
  {
    label: 'Sottocheck',
    icon: <ClipboardCheck size={20} />,
    path: '/coach-view/sottocheck',
  },
  {
    label: 'Archivio',
    icon: <Archive size={20} />,
    path: '/coach-view/archivio',
  },
];

interface CoachSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function CoachSidebar({ collapsed, onToggleCollapse }: CoachSidebarProps) {
  const location = useLocation();

  function isActive(path: string) {
    if (path === '/coach-view') return location.pathname === '/coach-view';
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
        </div>
      </aside>
    </>
  );
}
