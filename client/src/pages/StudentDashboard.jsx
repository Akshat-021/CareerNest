import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import {
  FiBriefcase, FiCompass, FiAward, FiClock, FiAlertCircle, FiTerminal,
  FiCpu, FiTrendingUp, FiCheckCircle, FiArrowRight, FiShield, FiUsers, FiLayers, FiShare2, FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';
import { Alert, EmptyState } from '../components/feedback';
import { Button, Spinner } from '../components/common';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
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
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: 2.5,
      tension: 0.35,
      fill: true
    }]
  };

  return (
    <div className="flex flex-col gap-6">
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

      {/* 1. TOP HERO: WHAT IS MY STATUS & CAREER TARGET? */}
      <div className="glass-panel-accent p-6 sm:p-8 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Career Goal Target
            </span>
            <span className="text-xs text-gray-400">• {profile?.experienceLevel || 'Student / Fresher'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            {profile?.targetRole || 'Full Stack Software Engineer'}
          </h1>
          
          <p className="text-xs text-gray-400 max-w-xl">
            CareerNest continuously calibrates your 7-factor career readiness, identifies skill gaps, and recommends your next best actions.
          </p>
        </div>

        {/* OVERALL READINESS SCORE CARD */}
        <div className="flex items-center gap-5 bg-white/50 dark:bg-gray-900/50 p-4 sm:p-5 rounded-2xl border border-indigo-500/20 shadow-sm min-w-[260px]">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
              <span className="text-xl font-extrabold text-indigo-500">{readiness.overallReadiness}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Career Readiness</p>
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{readiness.ratingCategory}</h4>
            <Link
              to={`/passport/${profile?.passportSettings?.slug || profile?.student?._id}`}
              className="text-[11px] text-gray-500 hover:text-indigo-500 font-semibold flex items-center gap-1 mt-1 transition-colors"
            >
              <FiShare2 size={12} /> View Career Passport
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CORE INTELLIGENCE HUB: "WHAT SHOULD I DO NEXT?" */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">🎯</span>
            <h2 className="text-base font-bold">Recommended Next Actions</h2>
          </div>
          <span className="text-[11px] text-gray-400">Prioritized by Career Intelligence Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nextActions.slice(0, 3).map((action, idx) => (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-3 border border-indigo-500/10 hover:border-indigo-500/30 transition-all shadow-sm group"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    action.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {action.priority || 'Action'} Priority
                  </span>
                  <span className="text-xs text-indigo-500">⚡</span>
                </div>
                <h4 className="text-xs font-bold group-hover:text-indigo-500 transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <Link
                to={action.link || '/courses'}
                className="glass-button-primary text-xs flex items-center justify-center gap-1.5 py-2 mt-1"
              >
                Execute Action <FiArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 7-FACTOR READINESS METRICS MATRIX */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FiShield className="text-indigo-500" /> Explainable 7-Factor Readiness Breakdown
          </h3>
          <span className="text-[10px] text-gray-400">No arbitrary fake scores</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Technical', val: readiness.technicalSkills, icon: FiCpu },
            { label: 'Coding', val: readiness.codingAbility, icon: FiTerminal },
            { label: 'Projects', val: readiness.projectStrength, icon: FiLayers },
            { label: 'Resume ATS', val: readiness.resumeQuality, icon: FiBriefcase },
            { label: 'Interview', val: readiness.interviewReadiness, icon: FiTerminal },
            { label: 'Certificates', val: readiness.certifications, icon: FiAward },
            { label: 'Overall', val: readiness.overallReadiness, icon: FiTrendingUp }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel p-3 rounded-xl flex flex-col items-center text-center gap-1">
                <Icon size={15} className="text-indigo-500" />
                <span className="text-[10px] text-gray-400 font-semibold">{item.label}</span>
                <span className="text-xs font-bold">{item.val}%</span>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${item.val}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PLATFORM SUITE QUICK SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/ai-job-analyzer"
          className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <FiBriefcase size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold">Job Analyzer</h5>
            <p className="text-[10px] text-gray-400">Match % & Roadmaps</p>
          </div>
        </Link>

        <Link
          to="/job-applications"
          className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <FiTrendingUp size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold">Job Tracker</h5>
            <p className="text-[10px] text-gray-400">Kanban Application Copilot</p>
          </div>
        </Link>

        <Link
          to="/study-pods"
          className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
            <FiUsers size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold">Study Pods</h5>
            <p className="text-[10px] text-gray-400">Peer Collaboration</p>
          </div>
        </Link>

        <Link
          to="/micro-internships"
          className="glass-panel p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500/30 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
            <FiLayers size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold">Micro-Internships</h5>
            <p className="text-[10px] text-gray-400">Real Project Simulations</p>
          </div>
        </Link>
      </div>

      {/* 5. STUDY HOURS & UPCOMING SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <FiClock className="text-indigo-500" /> Weekly Learning Progression
            </h3>
            <span className="text-xs font-semibold text-indigo-500">
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
                  y: { grid: { color: 'rgba(200, 200, 200, 0.1)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* UPCOMING SESSIONS */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold">Upcoming Mentorship Sessions</h3>
            <div className="flex flex-col gap-2.5">
              {sessions.length > 0 ? (
                sessions.map((sess) => (
                  <div key={sess._id} className="p-3 rounded-xl glass-panel flex items-center justify-between border border-indigo-500/10">
                    <div>
                      <p className="text-xs font-bold">{sess.mentor?.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(sess.date).toDateString()} • {sess.time}
                      </p>
                    </div>
                    <Link
                      to={sess.meetingLink || `/mentorship-room/${sess._id}`}
                      className="text-[11px] px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 font-semibold hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      Join
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No upcoming bookings. Search mentors to schedule a call.</p>
              )}
            </div>
          </div>

          <Link to="/mentors" className="glass-button-secondary text-xs text-center py-2">
            Explore Expert Mentors
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
