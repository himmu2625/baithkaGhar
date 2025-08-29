/**
 * MakeMyTrip Channel Implementation
 * Implements the BaseChannel interface for MakeMyTrip REST API integration
 * API Documentation: https://partners.makemytrip.com/api-docs
 */

import { BaseChannel } from '../BaseChannel';
import { 
  ChannelConfig, 
  InventoryData, 
  PricingData, 
  BookingData, 
  BookingModification,
  SyncResult, 
  BookingStatus,
  SyncStatus 
} from '../types';
import { 
  ValidationError, 
  ChannelConnectionError, 
  BookingProcessingError,
  AuthenticationError 
} from '../errors';

/**
 * MakeMyTrip specific configuration interface
 */
interface MakeMyTripCredentials {
  apiKey: string;
  apiSecret: string;
  hotelCode: string;
  partnerId: string;
  username?: string;
  password?: string;
}

/**
 * MakeMyTrip API response interfaces
 */
interface MMTApiResponse<T = any> {
  status: 'success' | 'error' | 'failure';
  statusCode: number;
  message?: string;
  data?: T;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

interface MMTInventoryRequest {
  hotelCode: string;
  roomTypeCode: string;
  date: string;
  availability: number;
  minStay?: number;
  maxStay?: number;
  stopSell?: boolean;
}

interface MMTPricingRequest {
  hotelCode: string;
  roomTypeCode: string;
  ratePlanCode: string;
  date: string;
  rate: number;
  currency: string;
  occupancy: number;
}

/**
 * MakeMyTrip REST API implementation
 * Uses JSON-based REST API for all operations
 */
export class MakeMyTripChannel extends BaseChannel {
  private readonly credentials: MakeMyTripCredentials;
  private readonly baseUrl: string;
  private authToken?: string;
  private tokenExpiry?: Date;
  
  constructor(config: ChannelConfig) {
    super('makemytrip', config);
    this.credentials = config.credentials as MakeMyTripCredentials;
    this.baseUrl = config.endpoints.production;
    this.validateRequiredCredentials();
  }

  /**
   * Validate that required credentials are provided
   */
  private validateRequiredCredentials(): void {
    this.validateConfig(['apiKey', 'apiSecret', 'hotelCode', 'partnerId']);
    
    if (this.credentials.hotelCode.length < 3) {
      throw new ValidationError(
        'MakeMyTrip hotel code must be at least 3 characters',
        this.channelName,
        'hotelCode'
      );
    }
  }

  /**
   * Get authentication headers for API requests
   */
  protected getAuthenticationHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.credentials.apiKey,
      'X-Partner-ID': this.credentials.partnerId,
      'User-Agent': 'Baithaka-GHAR-OS/1.0 (MakeMyTrip Integration)'
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Establish connection with MakeMyTrip API
   */
  async connect(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      this.logger.info('Establishing connection to MakeMyTrip API');

      // Authenticate and get access token
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new AuthenticationError(
          authResult.error || 'Authentication failed',
          this.channelName,
          'api_key'
        );
      }

