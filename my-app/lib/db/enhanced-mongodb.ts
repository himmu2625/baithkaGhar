import { MongoClient, Db, Collection, Document } from 'mongodb'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

// MongoDB Native Client
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Mongoose Connection State
let isMongooseConnected = false

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isMongooseConnected && mongoose.connection.readyState === 1) {
    return mongoose
  }

  try {
    mongoose.set('strictQuery', false)
    
    const db = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    
    isMongooseConnected = true
    console.log('✅ Connected to MongoDB via Mongoose')
    
    // Listen for connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      isMongooseConnected = false
    })
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
      isMongooseConnected = false
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected')
      isMongooseConnected = true
    })
    
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    isMongooseConnected = false
    throw error
  }
}

// Database helper functions
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db()
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await getDatabase()
  return db.collection<T>(name)
}

// Health check function
export async function checkDatabaseHealth(): Promise<{ 
  status: 'healthy' | 'unhealthy'
  message: string
  details: {
    mongoose: boolean
    nativeClient: boolean
    connectionState: number
  }
}> {
  try {
    // Test native MongoDB client
    const client = await clientPromise
    await client.db().admin().ping()
    
    // Test Mongoose connection
    const mongooseStatus = mongoose.connection.readyState === 1
    
    return {
      status: 'healthy',
      message: 'Database connections are active',
      details: {
        mongoose: mongooseStatus,
        nativeClient: true,
        connectionState: mongoose.connection.readyState
      }
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        mongoose: isMongooseConnected,
        nativeClient: false,
        connectionState: mongoose.connection.readyState
      }
    }
  }
}

// Database operations helpers
export class DatabaseOperations {
  static async findWithPagination<T extends Document = Document>(
    collection: Collection<T>,
    filter: any = {},
    options: {
      page?: number
      limit?: number
      sort?: any
      projection?: any
    } = {}
  ) {
    const { page = 1, limit = 10, sort = {}, projection = {} } = options
    const skip = (page - 1) * limit
    
    const [data, total] = await Promise.all([
      collection
        .find(filter, { projection })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ])
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }
  
  static async aggregateWithPagination<T extends Document = Document>(
    collection: Collection<T>,
    pipeline: any[],
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit
    
    const aggregationPipeline = [
      ...pipeline,
      { $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: "total" }]
      }}
    ]
    
    const [result] = await collection.aggregate(aggregationPipeline).toArray()
    const total = result.count[0]?.total || 0
    
    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }
}

// Connection monitoring
export async function getConnectionStats() {
  try {
    const client = await clientPromise
    const admin = client.db().admin()
    const stats = await admin.serverStatus()
    
    return {
      uptime: stats.uptime,
      connections: stats.connections,
      network: stats.network,
      opcounters: stats.opcounters,
      mongoose: {
        readyState: mongoose.connection.readyState,
        states: (() => {
          const states: { [key: number]: string } = {
            0: 'disconnected',
            1: 'connected', 
            2: 'connecting',
            3: 'disconnecting'
          }
          return states[mongoose.connection.readyState] || 'unknown'
        })()
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Graceful shutdown
export async function gracefulShutdown() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      console.log('🔄 Mongoose connection closed')
    }
    
    const client = await clientPromise
    await client.close()
    console.log('🔄 MongoDB native client closed')
    
    isMongooseConnected = false
  } catch (error) {
    console.error('Error during graceful shutdown:', error)
  }
}

// Export both promises for backward compatibility
export { clientPromise }
export default clientPromise