import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiUsers,
  FiLock,
  FiGlobe,
  FiMessageSquare,
  FiThumbsUp,
  FiCornerDownRight,
  FiFlag,
  FiEdit2,
  FiTrash2,
  FiSettings,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiSend,
  FiAlertCircle,
  FiShield,
  FiBookOpen,
  FiAward
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Modal, Badge, Spinner } from '../components/common';
import { Alert, EmptyState } from '../components/feedback';

const CommunityDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Post composer state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [composerError, setComposerError] = useState('');

  // Threaded replies state: map of postId -> { open: boolean, replies: [], loading: boolean, newReplyText: '' }
  const [threadedReplies, setThreadedReplies] = useState({});

  // Edit Post Modal State
  const [editModalPost, setEditModalPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Post Modal State
  const [deleteModalPostId, setDeleteModalPostId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Report Modal State
  const [reportModalTarget, setReportModalTarget] = useState(null); // { type, id, title }
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  // Request Access Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const res = await api.get(`/api/communities/${idOrSlug}`);
      if (res.data.success) {
        setCommunity(res.data.community);
        if (res.data.community.isMember || !res.data.community.isPrivate || user?.role === 'admin') {
          fetchCommunityPosts(res.data.community._id);
        }
      } else {
        setError(res.data.message || 'Community not found.');
      }
    } catch (err) {
      console.error('Failed to load community:', err);
      setError(err.response?.data?.message || 'Failed to load community details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityPosts = async (communityId) => {
    setPostsLoading(true);
    try {
      const res = await api.get(`/api/communities/${communityId}/posts`);
      if (res.data.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [idOrSlug]);

  const handleJoinPublic = async () => {
    if (!community) return;
    try {
      const res = await api.post(`/api/communities/${community._id}/join`);
      if (res.data.success) {
        setActionSuccessMsg(`Welcome to ${community.name}!`);
        fetchCommunityData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join community.');
    }
  };

  const handleSendJoinRequest = async () => {
    if (!community) return;
    setRequestLoading(true);
    try {
      const res = await api.post(`/api/communities/${community._id}/request-join`, {
        requestMessage: requestNote
      });
      if (res.data.success) {
        setIsRequestModalOpen(false);
        setActionSuccessMsg('Join request submitted! Awaiting moderator approval.');
        fetchCommunityData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community || !window.confirm(`Are you sure you want to leave ${community.name}?`)) return;
    try {
      const res = await api.post(`/api/communities/${community._id}/leave`);
      if (res.data.success) {
        setActionSuccessMsg(`You have left ${community.name}.`);
        fetchCommunityData();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave community.');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) {
      setComposerError('Post content cannot be empty.');
      return;
    }
    setSubmittingPost(true);
    setComposerError('');
    try {
      const res = await api.post(`/api/communities/${community._id}/posts`, {
        title: postTitle.trim(),
        content: postContent.trim()
      });
      if (res.data.success) {
        setPostTitle('');
        setPostContent('');
        setPosts([res.data.post, ...posts]);
        setActionSuccessMsg('Discussion post published successfully!');
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setComposerError(err.response?.data?.message || 'Failed to publish post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await api.post(`/api/communities/${community._id}/posts/${postId}/like`);
      if (res.data.success) {
        setPosts(
          posts.map((p) =>
            p._id === postId
              ? { ...p, hasLiked: res.data.hasLiked, likeCount: res.data.likeCount }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const toggleRepliesView = async (postId) => {
    const current = threadedReplies[postId] || { open: false, replies: [], loading: false, newReplyText: '' };
    if (!current.open) {
      // Fetch replies
      setThreadedReplies({
        ...threadedReplies,
        [postId]: { ...current, open: true, loading: true }
      });
      try {
        const res = await api.get(`/api/communities/${community._id}/posts/${postId}/replies`);
        if (res.data.success) {
          setThreadedReplies((prev) => ({
            ...prev,
            [postId]: { ...prev[postId], open: true, loading: false, replies: res.data.replies || [] }
          }));
        }
      } catch (err) {
        setThreadedReplies((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], open: true, loading: false }
        }));
      }
    } else {
      setThreadedReplies({
        ...threadedReplies,
        [postId]: { ...current, open: false }
      });
    }
  };

  const handleAddReply = async (postId) => {
    const state = threadedReplies[postId];
    if (!state || !state.newReplyText.trim()) return;

    try {
      const res = await api.post(`/api/communities/${community._id}/posts/${postId}/replies`, {
        content: state.newReplyText.trim()
      });
      if (res.data.success) {
        setThreadedReplies((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            newReplyText: '',
            replies: [...prev[postId].replies, res.data.reply]
          }
        }));
        // Update reply count in feed
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p._id === postId ? { ...p, replyCount: (p.replyCount || 0) + 1 } : p
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit reply');
    }
  };

  const handleOpenEdit = (post) => {
    setEditModalPost(post);
    setEditTitle(post.title || '');
    setEditContent(post.content || '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editModalPost || !editContent.trim()) return;
    setEditLoading(true);
    setEditError('');
    try {
      const res = await api.patch(`/api/communities/${community._id}/posts/${editModalPost._id}`, {
        title: editTitle.trim(),
        content: editContent.trim()
      });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === editModalPost._id ? { ...p, ...res.data.post } : p))
        );
        setEditModalPost(null);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteModalPostId) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/api/communities/${community._id}/posts/${deleteModalPostId}`);
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== deleteModalPostId));
        setDeleteModalPostId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportModalTarget) return;
    setReportLoading(true);
    setReportError('');
    try {
      const res = await api.post(`/api/communities/${community._id}/report`, {
        targetType: reportModalTarget.type,
        targetId: reportModalTarget.id,
        reason: reportReason,
        description: reportDescription
      });
      if (res.data.success) {
        setActionSuccessMsg(res.data.message || 'Report submitted for review.');
        setReportModalTarget(null);
        setReportDescription('');
        setTimeout(() => setActionSuccessMsg(''), 4000);
      }
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Spinner size="lg" message="Loading community discussion space..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="py-12 flex flex-col gap-4">
        <EmptyState
          icon={FiAlertCircle}
          title="Community Unavailable"
          description={error || 'The requested community could not be found or has been removed.'}
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/communities')}>
              <FiArrowLeft className="mr-1.5" /> Back to Communities
            </Button>
          }
        />
      </div>
    );
  }

  const isStaff = community.userRole === 'owner' || community.userRole === 'moderator' || user?.role === 'admin';
  const isMember = community.isMember;

  return (
    <div className="flex flex-col gap-6">
      {/* NAVIGATION CRUMB */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/communities')}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft size={14} /> Back to Communities
        </button>

        {isStaff && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/communities/${community.slug || community._id}/manage`)}
          >
            <FiSettings className="mr-1.5" /> Manage Community
            {community.pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {community.pendingRequestsCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {actionSuccessMsg && (
        <Alert
          type="success"
          message={actionSuccessMsg}
          onClose={() => setActionSuccessMsg('')}
        />
      )}

      {/* 1. COMMUNITY HERO BANNER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-4xl shadow-inner">
            {community.avatar || '🌐'}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {community.category}
              </span>
              {community.isPrivate ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <FiLock size={10} /> Private Community
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <FiGlobe size={10} /> Public
                </span>
              )}
              {community.isMentorLed && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <FiAward size={10} /> Mentor-Led
                </span>
              )}
              {community.userRole && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase">
                  {community.userRole}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {community.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {community.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <FiUsers size={13} /> {community.memberCount || 1} members
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FiMessageSquare size={13} /> {community.postCount || 0} discussions
              </span>
              <span>•</span>
              <span>Created by {community.creator?.name || 'Cohort Lead'}</span>
            </div>
          </div>
        </div>

        {/* HERO ACTIONS */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          {isMember ? (
            <Button size="sm" variant="outline" onClick={handleLeaveCommunity}>
              Leave Community
            </Button>
          ) : community.isPrivate ? (
            community.hasPendingRequest ? (
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 rounded-xl">
                <FiClock size={14} /> Request Pending Review
              </span>
            ) : (
              <Button size="md" variant="primary" onClick={() => setIsRequestModalOpen(true)}>
                Request Access to Join
              </Button>
            )
          ) : (
            <Button size="md" variant="primary" onClick={handleJoinPublic}>
              <FiCheck className="mr-1.5" /> Join Community
            </Button>
          )}
        </div>
      </div>

      {/* 2. PRIVATE ACCESS LOCK IF USER NOT A MEMBER */}
      {community.isPrivate && !isMember && user?.role !== 'admin' ? (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4 border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl">
            <FiLock />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Private Member-Only Community
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            Discussions, resources, and project collaboration in this cohort are reserved for approved members.
            Submit a join request to participate.
          </p>
          {community.hasPendingRequest ? (
            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FiClock size={14} /> Your application has been submitted and is awaiting moderator review.
            </span>
          ) : (
            <Button variant="primary" size="md" onClick={() => setIsRequestModalOpen(true)}>
              Request to Join This Cohort
            </Button>
          )}
        </div>
      ) : (
        /* 3. COMMUNITY FEED & INTERACTION AREA */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MAIN POST FEED (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Post Composer (Only if Member or Admin) */}
            {isMember || user?.role === 'admin' ? (
              <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  Start a Community Discussion
                </h3>
                {composerError && (
                  <Alert
                    type="error"
                    message={composerError}
                    onClose={() => setComposerError('')}
                  />
                )}
                <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Discussion Topic or Question (Optional)"
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input bg-transparent font-semibold"
                    aria-label="Discussion topic"
                  />
                  <textarea
                    rows={3}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={`Share an insight, question, resource, or project with ${community.name}...`}
                    className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
                    required
                    aria-label="Discussion content"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={submittingPost}
                      isLoading={submittingPost}
                    >
                      <FiSend className="mr-1.5" /> Publish Post
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}

            {/* Post List */}
            {postsLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" message="Loading discussion threads..." />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                icon={FiMessageSquare}
                title="No discussions yet"
                description="Be the first to break the ice and start a conversation in this community!"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map((post) => {
                  const isAuthor = user && post.author?._id === user._id;
                  const canModerate = isStaff || isAuthor;
                  const repliesState = threadedReplies[post._id] || {
                    open: false,
                    replies: [],
                    loading: false,
                    newReplyText: ''
                  };

                  return (
                    <div
                      key={post._id}
                      className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3.5 transition-all"
                    >
                      {/* Post Header: Author, Role, Time */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                            {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                {post.author?.name || 'Community Member'}
                              </span>
                              {post.author?.role === 'mentor' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold uppercase">
                                  Mentor
                                </span>
                              )}
                              {post.isPinned && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-bold">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(post.createdAt).toLocaleDateString()} at{' '}
                              {new Date(post.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {post.isEdited && ' • (edited)'}
                            </span>
                          </div>
                        </div>

                        {/* Options / Moderation Actions */}
                        <div className="flex items-center gap-1.5">
                          {isAuthor && (
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit post"
                              aria-label="Edit post"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          )}
                          {canModerate && (
                            <button
                              onClick={() => setDeleteModalPostId(post._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete post"
                              aria-label="Delete post"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setReportModalTarget({
                                type: 'CommunityPost',
                                id: post._id,
                                title: post.title || post.content.slice(0, 30)
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Report post"
                            aria-label="Report post"
                          >
                            <FiFlag size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div>
                        {post.title && (
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                            {post.title}
                          </h4>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Action Bar (Like, Reply toggle) */}
                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleToggleLike(post._id)}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                              post.hasLiked
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 hover:text-indigo-500'
                            }`}
                            aria-label="Like post"
                          >
                            <FiThumbsUp size={13} />
                            <span>{post.likeCount || 0}</span>
                          </button>

                          <button
                            onClick={() => toggleRepliesView(post._id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-500 transition-colors"
                            aria-label="View replies"
                          >
                            <FiMessageSquare size={13} />
                            <span>{post.replyCount || 0} Replies</span>
                          </button>
                        </div>

                        <button
                          onClick={() => toggleRepliesView(post._id)}
                          className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-1"
                        >
                          <FiCornerDownRight size={12} />
                          {repliesState.open ? 'Hide Discussion' : 'Reply & Discuss'}
                        </button>
                      </div>

                      {/* THREADED REPLIES ACCORDION */}
                      {repliesState.open && (
                        <div className="mt-2 pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-3 pl-3 sm:pl-6 border-l-2 border-indigo-500/20">
                          {repliesState.loading ? (
                            <div className="py-3 flex justify-center">
                              <Spinner size="sm" message="Loading replies..." />
                            </div>
                          ) : (
                            <>
                              {repliesState.replies.length > 0 ? (
                                <div className="flex flex-col gap-2.5">
                                  {repliesState.replies.map((reply) => (
                                    <div
                                      key={reply._id}
                                      className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-1.5 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">
                                          {reply.author?.name || 'Member'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(reply.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">No replies yet. Start the thread!</p>
                              )}

                              {/* Threaded Reply Composer */}
                              {isMember || user?.role === 'admin' ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={repliesState.newReplyText}
                                    onChange={(e) =>
                                      setThreadedReplies({
                                        ...threadedReplies,
                                        [post._id]: { ...repliesState, newReplyText: e.target.value }
                                      })
                                    }
                                    placeholder="Write a nested reply..."
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl glass-input bg-transparent"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddReply(post._id);
                                      }
                                    }}
                                  />
                                  <Button size="sm" variant="primary" onClick={() => handleAddReply(post._id)}>
                                    Reply
                                  </Button>
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIDEBAR: COMMUNITY RULES & INFO (1 col) */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* Community Rules Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <FiShield className="text-indigo-500" /> Community Standards
              </h3>
              {community.rules && community.rules.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {community.rules.map((rule, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="font-bold text-indigo-500">{idx + 1}.</span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">
                  Standard platform guidelines apply: professional conduct, verified career support, and zero harassment.
                </p>
              )}
            </div>

            {/* Related Workflows */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                Connected Learning Tools
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <Link
                  to="/courses"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-500/10 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  <FiBookOpen size={14} className="text-indigo-500" /> Browse Prep Courses
                </Link>
                <Link
                  to="/challenges"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-500/10 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  <FiAward size={14} className="text-emerald-500" /> Coding Arena Practice
                </Link>
                <Link
                  to="/ai-interview"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-500/10 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  <FiUsers size={14} className="text-amber-500" /> Mock Technical Interview
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POST MODAL */}
      <Modal
        isOpen={!!editModalPost}
        onClose={() => setEditModalPost(null)}
        title="Edit Discussion Post"
      >
        <div className="flex flex-col gap-4">
          {editError && <Alert type="error" message={editError} />}
          <Input
            label="Title (Optional)"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Content</label>
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 text-xs rounded-xl glass-input bg-transparent leading-relaxed"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setEditModalPost(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={editLoading} isLoading={editLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE POST CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteModalPostId}
        onClose={() => setDeleteModalPostId(null)}
        title="Delete Discussion Post"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete this discussion post? This action will remove the post and its thread from the community feed.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteModalPostId(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeletePost} disabled={deleteLoading} isLoading={deleteLoading}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* REPORT CONTENT MODAL */}
      <Modal
        isOpen={!!reportModalTarget}
        onClose={() => setReportModalTarget(null)}
        title="Report Content to Community Moderators"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reporting: <span className="font-semibold text-slate-700 dark:text-slate-200">"{reportModalTarget?.title}"</span>
          </p>
          {reportError && <Alert type="error" message={reportError} />}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full py-2.5 px-3 text-xs rounded-xl glass-input bg-transparent"
            >
              <option value="spam">Spam / Unsolicited Promotion</option>
              <option value="harassment">Harassment or Abuse</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other Violation</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Additional Context</label>
            <textarea
              rows={3}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Explain why this content violates community standards..."
              className="w-full p-2.5 text-xs rounded-xl glass-input bg-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setReportModalTarget(null)} disabled={reportLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmitReport} disabled={reportLoading} isLoading={reportLoading}>
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* REQUEST ACCESS MODAL */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={`Request Access to ${community.name}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tell the community moderators a bit about your background and what you want to learn or build in this cohort.
          </p>
          <textarea
            rows={3}
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            placeholder="e.g. Preparing for summer internship technical rounds, focusing on React and system design."
            className="w-full p-3 text-xs rounded-xl glass-input bg-transparent"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={requestLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendJoinRequest} disabled={requestLoading} isLoading={requestLoading}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CommunityDetail;
