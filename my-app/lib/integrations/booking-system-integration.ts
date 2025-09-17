import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface BookingSystemConfig {
  name: string;
  type: 'pms' | 'ota' | 'channel_manager' | 'direct';
  endpoint: string;
  apiKey: string;
  secretKey?: string;
  version: string;
  isActive: boolean;
  settings: {
    syncInterval: number; // in minutes
    autoSync: boolean;
    syncRoomStatus: boolean;
    syncRates: boolean;
    syncInventory: boolean;
    syncBookings: boolean;
  };
}

interface ExternalBooking {
  externalId: string;
  source: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalAmount: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'checked_in' | 'checked_out';
  bookingDate: Date;
  specialRequests?: string[];
  metadata?: Record<string, any>;
}

interface RoomAvailability {
  roomId: ObjectId;
  roomNumber: string;
  roomType: string;
  date: Date;
  isAvailable: boolean;
  rate: number;
  restrictions?: {
    minimumStay?: number;
    maximumStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export class BookingSystemIntegration {
  private db: any;
  private configs: Map<string, BookingSystemConfig> = new Map();

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
    await this.loadConfigurations();
  }

  private async loadConfigurations() {
    const configs = await this.db.collection('integration_configs').find({
      type: { $in: ['pms', 'ota', 'channel_manager', 'direct'] },
      isActive: true
    }).toArray();

    this.configs.clear();
    configs.forEach(config => {
      this.configs.set(config.name, config);
    });

    console.log(`Loaded ${this.configs.size} booking system configurations`);
  }

  async syncBookingsFromExternal(systemName: string): Promise<{
    fetched: number;
    created: number;
    updated: number;
    errors: number;
    summary: string;
  }> {
    const config = this.configs.get(systemName);
    if (!config) {
      throw new Error(`Booking system configuration not found: ${systemName}`);
    }

    console.log(`Syncing bookings from ${systemName}...`);

    let fetched = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Fetch bookings from external system
      const externalBookings = await this.fetchBookingsFromSystem(config);
      fetched = externalBookings.length;

      for (const externalBooking of externalBookings) {
        try {
          const result = await this.processExternalBooking(externalBooking, systemName);
          if (result.isNew) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          console.error(`Failed to process booking ${externalBooking.externalId}:`, error);
          errors++;
        }
      }

      // Log sync operation
      await this.logSyncOperation(systemName, 'booking_sync', {
        fetched,
        created,
        updated,
        errors
      });

      return {
        fetched,
        created,
        updated,
        errors,
        summary: `Sync completed: ${created} created, ${updated} updated, ${errors} errors`
      };
    } catch (error) {
      console.error(`Booking sync failed for ${systemName}:`, error);
      throw error;
    }
  }

  private async fetchBookingsFromSystem(config: BookingSystemConfig): Promise<ExternalBooking[]> {
    switch (config.type) {
      case 'pms':
        return await this.fetchFromPMS(config);
      case 'ota':
        return await this.fetchFromOTA(config);
      case 'channel_manager':
        return await this.fetchFromChannelManager(config);
      case 'direct':
        return await this.fetchFromDirectBooking(config);
      default:
        throw new Error(`Unsupported booking system type: ${config.type}`);
    }
  }

