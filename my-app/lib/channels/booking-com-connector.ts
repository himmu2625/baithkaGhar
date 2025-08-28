import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface BookingComConfig {
  apiKey: string;
  hotelId: string;
  endpoint: string;
}

export interface BookingComInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  rate: number;
  restrictions: {
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
    minStay?: number;
    maxStay?: number;
  };
}

export class BookingComConnector extends OTAChannelBase {
  private config: BookingComConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'booking.com');
    this.config = this.getChannelConfig() as BookingComConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/ping`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
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

  async getBookings(fromDate?: Date, toDate?: Date): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        hotel_id: this.config.hotelId,
        ...(fromDate && { from_date: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { to_date: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/reservations?${params}`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` }
      });

      return response.data.reservations || [];
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
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

  async updateInventory(data: BookingComInventory[]): Promise<{ success: boolean; updated: number }> {
    try {
      let updated = 0;

      for (const item of data) {
        await this.pushInventoryItem(item);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error}`);
    }
  }

  async createBooking(booking: any): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/reservations`, {
        hotel_id: this.config.hotelId,
        ...booking
      }, {
        headers: { 
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create booking: ${error}`);
    }
  }

  async updateBooking(bookingId: string, updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/reservations/${bookingId}`, updates, {
        headers: { 
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update booking: ${error}`);
    }
  }

  private async pushInventoryItem(item: BookingComInventory): Promise<void> {
    await axios.post(`${this.config.endpoint}/inventory`, {
      hotel_id: this.config.hotelId,
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate,
      restrictions: item.restrictions
    }, {
      headers: { 
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushRate(rate: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/rates`, {
      hotel_id: this.config.hotelId,
      ...rate
    }, {
      headers: { 
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}