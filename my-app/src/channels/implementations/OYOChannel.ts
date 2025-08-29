/**
 * OYO Channel Implementation
 * Implements the BaseChannel interface for OYO REST API integration
 * API Documentation: https://www.oyorooms.com/partners/api-docs
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
 * OYO specific configuration interface
 */
interface OYOCredentials {
  apiKey: string;
  propertyId: string;
  partnerId?: string;
  secretKey?: string;
}

/**
 * OYO API response interfaces
 */
interface OYOApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface OYOInventoryItem {
  property_id: string;
  room_type_id: string;
  date: string;
  available_rooms: number;
  min_stay?: number;
  max_stay?: number;
  stop_sell?: boolean;
}

interface OYORateItem {
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  date: string;
  base_rate: number;
  currency: string;
  max_occupancy: number;
}

/**
 * OYO REST API implementation
 * Uses JSON-based REST API with webhook support
 */
export class OYOChannel extends BaseChannel {
  private readonly credentials: OYOCredentials;
  private readonly baseUrl: string;
  private apiKey: string;
  
  constructor(config: ChannelConfig) {
    super('oyo', config);
    this.credentials = config.credentials as OYOCredentials;
    this.baseUrl = config.endpoints.production;
    this.apiKey = this.credentials.apiKey;
    this.validateRequiredCredentials();
  }

  /**
   * Validate that required credentials are provided
   */
  private validateRequiredCredentials(): void {
    this.validateConfig(['apiKey', 'propertyId']);
    
    if (!this.credentials.propertyId.startsWith('OYO_')) {
      throw new ValidationError(
        'OYO property ID must start with "OYO_"',
        this.channelName,
        'propertyId'
      );
    }
  }

