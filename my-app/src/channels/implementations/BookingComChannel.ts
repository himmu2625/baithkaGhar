/**
 * Booking.com Channel Implementation
 * Implements the BaseChannel interface for Booking.com XML API integration
 * API Documentation: https://distribution-xml.booking.com/2.4/
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
 * Booking.com specific configuration interface
 */
interface BookingComCredentials {
  username: string;
  password: string;
  hotelId: string;
  partnerId?: string;
  apiKey?: string;
}

/**
 * Booking.com XML API implementation
 * Uses XML-based API for all operations (no REST API available)
 */
export class BookingComChannel extends BaseChannel {
  private readonly credentials: BookingComCredentials;
  private readonly baseUrl: string;
  private sessionId?: string;
  
  constructor(config: ChannelConfig) {
    super('booking.com', config);
    this.credentials = config.credentials as BookingComCredentials;
    this.baseUrl = config.endpoints.production;
    this.validateRequiredCredentials();
  }

  /**
   * Validate that required credentials are provided
   */
  private validateRequiredCredentials(): void {
    this.validateConfig(['username', 'password', 'hotelId']);
    
    if (!this.credentials.username.includes('@')) {
      throw new ValidationError(
        'Booking.com username must be an email address',
        this.channelName,
        'username'
      );
    }
  }

