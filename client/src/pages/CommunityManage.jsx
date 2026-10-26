import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiLock,
  FiGlobe,
  FiShield,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiArrowLeft,
  FiFlag,
  FiSettings,
  FiTrash2,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, Badge, Spinner } from '../components/common';
import { Alert, EmptyState } from '../components/feedback';

const CommunityManage = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'members' | 'reports' | 'settings'

  // Join Requests
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reviewingReportId, setReviewingReportId] = useState(null);

  // Settings form
  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('General');
  const [settingsIsPrivate, setSettingsIsPrivate] = useState(false);
  const [settingsRules, setSettingsRules] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchCommunity = async () => {
    try {
      const res = await api.get(`/api/communities/${idOrSlug}`);
      if (res.data.success) {
        const comm = res.data.community;
        setCommunity(comm);
        setSettingsName(comm.name);
        setSettingsDescription(comm.description);
        setSettingsCategory(comm.category);
        setSettingsIsPrivate(comm.isPrivate);
        setSettingsRules((comm.rules || []).join('\n'));

        // Permission check
        const isStaff =
          comm.userRole === 'owner' ||
          comm.userRole === 'moderator' ||
          user?.role === 'admin';

        if (!isStaff) {
          setError('Access Denied: You do not have moderator or owner privileges for this community.');
        } else {
          loadTabContent(activeTab, comm._id);
        }
      }
    } catch (err) {
      console.error('Failed to load community:', err);
      setError(err.response?.data?.message || 'Failed to load community details.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = (tab, commId) => {
    const id = commId || community?._id;
    if (!id) return;
    if (tab === 'requests') {
      fetchRequests(id);
    } else if (tab === 'reports') {
      fetchReports(id);
    }
  };

  const fetchRequests = async (commId) => {
    setRequestsLoading(true);
    try {
      const res = await api.get(`/api/communities/${commId}/requests`);
      if (res.data.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchReports = async (commId) => {
    setReportsLoading(true);
    try {
      const res = await api.get(`/api/communities/${commId}/reports`);
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [idOrSlug]);

  const handleReviewRequest = async (requestId, action) => {
    setReviewingId(requestId);
    try {
      const res = await api.post(
        `/api/communities/${community._id}/requests/${requestId}/review`,
        { action }
      );
      if (res.data.success) {
        setSuccessMsg(res.data.message || `Request ${action}d!`);
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        fetchCommunity();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleUpdateRole = async (memberUserId, newRole) => {
    try {
      const res = await api.patch(
        `/api/communities/${community._id}/members/${memberUserId}/role`,
        { role: newRole }
      );
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Member role updated!');
        fetchCommunity();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this community?`)) {
      return;
    }
    try {
      const res = await api.delete(
        `/api/communities/${community._id}/members/${memberUserId}`
      );
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Member removed.');
        fetchCommunity();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleReviewReport = async (reportId, status, moderationAction) => {
    setReviewingReportId(reportId);
    try {
      const res = await api.patch(
        `/api/communities/${community._id}/reports/${reportId}`,
        {
          status,
          moderationAction,
          moderationNotes: `Moderation applied by ${user?.name || 'Moderator'}`
        }
      );
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Report reviewed successfully.');
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, ...res.data.report } : r))
        );
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setReviewingReportId(null);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const rulesArr = settingsRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await api.patch(`/api/communities/${community._id}`, {
        name: settingsName.trim(),
        description: settingsDescription.trim(),
        category: settingsCategory,
        isPrivate: settingsIsPrivate,
        rules: rulesArr
      });
      if (res.data.success) {
        setSuccessMsg('Community settings updated successfully!');
        fetchCommunity();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Spinner size="lg" message="Loading community governance portal..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FiShield}
          title="Governance Access Denied"
          description={error}
          action={
            <Button variant="primary" size="md" onClick={() => navigate(`/communities/${idOrSlug}`)}>
              <FiArrowLeft className="mr-1.5" /> Return to Community
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = community?.userRole === 'owner' || user?.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/communities/${community?.slug || idOrSlug}`)}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 mb-1 transition-colors"
          >
            <FiArrowLeft size={14} /> Back to {community?.name}
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Community Management & Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage membership admissions, roles, content reports, and cohort configurations.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            fetchCommunity();
            loadTabContent(activeTab);
          }}
        >
          <FiRefreshCw className="mr-1.5" /> Refresh
        </Button>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* TABS CONTROLLER */}
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('requests');
            loadTabContent('requests');
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Pending Requests</span>
          {requests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-indigo-600 font-extrabold">
              {requests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Members & Roles ({community?.members?.length || 1})
        </button>

        <button
          onClick={() => {
            setActiveTab('reports');
            loadTabContent('reports');
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Content Reports</span>
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Settings
          </button>
        )}
      </div>

      {/* TAB 1: PENDING JOIN REQUESTS */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-4">
          {requestsLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" message="Loading membership applications..." />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="No pending requests"
              description="There are currently no outstanding join requests awaiting review."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                      {req.user?.name ? req.user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {req.user?.name || 'Applicant'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Applied on {new Date(req.requestedAt).toLocaleDateString()}
                      </p>
                      {req.requestMessage && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/40 italic">
                          "{req.requestMessage}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewRequest(req._id, 'reject')}
                      disabled={reviewingId === req._id}
                    >
                      <FiX className="mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleReviewRequest(req._id, 'approve')}
                      disabled={reviewingId === req._id}
                      isLoading={reviewingId === req._id}
                    >
                      <FiCheck className="mr-1" /> Approve Admission
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS & ROLES */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-400">
              Community Members List
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {community?.members?.length || 1} Total Members
            </span>
          </div>

          <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {(community?.members || []).map((m) => {
              const memberUser = m.user;
              const isTargetOwner = m.role === 'owner';
              const isTargetMod = m.role === 'moderator';

              return (
                <div
                  key={memberUser?._id || Math.random()}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                      {memberUser?.name ? memberUser.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {memberUser?.name || 'Member'}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isTargetOwner
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : isTargetMod
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Role and Removal Actions */}
                  {isOwner && !isTargetOwner && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isTargetMod ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRole(memberUser._id, 'member')}
                        >
                          Demote to Member
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateRole(memberUser._id, 'moderator')}
                        >
                          Promote to Moderator
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveMember(memberUser._id, memberUser?.name)}
                        title="Remove member"
                      >
                        <FiTrash2 size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-4">
          {reportsLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" message="Loading reports..." />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={FiFlag}
              title="Clean moderation queue"
              description="No content or user reports filed for this community. Keep up the high standard!"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((rep) => (
                <div
                  key={rep._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 uppercase">
                        {rep.reason}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Target: {rep.targetType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Reported on {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {rep.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        "{rep.description}"
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400">
                      Status: <strong className="uppercase">{rep.status}</strong>
                      {rep.moderationAction !== 'none' && ` • Action: ${rep.moderationAction}`}
                    </span>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewReport(rep._id, 'dismissed', 'dismissed')}
                        disabled={reviewingReportId === rep._id}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReviewReport(rep._id, 'resolved', 'content_removed')}
                        disabled={reviewingReportId === rep._id}
                        isLoading={reviewingReportId === rep._id}
                      >
                        Remove Content
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS (Owner/Admin only) */}
      {activeTab === 'settings' && isOwner && (
        <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-4 max-w-2xl">
          <Input
            label="Community Name"
            value={settingsName}
            onChange={(e) => setSettingsName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
            <textarea
              rows={3}
              value={settingsDescription}
              onChange={(e) => setSettingsDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Privacy Setting</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={settingsIsPrivate}
                onChange={(e) => setSettingsIsPrivate(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Private Community (Requires moderator approval to join)
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Community Rules (1 rule per line)
            </label>
            <textarea
              rows={4}
              value={settingsRules}
              onChange={(e) => setSettingsRules(e.target.value)}
              className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={settingsLoading} isLoading={settingsLoading}>
              Save Community Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommunityManage;
