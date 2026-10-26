import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBell, FiSun, FiMoon, FiSearch, FiMenu, FiLogOut,
  FiUser, FiShield, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import Breadcrumbs from './Breadcrumbs';
import NotificationDrawer from './NotificationDrawer';
import GlobalSearch from './GlobalSearch';
import Badge from '../common/Badge';

const TopNavbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { newNotification } = useSocket();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Global Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update unread count indicator when new notification arrives
  useEffect(() => {
    if (newNotification && !newNotification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [newNotification]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass-panel border-b border-white/20 dark:border-gray-800/50 px-4 sm:px-6 flex items-center justify-between transition-colors duration-300">
        {/* LEFT: MOBILE TOGGLE & BREADCRUMBS */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Open mobile navigation sidebar"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <FiMenu size={20} aria-hidden="true" />
          </button>

          <div className="hidden sm:block min-w-0">
            <Breadcrumbs />
          </div>

          <div className="sm:hidden font-extrabold text-base bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent truncate">
            🎓 CareerNest
          </div>
        </div>

        {/* RIGHT: SEARCH, NOTIFICATIONS, THEME, PROFILE */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GLOBAL SEARCH TRIGGER */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Quick destination search (Ctrl+K)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-gray-900/40 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <FiSearch size={14} aria-hidden="true" />
            <span className="hidden md:inline font-medium">QuickNav</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* NOTIFICATION BELL */}
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(true);
              setUnreadCount(0); // clear visual badge on open
            }}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            className="relative p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <FiBell size={16} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
            )}
          </button>

          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            {theme === 'dark' ? (
              <FiSun className="text-amber-400" size={16} aria-hidden="true" />
            ) : (
              <FiMoon className="text-indigo-500" size={16} aria-hidden="true" />
            )}
          </button>

          {/* USER PROFILE DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="menu"
              aria-label="User account menu"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <img
                src={user?.profileImage || 'https://via.placeholder.com/150'}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-indigo-500/20"
              />
              <span className="hidden lg:inline text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {user?.name?.split(' ')[0]}
              </span>
              <FiChevronDown size={14} className="text-slate-400 hidden lg:inline" aria-hidden="true" />
            </button>

            {/* DROPDOWN MENU */}
            {profileDropdownOpen && (
              <div
                role="menu"
                aria-label="Account options"
                className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-xl border border-white/20 dark:border-gray-800/60 py-2 flex flex-col z-50 animate-fadeIn"
              >
                <div className="px-4 py-2 border-b border-slate-200/50 dark:border-slate-800/50">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <div className="mt-1.5">
                    <Badge variant="primary" size="xs">
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <div className="py-1 flex flex-col">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <FiUser size={14} className="text-slate-400" aria-hidden="true" />
                    <span>Profile & Settings</span>
                  </Link>

                  {user?.role === 'student' && (
                    <Link
                      to="/passport"
                      onClick={() => setProfileDropdownOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <FiShield size={14} className="text-indigo-500" aria-hidden="true" />
                      <span>Career Passport</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    role="menuitem"
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                  >
                    <FiLogOut size={14} aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NOTIFICATIONS DRAWER */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* GLOBAL SEARCH DIALOG */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default TopNavbar;
