import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiUsers, FiBookOpen, FiDollarSign, FiCheck, FiX, FiFileText, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import { Alert, EmptyState } from '../components/feedback';
import { Button, Spinner } from '../components/common';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchAdminDashboard = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setError('');
    try {
      const res = await api.get('/api/platform/analytics/admin');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      } else {
        setError(res.data.message || 'Failed to retrieve administrative analytics.');
      }
    } catch (err) {
      console.error('Failed to load admin panel statistics:', err);
      setError(err.response?.data?.message || 'Failed to load administrative analytics. Please verify permissions and connection.');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleApproveMentor = async (mentorId, approve) => {
    setActionMsg('');
    setActionError('');
    setProcessingId(mentorId);
    try {
      const res = await api.post('/api/platform/admin/approve-mentor', {
        mentorId,
        approve
      });
      if (res.data.success) {
        setActionMsg(res.data.message || `Mentor verification successfully ${approve ? 'approved' : 'rejected'}.`);
        fetchAdminDashboard();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        setActionError(res.data.message || 'Unable to update mentor verification status.');
      }
    } catch (err) {
      console.error('Failed to approve mentor:', err);
      setActionError(err.response?.data?.message || 'Failed to update mentor verification status.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Spinner size="lg" message="Loading administrative metrics and system status..." />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FiAlertCircle}
          title="Administrative Metrics Unavailable"
          description={error}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={fetchAdminDashboard}
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

  // Monthly Users Growth chart data
  const growthChartData = {
    labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5'],
    datasets: [{
      label: 'System Registered Users Growth',
      data: analytics?.monthlyUsersGrowth || [10, 45, 90, 180, 220],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      borderWidth: 2,
      tension: 0.3,
      fill: true
    }]
  };

  const pendingList = analytics?.pendingMentorsList || [];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-gray-400">Monitor system analytics, verify pending mentors, and review revenue cut allocations.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchAdminDashboard}
          disabled={isRetrying}
          isLoading={isRetrying}
          aria-label="Refresh admin metrics"
        >
          <FiRefreshCw className="mr-1.5" /> Refresh
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title="Admin Sync Notice"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={fetchAdminDashboard} disabled={isRetrying}>
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

      {actionError && (
        <Alert
          type="error"
          title="Operation Notice"
          message={actionError}
          onClose={() => setActionError('')}
        />
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl"><FiUsers size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Students</p>
            <h3 className="text-xl font-bold">{analytics?.users?.students || 0}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-violet-500/10 text-violet-500 rounded-xl"><FiUsers size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Mentors</p>
            <h3 className="text-xl font-bold">{analytics?.users?.mentors || 0}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><FiDollarSign size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Platform Revenue Cut</p>
            <h3 className="text-xl font-bold">${analytics?.platformCutRevenue || 0}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl"><FiBookOpen size={20} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Platform Courses</p>
            <h3 className="text-xl font-bold">{analytics?.coursesCount || 0} courses</h3>
          </div>
        </div>
      </div>

      {/* USER GROWTH PROGRESS CHART */}
      <div className="glass-panel p-6 rounded-2xl max-w-4xl">
        <h3 className="font-bold text-sm mb-4">Platform Registration Growth</h3>
        <div className="h-64 flex items-center justify-center">
          <Line data={growthChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* PENDING APPROVALS LIST */}
      <div className="glass-panel p-6 rounded-2xl max-w-4xl flex flex-col gap-4">
        <h3 className="font-bold text-sm">Pending Mentor Verifications ({pendingList.length})</h3>
        {pendingList.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No mentor profiles awaiting verification.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingList.map((m) => (
              <div key={m._id} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex items-center justify-between border border-gray-200/50 dark:border-gray-800/50">
                <div className="flex flex-col gap-1 text-xs">
                  <h4 className="font-bold">{m.name}</h4>
                  <p className="text-gray-400">{m.email}</p>
                  <p className="text-[10px] text-indigo-500 mt-1 font-semibold">Expertise: {m.mentorProfile?.expertise?.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApproveMentor(m._id, true)}
                    disabled={processingId === m._id}
                    isLoading={processingId === m._id}
                    aria-label={`Verify mentor ${m.name}`}
                  >
                    <FiCheck className="mr-1" /> Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleApproveMentor(m._id, false)}
                    disabled={processingId === m._id}
                    aria-label={`Reject mentor ${m.name}`}
                  >
                    <FiX className="mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
