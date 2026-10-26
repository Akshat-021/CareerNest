import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiChevronRight, FiCpu, FiTrendingUp, FiCheckCircle, FiUsers, FiAward,
  FiBriefcase, FiLayers, FiShield, FiTerminal, FiCompass, FiArrowRight,
  FiMenu, FiX, FiSun, FiMoon
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedDemoRole, setSelectedDemoRole] = useState('WebDev');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [mobileNavOpen]);

  const stats = [
    { label: 'Active Students', value: '24,000+', icon: FiUsers },
    { label: 'Verified Mentors', value: '350+', icon: FiUsers },
    { label: 'Job Readiness Calibrations', value: '88,000+', icon: FiTrendingUp },
    { label: 'AI Roadmaps Generated', value: '110,000+', icon: FiCpu }
  ];

  const features = [
    {
      title: '7-Factor Career Readiness Score',
      desc: 'Transparent multi-dimensional score evaluating technical depth, coding problem solving, projects, ATS resume, and interview readiness.',
      icon: FiShield
    },
    {
      title: 'AI Job Description Analyzer',
      desc: 'Paste any job posting to calculate exact Match %, identify critical skill gaps, and auto-generate a targeted 6-week roadmap.',
      icon: FiBriefcase
    },
    {
      title: 'Context-Aware CareerNest Copilot',
      desc: 'An AI career coach that continuously understands your skills, career goals, and suggests 1-click platform next actions.',
      icon: FiCpu
    },
    {
      title: 'Voice AI Mock Interviews',
      desc: 'Simulate natural speech technical and behavioral interviews with 4-axis AI rubric scoring and model answers.',
      icon: FiTerminal
    },
    {
      title: 'WebRTC Mentorship & Study Pods',
      desc: 'Book 1-on-1 calls with AI compatibility matching, video call directly in-browser, and join collaborative peer study pods.',
      icon: FiUsers
    },
    {
      title: 'Verified Career Passport',
      desc: 'Shareable proof-of-work portfolio with QR code verification, GitHub repository analysis, and tamper-proof certificates.',
      icon: FiAward
    }
  ];

  const demoRoadmaps = {
    WebDev: [
      { week: 'Week 1-2', topic: 'HTML5 Semantic Layouts, Tailwind CSS & Responsive Grid Systems' },
      { week: 'Week 3-4', topic: 'JavaScript Async Event Loop, Promises & Complex DOM Engineering' },
      { week: 'Week 5-6', topic: 'React.js Component Lifecycle, Hooks & State Optimization' },
      { week: 'Week 7-8', topic: 'Scalable REST & GraphQL Microservices using Node.js & MongoDB' }
    ],
    AI: [
      { week: 'Week 1-2', topic: 'Python Data Science, Pandas, NumPy & Exploratory Data Analysis' },
      { week: 'Week 3-4', topic: 'Linear Algebra Matrices, Probability Distributions & Vector Calculus' },
      { week: 'Week 5-6', topic: 'Supervised & Unsupervised Machine Learning Algorithms' },
      { week: 'Week 7-8', topic: 'Deep Learning Architectures & LLM Integrations with PyTorch' }
    ]
  };

  const faqs = [
    {
      q: 'How is CareerNest different from standard EdTech platforms?',
      a: 'CareerNest is a unified AI Career Intelligence Operating System. Instead of just offering video courses, CareerNest continuously tracks who you are, compares your skills with real job descriptions, scores your Career Readiness across 7 dimensions, and prescribes the exact next actions to get hired.'
    },
    {
      q: 'How does the Job Description Intelligence feature work?',
      a: 'Paste any job description from LinkedIn, Indeed, or company career pages. CareerNest extracts required and preferred skills, compares them to your CareerProfile, computes a Job Match %, and automatically generates a 6-week roadmap targeting your critical missing skills.'
    },
    {
      q: 'Can employers and recruiters verify my Career Passport?',
      a: 'Yes! Your Career Passport includes a unique public URL and QR code that allows recruiters and university placement cells to verify your skills, completed micro-internships, mock interview scores, and issued certificates with zero tampering.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] transition-colors duration-300 overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/40 z-50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-8">
          <Link to="/" className="font-extrabold text-2xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            🎓 CAREERNEST
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
            <a href="#demo" className="hover:text-indigo-500 transition-colors">Job Intelligence</a>
            <a href="#faqs" className="hover:text-indigo-500 transition-colors">FAQs</a>
          </nav>
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium hover:text-indigo-500 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="glass-button-primary text-xs sm:text-sm"
            >
              Get Started
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileNavOpen}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FiMenu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileNavOpen && (
        <div
          role="presentation"
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            onClick={(e) => e.stopPropagation()}
            className="w-72 max-w-[85vw] h-full glass-panel border-r border-white/20 dark:border-gray-800/60 shadow-2xl p-6 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                  🎓 CareerNest
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close mobile navigation menu"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <FiX size={20} aria-hidden="true" />
                </button>
              </div>

              <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <a
                  href="#features"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                >
                  Features & Readiness Score
                </a>
                <a
                  href="#demo"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                >
                  Job Intelligence Demo
                </a>
                <a
                  href="#faqs"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                >
                  Platform FAQs
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileNavOpen(false)}
                className="glass-button-primary text-center text-sm w-full py-2.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 px-6 sm:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-4 border border-indigo-500/20">
              🚀 The AI Career Intelligence Operating System
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              From Current Skills <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 bg-clip-text text-transparent">
                To Your Dream Career
              </span>
            </h1>
          </motion.div>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            CareerNest bridges the gap between academic education and industry hiring. Diagnosing skill gaps from real-world job roles, CareerNest calibrates your Career Readiness and connects you with verified 1-on-1 industry mentors.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              to="/register"
              className="glass-button-primary px-8 py-3.5 text-base flex items-center gap-2"
            >
              Start Free Today <FiArrowRight size={18} />
            </Link>
            <Link
              to="/passport/demo"
              className="glass-button-secondary px-6 py-3.5 text-sm flex items-center gap-2"
            >
              <FiShield size={16} /> Explore Career Passport
            </Link>
          </div>
        </div>

        {/* HERO CARD GRAPHIC */}
        <div className="flex-1 w-full max-w-lg">
          <div className="glass-panel-accent p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-5 border border-indigo-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800/50">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Live Career Telemetry</span>
                <h3 className="text-base font-bold">Full Stack Engineer Target</h3>
              </div>
              <span className="text-2xl font-black text-indigo-500">82%</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Technical Skills</span>
                <span className="text-indigo-500">88%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Resume ATS Compatibility</span>
                <span className="text-violet-500">92%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <FiCheckCircle className="text-emerald-500" size={20} />
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Next Action Recommended</p>
                <p className="text-[10px] text-gray-400">Complete Docker & Containerization Micro-Internship</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-2">
                <Icon size={24} className="text-indigo-500" />
                <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</h4>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 px-6 sm:px-8 max-w-7xl mx-auto flex flex-col gap-12">
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
            CareerNest Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Everything You Need for Job Readiness</h2>
          <p className="text-sm text-gray-400">
            A continuous loop: KNOW → ASSESS → PLAN → LEARN → PRACTICE → MENTOR → APPLY → VERIFY.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col gap-4 hover:border-indigo-500/30 transition-all">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 w-fit">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold">{f.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="py-20 px-6 sm:px-8 max-w-4xl mx-auto flex flex-col gap-8">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold">Frequently Asked Questions</h2>
          <p className="text-xs text-gray-400">Everything you need to know about the CareerNest platform.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="glass-panel p-5 rounded-2xl cursor-pointer transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <span>{faq.q}</span>
                <span className="text-indigo-500 text-lg">{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200/50 dark:border-gray-800/50 py-10 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} CareerNest. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-indigo-500">Sign In</Link>
            <Link to="/register" className="hover:text-indigo-500">Register</Link>
            <a href="#features" className="hover:text-indigo-500">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
