import axios from 'axios';
import { OTAChannelBase } from './base-channel-connector';

export interface ExpediaConfig {
  apiKey: string;
  propertyId: string;
  endpoint: string;
  partnerId: string;
}

export interface ExpediaRate {
  roomTypeId: string;
  ratePlanId: string;
  date: string;
  rate: number;
  currency: string;
}

export class ExpediaConnector extends OTAChannelBase {
  private config: ExpediaConfig;
  
  constructor(propertyId: string) {
    super(propertyId, 'expedia');
    this.config = this.getChannelConfig() as ExpediaConfig;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; lastSync: Date | null; error?: string }> {
    try {
      const response = await axios.get(`${this.config.endpoint}/properties/${this.config.propertyId}/status`, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
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

  async syncInventory(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const inventory = await this.getLocalInventory();
      const errors: any[] = [];
      let synced = 0;

      for (const item of inventory) {
        try {
          await this.pushAvailabilityAndRate(item);
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

  async getReservations(fromDate?: Date, toDate?: Date): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        ...(fromDate && { checkin: fromDate.toISOString().split('T')[0] }),
        ...(toDate && { checkout: toDate.toISOString().split('T')[0] })
      });

      const response = await axios.get(`${this.config.endpoint}/properties/${this.config.propertyId}/reservations?${params}`, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.reservations || [];
    } catch (error) {
      throw new Error(`Failed to fetch reservations: ${error}`);
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

  async updateRates(rates: ExpediaRate[]): Promise<{ success: boolean; updated: number }> {
    try {
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

  async modifyReservation(reservationId: string, modifications: any): Promise<any> {
    try {
      const response = await axios.put(`${this.config.endpoint}/properties/${this.config.propertyId}/reservations/${reservationId}`, modifications, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to modify reservation: ${error}`);
    }
  }

  async cancelReservation(reservationId: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.config.endpoint}/properties/${this.config.propertyId}/reservations/${reservationId}`, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel reservation: ${error}`);
    }
  }

  private async pushAvailabilityAndRate(item: any): Promise<void> {
    const payload = {
      roomTypeId: item.roomTypeId,
      date: item.date,
      availability: item.availability,
      rate: item.rate
    };

    await axios.post(`${this.config.endpoint}/properties/${this.config.propertyId}/availability`, payload, {
      headers: { 
        'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushAvailability(item: any): Promise<void> {
    await axios.post(`${this.config.endpoint}/properties/${this.config.propertyId}/availability`, {
      roomTypeId: item.roomTypeId,
      date: item.date,
      availability: item.availability
    }, {
      headers: { 
        'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async pushRate(rate: ExpediaRate): Promise<void> {
    await axios.post(`${this.config.endpoint}/properties/${this.config.propertyId}/rates`, {
      roomTypeId: rate.roomTypeId,
      ratePlanId: rate.ratePlanId,
      date: rate.date,
      rate: rate.rate,
      currency: rate.currency
    }, {
      headers: { 
        'Authorization': `Basic ${Buffer.from(`${this.config.partnerId}:${this.config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  protected async validateConnection(): Promise<boolean> {
    const status = await this.getConnectionStatus();
    return status.connected;
  }
}