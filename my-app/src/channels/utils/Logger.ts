/**
 * Logging utility for OTA channel operations
 * Provides structured logging with different levels and contexts
 */

import { LoggingConfig, OperationContext } from '../types';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  timestamp: Date;
  channelName: string;
  operationId?: string;
  correlationId?: string;
  propertyId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  setContext(context: Partial<OperationContext>): void;
  child(additionalContext: Record<string, any>): ILogger;
}

/**
 * Default logger implementation using console
 * Can be replaced with Winston, Bunyan, or other logging libraries
 */
export class ChannelLogger implements ILogger {
  private readonly channelName: string;
  private readonly config: LoggingConfig;
  private context: Partial<OperationContext>;

  constructor(
    channelName: string, 
    config: LoggingConfig = { 
      level: 'info', 
      logBodies: false, 
      logSensitive: false 
    },
    context: Partial<OperationContext> = {}
  ) {
    this.channelName = channelName;
    this.config = config;
    this.context = context;
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('DEBUG', message, undefined, metadata);
    }
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('INFO', message, undefined, metadata);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('WARN', message, undefined, metadata);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log('ERROR', message, error, metadata);
    }
  }

  /**
   * Set operation context for subsequent logs
   */
  setContext(context: Partial<OperationContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: Record<string, any>): ILogger {
    const childContext = { 
      ...this.context, 
      metadata: { 
        ...this.context.metadata, 
        ...additionalContext 
      } 
    };
    return new ChannelLogger(this.channelName, this.config, childContext);
  }

  /**
   * Log API request details
   */
  logRequest(
    method: string, 
    url: string, 
    headers?: Record<string, string>,
    body?: any
  ): void {
    const metadata: Record<string, any> = {
      method,
      url,
      headers: this.sanitizeHeaders(headers)
    };

    if (this.config.logBodies && body) {
      metadata.body = this.sanitizeBody(body);
    }

    this.debug('API Request', metadata);
  }

  /**
   * Log API response details
   */
  logResponse(
    statusCode: number,
    headers?: Record<string, string>,
    body?: any,
    duration?: number
  ): void {
    const metadata: Record<string, any> = {
      statusCode,
      headers: headers ? Object.keys(headers) : undefined,
      duration
    };

    if (this.config.logBodies && body) {
      metadata.body = this.sanitizeBody(body);
    }

    const level = statusCode >= 400 ? 'WARN' : 'DEBUG';
    const message = `API Response [${statusCode}]`;

    if (level === 'WARN') {
      this.warn(message, metadata);
    } else {
      this.debug(message, metadata);
    }
  }

  /**
   * Log operation start
   */
  logOperationStart(operation: string, metadata?: Record<string, any>): void {
    this.info(`Operation started: ${operation}`, {
      operation,
      startTime: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Log operation completion
   */
  logOperationComplete(
    operation: string, 
    success: boolean, 
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const message = `Operation ${success ? 'completed' : 'failed'}: ${operation}`;
    const logData = {
      operation,
      success,
      duration,
      endTime: new Date().toISOString(),
      ...metadata
    };

    if (success) {
      this.info(message, logData);
    } else {
      this.error(message, undefined, logData);
    }
  }

  /**
   * Log sync operation results
   */
  logSyncResult(
    syncType: string,
    processed: number,
    succeeded: number,
    failed: number,
    duration: number,
    errors?: string[]
  ): void {
    const metadata = {
      syncType,
      processed,
      succeeded,
      failed,
      successRate: processed > 0 ? (succeeded / processed * 100).toFixed(2) + '%' : '0%',
      duration,
      errors: errors?.slice(0, 5) // Limit error details
    };

    if (failed > 0) {
      this.warn(`Sync completed with ${failed} failures: ${syncType}`, metadata);
    } else {
      this.info(`Sync completed successfully: ${syncType}`, metadata);
    }
  }

  /**
   * Log rate limiting information
   */
  logRateLimit(remaining: number, resetTime: Date, wasLimited: boolean): void {
    const metadata = {
      remaining,
      resetTime: resetTime.toISOString(),
      wasLimited
    };

    if (wasLimited) {
      this.warn('Rate limit hit, request delayed', metadata);
    } else if (remaining < 10) {
      this.warn('Approaching rate limit', metadata);
    } else {
      this.debug('Rate limit status', metadata);
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: keyof typeof LogLevel, 
    message: string, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      channelName: this.channelName,
      operationId: this.context.operationId,
      correlationId: this.context.correlationId,
      propertyId: this.context.propertyId,
      userId: this.context.userId,
      duration: this.context.startTime 
        ? Date.now() - this.context.startTime.getTime() 
        : undefined,
      metadata: {
        ...this.context.metadata,
        ...metadata
      },
      error
    };

    // Use custom formatter if provided
    if (this.config.formatter) {
      console.log(this.config.formatter(entry));
    } else {
      this.defaultFormat(entry);
    }
  }

  /**
   * Default log formatting
   */
  private defaultFormat(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.operationId ? `[${entry.operationId}]` : '';
    const baseMessage = `${timestamp} [${entry.level}] ${entry.channelName}${context} ${entry.message}`;

    // Color coding for console output
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m'  // Red
    };
    const reset = '\x1b[0m';

    const coloredMessage = `${colors[entry.level]}${baseMessage}${reset}`;

    if (entry.level === 'ERROR') {
      console.error(coloredMessage);
      if (entry.error) {
        console.error('Error details:', entry.error);
      }
    } else if (entry.level === 'WARN') {
      console.warn(coloredMessage);
    } else {
      console.log(coloredMessage);
    }

    // Log metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', JSON.stringify(entry.metadata, null, 2));
    }
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = LogLevel[this.config.level.toUpperCase() as keyof typeof LogLevel];
    return level >= configLevel;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'x-auth-token'];

    for (const [key, value] of Object.entries(headers)) {
      if (this.config.logSensitive || !sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request/response body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    if (this.config.logSensitive) return body;

    // Clone the object to avoid modifying original
    const cloned = JSON.parse(JSON.stringify(body));
    
    // Redact common sensitive fields
    const sensitiveFields = [
      'password', 'apiKey', 'api_key', 'token', 'secret', 'creditCard', 
      'cardNumber', 'cvv', 'ssn', 'taxId'
    ];

    const redact = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(redact);
      }

      for (const key of Object.keys(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object') {
          obj[key] = redact(obj[key]);
        }
      }

      return obj;
    };

    return redact(cloned);
  }
}

