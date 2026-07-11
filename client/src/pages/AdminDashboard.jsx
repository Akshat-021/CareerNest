import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiUsers, FiBookOpen, FiDollarSign, FiCheck, FiX, FiFileText } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const fetchAdminDashboard = async () => {
    try {
      const res = await api.get('/api/platform/analytics/admin');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Failed to load admin panel statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleApproveMentor = async (mentorId, approve) => {
    setActionMsg('');
    try {
      const res = await api.post('/api/platform/admin/approve-mentor', {
        mentorId,
        approve
      });
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchAdminDashboard(); // Refresh
        setTimeout(() => setActionMsg(''), 2000);
      }
    } catch (err) {
      console.error('Failed to approve mentor:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-gray-400">Monitor system analytics, verify pending mentors, and review revenue cut allocations.</p>
      </div>

      {actionMsg && (
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl text-xs">
          <span>{actionMsg}</span>
        </div>
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
                  <p className="text-[10px] text-indigo-500 mt-1 font-semibold">Expertise: {m.mentorProfile?.expertise.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveMentor(m._id, true)}
                    className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-600 transition-all"
                  >
                    <FiCheck /> Verify
                  </button>
                  <button
                    onClick={() => handleApproveMentor(m._id, false)}
                    className="px-3.5 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-rose-600 transition-all"
                  >
                    <FiX /> Reject
                  </button>
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
