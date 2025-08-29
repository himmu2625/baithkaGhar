/**
 * Main entry point for OTA channel integration system
 * Exports all channel utilities, types, and base classes
 */

// Base Channel Class
export { BaseChannel, validateChannelConfig } from './BaseChannel';

// Channel Implementations
export { BookingComChannel } from './implementations/BookingComChannel';
export { MakeMyTripChannel } from './implementations/MakeMyTripChannel';
export { OYOChannel } from './implementations/OYOChannel';

// Channel Factory
export { ChannelFactory, getChannelFactory, resetChannelFactory, SupportedChannels } from './ChannelFactory';

// Type Definitions
export * from './types';

// Error Classes
export * from './errors';

// Utility Classes
export { RateLimiter, createRateLimiter, RateLimiterRegistry } from './utils/RateLimiter';
export { 
  ChannelLogger, 
  createLogger, 
  LoggerRegistry,
  LogLevel,
  type ILogger,
  type LogEntry,
  type LoggingConfig
} from './utils/Logger';
export { 
  RetryHandler, 
  createRetryHandler, 
  DEFAULT_CIRCUIT_CONFIG,
  CircuitState,
  type RetryAttempt,
  type RetryResult,
  type CircuitBreakerConfig
} from './utils/RetryHandler';

/**
 * Default configurations for common OTA channels
 * These can be used as templates when implementing specific channels
 */
export const CHANNEL_DEFAULTS = {
  BOOKING_COM: {
    channelName: 'booking.com',
    displayName: 'Booking.com',
    endpoints: {
      production: 'https://distribution-xml.booking.com/2.4/xml',
      sandbox: 'https://distribution-xml.booking.com/test/xml'
    },
    rateLimits: {
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      burstLimit: 50
    },
    timeouts: {
      connection: 30000,
      request: 45000,
      retry: 300000
    },
    features: {
      supportsInventorySync: true,
      supportsPricingSync: true,
      supportsBookingWebhooks: false,
      supportsBookingModifications: true,
      supportsCancellations: true
    }
  },
  
  EXPEDIA: {
    channelName: 'expedia',
    displayName: 'Expedia',
    endpoints: {
      production: 'https://services.expediapartnercentral.com/eqc/ar',
      sandbox: 'https://test-services.expediapartnercentral.com/eqc/ar'
    },
    rateLimits: {
      requestsPerMinute: 240,
      requestsPerHour: 7200,
      burstLimit: 40
    },
    timeouts: {
      connection: 30000,
      request: 60000,
      retry: 300000
    },
    features: {
      supportsInventorySync: true,
      supportsPricingSync: true,
      supportsBookingWebhooks: true,
      supportsBookingModifications: true,
      supportsCancellations: true
    }
  },
  
  MAKEMYTRIP: {
    channelName: 'makemytrip',
    displayName: 'MakeMyTrip',
    endpoints: {
      production: 'https://api.makemytrip.com/pms/v1',
      sandbox: 'https://api-sandbox.makemytrip.com/pms/v1'
    },
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerHour: 3600,
      burstLimit: 20
    },
    timeouts: {
      connection: 30000,
      request: 45000,
      retry: 300000
    },
    features: {
      supportsInventorySync: true,
      supportsPricingSync: true,
      supportsBookingWebhooks: false,
      supportsBookingModifications: false,
      supportsCancellations: true
    }
  },
  
  OYO: {
    channelName: 'oyo',
    displayName: 'OYO',
    endpoints: {
      production: 'https://api.oyorooms.com/pms/v2',
      sandbox: 'https://api-sandbox.oyorooms.com/pms/v2'
    },
    rateLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 2400,
      burstLimit: 15
    },
    timeouts: {
      connection: 30000,
      request: 30000,
      retry: 180000
    },
    features: {
      supportsInventorySync: true,
      supportsPricingSync: true,
      supportsBookingWebhooks: true,
      supportsBookingModifications: false,
      supportsCancellations: true
    }
  },
  
  AGODA: {
    channelName: 'agoda',
    displayName: 'Agoda',
    endpoints: {
      production: 'https://api.agoda.com/ycs/v1',
      sandbox: 'https://api-sandbox.agoda.com/ycs/v1'
    },
    rateLimits: {
      requestsPerMinute: 180,
      requestsPerHour: 5400,
      burstLimit: 30
    },
    timeouts: {
      connection: 30000,
      request: 45000,
      retry: 300000
    },
    features: {
      supportsInventorySync: true,
      supportsPricingSync: true,
      supportsBookingWebhooks: false,
      supportsBookingModifications: true,
      supportsCancellations: true
    }
  }
} as const;

