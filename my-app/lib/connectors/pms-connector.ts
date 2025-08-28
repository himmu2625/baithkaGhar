export interface PMSConfig {
  system: string;
  endpoint: string;
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
    token?: string;
  };
}

export interface ReservationData {
  id: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
}

export interface RoomStatusData {
  roomNumber: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  lastUpdated: Date;
}

export class PMSConnector {
  private propertyId: string;
  private systemType: string;
  private config: PMSConfig;

  constructor(propertyId: string, systemType: string) {
    this.propertyId = propertyId;
    this.systemType = systemType;
    this.config = this.getPMSConfig();
  }

  async getConnectionStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Test connection to PMS
      const response = await this.makeRequest('GET', '/health');
      return { connected: response.status === 'ok' };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async syncReservations(): Promise<ReservationData[]> {
    try {
      const response = await this.makeRequest('GET', '/reservations', {
        property_id: this.propertyId,
        from_date: new Date().toISOString().split('T')[0],
      });

      return this.transformReservations(response.data);
    } catch (error) {
      throw new Error(`Failed to sync reservations: ${error}`);
    }
  }

  async getRoomStatus(): Promise<RoomStatusData[]> {
    try {
      const response = await this.makeRequest('GET', '/rooms/status', {
        property_id: this.propertyId,
      });

      return this.transformRoomStatus(response.data);
    } catch (error) {
      throw new Error(`Failed to get room status: ${error}`);
    }
  }

  async getGuestData(): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', '/guests', {
        property_id: this.propertyId,
        status: 'active',
      });

      return this.transformGuestData(response.data);
    } catch (error) {
      throw new Error(`Failed to get guest data: ${error}`);
    }
  }

  async updateRoomStatus(roomId: string, status: string): Promise<any> {
    try {
      const response = await this.makeRequest('PUT', `/rooms/${roomId}/status`, {
        status,
        updated_by: 'ota_system',
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update room status: ${error}`);
    }
  }

  async createReservation(reservationData: any): Promise<any> {
    try {
      const transformedData = this.transformOutgoingReservation(reservationData);
      
      const response = await this.makeRequest('POST', '/reservations', transformedData);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create reservation: ${error}`);
    }
  }

  async updateGuestProfile(guestId: string, profileData: any): Promise<any> {
    try {
      const response = await this.makeRequest('PUT', `/guests/${guestId}`, profileData);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update guest profile: ${error}`);
    }
  }

  private getPMSConfig(): PMSConfig {
    // This would fetch configuration based on system type and property
    // For now, return default configuration
    return {
      system: this.systemType,
      endpoint: process.env[`PMS_${this.systemType.toUpperCase()}_ENDPOINT`] || '',
      credentials: {
        apiKey: process.env[`PMS_${this.systemType.toUpperCase()}_API_KEY`] || '',
        username: process.env[`PMS_${this.systemType.toUpperCase()}_USERNAME`],
        password: process.env[`PMS_${this.systemType.toUpperCase()}_PASSWORD`],
      },
    };
  }

  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.config.endpoint}${path}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      const params = new URLSearchParams(data);
      url + '?' + params.toString();
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`PMS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.credentials.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.credentials.apiKey}`;
    } else if (this.config.credentials.username && this.config.credentials.password) {
      headers['Authorization'] = `Basic ${Buffer.from(
        `${this.config.credentials.username}:${this.config.credentials.password}`
      ).toString('base64')}`;
    }

    return headers;
  }

  private transformReservations(data: any[]): ReservationData[] {
    // Transform PMS reservation data to standard format
    return data.map(reservation => ({
      id: reservation.id || reservation.reservation_id,
      guestName: `${reservation.first_name} ${reservation.last_name}`,
      roomNumber: reservation.room_number || reservation.room,
      checkInDate: reservation.check_in_date || reservation.arrival_date,
      checkOutDate: reservation.check_out_date || reservation.departure_date,
      status: this.mapReservationStatus(reservation.status),
    }));
  }

  private transformRoomStatus(data: any[]): RoomStatusData[] {
    // Transform PMS room status data to standard format
    return data.map(room => ({
      roomNumber: room.room_number || room.number,
      status: this.mapRoomStatus(room.status),
      lastUpdated: new Date(room.last_updated || Date.now()),
    }));
  }

  private transformGuestData(data: any[]): any[] {
    // Transform PMS guest data to standard format
    return data.map(guest => ({
      id: guest.id || guest.guest_id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      checkInDate: guest.check_in_date,
      checkOutDate: guest.check_out_date,
      roomNumber: guest.room_number,
    }));
  }

  private transformOutgoingReservation(data: any): any {
    // Transform standard reservation data to PMS format
    return {
      property_id: this.propertyId,
      guest_first_name: data.guestFirstName,
      guest_last_name: data.guestLastName,
      guest_email: data.guestEmail,
      room_type_id: data.roomTypeId,
      check_in_date: data.checkInDate,
      check_out_date: data.checkOutDate,
      total_amount: data.totalAmount,
      source: 'ota_system',
    };
  }

  private mapReservationStatus(pmsStatus: string): 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' {
    const statusMap: Record<string, 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'> = {
      'confirmed': 'confirmed',
      'guaranteed': 'confirmed',
      'checked_in': 'checked-in',
      'in_house': 'checked-in',
      'checked_out': 'checked-out',
      'departed': 'checked-out',
      'cancelled': 'cancelled',
      'no_show': 'cancelled',
    };

    return statusMap[pmsStatus.toLowerCase()] || 'confirmed';
  }

  private mapRoomStatus(pmsStatus: string): 'available' | 'occupied' | 'maintenance' | 'out-of-order' {
    const statusMap: Record<string, 'available' | 'occupied' | 'maintenance' | 'out-of-order'> = {
      'vacant_clean': 'available',
      'vacant_dirty': 'available',
      'occupied_clean': 'occupied',
      'occupied_dirty': 'occupied',
      'out_of_order': 'out-of-order',
      'maintenance': 'maintenance',
    };

    return statusMap[pmsStatus.toLowerCase()] || 'available';
  }
}