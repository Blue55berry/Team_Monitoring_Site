import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Sun, Moon, Search, Menu } from 'lucide-react';
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_UNREAD_COUNT, GET_NOTIFICATIONS, MARK_NOTIFICATION_READ } from '../../graphql/operations';
import { useState, useRef, useEffect } from 'react';

const Header = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { data: notifData, refetch: refetchUnread } = useQuery(GET_UNREAD_COUNT, { pollInterval: 30000 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  
  const { data: notificationsList } = useQuery(GET_NOTIFICATIONS, { skip: !showNotifs, fetchPolicy: 'network-only' });
  const [markRead] = useMutation(MARK_NOTIFICATION_READ);

  const unreadCount = notifData?.unreadNotificationCount || 0;

  // Close dropdowns on outside click (simplified)
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.notif-container')) setShowNotifs(false);
      if (!e.target.closest('.search-container') && !searchQuery) setShowSearch(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [searchQuery]);
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
        <div className={`search-container relative transition-all duration-300 ${showSearch || searchQuery ? 'w-64' : 'w-9'}`}>
          {(showSearch || searchQuery) && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearch(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Search tasks, people..."
              className="input-field pr-9 py-2 text-sm animate-fade-in"
              autoFocus={showSearch && !searchQuery}
            />
          )}
          <button
            onClick={() => {
              if (showSearch && !searchQuery) setShowSearch(false);
              else setShowSearch(true);
            }}
            className={`${showSearch || searchQuery ? 'absolute right-2 top-1/2 -translate-y-1/2' : ''} p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors z-10`}
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
        <div className="notif-container relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 relative transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fade-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-surface-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-surface-200 dark:border-surface-700 overflow-hidden z-50 animate-slide-up">
              <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/50">
                <h3 className="font-bold text-surface-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && <span className="text-[10px] uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 px-2 py-1 rounded-md font-bold">{unreadCount} New</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notificationsList?.notifications?.length > 0 ? (
                  notificationsList.notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={async () => {
                        if (!notif.isRead) {
                          await markRead({ variables: { id: notif.id } });
                          refetchUnread();
                        }
                      }}
                      className={`p-4 border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer ${notif.isRead ? 'opacity-60' : 'bg-primary-50/30 dark:bg-primary-900/10'}`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />}
                        <div>
                          <p className={`text-sm ${notif.isRead ? 'font-medium' : 'font-bold'} text-surface-900 dark:text-white mb-1 leading-snug`}>{notif.title}</p>
                          <p className="text-xs text-surface-500 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] font-medium text-surface-400 mt-2 uppercase tracking-wider">{new Date(parseInt(notif.createdAt) || notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-surface-400">
                    <Bell size={28} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

