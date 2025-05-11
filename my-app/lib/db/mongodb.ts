import mongoose from 'mongoose';

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
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Define the interface for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastError: Error | null;
  lastErrorTime: number | null;
  connectionAttempts: number;
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
  globalCache.mongooseCache = { 
    conn: null, 
    promise: null,
    lastError: null,
    lastErrorTime: null,
    connectionAttempts: 0
  };
}

/**
 * Reset the MongoDB connection cache if needed
 */
export function resetMongoConnection(): void {
  if (globalCache.mongooseCache?.conn) {
    try {
      mongoose.connection.close();
    } catch (e) {
      console.error("Error closing mongoose connection", e);
    }
    globalCache.mongooseCache.conn = null;
    globalCache.mongooseCache.promise = null;
  }
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

  // If we had a recent error, wait before retrying
  if (globalCache.mongooseCache?.lastErrorTime) {
    const timeSinceLastError = Date.now() - globalCache.mongooseCache.lastErrorTime;
    const retryInterval = Math.min(30000, Math.pow(2, globalCache.mongooseCache.connectionAttempts) * 1000);
    if (timeSinceLastError < retryInterval) {
      // Throw the last error again without retrying
      if (globalCache.mongooseCache.lastError) {
        throw new Error(`MongoDB connection throttled: ${globalCache.mongooseCache.lastError.message}`);
      }
    }
  }

  // If we're already connecting, wait for that promise to resolve
  if (!globalCache.mongooseCache?.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 40000,
      retryReads: true,
      retryWrites: true,
    };

    // Increment connection attempts counter
    globalCache.mongooseCache!.connectionAttempts += 1;

    // Create a new connection promise
    globalCache.mongooseCache!.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongoose) => {
        // Reset error counters on success
        globalCache.mongooseCache!.lastError = null;
        globalCache.mongooseCache!.lastErrorTime = null;
        globalCache.mongooseCache!.connectionAttempts = 0;
        
        // Set up connection event handlers
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
          resetMongoConnection();
        });

        mongoose.connection.on('disconnected', () => {
          console.warn('MongoDB disconnected. Will try to reconnect.');
          resetMongoConnection();
        });
        
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        
        // Store error info for retry backoff
        globalCache.mongooseCache!.lastError = error;
        globalCache.mongooseCache!.lastErrorTime = Date.now();
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
    globalCache.mongooseCache.lastError = null;
    globalCache.mongooseCache.lastErrorTime = null;
    globalCache.mongooseCache.connectionAttempts = 0;
  }
}

// For backward compatibility
export const clientPromise = null; 