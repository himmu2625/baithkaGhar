// Export everything from the db/mongodb.ts file
export * from './db/mongodb';

// For backward compatibility with code that uses connectToDatabase
import { connectMongo } from '@/lib/db/mongodb';

export async function connectToDatabase() {
  try {
    // Use the enhanced connectMongo function that we fixed
    await connectMongo();
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
} 