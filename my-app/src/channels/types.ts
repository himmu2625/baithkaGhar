/**
 * Type definitions and interfaces for OTA channel operations
 */

/**
 * Connection status enum for channel health monitoring
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
  RATE_LIMITED = 'rate_limited',
  MAINTENANCE = 'maintenance'
}

/**
 * Sync operation status
 */
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

/**
 * Booking status enum
 */
export enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  MODIFIED = 'modified',
  NO_SHOW = 'no_show',
  UNKNOWN = 'unknown'
}

/**
 * Channel configuration interface
 */
export interface ChannelConfig {
  /** Unique channel identifier (e.g., 'booking.com', 'expedia') */
  channelName: string;
  
  /** Display name for UI */
  displayName: string;
  
  /** API credentials for the channel */
  credentials: Record<string, string>;
  
  /** API endpoint URLs */
  endpoints: {
    production: string;
    sandbox?: string;
    test?: string;
  };
  
  /** Rate limiting configuration */
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour?: number;
    burstLimit?: number;
  };
  
  /** Timeout settings */
  timeouts: {
    connection: number;
    request: number;
    retry: number;
  };
  
  /** Feature flags for channel capabilities */
  features: {
    supportsInventorySync: boolean;
    supportsPricingSync: boolean;
    supportsBookingWebhooks: boolean;
    supportsBookingModifications: boolean;
    supportsCancellations: boolean;
  };
  
  /** Channel-specific settings */
  settings: Record<string, any>;
}

/**
 * Room inventory data structure
 */
export interface InventoryData {
  /** Property identifier */
  propertyId: string;
  
  /** Room type identifier */
  roomTypeId: string;
  
  /** Date for inventory (YYYY-MM-DD) */
  date: string;
  
  /** Available rooms count */
  availability: number;
  
  /** Minimum stay requirement */
  minStay?: number;
  
  /** Maximum stay requirement */
  maxStay?: number;
  
  /** Closed to arrival flag */
  closedToArrival?: boolean;
  
  /** Closed to departure flag */
  closedToDeparture?: boolean;
  
  /** Additional inventory metadata */
  metadata?: Record<string, any>;
}

/**
 * Room pricing data structure
 */
export interface PricingData {
  /** Property identifier */
  propertyId: string;
  
  /** Room type identifier */
  roomTypeId: string;
  
  /** Rate plan identifier */
  ratePlanId: string;
  
  /** Date for pricing (YYYY-MM-DD) */
  date: string;
  
  /** Room rate amount */
  rate: number;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Occupancy this rate applies to */
  occupancy: number;
  
  /** Extra person charges */
  extraPersonCharge?: number;
  
  /** Child charges */
  childCharge?: number;
  
  /** Meal plan included */
  mealPlan?: string;
  
  /** Cancellation policy */
  cancellationPolicy?: string;
  
  /** Additional pricing metadata */
  metadata?: Record<string, any>;
}

/**
 * Booking data structure for incoming bookings
 */
export interface BookingData {
  /** External booking ID from OTA */
  externalBookingId: string;
  
  /** Internal booking ID (if exists) */
  internalBookingId?: string;
  
  /** Property identifier */
  propertyId: string;
  
  /** Room type identifier */
  roomTypeId: string;
  
  /** Rate plan identifier */
  ratePlanId?: string;
  
  /** Check-in date (YYYY-MM-DD) */
  checkInDate: string;
  
  /** Check-out date (YYYY-MM-DD) */
  checkOutDate: string;
  
  /** Number of nights */
  nights: number;
  
  /** Number of rooms */
  roomCount: number;
  
  /** Total number of guests */
  totalGuests: number;
  
  /** Number of adults */
  adults: number;
  
  /** Number of children */
  children: number;
  
  /** Guest information */
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      country: string;
      postalCode?: string;
    };
  };
  
  /** Booking amounts */
  pricing: {
    totalAmount: number;
    currency: string;
    breakdown?: {
      baseRate: number;
      taxes: number;
      fees: number;
      discounts?: number;
    };
  };
  
  /** Payment information */
  payment: {
    method: string;
    status: 'pending' | 'confirmed' | 'failed';
    collectedByChannel?: boolean;
  };
  
  /** Booking status */
  status: BookingStatus;
  
  /** Special requests */
  specialRequests?: string;
  
  /** Booking source channel */
  channel: string;
  
  /** Booking timestamps */
  timestamps: {
    created: Date;
    modified?: Date;
    cancelled?: Date;
  };
  
  /** Additional booking metadata */
  metadata?: Record<string, any>;
}

/**
 * Booking modification data
 */
export interface BookingModification {
  /** Fields to modify */
  changes: {
    checkInDate?: string;
    checkOutDate?: string;
    roomCount?: number;
    totalGuests?: number;
    adults?: number;
    children?: number;
    specialRequests?: string;
  };
  
  /** Reason for modification */
  reason?: string;
  
  /** Modification timestamp */
  timestamp: Date;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  /** Overall operation success */
  success: boolean;
  
  /** Sync status */
  status: SyncStatus;
  
  /** Number of items processed */
  processedCount: number;
  
  /** Number of successful operations */
  successCount: number;
  
  /** Number of failed operations */
  failureCount: number;
  
  /** List of failed items */
  failures?: Array<{
    itemId: string;
    error: string;
    details?: Record<string, any>;
  }>;
  
  /** Operation duration in milliseconds */
  duration: number;
  
  /** Sync timestamp */
  timestamp: Date;
  
  /** Additional result metadata */
  metadata?: Record<string, any>;
}

/**
 * Connection health information
 */
export interface ConnectionHealth {
  /** Current connection status */
  status: ConnectionStatus;
  
  /** Last successful connection timestamp */
  lastSuccess?: Date;
  
  /** Last connection error */
  lastError?: {
    message: string;
    timestamp: Date;
    code?: string;
  };
  
  /** Response time metrics in milliseconds */
  responseTime: {
    current?: number;
    average?: number;
    min?: number;
    max?: number;
  };
  
  /** Rate limiting information */
  rateLimiting: {
    remainingRequests: number;
    resetTime?: Date;
    isLimited: boolean;
  };
  
  /** API version being used */
  apiVersion?: string;
  
  /** Additional health metadata */
  metadata?: Record<string, any>;
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  /** Remaining requests in current window */
  remaining: number;
  
  /** Request limit for current window */
  limit: number;
  
  /** Window reset time */
  resetTime: Date;
  
  /** Current burst allowance */
  burstRemaining?: number;
  
  /** Whether requests are currently limited */
  isLimited: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  
  /** Whether to add random jitter */
  jitter: boolean;
  
  /** Conditions that should trigger a retry */
  retryOn: Array<number | string>;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Whether to log request/response bodies */
  logBodies: boolean;
  
  /** Whether to log sensitive data (credentials) */
  logSensitive: boolean;
  
  /** Custom log formatter */
  formatter?: (data: any) => string;
}

/**
 * Channel operation context for logging and debugging
 */
export interface OperationContext {
  /** Unique operation identifier */
  operationId: string;
  
  /** Operation type */
  operation: string;
  
  /** Property identifier */
  propertyId?: string;
  
  /** User or system identifier */
  userId?: string;
  
  /** Request correlation ID */
  correlationId?: string;
  
  /** Operation start time */
  startTime: Date;
  
  /** Additional context data */
  metadata?: Record<string, any>;
}