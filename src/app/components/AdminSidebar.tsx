import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  CheckSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Activity,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
}

interface NavSection {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const primaryLinks = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Pipelines', path: '/pipelines', icon: <TrendingUp size={20} /> },
  { label: 'Lavorazioni', path: '/lavorazioni', icon: <Briefcase size={20} /> },
];

const extraSections: NavSection[] = [
  {
    label: 'Coaching',
    icon: <GraduationCap size={20} />,
    items: [
      { label: 'Studenti', path: '/studenti' },
      { label: 'Coach', path: '/coach' },
      { label: 'Documenti', path: '/documenti' },
      { label: 'Timelines', path: '/coaching/timeline' },
      { label: 'Ticket', path: '/coaching/ticket' },
      { label: 'Sottocheck Coach', path: '/sottocheck/job' },
      { label: 'Aree tematiche', path: '/aree-tematiche' },
    ],
  },
  {
    label: 'Sottocheck App',
    icon: <CheckSquare size={20} />,
    items: [
      { label: 'Check Sottocheck', path: '/sottocheck/check' },
      { label: 'Lavorazioni sottocheck', path: '/sottocheck/lavorazioni' },
      { label: 'Impostazioni sottocheck', path: '/sottocheck/impostazioni' },
      { label: 'Pagamenti e fatture', path: '/sottocheck/pagamenti-fatture' },
    ],
  },
  {
    label: 'Sistema',
    icon: <Activity size={20} />,
    items: [
      { label: 'Log eventi', path: '/sistema/eventi' },
      { label: 'Catalogo servizi', path: '/servizi/catalogo' },
      { label: 'KPI & Monitoraggio', path: '/sistema/kpi' },
    ],
  },
];

const settingsSection: NavSection = {
  label: 'Impostazioni',
  icon: <Settings size={18} />,
  items: [
    { label: 'Profili Admin', path: '/impostazioni/profili' },
    { label: 'Info account', path: '/impostazioni/account' },
  ],
};

export function AdminSidebar({ collapsed, onToggleCollapse }: AdminSidebarProps) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSection = (sectionLabel: string) => {
    if (collapsed) return;
    setOpenSections(prev => 
      prev.includes(sectionLabel)
        ? prev.filter(s => s !== sectionLabel)
        : [...prev, sectionLabel]
    );
  };

  const isSectionActive = (items: NavItem[]) => {
    return items.some(item => location.pathname === item.path);
  };

  const handleSectionClick = (sectionLabel: string) => {
    if (collapsed) {
      onToggleCollapse();
      setOpenSections(prev => 
        prev.includes(sectionLabel) ? prev : [...prev, sectionLabel]
      );
    } else {
      toggleSection(sectionLabel);
    }
  };

  return (
    <>
      {/* Collapse toggle button - outside sidebar to avoid overflow clipping */}
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
          {/* Main navigation */}
          <nav style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
            paddingTop: '8px',
          }}>
            {/* Primary links */}
            {primaryLinks.map((link) => {
              const isActive = location.pathname === link.path;
              
              return (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    className={`sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                    title={collapsed ? link.label : undefined}
                  >
                    <span className="sidebar-item-icon">{link.icon}</span>
                    {!collapsed && <span className="sidebar-item-label">{link.label}</span>}
                  </Link>
                  {/* If Utenti is active and has sub-items, we could show them here, 
                      but guidelines say "piatta". I'll skip sub-items for now 
                      or just make them individual links. 
                  */}
                </div>
              );
            })}

            {/* Separator */}
            <div style={{
              height: '1px',
              backgroundColor: 'var(--border)',
              margin: collapsed ? '0.5rem 0.25rem' : '0.5rem 0.75rem',
            }} />

            {/* Collapsible sections */}
            {extraSections.map((section) => {
              const sectionIsOpen = openSections.includes(section.label) && !collapsed;
              const isActive = isSectionActive(section.items);
              
              return (
                <div key={section.label} className="sidebar-section">
                  <button 
                    className={`sidebar-section-button ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                    onClick={() => handleSectionClick(section.label)}
                    title={collapsed ? section.label : undefined}
                  >
                    <div className="sidebar-section-left">
                      {section.icon}
                      {!collapsed && <span>{section.label}</span>}
                    </div>
                    {!collapsed && (
                      sectionIsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </button>
                  
                  {sectionIsOpen && !collapsed && (
                    <div className="sidebar-submenu">
                      {section.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`sidebar-submenu-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Settings section - bottom */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '8px',
            flexShrink: 0,
          }}>
            <div className="sidebar-section" style={{ marginBottom: 0 }}>
              <button
                className={`sidebar-section-button ${isSectionActive(settingsSection.items) ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                onClick={() => {
                  if (collapsed) {
                    onToggleCollapse();
                    setSettingsOpen(true);
                  } else {
                    setSettingsOpen(prev => !prev);
                  }
                }}
                title={collapsed ? settingsSection.label : undefined}
                style={{
                  padding: collapsed ? '0.75rem' : '0.5rem 1rem',
                  fontSize: 'var(--text-label)',
                  color: 'var(--muted-foreground)',
                  justifyContent: collapsed ? 'center' : 'space-between',
                }}
              >
                <div className="sidebar-section-left" style={{ gap: '0.5rem' }}>
                  {settingsSection.icon}
                  {!collapsed && (
                    <span style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 'var(--text-label)',
                      fontWeight: 'var(--font-weight-medium)',
                      lineHeight: '1.5',
                    }}>
                      {settingsSection.label}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  settingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>

              {settingsOpen && !collapsed && (
                <div className="sidebar-submenu" style={{ paddingLeft: '2.25rem' }}>
                  {settingsSection.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-submenu-item ${location.pathname === item.path ? 'active' : ''}`}
                      style={{
                        fontSize: 'var(--text-label)',
                        padding: '0.5rem 1rem',
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}