  private async fetchFromPMS(config: BookingSystemConfig): Promise<ExternalBooking[]> {
    // Generic PMS integration - adapt for specific PMS systems
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const response = await fetch(`${config.endpoint}/bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Version': config.version
      },
      body: JSON.stringify({
        start_date: today.toISOString().split('T')[0],
        end_date: nextMonth.toISOString().split('T')[0],
        include_cancelled: true
      })
    });

    if (!response.ok) {
      throw new Error(`PMS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizePMSBookings(data.bookings || []);
  }

  private async fetchFromOTA(config: BookingSystemConfig): Promise<ExternalBooking[]> {
    // OTA integration (Booking.com, Expedia, etc.)
    const response = await fetch(`${config.endpoint}/reservations`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'X-Secret-Key': config.secretKey || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        property_id: process.env.PROPERTY_ID,
        date_from: new Date().toISOString().split('T')[0],
        date_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    });

    if (!response.ok) {
      throw new Error(`OTA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeOTABookings(data.reservations || []);
  }

  private async fetchFromChannelManager(config: BookingSystemConfig): Promise<ExternalBooking[]> {
    // Channel Manager integration (SiteMinder, eZee, etc.)
    const response = await fetch(`${config.endpoint}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `API-KEY ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hotel_id: process.env.HOTEL_ID,
        from_date: new Date().toISOString(),
        to_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        booking_status: ['confirmed', 'modified', 'cancelled']
      })
    });

    if (!response.ok) {
      throw new Error(`Channel Manager API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeChannelManagerBookings(data.data || []);
  }

  private async fetchFromDirectBooking(config: BookingSystemConfig): Promise<ExternalBooking[]> {
    // Direct booking system integration
    const response = await fetch(`${config.endpoint}/api/bookings`, {
      method: 'GET',
      headers: {
        'API-Token': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Direct booking API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.normalizeDirectBookings(data.bookings || []);
  }

  private normalizePMSBookings(bookings: any[]): ExternalBooking[] {
    return bookings.map(booking => ({
      externalId: booking.id || booking.reservation_id,
      source: 'pms',
      guestName: `${booking.guest.first_name} ${booking.guest.last_name}`,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      roomNumber: booking.room?.number,
      roomType: booking.room_type || booking.room?.type,
      checkIn: new Date(booking.checkin_date || booking.arrival_date),
      checkOut: new Date(booking.checkout_date || booking.departure_date),
      numberOfGuests: booking.guests || booking.occupancy?.adults || 1,
      totalAmount: parseFloat(booking.total_amount || booking.rate?.total || '0'),
      currency: booking.currency || 'USD',
      status: this.mapBookingStatus(booking.status),
      bookingDate: new Date(booking.created_at || booking.booking_date),
      specialRequests: booking.special_requests ? [booking.special_requests] : [],
      metadata: {
        pmsId: booking.id,
        confirmationNumber: booking.confirmation_number,
        source: booking.source
      }
    }));
  }

  private normalizeOTABookings(bookings: any[]): ExternalBooking[] {
    return bookings.map(booking => ({
      externalId: booking.reservation_id || booking.id,
      source: booking.channel || 'ota',
      guestName: booking.guest_name || `${booking.first_name} ${booking.last_name}`,
      guestEmail: booking.email || booking.guest_email,
      guestPhone: booking.phone || booking.telephone,
      roomNumber: booking.room_number,
      roomType: booking.room_type_name || booking.accommodation_type,
      checkIn: new Date(booking.checkin || booking.arrival),
      checkOut: new Date(booking.checkout || booking.departure),
      numberOfGuests: booking.num_adults + (booking.num_children || 0),
      totalAmount: parseFloat(booking.total_price || booking.price || '0'),
      currency: booking.currency || 'USD',
      status: this.mapBookingStatus(booking.status || booking.reservation_status),
      bookingDate: new Date(booking.created_date || booking.booking_time),
      specialRequests: booking.remarks ? [booking.remarks] : [],
      metadata: {
        otaId: booking.reservation_id,
        channel: booking.channel,
        commissionAmount: booking.commission
      }
    }));
  }

  private normalizeChannelManagerBookings(bookings: any[]): ExternalBooking[] {
    return bookings.map(booking => ({
      externalId: booking.booking_id || booking.id,
      source: booking.source_name || 'channel_manager',
      guestName: booking.guest_name || booking.primary_guest.name,
      guestEmail: booking.guest_email || booking.primary_guest.email,
      guestPhone: booking.guest_phone || booking.primary_guest.phone,
      roomNumber: booking.room_number,
      roomType: booking.room_type,
      checkIn: new Date(booking.check_in_date),
      checkOut: new Date(booking.check_out_date),
      numberOfGuests: booking.total_guests || booking.adults + booking.children,
      totalAmount: parseFloat(booking.total_amount || '0'),
      currency: booking.currency_code || 'USD',
      status: this.mapBookingStatus(booking.booking_status),
      bookingDate: new Date(booking.booking_date),
      specialRequests: booking.special_instructions ? [booking.special_instructions] : [],
      metadata: {
        channelId: booking.channel_id,
        sourceBookingId: booking.source_booking_id
      }
    }));
  }

  private normalizeDirectBookings(bookings: any[]): ExternalBooking[] {
    return bookings.map(booking => ({
      externalId: booking._id || booking.id,
      source: 'direct',
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      roomNumber: booking.roomNumber,
      roomType: booking.roomType,
      checkIn: new Date(booking.checkInDate),
      checkOut: new Date(booking.checkOutDate),
      numberOfGuests: booking.guestCount,
      totalAmount: booking.totalAmount,
      currency: booking.currency || 'USD',
      status: this.mapBookingStatus(booking.status),
      bookingDate: new Date(booking.createdAt),
      specialRequests: booking.specialRequests || [],
      metadata: {
        directBookingId: booking._id,
        paymentStatus: booking.paymentStatus
      }
    }));
  }

  private mapBookingStatus(externalStatus: string): ExternalBooking['status'] {
    const statusMap: Record<string, ExternalBooking['status']> = {
      'confirmed': 'confirmed',
      'active': 'confirmed',
      'booked': 'confirmed',
      'reserved': 'confirmed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'modified': 'modified',
      'updated': 'modified',
      'checked_in': 'checked_in',
      'checkedin': 'checked_in',
      'in_house': 'checked_in',
      'checked_out': 'checked_out',
      'checkedout': 'checked_out',
      'departed': 'checked_out'
    };

    return statusMap[externalStatus.toLowerCase()] || 'confirmed';
  }

  private async processExternalBooking(
    externalBooking: ExternalBooking,
    systemName: string
  ): Promise<{ isNew: boolean; bookingId: ObjectId }> {
    // Check if booking already exists
    const existingBooking = await this.db.collection('bookings').findOne({
      $or: [
        { externalId: externalBooking.externalId, source: systemName },
        {
          guestEmail: externalBooking.guestEmail,
          checkIn: externalBooking.checkIn,
          checkOut: externalBooking.checkOut
        }
      ]
    });

    if (existingBooking) {
      // Update existing booking
      const updateData = {
        ...externalBooking,
        source: systemName,
        lastSyncAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('bookings').updateOne(
        { _id: existingBooking._id },
        { $set: updateData }
      );

      // Update room status if needed
      await this.updateRoomStatusFromBooking(updateData, existingBooking);

      return { isNew: false, bookingId: existingBooking._id };
    } else {
      // Find and assign room
      const assignedRoom = await this.findAvailableRoom(
        externalBooking.roomType,
        externalBooking.checkIn,
        externalBooking.checkOut
      );

      // Create new booking
      const newBooking = {
        ...externalBooking,
        _id: new ObjectId(),
        roomId: assignedRoom?._id,
        roomNumber: assignedRoom?.number || externalBooking.roomNumber,
        source: systemName,
        isExternal: true,
        syncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.db.collection('bookings').insertOne(newBooking);

      // Update room status
      if (assignedRoom && externalBooking.status === 'confirmed') {
        await this.updateRoomAvailability(assignedRoom._id, externalBooking.checkIn, externalBooking.checkOut);
      }

      // Trigger housekeeping tasks if needed
      if (externalBooking.status === 'checked_out') {
        await this.triggerCheckoutTasks(assignedRoom?._id);
      } else if (externalBooking.status === 'confirmed') {
        await this.triggerPreArrivalTasks(assignedRoom?._id, externalBooking.checkIn);
      }

      return { isNew: true, bookingId: result.insertedId };
    }
  }

  private async findAvailableRoom(roomType: string, checkIn: Date, checkOut: Date): Promise<any> {
    const rooms = await this.db.collection('rooms').find({
      type: { $regex: new RegExp(roomType, 'i') },
      status: { $in: ['available', 'cleaning'] }
    }).toArray();

    for (const room of rooms) {
      const isAvailable = await this.checkRoomAvailability(room._id, checkIn, checkOut);
      if (isAvailable) {
        return room;
      }
    }

    // If no exact type match, find any available room
    const anyRoom = await this.db.collection('rooms').findOne({
      status: 'available'
    });

    if (anyRoom) {
      const isAvailable = await this.checkRoomAvailability(anyRoom._id, checkIn, checkOut);
      return isAvailable ? anyRoom : null;
    }

    return null;
  }

  private async checkRoomAvailability(roomId: ObjectId, checkIn: Date, checkOut: Date): Promise<boolean> {
    const conflictingBooking = await this.db.collection('bookings').findOne({
      roomId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        {
          checkIn: { $lt: checkOut },
          checkOut: { $gt: checkIn }
        }
      ]
    });

    return !conflictingBooking;
  }

  private async updateRoomStatusFromBooking(booking: any, existingBooking: any): Promise<void> {
    if (!booking.roomId) return;

    const statusUpdates: Record<string, string> = {
      'confirmed': 'reserved',
      'checked_in': 'occupied',
      'checked_out': 'cleaning',
      'cancelled': 'available'
    };

    const newStatus = statusUpdates[booking.status];
    if (newStatus && newStatus !== existingBooking.status) {
      await this.db.collection('rooms').updateOne(
        { _id: booking.roomId },
        {
          $set: {
            status: newStatus,
            updatedAt: new Date()
          }
        }
      );
    }
  }

  private async updateRoomAvailability(roomId: ObjectId, checkIn: Date, checkOut: Date): Promise<void> {
    await this.db.collection('rooms').updateOne(
      { _id: roomId },
      {
        $set: {
          status: 'reserved',
          currentBooking: {
            checkIn,
            checkOut
          },
          updatedAt: new Date()
        }
      }
    );
  }

  private async triggerCheckoutTasks(roomId?: ObjectId): Promise<void> {
    if (!roomId) return;

    const room = await this.db.collection('rooms').findOne({ _id: roomId });
    if (!room) return;

    // Create checkout cleaning task
    const cleaningTask = {
      propertyId: room.propertyId,
      roomId,
      roomNumber: room.number,
      type: 'checkout_cleaning',
      title: `Checkout Cleaning - Room ${room.number}`,
      description: 'Complete cleaning after guest checkout',
      priority: 'high',
      status: 'scheduled',
      estimatedDuration: 45,
      scheduledDate: new Date(),
      scheduledTime: new Date(),
      instructions: [
        'Strip and replace all bed linens',
        'Clean and sanitize bathroom thoroughly',
        'Vacuum and mop floors',
        'Restock amenities'
      ],
      source: 'booking_integration',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.collection('housekeeping_tasks').insertOne(cleaningTask);
  }

  private async triggerPreArrivalTasks(roomId?: ObjectId, checkIn?: Date): Promise<void> {
    if (!roomId || !checkIn) return;

    const room = await this.db.collection('rooms').findOne({ _id: roomId });
    if (!room) return;

    // Create pre-arrival inspection task
    const inspectionTask = {
      propertyId: room.propertyId,
      roomId,
      roomNumber: room.number,
      type: 'pre_arrival_inspection',
      title: `Pre-Arrival Inspection - Room ${room.number}`,
      description: 'Final check before guest arrival',
      priority: 'medium',
      status: 'scheduled',
      estimatedDuration: 15,
      scheduledDate: new Date(checkIn.getTime() - 4 * 60 * 60 * 1000), // 4 hours before checkin
      scheduledTime: new Date(checkIn.getTime() - 4 * 60 * 60 * 1000),
      instructions: [
        'Verify room cleanliness',
        'Check all amenities are stocked',
        'Test all equipment functionality',
        'Ensure room temperature is comfortable'
      ],
      source: 'booking_integration',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.collection('housekeeping_tasks').insertOne(inspectionTask);
  }

  private async logSyncOperation(
    systemName: string,
    operation: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.db.collection('sync_logs').insertOne({
      systemName,
      operation,
      details,
      timestamp: new Date(),
      success: details.errors === 0
    });
  }

  async setupIntegrationConfig(config: BookingSystemConfig): Promise<void> {
    await this.db.collection('integration_configs').updateOne(
      { name: config.name },
      { $set: { ...config, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );

    this.configs.set(config.name, config);
    console.log(`Integration configuration saved for ${config.name}`);
  }

  async testConnection(systemName: string): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    const config = this.configs.get(systemName);
    if (!config) {
      return { success: false, message: 'Configuration not found' };
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Connection successful',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: (error as Error).message,
        responseTime
      };
    }
  }

  async getIntegrationStatus(): Promise<{
    totalSystems: number;
    activeSystems: number;
    lastSyncTimes: Record<string, Date>;
    errors: string[];
  }> {
    const totalSystems = this.configs.size;
    const activeSystems = Array.from(this.configs.values()).filter(config => config.isActive).length;

    const syncLogs = await this.db.collection('sync_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const lastSyncTimes: Record<string, Date> = {};
    const errors: string[] = [];

    syncLogs.forEach(log => {
      if (!lastSyncTimes[log.systemName]) {
        lastSyncTimes[log.systemName] = log.timestamp;
      }

      if (!log.success) {
        errors.push(`${log.systemName}: ${log.details.error || 'Unknown error'}`);
      }
    });

    return {
      totalSystems,
      activeSystems,
      lastSyncTimes,
      errors: errors.slice(0, 10) // Return only recent errors
    };
  }
}

export async function initializeBookingIntegration() {
  const integration = new BookingSystemIntegration();
  await integration.initialize();

  // Setup default configurations for common systems
  const defaultConfigs: BookingSystemConfig[] = [
    {
      name: 'Opera PMS',
      type: 'pms',
      endpoint: process.env.OPERA_PMS_ENDPOINT || 'https://api.oracle.com/hospitality/pms/v1',
      apiKey: process.env.OPERA_API_KEY || '',
      version: 'v1',
      isActive: false,
      settings: {
        syncInterval: 30,
        autoSync: true,
        syncRoomStatus: true,
        syncRates: true,
        syncInventory: true,
        syncBookings: true
      }
    },
    {
      name: 'Booking.com',
      type: 'ota',
      endpoint: process.env.BOOKING_COM_ENDPOINT || 'https://distribution-xml.booking.com/json/bookings.getBookings',
      apiKey: process.env.BOOKING_COM_API_KEY || '',
      secretKey: process.env.BOOKING_COM_SECRET || '',
      version: '2.6',
      isActive: false,
      settings: {
        syncInterval: 60,
        autoSync: true,
        syncRoomStatus: true,
        syncRates: false,
        syncInventory: true,
        syncBookings: true
      }
    }
  ];

  for (const config of defaultConfigs) {
    await integration.setupIntegrationConfig(config);
  }

  return integration;
}