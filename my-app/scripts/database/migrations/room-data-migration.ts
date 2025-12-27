import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface LegacyRoom {
  _id: ObjectId;
  number: string;
  type: string;
  status: string;
  floor: number;
  capacity: number;
  amenities?: string[];
  rate?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EnhancedRoom {
  _id: ObjectId;
  propertyId: ObjectId;
  number: string;
  type: 'standard' | 'deluxe' | 'suite' | 'family' | 'accessible' | 'connecting';
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order' | 'reserved';
  floor: number;
  building?: string;
  section?: string;
  capacity: {
    adults: number;
    children: number;
    total: number;
  };
  dimensions: {
    area: number;
    unit: 'sqft' | 'sqm';
  };
  amenities: Array<{
    type: string;
    name: string;
    included: boolean;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
  pricing: {
    baseRate: number;
    currency: string;
    seasonalRates: Array<{
      season: string;
      rate: number;
      startDate: Date;
      endDate: Date;
    }>;
  };
  features: {
    view: string;
    balcony: boolean;
    smokingAllowed: boolean;
    petFriendly: boolean;
    accessible: boolean;
    connecting: boolean;
  };
  housekeeping: {
    lastCleaned: Date;
    nextScheduled: Date;
    priority: 'low' | 'medium' | 'high';
    specialInstructions: string[];
  };
  maintenance: {
    lastInspection: Date;
    nextInspection: Date;
    issues: string[];
    notes: string;
  };
  inventory: Array<{
    itemId: string;
    name: string;
    category: string;
    quantity: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    lastChecked: Date;
  }>;
  booking: {
    currentGuest?: {
      name: string;
      checkIn: Date;
      checkOut: Date;
      guestCount: number;
    };
    nextBooking?: {
      guestName: string;
      checkIn: Date;
      checkOut: Date;
    };
  };
  analytics: {
    occupancyHistory: Array<{
      date: Date;
      occupied: boolean;
      revenue: number;
    }>;
    maintenanceHistory: Array<{
      date: Date;
      type: string;
      cost: number;
      duration: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  migrationVersion: string;
}

export class RoomDataMigration {
  private db: any;
  private migrationLog: Array<{
    roomId: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    timestamp: Date;
  }> = [];

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
  }

  async migrateAllRooms(): Promise<{
    total: number;
    migrated: number;
    errors: number;
    skipped: number;
    log: typeof this.migrationLog;
  }> {
    console.log('Starting room data migration...');

    const legacyRooms = await this.db.collection('rooms').find({
      migrationVersion: { $exists: false }
    }).toArray();

    console.log(`Found ${legacyRooms.length} rooms to migrate`);

    let migrated = 0;
    let errors = 0;
    let skipped = 0;

    for (const legacyRoom of legacyRooms) {
      try {
        const result = await this.migrateRoom(legacyRoom);
        if (result.success) {
          migrated++;
          this.logMigration(legacyRoom._id.toString(), 'success', 'Room migrated successfully');
        } else {
          skipped++;
          this.logMigration(legacyRoom._id.toString(), 'skipped', result.reason || 'Unknown reason');
        }
      } catch (error) {
        errors++;
        this.logMigration(legacyRoom._id.toString(), 'error', (error as Error).message);
        console.error(`Failed to migrate room ${legacyRoom.number}:`, error);
      }
    }

    await this.saveMigrationLog();

    return {
      total: legacyRooms.length,
      migrated,
      errors,
      skipped,
      log: this.migrationLog
    };
  }

  private async migrateRoom(legacyRoom: LegacyRoom): Promise<{ success: boolean; reason?: string }> {
    // Check if room already migrated
    const existing = await this.db.collection('rooms').findOne({
      _id: legacyRoom._id,
      migrationVersion: { $exists: true }
    });

    if (existing) {
      return { success: false, reason: 'Already migrated' };
    }

    // Get default property ID
    const defaultProperty = await this.db.collection('properties').findOne({
      name: 'Main Property'
    });

    if (!defaultProperty) {
      // Create default property if it doesn't exist
      const propertyResult = await this.db.collection('properties').insertOne({
        name: 'Main Property',
        type: 'hotel',
        address: {
          street: 'To be updated',
          city: 'To be updated',
          state: 'To be updated',
          zipCode: '00000',
          country: 'To be updated'
        },
        contact: {
          phone: 'To be updated',
          email: 'contact@property.com'
        },
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          checkInTime: '15:00',
          checkOutTime: '11:00'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const propertyId = defaultProperty?._id || (await this.db.collection('properties').findOne({ name: 'Main Property' }))._id;

    // Transform legacy room to enhanced format
    const enhancedRoom: EnhancedRoom = {
      _id: legacyRoom._id,
      propertyId: new ObjectId(propertyId),
      number: legacyRoom.number,
      type: this.mapRoomType(legacyRoom.type),
      status: this.mapRoomStatus(legacyRoom.status),
      floor: legacyRoom.floor || 1,
      building: 'Main Building',
      section: this.determineSectionFromFloor(legacyRoom.floor || 1),
      capacity: {
        adults: this.determineAdultCapacity(legacyRoom.capacity || 2),
        children: Math.floor((legacyRoom.capacity || 2) / 2),
        total: legacyRoom.capacity || 2
      },
      dimensions: {
        area: this.estimateRoomArea(legacyRoom.type),
        unit: 'sqft'
      },
      amenities: this.transformAmenities(legacyRoom.amenities || []),
      pricing: {
        baseRate: legacyRoom.rate || 100,
        currency: 'USD',
        seasonalRates: this.generateDefaultSeasonalRates(legacyRoom.rate || 100)
      },
      features: {
        view: this.determineView(legacyRoom.floor || 1),
        balcony: (legacyRoom.amenities || []).includes('balcony'),
        smokingAllowed: false,
        petFriendly: false,
        accessible: legacyRoom.type.toLowerCase().includes('accessible'),
        connecting: false
      },
      housekeeping: {
        lastCleaned: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        nextScheduled: this.calculateNextHousekeeping(),
        priority: 'medium',
        specialInstructions: []
      },
      maintenance: {
        lastInspection: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        nextInspection: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        issues: [],
        notes: ''
      },
      inventory: await this.generateDefaultInventory(legacyRoom.type),
      booking: {},
      analytics: {
        occupancyHistory: [],
        maintenanceHistory: []
      },
      createdAt: legacyRoom.createdAt || new Date(),
      updatedAt: new Date(),
      migrationVersion: '1.0.0'
    };

    // Update the room with enhanced data
    await this.db.collection('rooms').replaceOne(
      { _id: legacyRoom._id },
      enhancedRoom
    );

    return { success: true };
  }

  private mapRoomType(legacyType: string): EnhancedRoom['type'] {
    const typeMap: Record<string, EnhancedRoom['type']> = {
      'standard': 'standard',
      'deluxe': 'deluxe',
      'suite': 'suite',
      'family': 'family',
      'accessible': 'accessible',
      'premium': 'deluxe',
      'luxury': 'suite'
    };

    return typeMap[legacyType.toLowerCase()] || 'standard';
  }

  private mapRoomStatus(legacyStatus: string): EnhancedRoom['status'] {
    const statusMap: Record<string, EnhancedRoom['status']> = {
      'available': 'available',
      'occupied': 'occupied',
      'maintenance': 'maintenance',
      'cleaning': 'cleaning',
      'out_of_order': 'out_of_order',
      'reserved': 'reserved',
      'dirty': 'cleaning',
      'clean': 'available'
    };

    return statusMap[legacyStatus.toLowerCase()] || 'available';
  }

  private determineSectionFromFloor(floor: number): string {
    if (floor <= 2) return 'Ground Level';
    if (floor <= 5) return 'Mid Level';
    return 'Upper Level';
  }

  private determineAdultCapacity(totalCapacity: number): number {
    return Math.max(1, Math.ceil(totalCapacity * 0.75));
  }

  private estimateRoomArea(roomType: string): number {
    const areaMap: Record<string, number> = {
      'standard': 300,
      'deluxe': 400,
      'suite': 600,
      'family': 500,
      'accessible': 350
    };

    return areaMap[roomType.toLowerCase()] || 300;
  }

  private transformAmenities(legacyAmenities: string[]): EnhancedRoom['amenities'] {
    const amenityMap: Record<string, { type: string; name: string }> = {
      'wifi': { type: 'technology', name: 'WiFi' },
      'tv': { type: 'entertainment', name: 'Television' },
      'ac': { type: 'climate', name: 'Air Conditioning' },
      'minibar': { type: 'convenience', name: 'Mini Bar' },
      'safe': { type: 'security', name: 'In-room Safe' },
      'balcony': { type: 'feature', name: 'Balcony' },
      'bathtub': { type: 'bathroom', name: 'Bathtub' },
      'shower': { type: 'bathroom', name: 'Shower' }
    };

    return legacyAmenities.map(amenity => ({
      type: amenityMap[amenity.toLowerCase()]?.type || 'other',
      name: amenityMap[amenity.toLowerCase()]?.name || amenity,
      included: true,
      condition: 'good' as const
    }));
  }

  private generateDefaultSeasonalRates(baseRate: number): EnhancedRoom['pricing']['seasonalRates'] {
    const currentYear = new Date().getFullYear();
    return [
      {
        season: 'Peak Season',
        rate: Math.round(baseRate * 1.3),
        startDate: new Date(currentYear, 5, 1), // June
        endDate: new Date(currentYear, 7, 31)   // August
      },
      {
        season: 'Holiday Season',
        rate: Math.round(baseRate * 1.5),
        startDate: new Date(currentYear, 11, 15), // December
        endDate: new Date(currentYear + 1, 0, 5)  // January
      }
    ];
  }

  private determineView(floor: number): string {
    if (floor >= 5) return 'City View';
    if (floor >= 3) return 'Partial View';
    return 'Standard View';
  }

  private calculateNextHousekeeping(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow
    return tomorrow;
  }

  private async generateDefaultInventory(roomType: string): Promise<EnhancedRoom['inventory']> {
    const baseInventory = [
      { name: 'Bed Sheets', category: 'linen', quantity: 2 },
      { name: 'Pillows', category: 'linen', quantity: 4 },
      { name: 'Towels', category: 'linen', quantity: 4 },
      { name: 'Television Remote', category: 'electronics', quantity: 1 },
      { name: 'Room Key Cards', category: 'security', quantity: 2 },
      { name: 'Toiletries Set', category: 'amenities', quantity: 1 }
    ];

    if (roomType.toLowerCase() === 'suite') {
      baseInventory.push(
        { name: 'Coffee Machine', category: 'appliances', quantity: 1 },
        { name: 'Mini Refrigerator', category: 'appliances', quantity: 1 }
      );
    }

    return baseInventory.map((item, index) => ({
      itemId: `default-${index + 1}`,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      condition: 'good' as const,
      lastChecked: new Date()
    }));
  }

  private logMigration(roomId: string, status: 'success' | 'error' | 'skipped', message: string) {
    this.migrationLog.push({
      roomId,
      status,
      message,
      timestamp: new Date()
    });
  }

  private async saveMigrationLog() {
    await this.db.collection('migration_logs').insertOne({
      type: 'room_data_migration',
      timestamp: new Date(),
      logs: this.migrationLog,
      summary: {
        total: this.migrationLog.length,
        success: this.migrationLog.filter(l => l.status === 'success').length,
        errors: this.migrationLog.filter(l => l.status === 'error').length,
        skipped: this.migrationLog.filter(l => l.status === 'skipped').length
      }
    });
  }

  async rollbackMigration(): Promise<void> {
    console.log('Rolling back room data migration...');

    const migratedRooms = await this.db.collection('rooms').find({
      migrationVersion: { $exists: true }
    }).toArray();

    for (const room of migratedRooms) {
      await this.db.collection('rooms').updateOne(
        { _id: room._id },
        { $unset: { migrationVersion: 1 } }
      );
    }

    console.log(`Rolled back ${migratedRooms.length} rooms`);
  }

  async validateMigration(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: {
      totalRooms: number;
      migratedRooms: number;
      completionPercentage: number;
    };
  }> {
    const issues: string[] = [];

    const totalRooms = await this.db.collection('rooms').countDocuments();
    const migratedRooms = await this.db.collection('rooms').countDocuments({
      migrationVersion: { $exists: true }
    });

    // Check for required fields
    const roomsWithMissingFields = await this.db.collection('rooms').find({
      migrationVersion: { $exists: true },
      $or: [
        { propertyId: { $exists: false } },
        { capacity: { $exists: false } },
        { housekeeping: { $exists: false } },
        { maintenance: { $exists: false } }
      ]
    }).toArray();

    if (roomsWithMissingFields.length > 0) {
      issues.push(`${roomsWithMissingFields.length} rooms have missing required fields`);
    }

    // Check for invalid room types
    const invalidTypes = await this.db.collection('rooms').find({
      migrationVersion: { $exists: true },
      type: { $nin: ['standard', 'deluxe', 'suite', 'family', 'accessible', 'connecting'] }
    }).toArray();

    if (invalidTypes.length > 0) {
      issues.push(`${invalidTypes.length} rooms have invalid room types`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      statistics: {
        totalRooms,
        migratedRooms,
        completionPercentage: totalRooms > 0 ? (migratedRooms / totalRooms) * 100 : 0
      }
    };
  }
}

// CLI usage
export async function runRoomMigration() {
  const migration = new RoomDataMigration();
  await migration.initialize();

  try {
    const result = await migration.migrateAllRooms();
    console.log('Migration completed:', result);

    const validation = await migration.validateMigration();
    console.log('Validation result:', validation);

    return { migration: result, validation };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}