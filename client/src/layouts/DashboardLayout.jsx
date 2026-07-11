import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FiHome, FiUser, FiCpu, FiCompass, FiAward, FiMessageSquare,
  FiBookOpen, FiTerminal, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiCheckSquare, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar links based on user role
  const getNavLinks = () => {
    const studentLinks = [
      { name: 'Dashboard', path: '/dashboard', icon: FiHome },
      { name: 'AI Career Chat', path: '/ai-chatbot', icon: FiCpu },
      { name: 'AI Roadmap', path: '/ai-roadmap', icon: FiCompass },
      { name: 'AI Resume Scan', path: '/ai-resume', icon: FiAlertCircle },
      { name: 'AI Skill Gap', path: '/ai-gap', icon: FiTrendingUp },
      { name: 'AI Interview', path: '/ai-interview', icon: FiTerminal },
      { name: 'AI Quiz Center', path: '/ai-quiz', icon: FiCheckSquare },
      { name: 'Search Mentors', path: '/mentors', icon: FiUser },
      { name: 'Courses', path: '/courses', icon: FiBookOpen },
      { name: 'Coding Arena', path: '/challenges', icon: FiTerminal },
      { name: 'Discussion Forum', path: '/forum', icon: FiMessageSquare },
      { name: 'Certificates', path: '/certificates', icon: FiAward }
    ];

    const mentorLinks = [
      { name: 'Mentor Dashboard', path: '/mentor/dashboard', icon: FiHome },
      { name: 'Student Chats', path: '/chat', icon: FiMessageSquare },
      { name: 'Forum Board', path: '/forum', icon: FiCompass },
      { name: 'Expert Profile', path: '/profile', icon: FiUser }
    ];

    const adminLinks = [
      { name: 'Admin Dashboard', path: '/admin/dashboard', icon: FiHome },
      { name: 'Verify Mentors', path: '/admin/mentors-approval', icon: FiCheckSquare },
      { name: 'Forum Board', path: '/forum', icon: FiCompass },
      { name: 'Platform Chats', path: '/chat', icon: FiMessageSquare },
      { name: 'Platform Profile', path: '/profile', icon: FiUser }
    ];

    if (user?.role === 'mentor') return mentorLinks;
    if (user?.role === 'admin') return adminLinks;
    return studentLinks;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex bg-brand-light dark:bg-brand-dark transition-colors duration-300">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-between px-4">
        <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
          🎓 CAREERNEST
        </span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel transform lg:transform-none lg:opacity-100 transition-all duration-300 flex flex-col justify-between p-6 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between h-12">
            <span className="font-extrabold text-2xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
              🎓 CareerNest
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              {user?.role}
            </span>
          </div>

          <nav className="flex flex-col gap-1.5 overflow-y-auto max-h-[70vh] pr-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border-l-4 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/40 hover:text-indigo-500'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-500' : 'text-gray-400'} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200/50 dark:border-gray-800/50 pt-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.profileImage || 'https://via.placeholder.com/150'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              {theme === 'dark' ? (
                <>
                  <FiSun className="text-amber-500" /> Light Mode
                </>
              ) : (
                <>
                  <FiMoon className="text-indigo-500" /> Dark Mode
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-all duration-200"
              title="Logout"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-xs"
        />
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 lg:pl-64 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
