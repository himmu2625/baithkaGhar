/**
 * Example implementation of BaseChannel for demonstration purposes
 * Shows how to extend BaseChannel to create a concrete OTA channel implementation
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
import { ValidationError, ChannelConnectionError, BookingProcessingError } from '../errors';

/**
 * Example channel implementation
 * This demonstrates the structure and patterns for implementing a real OTA channel
 */
export class ExampleChannel extends BaseChannel {
  private isConnected: boolean = false;
  private mockApiDelay: number = 1000; // Simulate API response time

  constructor(config: ChannelConfig) {
    super('example-channel', config);
    this.validateRequiredCredentials();
  }

  /**
   * Validate that required credentials are provided
   */
  private validateRequiredCredentials(): void {
    this.validateConfig(['apiKey', 'hotelId', 'username']);
  }

  /**
   * Get authentication headers for API requests
   */
  protected getAuthenticationHeaders(): Record<string, string> {
    const { apiKey, username } = this.config.credentials;
    return {
      'Authorization': `Bearer ${apiKey}`,
      'X-Hotel-ID': this.config.credentials.hotelId,
      'X-Username': username
    };
  }

  /**
   * Establish connection with the channel's API
   */
  async connect(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      this.logger.info('Establishing connection to Example Channel API');

      // Simulate API connection delay
      await this.simulateApiDelay();

      // Simulate connection logic
      const authHeaders = this.getAuthenticationHeaders();
      if (!authHeaders['Authorization'] || !authHeaders['X-Hotel-ID']) {
        throw new ValidationError(
          'Invalid authentication credentials',
          this.channelName,
          'credentials'
        );
      }

      this.isConnected = true;
      this.connectionStatus = 'connected' as any;
      this.logger.info('Successfully connected to Example Channel API');

      return true;
    }, 'connect');
  }

  /**
   * Close connection with the channel's API
   */
  async disconnect(): Promise<void> {
    return this.executeWithRetry(async () => {
      this.logger.info('Disconnecting from Example Channel API');

      // Simulate disconnection delay
      await this.simulateApiDelay(500);

      this.isConnected = false;
      this.connectionStatus = 'disconnected' as any;
      this.logger.info('Disconnected from Example Channel API');
    }, 'disconnect');
  }

  /**
   * Validate API credentials with the channel
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    details?: Record<string, any>;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info('Validating credentials with Example Channel');

      // Simulate credential validation delay
      await this.simulateApiDelay();

      const { apiKey, hotelId, username } = this.config.credentials;

      // Mock validation logic
      if (!apiKey || apiKey.length < 10) {
        return {
          valid: false,
          error: 'Invalid API key format'
        };
      }

      if (!hotelId || !hotelId.match(/^HOTEL_\d+$/)) {
        return {
          valid: false,
          error: 'Invalid hotel ID format'
        };
      }

      if (!username || !username.includes('@')) {
        return {
          valid: false,
          error: 'Invalid username format'
        };
      }

      this.apiVersion = '2.1';
      return {
        valid: true,
        details: {
          apiVersion: this.apiVersion,
          hotelId,
          validatedAt: new Date().toISOString()
        }
      };
    }, 'validateCredentials');
  }

  /**
   * Sync room inventory to the channel
   */
  async syncInventory(propertyId: string, inventoryData: InventoryData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting inventory sync for property ${propertyId}`, {
        itemCount: inventoryData.length
      });

      // Simulate API sync delay
      await this.simulateApiDelay(2000);

      // Mock sync logic with some failures for demonstration
      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      for (const item of inventoryData) {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          successCount++;
        } else {
          failureCount++;
          failures.push({
            itemId: `${item.roomTypeId}-${item.date}`,
            error: 'Simulated inventory sync failure',
            details: { roomTypeId: item.roomTypeId, date: item.date }
          });
        }
      }

      const result: SyncResult = {
        success: failureCount === 0,
        status: failureCount === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL,
        processedCount: inventoryData.length,
        successCount,
        failureCount,
        failures: failures.length > 0 ? failures : undefined,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          propertyId,
          syncType: 'inventory',
          apiVersion: this.apiVersion
        }
      };

      this.logger.info(`Inventory sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncInventory');
  }

  /**
   * Sync room pricing to the channel
   */
  async syncPricing(propertyId: string, pricingData: PricingData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting pricing sync for property ${propertyId}`, {
        itemCount: pricingData.length
      });

      // Simulate API sync delay
      await this.simulateApiDelay(1500);

      // Mock sync logic with high success rate
      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      for (const item of pricingData) {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          successCount++;
        } else {
          failureCount++;
          failures.push({
            itemId: `${item.roomTypeId}-${item.ratePlanId}-${item.date}`,
            error: 'Simulated pricing sync failure',
            details: { 
              roomTypeId: item.roomTypeId, 
              ratePlanId: item.ratePlanId,
              date: item.date,
              rate: item.rate
            }
          });
        }
      }

      const result: SyncResult = {
        success: failureCount === 0,
        status: failureCount === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL,
        processedCount: pricingData.length,
        successCount,
        failureCount,
        failures: failures.length > 0 ? failures : undefined,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          propertyId,
          syncType: 'pricing',
          apiVersion: this.apiVersion
        }
      };

      this.logger.info(`Pricing sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncPricing');
  }

  /**
   * Handle incoming booking from the channel
   */
  async handleIncomingBooking(bookingData: BookingData): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Processing incoming booking`, {
        externalBookingId: bookingData.externalBookingId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guest: bookingData.guest.email
      });

      // Simulate booking processing delay
      await this.simulateApiDelay();

      // Mock booking validation
      if (!bookingData.guest.email || !bookingData.guest.firstName) {
        return {
          success: false,
          error: 'Invalid guest information'
        };
      }

      if (new Date(bookingData.checkInDate) >= new Date(bookingData.checkOutDate)) {
        return {
          success: false,
          error: 'Invalid date range'
        };
      }

      // Generate mock internal booking ID
      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      this.logger.info(`Booking processed successfully`, {
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
   * Send booking confirmation to the channel
   */
  async confirmBooking(bookingId: string, externalBookingId?: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Confirming booking`, { bookingId, externalBookingId });

      // Simulate confirmation delay
      await this.simulateApiDelay();

      // Mock confirmation logic
      if (!bookingId) {
        return {
          success: false,
          error: 'Missing booking ID'
        };
      }

      const confirmationNumber = `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      this.logger.info(`Booking confirmed`, { bookingId, confirmationNumber });

      return {
        success: true,
        confirmationNumber
      };
    }, 'confirmBooking');
  }

  /**
   * Cancel a booking on the channel
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
      this.logger.info(`Cancelling booking`, { bookingId, externalBookingId, reason });

      // Simulate cancellation delay
      await this.simulateApiDelay();

      // Mock cancellation logic
      const cancellationId = `CANC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      this.logger.info(`Booking cancelled`, { bookingId, cancellationId });

      return {
        success: true,
        cancellationId
      };
    }, 'cancelBooking');
  }

  /**
   * Update an existing booking on the channel
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
      this.logger.info(`Updating booking`, { bookingId, externalBookingId, changes });

      // Simulate update delay
      await this.simulateApiDelay();

      // Mock update logic
      if (!this.config.features.supportsBookingModifications) {
        return {
          success: false,
          error: 'Booking modifications not supported by this channel'
        };
      }

      this.logger.info(`Booking updated`, { bookingId, externalBookingId });

      return {
        success: true,
        updatedBookingId: externalBookingId
      };
    }, 'updateBooking');
  }

  /**
   * Get booking status from the channel
   */
  async getBookingStatus(externalBookingId: string): Promise<{
    status: BookingStatus;
    details?: Record<string, any>;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Getting booking status`, { externalBookingId });

      // Simulate status check delay
      await this.simulateApiDelay(500);

      // Mock status retrieval
      const statuses = [BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.CANCELLED];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        status: randomStatus,
        details: {
          lastUpdated: new Date().toISOString(),
          statusCode: randomStatus.toUpperCase(),
          externalBookingId
        }
      };
    }, 'getBookingStatus');
  }

  /**
   * Simulate API delay for demonstration purposes
   */
  private async simulateApiDelay(customDelay?: number): Promise<void> {
    const delay = customDelay || this.mockApiDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}