const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // On Vercel, if MONGO_URI is missing, fail immediately without trying localhost
  if (process.env.VERCEL && !process.env.MONGO_URI) {
    console.error('Database Configuration Warning: MONGO_URI environment variable is not defined on Vercel.');
    return null;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-portal';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Warning: ${error.message}. Continuing server execution without database connection...`);
    return null;
  }
};

module.exports = connectDB;

