/**
 * Abstract base class for all OTA channel integrations
 * Provides common functionality and interface for all channel implementations
 */

import { 
  ChannelConfig, 
  ConnectionStatus, 
  ConnectionHealth, 
  InventoryData, 
  PricingData, 
  BookingData, 
  BookingModification, 
  SyncResult,
  OperationContext,
  BookingStatus
} from './types';

import { 
  ChannelError,
  ChannelConnectionError,
  BookingProcessingError,
  ValidationError,
  AuthenticationError,
  TimeoutError
} from './errors';

import { RateLimiter } from './utils/RateLimiter';
import { ILogger, createLogger } from './utils/Logger';
import { RetryHandler, createRetryHandler, DEFAULT_CIRCUIT_CONFIG } from './utils/RetryHandler';

/**
 * Abstract base channel class that all OTA implementations must extend
 * Provides common functionality for connection management, rate limiting, logging, and error handling
 */
export abstract class BaseChannel {
  protected readonly channelName: string;
  protected readonly config: ChannelConfig;
  protected readonly logger: ILogger;
  protected readonly rateLimiter: RateLimiter;
  protected readonly retryHandler: RetryHandler;
  
  protected connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  protected lastConnectionTime?: Date;
  protected lastErrorTime?: Date;
  protected lastError?: Error;
  protected apiVersion?: string;
  
  // Performance metrics
  protected requestCount: number = 0;
  protected successCount: number = 0;
  protected errorCount: number = 0;
  protected totalResponseTime: number = 0;
  
  /**
   * Constructor for BaseChannel
   * @param channelName - Unique identifier for the channel (e.g., 'booking.com')
   * @param config - Channel configuration including credentials and settings
   */
  constructor(channelName: string, config: ChannelConfig) {
    this.channelName = channelName;
    this.config = config;
    
    // Initialize logger with channel context
    this.logger = createLogger(channelName, {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      logBodies: process.env.LOG_BODIES === 'true',
      logSensitive: process.env.LOG_SENSITIVE === 'true'
    });
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(channelName, config.rateLimits);
    
    // Initialize retry handler with circuit breaker
    this.retryHandler = createRetryHandler(
      channelName,
      this.logger,
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: config.timeouts?.retry || 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryOn: [408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
      },
      DEFAULT_CIRCUIT_CONFIG
    );
    
    this.logger.info(`${channelName} channel initialized`, {
      features: config.features,
      rateLimits: config.rateLimits
    });
  }

  // =============================================================================
  // ABSTRACT METHODS - Must be implemented by concrete channel classes
  // =============================================================================

  /**
   * Establish connection with the channel's API
   * Implement channel-specific authentication and connection logic
   * @returns Promise resolving to connection success status
   */
  abstract connect(): Promise<boolean>;

  /**
   * Close connection with the channel's API
   * Implement cleanup logic for connections, sessions, etc.
   * @returns Promise resolving when disconnection is complete
   */
  abstract disconnect(): Promise<void>;

