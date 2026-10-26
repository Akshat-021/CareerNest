import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiLock,
  FiGlobe,
  FiPlus,
  FiSearch,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiAward
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, Badge, Spinner } from '../components/common';
import { Alert, EmptyState } from '../components/feedback';

const CATEGORIES = [
  'All',
  'Engineering',
  'Data & AI',
  'Design',
  'Product',
  'Career & Placements',
  'General'
];

const CommunityHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'joined' | 'my'
  const [isRetrying, setIsRetrying] = useState(false);

  // Create Community Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Engineering');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formRules, setFormRules] = useState('');
  const [formAvatar, setFormAvatar] = useState('🌐');

  // Request Access Modal State
  const [requestModalCommunity, setRequestModalCommunity] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchCommunities = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (activeTab !== 'all') params.filter = activeTab;

      const res = await api.get('/api/communities', { params });
      if (res.data.success) {
        setCommunities(res.data.communities || []);
      } else {
        setError(res.data.message || 'Failed to load communities.');
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
      setError(err.response?.data?.message || 'Failed to connect to community service. Please retry.');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommunities();
    }, 250);
    return () => clearTimeout(timer);
  }, [category, activeTab, search]);

  const handleJoinPublic = async (communityId) => {
    try {
      const res = await api.post(`/api/communities/${communityId}/join`);
      if (res.data.success) {
        setActionSuccessMsg(res.data.message || 'Joined community successfully!');
        fetchCommunities();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join community.');
    }
  };

  const handleSendJoinRequest = async () => {
    if (!requestModalCommunity) return;
    setRequestLoading(true);
    setRequestError('');
    try {
      const res = await api.post(`/api/communities/${requestModalCommunity._id}/request-join`, {
        requestMessage
      });
      if (res.data.success) {
        setActionSuccessMsg(res.data.message || 'Join request submitted!');
        setRequestModalCommunity(null);
        setRequestMessage('');
        fetchCommunities();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to submit join request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) {
      setCreateError('Community name and description are required.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const rulesArray = formRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await api.post('/api/communities', {
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        isPrivate: formIsPrivate,
        rules: rulesArray,
        avatar: formAvatar.trim() || '🌐'
      });

      if (res.data.success) {
        setIsCreateOpen(false);
        setFormName('');
        setFormDescription('');
        setFormCategory('Engineering');
        setFormIsPrivate(false);
        setFormRules('');
        setFormAvatar('🌐');
        setActionSuccessMsg(`Community "${res.data.community.name}" created successfully!`);
        fetchCommunities();
        setTimeout(() => setActionSuccessMsg(''), 4000);
        navigate(`/communities/${res.data.community.slug}`);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create community.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. TOP HEADER & DISCOVERY ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              Community Ecosystem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Student & Mentor Communities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Connect with peer cohorts, collaborate on projects, discuss interview strategies, and learn together.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCommunities}
            disabled={isRetrying}
            isLoading={isRetrying}
            aria-label="Refresh communities"
          >
            <FiRefreshCw className="mr-1.5" /> Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create new community"
          >
            <FiPlus className="mr-1.5" /> Create Community
          </Button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {actionSuccessMsg && (
        <Alert
          type="success"
          message={actionSuccessMsg}
          onClose={() => setActionSuccessMsg('')}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Community Sync Notice"
          message={error}
          action={
            <Button size="sm" variant="outline" onClick={fetchCommunities} disabled={isRetrying}>
              Retry Sync
            </Button>
          }
          onClose={() => setError('')}
        />
      )}

      {/* 2. SEARCH, CATEGORIES & TABS CONTROLS */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col gap-4 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search communities by name or topic..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input bg-transparent"
              aria-label="Search communities"
            />
          </div>

          {/* Membership Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'joined'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Joined
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'my'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              My Communities
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. COMMUNITIES DISCOVERY GRID */}
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Spinner size="lg" message="Loading career communities and collectives..." />
        </div>
      ) : communities.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title={search ? 'No matching communities found' : 'No communities yet'}
          description={
            search
              ? `No communities found matching "${search}". Try adjusting your filters or search keywords.`
              : 'Be the pioneer! Create the very first community cohort for your domain or interest.'
          }
          action={
            <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
              <FiPlus className="mr-1.5" /> Create a Community
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((c) => {
            const isUserMember = c.isMember;
            const hasPending = c.hasPendingRequest;

            return (
              <div
                key={c._id}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-4 border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/30 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col gap-3">
                  {/* Card Header: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold shadow-sm">
                      {c.avatar || '🌐'}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {c.category}
                      </span>
                      {c.isPrivate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <FiLock size={10} /> Private
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <FiGlobe size={10} /> Public
                        </span>
                      )}
                      {c.isMentorLed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <FiAward size={10} /> Mentor-Led
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => navigate(`/communities/${c.slug || c._id}`)}
                      className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1"
                    >
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiUsers size={12} /> {c.memberCount || 1} members
                    </span>
                    <span>•</span>
                    <span>{c.postCount || 0} posts</span>
                  </div>

                  {/* Contextual Action Button */}
                  <div>
                    {isUserMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/communities/${c.slug || c._id}`)}
                      >
                        Enter <FiArrowRight className="ml-1" />
                      </Button>
                    ) : c.isPrivate ? (
                      hasPending ? (
                        <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 rounded-lg">
                          <FiClock size={12} /> Pending
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setRequestModalCommunity(c)}
                        >
                          Request Access
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleJoinPublic(c._id)}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create a New Community"
      >
        <form onSubmit={handleCreateCommunity} className="flex flex-col gap-4">
          {createError && (
            <Alert
              type="error"
              message={createError}
              onClose={() => setCreateError('')}
            />
          )}

          <div className="flex items-center gap-3">
            <div className="w-14">
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Avatar</label>
              <input
                type="text"
                value={formAvatar}
                onChange={(e) => setFormAvatar(e.target.value)}
                maxLength={4}
                className="w-full text-center py-2 glass-input bg-transparent text-xl rounded-xl"
                title="Emoji or icon character"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Community Name"
                placeholder="e.g. Distributed Systems Cohort"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What is the mission, target topics, and cohort goal of this community?"
              className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl glass-input bg-transparent"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat} className="dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 justify-center">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Privacy Type</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs mt-1">
                <input
                  type="checkbox"
                  checked={formIsPrivate}
                  onChange={(e) => setFormIsPrivate(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Private (Requires Join Request)
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Community Rules (1 per line)
            </label>
            <textarea
              rows={2}
              value={formRules}
              onChange={(e) => setFormRules(e.target.value)}
              placeholder="e.g. Respect everyone&#10;No commercial spam&#10;Share verified code snippets"
              className="w-full p-2.5 text-xs rounded-xl glass-input bg-transparent"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createLoading}
              isLoading={createLoading}
            >
              Create Community
            </Button>
          </div>
        </form>
      </Modal>

      {/* REQUEST ACCESS TO PRIVATE COMMUNITY MODAL */}
      <Modal
        isOpen={!!requestModalCommunity}
        onClose={() => setRequestModalCommunity(null)}
        title={`Request Access to ${requestModalCommunity?.name || 'Community'}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This is a private community. The community moderators review all membership applications.
            Include a short intro on why you'd like to join and what topics you are focusing on.
          </p>

          {requestError && (
            <Alert
              type="error"
              message={requestError}
              onClose={() => setRequestError('')}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Application Note (Optional)
            </label>
            <textarea
              rows={3}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="e.g. Hi! I'm preparing for backend roles and would love to collaborate on system design problems."
              className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setRequestModalCommunity(null)}
              disabled={requestLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendJoinRequest}
              disabled={requestLoading}
              isLoading={requestLoading}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommunityHub;
