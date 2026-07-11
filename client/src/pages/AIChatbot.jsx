import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiCpu, FiUser } from 'react-icons/fi';
import api from '../services/api';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'careernest',
      content: "Hello! I am CareerNest, your AI Career Assistant. I can help with resume tips, career roadmaps, programming concepts, or suggesting projects. Ask me anything!",
      suggestedActions: ["Explain Web Dev Roadmap", "What skills are missing for DevOps?", "Tips to pass ATS resume scanners"],
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    // Append student message
    const updatedMessages = [
      ...messages,
      { sender: 'student', content: text, timestamp: new Date() }
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map history payload
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
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'careernest',
          content: "Sorry, I encountered an error. Please try again or check your backend connection.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[85vh] glass-panel rounded-2xl overflow-hidden shadow-xl">
      {/* HEADER */}
      <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl"><FiCpu size={20} /></div>
        <div>
          <h2 className="text-sm font-bold">CareerNest Career Advisor</h2>
          <p className="text-[10px] text-indigo-200">Online | Real-Time AI Consulting</p>
        </div>
      </div>

      {/* CONVERSATION AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[80%] ${m.sender === 'student' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`p-2.5 rounded-xl text-indigo-500 bg-indigo-500/10 mt-1 h-fit ${m.sender === 'student' ? 'hidden' : ''}`}>
              <FiCpu size={14} />
            </div>
            <div className="flex flex-col gap-2">
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'student'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
              }`}>
                {m.content}
              </div>

              {/* Action tags helper */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {m.suggestedActions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={() => handleSendMessage(act)}
                      className="text-[10px] font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:text-indigo-500 px-3 py-1.5 rounded-full transition-all"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-start flex gap-3 items-center">
            <div className="p-2.5 rounded-xl text-indigo-500 bg-indigo-500/10"><FiCpu className="animate-spin" size={14} /></div>
            <span className="text-[10px] text-gray-400">CareerNest is brainstorming solutions...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-gray-200/50 dark:border-gray-850/50 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about resume scores, coding gaps, system design rules..."
          className="flex-1 glass-input"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-3 flex items-center justify-center transition-all active:scale-95"
        >
          <FiSend size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
