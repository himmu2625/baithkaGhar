import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface EaseMyTripConfig {
  apiKey: string;
  propertyId: string;
  partnerCode: string;
  endpoint: string;
  username?: string;
  password?: string;
}

export interface EaseMyTripBooking {
  emtBookingId: string;
  propertyId: string;
  bookingReference: string;
  guestDetails: {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    alternateNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  roomDetails: {
    roomTypeId: string;
    roomTypeName: string;
    roomCount: number;
    adultsPerRoom: number;
    childrenPerRoom: number;
    totalGuests: number;
    extraBed?: boolean;
  };
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  totalAmount: number;
  currency: string;
  hotelCharges: number;
  taxesAndFees: number;
  discountAmount: number;
  netPayable: number;
  commissionAmount: number;
  mealPlan: string;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'MODIFIED' | 'NO_SHOW';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  bookedDateTime: string;
  cancellationPolicy?: string;
  specialInstructions?: string;
}

export interface EaseMyTripInventory {
  roomTypeId: string;
  date: string;
  availability: number;
  baseRate: number;
  currency: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  rackRate?: number;
  corporateRate?: number;
  packageRate?: number;
  adultExtraCharge?: number;
  childExtraCharge?: number;
}

export class EaseMyTripConnector extends OTAChannelBase {
  private config: EaseMyTripConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'easemytrip');
    this.config = this.getChannelConfig() as EaseMyTripConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/ping`, {
        headers: this.getAuthHeaders()
      });
      
      return {
        connected: response.status === 200 && response.data.status === 'ACTIVE',
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

      // EaseMyTrip supports bulk operations for better performance
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

  async getBookings(fromDate?: Date, toDate?: Date): Promise<EaseMyTripBooking[]> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        ...(fromDate && { checkin_start: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { checkin_end: toDate.toISOString().split('T')[0] }),
        status: 'ALL'
      });

      const response = await axios.get(`${this.config.endpoint}/api/v2/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return (response.data.reservations || []).map((booking: any) => this.transformBooking(booking));
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error}`);
    }
  }

  async confirmBooking(emtBookingId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v2/bookings/${emtBookingId}/confirm`, {
        status: 'CONFIRMED',
        confirmation_date: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to confirm booking: ${error}`);
    }
  }

  async cancelBooking(emtBookingId: string, reason?: string): Promise<any> {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/v2/bookings/${emtBookingId}/cancel`, {
        cancellation_reason: reason || 'Property initiated cancellation',
        cancelled_by: 'HOTEL',
        cancellation_date: new Date().toISOString()
      }, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel booking: ${error}`);
    }
  }

  async modifyBooking(emtBookingId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v2/bookings/${emtBookingId}`, {
        ...modifications,
        modification_date: new Date().toISOString()
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
        room_type_id: rate.roomTypeId,
        date: rate.date,
        base_rate: rate.rate,
        currency: rate.currency || 'INR',
        meal_plan: rate.mealPlan || 'EP',
        rack_rate: rate.rackRate,
        corporate_rate: rate.corporateRate,
        package_rate: rate.packageRate,
        adult_extra_charge: rate.adultExtraCharge || 0,
        child_extra_charge: rate.childExtraCharge || 0
      }));

      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/rates`, {
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
        room_type_id: item.roomTypeId,
        date: item.date,
        available_rooms: item.availability,
        stop_sell: item.availability === 0
      }));

      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/availability`, {
        availability_updates: availabilityUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: availabilityUpdates.length };
    } catch (error) {
      throw new Error(`Failed to update availability: ${error}`);
    }
  }

  async getPropertyDetails(): Promise<any> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get property details: ${error}`);
    }
  }

  async updatePropertyDetails(updates: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update property details: ${error}`);
    }
  }

  async getRoomTypeMapping(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/room-types`, {
        headers: this.getAuthHeaders()
      });

      return response.data.room_types || [];
    } catch (error) {
      throw new Error(`Failed to get room type mapping: ${error}`);
    }
  }

  async updateRestrictions(restrictions: any[]): Promise<{ success: boolean; updated: number }> {
    try {
      const restrictionUpdates = restrictions.map(restriction => ({
        room_type_id: restriction.roomTypeId,
        date: restriction.date,
        min_stay: restriction.minStay || 1,
        max_stay: restriction.maxStay || 30,
        closed_to_arrival: restriction.closedToArrival || false,
        closed_to_departure: restriction.closedToDeparture || false,
        stop_sell: restriction.stopSell || false
      }));

      await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/restrictions`, {
        restriction_updates: restrictionUpdates
      }, {
        headers: this.getAuthHeaders()
      });

      return { success: true, updated: restrictionUpdates.length };
    } catch (error) {
      throw new Error(`Failed to update restrictions: ${error}`);
    }
  }

  async getBookingReport(fromDate: Date, toDate: Date): Promise<any> {
    try {
      const params = new URLSearchParams({
        property_id: this.config.propertyId,
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0]
      });

      const response = await axios.get(`${this.config.endpoint}/api/v2/reports/bookings?${params}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get booking report: ${error}`);
    }
  }

  private async pushBulkInventory(inventory: any[]): Promise<void> {
    const inventoryData = inventory.map(item => ({
      room_type_id: item.roomTypeId,
      date: item.date,
      available_rooms: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP',
      rack_rate: item.rackRate,
      corporate_rate: item.corporateRate,
      package_rate: item.packageRate,
      adult_extra_charge: item.adultExtraCharge || 0,
      child_extra_charge: item.childExtraCharge || 0
    }));

    await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/inventory/bulk`, {
      inventory_data: inventoryData
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private async pushInventoryItem(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/api/v2/hotels/${this.config.propertyId}/inventory`, {
      room_type_id: item.roomTypeId,
      date: item.date,
      available_rooms: item.availability,
      base_rate: item.rate,
      currency: item.currency || 'INR',
      meal_plan: item.mealPlan || 'EP',
      rack_rate: item.rackRate,
      corporate_rate: item.corporateRate,
      package_rate: item.packageRate,
      adult_extra_charge: item.adultExtraCharge || 0,
      child_extra_charge: item.childExtraCharge || 0
    }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Partner-Code': this.config.partnerCode,
      'X-Property-ID': this.config.propertyId
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  private transformBooking(emtBooking: any): EaseMyTripBooking {
    return {
      emtBookingId: emtBooking.emt_booking_id,
      propertyId: emtBooking.property_id,
      bookingReference: emtBooking.booking_reference,
      guestDetails: {
        salutation: emtBooking.guest.salutation,
        firstName: emtBooking.guest.first_name,
        lastName: emtBooking.guest.last_name,
        email: emtBooking.guest.email,
        contactNumber: emtBooking.guest.contact_number,
        alternateNumber: emtBooking.guest.alternate_number,
        address: emtBooking.guest.address,
        city: emtBooking.guest.city,
        state: emtBooking.guest.state,
        country: emtBooking.guest.country
      },
      roomDetails: {
        roomTypeId: emtBooking.room.room_type_id,
        roomTypeName: emtBooking.room.room_type_name,
        roomCount: emtBooking.room.room_count,
        adultsPerRoom: emtBooking.room.adults_per_room,
        childrenPerRoom: emtBooking.room.children_per_room,
        totalGuests: emtBooking.room.total_guests,
        extraBed: emtBooking.room.extra_bed
      },
      checkIn: emtBooking.checkin_date,
      checkOut: emtBooking.checkout_date,
      numberOfNights: emtBooking.number_of_nights,
      totalAmount: emtBooking.pricing.total_amount,
      currency: emtBooking.pricing.currency,
      hotelCharges: emtBooking.pricing.hotel_charges,
      taxesAndFees: emtBooking.pricing.taxes_and_fees,
      discountAmount: emtBooking.pricing.discount_amount,
      netPayable: emtBooking.pricing.net_payable,
      commissionAmount: emtBooking.pricing.commission_amount,
      mealPlan: emtBooking.meal_plan,
      bookingStatus: emtBooking.booking_status,
      paymentStatus: emtBooking.payment_status,
      bookedDateTime: emtBooking.booked_date_time,
      cancellationPolicy: emtBooking.cancellation_policy,
      specialInstructions: emtBooking.special_instructions
    };
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}