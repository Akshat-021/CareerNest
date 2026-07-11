import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiThumbsUp, FiSend, FiCornerDownRight, FiPlusCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const ForumBoard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  
  // Create post states
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [createMsg, setCreateMsg] = useState('');

  // Reply states
  const [replyPostId, setReplyPostId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/platform/forum?category=${category}`);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Failed to load forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const res = await api.post('/api/platform/forum', { title, content, category: postCategory });
      if (res.data.success) {
        setCreateMsg('Topic posted successfully!');
        setTitle('');
        setContent('');
        setTimeout(() => {
          setShowCreate(false);
          setCreateMsg('');
          fetchPosts(); // Refresh board
        }, 1500);
      }
    } catch (err) {
      setCreateMsg('Failed to create topic.');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await api.put(`/api/platform/forum/${postId}/like`);
      if (res.data.success) {
        // Optimistic refresh
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleReplyPost = async (postId) => {
    if (!replyText.trim()) return;

    try {
      const res = await api.post(`/api/platform/forum/${postId}/reply`, { content: replyText });
      if (res.data.success) {
        setReplyText('');
        setReplyPostId(null);
        fetchPosts(); // Refresh replies
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discussion Forum</h1>
          <p className="text-xs text-gray-400 font-sans">Share notes, ask questions, discuss assignments, and receive feedback from verified mentors.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="glass-button-primary flex items-center gap-1.5"
        >
          <FiPlusCircle /> {showCreate ? 'Close Form' : 'New Topic'}
        </button>
      </div>

      {/* CREATE TOPIC FORM */}
      {showCreate && (
        <form onSubmit={handleCreatePost} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 max-w-2xl">
          <h3 className="font-bold text-sm">Create New Discussion Topic</h3>
          {createMsg && <p className="text-xs font-semibold text-indigo-500">{createMsg}</p>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Help understanding React reconciliation Virtual DOM layers"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Category Tag</label>
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="w-full glass-input bg-transparent"
              >
                <option value="General" className="dark:bg-gray-900">General</option>
                <option value="System Design" className="dark:bg-gray-900">System Design</option>
                <option value="React" className="dark:bg-gray-900">React & Frontend</option>
                <option value="NodeJS" className="dark:bg-gray-900">NodeJS & APIs</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Discussion Content</label>
            <textarea
              required
              placeholder="Write details about your problem, code blocks, or study notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 glass-input resize-none"
            />
          </div>

          <button type="submit" className="glass-button-primary w-fit self-end text-xs">
            Post Topic
          </button>
        </form>
      )}

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2">
        {['', 'General', 'System Design', 'React', 'NodeJS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === cat
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-gray-900 border border-gray-255/10 dark:border-gray-800'
            }`}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {/* FEED LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-12">No topics posted in this category yet.</p>
      ) : (
        <div className="flex flex-col gap-6 max-w-4xl">
          {posts.map((post) => (
            <div key={post._id} className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-gray-200/50 dark:border-gray-800/40">
              {/* Post User Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.user?.profileImage || 'https://via.placeholder.com/150'}
                    alt="user"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{post.user?.name}</span>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                        post.user?.role === 'mentor' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {post.user?.role}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-full">{post.category}</span>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="font-bold text-sm mb-1 leading-snug">{post.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans">{post.content}</p>
              </div>

              {/* Actions & Likes count */}
              <div className="flex items-center gap-4 border-t border-gray-250/20 dark:border-gray-800/25 pt-3 text-xs font-semibold text-gray-400">
                <button
                  onClick={() => handleLikePost(post._id)}
                  className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                >
                  <FiThumbsUp /> Like ({post.likes.length})
                </button>
                <button
                  onClick={() => setReplyPostId(replyPostId === post._id ? null : post._id)}
                  className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                >
                  <FiMessageSquare /> Reply ({post.replies.length})
                </button>
              </div>

              {/* REPLIES EXPANDABLE SECTION */}
              {replyPostId === post._id && (
                <div className="flex flex-col gap-3 border-t border-gray-250/10 dark:border-gray-800/10 pt-4 bg-gray-50/[0.01] p-3 rounded-xl">
                  {post.replies.map((rep, repIdx) => (
                    <div key={repIdx} className="flex gap-3 items-start text-xs border-b border-gray-200/30 dark:border-gray-850/30 pb-2 last:border-b-0 last:pb-0">
                      <FiCornerDownRight className="text-gray-400 mt-1" />
                      <img
                        src={rep.user?.profileImage || 'https://via.placeholder.com/150'}
                        alt="rep user"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700 dark:text-gray-200">{rep.user?.name}</span>
                          <span className="text-[8px] text-gray-400">{new Date(rep.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{rep.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply Input Form */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Write your answer or feedback..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 glass-input text-xs"
                    />
                    <button
                      onClick={() => handleReplyPost(post._id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2.5 flex items-center justify-center transition-all active:scale-95 shadow"
                    >
                      <FiSend size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumBoard;
