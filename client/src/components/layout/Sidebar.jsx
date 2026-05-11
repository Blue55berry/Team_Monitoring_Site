import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, Building2, CalendarCheck, UserCircle, Briefcase, Bell, MessageSquare, Settings, LogOut, Bot, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  // General
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'team_manager', 'manager', 'team_leader', 'leader', 'hr', 'account', 'accounts', 'employee'] },
  
  // HR Panel
  { path: '/employees', icon: Users, label: 'Hiring & Employees', roles: ['admin', 'hr'] },
  { path: '/departments', icon: Building2, label: 'Departments', roles: ['admin', 'hr'] },
  
  // Account Panel
  { 
    path: '/payroll', 
    icon: Calculator, 
    label: 'Accounts Panel', 
    roles: ['account', 'accounts']
  },
  
  // Team Manager & Leader Panel
  { 
    path: '/projects', 
    icon: FolderKanban, 
    label: 'Team & Projects', 
    roles: ['admin', 'team_manager', 'manager', 'team_leader', 'leader'],
    subItems: [
      { path: '/projects', label: 'All Projects' },
      { path: '/projects?status=active', label: 'Current Projects' },
      { path: '/projects?status=completed', label: 'Past Completed' },
      { path: '/projects?status=planning', label: 'Upcoming Projects' }
    ]
  },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['admin', 'team_manager', 'manager', 'team_leader', 'leader', 'employee'] },
  { path: '/clients', icon: Briefcase, label: 'Clients', roles: ['admin', 'team_manager', 'manager'] },
  
  // Common / Employee
  { path: '/attendance', icon: CalendarCheck, label: 'Attendance', roles: ['admin', 'hr', 'team_manager', 'manager', 'team_leader', 'leader', 'account', 'accounts', 'employee'] },
  { path: '/leaves', icon: CalendarCheck, label: 'Leaves', roles: ['admin', 'hr', 'team_manager', 'manager', 'team_leader', 'leader', 'account', 'accounts', 'employee'] },
  { path: '/ai-assistant', icon: Bot, label: 'AI Assistant', roles: ['admin', 'hr', 'team_manager', 'manager', 'team_leader', 'leader', 'account', 'accounts'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role?.toLowerCase() || 'employee'));

  return (
    <aside className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out
      ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">WI</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-sm text-surface-900 dark:text-white leading-tight">WorkForce</h1>
            <p className="text-[10px] text-surface-400 font-medium">Intelligence Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNav.map(item => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isPathActive = location.pathname.startsWith(item.path);
          const isExpanded = expandedMenu === item.label || (isPathActive && expandedMenu !== false);

          const handleToggle = (e) => {
            if (hasSubItems) {
              e.preventDefault();
              setExpandedMenu(isExpanded ? false : item.label);
            }
          };

          if (hasSubItems) {
            return (
              <div key={item.path} className="flex flex-col">
                <div 
                  onClick={handleToggle}
                  className={`sidebar-link cursor-pointer ${isPathActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </>
                  )}
                </div>
                {!collapsed && isExpanded && (
                  <div className="ml-6 mt-1 mb-1 flex flex-col space-y-1 border-l-2 border-surface-100 dark:border-surface-800 pl-2">
                    {item.subItems.map(sub => {
                       const isActive = location.pathname + location.search === sub.path || (location.pathname === sub.path && location.search === '' && sub.path.indexOf('?') === -1);
                       return (
                         <NavLink
                           key={sub.path}
                           to={sub.path}
                           className={`px-3 py-2 text-sm rounded-lg transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800/50'}`}
                         >
                           {sub.label}
                         </NavLink>
                       );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-surface-200 dark:border-surface-800 p-3 space-y-2">
        <button
          onClick={logout}
          className={`sidebar-link w-full text-danger hover:bg-red-50 dark:hover:bg-red-900/20 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
