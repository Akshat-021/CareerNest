import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FiSend, FiUser, FiPaperclip, FiSmile, FiCircle } from 'react-icons/fi';
import api from '../services/api';

const ChatRoom = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactTyping, setContactTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch directory list of eligible chat users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/platform/chat/users');
        if (res.data.success) {
          setContacts(res.data.users);
        }
      } catch (err) {
        console.error('Failed to load chat directory:', err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!selectedUser) return;
    const fetchChatHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/platform/chat/messages/${selectedUser._id}`);
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error('Failed to get chat messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChatHistory();
  }, [selectedUser]);

  // Bind real-time socket events for receiving DMs & typing indicators
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (messageData) => {
      // Check if message belongs to current active window
      if (selectedUser && (messageData.sender === selectedUser._id || messageData.receiver === selectedUser._id)) {
        setMessages((prev) => [...prev, messageData]);
      }
    });

    socket.on('typing_status', ({ senderId, isTyping }) => {
      if (selectedUser && senderId === selectedUser._id) {
        setContactTyping(isTyping);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('typing_status');
    };
  }, [socket, selectedUser]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, contactTyping]);

  const handleSend = () => {
    if (!inputText.trim() || !socket) return;

    const messagePayload = {
      senderId: user._id,
      receiverId: selectedUser._id,
      content: inputText,
      mediaUrl: '',
      mediaType: 'text'
    };

    // Emit socket event to backend
    socket.emit('chat_message', messagePayload);

    // Optimistically update local view
    setMessages((prev) => [
      ...prev,
      {
        _id: 'temp-' + Date.now(),
        sender: user._id,
        receiver: selectedUser._id,
        content: inputText,
        createdAt: new Date()
      }
    ]);

    setInputText('');
    
    // Stop typing notification
    socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id, isTyping: false });
    setIsTyping(false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !selectedUser) return;

    if (!isTyping && e.target.value.trim() !== '') {
      setIsTyping(true);
      socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id, isTyping: true });
    } else if (isTyping && e.target.value.trim() === '') {
      setIsTyping(false);
      socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id, isTyping: false });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId.toString());
  };

  return (
    <div className="flex-1 flex glass-panel rounded-2xl overflow-hidden h-[85vh] shadow-xl border border-gray-250/20 dark:border-gray-800/25">
      {/* SIDEBAR - USERS DIRECTORY */}
      <div className="w-64 border-r border-gray-200/50 dark:border-gray-850/50 flex flex-col">
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-850/50">
          <h3 className="font-bold text-sm">Conversations</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {contacts.map((c) => {
            const online = isUserOnline(c._id);
            return (
              <button
                key={c._id}
                onClick={() => setSelectedUser(c)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  selectedUser?._id === c._id
                    ? 'bg-indigo-500/10 text-indigo-500 font-semibold'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
                }`}
              >
                <div className="relative">
                  <img
                    src={c.profileImage || 'https://via.placeholder.com/150'}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{c.name}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">{c.role}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT DISPLAY PANEL */}
      <div className="flex-1 flex flex-col justify-between">
        {selectedUser ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-850/50 flex items-center justify-between bg-gray-50/20 dark:bg-gray-900/10">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.profileImage || 'https://via.placeholder.com/150'}
                  alt="selected user"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold">{selectedUser.name}</h4>
                  <p className="text-[9px] text-gray-400 uppercase flex items-center gap-1.5 mt-0.5">
                    <FiCircle className={isUserOnline(selectedUser._id) ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400'} size={8} />
                    {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto my-6" />
              ) : (
                messages.map((m) => {
                  const isMe = m.sender === user._id || m.senderId === user._id;
                  return (
                    <div key={m._id} className={`flex max-w-[70%] ${isMe ? 'self-end' : 'self-start'}`}>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'
                      }`}>
                        <p>{m.content}</p>
                        <span className="text-[8px] opacity-70 block text-right mt-1.5 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Alert */}
              {contactTyping && (
                <div className="self-start text-[10px] text-gray-400 italic">
                  {selectedUser.name} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-850/50 flex gap-2 items-center">
              <button className="p-2.5 text-gray-400 hover:text-indigo-500 rounded-xl" title="Attach file">
                <FiPaperclip size={16} />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 glass-input"
              />
              <button
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-3 flex items-center justify-center transition-all active:scale-95 shadow"
              >
                <FiSend size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-28">
            <span className="text-4xl">💬</span>
            <h3 className="font-bold text-base mt-2">Platform DMs</h3>
            <p className="text-xs text-gray-400 max-w-sm">No conversation active. Select a student or mentor from the contacts menu to open a direct messaging room.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
