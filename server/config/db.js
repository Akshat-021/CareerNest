const mongoose = require('mongoose');
const dns = require('dns');

let lastError = null;

// Use public reliable DNS servers to ensure SRV record resolution works in containerized environments (Render, Vercel)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // If restricted, fallback to default
}

let cachedPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is currently in flight, await it!
  if (cachedPromise) {
    try {
      await cachedPromise;
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    } catch (e) {
      // In flight promise failed, reset and retry below
      cachedPromise = null;
    }
  }

  // On Vercel, if MONGO_URI is missing, fail immediately without trying localhost
  if (process.env.VERCEL && !process.env.MONGO_URI) {
    lastError = 'MONGO_URI environment variable is not defined in Vercel settings.';
    console.error('Database Configuration Warning:', lastError);
    return null;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-mentor-portal';

  try {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    };
    if (uri.startsWith('mongodb+srv://') && !uri.includes('authSource=')) {
      opts.authSource = 'admin';
    }

    cachedPromise = mongoose.connect(uri, opts);

    const conn = await cachedPromise;
    lastError = null;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    lastError = error.message;
    console.error(`Database Connection Warning: ${error.message}. Continuing server execution without database connection...`);
    return null;
  }
};

connectDB.getLastError = () => lastError;

connectDB.getMaskedUri = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) return 'NOT_CONFIGURED';
  try {
    if (uri.includes('@')) {
      const parts = uri.split('@');
      const protocol = parts[0].split('://')[0];
      const host = parts[1].split('?')[0];
      return `${protocol}://***:***@${host}`;
    }
    return uri.split('?')[0];
  } catch (e) {
    return 'MASKED';
  }
};

module.exports = connectDB;



