const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance;
const userSocketMap = new Map(); // userId -> socketId

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  // JWT Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('Socket authentication failed: JWT_SECRET environment variable is missing.');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      console.warn('Socket connection authentication rejected:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`Authenticated socket connected: ${socket.id} for user ${userId}`);

    // Map user to active socket and join personal room
    userSocketMap.set(userId, socket.id);
    socket.join(`user_${userId}`);

    // Broadcast online status
    io.emit('online_users', Array.from(userSocketMap.keys()));

    // Backwards-compatible join_user (strictly verified to authenticated user)
    socket.on('join_user', (requestedUserId) => {
      // Ignore client-requested ID if mismatched; enforce socket.userId
      userSocketMap.set(userId, socket.id);
      socket.join(`user_${userId}`);
      io.emit('online_users', Array.from(userSocketMap.keys()));
    });

    // Handle real-time chat messages with verified sender identity
    socket.on('chat_message', async (messageData) => {
      try {
        const senderId = socket.userId; // Derived strictly from verified session
        const receiverId = messageData?.receiverId;
        const content = messageData?.content?.trim();

        if (!receiverId || !content) return;

        const Message = require('../models/Message');
        const savedMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          mediaUrl: messageData.mediaUrl || '',
          mediaType: messageData.mediaType || 'text'
        });

        const messagePayload = {
          _id: savedMessage._id,
          sender: senderId,
          receiver: receiverId,
          content: savedMessage.content,
          mediaUrl: savedMessage.mediaUrl,
          mediaType: savedMessage.mediaType,
          createdAt: savedMessage.createdAt
        };

        // Emit to recipient's room
        io.to(`user_${receiverId}`).emit('receive_message', messagePayload);
        
        // Also fallback emit to specific socket ID if present in map
        const recipientSocketId = userSocketMap.get(receiverId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_message', messagePayload);
        }

        socket.emit('message_sent', messagePayload);
      } catch (error) {
        console.error('Socket message save failed:', error);
      }
    });

    // Handle typing status with verified sender identity
    socket.on('typing', ({ receiverId, isTyping }) => {
      const senderId = socket.userId;
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('typing_status', { senderId, isTyping });
        const recipientSocketId = userSocketMap.get(receiverId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing_status', { senderId, isTyping });
        }
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        io.emit('online_users', Array.from(userSocketMap.keys()));
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized!');
  }
  return ioInstance;
};

// Send real-time notification to a specific user and persist in database
const sendRealTimeNotification = async (userId, notification) => {
  try {
    const Notification = require('../models/Notification');
    const targetId = userId ? userId.toString() : null;
    if (!targetId) return false;

    // Persist notification to database if target is a valid ObjectId
    let savedNotification = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      try {
        savedNotification = await Notification.create({
          user: targetId,
          recipient: targetId,
          title: notification.title || 'Notification',
          message: notification.message || '',
          type: notification.type || 'info'
        });
      } catch (dbErr) {
        console.error('Failed to persist notification:', dbErr.message);
      }
    }

    const payload = savedNotification ? savedNotification.toObject() : notification;

    if (ioInstance) {
      ioInstance.to(`user_${targetId}`).emit('new_notification', payload);
      const socketId = userSocketMap.get(targetId);
      if (socketId) {
        ioInstance.to(socketId).emit('new_notification', payload);
      }
      return true;
    }
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
  return false;
};

module.exports = {
  initSocket,
  getIo,
  sendRealTimeNotification,
  userSocketMap
};
