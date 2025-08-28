import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface TripAdvisorConfig {
  apiKey: string;
  apiSecret: string;
  propertyId: string;
  endpoint: string;
  webhookUrl?: string;
}

export interface TripAdvisorInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  rate: number;
  currency: string;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export interface TripAdvisorBooking {
  reservationId: string;
  propertyId: string;
  roomDetails: {
    roomTypeId: string;
    quantity: number;
  };
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  status: string;
}

export class TripAdvisorConnector extends OTAChannelBase {
  private config: TripAdvisorConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'tripadvisor');
    this.config = this.getChannelConfig() as TripAdvisorConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v2/properties/${this.config.propertyId}/status`, {
        headers: this.getAuthHeaders()
      });
      
      return {
        connected: response.status === 200,
        lastSync: new Date(),
      };
    } catch (error) {
      return {
        connected: false,
        lastSync: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async syncInventory(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const inventory = await this.getLocalInventory();
      const errors: any[] = [];
      let synced = 0;

      // TripAdvisor supports bulk operations
      try {
        await this.pushBulkInventory(inventory);
        synced = inventory.length;
      } catch (error) {
        errors.push({ bulk: true, error });
        
        // Fallback to individual updates
        for (const item of inventory) {
          try {
            await this.pushInventoryItem(item);
            synced++;
          } catch (itemError) {
            errors.push({ item: item.roomTypeId, error: itemError });
          }
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<TripAdvisorBooking[]> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        ...(fromDate && { check_in_from: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { check_in_to: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/v2/reservations?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data.reservations || [];
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async updateInventory(): Promise<{ success: boolean; updated: number }> {
    try {
      const inventory = await this.getLocalInventory();
      let updated = 0;

      // Use bulk update for better performance
      try {
        await this.pushBulkInventory(inventory);
        updated = inventory.length;
      } catch (error) {
        // Fallback to individual updates
        for (const item of inventory) {
          await this.pushInventoryItem(item);
          updated++;
        }
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error}`);
    }
  }

  async updateRates(): Promise<{ success: boolean; updated: number }> {
    try {
      const rates = await this.getLocalRates();
      let updated = 0;

      for (const rate of rates) {
        await this.pushRate(rate);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update rates: ${error}`);
    }
  }

  async confirmBooking(reservationId: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${reservationId}/confirm`, {
        confirmation_code: this.generateConfirmationCode()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(reservationId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${reservationId}/cancel`, {
        cancellation_reason: reason || 'Cancelled by property'
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async modifyBooking(reservationId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${reservationId}`, modifications, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to modify booking: ${error}`);
    }
  }

  private async pushBulkInventory(inventory: any[]): Promise<void> {
    const bulkData = inventory.map(item => ({
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate,
      currency: item.currency,
      restrictions: item.restrictions
    }));

    await axios.post(`${this.config.endpoint}/v2/properties/${this.config.propertyId}/inventory/bulk`, {
      inventory_updates: bulkData
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/v2/properties/${this.config.propertyId}/inventory`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate,
      currency: item.currency || 'USD',
      restrictions: item.restrictions || {}
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushRate(rate: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/v2/properties/${this.config.propertyId}/rates`, {
      room_type_id: rate.roomTypeId,
      date: rate.date,
      rate: rate.rate,
      currency: rate.currency
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();
    const signature = this.generateSignature(timestamp, nonce);

    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature
    };
  }

  private generateSignature(timestamp: number, nonce: string): string {
    // TripAdvisor uses HMAC-SHA256 for request signing
    const crypto = require('crypto');
    const message = `${this.config.apiKey}${timestamp}${nonce}`;
    return crypto.createHmac('sha256', this.config.apiSecret).update(message).digest('hex');
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateConfirmationCode(): string {
    return `TA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}