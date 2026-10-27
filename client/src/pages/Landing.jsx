import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiChevronRight, FiCpu, FiTrendingUp, FiCheckCircle, FiUsers, FiAward,
  FiBriefcase, FiLayers, FiShield, FiTerminal, FiCompass, FiArrowRight,
  FiMenu, FiX, FiSun, FiMoon, FiStar, FiZap
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
    { label: 'Active Students', value: '24,000+', icon: FiUsers, growth: '+18% this month' },
    { label: 'Verified Mentors', value: '350+', icon: FiAward, growth: 'FAANG & Top Tech' },
    { label: 'Career Calibrations', value: '88,000+', icon: FiTrendingUp, growth: '94% accuracy' },
    { label: 'AI Roadmaps Built', value: '110,000+', icon: FiCpu, growth: 'Updated weekly' }
  ];

  const features = [
    {
      title: '7-Factor Career Readiness Score',
      desc: 'Transparent multi-dimensional score evaluating technical depth, coding problem solving, projects, ATS resume, and interview readiness with zero arbitrary guesswork.',
      icon: FiShield,
      tag: 'Core Intelligence',
      badgeColor: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      title: 'AI Job Description Analyzer',
      desc: 'Paste any job posting from LinkedIn or career portals to calculate exact Match %, identify critical skill gaps, and auto-generate a targeted 6-week roadmap.',
      icon: FiBriefcase,
      tag: 'Market Driven',
      badgeColor: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'Context-Aware CareerNest Copilot',
      desc: 'An AI career coach that continuously understands your skills, career goals, and suggests 1-click platform next actions.',
      icon: FiCpu,
      tag: 'Continuous AI',
      badgeColor: 'text-violet-500 bg-violet-500/10'
    },
    {
      title: 'Voice AI Mock Interviews',
      desc: 'Simulate natural speech technical and behavioral interviews with 4-axis AI rubric scoring, model answers, and body-language pacing feedback.',
      icon: FiTerminal,
      tag: 'Voice Engine',
      badgeColor: 'text-purple-500 bg-purple-500/10'
    },
    {
      title: 'WebRTC Mentorship & Study Pods',
      desc: 'Book 1-on-1 calls with AI compatibility matching, video call directly in-browser, and join collaborative peer study pods for accountability.',
      icon: FiUsers,
      tag: 'Live Peer Network',
      badgeColor: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'Verified Career Passport',
      desc: 'Shareable proof-of-work portfolio with QR code verification, GitHub repository analysis, and tamper-proof verified skill certificates.',
      icon: FiAward,
      tag: 'Verifiable Proof',
      badgeColor: 'text-amber-500 bg-amber-500/10'
    }
  ];

  const demoRoadmaps = {
    WebDev: [
      { week: 'Week 1-2', topic: 'Modern Semantic HTML5, CSS Grid Systems & Accessible Tokens', tag: 'Core Web' },
      { week: 'Week 3-4', topic: 'JavaScript Async Event Loop, Concurrency & Complex DOM State', tag: 'JS Engine' },
      { week: 'Week 5-6', topic: 'React.js Component Architecture, Custom Hooks & Memoization', tag: 'Frontend' },
      { week: 'Week 7-8', topic: 'Production RESTful Microservices, MongoDB Atlas & JWT Security', tag: 'Full Stack' }
    ],
    AI: [
      { week: 'Week 1-2', topic: 'Python Data Science, Pandas, NumPy & Exploratory Data Analysis', tag: 'Data' },
      { week: 'Week 3-4', topic: 'Linear Algebra Matrices, Probability Distributions & Vector Spaces', tag: 'Math' },
      { week: 'Week 5-6', topic: 'Supervised Algorithms, Regularization & Cross-Validation', tag: 'Classical ML' },
      { week: 'Week 7-8', topic: 'Deep Learning Architectures, Transformer Embeddings & PyTorch', tag: 'Modern AI' }
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
    },
    {
      q: 'Do I need paid subscriptions for mentorship calls?',
      a: 'CareerNest includes free study pods and community groups for every registered student. Certified 1-on-1 industry mentors offer both introductory community sessions and specialized coaching appointments.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] transition-colors duration-300 overflow-x-hidden bg-tech-grid relative">
      {/* Ambient background glow orbs */}
      <div className="mesh-glow-indigo -top-32 -left-32 opacity-70"></div>
      <div className="mesh-glow-violet top-1/4 -right-32 opacity-60"></div>
      <div className="mesh-glow-emerald top-2/3 -left-32 opacity-50"></div>

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/75 dark:bg-[#0b0f19]/75 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 z-50 transition-colors">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              🎓
            </span>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 bg-clip-text text-transparent">
              CAREERNEST
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Job Intelligence
            </a>
            <a href="#roadmap" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              AI Roadmaps
            </a>
            <a href="#faqs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              FAQs
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2.5 rounded-xl glass-panel text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors focus-ring"
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="glass-button-primary text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20"
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
              className="p-2 rounded-xl glass-panel text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileNavOpen}
              className="p-2 rounded-xl glass-panel text-slate-700 dark:text-slate-200 focus-ring"
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
                <span className="font-black text-xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                  🎓 CareerNest
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close mobile navigation menu"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring"
                >
                  <FiX size={20} aria-hidden="true" />
                </button>
              </div>

              <nav className="flex flex-col gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                  href="#roadmap"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                >
                  6-Week Roadmaps
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
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileNavOpen(false)}
                className="glass-button-primary text-center text-sm w-full py-2.5 font-bold shadow-md shadow-indigo-500/20"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-36 sm:pt-40 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-500/20 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              The AI Career Intelligence Operating System
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              Turn Your Ambition Into A{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Verified Tech Career.
              </span>
            </h1>
          </motion.div>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
            CareerNest bridges the gap between coursework and industry hiring. Calibrate your 7-factor career readiness, practice AI mock interviews, and connect with verified 1-on-1 industry mentors.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              to="/register"
              className="glass-button-primary px-8 py-4 text-base font-bold flex items-center gap-2.5 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              Start Free Today <FiArrowRight size={18} />
            </Link>
            <Link
              to="/passport/demo"
              className="glass-button-secondary px-6 py-4 text-sm font-bold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 hover:-translate-y-0.5 transition-all"
            >
              <FiShield size={16} className="text-indigo-500" /> View Career Passport
            </Link>
          </div>

          {/* Social Proof Avatars */}
          <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center">AR</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-violet-500 text-white font-bold text-[10px] flex items-center justify-center">SC</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">MK</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">+24k</div>
            </div>
            <span>Trusted by <b>24,000+</b> aspiring engineers worldwide</span>
          </div>
        </div>

        {/* HERO CARD GRAPHIC: Live Career Telemetry */}
        <div className="flex-1 w-full max-w-lg z-10">
          <div className="glass-card-elevated p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-5 border border-indigo-500/30 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-gray-800/60">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-500">Live Career Calibration</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Stack Software Engineer</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">82%</span>
                <span className="text-[9px] uppercase font-bold text-emerald-500">Job Ready</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Technical Depth</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">88%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">ATS Resume Quality</span>
                <span className="text-violet-600 dark:text-violet-400 font-bold">92%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">AI Mock Interview Score</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">84%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={22} />
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Next Action Prescribed</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Complete Docker & Containerization Micro-Internship</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-2 hover:border-indigo-500/30 transition-all">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-1">
                  <Icon size={24} />
                </div>
                <h4 className="text-3xl font-black text-slate-900 dark:text-white">{s.value}</h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.label}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{s.growth}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col gap-12 z-10 relative">
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Platform Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Everything You Need For Verified Job Readiness
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            An engineered feedback loop: ASSESS → PLAN → LEARN → PRACTICE → MENTOR → APPLY → VERIFY.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="glass-card-elevated p-7 rounded-3xl flex flex-col justify-between gap-4 border border-slate-200/80 dark:border-white/10 group">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 w-fit group-hover:scale-110 transition-transform">
                      <Icon size={22} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${f.badgeColor}`}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ROADMAP DEMO SECTION */}
      <section id="roadmap" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto z-10 relative">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Interactive Preview</span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">6-Week Targeted Learning Roadmaps</h3>
            </div>
            {/* Role switchers */}
            <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setSelectedDemoRole('WebDev')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedDemoRole === 'WebDev'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Full Stack Web
              </button>
              <button
                type="button"
                onClick={() => setSelectedDemoRole('AI')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedDemoRole === 'AI'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                AI & Machine Learning
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoRoadmaps[selectedDemoRole].map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl glass-panel border border-indigo-500/10 flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{item.week}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">{item.tag}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{item.topic}</h4>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link to="/register" className="glass-button-primary inline-flex items-center gap-2 text-xs font-bold px-6 py-3">
              Generate Custom Roadmap for Your Target Job <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="py-20 px-4 sm:px-8 max-w-4xl mx-auto flex flex-col gap-8 z-10 relative">
        <div className="text-center flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Have Questions?</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Everything you need to know about the CareerNest intelligence platform.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="glass-panel p-5 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/30"
            >
              <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>{faq.q}</span>
                <span className="text-indigo-500 text-lg font-bold">{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/60 dark:border-white/10 py-12 px-4 sm:px-8 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎓</span>
            <span className="font-bold text-slate-900 dark:text-white">CareerNest</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link to="/login" className="hover:text-indigo-500 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-indigo-500 transition-colors">Register</Link>
            <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-indigo-500 transition-colors">Roadmaps</a>
            <a href="#faqs" className="hover:text-indigo-500 transition-colors">FAQs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
