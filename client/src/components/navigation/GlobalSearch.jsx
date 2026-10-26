import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiCompass, FiBriefcase, FiCpu, FiBookOpen,
  FiTerminal, FiTrendingUp, FiAward, FiUsers, FiLayers,
  FiShield, FiCheckSquare, FiMessageSquare, FiUser, FiHome, FiCornerDownLeft
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const SEARCH_DESTINATIONS = [
  // Overview
  { title: 'Dashboard', path: '/dashboard', category: 'Overview', desc: 'Readiness scores, learning stats, upcoming calls', icon: FiHome, roles: ['student'] },
  { title: 'Career Passport', path: '/passport', category: 'Overview', desc: 'Shareable proof-of-work portfolio and QR verification', icon: FiShield, roles: ['student'] },
  
  // AI Career Intelligence
  { title: 'AI Job Description Analyzer', path: '/ai-job-analyzer', category: 'AI Tools', desc: 'Compute Job Match % and extract critical skill gaps', icon: FiBriefcase, roles: ['student'] },
  { title: 'CareerNest AI Copilot', path: '/ai-chatbot', category: 'AI Tools', desc: 'Context-aware conversational career assistant', icon: FiCpu, roles: ['student'] },
  { title: 'AI Resume ATS Scanner', path: '/ai-resume', category: 'AI Tools', desc: 'Scan resume for ATS compatibility and Google X-Y-Z bullets', icon: FiBookOpen, roles: ['student'] },
  { title: 'AI Skill-Gap Analysis', path: '/ai-gap', category: 'AI Tools', desc: 'Identify missing competencies vs career targets', icon: FiTrendingUp, roles: ['student'] },
  { title: 'Voice AI Mock Interview', path: '/ai-interview', category: 'AI Tools', desc: 'Practice spoken technical rounds with 4-axis rubric scoring', icon: FiTerminal, roles: ['student'] },
  { title: 'AI Learning Roadmap', path: '/ai-roadmap', category: 'AI Tools', desc: 'Week-by-week personalized engineering roadmap', icon: FiCompass, roles: ['student'] },

  // Learning & Labs
  { title: 'Courses Catalog', path: '/courses', category: 'Learning Lab', desc: 'Handcrafted programs by verified expert mentors', icon: FiBookOpen, roles: ['student'] },
  { title: 'Coding Arena', path: '/challenges', category: 'Learning Lab', desc: 'Interactive algorithm and frontend coding problems', icon: FiTerminal, roles: ['student'] },
  { title: 'AI Quiz Center', path: '/ai-quiz', category: 'Learning Lab', desc: 'Timed skill assessments and streak points', icon: FiCheckSquare, roles: ['student'] },
  { title: 'Micro-Internships', path: '/micro-internships', category: 'Learning Lab', desc: 'Real-world simulation tasks with GitHub deliverables', icon: FiLayers, roles: ['student'] },

  // Community & Mentorship
  { title: 'Communities Hub', path: '/communities', category: 'Community', desc: 'Browse, join, and collaborate in peer cohorts and professional groups', icon: FiUsers, roles: ['student', 'mentor', 'admin'] },
  { title: 'Discussion Forum', path: '/forum', category: 'Community', desc: 'Ask questions, share notes, and receive feedback', icon: FiMessageSquare, roles: ['student', 'mentor', 'admin'] },
  { title: 'Peer Study Pods', path: '/study-pods', category: 'Community', desc: 'Join small collaborative cohort study groups', icon: FiUsers, roles: ['student'] },
  { title: 'Search Mentors', path: '/mentors', category: 'Mentorship', desc: 'Discover industry leaders and book 1-on-1 sessions', icon: FiUser, roles: ['student'] },
  { title: 'Direct Messages & Chats', path: '/chat', category: 'Mentorship', desc: 'Real-time student-to-mentor messaging', icon: FiMessageSquare, roles: ['student', 'mentor', 'admin'] },

  // Career Management
  { title: 'Job Application Tracker', path: '/job-applications', category: 'Pipeline', desc: 'Kanban board for job applications and wishlists', icon: FiTrendingUp, roles: ['student'] },
  { title: 'Certificates Center', path: '/certificates', category: 'Pipeline', desc: 'View, verify, and download verified credentials', icon: FiAward, roles: ['student'] },
  { title: 'Profile Settings', path: '/profile', category: 'Account', desc: 'Manage account, goals, CGPA, and resume', icon: FiUser, roles: ['student', 'mentor', 'admin'] },

  // Mentor & Admin
  { title: 'Mentor Dashboard', path: '/mentor/dashboard', category: 'Mentor', desc: 'Earnings, sessions calendar, and booking requests', icon: FiHome, roles: ['mentor'] },
  { title: 'Admin Dashboard', path: '/admin/dashboard', category: 'Admin', desc: 'Platform analytics, mentor approvals, and metrics', icon: FiHome, roles: ['admin'] }
];

const GlobalSearch = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = SEARCH_DESTINATIONS.filter((item) => {
    // Role filter
    if (user?.role && !item.roles.includes(user.role)) return false;

    // Search query filter
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-20 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global destination search"
        className="w-full max-w-xl glass-panel rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800/60 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* INPUT */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
          <FiSearch size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, tool name, or career destination..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* RESULTS LIST */}
        <div className="p-2 overflow-y-auto flex-1 max-h-96 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center">
              No tools or destinations matched "{query}".
            </p>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <FiCornerDownLeft size={14} className="text-indigo-500 flex-shrink-0 ml-2" aria-hidden="true" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* KEYBOARD SHORTCUTS HINT */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>
          <span className="font-semibold text-indigo-500">CareerNest QuickNav</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
