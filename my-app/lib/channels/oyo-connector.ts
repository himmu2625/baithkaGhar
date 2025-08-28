import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface OyoConfig {
  apiKey: string;
  propertyId: string;
  endpoint: string;
  username?: string;
  password?: string;
}

export interface OyoBooking {
  oyoBookingId: string;
  propertyId: string;
  bookingReference: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idProof?: {
      type: string;
      number: string;
    };
  };
  roomDetails: {
    roomTypeId: string;
    roomCount: number;
    guests: number;
  };
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  netAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bookingStatus: 'confirmed' | 'cancelled' | 'modified' | 'no_show' | 'checked_in' | 'checked_out';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  createdAt: string;
  specialRequests?: string;
}

export interface OyoInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  baseRate: number;
  currency: string;
  occupancyBasedRates?: {
    singleOccupancy?: number;
    doubleOccupancy?: number;
    tripleOccupancy?: number;
  };
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export class OyoConnector extends OTAChannelBase {
  private config: OyoConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'oyo');
    this.config = this.getChannelConfig() as OyoConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v1/properties/${this.config.propertyId}/status`, {
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

      // OYO supports real-time sync with bulk operations
      try {
        await this.pushBulkInventory(inventory);
        synced = inventory.length;
      } catch (bulkError) {
        errors.push({ bulk: true, error: bulkError });
        
        // Fallback to individual sync
        for (const item of inventory) {
          try {
            await this.pushInventoryItem(item);
            synced++;
          } catch (error) {
            errors.push({ item: item.roomTypeId, date: item.date, error });
          }
        }
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      throw new Error(`Failed to sync inventory: ${error}`);
    }
  }

  async getBookings(fromDate?: Date, toDate?: Date): Promise<OyoBooking[]> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        ...(fromDate && { checkin_from: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { checkin_to: toDate.toISOString().split('T')[0] }),
        include_cancelled: 'true'
      });

      const response = await axios.get(`${this.config.endpoint}/api/v1/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return (response.data.bookings || []).map((booking: any) => this.transformBooking(booking));
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async confirmBooking(oyoBookingId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${oyoBookingId}/confirm`, {
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(oyoBookingId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${oyoBookingId}/cancel`, {
        cancellation_reason: reason || 'Hotel initiated cancellation',
        cancelled_by: 'HOTEL',
        cancelled_at: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async modifyBooking(oyoBookingId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v1/bookings/${oyoBookingId}`, {
        ...modifications,
        modified_at: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to modify booking: ${error}`);
    }
  }

  async checkInGuest(oyoBookingId: string, checkInTime?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${oyoBookingId}/checkin`, {
        checked_in_at: checkInTime || new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check in guest: ${error}`);
    }
  }

  async checkOutGuest(oyoBookingId: string, checkOutTime?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v1/bookings/${oyoBookingId}/checkout`, {
        checked_out_at: checkOutTime || new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check out guest: ${error}`);
    }
  }

  async updatePropertyDetails(updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v1/properties/${this.config.propertyId}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update property details: ${error}`);
    }
  }

  async getPropertyAnalytics(fromDate: Date, toDate: Date): Promise<any> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0]
      });

      const response = await axios.get(`${this.config.endpoint}/api/v1/analytics?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error}`);
    }
  }

  async updateRoomTypes(roomTypes: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v1/properties/${this.config.propertyId}/room-types`, {
        room_types: roomTypes
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: response.status === 200, updated: roomTypes.length };
    } catch (error) {
      throw new Error(`Failed to update room types: ${error}`);
    }
  }

  async pushBulkInventory(inventory: any[]): Promise<void> {
    const inventoryData = inventory.map(item => ({
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      occupancy_rates: item.occupancyBasedRates,
      restrictions: item.restrictions
    }));

    await axios.post(`${this.config.endpoint}/api/v1/properties/${this.config.propertyId}/inventory/bulk`, {
      inventory: inventoryData
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/api/v1/properties/${this.config.propertyId}/inventory`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      occupancy_rates: item.occupancyBasedRates,
      restrictions: item.restrictions
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Property-ID': this.config.propertyId
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['X-Basic-Auth'] = auth;
    }

    return headers;
  }

  private transformBooking(oyoBooking: any): OyoBooking {
    return {
      oyoBookingId: oyoBooking.oyo_booking_id,
      propertyId: oyoBooking.property_id,
      bookingReference: oyoBooking.booking_reference,
      guestDetails: {
        firstName: oyoBooking.guest.first_name,
        lastName: oyoBooking.guest.last_name,
        email: oyoBooking.guest.email,
        phone: oyoBooking.guest.phone,
        idProof: oyoBooking.guest.id_proof
      },
      roomDetails: {
        roomTypeId: oyoBooking.room.room_type_id,
        roomCount: oyoBooking.room.room_count,
        guests: oyoBooking.room.guests
      },
      checkIn: oyoBooking.checkin_date,
      checkOut: oyoBooking.checkout_date,
      totalAmount: oyoBooking.pricing.total_amount,
      currency: oyoBooking.pricing.currency,
      netAmount: oyoBooking.pricing.net_amount,
      commissionRate: oyoBooking.pricing.commission_rate,
      commissionAmount: oyoBooking.pricing.commission_amount,
      bookingStatus: oyoBooking.status,
      paymentStatus: oyoBooking.payment_status,
      createdAt: oyoBooking.created_at,
      specialRequests: oyoBooking.special_requests
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}