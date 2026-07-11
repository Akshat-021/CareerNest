import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight, FiCpu, FiTrendingUp, FiCheckCircle, FiUsers, FiAward, FiHelpCircle, FiMail } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedDemoRole, setSelectedDemoRole] = useState('WebDev');
  const [openFaq, setOpenFaq] = useState(null);

  const stats = [
    { label: 'Active Students', value: '18,500+', icon: FiUsers },
    { label: 'Expert Mentors', value: '250+', icon: FiUsers },
    { label: 'Placement Rate', value: '94.2%', icon: FiTrendingUp },
    { label: 'AI Pathways Generated', value: '62,000+', icon: FiCpu }
  ];

  const features = [
    { title: 'AI Recommendation Engine', desc: 'Analyzes your CGPA, skills, branch, and budget to prescribe optimal courses.', icon: FiCpu },
    { title: 'Interactive Roadmaps', desc: 'Visual timeline roadmap trackers detailing weekly goals, resources, and tests.', icon: FiTrendingUp },
    { title: 'ATS Resume Reviewer', desc: 'Scans resumes for keyword optimizations and parses section enhancements.', icon: FiCheckCircle },
    { title: 'Mock Interview Arena', desc: 'Practice behavioral, technical, and HR interview scripts with real-time scoring.', icon: FiAward }
  ];

  const demoRoadmaps = {
    WebDev: [
      { week: 'Week 1-2', topic: 'HTML5, CSS3 Grid Layouts & Tailwind' },
      { week: 'Week 3-4', topic: 'JavaScript Asynchronous DOM & ES6 Operations' },
      { week: 'Week 5-6', topic: 'React.js Component Architecture & State Hooks' },
      { week: 'Week 7-8', topic: 'RESTful API deployments using Node.js & MongoDB' }
    ],
    AI: [
      { week: 'Week 1-2', topic: 'Python Programming, Pandas & NumPy Analysis' },
      { week: 'Week 3-4', topic: 'Linear Algebra Matrices & Matrix Calculus' },
      { week: 'Week 5-6', topic: 'Supervised ML Regression & Classifier Models' },
      { week: 'Week 7-8', topic: 'Neural Networks Basics using PyTorch/TensorFlow' }
    ]
  };

  const faqs = [
    { q: 'How does the AI recommend courses?', a: 'Our engine uses your branch, semester, CGPA, target company, and learning style to generate personalized pathways, detailing the estimated study hours and placement preparation resources needed.' },
    { q: 'Can I choose my own mentor?', a: 'Yes! You can search through our verified list of mentors based on expertise, review their ratings, and book active Google Meet slots directly.' },
    { q: 'How does the Resume Analyzer calculate ATS scores?', a: 'It checks your file format, section structures, and keywords against target job descriptions, scoring readability, action-verb usage, and skill coverage.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-[#f3f4f6] transition-colors duration-300 overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/40 z-50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 sm:px-8">
          <span className="font-extrabold text-2xl bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            🎓 CareerNest
          </span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-indigo-500 transition-colors">Features</a>
            <a href="#demo" className="hover:text-indigo-500 transition-colors">AI Demo</a>
            <a href="#faqs" className="hover:text-indigo-500 transition-colors">FAQs</a>
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 sm:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 min-h-[90vh]">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-4">
              🚀 Next-Generation AI EdTech Portal
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Personalized Learning <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 bg-clip-text text-transparent">
                Powered by AI Mentorship
              </span>
            </h1>
          </motion.div>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0">
            Accelerate your career with customized study roadmaps, instant ATS resume assessments, placement likelihood calculators, and real-time guidance from industry professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl px-7 py-3.5 shadow-lg flex items-center justify-center gap-2 group transition-all"
            >
              Start Free Trial <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto text-center border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/40 font-medium rounded-xl px-7 py-3.5 transition-all"
            >
              Watch AI Demo
            </a>
          </div>
        </div>

        {/* Floating Mockup Graphics */}
        <div className="flex-1 w-full relative max-w-xl mx-auto lg:max-w-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 blur-3xl rounded-full" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative glass-panel rounded-2xl p-6 shadow-2xl border border-white/20"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400">CareerNest AI Copilot Dashboard</span>
            </div>
            <div className="py-6 flex flex-col gap-4">
              <div className="h-10 bg-indigo-500/10 rounded-lg flex items-center justify-between px-4">
                <span className="text-xs font-semibold text-indigo-500">Placement Probability</span>
                <span className="text-xs font-bold text-indigo-600 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full">87%</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 h-20 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Learning Streak</p>
                  <p className="text-2xl font-extrabold mt-1">🔥 8 Days</p>
                </div>
                <div className="flex-1 h-20 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Resume Rating</p>
                  <p className="text-2xl font-extrabold mt-1 text-green-500">A- (82%)</p>
                </div>
              </div>
              <div className="h-28 bg-gray-100 dark:bg-gray-800/40 rounded-lg p-4 flex flex-col justify-between">
                <p className="text-xs text-gray-400 italic">"CareerNest AI generated: Docker & CI/CD pipeline deployment added as priority study gap target."</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-3/4" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-white/40 dark:bg-gray-900/40 border-y border-gray-200/50 dark:border-gray-850/50 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center gap-1.5">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 mb-1">
                  <Icon size={22} />
                </div>
                <span className="text-3xl font-extrabold tracking-tight">{stat.value}</span>
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Complete AI-Ecosystem</h2>
          <p className="text-gray-400 text-sm">Everything you need to improve your skills, clear interviews, and connect with mentors in one modern unified portal.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="glass-panel p-6 rounded-2xl hover:shadow-lg transition-all duration-200 flex flex-col gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 w-fit">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-lg">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE DEMO ROADMAP SECTION */}
      <section id="demo" className="py-20 bg-gray-100/40 dark:bg-gray-900/20 border-y border-gray-200/50 dark:border-gray-800/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Interactive AI Demo</h2>
            <p className="text-gray-400 text-sm">Select a job pathway below to test our dynamic learning timeline creator. Students receive custom reading lists, exercises, and tasks based on their specific experience level.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedDemoRole('WebDev')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedDemoRole === 'WebDev'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                }`}
              >
                Web Development
              </button>
              <button
                onClick={() => setSelectedDemoRole('AI')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedDemoRole === 'AI'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                }`}
              >
                Artificial Intelligence
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-xl glass-panel rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-lg border-b border-gray-200/40 dark:border-gray-800/40 pb-3 mb-4 flex items-center gap-2">
              <FiCpu className="text-indigo-500" /> Generated Study Roadmap
            </h3>
            <div className="flex flex-col gap-4">
              {demoRoadmaps[selectedDemoRole].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase whitespace-nowrap">
                    {step.week}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold">{step.topic}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Resources: Official guides, exercises, and practical project builds.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section id="faqs" className="py-20 px-6 sm:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-xl p-5 cursor-pointer select-none transition-all"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2"><FiHelpCircle className="text-indigo-500" /> {faq.q}</h4>
                <span>{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p className="text-xs text-gray-400 mt-3 pl-6 leading-relaxed border-t border-gray-200/30 dark:border-gray-800/30 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-16 bg-gradient-to-r from-indigo-900/60 to-violet-900/40 border-t border-indigo-500/20 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold text-white">Stay Updated on Course Openings</h2>
          <p className="text-indigo-200 text-sm max-w-xl mx-auto">Subscribe to our newsletter to receive the latest notifications on industry courses, mentor slots, and AI features.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full mt-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl px-4 py-3 outline-none text-white placeholder-indigo-300 focus:border-white text-sm"
            />
            <button className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200/40 dark:border-gray-800/40 py-8 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} CareerNest AI Systems. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
