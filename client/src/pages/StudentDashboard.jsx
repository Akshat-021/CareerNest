import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiBookOpen, FiUser, FiAward, FiClock, FiAlertCircle, FiTerminal, FiCpu, FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, sessionsRes, notifRes] = await Promise.all([
          api.get('/api/platform/analytics/student'),
          api.get('/api/mentors/sessions'),
          api.get('/api/platform/notifications')
        ]);
        if (statsRes.data.success) setStats(statsRes.data.analytics);
        if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions.slice(0, 3)); // Top 3 bookings
        if (notifRes.data.success) setNotifications(notifRes.data.notifications.slice(0, 4)); // Top 4 alerts
      } catch (error) {
        console.error('Failed to load student dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chart data definitions
  const hoursChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Study Hours',
      data: stats?.weeklyHoursBreakdown || [2, 4, 1, 3, 2, 0, 0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: 2.5,
      tension: 0.35,
      fill: true
    }]
  };

  const skillChartData = {
    labels: stats?.skillDistribution?.labels || ['HTML', 'CSS', 'JavaScript'],
    datasets: [{
      label: 'Proficiency %',
      data: stats?.skillDistribution?.values || [80, 75, 90],
      backgroundColor: '#8b5cf6',
      borderRadius: 6
    }]
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-gray-400">Track your learning streak, progress, and upcoming expert sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Streak</p>
              <p className="text-xs font-bold">{stats?.learningStreak || 0} Days Streak</p>
            </div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Points</p>
              <p className="text-xs font-bold">{stats?.leaderboardPoints || 0} PTS</p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl"><FiClock size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Learning Hours</p>
            <h3 className="text-xl font-bold">{stats?.totalHours || 0} hrs</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-violet-500/10 text-violet-500 rounded-xl"><FiAward size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Certificates</p>
            <h3 className="text-xl font-bold">{stats?.completedCertificates || 0} Earned</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-fuchsia-500/10 text-fuchsia-500 rounded-xl"><FiTrendingUp size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">ATS Resume Score</p>
            <h3 className="text-xl font-bold">{stats?.resumeScore || 0}%</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><FiBookOpen size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Mentor sessions</p>
            <h3 className="text-xl font-bold">{stats?.bookedSessionsCount || 0} Booked</h3>
          </div>
        </div>
      </div>

      {/* GRAPH GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-sm mb-4">Weekly Learning Hours Progress</h3>
          <div className="h-64 flex items-center justify-center">
            <Line data={hoursChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-sm mb-4">Current Skills Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Bar data={skillChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* BOTTOM DIVISION: BOOKINGS & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor sessions */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Upcoming Mentor Sessions</h3>
            <Link to="/mentors" className="text-xs text-indigo-500 hover:underline">Book New</Link>
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-250 dark:border-gray-800 rounded-xl">No active sessions scheduled yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <div key={s._id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex items-center justify-between border border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <img src={s.mentor?.profileImage || 'https://via.placeholder.com/150'} alt="mentor" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-semibold">{s.mentor?.name}</h4>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase">{s.time} | {new Date(s.date).toDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Alerts */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No alerts to display.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((n) => (
                <div key={n._id} className="flex gap-3 items-start border-b border-gray-200/40 dark:border-gray-800/40 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="p-1 bg-indigo-500/10 text-indigo-500 rounded-md mt-0.5"><FiAlertCircle size={12} /></div>
                  <div>
                    <h4 className="text-xs font-semibold">{n.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