  /**
   * Get authentication headers for API requests
   */
  protected getAuthenticationHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
    
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '',
      'User-Agent': 'Baithaka-GHAR-OS/1.0 (Booking.com Integration)'
    };
  }

  /**
   * Establish connection with Booking.com XML API
   */
  async connect(): Promise<boolean> {
    return this.executeWithRetry(async () => {
      this.logger.info('Establishing connection to Booking.com XML API');

      // Test connection by validating credentials
      const credentialResult = await this.validateCredentials();
      if (!credentialResult.valid) {
        throw new AuthenticationError(
          credentialResult.error || 'Authentication failed',
          this.channelName,
          'basic_auth'
        );
      }

      this.connectionStatus = 'connected' as any;
      this.logger.info('Successfully connected to Booking.com API');
      return true;
    }, 'connect');
  }

  /**
   * Close connection (Booking.com is stateless, so this is a no-op)
   */
  async disconnect(): Promise<void> {
    this.sessionId = undefined;
    this.connectionStatus = 'disconnected' as any;
    this.logger.info('Disconnected from Booking.com API');
  }

  /**
   * Validate API credentials with Booking.com
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    details?: Record<string, any>;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info('Validating credentials with Booking.com');

      const xml = this.buildAuthTestXML();
      const response = await this.sendXMLRequest(xml, 'auth_test');
      
      if (response.includes('<fault>') || response.includes('<error>')) {
        const error = this.extractError(response);
        return {
          valid: false,
          error: error || 'Authentication failed - invalid credentials'
        };
      }

      // Check for successful authentication indicators
      if (response.includes('<hotel_id>') && response.includes(this.credentials.hotelId)) {
        this.apiVersion = '2.4';
        return {
          valid: true,
          details: {
            hotelId: this.credentials.hotelId,
            apiVersion: this.apiVersion,
            validatedAt: new Date().toISOString(),
            endpoint: this.baseUrl
          }
        };
      }

      return {
        valid: false,
        error: 'Authentication response invalid'
      };
    }, 'validateCredentials');
  }

  /**
   * Sync room inventory to Booking.com
   */
  async syncInventory(propertyId: string, inventoryData: InventoryData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting inventory sync to Booking.com for property ${propertyId}`, {
        itemCount: inventoryData.length
      });

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Group inventory data by date for batch processing
      const inventoryByDate = this.groupInventoryByDate(inventoryData);

      for (const [date, items] of inventoryByDate.entries()) {
        try {
          const xml = this.buildInventorySyncXML(items, date);
          const response = await this.sendXMLRequest(xml, 'inventory_sync');
          
          if (this.isXMLSuccess(response)) {
            successCount += items.length;
            this.logger.debug(`Inventory sync successful for date ${date}`, {
              itemCount: items.length
            });
          } else {
            const error = this.extractError(response);
            failureCount += items.length;
            
            items.forEach(item => {
              failures.push({
                itemId: `${item.roomTypeId}-${item.date}`,
                error: error || 'Unknown sync error',
                details: { roomTypeId: item.roomTypeId, date: item.date }
              });
            });
          }
        } catch (error) {
          failureCount += items.length;
          items.forEach(item => {
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
          batchCount: inventoryByDate.size
        }
      };

      this.logger.info(`Booking.com inventory sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncInventory');
  }

  /**
   * Sync room pricing to Booking.com
   */
  async syncPricing(propertyId: string, pricingData: PricingData[]): Promise<SyncResult> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      this.logger.info(`Starting pricing sync to Booking.com for property ${propertyId}`, {
        itemCount: pricingData.length
      });

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ itemId: string; error: string; details?: Record<string, any> }> = [];

      // Group pricing data by date for batch processing
      const pricingByDate = this.groupPricingByDate(pricingData);

      for (const [date, items] of pricingByDate.entries()) {
        try {
          const xml = this.buildPricingSyncXML(items, date);
          const response = await this.sendXMLRequest(xml, 'pricing_sync');
          
          if (this.isXMLSuccess(response)) {
            successCount += items.length;
            this.logger.debug(`Pricing sync successful for date ${date}`, {
              itemCount: items.length
            });
          } else {
            const error = this.extractError(response);
            failureCount += items.length;
            
            items.forEach(item => {
              failures.push({
                itemId: `${item.roomTypeId}-${item.ratePlanId}-${item.date}`,
                error: error || 'Unknown sync error',
                details: { 
                  roomTypeId: item.roomTypeId, 
                  ratePlanId: item.ratePlanId,
                  date: item.date 
                }
              });
            });
          }
        } catch (error) {
          failureCount += items.length;
          items.forEach(item => {
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
          batchCount: pricingByDate.size
        }
      };

      this.logger.info(`Booking.com pricing sync completed`, {
        success: result.success,
        successCount,
        failureCount,
        duration: result.duration
      });

      return result;
    }, 'syncPricing');
  }

  /**
   * Handle incoming booking from Booking.com
   * Note: Booking.com typically sends bookings via webhooks or reservation API
   */
  async handleIncomingBooking(bookingData: BookingData): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Processing Booking.com reservation`, {
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
      
      // Send confirmation back to Booking.com if required
      if (bookingData.status === BookingStatus.PENDING) {
        await this.confirmBooking(bookingId, bookingData.externalBookingId);
      }

      this.logger.info(`Booking.com reservation processed successfully`, {
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
   * Send booking confirmation to Booking.com
   */
  async confirmBooking(bookingId: string, externalBookingId?: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Confirming booking with Booking.com`, { 
        bookingId, 
        externalBookingId 
      });

      if (!externalBookingId) {
        return {
          success: false,
          error: 'External booking ID required for Booking.com confirmation'
        };
      }

      const xml = this.buildConfirmationXML(bookingId, externalBookingId);
      const response = await this.sendXMLRequest(xml, 'booking_confirmation');
      
      if (this.isXMLSuccess(response)) {
        const confirmationNumber = this.extractConfirmationNumber(response);
        
        this.logger.info(`Booking confirmed with Booking.com`, {
          bookingId,
          confirmationNumber
        });

        return {
          success: true,
          confirmationNumber
        };
      } else {
        const error = this.extractError(response);
        return {
          success: false,
          error: error || 'Confirmation failed'
        };
      }
    }, 'confirmBooking');
  }

  /**
   * Cancel a booking on Booking.com
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
      this.logger.info(`Cancelling booking with Booking.com`, { 
        bookingId, 
        externalBookingId, 
        reason 
      });

      const xml = this.buildCancellationXML(bookingId, externalBookingId, reason);
      const response = await this.sendXMLRequest(xml, 'booking_cancellation');
      
      if (this.isXMLSuccess(response)) {
        const cancellationId = this.extractCancellationId(response);
        
        this.logger.info(`Booking cancelled with Booking.com`, {
          bookingId,
          cancellationId
        });

        return {
          success: true,
          cancellationId
        };
      } else {
        const error = this.extractError(response);
        return {
          success: false,
          error: error || 'Cancellation failed'
        };
      }
    }, 'cancelBooking');
  }

  /**
   * Update an existing booking on Booking.com
   * Note: Booking.com has limited modification support
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
      this.logger.info(`Updating booking with Booking.com`, { 
        bookingId, 
        externalBookingId, 
        changes 
      });

      // Booking.com has limited modification support
      if (!this.config.features.supportsBookingModifications) {
        return {
          success: false,
          error: 'Booking modifications not supported by Booking.com'
        };
      }

      const xml = this.buildModificationXML(bookingId, externalBookingId, changes);
      const response = await this.sendXMLRequest(xml, 'booking_modification');
      
      if (this.isXMLSuccess(response)) {
        this.logger.info(`Booking updated with Booking.com`, {
          bookingId,
          externalBookingId
        });

        return {
          success: true,
          updatedBookingId: externalBookingId
        };
      } else {
        const error = this.extractError(response);
        return {
          success: false,
          error: error || 'Modification failed'
        };
      }
    }, 'updateBooking');
  }

  /**
   * Get booking status from Booking.com
   */
  async getBookingStatus(externalBookingId: string): Promise<{
    status: BookingStatus;
    details?: Record<string, any>;
    error?: string;
  }> {
    return this.executeWithRetry(async () => {
      this.logger.info(`Getting booking status from Booking.com`, { externalBookingId });

      const xml = this.buildStatusQueryXML(externalBookingId);
      const response = await this.sendXMLRequest(xml, 'booking_status');
      
      if (this.isXMLSuccess(response)) {
        const status = this.extractBookingStatus(response);
        const details = this.extractBookingDetails(response);

        return {
          status,
          details: {
            ...details,
            lastUpdated: new Date().toISOString(),
            source: 'booking.com'
          }
        };
      } else {
        const error = this.extractError(response);
        return {
          status: BookingStatus.UNKNOWN,
          error: error || 'Status query failed'
        };
      }
    }, 'getBookingStatus');
  }

  // =============================================================================
  // PRIVATE XML HELPER METHODS
  // =============================================================================

  /**
   * Send XML request to Booking.com API
   */
  private async sendXMLRequest(xml: string, operation: string): Promise<string> {
    this.logger.debug(`Sending XML request to Booking.com`, { operation });
    
    const response = await this.fetchWithTimeout(this.baseUrl, {
      method: 'POST',
      body: xml
    });

    const responseText = await response.text();
    this.logger.debug(`Received XML response`, { 
      operation, 
      status: response.status,
      responseLength: responseText.length 
    });

    return responseText;
  }

  /**
   * Build authentication test XML
   */
  private buildAuthTestXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>test_auth</action>
