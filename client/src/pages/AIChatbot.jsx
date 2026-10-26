import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSend, FiCpu, FiUser, FiArrowRight, FiBriefcase, FiTerminal, FiCompass, FiShield } from 'react-icons/fi';
import api from '../services/api';

const AIChatbot = () => {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: 'careernest',
      content: "Hello! I am **CareerNest Copilot**, your context-aware AI Career Intelligence Partner. I have continuous visibility into your Career Profile, skill gaps, and readiness metrics. What would you like to level up today?",
      suggestedActions: [
        "Analyze a Job Description for match %",
        "How can I boost my Career Readiness Score?",
        "Recommend courses for my skill gaps",
        "What questions should I prepare for a React interview?"
      ],
      platformActions: [
        { title: "Run Job Match Scan", link: "/ai-job-analyzer" },
        { title: "Start AI Mock Interview", link: "/ai-interview" }
      ],
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/api/ai/career-profile');
        if (res.data.success) {
          setProfile(res.data.profile);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    const updatedMessages = [
      ...messages,
      { sender: 'student', content: text, timestamp: new Date() }
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.sender === 'careernest' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const res = await api.post('/api/ai/chat', {
        message: text,
        history: historyPayload
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'careernest',
            content: res.data.answer,
            suggestedActions: res.data.suggestedActions || [],
            platformActions: res.data.platformActions || [],
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Copilot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'careernest',
          content: "I ran into a temporary hiccup connecting to the intelligence engine. Please try asking again in a moment.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[85vh] glass-panel rounded-3xl overflow-hidden shadow-2xl">
      {/* COPILOT CONTEXT HEADER */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs">
            <FiCpu size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              CareerNest Copilot
              <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-400 text-gray-950 px-2 py-0.5 rounded-full">
                Context-Aware
              </span>
            </h2>
            <p className="text-[11px] text-indigo-100">
              Synced with: <b>{profile?.targetRole || 'Software Engineer'}</b> • Readiness: <b>{profile?.readinessScore?.overallReadiness || 65}%</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/ai-job-analyzer"
            className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all font-medium flex items-center gap-1.5"
          >
            <FiBriefcase size={12} /> Analyze Job
          </Link>
          <Link
            to="/ai-interview"
            className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all font-medium flex items-center gap-1.5"
          >
            <FiTerminal size={12} /> Mock Interview
          </Link>
        </div>
      </div>

      {/* CONVERSATION AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${m.sender === 'student' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            <div
              className={`p-2.5 rounded-2xl text-indigo-500 bg-indigo-500/10 mt-1 h-fit shadow-xs ${
                m.sender === 'student' ? 'hidden' : ''
              }`}
            >
              <FiCpu size={16} />
            </div>

            <div className="flex flex-col gap-2.5">
              <div
                className={`p-4 rounded-3xl text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                  m.sender === 'student'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
                    : 'glass-panel text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200/60 dark:border-gray-800/60'
                }`}
              >
                {m.content}
              </div>

              {/* PLATFORM ONE-CLICK ACTION CARDS */}
              {m.platformActions && m.platformActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.platformActions.map((action, aIdx) => (
                    <Link
                      key={aIdx}
                      to={action.link}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-bold hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      ⚡ {action.title} <FiArrowRight size={12} />
                    </Link>
                  ))}
                </div>
              )}

              {/* SUGGESTED CHIPS */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.suggestedActions.map((s, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(s)}
                      className="text-[11px] px-3 py-1 rounded-full glass-panel hover:bg-indigo-500/10 hover:text-indigo-500 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800/50 transition-all text-left"
                    >
                      💬 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="self-start flex gap-3 max-w-[80%]">
            <div className="p-2.5 rounded-2xl text-indigo-500 bg-indigo-500/10 mt-1">
              <FiCpu size={16} />
            </div>
            <div className="p-3.5 rounded-2xl glass-panel rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-4 glass-panel border-t border-gray-200/50 dark:border-gray-800/50 flex flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask CareerNest Copilot about roadmap milestones, interview answers, or code architectures..."
            className="w-full glass-input text-xs"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="glass-button-primary p-3 rounded-xl disabled:opacity-50"
          >
            <FiSend size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatbot;
