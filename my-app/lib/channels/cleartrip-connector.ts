import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface CleartripConfig {
  apiKey: string;
  propertyId: string;
  partnerId: string;
  endpoint: string;
  username?: string;
  password?: string;
}

export interface CleartripBooking {
  tripId: string;
  propertyId: string;
  bookingReference: string;
  guestDetails: {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  roomDetails: {
    roomTypeId: string;
    roomCount: number;
    guestCount: number;
    adults: number;
    children: number;
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  payableAmount: number;
  bookingStatus: string;
  createdAt: string;
}

export interface CleartripInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  baseRate: number;
  currency: string;
  rackRate?: number;
  extraAdultRate?: number;
  extraChildRate?: number;
  mealPlan?: 'EP' | 'CP' | 'MAP' | 'AP';
}

export class CleartripConnector extends OTAChannelBase {
  private config: CleartripConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'cleartrip');
    this.config = this.getChannelConfig() as CleartripConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/ping`, {
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

      // Cleartrip doesn't support bulk operations, so we sync individually
      for (const item of inventory) {
        try {
          await this.pushInventoryItem(item);
          synced++;
        } catch (error) {
          errors.push({ item: item.roomTypeId, date: item.date, error });
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<CleartripBooking[]> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        ...(fromDate && { checkin_from: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { checkin_to: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/v1/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return (response.data.bookings || []).map((booking: any) => this.transformBooking(booking));
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async updateAvailability(): Promise<{ success: boolean; updated: number }> {
    try {
      const inventory = await this.getLocalInventory();
      let updated = 0;

      for (const item of inventory) {
        await this.pushAvailability(item);
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update availability: ${error}`);
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

  async confirmBooking(tripId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/v1/bookings/${tripId}/confirm`, {
        status: 'CONFIRMED'
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(tripId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/v1/bookings/${tripId}/cancel`, {
        cancellation_reason: reason || 'Property cancellation',
        cancelled_by: 'HOTEL'
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async modifyBooking(tripId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v1/bookings/${tripId}`, modifications, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to modify booking: ${error}`);
    }
  }

  async getPropertyDetails(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/properties/${this.config.propertyId}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get property details: ${error}`);
    }
  }

  async updatePropertyInfo(updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/v1/properties/${this.config.propertyId}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update property info: ${error}`);
    }
  }

  async getRoomTypes(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/room-types`, {
        headers: this.getAuthHeaders()
      });

      return response.data.room_types || [];
    } catch (error) {
      throw new Error(`Failed to get room types: ${error}`);
    }
  }

  async updateRestrictions(restrictions: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      let updated = 0;

      for (const restriction of restrictions) {
        await axios.post(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/restrictions`, restriction, {
          headers: this.getAuthHeaders()
        });
        updated++;
      }

      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update restrictions: ${error}`);
    }
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/inventory`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP'
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushAvailability(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/availability`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      stop_sell: item.availability === 0
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushRate(rate: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/v1/properties/${this.config.propertyId}/rates`, {
      room_type_id: rate.roomTypeId,
      date: rate.date,
      base_rate: rate.rate,
      currency: rate.currency || 'INR',
      rack_rate: rate.rackRate,
      extra_adult_rate: rate.extraAdultRate,
      extra_child_rate: rate.extraChildRate,
      meal_plan: rate.mealPlan || 'EP'
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
      'X-Partner-Id': this.config.partnerId,
      'X-Property-Id': this.config.propertyId
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  private transformBooking(cleartripBooking: any): CleartripBooking {
    return {
      tripId: cleartripBooking.trip_id,
      propertyId: cleartripBooking.property_id,
      bookingReference: cleartripBooking.booking_reference,
      guestDetails: {
        salutation: cleartripBooking.guest_details.salutation,
        firstName: cleartripBooking.guest_details.first_name,
        lastName: cleartripBooking.guest_details.last_name,
        email: cleartripBooking.guest_details.email,
        mobile: cleartripBooking.guest_details.mobile
      },
      roomDetails: {
        roomTypeId: cleartripBooking.room_details.room_type_id,
        roomCount: cleartripBooking.room_details.room_count,
        guestCount: cleartripBooking.room_details.guest_count,
        adults: cleartripBooking.room_details.adults,
        children: cleartripBooking.room_details.children
      },
      checkIn: cleartripBooking.checkin_date,
      checkOut: cleartripBooking.checkout_date,
      totalAmount: cleartripBooking.pricing.total_amount,
      currency: cleartripBooking.pricing.currency,
      payableAmount: cleartripBooking.pricing.payable_amount,
      bookingStatus: cleartripBooking.booking_status,
      createdAt: cleartripBooking.created_at
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}