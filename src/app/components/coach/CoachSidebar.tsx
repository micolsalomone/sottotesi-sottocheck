import { useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Users, ClipboardCheck, Archive } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/coach-view',
  },
  {
    id: 'studenti',
    label: 'Studenti',
    icon: <Users className="w-5 h-5" />,
    path: '/coach-view/studenti',
  },
  {
    id: 'sottocheck',
    label: 'Sottocheck',
    icon: <ClipboardCheck className="w-5 h-5" />,
    path: '/coach-view/sottocheck',
  },
  {
    id: 'archivio',
    label: 'Archivio',
    icon: <Archive className="w-5 h-5" />,
    path: '/coach-view/archivio',
  },
];

export function CoachSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    if (path === '/coach-view') return location.pathname === '/coach-view';
    return location.pathname.startsWith(path);
  }

  return (
    <aside
      className="w-[260px] min-h-full border-r border-[var(--border)] bg-[var(--background)] flex flex-col"
    >
      <nav className="flex flex-col gap-[4px] p-[8px] pt-[12px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-[12px] px-[16px] h-[44px] w-full transition-colors ${
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
              style={{
                borderRadius: 'calc(var(--radius) - 2px)',
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-medium)',
                textAlign: 'left',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