/**
 * Common validation rules for channel data
 */
export const VALIDATION_RULES = {
  /** ISO 4217 currency codes */
  CURRENCIES: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'SGD', 'THB'],
  
  /** Standard meal plan codes */
  MEAL_PLANS: ['EP', 'CP', 'MAP', 'AP', 'AI'],
  
  /** Maximum values for data validation */
  MAX_VALUES: {
    ROOM_COUNT: 50,
    GUEST_COUNT: 20,
    NIGHTS: 365,
    RATE_AMOUNT: 100000,
    AVAILABILITY: 999
  },
  
  /** Regular expressions for validation */
  PATTERNS: {
    DATE: /^\d{4}-\d{2}-\d{2}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-\(\)]+$/,
    CURRENCY: /^[A-Z]{3}$/
  }
} as const;

/**
 * Utility functions for common channel operations
 */
export const ChannelUtils = {
  /**
   * Format date for API requests (YYYY-MM-DD)
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },
  
  /**
   * Parse date from API response
   */
  parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date;
  },
  
  /**
   * Calculate number of nights between dates
   */
  calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Validate currency code
   */
  isValidCurrency(currency: string): boolean {
    return VALIDATION_RULES.CURRENCIES.includes(currency.toUpperCase());
  },
  
  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    return VALIDATION_RULES.PATTERNS.EMAIL.test(email);
  },
  
  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDateFormat(date: string): boolean {
    return VALIDATION_RULES.PATTERNS.DATE.test(date);
  },
  
  /**
   * Sanitize string for API usage (remove special characters)
   */
  sanitizeString(str: string): string {
    return str.replace(/[^\w\s\-\.]/g, '').trim();
  },
  
  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Deep clone object (for configuration safety)
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  },
  
  /**
   * Retry configuration for common scenarios
   */
  getRetryConfig(scenario: 'fast' | 'standard' | 'patient') {
    const configs = {
      fast: {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 2,
        jitter: true
      },
      standard: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true
      },
      patient: {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 1.5,
        jitter: true
      }
    };
    
    return configs[scenario];
  }
} as const;

/**
 * Health check utility for monitoring channel status
 */
export class ChannelHealthMonitor {
  private channels: Map<string, BaseChannel> = new Map();
  
  /**
   * Register a channel for health monitoring
   */
  register(channel: BaseChannel): void {
    this.channels.set(channel['channelName'], channel);
  }
  
  /**
   * Unregister a channel from monitoring
   */
  unregister(channelName: string): void {
    this.channels.delete(channelName);
  }
  
  /**
   * Get health status for all registered channels
   */
  async getHealthStatus(): Promise<Record<string, ConnectionHealth>> {
    const health: Record<string, ConnectionHealth> = {};
    
    for (const [name, channel] of this.channels) {
      health[name] = channel.getConnectionStatus();
    }
    
    return health;
  }
  
  /**
   * Test connection for all registered channels
   */
  async testAllConnections(): Promise<Record<string, { success: boolean; responseTime: number; error?: string }>> {
    const results: Record<string, any> = {};
    
    const promises = Array.from(this.channels.entries()).map(async ([name, channel]) => {
      try {
        const result = await channel.testConnection();
        results[name] = result;
      } catch (error) {
        results[name] = {
          success: false,
          responseTime: 0,
          error: (error as Error).message
        };
      }
    });
    
    await Promise.allSettled(promises);
    return results;
  }
  
  /**
   * Get channels with issues
   */
  getUnhealthyChannels(): string[] {
    const unhealthy: string[] = [];
    
    for (const [name, channel] of this.channels) {
      const health = channel.getConnectionStatus();
      if (health.status === ConnectionStatus.ERROR || health.status === ConnectionStatus.DISCONNECTED) {
        unhealthy.push(name);
      }
    }
    
    return unhealthy;
  }
}

/**
 * Global health monitor instance
 */
export const globalHealthMonitor = new ChannelHealthMonitor();

/**
 * Version information
 */
export const VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,
  BUILD: Date.now(),
  STRING: '1.0.0'
} as const;