import { connectMongo } from './db/mongodb';
import mongoose from 'mongoose';

/**
 * Safely get a mongoose model to avoid "Cannot read properties of undefined" errors
 * @param modelName Name of the model to get
 * @returns Promise resolving to the model
 */
export async function getModel(modelName: string): Promise<mongoose.Model<any>> {
  try {
    // Make sure we're connected to the database
    await connectMongo();
    
    // Dynamically import the model
    // This approach prevents "Cannot read properties of undefined" errors
    // when importing models in server components or API routes
    const model = await import(`@/models/${modelName}`).then(module => module.default);
    
    // If the model isn't defined or has an issue, throw a clear error
    if (!model) {
      throw new Error(`Model ${modelName} could not be loaded`);
    }

    return model;
  } catch (error) {
    console.error(`Error loading model ${modelName}:`, error);
    throw error;
  }
}

/**
 * Factory function to create a safe model accessor
 * @param modelName The name of the model
 * @returns A function that safely accesses the model
 */
export function createModelAccessor<T extends mongoose.Document>(modelName: string) {
  return async (): Promise<mongoose.Model<T>> => {
    return getModel(modelName) as Promise<mongoose.Model<T>>;
  };
}

// Create accessors for common models
export const getReportModel = createModelAccessor('Report');
export const getUserModel = createModelAccessor('User');
export const getPropertyModel = createModelAccessor('Property');
export const getBookingModel = createModelAccessor('Booking');
export const getReviewModel = createModelAccessor('Review'); 