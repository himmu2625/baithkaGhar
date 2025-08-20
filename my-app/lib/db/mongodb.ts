import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Store connection state
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

// Define a cache helper function instead of using React cache
function createCache<T>(fn: (...args: any[]) => Promise<T>): (...args: any[]) => Promise<T> {
  let cachedPromise: Promise<T> | null = null;
  return async function(...args: any[]): Promise<T> {
    if (!cachedPromise) {
      cachedPromise = fn(...args).catch(error => {
        // If fn(...args) results in an error, clear the cache for the next attempt.
        cachedPromise = null; 
        throw error; // Re-throw the error to the caller
      });
    }
    return cachedPromise;
  };
}

// Define connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not defined. Check your .env.local file.");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let globalWithMongoose = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connect to MongoDB with connection pooling and error handling
 */
export const connectMongo = async (): Promise<typeof mongoose> => {
  // For SSR, this function will run multiple times in parallel
  // We want to reuse a single connection, so check if we already have one
  if (isConnected) {
    return mongoose;
  }

  // Check for an existing connection in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // If no connection exists in global and no connection in progress,
  // create a new one
  if (globalWithMongoose.mongoose.conn) {
    isConnected = true;
    return globalWithMongoose.mongoose.conn;
  }

  // If a connection is already in progress, reuse that promise
  if (globalWithMongoose.mongoose.promise) {
    connectionPromise = globalWithMongoose.mongoose.promise;
    return connectionPromise;
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  // Create a new connection promise
  try {
    // Configure mongoose options to prevent warnings
    mongoose.set('strictQuery', false);
    
    // Suppress duplicate index warnings in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('suppressReservedKeysWarning', true);
    }

    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    connectionPromise = mongoose.connect(MONGODB_URI, opts);
    globalWithMongoose.mongoose.promise = connectionPromise;

    const conn = await connectionPromise;
    globalWithMongoose.mongoose.conn = conn;
    isConnected = true;
    connectionPromise = null;

    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Reset connection state on error
    globalWithMongoose.mongoose.promise = null;
    connectionPromise = null;
    throw error;
  }
};

// Cached version for use with Next.js
export const connectMongoDb = createCache(connectMongo);

// For clean shutdown in development
export const disconnectMongo = async () => {
  if (isConnected && process.env.NODE_ENV !== 'production') {
    await mongoose.disconnect();
    isConnected = false;
    globalWithMongoose.mongoose.conn = null;
    globalWithMongoose.mongoose.promise = null;
    console.log('MongoDB disconnected');
  }
};

// For backward compatibility
export const clientPromise = null; 