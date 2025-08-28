import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface AirbnbConfig {
  apiKey: string;
  listingId: string;
  accountId: string;
  endpoint: string;
  webhookSecret?: string;
}

export interface AirbnbListing {
  listingId: string;
  title: string;
  description: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  pricePerNight: number;
  currency: string;
}

export interface AirbnbReservation {
  confirmationCode: string;
  listingId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

export interface AirbnbCalendarEntry {
  date: string;
  available: boolean;
  price?: number;
  minimumNights?: number;
  maximumNights?: number;
}

export class AirbnbConnector extends OTAChannelBase {
  private config: AirbnbConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'airbnb');
    this.config = this.getChannelConfig() as AirbnbConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v2/listings/${this.config.listingId}`, {
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

      // Convert inventory to calendar format for Airbnb
      const calendarEntries: AirbnbCalendarEntry[] = inventory.map(item => ({
        date: item.date,
        available: item.availability > 0,
        price: item.rate,
        minimumNights: 1,
        maximumNights: 30
      }));

      try {
        await this.updateCalendar(calendarEntries);
        synced = calendarEntries.length;
      } catch (error) {
        errors.push({ calendar: true, error });
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getReservations(fromDate?: Date, toDate?: Date): Promise<AirbnbReservation[]> {
    try {
      const params = new URLSearchParams({
        listing_id: this.config.listingId,
        ...(fromDate && { start_date: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { end_date: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/v2/reservations?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data.reservations || [];
    } catch (error) {
      throw new Error(`Failed to fetch reservations: ${error}`);
    }
  }

  async updateCalendar(entries: AirbnbCalendarEntry[]): Promise<{ success: boolean; updated: number }> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/listings/${this.config.listingId}/calendar`, {
        calendar_entries: entries
      }, {
        headers: this.getAuthHeaders()
      });

      return { 
        success: response.status === 200, 
        updated: entries.length 
      };
    } catch (error) {
      throw new Error(`Failed to update calendar: ${error}`);
    }
  }

  async updatePricing(dateRange: { startDate: string; endDate: string; pricePerNight: number }): Promise<{ success: boolean }> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/listings/${this.config.listingId}/pricing`, {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        price_per_night: dateRange.pricePerNight
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: response.status === 200 };
    } catch (error) {
      throw new Error(`Failed to update pricing: ${error}`);
    }
  }

  async acceptReservation(confirmationCode: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${confirmationCode}/accept`, {}, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to accept reservation: ${error}`);
    }
  }

  async declineReservation(confirmationCode: string, reason: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${confirmationCode}/decline`, {
        decline_reason: reason
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to decline reservation: ${error}`);
    }
  }

  async cancelReservation(confirmationCode: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/reservations/${confirmationCode}/cancel`, {}, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel reservation: ${error}`);
    }
  }

  async updateListing(updates: Partial<AirbnbListing>): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/listings/${this.config.listingId}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update listing: ${error}`);
    }
  }

  async getListingDetails(): Promise<AirbnbListing> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v2/listings/${this.config.listingId}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get listing details: ${error}`);
    }
  }

  async setAvailability(startDate: string, endDate: string, available: boolean): Promise<{ success: boolean }> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v2/listings/${this.config.listingId}/availability`, {
        start_date: startDate,
        end_date: endDate,
        available: available
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: response.status === 200 };
    } catch (error) {
      throw new Error(`Failed to set availability: ${error}`);
    }
  }

  async getReviews(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v2/listings/${this.config.listingId}/reviews`, {
        headers: this.getAuthHeaders()
      });

      return response.data.reviews || [];
    } catch (error) {
      throw new Error(`Failed to get reviews: ${error}`);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Airbnb-Account-ID': this.config.accountId
    };
  }

  private generateWebhookSignature(payload: string): string {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    
    const crypto = require('crypto');
    return crypto.createHmac('sha256', this.config.webhookSecret).update(payload).digest('hex');
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    try {
      const expectedSignature = this.generateWebhookSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}