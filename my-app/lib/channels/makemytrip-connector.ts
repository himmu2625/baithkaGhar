import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface MakeMyTripConfig {
  apiKey: string;
  hotelCode: string;
  partnerId: string;
  endpoint: string;
  username?: string;
  password?: string;
}

export interface MakeMyTripInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  rate: number;
  currency: string;
  mealPlan?: string;
  ratePlanCode?: string;
}

export interface MakeMyTripBooking {
  bookingId: string;
  hotelCode: string;
  bookingReference: string;
  guestDetails: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality?: string;
  };
  roomDetails: {
    roomTypeCode: string;
    roomCount: number;
    adultsCount: number;
    childrenCount: number;
    childAges?: number[];
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  commissionAmount: number;
  netAmount: number;
  mealPlan: string;
  bookingDate: string;
  status: string;
}

export class MakeMyTripConnector extends OTAChannelBase {
  private config: MakeMyTripConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'makemytrip');
    this.config = this.getChannelConfig() as MakeMyTripConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/status`, {
        headers: this.getAuthHeaders()
      });
      
      return {
        connected: response.status === 200 && response.data.status === 'active',
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

      // MakeMyTrip supports batch updates
      const batchSize = 100;
      for (let i = 0; i < inventory.length; i += batchSize) {
        const batch = inventory.slice(i, i + batchSize);
        
        try {
          await this.pushInventoryBatch(batch);
          synced += batch.length;
        } catch (error) {
          errors.push({ batch: i / batchSize, error });
          
          // Fallback to individual updates for this batch
          for (const item of batch) {
            try {
              await this.pushInventoryItem(item);
              synced++;
            } catch (itemError) {
              errors.push({ item: item.roomTypeId, error: itemError });
            }
          }
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<MakeMyTripBooking[]> {
    try {
      const params = new URLSearchParams({
        hotel_code: this.config.hotelCode,
        ...(fromDate && { from_date: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { to_date: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/api/v2/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data.bookings || [];
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async updateRates(): Promise<{ success: boolean; updated: number }> {
    try {
      const rates = await this.getLocalRates();
      let updated = 0;

      // MakeMyTrip rate updates
      const rateUpdates = rates.map(rate => ({
        room_type_code: rate.roomTypeId,
        rate_plan_code: rate.ratePlanCode || 'DEFAULT',
        date: rate.date,
        rate: rate.rate,
        currency: rate.currency,
        meal_plan: rate.mealPlan || 'EP'
      }));

      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/rates`, {
        rate_updates: rateUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      updated = rateUpdates.length;
      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update rates: ${error}`);
    }
  }

  async updateAvailability(): Promise<{ success: boolean; updated: number }> {
    try {
      const inventory = await this.getLocalInventory();
      let updated = 0;

      const availabilityUpdates = inventory.map(item => ({
        room_type_code: item.roomTypeId,
        date: item.date,
        availability: item.availability,
        stop_sell: item.availability === 0
      }));

      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/availability`, {
        availability_updates: availabilityUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      updated = availabilityUpdates.length;
      return { success: true, updated };
    } catch (error) {
      throw new Error(`Failed to update availability: ${error}`);
    }
  }

  async confirmBooking(bookingId: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v2/bookings/${bookingId}/confirm`, {
        confirmation_status: 'confirmed'
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v2/bookings/${bookingId}/cancel`, {
        cancellation_reason: reason || 'Cancelled by hotel',
        cancel_date: new Date().toISOString().split('T')[0]
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async getHotelDetails(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hotel details: ${error}`);
    }
  }

  async updateHotelInfo(updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update hotel info: ${error}`);
    }
  }

  async getRestrictions(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/restrictions`, {
        headers: this.getAuthHeaders()
      });

      return response.data.restrictions || [];
    } catch (error) {
      throw new Error(`Failed to get restrictions: ${error}`);
    }
  }

  async updateRestrictions(restrictions: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/restrictions`, {
        restriction_updates: restrictions
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: restrictions.length };
    } catch (error) {
      throw new Error(`Failed to update restrictions: ${error}`);
    }
  }

  private async pushInventoryBatch(inventory: any[]): Promise<void> {
    const inventoryData = inventory.map(item => ({
      room_type_code: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP'
    }));

    await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/inventory/batch`, {
      inventory_updates: inventoryData
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.hotelCode}/inventory`, {
      room_type_code: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP'
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Partner-ID': this.config.partnerId,
      'X-Hotel-Code': this.config.hotelCode
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  transformBooking(mmtBooking: any): MakeMyTripBooking {
    return {
      bookingId: mmtBooking.booking_id,
      hotelCode: mmtBooking.hotel_code,
      bookingReference: mmtBooking.booking_reference,
      guestDetails: {
        title: mmtBooking.guest.title,
        firstName: mmtBooking.guest.first_name,
        lastName: mmtBooking.guest.last_name,
        email: mmtBooking.guest.email,
        phone: mmtBooking.guest.phone,
        nationality: mmtBooking.guest.nationality
      },
      roomDetails: {
        roomTypeCode: mmtBooking.room.room_type_code,
        roomCount: mmtBooking.room.room_count,
        adultsCount: mmtBooking.room.adults_count,
        childrenCount: mmtBooking.room.children_count,
        childAges: mmtBooking.room.child_ages
      },
      checkIn: mmtBooking.checkin_date,
      checkOut: mmtBooking.checkout_date,
      totalAmount: mmtBooking.amount.total_amount,
      currency: mmtBooking.amount.currency,
      commissionAmount: mmtBooking.amount.commission_amount,
      netAmount: mmtBooking.amount.net_amount,
      mealPlan: mmtBooking.meal_plan,
      bookingDate: mmtBooking.booking_date,
      status: mmtBooking.status
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}