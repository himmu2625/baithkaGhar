/**
 * Rate limiter utility for OTA channel API requests
 * Implements token bucket algorithm with burst support
 */

import { RateLimitState, RateLimitError } from '../errors';

/**
 * Configuration for rate limiter
 */
interface RateLimiterConfig {
  /** Requests per minute limit */
  requestsPerMinute: number;
  
  /** Requests per hour limit (optional) */
  requestsPerHour?: number;
  
  /** Burst allowance for short periods */
  burstLimit?: number;
  
  /** Burst window in milliseconds */
  burstWindow?: number;
}

/**
 * Request record for tracking API calls
 */
interface RequestRecord {
  timestamp: number;
  windowType: 'minute' | 'hour' | 'burst';
}

/**
 * Rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private readonly channelName: string;
  private readonly config: RateLimiterConfig;
  private readonly requests: RequestRecord[] = [];
  private burstTokens: number;
  private lastBurstRefill: number;

  /**
   * Creates a new rate limiter instance
   * @param channelName - Name of the OTA channel
   * @param config - Rate limiting configuration
   */
  constructor(channelName: string, config: RateLimiterConfig) {
    this.channelName = channelName;
    this.config = {
      burstLimit: config.requestsPerMinute,
      burstWindow: 60000, // 1 minute default
      ...config
    };
    
    this.burstTokens = this.config.burstLimit || this.config.requestsPerMinute;
    this.lastBurstRefill = Date.now();
  }

  /**
   * Check if a request can be made based on rate limits
   * @returns Promise that resolves when request can be made
   * @throws RateLimitError if rate limits are exceeded
   */
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Clean up old requests
    this.cleanupOldRequests(now);
    
    // Check rate limits
    this.checkMinuteLimit(now);
    if (this.config.requestsPerHour) {
      this.checkHourLimit(now);
    }
    this.checkBurstLimit(now);
    
    // Record the request
    this.recordRequest(now);
  }

  /**
   * Get current rate limit state
   * @returns Current rate limiting information
   */
  getCurrentState(): RateLimitState {
    const now = Date.now();
    this.cleanupOldRequests(now);
    this.refillBurstTokens(now);

    const minuteRequests = this.getRequestsInWindow(now, 60000);
    const hourRequests = this.config.requestsPerHour 
      ? this.getRequestsInWindow(now, 3600000) 
      : 0;

    const minuteRemaining = Math.max(0, this.config.requestsPerMinute - minuteRequests);
    const hourRemaining = this.config.requestsPerHour 
      ? Math.max(0, this.config.requestsPerHour - hourRequests)
      : Infinity;
    
    const remaining = Math.min(minuteRemaining, hourRemaining, this.burstTokens);
    
    return {
      remaining,
      limit: this.config.requestsPerMinute,
      resetTime: new Date(now + (60000 - (now % 60000))), // Next minute boundary
      burstRemaining: this.burstTokens,
      isLimited: remaining === 0
    };
  }

  /**
   * Get time until next request can be made (in milliseconds)
   * @returns Milliseconds to wait, or 0 if request can be made immediately
   */
  getRetryAfter(): number {
    const now = Date.now();
    this.cleanupOldRequests(now);
    
    // Check if we need to wait for burst tokens
    if (this.burstTokens <= 0) {
      const timeSinceLastRefill = now - this.lastBurstRefill;
      const timeToNextToken = Math.max(0, (this.config.burstWindow! / (this.config.burstLimit || 1)) - timeSinceLastRefill);
      return Math.ceil(timeToNextToken);
    }
    
    // Check minute limit
    const minuteRequests = this.getRequestsInWindow(now, 60000);
    if (minuteRequests >= this.config.requestsPerMinute) {
      const oldestRequest = this.requests
        .filter(r => r.timestamp > now - 60000)
        .reduce((oldest, current) => 
          current.timestamp < oldest.timestamp ? current : oldest
        );
      return Math.max(0, 60000 - (now - oldestRequest.timestamp));
    }
    
    // Check hour limit
    if (this.config.requestsPerHour) {
      const hourRequests = this.getRequestsInWindow(now, 3600000);
      if (hourRequests >= this.config.requestsPerHour) {
        const oldestRequest = this.requests
          .filter(r => r.timestamp > now - 3600000)
          .reduce((oldest, current) => 
            current.timestamp < oldest.timestamp ? current : oldest
          );
        return Math.max(0, 3600000 - (now - oldestRequest.timestamp));
      }
    }
    
    return 0;
  }

  /**
   * Reset rate limiter state (useful for testing or manual reset)
   */
  reset(): void {
    this.requests.length = 0;
    this.burstTokens = this.config.burstLimit || this.config.requestsPerMinute;
    this.lastBurstRefill = Date.now();
  }

  /**
   * Check minute-based rate limit
   */
  private checkMinuteLimit(now: number): void {
    const requestsInLastMinute = this.getRequestsInWindow(now, 60000);
    if (requestsInLastMinute >= this.config.requestsPerMinute) {
      const resetTime = new Date(now + 60000);
      throw new RateLimitError(
        `Rate limit exceeded: ${requestsInLastMinute}/${this.config.requestsPerMinute} requests per minute`,
        this.channelName,
        resetTime,
        0
      );
    }
  }

  /**
   * Check hour-based rate limit
   */
  private checkHourLimit(now: number): void {
    if (!this.config.requestsPerHour) return;
    
    const requestsInLastHour = this.getRequestsInWindow(now, 3600000);
    if (requestsInLastHour >= this.config.requestsPerHour) {
      const resetTime = new Date(now + 3600000);
      throw new RateLimitError(
        `Rate limit exceeded: ${requestsInLastHour}/${this.config.requestsPerHour} requests per hour`,
        this.channelName,
        resetTime,
        0
      );
    }
  }

  /**
   * Check burst rate limit using token bucket
   */
  private checkBurstLimit(now: number): void {
    this.refillBurstTokens(now);
    
    if (this.burstTokens <= 0) {
      const retryAfter = this.getRetryAfter();
      throw new RateLimitError(
        `Burst limit exceeded: no tokens available`,
        this.channelName,
        new Date(now + retryAfter),
        0
      );
    }
  }

  /**
   * Refill burst tokens based on time passed
   */
  private refillBurstTokens(now: number): void {
    const timeSinceLastRefill = now - this.lastBurstRefill;
    const burstLimit = this.config.burstLimit || this.config.requestsPerMinute;
    const refillRate = burstLimit / (this.config.burstWindow || 60000); // tokens per ms
    
    const tokensToAdd = Math.floor(timeSinceLastRefill * refillRate);
    if (tokensToAdd > 0) {
      this.burstTokens = Math.min(burstLimit, this.burstTokens + tokensToAdd);
      this.lastBurstRefill = now;
    }
  }

  /**
   * Record a new request
   */
  private recordRequest(now: number): void {
    this.requests.push({
      timestamp: now,
      windowType: 'minute'
    });
    
    this.burstTokens = Math.max(0, this.burstTokens - 1);
  }

  /**
   * Get number of requests in a time window
   */
  private getRequestsInWindow(now: number, windowMs: number): number {
    return this.requests.filter(r => r.timestamp > now - windowMs).length;
  }

  /**
   * Clean up request records older than 1 hour
   */
  private cleanupOldRequests(now: number): void {
    const cutoff = now - 3600000; // 1 hour ago
    let removeCount = 0;
    
    for (let i = 0; i < this.requests.length; i++) {
      if (this.requests[i].timestamp <= cutoff) {
        removeCount++;
      } else {
        break;
      }
    }
    
    if (removeCount > 0) {
      this.requests.splice(0, removeCount);
    }
  }
}

/**
 * Factory function to create rate limiter instances
 */
export function createRateLimiter(
  channelName: string, 
  config: RateLimiterConfig
): RateLimiter {
  return new RateLimiter(channelName, config);
}

/**
 * Global rate limiter registry for managing multiple channels
 */
export class RateLimiterRegistry {
  private static instance: RateLimiterRegistry;
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimiterRegistry {
    if (!RateLimiterRegistry.instance) {
      RateLimiterRegistry.instance = new RateLimiterRegistry();
    }
    return RateLimiterRegistry.instance;
  }

  /**
   * Get or create rate limiter for channel
   */
  getLimiter(channelName: string, config: RateLimiterConfig): RateLimiter {
    if (!this.limiters.has(channelName)) {
      this.limiters.set(channelName, new RateLimiter(channelName, config));
    }
    return this.limiters.get(channelName)!;
  }

  /**
   * Remove rate limiter for channel
   */
  removeLimiter(channelName: string): void {
    this.limiters.delete(channelName);
  }

  /**
   * Get all active rate limiters
   */
  getAllLimiters(): Map<string, RateLimiter> {
    return new Map(this.limiters);
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }
}