      this.connectionStatus = 'connected' as any;
      this.logger.info('Successfully connected to MakeMyTrip API');
      return true;
    }, 'connect');
  }

  /**
   * Close connection (clear auth token)
   */
  async disconnect(): Promise<void> {
    this.authToken = undefined;
    this.tokenExpiry = undefined;
    this.connectionStatus = 'disconnected' as any;
    this.logger.info('Disconnected from MakeMyTrip API');
  }

  /**
   * Authenticate with MakeMyTrip API and get access token
   */
  private async authenticate(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.debug('Authenticating with MakeMyTrip API');

      const authPayload = {
        apiKey: this.credentials.apiKey,
        apiSecret: this.credentials.apiSecret,
        partnerId: this.credentials.partnerId,
        hotelCode: this.credentials.hotelCode
      };

      const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        body: JSON.stringify(authPayload)
      });

      const data: MMTApiResponse<{ token: string; expiresIn: number }> = await this.handleResponse(response);

      if (data.status === 'success' && data.data?.token) {
        this.authToken = data.data.token;
        this.tokenExpiry = new Date(Date.now() + (data.data.expiresIn * 1000));
        
        this.logger.debug('Authentication successful', {
          tokenExpiry: this.tokenExpiry.toISOString()
        });

        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Authentication failed' 
        };
      }
    } catch (error) {
      this.logger.error('Authentication failed', error as Error);
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Ensure we have a valid authentication token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      this.logger.debug('Token expired or missing, re-authenticating');
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new AuthenticationError(
          authResult.error || 'Re-authentication failed',
          this.channelName
        );
      }
    }
  }

  /**
   * Validate API credentials with MakeMyTrip
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    details?: Record<string, any>;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info('Validating credentials with MakeMyTrip');

      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          valid: false,
          error: authResult.error
        };
      }

      // Test API access with hotel info endpoint
      try {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/hotels/${this.credentials.hotelCode}`);
        const data: MMTApiResponse = await this.handleResponse(response);

        if (data.status === 'success') {
          this.apiVersion = '1.0';
          return {
            valid: true,
            details: {
              hotelCode: this.credentials.hotelCode,
              partnerId: this.credentials.partnerId,
              apiVersion: this.apiVersion,
              validatedAt: new Date().toISOString(),
              endpoint: this.baseUrl
            }
          };
        } else {
          return {
            valid: false,
            error: data.message || 'API test call failed'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: (error as Error).message
        };
      }
    }, 'validateCredentials');
  }

  /**
   * Sync room inventory to MakeMyTrip
   */
  async syncInventory(propertyId: string, inventoryData: InventoryData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting inventory sync to MakeMyTrip for property ${propertyId}`, {
        itemCount: inventoryData.length
      });

      await this.ensureAuthenticated();

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Process inventory in batches of 50
      const batchSize = 50;
      for (let i = 0; i < inventoryData.length; i += batchSize) {
        const batch = inventoryData.slice(i, i + batchSize);
        
        try {
          const mmtRequests: MMTInventoryRequest[] = batch.map(item => ({
            hotelCode: this.credentials.hotelCode,
            roomTypeCode: item.roomTypeId,
            date: item.date,
            availability: item.availability,
            minStay: item.minStay,
            maxStay: item.maxStay,
            stopSell: item.availability === 0
          }));

          const response = await this.fetchWithTimeout(`${this.baseUrl}/inventory/batch`, {
            method: 'PUT',
            body: JSON.stringify({ 
              requests: mmtRequests 
            })
          });

          const data: MMTApiResponse<{ processed: number; failed: any[] }> = await this.handleResponse(response);
          
          if (data.status === 'success') {
            const batchSuccessCount = data.data?.processed || batch.length;
            const batchFailures = data.data?.failed || [];
            
            successCount += batchSuccessCount;
            failureCount += batchFailures.length;
            
            // Add batch failures to overall failures
            batchFailures.forEach((failure: any) => {
              failures.push({
                itemId: `${failure.roomTypeCode}-${failure.date}`,
                error: failure.error || 'Unknown error',
                details: failure
              });
            });

            this.logger.debug(`Inventory batch sync successful`, {
              batchIndex: Math.floor(i / batchSize) + 1,
              processedCount: batchSuccessCount,
              failedCount: batchFailures.length
            });
          } else {
            failureCount += batch.length;
            const error = data.message || 'Batch sync failed';
            
            batch.forEach(item => {
              failures.push({
                itemId: `${item.roomTypeId}-${item.date}`,
                error,
                details: { roomTypeId: item.roomTypeId, date: item.date }
              });
            });
          }
        } catch (error) {
          failureCount += batch.length;
          batch.forEach(item => {
            failures.push({
              itemId: `${item.roomTypeId}-${item.date}`,
              error: (error as Error).message,
              details: { roomTypeId: item.roomTypeId, date: item.date }
            });
          });
        }
      }

      const result: SyncResult = {
        success: failureCount === 0,
        status: failureCount === 0 ? SyncStatus.COMPLETED : 
                failureCount < inventoryData.length ? SyncStatus.PARTIAL : SyncStatus.FAILED,
        processedCount: inventoryData.length,
        successCount,
        failureCount,
        failures: failures.length > 0 ? failures : undefined,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          propertyId,
          syncType: 'inventory',
          channel: this.channelName,
          batchSize,
          batchCount: Math.ceil(inventoryData.length / batchSize)
        }
      };

      this.logger.info(`MakeMyTrip inventory sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncInventory');
  }

  /**
   * Sync room pricing to MakeMyTrip
   */
  async syncPricing(propertyId: string, pricingData: PricingData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting pricing sync to MakeMyTrip for property ${propertyId}`, {
        itemCount: pricingData.length
      });

      await this.ensureAuthenticated();

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Process pricing in batches of 30
      const batchSize = 30;
      for (let i = 0; i < pricingData.length; i += batchSize) {
        const batch = pricingData.slice(i, i + batchSize);
        
        try {
          const mmtRequests: MMTPricingRequest[] = batch.map(item => ({
            hotelCode: this.credentials.hotelCode,
            roomTypeCode: item.roomTypeId,
            ratePlanCode: item.ratePlanId,
            date: item.date,
            rate: item.rate,
            currency: item.currency,
            occupancy: item.occupancy
          }));

          const response = await this.fetchWithTimeout(`${this.baseUrl}/rates/batch`, {
            method: 'PUT',
            body: JSON.stringify({ 
              requests: mmtRequests 
            })
          });

          const data: MMTApiResponse<{ processed: number; failed: any[] }> = await this.handleResponse(response);
          
          if (data.status === 'success') {
            const batchSuccessCount = data.data?.processed || batch.length;
            const batchFailures = data.data?.failed || [];
            
            successCount += batchSuccessCount;
            failureCount += batchFailures.length;
            
            // Add batch failures to overall failures
            batchFailures.forEach((failure: any) => {
              failures.push({
                itemId: `${failure.roomTypeCode}-${failure.ratePlanCode}-${failure.date}`,
                error: failure.error || 'Unknown error',
                details: failure
              });
            });

            this.logger.debug(`Pricing batch sync successful`, {
              batchIndex: Math.floor(i / batchSize) + 1,
              processedCount: batchSuccessCount,
              failedCount: batchFailures.length
            });
          } else {
            failureCount += batch.length;
            const error = data.message || 'Batch sync failed';
            
            batch.forEach(item => {
              failures.push({
                itemId: `${item.roomTypeId}-${item.ratePlanId}-${item.date}`,
                error,
                details: { 
                  roomTypeId: item.roomTypeId, 
                  ratePlanId: item.ratePlanId,
                  date: item.date 
                }
              });
            });
          }
        } catch (error) {
          failureCount += batch.length;
          batch.forEach(item => {
            failures.push({
              itemId: `${item.roomTypeId}-${item.ratePlanId}-${item.date}`,
              error: (error as Error).message,
              details: { 
                roomTypeId: item.roomTypeId, 
                ratePlanId: item.ratePlanId,
                date: item.date 
              }
            });
          });
        }
      }

      const result: SyncResult = {
        success: failureCount === 0,
        status: failureCount === 0 ? SyncStatus.COMPLETED : 
                failureCount < pricingData.length ? SyncStatus.PARTIAL : SyncStatus.FAILED,
        processedCount: pricingData.length,
        successCount,
        failureCount,
        failures: failures.length > 0 ? failures : undefined,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          propertyId,
          syncType: 'pricing',
          channel: this.channelName,
          batchSize,
          batchCount: Math.ceil(pricingData.length / batchSize)
        }
      };

      this.logger.info(`MakeMyTrip pricing sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncPricing');
  }

  /**
   * Handle incoming booking from MakeMyTrip
   */
  async handleIncomingBooking(bookingData: BookingData): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Processing MakeMyTrip booking`, {
        externalBookingId: bookingData.externalBookingId,
        guestEmail: bookingData.guest.email,
        checkIn: bookingData.checkInDate,
        checkOut: bookingData.checkOutDate
      });

      // Validate booking data
      const validation = this.validateBookingData(bookingData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Process booking (this would integrate with your PMS)
      const bookingId = this.generateInternalBookingId();
      
      // Send acknowledgment back to MakeMyTrip
      await this.acknowledgeBooking(bookingId, bookingData.externalBookingId);

      this.logger.info(`MakeMyTrip booking processed successfully`, {
        internalBookingId: bookingId,
        externalBookingId: bookingData.externalBookingId
      });

      return {
        success: true,
        bookingId
      };
    }, 'handleIncomingBooking');
  }

  /**
   * Send booking confirmation to MakeMyTrip
   */
  async confirmBooking(bookingId: string, externalBookingId?: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Confirming booking with MakeMyTrip`, { 
        bookingId, 
        externalBookingId 
      });

      if (!externalBookingId) {
        return {
          success: false,
          error: 'External booking ID required for MakeMyTrip confirmation'
        };
      }

      await this.ensureAuthenticated();

      const payload = {
        bookingId: externalBookingId,
        internalBookingId: bookingId,
        status: 'confirmed',
        timestamp: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/confirm`, 
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        const data: MMTApiResponse<{ confirmationNumber: string }> = await this.handleResponse(response);
        
        if (data.status === 'success') {
          const confirmationNumber = data.data?.confirmationNumber || `MMT-${Date.now()}`;
          
          this.logger.info(`Booking confirmed with MakeMyTrip`, {
            bookingId,
            confirmationNumber
          });

          return {
            success: true,
            confirmationNumber
          };
        } else {
          return {
            success: false,
            error: data.message || 'Confirmation failed'
          };
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    }, 'confirmBooking');
  }

  /**
   * Cancel a booking on MakeMyTrip
   */
  async cancelBooking(
    bookingId: string,
    externalBookingId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    cancellationId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Cancelling booking with MakeMyTrip`, { 
        bookingId, 
        externalBookingId, 
        reason 
      });

      await this.ensureAuthenticated();

      const payload = {
        bookingId: externalBookingId,
        internalBookingId: bookingId,
        reason: reason || 'Hotel cancellation',
        timestamp: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/cancel`, 
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        const data: MMTApiResponse<{ cancellationId: string }> = await this.handleResponse(response);
        
        if (data.status === 'success') {
          const cancellationId = data.data?.cancellationId || `CANC-${Date.now()}`;
          
          this.logger.info(`Booking cancelled with MakeMyTrip`, {
            bookingId,
            cancellationId
          });

          return {
            success: true,
            cancellationId
          };
        } else {
          return {
            success: false,
            error: data.message || 'Cancellation failed'
          };
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    }, 'cancelBooking');
  }

  /**
   * Update an existing booking on MakeMyTrip
   * Note: MakeMyTrip has limited modification support
   */
  async updateBooking(
    bookingId: string,
    externalBookingId: string,
    changes: BookingModification
  ): Promise<{
    success: boolean;
    updatedBookingId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Updating booking with MakeMyTrip`, { 
        bookingId, 
        externalBookingId, 
        changes 
      });

      // MakeMyTrip has limited modification support
      if (!this.config.features.supportsBookingModifications) {
        return {
          success: false,
          error: 'Booking modifications not supported by MakeMyTrip'
        };
      }

      await this.ensureAuthenticated();

      const payload = {
        bookingId: externalBookingId,
        internalBookingId: bookingId,
        changes: changes.changes,
        reason: changes.reason,
        timestamp: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/modify`, 
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        const data: MMTApiResponse = await this.handleResponse(response);
        
        if (data.status === 'success') {
          this.logger.info(`Booking updated with MakeMyTrip`, {
            bookingId,
            externalBookingId
          });

          return {
            success: true,
            updatedBookingId: externalBookingId
          };
        } else {
          return {
            success: false,
            error: data.message || 'Modification failed'
          };
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    }, 'updateBooking');
  }

  /**
   * Get booking status from MakeMyTrip
   */
  async getBookingStatus(externalBookingId: string): Promise<{
    status: BookingStatus;
    details?: Record<string, any>;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Getting booking status from MakeMyTrip`, { externalBookingId });

      await this.ensureAuthenticated();

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/status`
        );

        const data: MMTApiResponse<{
          status: string;
          checkInDate: string;
          checkOutDate: string;
          guestName: string;
          totalAmount: number;
        }> = await this.handleResponse(response);
        
        if (data.status === 'success' && data.data) {
          const status = this.mapMMTStatusToBookingStatus(data.data.status);

          return {
            status,
            details: {
              ...data.data,
              lastUpdated: new Date().toISOString(),
              source: 'makemytrip'
            }
          };
        } else {
          return {
            status: BookingStatus.UNKNOWN,
            error: data.message || 'Status query failed'
          };
        }
      } catch (error) {
        return {
          status: BookingStatus.UNKNOWN,
          error: (error as Error).message
        };
      }
    }, 'getBookingStatus');
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Acknowledge booking receipt with MakeMyTrip
   */
  private async acknowledgeBooking(bookingId: string, externalBookingId: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        bookingId: externalBookingId,
        internalBookingId: bookingId,
        acknowledged: true,
        timestamp: new Date().toISOString()
      };

      await this.fetchWithTimeout(`${this.baseUrl}/bookings/${externalBookingId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      this.logger.debug('Booking acknowledged with MakeMyTrip', { bookingId, externalBookingId });
    } catch (error) {
      this.logger.warn('Failed to acknowledge booking with MakeMyTrip', error as Error);
      // Don't throw error as acknowledgment is not critical
    }
  }

  /**
   * Map MakeMyTrip status to standard BookingStatus
   */
  private mapMMTStatusToBookingStatus(mmtStatus: string): BookingStatus {
    const statusMap: Record<string, BookingStatus> = {
      'CONFIRMED': BookingStatus.CONFIRMED,
      'PENDING': BookingStatus.PENDING,
      'CANCELLED': BookingStatus.CANCELLED,
      'MODIFIED': BookingStatus.MODIFIED,
      'NO_SHOW': BookingStatus.NO_SHOW,
      'COMPLETED': BookingStatus.CONFIRMED
    };

    return statusMap[mmtStatus.toUpperCase()] || BookingStatus.UNKNOWN;
  }

  /**
   * Validate booking data from MakeMyTrip
   */
  private validateBookingData(bookingData: BookingData): { valid: boolean; error?: string } {
    if (!bookingData.externalBookingId) {
      return { valid: false, error: 'Missing external booking ID' };
    }

    if (!bookingData.guest.email || !bookingData.guest.firstName) {
      return { valid: false, error: 'Missing required guest information' };
    }

    if (new Date(bookingData.checkInDate) >= new Date(bookingData.checkOutDate)) {
      return { valid: false, error: 'Invalid date range' };
    }

    if (bookingData.roomCount < 1 || bookingData.totalGuests < 1) {
      return { valid: false, error: 'Invalid room or guest count' };
    }

    if (!bookingData.pricing?.totalAmount || bookingData.pricing.totalAmount <= 0) {
      return { valid: false, error: 'Invalid booking amount' };
    }

    return { valid: true };
  }

  /**
   * Generate internal booking ID
   */
  private generateInternalBookingId(): string {
    return `MMT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}