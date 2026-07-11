import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiDollarSign, FiStar, FiCalendar, FiBook, FiCheck, FiX, FiCalendar as FiCalendarIcon, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MentorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [actionMsg, setActionMsg] = useState('');

  const fetchMentorDashboard = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        api.get('/api/platform/analytics/mentor'),
        api.get('/api/mentors/sessions')
      ]);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorDashboard();
  }, []);

  const handleUpdateStatus = async (sessionId, status) => {
    setActionMsg('');
    try {
      const res = await api.put(`/api/mentors/sessions/${sessionId}`, { status });
      if (res.data.success) {
        setActionMsg(`Session successfully updated to: ${status}!`);
        fetchMentorDashboard(); // Refresh
        setTimeout(() => setActionMsg(''), 2000);
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Monthly Revenue Chart definition
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Earnings ($)',
      data: analytics?.monthlyRevenueBreakdown || [120, 250, 180, 310, 450, 600],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderWidth: 2,
      tension: 0.3,
      fill: true
    }]
  };

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'approved');

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="text-xs text-gray-400">Review student bookings, track your monthly payouts, and update slots.</p>
      </div>

      {actionMsg && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl text-xs flex items-center gap-2">
          <FiAlertCircle size={16} /> <span>{actionMsg}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><FiDollarSign size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Earnings</p>
            <h3 className="text-xl font-bold">${analytics?.earnings || 0}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl"><FiStar size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Average Rating</p>
            <h3 className="text-xl font-bold">{analytics?.rating?.toFixed(1) || '5.0'} / 5.0</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl"><FiCalendar size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Booked sessions</p>
            <h3 className="text-xl font-bold">{analytics?.sessions?.total || 0} calls</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-violet-500/10 text-violet-500 rounded-xl"><FiBook size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Courses Created</p>
            <h3 className="text-xl font-bold">{analytics?.totalCoursesCreated || 0} courses</h3>
          </div>
        </div>
      </div>

      {/* REVENUE LINE CHART */}
      <div className="glass-panel p-6 rounded-2xl max-w-4xl">
        <h3 className="font-bold text-sm mb-4">Earnings History</h3>
        <div className="h-64 flex items-center justify-center">
          <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* SESSION MANAGER TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm">Incoming Booking Requests</h3>
          {pendingSessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No booking requests pending.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingSessions.map((s) => (
                <div key={s._id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex items-center justify-between border border-gray-200/50 dark:border-gray-800/50">
                  <div>
                    <h4 className="text-xs font-bold">{s.student?.name}</h4>
                    <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">{s.time} | {new Date(s.date).toDateString()}</p>
                    <p className="text-[10px] text-gray-400 mt-1">"{s.notes}"</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'approved')}
                      className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all"
                      title="Approve"
                    >
                      <FiCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'rejected')}
                      className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all"
                      title="Reject"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Sessions */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-sm">Upcoming Booked Sessions</h3>
          {upcomingSessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No approved sessions upcoming.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingSessions.map((s) => (
                <div key={s._id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex flex-col gap-2 border border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold">{s.student?.name}</h4>
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'completed')}
                      className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-md font-semibold hover:bg-indigo-500/20"
                    >
                      Mark Completed
                    </button>
                  </div>
                  <p className="text-[10px] text-indigo-500 font-semibold">{s.time} | {new Date(s.date).toDateString()}</p>
                  <p className="text-[10px] text-gray-400 truncate">Meeting URL: <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{s.meetingLink}</a></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
