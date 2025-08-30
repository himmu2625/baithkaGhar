import mongoose from 'mongoose';

// Define type for cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global namespace to add mongoose property to global
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithakaGharDB';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Log MongoDB connection string (with credentials masked)
console.log('Using MongoDB connection string:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"));

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  try {
    // If we have a connection already, reuse it
    if (cached.conn) {
      console.log('Using existing MongoDB connection');
      return cached.conn;
    }

    // If we're already connecting, wait for that promise to resolve
    if (!cached.promise) {
      console.log('Starting new MongoDB connection...');
      const opts = {
        serverSelectionTimeoutMS: 10000, // Increase timeout for connection issues
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('MongoDB connected successfully');
          mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
          });
          return mongoose;
        })
        .catch((error) => {
          console.error('MongoDB connection failed:', error);
          cached.promise = null; // Reset the promise so we can try again
          throw error; // Re-throw the error to be caught by the caller
        });
    } else {
      console.log('Waiting for existing MongoDB connection attempt...');
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Database connection error in dbConnect:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default dbConnect; 