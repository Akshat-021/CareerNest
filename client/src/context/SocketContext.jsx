import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newNotification, setNewNotification] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket pointing to backend
    const targetUrl = import.meta.env.VITE_BACKEND_URL || (window.location.origin.includes('5173') ? 'http://localhost:5001' : window.location.origin);
    const newSocket = io(targetUrl, {
      transports: ['websocket'],
      upgrade: false
    });

    setSocket(newSocket);

    // Identify user
    newSocket.emit('join_user', user._id);

    // Online status event listener
    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    // Real-time notifications event listener
    newSocket.on('new_notification', (notification) => {
      setNewNotification(notification);
    });

    return () => {
      newSocket.off('online_users');
      newSocket.off('new_notification');
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, newNotification, setNewNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