  /**
   * Get authentication headers for API requests
   */
  protected getAuthenticationHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Property-ID': this.credentials.propertyId,
      'User-Agent': 'Baithaka-GHAR-OS/1.0 (OYO Integration)'
    };
  }

  /**
   * Establish connection with OYO API
   */
  async connect(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      this.logger.info('Establishing connection to OYO API');

      // Test connection by validating credentials
      const credentialResult = await this.validateCredentials();
      if (!credentialResult.valid) {
        throw new AuthenticationError(
          credentialResult.error || 'Authentication failed',
          this.channelName,
          'api_key'
        );
      }

      this.connectionStatus = 'connected' as any;
      this.logger.info('Successfully connected to OYO API');
      return true;
    }, 'connect');
  }

  /**
   * Close connection (OYO is stateless, so this is a no-op)
   */
  async disconnect(): Promise<void> {
    this.connectionStatus = 'disconnected' as any;
    this.logger.info('Disconnected from OYO API');
  }

  /**
   * Validate API credentials with OYO
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    details?: Record<string, any>;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info('Validating credentials with OYO');

      try {
        // Test API access with property info endpoint
        const response = await this.fetchWithTimeout(`${this.baseUrl}/properties/${this.credentials.propertyId}`);
        const data: OYOApiResponse<{ property_name: string; status: string }> = await this.handleResponse(response);

        if (data.success && data.data) {
          this.apiVersion = '2.0';
          return {
            valid: true,
            details: {
              propertyId: this.credentials.propertyId,
              propertyName: data.data.property_name,
              status: data.data.status,
              apiVersion: this.apiVersion,
              validatedAt: new Date().toISOString(),
              endpoint: this.baseUrl
            }
          };
        } else {
          return {
            valid: false,
            error: data.error?.message || data.message || 'Property not found or invalid credentials'
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
   * Sync room inventory to OYO
   */
  async syncInventory(propertyId: string, inventoryData: InventoryData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting inventory sync to OYO for property ${propertyId}`, {
        itemCount: inventoryData.length
      });

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Convert to OYO format
      const oyoInventoryItems: OYOInventoryItem[] = inventoryData.map(item => ({
        property_id: this.credentials.propertyId,
        room_type_id: item.roomTypeId,
        date: item.date,
        available_rooms: item.availability,
        min_stay: item.minStay,
        max_stay: item.maxStay,
        stop_sell: item.availability === 0
      }));

      // Process inventory in batches of 100
      const batchSize = 100;
      for (let i = 0; i < oyoInventoryItems.length; i += batchSize) {
        const batch = oyoInventoryItems.slice(i, i + batchSize);
        
        try {
          const response = await this.fetchWithTimeout(`${this.baseUrl}/inventory/bulk-update`, {
            method: 'POST',
            body: JSON.stringify({ 
              inventory: batch 
            })
          });

          const data: OYOApiResponse<{ 
            updated: number; 
            failed: Array<{ room_type_id: string; date: string; error: string }> 
          }> = await this.handleResponse(response);
          
          if (data.success && data.data) {
            const batchSuccessCount = data.data.updated || 0;
            const batchFailures = data.data.failed || [];
            
            successCount += batchSuccessCount;
            failureCount += batchFailures.length;
            
            // Add batch failures to overall failures
            batchFailures.forEach(failure => {
              failures.push({
                itemId: `${failure.room_type_id}-${failure.date}`,
                error: failure.error,
                details: { roomTypeId: failure.room_type_id, date: failure.date }
              });
            });

            this.logger.debug(`Inventory batch sync successful`, {
              batchIndex: Math.floor(i / batchSize) + 1,
              updatedCount: batchSuccessCount,
              failedCount: batchFailures.length
            });
          } else {
            failureCount += batch.length;
            const error = data.error?.message || data.message || 'Batch sync failed';
            
            batch.forEach(item => {
              failures.push({
                itemId: `${item.room_type_id}-${item.date}`,
                error,
                details: { roomTypeId: item.room_type_id, date: item.date }
              });
            });
          }
        } catch (error) {
          failureCount += batch.length;
          batch.forEach(item => {
            failures.push({
              itemId: `${item.room_type_id}-${item.date}`,
              error: (error as Error).message,
              details: { roomTypeId: item.room_type_id, date: item.date }
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

      this.logger.info(`OYO inventory sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncInventory');
  }

  /**
   * Sync room pricing to OYO
   */
  async syncPricing(propertyId: string, pricingData: PricingData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting pricing sync to OYO for property ${propertyId}`, {
        itemCount: pricingData.length
      });

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Convert to OYO format
      const oyoRateItems: OYORateItem[] = pricingData.map(item => ({
        property_id: this.credentials.propertyId,
        room_type_id: item.roomTypeId,
        rate_plan_id: item.ratePlanId,
        date: item.date,
        base_rate: item.rate,
        currency: item.currency,
        max_occupancy: item.occupancy
      }));

      // Process pricing in batches of 80
      const batchSize = 80;
      for (let i = 0; i < oyoRateItems.length; i += batchSize) {
        const batch = oyoRateItems.slice(i, i + batchSize);
        
        try {
          const response = await this.fetchWithTimeout(`${this.baseUrl}/rates/bulk-update`, {
            method: 'POST',
            body: JSON.stringify({ 
              rates: batch 
            })
          });

          const data: OYOApiResponse<{ 
            updated: number; 
            failed: Array<{ room_type_id: string; rate_plan_id: string; date: string; error: string }> 
          }> = await this.handleResponse(response);
          
          if (data.success && data.data) {
            const batchSuccessCount = data.data.updated || 0;
            const batchFailures = data.data.failed || [];
            
            successCount += batchSuccessCount;
            failureCount += batchFailures.length;
            
            // Add batch failures to overall failures
            batchFailures.forEach(failure => {
              failures.push({
                itemId: `${failure.room_type_id}-${failure.rate_plan_id}-${failure.date}`,
                error: failure.error,
                details: { 
                  roomTypeId: failure.room_type_id, 
                  ratePlanId: failure.rate_plan_id,
                  date: failure.date 
                }
              });
            });

            this.logger.debug(`Pricing batch sync successful`, {
              batchIndex: Math.floor(i / batchSize) + 1,
              updatedCount: batchSuccessCount,
              failedCount: batchFailures.length
            });
          } else {
            failureCount += batch.length;
            const error = data.error?.message || data.message || 'Batch sync failed';
            
            batch.forEach(item => {
              failures.push({
                itemId: `${item.room_type_id}-${item.rate_plan_id}-${item.date}`,
                error,
                details: { 
                  roomTypeId: item.room_type_id, 
                  ratePlanId: item.rate_plan_id,
                  date: item.date 
                }
              });
            });
          }
        } catch (error) {
          failureCount += batch.length;
          batch.forEach(item => {
            failures.push({
              itemId: `${item.room_type_id}-${item.rate_plan_id}-${item.date}`,
              error: (error as Error).message,
              details: { 
                roomTypeId: item.room_type_id, 
                ratePlanId: item.rate_plan_id,
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

      this.logger.info(`OYO pricing sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncPricing');
  }

  /**
   * Handle incoming booking from OYO
   * OYO typically sends bookings via webhooks
   */
  async handleIncomingBooking(bookingData: BookingData): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Processing OYO booking`, {
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
      
      // Send acknowledgment back to OYO
      await this.acknowledgeBooking(bookingId, bookingData.externalBookingId);

      this.logger.info(`OYO booking processed successfully`, {
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
   * Send booking confirmation to OYO
   */
  async confirmBooking(bookingId: string, externalBookingId?: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Confirming booking with OYO`, { 
        bookingId, 
        externalBookingId 
      });

      if (!externalBookingId) {
        return {
          success: false,
          error: 'External booking ID required for OYO confirmation'
        };
      }

      const payload = {
        booking_id: externalBookingId,
        property_booking_id: bookingId,
        status: 'confirmed',
        confirmation_time: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/confirm`, 
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        const data: OYOApiResponse<{ confirmation_number: string }> = await this.handleResponse(response);
        
        if (data.success && data.data) {
          const confirmationNumber = data.data.confirmation_number || `OYO-${Date.now()}`;
          
          this.logger.info(`Booking confirmed with OYO`, {
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
            error: data.error?.message || data.message || 'Confirmation failed'
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
   * Cancel a booking on OYO
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
      this.logger.info(`Cancelling booking with OYO`, { 
        bookingId, 
        externalBookingId, 
        reason 
      });

      const payload = {
        booking_id: externalBookingId,
        property_booking_id: bookingId,
        cancellation_reason: reason || 'Hotel cancellation',
        cancelled_by: 'property',
        cancellation_time: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/cancel`, 
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        const data: OYOApiResponse<{ cancellation_id: string }> = await this.handleResponse(response);
        
        if (data.success && data.data) {
          const cancellationId = data.data.cancellation_id || `CANC-${Date.now()}`;
          
          this.logger.info(`Booking cancelled with OYO`, {
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
            error: data.error?.message || data.message || 'Cancellation failed'
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
   * Update an existing booking on OYO
   * Note: OYO has limited modification support
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
      this.logger.info(`Updating booking with OYO`, { 
        bookingId, 
        externalBookingId, 
        changes 
      });

      // OYO has limited modification support
      if (!this.config.features.supportsBookingModifications) {
        return {
          success: false,
          error: 'Booking modifications not supported by OYO'
        };
      }

      const payload = {
        booking_id: externalBookingId,
        property_booking_id: bookingId,
        modifications: changes.changes,
        modification_reason: changes.reason,
        modified_time: new Date().toISOString()
      };

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}/modify`, 
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        const data: OYOApiResponse = await this.handleResponse(response);
        
        if (data.success) {
          this.logger.info(`Booking updated with OYO`, {
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
            error: data.error?.message || data.message || 'Modification failed'
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
   * Get booking status from OYO
   */
  async getBookingStatus(externalBookingId: string): Promise<{
    status: BookingStatus;
    details?: Record<string, any>;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Getting booking status from OYO`, { externalBookingId });

      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/bookings/${externalBookingId}`
        );

        const data: OYOApiResponse<{
          booking_status: string;
          check_in_date: string;
          check_out_date: string;
          guest_name: string;
          total_amount: number;
          payment_status: string;
        }> = await this.handleResponse(response);
        
        if (data.success && data.data) {
          const status = this.mapOYOStatusToBookingStatus(data.data.booking_status);

          return {
            status,
            details: {
              ...data.data,
              lastUpdated: new Date().toISOString(),
              source: 'oyo'
            }
          };
        } else {
          return {
            status: BookingStatus.UNKNOWN,
            error: data.error?.message || data.message || 'Status query failed'
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
   * Acknowledge booking receipt with OYO
   */
  private async acknowledgeBooking(bookingId: string, externalBookingId: string): Promise<void> {
    try {
      const payload = {
        booking_id: externalBookingId,
        property_booking_id: bookingId,
        acknowledged: true,
        acknowledged_time: new Date().toISOString()
      };

      await this.fetchWithTimeout(`${this.baseUrl}/bookings/${externalBookingId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      this.logger.debug('Booking acknowledged with OYO', { bookingId, externalBookingId });
    } catch (error) {
      this.logger.warn('Failed to acknowledge booking with OYO', error as Error);
      // Don't throw error as acknowledgment is not critical
    }
  }

  /**
   * Map OYO status to standard BookingStatus
   */
  private mapOYOStatusToBookingStatus(oyoStatus: string): BookingStatus {
    const statusMap: Record<string, BookingStatus> = {
      'CONFIRMED': BookingStatus.CONFIRMED,
      'PENDING_CONFIRMATION': BookingStatus.PENDING,
      'CANCELLED': BookingStatus.CANCELLED,
      'MODIFIED': BookingStatus.MODIFIED,
      'NO_SHOW': BookingStatus.NO_SHOW,
      'CHECKED_IN': BookingStatus.CONFIRMED,
      'CHECKED_OUT': BookingStatus.CONFIRMED
    };

    return statusMap[oyoStatus.toUpperCase()] || BookingStatus.UNKNOWN;
  }

  /**
   * Validate booking data from OYO
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
    return `OYO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}