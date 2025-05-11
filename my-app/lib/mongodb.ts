// Export everything from the db/mongodb.ts file
export * from './db/mongodb';

// For backward compatibility with code that uses connectToDatabase
import { connectMongo } from './db/mongodb';
export const connectToDatabase = connectMongo; 