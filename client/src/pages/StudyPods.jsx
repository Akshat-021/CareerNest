import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiCheckCircle, FiMessageSquare, FiSend, FiCompass, FiTarget } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudyPods = () => {
  const { user } = useAuth();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPod, setSelectedPod] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState('Full Stack Web Development');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [avatar, setAvatar] = useState('🚀');

  // Chat message
  const [chatInput, setChatInput] = useState('');

  const fetchPods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/platform/study-pods');
      if (res.data.success) {
        setPods(res.data.pods);
        if (res.data.pods.length > 0 && !selectedPod) {
          setSelectedPod(res.data.pods[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load study pods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, []);

  const handleCreatePod = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/platform/study-pods', {
        title,
        description,
        track,
        targetRole,
        avatar
      });
      if (res.data.success) {
        setPods([res.data.pod, ...pods]);
        setSelectedPod(res.data.pod);
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinPod = async (podId) => {
    try {
      const res = await api.post(`/api/platform/study-pods/${podId}/join`);
      if (res.data.success) {
        setPods(pods.map(p => p._id === podId ? res.data.pod : p));
        setSelectedPod(res.data.pod);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedPod) return;
    try {
      const res = await api.post(`/api/platform/study-pods/${selectedPod._id}/messages`, {
        text: chatInput
      });
      if (res.data.success) {
        const updated = { ...selectedPod, messages: res.data.messages };
        setSelectedPod(updated);
        setPods(pods.map(p => p._id === selectedPod._id ? updated : p));
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isMember = selectedPod?.members?.some(m => m.user?._id === user?._id || m.user === user?._id);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <FiUsers size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Peer Study Pods</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Join small collaborative study groups matching your career track. Share goals, review code, and learn together.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="glass-button-primary flex items-center gap-2 text-xs"
        >
          <FiPlus size={16} /> Create Study Pod
        </button>
      </div>

      {/* 2-COLUMN POD WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PODS LIST */}
        <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3 lg:col-span-1 max-h-[75vh] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Learning Pods</h3>
          
          <div className="flex flex-col gap-2.5">
            {pods.map((pod) => {
              const active = selectedPod?._id === pod._id;
              return (
                <div
                  key={pod._id}
                  onClick={() => setSelectedPod(pod)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    active
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'glass-panel border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{pod.avatar || '🚀'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                      {pod.members?.length || 1}/{pod.maxMembers || 6} Members
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mt-2 truncate">{pod.title}</h4>
                  <p className="text-[11px] text-gray-400 truncate">{pod.track}</p>
                </div>
              );
            })}

            {pods.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center">No study pods created yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* ACTIVE POD DETAILS & GROUP CHAT */}
        {selectedPod ? (
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPod.avatar || '🚀'}</span>
                  <h2 className="text-lg font-bold">{selectedPod.title}</h2>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{selectedPod.track} • Target: {selectedPod.targetRole}</p>
              </div>

              {!isMember && (
                <button
                  onClick={() => handleJoinPod(selectedPod._id)}
                  className="glass-button-primary text-xs flex items-center gap-1.5"
                >
                  <FiUsers size={14} /> Join This Pod
                </button>
              )}
            </div>

            {/* WEEKLY GOALS */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1.5">
                <FiTarget /> Weekly Shared Goals
              </h4>
              <div className="flex flex-col gap-1.5">
                {selectedPod.weeklyGoals?.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <FiCheckCircle className="text-emerald-500" />
                    <span>{g.title}</span>
                  </div>
                )) || <p className="text-xs text-gray-400">No active goals yet.</p>}
              </div>
            </div>

            {/* GROUP CHAT STREAM */}
            <div className="flex flex-col gap-3 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pod Discussion Stream</h4>
              
              <div className="glass-panel p-4 rounded-2xl h-64 overflow-y-auto flex flex-col gap-3">
                {selectedPod.messages?.map((msg, idx) => (
                  <div key={idx} className="flex flex-col gap-1 text-xs">
                    <span className="font-bold text-[10px] text-indigo-500">
                      {msg.sender?.name || 'Peer Member'}
                    </span>
                    <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 w-fit max-w-[85%]">
                      {msg.text}
                    </div>
                  </div>
                )) || (
                  <p className="text-xs text-gray-400 m-auto">Start the conversation with your study group!</p>
                )}
              </div>

              {/* CHAT INPUT */}
              {isMember ? (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Share milestone updates, code links, or doubts..."
                    className="w-full glass-input"
                  />
                  <button type="submit" className="glass-button-primary p-3">
                    <FiSend size={14} />
                  </button>
                </form>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Join this pod to participate in discussions.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* CREATE POD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold">Create New Peer Study Pod</h3>
            <form onSubmit={handleCreatePod} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pod Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Full-Stack React & Node Study Pod"
                  className="w-full glass-input mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Career Track</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full glass-input bg-transparent mt-1"
                >
                  <option value="Full Stack Web Development" className="dark:bg-gray-900">Full Stack Web Development</option>
                  <option value="AI & Machine Learning" className="dark:bg-gray-900">AI & Machine Learning</option>
                  <option value="DevOps & Cloud Architecture" className="dark:bg-gray-900">DevOps & Cloud Architecture</option>
                  <option value="Cybersecurity & API Defense" className="dark:bg-gray-900">Cybersecurity & API Defense</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Avatar Emoji</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full glass-input mt-1 text-center text-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="glass-button-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-button-primary text-xs">
                  Launch Study Pod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPods;
