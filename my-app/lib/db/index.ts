import mongoose from "mongoose"

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

// Re-export mongodb utilities
export * from './mongodb';

/**
 * Define the cache interface for global mongoose connection.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
  lastError?: Error | string | null;
  lastErrorTime?: number | null;
  connectionAttempts?: number;
}

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: MongooseCache
}

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = {
    conn: null,
    promise: null,
    lastError: null,
    lastErrorTime: null,
    connectionAttempts: 0
  };
}

/**
 * Connect to MongoDB
 */
export const dbConnect = createCache(async (): Promise<typeof mongoose> => {
  // If we have a connection already, reuse it
  if (globalWithMongoose.mongooseCache?.conn) {
    return globalWithMongoose.mongooseCache.conn
  }

  // If we're already connecting, wait for that promise to resolve
  if (!globalWithMongoose.mongooseCache?.promise) {
    const MONGODB_URI = process.env.MONGODB_URI

    if (!MONGODB_URI) {
      throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
      )
    }

    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    // Create a new connection promise
    globalWithMongoose.mongooseCache!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error)
        globalWithMongoose.mongooseCache!.promise = null
        throw error
      })
  }

  try {
    // Wait for the connection to complete
    globalWithMongoose.mongooseCache!.conn = await globalWithMongoose.mongooseCache!.promise
    return globalWithMongoose.mongooseCache!.conn
  } catch (e) {
    // Reset our promise so we can retry
    globalWithMongoose.mongooseCache!.promise = null
    throw e
  }
})

/**
 * Checks if the database is connected
 * @returns {boolean}
 */
export function isConnectionActive(): boolean {
  return mongoose.connection.readyState === 1
}

/**
 * Convert MongoDB document to plain object
 * @param {Object} doc - MongoDB document
 * @returns {Object} - Plain object
 */
export function convertDocToObject(doc: any) {
  if (!doc) return null

  // If document has toObject method, use it
  const obj = doc.toObject ? doc.toObject() : doc
  
  // Convert _id to id
  if (obj._id) {
    obj.id = obj._id.toString()
    delete obj._id
  }

  // Convert nested document IDs
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === "object") {
      if (mongoose.Types.ObjectId.isValid(obj[key])) {
        obj[key] = obj[key].toString()
      } else if (obj[key]._id) {
        obj[key].id = obj[key]._id.toString()
        delete obj[key]._id
        convertDocToObject(obj[key])
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item: any) => {
          if (mongoose.Types.ObjectId.isValid(item)) {
            return item.toString()
          } else if (item && typeof item === "object" && item._id) {
            item.id = item._id.toString()
            delete item._id
            return convertDocToObject(item)
          }
          return item
        })
      } else {
        convertDocToObject(obj[key])
      }
    }
  })

  // Convert dates to ISO strings
  if (obj.createdAt) {
    obj.createdAt = obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt
  }
  if (obj.updatedAt) {
    obj.updatedAt = obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : obj.updatedAt
  }

  return obj
}

/**
 * Create a database handler for route handlers with error handling
 * @param handler - The async handler function
 * @returns {Function} - The wrapped handler function
 */
export function createDbHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      // Connect to DB before executing the handler
      await dbConnect()
      return await handler(...args)
    } catch (error) {
      console.error("Database operation failed:", error)
      throw error
    }
  }
}

/**
 * Get a mongoose model safely by importing dynamically
 * @param modelName - The name of the model to get
 * @returns {Promise<any>} - The mongoose model
 */
export async function getModelDynamic(modelName: string): Promise<any> {
  await dbConnect();
  
  try {
    // Dynamic import to ensure mongoose is connected before importing the model
    return (await import(`@/models/${modelName}`)).default;
  } catch (error) {
    console.error(`Error loading model ${modelName}:`, error);
    throw error;
  }
}

/**
 * Safely disconnect from MongoDB
 */
export async function disconnectMongo(): Promise<void> {
  if (globalWithMongoose.mongooseCache?.conn) {
    // In production, we generally want to keep the connection alive
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    await mongoose.disconnect();
    globalWithMongoose.mongooseCache.conn = null;
    globalWithMongoose.mongooseCache.promise = null;
  }
}

// Backwards compatibility aliases
export const isConnected = isConnectionActive;
export const convertDocToObj = convertDocToObject;
export const dbHandler = createDbHandler;
export const getModel = getModelDynamic;