</request>`;
  }

  /**
   * Build inventory sync XML
   */
  private buildInventorySyncXML(inventoryItems: InventoryData[], date: string): string {
    const roomsXML = inventoryItems.map(item => `
    <room>
      <room_id>${item.roomTypeId}</room_id>
      <date>${item.date}</date>
      <availability>${item.availability}</availability>
      <min_stay>${item.minStay || 1}</min_stay>
      <max_stay>${item.maxStay || 30}</max_stay>
      <closed_to_arrival>${item.closedToArrival ? 1 : 0}</closed_to_arrival>
      <closed_to_departure>${item.closedToDeparture ? 1 : 0}</closed_to_departure>
    </room>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>update_inventory</action>
  <rooms>${roomsXML}</rooms>
</request>`;
  }

  /**
   * Build pricing sync XML
   */
  private buildPricingSyncXML(pricingItems: PricingData[], date: string): string {
    const ratesXML = pricingItems.map(item => `
    <rate>
      <room_id>${item.roomTypeId}</room_id>
      <rate_plan_id>${item.ratePlanId}</rate_plan_id>
      <date>${item.date}</date>
      <price currency="${item.currency}">${item.rate}</price>
      <occupancy>${item.occupancy}</occupancy>
    </rate>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>update_rates</action>
  <rates>${ratesXML}</rates>
