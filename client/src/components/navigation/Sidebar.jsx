import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUser, FiCpu, FiCompass, FiAward, FiMessageSquare,
  FiBookOpen, FiTerminal, FiLogOut, FiSun, FiMoon, FiCheckSquare,
  FiBriefcase, FiTrendingUp, FiUsers, FiLayers, FiShield,
  FiChevronDown, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../common/Badge';

const Sidebar = ({ onNavigate, className = '' }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Define structured grouped navigation based on user role
  const getNavigationGroups = () => {
    if (user?.role === 'mentor') {
      return [
        {
          id: 'mentor-overview',
          title: 'Overview',
          items: [
            { name: 'Mentor Dashboard', path: '/mentor/dashboard', icon: FiHome },
            { name: 'Expert Profile', path: '/profile', icon: FiUser }
          ]
        },
        {
          id: 'mentor-comms',
          title: 'Communication',
          items: [
            { name: 'Student Chats', path: '/chat', icon: FiMessageSquare },
            { name: 'Communities', path: '/communities', icon: FiUsers },
            { name: 'Forum Board', path: '/forum', icon: FiCompass }
          ]
        }
      ];
    }

    if (user?.role === 'admin') {
      return [
        {
          id: 'admin-overview',
          title: 'Overview',
          items: [
            { name: 'Admin Dashboard', path: '/admin/dashboard', icon: FiHome },
            { name: 'Platform Profile', path: '/profile', icon: FiUser }
          ]
        },
        {
          id: 'admin-governance',
          title: 'Governance',
          items: [
            { name: 'Verify Mentors', path: '/admin/mentors-approval', icon: FiCheckSquare },
            { name: 'Communities', path: '/communities', icon: FiUsers },
            { name: 'Forum Board', path: '/forum', icon: FiCompass },
            { name: 'Platform Chats', path: '/chat', icon: FiMessageSquare }
          ]
        }
      ];
    }

    // Default: Student role with 5 functional domains
    return [
      {
        id: 'overview',
        title: 'Overview',
        items: [
          { name: 'Dashboard', path: '/dashboard', icon: FiHome },
          { name: 'Career Passport', path: '/passport', icon: FiShield }
        ]
      },
      {
        id: 'ai-tools',
        title: 'Career Intelligence',
        items: [
          { name: 'Job Analyzer', path: '/ai-job-analyzer', icon: FiBriefcase },
          { name: 'CareerNest Copilot', path: '/ai-chatbot', icon: FiCpu },
          { name: 'Resume ATS Scan', path: '/ai-resume', icon: FiBookOpen },
          { name: 'Skill-Gap Analysis', path: '/ai-gap', icon: FiTrendingUp },
          { name: 'Voice Interview', path: '/ai-interview', icon: FiTerminal },
          { name: 'AI Roadmap', path: '/ai-roadmap', icon: FiCompass }
        ]
      },
      {
        id: 'learning',
        title: 'Learning & Practice',
        items: [
          { name: 'Courses Catalog', path: '/courses', icon: FiBookOpen },
          { name: 'Coding Arena', path: '/challenges', icon: FiTerminal },
          { name: 'AI Quiz Center', path: '/ai-quiz', icon: FiCheckSquare },
          { name: 'Micro-Internships', path: '/micro-internships', icon: FiLayers }
        ]
      },
      {
        id: 'community',
        title: 'Community & Mentors',
        items: [
          { name: 'Communities', path: '/communities', icon: FiUsers },
          { name: 'Discussion Forum', path: '/forum', icon: FiMessageSquare },
          { name: 'Peer Study Pods', path: '/study-pods', icon: FiUsers },
          { name: 'Search Mentors', path: '/mentors', icon: FiUser },
          { name: 'Messages & Chats', path: '/chat', icon: FiMessageSquare }
        ]
      },
      {
        id: 'pipeline',
        title: 'Career Pipeline',
        items: [
          { name: 'Job Tracker', path: '/job-applications', icon: FiTrendingUp },
          { name: 'Certificates', path: '/certificates', icon: FiAward }
        ]
      }
    ];
  };

  const groups = getNavigationGroups();

  // Find which group contains the active route
  const getActiveGroupId = () => {
    for (const group of groups) {
      if (group.items.some((item) => item.path === location.pathname)) {
        return group.id;
      }
    }
    return groups[0]?.id || 'overview';
  };

  // State to track expanded groups
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    groups.forEach((g) => {
      initial[g.id] = true; // Default all expanded or active expanded
    });
    return initial;
  });

  // Ensure active route's group is always expanded when location changes
  useEffect(() => {
    const activeId = getActiveGroupId();
    setExpandedGroups((prev) => ({
      ...prev,
      [activeId]: true
    }));
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const homeRoute = user?.role === 'mentor' ? '/mentor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <aside
      aria-label="Main sidebar navigation"
      className={`w-64 h-full glass-panel flex flex-col justify-between border-r border-white/20 dark:border-gray-800/50 shadow-glass transition-colors duration-300 ${className}`}
    >
      {/* BRAND HEADER */}
      <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
        <Link
          to={homeRoute}
          onClick={onNavigate}
          className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-0.5"
        >
          🎓 CareerNest
        </Link>
        <Badge variant="primary" size="xs">
          {user?.role}
        </Badge>
      </div>

      {/* GROUPED NAVIGATION ACCORDION */}
      <nav
        aria-label="Navigation links"
        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3 max-h-[calc(100vh-170px)] custom-scrollbar"
      >
        {groups.map((group) => {
          const isExpanded = !!expandedGroups[group.id];
          const hasActiveItem = group.items.some((i) => i.path === location.pathname);

          return (
            <div key={group.id} className="flex flex-col">
              {/* GROUP HEADER BUTTON */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isExpanded}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  hasActiveItem
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <span>{group.title}</span>
                {isExpanded ? (
                  <FiChevronDown size={14} aria-hidden="true" />
                ) : (
                  <FiChevronRight size={14} aria-hidden="true" />
                )}
              </button>

              {/* GROUP ITEMS */}
              {isExpanded && (
                <div className="mt-1 flex flex-col gap-0.5 pl-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-l-4 border-indigo-500 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      >
                        <Icon
                          size={15}
                          className={isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FOOTER USER CARD */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-2 bg-slate-50/40 dark:bg-slate-900/20">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <img
            src={user?.profileImage || 'https://via.placeholder.com/150'}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-indigo-500/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Toggle theme to ${theme === 'dark' ? 'light' : 'dark'}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            {theme === 'dark' ? (
              <>
                <FiSun className="text-amber-400" size={13} aria-hidden="true" />
                <span>Light</span>
              </>
            ) : (
              <>
                <FiMoon className="text-indigo-500" size={13} aria-hidden="true" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out of account"
            className="p-2 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
          >
            <FiLogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
