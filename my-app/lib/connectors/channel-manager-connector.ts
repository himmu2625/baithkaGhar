export interface ChannelManagerConfig {
  system: string;
  endpoint: string;
  apiKey: string;
  propertyMappings: Record<string, string>;
}

export interface ChannelPerformanceData {
  channelName: string;
  bookings: number;
  revenue: number;
  averageRate: number;
  occupancyRate: number;
  period: string;
}

export interface RateParityData {
  roomTypeId: string;
  date: string;
  rates: Record<string, number>; // channel -> rate
  hasDisparity: boolean;
  maxDisparity: number;
}

export class ChannelManagerConnector {
  private propertyId: string;
  private config: ChannelManagerConfig;

  constructor(propertyId: string) {
    this.propertyId = propertyId;
    this.config = this.getChannelManagerConfig();
  }

  async getOverallStatus(): Promise<{ connected: boolean; channels: any[]; error?: string }> {
    try {
      const response = await this.makeRequest('GET', `/properties/${this.propertyId}/status`);
      
      return {
        connected: true,
        channels: response.data.channels || [],
      };
    } catch (error) {
      return {
        connected: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async syncAllChannels(): Promise<{ success: boolean; results: any[] }> {
    try {
      const response = await this.makeRequest('POST', `/properties/${this.propertyId}/sync-all`);
      
      return {
        success: response.success,
        results: response.data.results || [],
      };
    } catch (error) {
      throw new Error(`Failed to sync all channels: ${error}`);
    }
  }

  async getChannelPerformance(period: string = '30d'): Promise<ChannelPerformanceData[]> {
    try {
      const response = await this.makeRequest('GET', `/properties/${this.propertyId}/performance`, {
        period,
      });

      return this.transformPerformanceData(response.data);
    } catch (error) {
      throw new Error(`Failed to get channel performance: ${error}`);
    }
  }

  async getRateParity(dateRange?: { startDate: string; endDate: string }): Promise<RateParityData[]> {
    try {
      const params: any = {};
      if (dateRange) {
        params.start_date = dateRange.startDate;
        params.end_date = dateRange.endDate;
      }

      const response = await this.makeRequest('GET', `/properties/${this.propertyId}/rate-parity`, params);

      return this.transformRateParityData(response.data);
    } catch (error) {
      throw new Error(`Failed to get rate parity: ${error}`);
    }
  }

  async bulkUpdateRates(rates: any[]): Promise<{ success: boolean; updated: number; errors: any[] }> {
    try {
      const response = await this.makeRequest('POST', `/properties/${this.propertyId}/rates/bulk-update`, {
        rates: rates.map(rate => this.transformOutgoingRate(rate)),
      });

      return {
        success: response.success,
        updated: response.data.updated || 0,
        errors: response.data.errors || [],
      };
    } catch (error) {
      throw new Error(`Failed to bulk update rates: ${error}`);
    }
  }

  async bulkUpdateAvailability(availability: any[]): Promise<{ success: boolean; updated: number; errors: any[] }> {
    try {
      const response = await this.makeRequest('POST', `/properties/${this.propertyId}/availability/bulk-update`, {
        availability: availability.map(avail => this.transformOutgoingAvailability(avail)),
      });

      return {
        success: response.success,
        updated: response.data.updated || 0,
        errors: response.data.errors || [],
      };
    } catch (error) {
      throw new Error(`Failed to bulk update availability: ${error}`);
    }
  }

  async configureChannel(channelId: string, configuration: any): Promise<{ success: boolean; config: any }> {
    try {
      const response = await this.makeRequest('PUT', `/properties/${this.propertyId}/channels/${channelId}/config`, configuration);

      return {
        success: response.success,
        config: response.data.config,
      };
    } catch (error) {
      throw new Error(`Failed to configure channel: ${error}`);
    }
  }

  async getChannelMappings(channelId: string): Promise<{ roomTypes: any[]; ratePlans: any[] }> {
    try {
      const response = await this.makeRequest('GET', `/properties/${this.propertyId}/channels/${channelId}/mappings`);

      return {
        roomTypes: response.data.room_type_mappings || [],
        ratePlans: response.data.rate_plan_mappings || [],
      };
    } catch (error) {
      throw new Error(`Failed to get channel mappings: ${error}`);
    }
  }

  async updateChannelMappings(channelId: string, mappings: any): Promise<{ success: boolean }> {
    try {
      const response = await this.makeRequest('PUT', `/properties/${this.propertyId}/channels/${channelId}/mappings`, mappings);

      return { success: response.success };
    } catch (error) {
      throw new Error(`Failed to update channel mappings: ${error}`);
    }
  }

  async pauseChannel(channelId: string, reason?: string): Promise<{ success: boolean }> {
    try {
      const response = await this.makeRequest('POST', `/properties/${this.propertyId}/channels/${channelId}/pause`, {
        reason: reason || 'Manual pause',
      });

      return { success: response.success };
    } catch (error) {
      throw new Error(`Failed to pause channel: ${error}`);
    }
  }

  async resumeChannel(channelId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.makeRequest('POST', `/properties/${this.propertyId}/channels/${channelId}/resume`);

      return { success: response.success };
    } catch (error) {
      throw new Error(`Failed to resume channel: ${error}`);
    }
  }

  private getChannelManagerConfig(): ChannelManagerConfig {
    return {
      system: process.env.CHANNEL_MANAGER_SYSTEM || 'default',
      endpoint: process.env.CHANNEL_MANAGER_ENDPOINT || '',
      apiKey: process.env.CHANNEL_MANAGER_API_KEY || '',
      propertyMappings: {},
    };
  }

  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    let url = `${this.config.endpoint}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      const params = new URLSearchParams(data);
      url += '?' + params.toString();
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Channel Manager API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private transformPerformanceData(data: any[]): ChannelPerformanceData[] {
    return data.map(item => ({
      channelName: item.channel_name || item.channel,
      bookings: item.booking_count || item.bookings || 0,
      revenue: item.total_revenue || item.revenue || 0,
      averageRate: item.average_rate || item.avg_rate || 0,
      occupancyRate: item.occupancy_rate || item.occupancy || 0,
      period: item.period || '30d',
    }));
  }

  private transformRateParityData(data: any[]): RateParityData[] {
    return data.map(item => {
      const rates: Record<string, number> = {};
      
      // Transform channel rates
      if (item.channel_rates) {
        Object.entries(item.channel_rates).forEach(([channel, rate]) => {
          rates[channel] = Number(rate);
        });
      }

      // Calculate disparity
      const rateValues = Object.values(rates);
      const minRate = Math.min(...rateValues);
      const maxRate = Math.max(...rateValues);
      const maxDisparity = rateValues.length > 1 ? ((maxRate - minRate) / minRate) * 100 : 0;

      return {
        roomTypeId: item.room_type_id || item.roomType,
        date: item.date,
        rates,
        hasDisparity: maxDisparity > 5, // 5% threshold
        maxDisparity,
      };
    });
  }

  private transformOutgoingRate(rate: any): any {
    return {
      room_type_id: rate.roomTypeId,
      rate_plan_id: rate.ratePlanId,
      date: rate.date,
      rate: rate.rate,
      currency: rate.currency || 'USD',
      channels: rate.channels || 'all',
    };
  }

  private transformOutgoingAvailability(avail: any): any {
    return {
      room_type_id: avail.roomTypeId,
      date: avail.date,
      availability: avail.availability,
      minimum_stay: avail.minimumStay || 1,
      maximum_stay: avail.maximumStay || 30,
      closed_to_arrival: avail.closedToArrival || false,
      closed_to_departure: avail.closedToDeparture || false,
      channels: avail.channels || 'all',
    };
  }
}