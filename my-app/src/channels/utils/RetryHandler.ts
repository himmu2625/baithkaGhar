/**
 * Retry handler with exponential backoff for OTA channel operations
 * Implements configurable retry logic with jitter and circuit breaker patterns
 */

import { RetryConfig } from '../types';
import { isRetryableError, getRetryDelay, ChannelError } from '../errors';
import { ILogger } from './Logger';

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  error: Error;
  delay: number;
  timestamp: Date;
}

/**
 * Retry result
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalDuration: number;
}

/**
 * Circuit breaker state
 */
export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, requests rejected
  HALF_OPEN = 'half_open' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold to open circuit */
  failureThreshold: number;
  
  /** Success threshold to close circuit from half-open */
  successThreshold: number;
  
  /** Time to wait before attempting to close circuit */
  resetTimeout: number;
  
  /** Rolling window size for tracking failures */
  rollingWindowSize: number;
  
  /** Minimum number of calls before circuit can open */
  minimumCalls: number;
}

/**
 * Advanced retry handler with circuit breaker support
 */
export class RetryHandler {
  private readonly channelName: string;
  private readonly logger: ILogger;
  private readonly config: RetryConfig;
  private readonly circuitConfig?: CircuitBreakerConfig;
  
  // Circuit breaker state
  private circuitState: CircuitState = CircuitState.CLOSED;
  private lastOpenTime: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private recentCalls: { success: boolean; timestamp: number }[] = [];

  constructor(
    channelName: string,
    logger: ILogger,
    config: RetryConfig,
    circuitConfig?: CircuitBreakerConfig
  ) {
    this.channelName = channelName;
    this.logger = logger;
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryOn: [408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
      ...config
    };
    this.circuitConfig = circuitConfig;
  }

