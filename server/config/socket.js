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

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins with their user ID
    socket.on('join_user', (userId) => {
      if (userId) {
        userSocketMap.set(userId.toString(), socket.id);
        socket.userId = userId.toString();
        console.log(`User ${userId} associated with socket ${socket.id}`);
        
        // Broadcast online status
        io.emit('online_users', Array.from(userSocketMap.keys()));
      }
    });

    // Handle real-time chat messages
    socket.on('chat_message', async (messageData) => {
      try {
        const Message = require('../models/Message');
        const savedMessage = await Message.create({
          sender: messageData.senderId,
          receiver: messageData.receiverId,
          content: messageData.content,
          mediaUrl: messageData.mediaUrl || '',
          mediaType: messageData.mediaType || 'text'
        });

        const recipientSocketId = userSocketMap.get(messageData.receiverId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_message', {
            _id: savedMessage._id,
            sender: messageData.senderId,
            receiver: messageData.receiverId,
            content: messageData.content,
            mediaUrl: messageData.mediaUrl || '',
            mediaType: messageData.mediaType || 'text',
            createdAt: savedMessage.createdAt
          });
        }
      } catch (error) {
        console.error('Socket message save failed:', error);
      }
    });

    // Handle typing status
    socket.on('typing', ({ senderId, receiverId, isTyping }) => {
      const recipientSocketId = userSocketMap.get(receiverId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_status', { senderId, isTyping });
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

// Send real-time notification to a specific user
const sendRealTimeNotification = (userId, notification) => {
  try {
    if (ioInstance) {
      const socketId = userSocketMap.get(userId.toString());
      if (socketId) {
        ioInstance.to(socketId).emit('new_notification', notification);
        return true;
      }
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
