import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface AgodaConfig {
  apiKey: string;
  propertyId: string;
  endpoint: string;
  userId: string;
}

export interface AgodaBooking {
  bookingId: string;
  propertyId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
  };
  totalAmount: number;
  currency: string;
}

export class AgodaConnector extends OTAChannelBase {
  private config: AgodaConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'agoda');
    this.config = this.getChannelConfig() as AgodaConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/property/${this.config.propertyId}/health`, {
        headers: { 
          'X-API-Key': this.config.apiKey,
          'X-User-ID': this.config.userId,
          'Content-Type': 'application/json'
        }
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

  async syncProperty(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const propertyData = await this.getLocalPropertyData();
      await this.pushPropertyData(propertyData);
      
      return { success: true, synced: 1, errors: [] };
    } catch (error) {
      return { success: false, synced: 0, errors: [error] };
    }
  }

  async syncInventory(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const inventory = await this.getLocalInventory();
      const errors: any[] = [];
      let synced = 0;

      for (const item of inventory) {
        try {
          await this.pushInventoryItem(item);
          synced++;
        } catch (error) {
          errors.push({ item: item.roomTypeId, error });
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<AgodaBooking[]> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        ...(fromDate && { from_date: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { to_date: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/bookings?${params}`, {
        headers: { 
          'X-API-Key': this.config.apiKey,
          'X-User-ID': this.config.userId,
          'Content-Type': 'application/json'
        }
      });

      return response.data.bookings || [];
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async updateInventory(): Promise<{ success: boolean; updated: number }> {
    try {
      const inventory = await this.getLocalInventory();
      let updated = 0;

      for (const item of inventory) {
        await this.pushInventoryItem(item);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error}`);
    }
  }

  async pushRates(rates: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      let updated = 0;

      for (const rate of rates) {
        await this.pushRate(rate);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to push rates: ${error}`);
    }
  }

  async pushAvailability(availability: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      let updated = 0;

      for (const avail of availability) {
        await this.pushAvailabilityItem(avail);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to push availability: ${error}`);
    }
  }

  async handleBooking(booking: AgodaBooking): Promise<any> {
    try {
      // Process incoming booking from Agoda
      const processedBooking = await this.processIncomingBooking(booking);
      
      // Confirm booking with Agoda
      const response = await axios.post(`${this.config.endpoint}/bookings/${booking.bookingId}/confirm`, {
        status: 'confirmed',
        confirmationCode: processedBooking.id
      }, {
        headers: { 
          'X-API-Key': this.config.apiKey,
          'X-User-ID': this.config.userId,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to handle booking: ${error}`);
    }
  }

  private async getLocalPropertyData(): Promise<any> {
    // Fetch property data from local database
    // Implement based on your Property model
    return {
      propertyId: this.propertyId,
      name: 'Property Name',
      address: 'Property Address',
      amenities: [],
      rooms: []
    };
  }

  private async pushPropertyData(data: any): Promise<void> {
    await axios.put(`${this.config.endpoint}/property/${this.config.propertyId}`, data, {
      headers: { 
        'X-API-Key': this.config.apiKey,
        'X-User-ID': this.config.userId,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/property/${this.config.propertyId}/inventory`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate
    }, {
      headers: { 
        'X-API-Key': this.config.apiKey,
        'X-User-ID': this.config.userId,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushRate(rate: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/property/${this.config.propertyId}/rates`, {
      room_type_id: rate.roomTypeId,
      date: rate.date,
      rate: rate.rate,
      currency: rate.currency
    }, {
      headers: { 
        'X-API-Key': this.config.apiKey,
        'X-User-ID': this.config.userId,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushAvailabilityItem(avail: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/property/${this.config.propertyId}/availability`, {
      room_type_id: avail.roomTypeId,
      date: avail.date,
      availability: avail.availability
    }, {
      headers: { 
        'X-API-Key': this.config.apiKey,
        'X-User-ID': this.config.userId,
        'Content-Type': 'application/json'
      }
    });
  }

  private async processIncomingBooking(booking: AgodaBooking): Promise<any> {
    // Process and save booking to local database
    // Implement based on your Booking model
    return {
      id: 'local-booking-id',
      externalId: booking.bookingId,
      channel: 'agoda',
      ...booking
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}