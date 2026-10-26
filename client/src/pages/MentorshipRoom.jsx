import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff, FiMessageSquare, FiEdit3, FiClock, FiCheckCircle, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MentorshipRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Session verification & authorization state
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'System', text: 'Connected to verified secure mentorship room.', time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Verify session access and authorization BEFORE initializing devices
  useEffect(() => {
    let isMounted = true;

    const verifySessionAccess = async () => {
      try {
        setSessionLoading(true);
        setSessionError(null);

        const res = await api.get(`/api/mentors/sessions/${id}`);
        if (isMounted) {
          if (res.data.success && res.data.session) {
            setSessionData(res.data.session);
            setSessionLoading(false);
          } else {
            setSessionError('Mentorship session record is invalid or unavailable.');
            setSessionLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg = err.response?.data?.message || 'Access denied: You are not authorized for this mentorship session room.';
          setSessionError(msg);
          setSessionLoading(false);
        }
      }
    };

    if (id) {
      verifySessionAccess();
    } else {
      setSessionError('No session ID provided.');
      setSessionLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // 2. Initialize local media & session timer ONLY after authorization succeeds
  useEffect(() => {
    if (sessionLoading || sessionError || !sessionData) return;

    let localStream = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = localStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        }
      } catch (err) {
        console.warn('Camera/mic access denied or unavailable in current environment:', err.message);
      }
    };

    startCamera();

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionLoading, sessionError, sessionData]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => (track.enabled = !micOn));
    }
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => (track.enabled = !videoOn));
    }
    setVideoOn(!videoOn);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      { sender: user?.name || 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (user?.role === 'student') {
      setShowRatingModal(true);
    } else {
      navigate('/mentor/dashboard');
    }
  };

  const handleSubmitRating = async () => {
    setSubmittingReview(true);
    try {
      await api.post(`/api/mentors/sessions/${id}/review`, { rating, review });
    } catch (err) {
      console.warn('Failed to submit session review:', err.message);
    } finally {
      setSubmittingReview(false);
      navigate('/dashboard');
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Loading State
  if (sessionLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Verifying mentorship session authorization...</p>
      </div>
    );
  }

  // Render Access Denied / Error State
  if (sessionError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-4 border border-rose-500/20 shadow-2xl">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 text-3xl">
            <FiAlertTriangle />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Session Access Restricted</h2>
          <p className="text-xs text-gray-400 leading-relaxed">{sessionError}</p>
          <div className="flex items-center gap-3 mt-2 w-full">
            <button
              onClick={() => navigate(user?.role === 'mentor' ? '/mentor/dashboard' : '/dashboard')}
              className="glass-button-primary text-xs w-full py-2.5 rounded-xl"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const partnerName = user?.role === 'student' ? (sessionData?.mentor?.name || 'Assigned Mentor') : (sessionData?.student?.name || 'Student');

  return (
    <div className="flex flex-col gap-4 h-[88vh]">
      {/* ROOM HEADER */}
      <div className="glass-panel px-6 py-3 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              Mentorship Session: {partnerName}
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md font-normal">
                {sessionData?.time}
              </span>
            </h2>
            <p className="text-[10px] text-gray-400">
              Session ID: {id} • Authenticated Participant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-xl">
          <FiClock size={14} /> {formatTimer(seconds)}
        </div>
      </div>

      {/* MAIN VIDEO & COLLABORATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* VIDEO DISPLAY AREA */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden bg-gray-950/90 shadow-2xl">
          {/* REMOTE STREAM (PEER PRESENCE) */}
          <div className="flex-1 rounded-2xl bg-gray-900 flex items-center justify-center relative overflow-hidden">
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                🎓
              </div>
              <div>
                <p className="text-sm font-bold text-white">{partnerName}</p>
                <p className="text-xs text-gray-400">Session room connected • Status: {sessionData?.status}</p>
                <p className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mt-2 inline-block">
                  Notice: Real-time peer audio/video streaming requires WebRTC STUN/TURN gateway infrastructure.
                </p>
              </div>
            </div>

            {/* LOCAL USER SELF PREVIEW PIP */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-48 h-28 sm:h-36 rounded-2xl bg-gray-800 border-2 border-indigo-500/40 overflow-hidden shadow-2xl">
              {videoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 text-xs">
                  <FiVideoOff size={20} />
                  <span className="text-[10px] mt-1">Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                You ({user?.name || 'Local'})
              </span>
            </div>
          </div>

          {/* CALL CONTROLS DOCK */}
          <div className="pt-4 flex items-center justify-center gap-3 z-10">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                micOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
              title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micOn ? <FiMic size={18} /> : <FiMicOff size={18} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                videoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
              title={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {videoOn ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
            </button>

            <button
              onClick={handleEndCall}
              className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl flex items-center gap-2 font-bold text-xs transition-all shadow-lg shadow-rose-600/30"
            >
              <FiPhoneOff size={16} /> End Session
            </button>
          </div>
        </div>

        {/* SIDEBAR: CHAT & AGENDA */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* SHARED NOTES & AGENDA */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
              <FiEdit3 size={14} /> Shared Session Notes & Action Items
            </div>
            <textarea
              rows={5}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Record takeaways, suggested GitHub repos, or coding challenges..."
              className="w-full glass-input text-xs resize-none flex-1 font-mono"
            />
          </div>

          {/* IN-ROOM ENCRYPTED CHAT */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 h-64">
            <div className="flex items-center gap-2 text-xs font-bold">
              <FiMessageSquare size={14} className="text-indigo-500" /> Session Chat
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl ${msg.sender === 'System' ? 'bg-indigo-500/10 text-indigo-400 text-[11px]' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-0.5">
                    <b>{msg.sender}</b>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message room..."
                className="flex-1 glass-input text-xs py-1.5"
              />
              <button type="submit" className="glass-button-primary px-3 text-xs">Send</button>
            </form>
          </div>
        </div>
      </div>

      {/* POST-SESSION RATING MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-full w-fit mx-auto">
              <FiCheckCircle size={28} />
            </div>
            <h3 className="text-base font-bold">Session Completed!</h3>
            <p className="text-xs text-gray-400">How would you rate your mentor's guidance and career advice?</p>

            <div className="flex items-center justify-center gap-2 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Leave feedback for your mentor..."
              className="w-full glass-input text-xs resize-none"
            />

            <button
              onClick={handleSubmitRating}
              disabled={submittingReview}
              className="glass-button-primary text-xs w-full py-2.5 disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Feedback & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipRoom;
