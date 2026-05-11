import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Sun, Moon, Search, Menu } from 'lucide-react';
import { useQuery } from "@apollo/client/react";
import { GET_UNREAD_COUNT } from '../../graphql/operations';
import { useState } from 'react';

const Header = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { data: notifData } = useQuery(GET_UNREAD_COUNT, { pollInterval: 30000 });
  const [showSearch, setShowSearch] = useState(false);

  const unreadCount = notifData?.unreadNotificationCount || 0;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-6">
      {/* Left: Title */}
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">{title || 'Dashboard'}</h2>
        {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={`relative transition-all duration-300 ${showSearch ? 'w-64' : 'w-9'}`}>
          {showSearch && (
            <input
              type="text"
              placeholder="Search anything..."
              className="input-field pr-9 py-2 text-sm animate-fade-in"
              autoFocus
              onBlur={() => setShowSearch(false)}
            />
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`${showSearch ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors`}
          >
            <Search size={18} />
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 relative transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fade-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-surface-200 dark:border-surface-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-surface-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