  /**
   * Validate API credentials with the channel
   * Implement channel-specific credential validation
   * @returns Promise resolving to validation result with details
   */
  abstract validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    details?: Record<string, any>;
  }>;

  /**
   * Sync room inventory to the channel
   * @param propertyId - Property identifier
   * @param inventoryData - Array of inventory data to sync
   * @returns Promise resolving to sync results
   */
  abstract syncInventory(propertyId: string, inventoryData: InventoryData[]): Promise<SyncResult>;

  /**
   * Sync room pricing to the channel
   * @param propertyId - Property identifier  
   * @param pricingData - Array of pricing data to sync
   * @returns Promise resolving to sync results
   */
  abstract syncPricing(propertyId: string, pricingData: PricingData[]): Promise<SyncResult>;

  /**
   * Handle incoming booking from the channel
   * Process and validate booking data from OTA webhooks or API pulls
   * @param bookingData - Booking information from the channel
   * @returns Promise resolving to processing result
   */
  abstract handleIncomingBooking(bookingData: BookingData): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }>;

  /**
   * Send booking confirmation to the channel
   * @param bookingId - Internal booking identifier
   * @param externalBookingId - Channel's booking identifier
   * @returns Promise resolving to confirmation result
   */
  abstract confirmBooking(bookingId: string, externalBookingId?: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }>;

  /**
   * Cancel a booking on the channel
   * @param bookingId - Internal booking identifier
   * @param externalBookingId - Channel's booking identifier
   * @param reason - Cancellation reason
   * @returns Promise resolving to cancellation result
   */
  abstract cancelBooking(
    bookingId: string, 
    externalBookingId: string, 
    reason?: string
  ): Promise<{
    success: boolean;
    cancellationId?: string;
    error?: string;
  }>;

  /**
   * Update an existing booking on the channel
   * @param bookingId - Internal booking identifier
   * @param externalBookingId - Channel's booking identifier
   * @param changes - Modifications to apply
   * @returns Promise resolving to update result
   */
  abstract updateBooking(
    bookingId: string,
    externalBookingId: string,
    changes: BookingModification
  ): Promise<{
    success: boolean;
    updatedBookingId?: string;
    error?: string;
  }>;

  /**
   * Get booking status from the channel
   * @param externalBookingId - Channel's booking identifier
   * @returns Promise resolving to booking status information
   */
  abstract getBookingStatus(externalBookingId: string): Promise<{
    status: BookingStatus;
    details?: Record<string, any>;
    error?: string;
  }>;

  // =============================================================================
  // CONCRETE METHODS - Common functionality for all channels
  // =============================================================================

  /**
   * Get current connection status and health information
   * @returns Current connection health metrics
   */
  public getConnectionStatus(): ConnectionHealth {
    const rateLimitState = this.rateLimiter.getCurrentState();
    const circuitMetrics = this.retryHandler.getCircuitMetrics();
    
    return {
      status: this.connectionStatus,
      lastSuccess: this.lastConnectionTime,
      lastError: this.lastError ? {
        message: this.lastError.message,
        timestamp: this.lastErrorTime!,
        code: (this.lastError as any).code
      } : undefined,
      responseTime: {
        current: this.getLastResponseTime(),
        average: this.getAverageResponseTime(),
        min: 0, // Could track this if needed
        max: 0  // Could track this if needed
      },
      rateLimiting: {
        remainingRequests: rateLimitState.remaining,
        resetTime: rateLimitState.resetTime,
        isLimited: rateLimitState.isLimited
      },
      apiVersion: this.apiVersion,
      metadata: {
        requestCount: this.requestCount,
        successCount: this.successCount,
        errorCount: this.errorCount,
        successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        circuitBreakerState: circuitMetrics?.state,
        circuitFailureRate: circuitMetrics ? (circuitMetrics.recentFailureRate * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  /**
   * Test the connection to the channel
   * Performs a lightweight API call to verify connectivity
   * @returns Promise resolving to connection test result
   */
  public async testConnection(): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Testing connection to channel');
      
      // Perform credential validation as connection test
      const result = await this.validateCredentials();
      const responseTime = Date.now() - startTime;
      
      if (result.valid) {
        this.connectionStatus = ConnectionStatus.CONNECTED;
        this.lastConnectionTime = new Date();
        this.logger.info(`Connection test successful`, { responseTime });
        
        return {
          success: true,
          responseTime
        };
      } else {
        this.connectionStatus = ConnectionStatus.ERROR;
        this.lastError = new ValidationError(
          result.error || 'Credential validation failed',
          this.channelName
        );
        this.lastErrorTime = new Date();
        
        return {
          success: false,
          responseTime,
          error: result.error
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.connectionStatus = ConnectionStatus.ERROR;
      this.lastError = error as Error;
      this.lastErrorTime = new Date();
      
      this.logger.error('Connection test failed', error as Error, { responseTime });
      
      return {
        success: false,
        responseTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get channel capabilities and feature support
   * @returns Channel feature configuration
   */
  public getCapabilities(): ChannelConfig['features'] {
    return this.config.features;
  }

  /**
   * Get channel configuration (without sensitive data)
   * @returns Sanitized channel configuration
   */
  public getConfig(): Omit<ChannelConfig, 'credentials'> {
    const { credentials, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Reset channel metrics and state
   * Useful for testing or manual intervention
   */
  public resetMetrics(): void {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
    this.rateLimiter.reset();
    this.retryHandler.resetCircuit();
    
    this.logger.info('Channel metrics reset');
  }

  // =============================================================================
  // PROTECTED HELPER METHODS - For use by concrete implementations
  // =============================================================================

  /**
   * Execute an API request with rate limiting, retries, and error handling
   * @param operation - Function that performs the API request
   * @param operationName - Name for logging and debugging
   * @param context - Additional operation context
   * @returns Promise resolving to operation result
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<OperationContext>
  ): Promise<T> {
    const operationId = this.generateOperationId();
    const operationContext: OperationContext = {
      operationId,
      operation: operationName,
      startTime: new Date(),
      ...context
    };
    
    // Set operation context for logging
    this.logger.setContext(operationContext);
    
    try {
      // Check and apply rate limiting
      await this.rateLimiter.checkLimit();
      
      // Execute operation with retry logic
      const result = await this.retryHandler.execute(async () => {
        const startTime = Date.now();
        try {
          this.requestCount++;
          const result = await operation();
          
          // Record success metrics
          this.successCount++;
          this.totalResponseTime += Date.now() - startTime;
          
          return result;
        } catch (error) {
          // Record error metrics
          this.errorCount++;
          this.totalResponseTime += Date.now() - startTime;
          throw error;
        }
      }, operationName);
      
      this.logger.info(`Operation completed successfully: ${operationName}`, {
        operationId,
        duration: Date.now() - operationContext.startTime.getTime()
      });
      
      return result;
      
    } catch (error) {
      this.logger.error(`Operation failed: ${operationName}`, error as Error, {
        operationId,
        duration: Date.now() - operationContext.startTime.getTime()
      });
      
      // Convert to appropriate channel error if needed
      if (!(error instanceof ChannelError)) {
        throw new ChannelConnectionError(
          `${operationName} failed: ${(error as Error).message}`,
          this.channelName
        );
      }
      
      throw error;
    }
  }

  /**
   * Validate required configuration
   * @param requiredFields - Array of required configuration fields
   * @throws ValidationError if required fields are missing
   */
  protected validateConfig(requiredFields: string[]): void {
    const missing = requiredFields.filter(field => {
      const value = this.config.credentials[field];
      return !value || value.trim() === '';
    });
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required configuration: ${missing.join(', ')}`,
        this.channelName,
        missing.join(', ')
      );
    }
  }

  /**
   * Create HTTP request headers with authentication and common headers
   * @param additionalHeaders - Additional headers to include
   * @returns Complete headers object
   */
  protected createHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `Baithaka-GHAR-OS/1.0 (${this.channelName})`,
      'Accept': 'application/json',
      ...additionalHeaders
    };
    
    // Add authentication headers (implement in concrete classes)
    const authHeaders = this.getAuthenticationHeaders();
    Object.assign(headers, authHeaders);
    
    return headers;
  }

  /**
   * Get authentication headers for API requests
   * Override in concrete implementations to provide channel-specific auth
   * @returns Authentication headers
   */
  protected abstract getAuthenticationHeaders(): Record<string, string>;

  /**
   * Handle API response and extract relevant data
   * @param response - Fetch API response object
   * @returns Parsed response data
   * @throws ChannelConnectionError for HTTP errors
   */
  protected async handleResponse<T>(response: Response): Promise<T> {
    const responseTime = performance.now();
    
    // Log response details
    this.logger.debug(`Received API response`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = {};
      
      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            errorDetails = JSON.parse(errorBody);
            errorMessage += ` - ${errorDetails.message || errorDetails.error || errorBody}`;
          } catch {
            errorMessage += ` - ${errorBody.substring(0, 200)}`;
          }
        }
      } catch {
        // Ignore errors parsing error response
      }
      
      throw new ChannelConnectionError(
        errorMessage,
        this.channelName,
        response.status,
        undefined,
        { responseDetails: errorDetails }
      );
    }
    
    try {
      const data = await response.json();
      return data as T;
    } catch (error) {
      throw new ChannelError(
        'Failed to parse JSON response',
        this.channelName,
        { parseError: (error as Error).message }
      );
    }
  }

  /**
   * Create timeout-enabled fetch request
   * @param url - Request URL
   * @param options - Fetch options
   * @param timeoutMs - Request timeout in milliseconds
   * @returns Promise resolving to fetch response
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = this.config.timeouts?.request || 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: this.createHeaders(options.headers as Record<string, string>)
      });
      
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError(
          `Request timed out after ${timeoutMs}ms`,
          this.channelName,
          'fetch',
          timeoutMs
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Generate unique operation ID for tracking
   */
  private generateOperationId(): string {
    return `${this.channelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get last response time
   */
  private getLastResponseTime(): number {
    // This would need to be tracked per request
    return 0;
  }

  /**
   * Get average response time
   */
  private getAverageResponseTime(): number {
    return this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
  }
}

/**
 * Factory function to validate channel configuration
 * @param config - Channel configuration to validate
 * @returns Validation result
 */
export function validateChannelConfig(config: ChannelConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.channelName) errors.push('channelName is required');
  if (!config.displayName) errors.push('displayName is required');
  if (!config.endpoints?.production) errors.push('production endpoint is required');
  if (!config.rateLimits?.requestsPerMinute) errors.push('requestsPerMinute is required');
  if (!config.timeouts?.connection) errors.push('connection timeout is required');
  if (!config.timeouts?.request) errors.push('request timeout is required');
  
  // Validate credentials
  if (!config.credentials || Object.keys(config.credentials).length === 0) {
    errors.push('credentials are required');
  }
  
  // Validate features
  if (!config.features) {
    errors.push('features configuration is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}