</request>`;
  }

  /**
   * Build confirmation XML
   */
  private buildConfirmationXML(bookingId: string, externalBookingId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>confirm_booking</action>
  <reservation_id>${externalBookingId}</reservation_id>
  <internal_booking_id>${bookingId}</internal_booking_id>
</request>`;
  }

  /**
   * Build cancellation XML
   */
  private buildCancellationXML(bookingId: string, externalBookingId: string, reason?: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>cancel_booking</action>
  <reservation_id>${externalBookingId}</reservation_id>
  <internal_booking_id>${bookingId}</internal_booking_id>
  <reason>${reason || 'Hotel cancellation'}</reason>
</request>`;
  }

  /**
   * Build modification XML
   */
  private buildModificationXML(
    bookingId: string, 
    externalBookingId: string, 
    changes: BookingModification
  ): string {
    const changesXML = Object.entries(changes.changes)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>modify_booking</action>
  <reservation_id>${externalBookingId}</reservation_id>
  <internal_booking_id>${bookingId}</internal_booking_id>
  <changes>${changesXML}</changes>
</request>`;
  }

  /**
   * Build status query XML
   */
  private buildStatusQueryXML(externalBookingId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${this.credentials.username}</username>
  <password>${this.credentials.password}</password>
  <hotel_id>${this.credentials.hotelId}</hotel_id>
  <action>get_booking_status</action>
  <reservation_id>${externalBookingId}</reservation_id>
</request>`;
  }

  // =============================================================================
  // XML PARSING HELPER METHODS
  // =============================================================================

  /**
   * Check if XML response indicates success
   */
  private isXMLSuccess(xml: string): boolean {
    return xml.includes('<success>') || 
           (xml.includes('<status>') && xml.includes('ok')) ||
           (!xml.includes('<error>') && !xml.includes('<fault>'));
  }

  /**
   * Extract error message from XML response
   */
  private extractError(xml: string): string | null {
    const errorMatch = xml.match(/<error[^>]*>(.*?)<\/error>/i);
    if (errorMatch) return errorMatch[1].trim();
    
    const faultMatch = xml.match(/<fault[^>]*>(.*?)<\/fault>/i);
    if (faultMatch) return faultMatch[1].trim();
    
    return null;
  }

  /**
   * Extract confirmation number from XML response
   */
  private extractConfirmationNumber(xml: string): string {
    const match = xml.match(/<confirmation[^>]*>(.*?)<\/confirmation>/i);
    return match ? match[1].trim() : `BDC-${Date.now()}`;
  }

  /**
   * Extract cancellation ID from XML response
   */
  private extractCancellationId(xml: string): string {
    const match = xml.match(/<cancellation_id[^>]*>(.*?)<\/cancellation_id>/i);
    return match ? match[1].trim() : `CANC-${Date.now()}`;
  }

  /**
   * Extract booking status from XML response
   */
  private extractBookingStatus(xml: string): BookingStatus {
    const statusMatch = xml.match(/<status[^>]*>(.*?)<\/status>/i);
    if (!statusMatch) return BookingStatus.UNKNOWN;
    
    const status = statusMatch[1].trim().toLowerCase();
    switch (status) {
      case 'confirmed':
      case 'active':
        return BookingStatus.CONFIRMED;
      case 'cancelled':
        return BookingStatus.CANCELLED;
      case 'pending':
        return BookingStatus.PENDING;
      case 'modified':
        return BookingStatus.MODIFIED;
      case 'no_show':
        return BookingStatus.NO_SHOW;
      default:
        return BookingStatus.UNKNOWN;
    }
  }

  /**
   * Extract booking details from XML response
   */
  private extractBookingDetails(xml: string): Record<string, any> {
    const details: Record<string, any> = {};
    
    const patterns = {
      checkIn: /<checkin_date[^>]*>(.*?)<\/checkin_date>/i,
      checkOut: /<checkout_date[^>]*>(.*?)<\/checkout_date>/i,
      guestName: /<guest_name[^>]*>(.*?)<\/guest_name>/i,
      roomCount: /<room_count[^>]*>(.*?)<\/room_count>/i,
      totalAmount: /<total_amount[^>]*>(.*?)<\/total_amount>/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = xml.match(pattern);
      if (match) details[key] = match[1].trim();
    }

    return details;
  }

  // =============================================================================
  // DATA PROCESSING HELPER METHODS
  // =============================================================================

  /**
   * Group inventory data by date for batch processing
   */
  private groupInventoryByDate(inventoryData: InventoryData[]): Map<string, InventoryData[]> {
    const grouped = new Map<string, InventoryData[]>();
    
    for (const item of inventoryData) {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, []);
      }
      grouped.get(item.date)!.push(item);
    }
    
    return grouped;
  }

  /**
   * Group pricing data by date for batch processing
   */
  private groupPricingByDate(pricingData: PricingData[]): Map<string, PricingData[]> {
    const grouped = new Map<string, PricingData[]>();
    
    for (const item of pricingData) {
      if (!grouped.has(item.date)) {
        grouped.set(item.date, []);
      }
      grouped.get(item.date)!.push(item);
    }
    
    return grouped;
  }

  /**
   * Validate booking data from Booking.com
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

    return { valid: true };
  }

  /**
   * Generate internal booking ID
   */
  private generateInternalBookingId(): string {
    return `BDC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}