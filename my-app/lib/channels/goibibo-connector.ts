import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface GoibiboConfig {
  apiKey: string;
  hotelCode: string;
  partnerId: string;
  endpoint: string;
  username?: string;
  password?: string;
}

export interface GoibiboBooking {
  goibiboBookingId: string;
  hotelCode: string;
  bookingReference: string;
  guestDetails: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    nationality?: string;
  };
  roomDetails: {
    roomTypeCode: string;
    roomTypeName: string;
    roomCount: number;
    adults: number;
    children: number;
    childAges?: number[];
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  commissionAmount: number;
  netPayableAmount: number;
  mealPlan: string;
  bookingStatus: string;
  paymentStatus: string;
  cancellationPolicy: string;
  bookedAt: string;
  specialRequests?: string;
}

export interface GoibiboInventory {
  roomTypeCode: string;
  date: string;
  availability: number;
  baseRate: number;
  extraAdultRate?: number;
  extraChildRate?: number;
  currency: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  rackRate?: number;
  specialRate?: number;
}

export class GoibiboConnector extends OTAChannelBase {
  private config: GoibiboConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'goibibo');
    this.config = this.getChannelConfig() as GoibiboConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/status`, {
        headers: this.getAuthHeaders()
      });
      
      return {
        connected: response.status === 200 && response.data.hotel_status === 'ACTIVE',
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

      // Goibibo supports batch operations like MMT
      const batchSize = 50;
      for (let i = 0; i < inventory.length; i += batchSize) {
        const batch = inventory.slice(i, i + batchSize);
        
        try {
          await this.pushInventoryBatch(batch);
          synced += batch.length;
        } catch (error) {
          errors.push({ batch: i / batchSize, error });
          
          // Fallback to individual updates
          for (const item of batch) {
            try {
              await this.pushInventoryItem(item);
              synced++;
            } catch (itemError) {
              errors.push({ item: item.roomTypeId, date: item.date, error: itemError });
            }
          }
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<GoibiboBooking[]> {
    try {
      const params = new URLSearchParams({
        hotel_code: this.config.hotelCode,
        ...(fromDate && { checkin_from: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { checkin_to: toDate.toISOString().split('T')[0] }),
        include_cancelled: 'false'
      });

      const response = await axios.get(`${this.config.endpoint}/api/v1/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return (response.data.bookings || []).map((booking: any) => this.transformBooking(booking));
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async confirmBooking(goibiboBookingId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${goibiboBookingId}/confirm`, {
        confirmation_status: 'CONFIRMED',
        confirmation_time: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(goibiboBookingId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${goibiboBookingId}/cancel`, {
        cancellation_reason: reason || 'Hotel initiated cancellation',
        cancelled_by: 'HOTEL',
        cancellation_time: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async modifyBooking(goibiboBookingId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v1/bookings/${goibiboBookingId}`, {
        ...modifications,
        modification_time: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to modify booking: ${error}`);
    }
  }

  async updateRates(): Promise<{ success: boolean; updated: number }> {
    try {
      const rates = await this.getLocalRates();
      
      const rateUpdates = rates.map(rate => ({
        room_type_code: rate.roomTypeId,
        date: rate.date,
        base_rate: rate.rate,
        extra_adult_rate: rate.extraAdultRate || 0,
        extra_child_rate: rate.extraChildRate || 0,
        currency: rate.currency || 'INR',
        meal_plan: rate.mealPlan || 'EP'
      }));

      await axios.post(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/rates`, {
        rate_updates: rateUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: rateUpdates.length };
    } catch (error) {
      throw new Error(`Failed to update rates: ${error}`);
    }
  }

  async updateAvailability(): Promise<{ success: boolean; updated: number }> {
    try {
      const inventory = await this.getLocalInventory();
      
      const availabilityUpdates = inventory.map(item => ({
        room_type_code: item.roomTypeId,
        date: item.date,
        availability: item.availability,
        closed: item.availability === 0
      }));

      await axios.post(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/availability`, {
        availability_updates: availabilityUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: availabilityUpdates.length };
    } catch (error) {
      throw new Error(`Failed to update availability: ${error}`);
    }
  }

  async getHotelInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hotel info: ${error}`);
    }
  }

  async updateHotelInfo(updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update hotel info: ${error}`);
    }
  }

  async getRoomTypes(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/room-types`, {
        headers: this.getAuthHeaders()
      });

      return response.data.room_types || [];
    } catch (error) {
      throw new Error(`Failed to get room types: ${error}`);
    }
  }

  async updateRestrictions(restrictions: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      const restrictionUpdates = restrictions.map(restriction => ({
        room_type_code: restriction.roomTypeId,
        date: restriction.date,
        min_stay: restriction.minStay || 1,
        max_stay: restriction.maxStay || 30,
        closed_to_arrival: restriction.closedToArrival || false,
        closed_to_departure: restriction.closedToDeparture || false
      }));

      await axios.post(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/restrictions`, {
        restriction_updates: restrictionUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: restrictionUpdates.length };
    } catch (error) {
      throw new Error(`Failed to update restrictions: ${error}`);
    }
  }

  private async pushInventoryBatch(inventory: any[]): Promise<void> {
    const inventoryData = inventory.map(item => ({
      room_type_code: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP',
      extra_adult_rate: item.extraAdultRate || 0,
      extra_child_rate: item.extraChildRate || 0
    }));

    await axios.post(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/inventory/batch`, {
      inventory_updates: inventoryData
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/api/v1/hotels/${this.config.hotelCode}/inventory`, {
      room_type_code: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP',
      extra_adult_rate: item.extraAdultRate || 0,
      extra_child_rate: item.extraChildRate || 0
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

  private transformBooking(goibiboBooking: any): GoibiboBooking {
    return {
      goibiboBookingId: goibiboBooking.goibibo_booking_id,
      hotelCode: goibiboBooking.hotel_code,
      bookingReference: goibiboBooking.booking_reference,
      guestDetails: {
        title: goibiboBooking.guest.title,
        firstName: goibiboBooking.guest.first_name,
        lastName: goibiboBooking.guest.last_name,
        email: goibiboBooking.guest.email,
        mobile: goibiboBooking.guest.mobile,
        nationality: goibiboBooking.guest.nationality
      },
      roomDetails: {
        roomTypeCode: goibiboBooking.room.room_type_code,
        roomTypeName: goibiboBooking.room.room_type_name,
        roomCount: goibiboBooking.room.room_count,
        adults: goibiboBooking.room.adults,
        children: goibiboBooking.room.children,
        childAges: goibiboBooking.room.child_ages
      },
      checkIn: goibiboBooking.checkin_date,
      checkOut: goibiboBooking.checkout_date,
      nights: goibiboBooking.nights,
      totalAmount: goibiboBooking.pricing.total_amount,
      currency: goibiboBooking.pricing.currency,
      baseAmount: goibiboBooking.pricing.base_amount,
      taxAmount: goibiboBooking.pricing.tax_amount,
      discountAmount: goibiboBooking.pricing.discount_amount,
      commissionAmount: goibiboBooking.pricing.commission_amount,
      netPayableAmount: goibiboBooking.pricing.net_payable_amount,
      mealPlan: goibiboBooking.meal_plan,
      bookingStatus: goibiboBooking.booking_status,
      paymentStatus: goibiboBooking.payment_status,
      cancellationPolicy: goibiboBooking.cancellation_policy,
      bookedAt: goibiboBooking.booked_at,
      specialRequests: goibiboBooking.special_requests
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}