  /**
   * Execute a function with retry logic
   * @param operation - Function to execute
   * @param operationName - Name for logging
   * @returns Promise with retry result
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitConfig && !this.canExecute()) {
      throw new ChannelError(
        `Circuit breaker is ${this.circuitState}, operation rejected`,
        this.channelName,
        { circuitState: this.circuitState }
      );
    }

    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        this.logger.debug(`Executing ${operationName}, attempt ${attempt}/${this.config.maxAttempts}`);
        
        const result = await operation();
        
        // Record success for circuit breaker
        if (this.circuitConfig) {
          this.recordSuccess();
        }

        // Log successful retry if this wasn't the first attempt
        if (attempt > 1) {
          this.logger.info(
            `${operationName} succeeded on attempt ${attempt}`,
            { 
              attempts: attempts.length + 1,
              totalDuration: Date.now() - startTime
            }
          );
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        const attemptInfo: RetryAttempt = {
          attempt,
          error: lastError,
          delay: 0,
          timestamp: new Date()
        };

        // Check if error is retryable
        if (!this.shouldRetry(lastError, attempt)) {
          attempts.push(attemptInfo);
          
          // Record failure for circuit breaker
          if (this.circuitConfig) {
            this.recordFailure();
          }
          
          this.logger.error(
            `${operationName} failed with non-retryable error on attempt ${attempt}`,
            lastError,
            { 
              attempts: attempts.length,
              totalDuration: Date.now() - startTime
            }
          );
          
          throw lastError;
        }

        // Calculate delay for next attempt
        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(lastError, attempt);
          attemptInfo.delay = delay;
          
          this.logger.warn(
            `${operationName} failed on attempt ${attempt}, retrying in ${delay}ms`,
            lastError,
            { 
              nextAttempt: attempt + 1,
              maxAttempts: this.config.maxAttempts,
              delay
            }
          );

          await this.sleep(delay);
        }

        attempts.push(attemptInfo);
      }
    }

    // Record failure for circuit breaker after all retries exhausted
    if (this.circuitConfig) {
      this.recordFailure();
    }

    // All attempts failed
    this.logger.error(
      `${operationName} failed after ${this.config.maxAttempts} attempts`,
      lastError!,
      {
        attempts: attempts.length,
        totalDuration: Date.now() - startTime,
        allAttempts: attempts.map(a => ({
          attempt: a.attempt,
          error: a.error.message,
          delay: a.delay
        }))
      }
    );

    throw lastError!;
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Get circuit breaker metrics
   */
  getCircuitMetrics(): {
    state: CircuitState;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    recentFailureRate: number;
    lastOpenTime?: Date;
  } | null {
    if (!this.circuitConfig) return null;

    const now = Date.now();
    const windowStart = now - this.circuitConfig.rollingWindowSize;
    const recentCalls = this.recentCalls.filter(call => call.timestamp > windowStart);
    const failures = recentCalls.filter(call => !call.success).length;
    const failureRate = recentCalls.length > 0 ? (failures / recentCalls.length) : 0;

    return {
      state: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      recentFailureRate: failureRate,
      lastOpenTime: this.lastOpenTime > 0 ? new Date(this.lastOpenTime) : undefined
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  resetCircuit(): void {
    if (this.circuitConfig) {
      this.circuitState = CircuitState.CLOSED;
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
      this.lastOpenTime = 0;
      this.recentCalls.length = 0;
      
      this.logger.info('Circuit breaker manually reset to CLOSED state');
    }
  }

  /**
   * Check if operation can be executed based on circuit breaker state
   */
  private canExecute(): boolean {
    if (!this.circuitConfig) return true;

    const now = Date.now();

    switch (this.circuitState) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if reset timeout has passed
        if (now - this.lastOpenTime >= this.circuitConfig.resetTimeout) {
          this.circuitState = CircuitState.HALF_OPEN;
          this.logger.info('Circuit breaker moved from OPEN to HALF_OPEN');
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  /**
   * Record successful operation for circuit breaker
   */
  private recordSuccess(): void {
    if (!this.circuitConfig) return;

    const now = Date.now();
    this.recentCalls.push({ success: true, timestamp: now });
    this.cleanupOldCalls(now);

    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.circuitConfig.successThreshold) {
        this.circuitState = CircuitState.CLOSED;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.logger.info('Circuit breaker moved from HALF_OPEN to CLOSED');
      }
    } else if (this.circuitState === CircuitState.CLOSED) {
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Record failed operation for circuit breaker
   */
  private recordFailure(): void {
    if (!this.circuitConfig) return;

    const now = Date.now();
    this.recentCalls.push({ success: false, timestamp: now });
    this.cleanupOldCalls(now);

    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;

    // Check if circuit should open
    if (this.circuitState === CircuitState.CLOSED || this.circuitState === CircuitState.HALF_OPEN) {
      const windowStart = now - this.circuitConfig.rollingWindowSize;
      const recentCalls = this.recentCalls.filter(call => call.timestamp > windowStart);
      
      if (recentCalls.length >= this.circuitConfig.minimumCalls) {
        const failures = recentCalls.filter(call => !call.success).length;
        const failureRate = failures / recentCalls.length;
        
        if (failureRate >= this.circuitConfig.failureThreshold) {
          this.circuitState = CircuitState.OPEN;
          this.lastOpenTime = now;
          this.logger.warn(
            `Circuit breaker opened due to failure rate: ${(failureRate * 100).toFixed(1)}%`,
            {
              failures,
              totalCalls: recentCalls.length,
              threshold: this.circuitConfig.failureThreshold
            }
          );
        }
      }
    }
  }

  /**
   * Clean up old call records outside the rolling window
   */
  private cleanupOldCalls(now: number): void {
    if (!this.circuitConfig) return;

    const windowStart = now - this.circuitConfig.rollingWindowSize;
    this.recentCalls = this.recentCalls.filter(call => call.timestamp > windowStart);
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Don't retry if we've reached max attempts
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Use custom retry logic if available
    if (!isRetryableError(error)) {
      return false;
    }

    // Check if error matches retry conditions
    if (error instanceof ChannelError) {
      const statusCode = (error as any).statusCode;
      if (statusCode && this.config.retryOn.includes(statusCode)) {
        return true;
      }
    }

    // Check for network errors
    const errorCode = (error as any).code;
    if (errorCode && this.config.retryOn.includes(errorCode)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay before next retry attempt
   */
  private calculateDelay(error: Error, attempt: number): number {
    // Use error-specific delay if available
    const errorDelay = getRetryDelay(error, attempt);
    if (errorDelay > 0) {
      return errorDelay;
    }

    // Calculate exponential backoff
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      delay += jitter;
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create retry handler
 */
export function createRetryHandler(
  channelName: string,
  logger: ILogger,
  config?: Partial<RetryConfig>,
  circuitConfig?: CircuitBreakerConfig
): RetryHandler {
  const defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryOn: [408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT']
  };

  return new RetryHandler(
    channelName,
    logger,
    { ...defaultConfig, ...config },
    circuitConfig
  );
}

/**
 * Default circuit breaker configuration for OTA channels
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 0.5,      // 50% failure rate
  successThreshold: 3,        // 3 consecutive successes to close
  resetTimeout: 60000,        // 1 minute
  rollingWindowSize: 300000,  // 5 minutes
  minimumCalls: 10           // Minimum calls before circuit can open
};