import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import {
  FiBriefcase, FiCompass, FiAward, FiClock, FiAlertCircle, FiTerminal,
  FiCpu, FiTrendingUp, FiCheckCircle, FiArrowRight, FiShield, FiUsers, FiLayers, FiShare2, FiRefreshCw, FiZap
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Alert, EmptyState } from '../components/feedback';
import { Button, Spinner } from '../components/common';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setError('');
    try {
      const [profileRes, statsRes, sessionsRes] = await Promise.allSettled([
        api.get('/api/ai/career-profile'),
        api.get('/api/platform/analytics/student'),
        api.get('/api/mentors/sessions')
      ]);

      let hasSuccess = false;
      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        setProfile(profileRes.value.data.profile);
        hasSuccess = true;
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.analytics);
        hasSuccess = true;
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.success) {
        setSessions(sessionsRes.value.data.sessions?.slice(0, 3) || []);
      }

      if (!hasSuccess && (profileRes.status === 'rejected' || statsRes.status === 'rejected')) {
        const err = profileRes.reason || statsRes.reason;
        setError(err?.response?.data?.message || 'Unable to load dashboard data. Please check your network and retry.');
      }
    } catch (err) {
      console.error('Failed to load student dashboard statistics:', err);
      setError(err?.response?.data?.message || 'Failed to load student dashboard statistics.');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Spinner size="lg" message="Loading your AI Career Operating System..." />
      </div>
    );
  }

  if (error && !profile && !stats) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FiAlertCircle}
          title="Dashboard Data Unavailable"
          description={error}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={fetchDashboardData}
              disabled={isRetrying}
              isLoading={isRetrying}
            >
              Retry Loading Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const readiness = profile?.readinessScore || {
    overallReadiness: 65,
    technicalSkills: 60,
    codingAbility: 55,
    projectStrength: 60,
    resumeQuality: 70,
    interviewReadiness: 65,
    communication: 70,
    certifications: 50,
    ratingCategory: 'Developing Competency',
    strengths: ['Solid foundation in core web concepts'],
    criticalGaps: ['Need 2 deployed portfolio projects', 'ATS resume scan needs optimization']
  };

  const nextActions = profile?.nextActions?.length > 0 ? profile.nextActions : [
    { title: 'Analyze a Target Job Posting', description: 'Paste a job description to calculate your exact Match % and missing skills.', link: '/ai-job-analyzer', priority: 'high', type: 'job' },
    { title: 'Optimize Resume for ATS Compatibility', description: 'Upload your resume to reach a score above 80% with X-Y-Z bullet points.', link: '/ai-resume', priority: 'high', type: 'resume' },
    { title: 'Take AI Mock Interview', description: 'Simulate a 4-question technical and behavioral round to calibrate pacing.', link: '/ai-interview', priority: 'medium', type: 'interview' }
  ];

  // Chart data definitions
  const hoursChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Study Hours',
      data: stats?.weeklyHoursBreakdown || [2, 4, 3, 5, 2, 4, 1],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.18)',
      borderWidth: 2.5,
      tension: 0.35,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Background ambient accents */}
      <div className="mesh-glow-indigo -top-24 -right-24 opacity-40"></div>

      {error && (
        <Alert
          type="error"
          title="Dashboard Sync Notice"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={fetchDashboardData} disabled={isRetrying}>
              Retry Sync
            </Button>
          }
          onClose={() => setError('')}
        />
      )}

      {/* 1. TOP HERO: CAREER STATUS & CALIBRATION */}
      <div className="glass-card-elevated p-6 sm:p-8 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="flex flex-col gap-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Career Target
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              • {profile?.experienceLevel || 'Student / Fresher'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {profile?.targetRole || 'Full Stack Software Engineer'}
          </h1>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Welcome back, <b className="text-slate-700 dark:text-slate-200">{user?.name || 'Engineer'}</b>! CareerNest has calibrated your 7-factor readiness and identified next best actions to maximize your hiring match rate.
          </p>
        </div>

        {/* OVERALL READINESS SCORE CARD */}
        <div className="flex items-center gap-5 p-4 sm:p-5 rounded-2xl glass-panel border border-indigo-500/20 shadow-md min-w-[280px] z-10">
          <div className="relative flex items-center justify-center shrink-0">
            {/* SVG Circular Ring Gauge */}
            <svg className="w-18 h-18 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${readiness.overallReadiness}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-black text-slate-900 dark:text-white">{readiness.overallReadiness}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Career Readiness</p>
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{readiness.ratingCategory}</h4>
            <Link
              to={`/passport/${profile?.passportSettings?.slug || profile?.student?._id}`}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1 mt-1 transition-colors"
            >
              <FiShare2 size={12} /> View Verified Passport
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CORE INTELLIGENCE HUB: "WHAT SHOULD I DO NEXT?" */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl flex flex-col gap-4 shadow-sm border border-slate-200/70 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiZap size={16} />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommended Next Actions</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Prioritized by AI Intelligence Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nextActions.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="glass-card-elevated p-5 rounded-2xl flex flex-col justify-between gap-3 border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    action.priority === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {action.priority || 'Action'} Priority
                  </span>
                  <span className="text-indigo-500">⚡</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <Link
                to={action.link || '/courses'}
                className="glass-button-primary text-xs flex items-center justify-center gap-1.5 py-2.5 mt-1 font-bold shadow-sm"
              >
                Execute Action <FiArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 7-FACTOR READINESS METRICS MATRIX */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl flex flex-col gap-4 border border-slate-200/70 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <FiShield className="text-indigo-500" /> Explainable 7-Factor Readiness Breakdown
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Calibrated against current tech hiring standards</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Technical', val: readiness.technicalSkills, icon: FiCpu, color: 'from-blue-500 to-indigo-500' },
            { label: 'Coding', val: readiness.codingAbility, icon: FiTerminal, color: 'from-indigo-500 to-violet-500' },
            { label: 'Projects', val: readiness.projectStrength, icon: FiLayers, color: 'from-violet-500 to-purple-500' },
            { label: 'Resume ATS', val: readiness.resumeQuality, icon: FiBriefcase, color: 'from-purple-500 to-pink-500' },
            { label: 'Interview', val: readiness.interviewReadiness, icon: FiTerminal, color: 'from-emerald-500 to-teal-500' },
            { label: 'Certificates', val: readiness.certifications, icon: FiAward, color: 'from-amber-500 to-yellow-500' },
            { label: 'Overall', val: readiness.overallReadiness, icon: FiTrendingUp, color: 'from-indigo-600 to-violet-600' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel p-3.5 rounded-2xl flex flex-col items-center text-center gap-1.5 border border-slate-200/50 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Icon size={16} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{item.label}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.val}%</span>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div className={`bg-gradient-to-r ${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PLATFORM SUITE QUICK SHORTCUTS DOCK */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/ai-job-analyzer"
          className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <FiBriefcase size={20} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Job Analyzer</h5>
            <p className="text-[10px] text-slate-400">Match % & Roadmaps</p>
          </div>
        </Link>

        <Link
          to="/job-applications"
          className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <FiTrendingUp size={20} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Job Tracker</h5>
            <p className="text-[10px] text-slate-400">Kanban Application Copilot</p>
          </div>
        </Link>

        <Link
          to="/study-pods"
          className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
            <FiUsers size={20} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Study Pods</h5>
            <p className="text-[10px] text-slate-400">Peer Collaboration</p>
          </div>
        </Link>

        <Link
          to="/micro-internships"
          className="glass-panel p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
            <FiLayers size={20} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Micro-Internships</h5>
            <p className="text-[10px] text-slate-400">Real Project Simulations</p>
          </div>
        </Link>
      </div>

      {/* 5. STUDY HOURS & UPCOMING SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl flex flex-col gap-4 border border-slate-200/70 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <FiClock className="text-indigo-500" /> Weekly Learning Progression
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
              {stats?.learningStreak || 3} Days Streak 🔥
            </span>
          </div>
          <div className="h-56">
            <Line
              data={hoursChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* UPCOMING SESSIONS */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl flex flex-col justify-between gap-4 border border-slate-200/70 dark:border-white/5">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Mentorship Sessions</h3>
            <div className="flex flex-col gap-2.5">
              {sessions.length > 0 ? (
                sessions.map((sess) => (
                  <div key={sess._id} className="p-3.5 rounded-2xl glass-panel flex items-center justify-between border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{sess.mentor?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(sess.date).toDateString()} • {sess.time}
                      </p>
                    </div>
                    <Link
                      to={sess.meetingLink || `/mentorship-room/${sess._id}`}
                      className="text-[11px] px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                    >
                      Join
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-400">No upcoming bookings.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Search mentors to schedule a 1-on-1 call.</p>
                </div>
              )}
            </div>
          </div>

          <Link to="/mentors" className="glass-button-secondary text-xs text-center py-2.5 font-bold">
            Explore Expert Mentors
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
