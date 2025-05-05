/**
 * Main exports from the lib directory
 * This file re-exports functionality to maintain compatibility
 */

// Database functionality
export * from './db';

// Authentication and session
export * from './auth';

// Services
export * from './services/email';
export * from './services/sms';
export * from './services/cloudinary';
export * from './services/razorpay';

// Utils
export * from './utils/cache';

// Direct exports of individual files
export * from './maps';
export * from './search';
export * from './search-tracking';
export * from './performance';
export * from './placeholder';
export * from './get-session';

// Import and export analytics modules with namespace to avoid conflicts
import * as analytics from './analytics';
import * as hostAnalytics from './host-analytics';

export { analytics };
export { hostAnalytics };

// Named exports for backwards compatibility
import { 
  getModel as getModelFromDb, 
  dbConnect, 
  isConnected, 
  convertDocToObject, 
  createDbHandler 
} from './db';

export {
  getModelFromDb,
  dbConnect,
  isConnected,
  convertDocToObject,
  createDbHandler
}; 