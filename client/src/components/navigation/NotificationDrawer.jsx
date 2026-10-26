import React, { useState, useEffect, useRef } from 'react';
import {
  FiBell, FiX, FiCheck, FiCheckCircle, FiCalendar,
  FiMessageSquare, FiTrendingUp, FiBookOpen, FiInfo
} from 'react-icons/fi';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import Alert from '../feedback/Alert';
import EmptyState from '../feedback/EmptyState';

const TYPE_ICONS = {
  booking: FiCalendar,
  chat: FiMessageSquare,
  streak: FiTrendingUp,
  course: FiBookOpen,
  system: FiInfo,
  info: FiInfo
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const NotificationDrawer = ({ isOpen, onClose, className = '' }) => {
  const { newNotification } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const drawerRef = useRef(null);

  // Fetch persisted notifications from backend
  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/platform/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications from Socket.IO and deduplicate by _id
  useEffect(() => {
    if (!newNotification || !newNotification._id) return;

    setNotifications((prev) => {
      const exists = prev.some((n) => n._id?.toString() === newNotification._id?.toString());
      if (exists) {
        return prev.map((n) => (n._id?.toString() === newNotification._id?.toString() ? newNotification : n));
      }
      return [newNotification, ...prev];
    });
  }, [newNotification]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMarkRead = async (id) => {
    if (!id || markingId) return;
    setMarkingId(id);
    try {
      const res = await api.put(`/api/platform/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((n) => api.put(`/api/platform/notifications/${n._id}/read`))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification Center"
        className={`w-full max-w-sm sm:max-w-md h-full glass-panel border-l border-white/20 dark:border-gray-800/60 shadow-2xl flex flex-col justify-between overflow-hidden ${className}`}
      >
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FiBell size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="primary" size="xs">
                    {unreadCount} new
                  </Badge>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live updates and session alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <FiX size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION FEED */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {error && (
            <Alert
              type="error"
              message={error}
              action={
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="font-bold underline"
                >
                  Retry
                </button>
              }
            />
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Spinner size="lg" label="Loading notifications..." />
              <p className="text-xs text-slate-400">Checking for new updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={FiBell}
              title="No notifications yet"
              description="You are all caught up! New session updates and platform alerts will appear here in real time."
              className="my-auto border-dashed"
            />
          ) : (
            notifications.map((item) => {
              const Icon = TYPE_ICONS[item.type] || FiInfo;
              const isUnread = !item.isRead;

              return (
                <div
                  key={item._id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    isUnread
                      ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/25 shadow-sm'
                      : 'bg-white/40 dark:bg-gray-900/40 border-slate-200/40 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                      isUnread
                        ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs leading-snug font-bold ${
                          isUnread
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {isUnread && (
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleMarkRead(item._id)}
                          disabled={markingId === item._id}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 focus:outline-none focus:underline"
                        >
                          {markingId === item._id ? (
                            <Spinner size="xs" label="Marking read..." />
                          ) : (
                            <FiCheck size={12} aria-hidden="true" />
                          )}
                          Mark read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Real-time notifications authenticated via Socket.IO
          </p>
        </div>
      </aside>
    </div>
  );
};

export default NotificationDrawer;
