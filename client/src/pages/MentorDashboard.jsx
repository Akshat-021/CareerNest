import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiDollarSign, FiStar, FiCalendar, FiBook, FiCheck, FiX, FiCalendar as FiCalendarIcon, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import { Alert, EmptyState } from '../components/feedback';
import { Button, Spinner } from '../components/common';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MentorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMentorDashboard = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setError('');
    try {
      const [analyticsRes, sessionsRes] = await Promise.allSettled([
        api.get('/api/platform/analytics/mentor'),
        api.get('/api/mentors/sessions')
      ]);

      let hasSuccess = false;
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        setAnalytics(analyticsRes.value.data.analytics);
        hasSuccess = true;
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.success) {
        setSessions(sessionsRes.value.data.sessions || []);
        hasSuccess = true;
      }

      if (!hasSuccess && (analyticsRes.status === 'rejected' || sessionsRes.status === 'rejected')) {
        const err = analyticsRes.reason || sessionsRes.reason;
        setError(err?.response?.data?.message || 'Unable to load mentor dashboard data. Please verify your connection.');
      }
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load mentor dashboard.');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchMentorDashboard();
  }, []);

  const handleUpdateStatus = async (sessionId, status) => {
    setActionMsg('');
    setStatusError('');
    setUpdatingId(sessionId);
    try {
      const res = await api.put(`/api/mentors/sessions/${sessionId}`, { status });
      if (res.data.success) {
        setActionMsg(`Session successfully updated to: ${status}!`);
        fetchMentorDashboard();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        setStatusError(res.data.message || 'Unable to update session status.');
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setStatusError(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Spinner size="lg" message="Loading mentor workspace & booking statistics..." />
      </div>
    );
  }

  if (error && !analytics && sessions.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FiAlertCircle}
          title="Mentor Dashboard Unavailable"
          description={error}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={fetchMentorDashboard}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
          <p className="text-xs text-gray-400">Review student bookings, track your monthly payouts, and update slots.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchMentorDashboard}
          disabled={isRetrying}
          isLoading={isRetrying}
          aria-label="Refresh mentor dashboard"
        >
          <FiRefreshCw className="mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title="Dashboard Sync Notice"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={fetchMentorDashboard} disabled={isRetrying}>
              Retry Sync
            </Button>
          }
          onClose={() => setError('')}
        />
      )}

      {actionMsg && (
        <Alert
          type="success"
          message={actionMsg}
          onClose={() => setActionMsg('')}
        />
      )}

      {statusError && (
        <Alert
          type="error"
          title="Action Failed"
          message={statusError}
          onClose={() => setStatusError('')}
        />
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
                    {s.notes && <p className="text-[10px] text-gray-400 mt-1">"{s.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(s._id, 'approved')}
                      disabled={updatingId === s._id}
                      isLoading={updatingId === s._id}
                      aria-label="Approve booking"
                    >
                      <FiCheck size={14} className="mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleUpdateStatus(s._id, 'rejected')}
                      disabled={updatingId === s._id}
                      aria-label="Reject booking"
                    >
                      <FiX size={14} className="mr-1" /> Reject
                    </Button>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(s._id, 'completed')}
                      disabled={updatingId === s._id}
                      isLoading={updatingId === s._id}
                    >
                      Mark Completed
                    </Button>
                  </div>
                  <p className="text-[10px] text-indigo-500 font-semibold">{s.time} | {new Date(s.date).toDateString()}</p>
                  {s.meetingLink && (
                    <p className="text-[10px] text-gray-400 truncate">
                      Meeting URL: <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{s.meetingLink}</a>
                    </p>
                  )}
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
