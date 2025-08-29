/**
 * Custom error classes for OTA channel operations
 * Provides specific error types for different channel operation failures
 */

/**
 * Base error class for all channel-related errors
 */
export abstract class ChannelError extends Error {
  public readonly channelName: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    channelName: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.channelName = channelName;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a JSON representation of the error for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      channelName: this.channelName,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Error thrown when connection to channel API fails
 */
export class ChannelConnectionError extends ChannelError {
  public readonly statusCode?: number;
  public readonly retryAfter?: number;

  constructor(
    message: string,
    channelName: string,
    statusCode?: number,
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when inventory or pricing sync fails
 */
export class ChannelSyncError extends ChannelError {
  public readonly syncType: 'inventory' | 'pricing' | 'both';
  public readonly failedItems?: string[];
  public readonly partialSuccess?: boolean;

  constructor(
    message: string,
    channelName: string,
    syncType: 'inventory' | 'pricing' | 'both',
    failedItems?: string[],
    partialSuccess = false,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.syncType = syncType;
    this.failedItems = failedItems;
    this.partialSuccess = partialSuccess;
  }
}

/**
 * Error thrown when booking processing fails
 */
export class BookingProcessingError extends ChannelError {
  public readonly bookingId?: string;
  public readonly externalBookingId?: string;
  public readonly operation: 'create' | 'update' | 'cancel' | 'confirm' | 'status';

  constructor(
    message: string,
    channelName: string,
    operation: 'create' | 'update' | 'cancel' | 'confirm' | 'status',
    bookingId?: string,
    externalBookingId?: string,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.operation = operation;
    this.bookingId = bookingId;
    this.externalBookingId = externalBookingId;
  }
}

/**
 * Error thrown when credential or data validation fails
 */
export class ValidationError extends ChannelError {
  public readonly field?: string;
  public readonly expectedFormat?: string;
  public readonly receivedValue?: any;

  constructor(
    message: string,
    channelName: string,
    field?: string,
    expectedFormat?: string,
    receivedValue?: any,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.field = field;
    this.expectedFormat = expectedFormat;
    this.receivedValue = receivedValue;
  }
}

/**
 * Error thrown when API rate limits are exceeded
 */
export class RateLimitError extends ChannelConnectionError {
  public readonly resetTime?: Date;
  public readonly remainingRequests?: number;

  constructor(
    message: string,
    channelName: string,
    resetTime?: Date,
    remainingRequests?: number,
    context?: Record<string, any>
  ) {
    super(message, channelName, 429, undefined, context);
    this.resetTime = resetTime;
    this.remainingRequests = remainingRequests;
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ChannelError {
  public readonly credentialType?: string;

  constructor(
    message: string,
    channelName: string,
    credentialType?: string,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.credentialType = credentialType;
  }
}

/**
 * Error thrown when a timeout occurs during API operation
 */
export class TimeoutError extends ChannelError {
  public readonly timeoutMs: number;
  public readonly operation: string;

  constructor(
    message: string,
    channelName: string,
    operation: string,
    timeoutMs: number,
    context?: Record<string, any>
  ) {
    super(message, channelName, context);
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof ChannelConnectionError) {
    return error.statusCode ? [408, 429, 500, 502, 503, 504].includes(error.statusCode) : true;
  }
  
  if (error instanceof TimeoutError || error instanceof RateLimitError) {
    return true;
  }
  
  return false;
}

/**
 * Get retry delay in milliseconds based on error type
 */
export function getRetryDelay(error: Error, attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  if (error instanceof RateLimitError && error.resetTime) {
    return Math.min(error.resetTime.getTime() - Date.now(), maxDelay);
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}