/**
 * Factory function to create logger instances
 */
export function createLogger(
  channelName: string, 
  config?: Partial<LoggingConfig>,
  context?: Partial<OperationContext>
): ILogger {
  const defaultConfig: LoggingConfig = {
    level: process.env.LOG_LEVEL as any || 'info',
    logBodies: process.env.LOG_BODIES === 'true',
    logSensitive: process.env.LOG_SENSITIVE === 'true'
  };

  return new ChannelLogger(channelName, { ...defaultConfig, ...config }, context);
}

/**
 * Global logger registry for managing channel loggers
 */
export class LoggerRegistry {
  private static instance: LoggerRegistry;
  private loggers: Map<string, ILogger> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerRegistry {
    if (!LoggerRegistry.instance) {
      LoggerRegistry.instance = new LoggerRegistry();
    }
    return LoggerRegistry.instance;
  }

  /**
   * Get or create logger for channel
   */
  getLogger(
    channelName: string, 
    config?: Partial<LoggingConfig>,
    context?: Partial<OperationContext>
  ): ILogger {
    if (!this.loggers.has(channelName)) {
      this.loggers.set(channelName, createLogger(channelName, config, context));
    }
    return this.loggers.get(channelName)!;
  }

  /**
   * Remove logger for channel
   */
  removeLogger(channelName: string): void {
    this.loggers.delete(channelName);
  }

  /**
   * Get all active loggers
   */
  getAllLoggers(): Map<string, ILogger> {
    return new Map(this.loggers);
  }
}