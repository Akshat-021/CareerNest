const mongoose = require('mongoose');
const dns = require('dns');

let lastError = null;

// Use public reliable DNS servers to ensure SRV record resolution works in containerized environments (Render, Vercel)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // If restricted, fallback to default
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // On Vercel, if MONGO_URI is missing, fail immediately without trying localhost
  if (process.env.VERCEL && !process.env.MONGO_URI) {
    lastError = 'MONGO_URI environment variable is not defined on Vercel.';
    console.error('Database Configuration Warning:', lastError);
    return null;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-portal';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    lastError = null;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    lastError = error.message;
    console.error(`Database Connection Warning: ${error.message}. Continuing server execution without database connection...`);
    return null;
  }
};

connectDB.getLastError = () => lastError;

module.exports = connectDB;


