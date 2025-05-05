import mongoose from 'mongoose';

// Define a cache helper function instead of using React cache
function createCache<T>(fn: (...args: any[]) => Promise<T>): (...args: any[]) => Promise<T> {
  let cache: Promise<T> | null = null;
  return async function(...args: any[]): Promise<T> {
    if (!cache) {
      cache = fn(...args);
    }
    return cache;
  };
}

// Define connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Define the interface for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Create a cache object that works in both CommonJS and ESM
declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Initialize the cache
const globalCache = global as unknown as {
  mongooseCache?: MongooseCache;
};

// Initialize our cached connection if not already done
if (!globalCache.mongooseCache) {
  globalCache.mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with error handling and connection pooling
 * Using a cache helper to ensure the connection is properly memoized
 */
export const connectMongo = createCache(async (): Promise<typeof mongoose> => {
  // If we have a connection already, reuse it
  if (globalCache.mongooseCache?.conn) {
    return globalCache.mongooseCache.conn;
  }

  // If we're already connecting, wait for that promise to resolve
  if (!globalCache.mongooseCache?.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Create a new connection promise
    globalCache.mongooseCache!.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongoose) => {
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        globalCache.mongooseCache!.promise = null;
        throw error;
      });
  }

  try {
    // Wait for the connection to complete
    globalCache.mongooseCache!.conn = await globalCache.mongooseCache!.promise;
    return globalCache.mongooseCache!.conn;
  } catch (e) {
    // Reset our promise so we can retry
    globalCache.mongooseCache!.promise = null;
    throw e;
  }
});

/**
 * Safely disconnect from MongoDB
 */
export async function disconnectMongo(): Promise<void> {
  if (globalCache.mongooseCache?.conn) {
    // In production, we generally want to keep the connection alive
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    await mongoose.disconnect();
    globalCache.mongooseCache.conn = null;
    globalCache.mongooseCache.promise = null;
  }
}

// For backward compatibility
export const clientPromise = null; 