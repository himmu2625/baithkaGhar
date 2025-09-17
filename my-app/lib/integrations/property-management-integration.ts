import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface PropertyData {
  id: string;
  name: string;
  type: 'hotel' | 'resort' | 'apartment' | 'hostel' | 'villa';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    manager: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    checkInTime: string;
    checkOutTime: string;
    maxAdvanceBooking: number; // days
    minAdvanceBooking: number; // hours
  };
  facilities: Array<{
    name: string;
    type: string;
    description: string;
    isActive: boolean;
    operatingHours?: { open: string; close: string };
  }>;
  policies: {
    cancellation: string;
    noShow: string;
    children: string;
    pets: string;
    smoking: string;
    payment: string[];
  };
  licensing: {
    businessLicense: string;
    hotelLicense: string;
    taxId: string;
    permits: Array<{ type: string; number: string; expiry: Date }>;
  };
}

interface RoomTypeConfiguration {
  id: string;
  name: string;
  code: string;
  category: 'standard' | 'deluxe' | 'suite' | 'family' | 'accessible';
  description: string;
  maxOccupancy: {
    adults: number;
    children: number;
    total: number;
  };
  amenities: Array<{
    name: string;
    type: string;
    included: boolean;
    chargeable: boolean;
    price?: number;
  }>;
  images: string[];
  pricing: {
    baseRate: number;
    currency: string;
    inclusions: string[];
    exclusions: string[];
    taxRate: number;
    serviceChargeRate: number;
  };
  availability: {
    totalRooms: number;
    activeRooms: number;
    outOfOrderRooms: number;
  };
}

interface StaffConfiguration {
  departments: Array<{
    name: string;
    description: string;
    roles: Array<{
      title: string;
      responsibilities: string[];
      requiredSkills: string[];
      accessLevel: 'basic' | 'advanced' | 'manager' | 'admin';
      shiftTypes: string[];
    }>;
  }>;
  workingHours: {
    frontDesk: { start: string; end: string };
    housekeeping: { start: string; end: string };
    maintenance: { start: string; end: string };
    management: { start: string; end: string };
  };
  policies: {
    timeTracking: boolean;
    breakDuration: number; // minutes
    overtimeRules: string;
    leavePolicy: string;
  };
}

export class PropertyManagementIntegration {
  private db: any;

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
  }

  async setupPropertyConfiguration(propertyData: PropertyData): Promise<{
    propertyId: ObjectId;
    roomTypesCreated: number;
    facilitiesCreated: number;
    configurationsSet: number;
  }> {
    console.log(`Setting up property configuration for: ${propertyData.name}`);

    // Create or update property
    const property = {
      ...propertyData,
      _id: new ObjectId(),
      isActive: true,
      setupCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const propertyResult = await this.db.collection('properties').insertOne(property);
    const propertyId = propertyResult.insertedId;

    // Setup room types
    const roomTypesCreated = await this.setupRoomTypes(propertyId, this.getDefaultRoomTypes());

    // Setup facilities
    const facilitiesCreated = await this.setupFacilities(propertyId, propertyData.facilities);

    // Setup operational configurations
    const configurationsSet = await this.setupOperationalConfigs(propertyId, propertyData);

    // Mark setup as completed
    await this.db.collection('properties').updateOne(
      { _id: propertyId },
      { $set: { setupCompleted: true, updatedAt: new Date() } }
    );

    return {
      propertyId,
      roomTypesCreated,
      facilitiesCreated,
      configurationsSet
    };
  }

  private async setupRoomTypes(propertyId: ObjectId, roomTypes: RoomTypeConfiguration[]): Promise<number> {
    let created = 0;

    for (const roomType of roomTypes) {
      const roomTypeDoc = {
        ...roomType,
        _id: new ObjectId(),
        propertyId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('room_types').insertOne(roomTypeDoc);
      created++;
    }

    console.log(`Created ${created} room types`);
    return created;
  }

  private async setupFacilities(propertyId: ObjectId, facilities: PropertyData['facilities']): Promise<number> {
    let created = 0;

    for (const facility of facilities) {
      const facilityDoc = {
        ...facility,
        _id: new ObjectId(),
        propertyId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.db.collection('property_facilities').insertOne(facilityDoc);
      created++;
    }

    console.log(`Created ${created} facilities`);
    return created;
  }

  private async setupOperationalConfigs(propertyId: ObjectId, propertyData: PropertyData): Promise<number> {
    const configs = [
      {
        type: 'operational_hours',
        data: {
          checkIn: propertyData.settings.checkInTime,
          checkOut: propertyData.settings.checkOutTime,
          frontDesk24h: true,
          restaurantHours: { open: '06:00', close: '23:00' },
          housekeepingHours: { start: '08:00', end: '17:00' },
          maintenanceHours: { start: '07:00', end: '19:00' }
        }
      },
      {
        type: 'booking_rules',
        data: {
          maxAdvanceBooking: propertyData.settings.maxAdvanceBooking,
          minAdvanceBooking: propertyData.settings.minAdvanceBooking,
          allowOverbooking: false,
          overbookingPercentage: 0,
          requireDeposit: true,
          depositPercentage: 20
        }
      },
      {
        type: 'pricing_rules',
        data: {
          currency: propertyData.settings.currency,
          taxInclusive: false,
          serviceChargeInclusive: false,
          dynamicPricing: false,
          seasonalRates: true,
          lastMinuteDiscounts: true
        }
      },
      {
        type: 'guest_policies',
        data: propertyData.policies
      },
      {
        type: 'notification_settings',
        data: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          alertsFor: ['new_booking', 'cancellation', 'maintenance_urgent', 'guest_complaint']
        }
      }
    ];

    let created = 0;
    for (const config of configs) {
      await this.db.collection('property_configurations').insertOne({
        ...config,
        _id: new ObjectId(),
        propertyId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      created++;
    }

    console.log(`Created ${created} operational configurations`);
    return created;
  }

  private getDefaultRoomTypes(): RoomTypeConfiguration[] {
    return [
      {
        id: 'standard-single',
        name: 'Standard Single Room',
        code: 'STD-SGL',
        category: 'standard',
        description: 'Comfortable single occupancy room with essential amenities',
        maxOccupancy: { adults: 1, children: 0, total: 1 },
        amenities: [
          { name: 'WiFi', type: 'connectivity', included: true, chargeable: false },
          { name: 'Air Conditioning', type: 'comfort', included: true, chargeable: false },
          { name: 'Television', type: 'entertainment', included: true, chargeable: false },
          { name: 'Private Bathroom', type: 'bathroom', included: true, chargeable: false }
        ],
        images: [],
        pricing: {
          baseRate: 89,
          currency: 'USD',
          inclusions: ['WiFi', 'Daily Housekeeping'],
          exclusions: ['Breakfast', 'Minibar'],
          taxRate: 0.12,
          serviceChargeRate: 0.08
        },
        availability: { totalRooms: 20, activeRooms: 20, outOfOrderRooms: 0 }
      },
      {
        id: 'standard-double',
        name: 'Standard Double Room',
        code: 'STD-DBL',
        category: 'standard',
        description: 'Spacious double occupancy room with modern amenities',
        maxOccupancy: { adults: 2, children: 1, total: 3 },
        amenities: [
          { name: 'WiFi', type: 'connectivity', included: true, chargeable: false },
          { name: 'Air Conditioning', type: 'comfort', included: true, chargeable: false },
          { name: 'Television', type: 'entertainment', included: true, chargeable: false },
          { name: 'Private Bathroom', type: 'bathroom', included: true, chargeable: false },
          { name: 'Mini Refrigerator', type: 'convenience', included: true, chargeable: false }
        ],
        images: [],
        pricing: {
          baseRate: 129,
          currency: 'USD',
          inclusions: ['WiFi', 'Daily Housekeeping'],
          exclusions: ['Breakfast', 'Minibar'],
          taxRate: 0.12,
          serviceChargeRate: 0.08
        },
        availability: { totalRooms: 30, activeRooms: 30, outOfOrderRooms: 0 }
      },
      {
        id: 'deluxe-double',
        name: 'Deluxe Double Room',
        code: 'DLX-DBL',
        category: 'deluxe',
        description: 'Premium double room with enhanced amenities and city view',
        maxOccupancy: { adults: 2, children: 1, total: 3 },
        amenities: [
          { name: 'WiFi', type: 'connectivity', included: true, chargeable: false },
          { name: 'Air Conditioning', type: 'comfort', included: true, chargeable: false },
          { name: 'Smart TV', type: 'entertainment', included: true, chargeable: false },
          { name: 'Private Bathroom', type: 'bathroom', included: true, chargeable: false },
          { name: 'Mini Refrigerator', type: 'convenience', included: true, chargeable: false },
          { name: 'Coffee Machine', type: 'convenience', included: true, chargeable: false },
          { name: 'Balcony', type: 'feature', included: true, chargeable: false }
        ],
        images: [],
        pricing: {
          baseRate: 179,
          currency: 'USD',
          inclusions: ['WiFi', 'Daily Housekeeping', 'Welcome Drink'],
          exclusions: ['Breakfast', 'Minibar'],
          taxRate: 0.12,
          serviceChargeRate: 0.08
        },
        availability: { totalRooms: 15, activeRooms: 15, outOfOrderRooms: 0 }
      },
      {
        id: 'family-suite',
        name: 'Family Suite',
        code: 'FAM-STE',
        category: 'family',
        description: 'Spacious suite perfect for families with separate living area',
        maxOccupancy: { adults: 2, children: 2, total: 4 },
        amenities: [
          { name: 'WiFi', type: 'connectivity', included: true, chargeable: false },
          { name: 'Air Conditioning', type: 'comfort', included: true, chargeable: false },
          { name: 'Smart TV', type: 'entertainment', included: true, chargeable: false },
          { name: 'Private Bathroom', type: 'bathroom', included: true, chargeable: false },
          { name: 'Kitchenette', type: 'convenience', included: true, chargeable: false },
          { name: 'Separate Living Area', type: 'space', included: true, chargeable: false },
          { name: 'Sofa Bed', type: 'furniture', included: true, chargeable: false }
        ],
        images: [],
        pricing: {
          baseRate: 249,
          currency: 'USD',
          inclusions: ['WiFi', 'Daily Housekeeping', 'Welcome Amenities'],
          exclusions: ['Breakfast'],
          taxRate: 0.12,
          serviceChargeRate: 0.08
        },
        availability: { totalRooms: 8, activeRooms: 8, outOfOrderRooms: 0 }
      },
      {
        id: 'accessible-room',
        name: 'Accessible Room',
        code: 'ACC-RM',
        category: 'accessible',
        description: 'ADA compliant room with accessibility features',
        maxOccupancy: { adults: 2, children: 1, total: 3 },
        amenities: [
          { name: 'WiFi', type: 'connectivity', included: true, chargeable: false },
          { name: 'Air Conditioning', type: 'comfort', included: true, chargeable: false },
          { name: 'Television', type: 'entertainment', included: true, chargeable: false },
          { name: 'Accessible Bathroom', type: 'bathroom', included: true, chargeable: false },
          { name: 'Grab Bars', type: 'accessibility', included: true, chargeable: false },
          { name: 'Lowered Closet Rods', type: 'accessibility', included: true, chargeable: false },
          { name: 'Visual/Audio Alerts', type: 'accessibility', included: true, chargeable: false }
        ],
        images: [],
        pricing: {
          baseRate: 129,
          currency: 'USD',
          inclusions: ['WiFi', 'Daily Housekeeping', 'Accessibility Support'],
          exclusions: ['Breakfast', 'Minibar'],
          taxRate: 0.12,
          serviceChargeRate: 0.08
        },
        availability: { totalRooms: 5, activeRooms: 5, outOfOrderRooms: 0 }
      }
    ];
  }

  async setupStaffStructure(propertyId: ObjectId, staffConfig: StaffConfiguration): Promise<{
    departmentsCreated: number;
    rolesCreated: number;
    policiesSet: number;
  }> {
    console.log('Setting up staff structure...');

    let departmentsCreated = 0;
    let rolesCreated = 0;

    for (const department of staffConfig.departments) {
      const departmentDoc = {
        _id: new ObjectId(),
        propertyId,
        name: department.name,
        description: department.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const deptResult = await this.db.collection('departments').insertOne(departmentDoc);
      departmentsCreated++;

      for (const role of department.roles) {
        const roleDoc = {
          _id: new ObjectId(),
          propertyId,
          departmentId: deptResult.insertedId,
          title: role.title,
          responsibilities: role.responsibilities,
          requiredSkills: role.requiredSkills,
          accessLevel: role.accessLevel,
          shiftTypes: role.shiftTypes,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.db.collection('staff_roles').insertOne(roleDoc);
        rolesCreated++;
      }
    }

    // Set up staff policies
    const policies = {
      _id: new ObjectId(),
      propertyId,
      workingHours: staffConfig.workingHours,
      policies: staffConfig.policies,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.collection('staff_policies').insertOne(policies);

    console.log(`Created ${departmentsCreated} departments, ${rolesCreated} roles, and staff policies`);

    return {
      departmentsCreated,
      rolesCreated,
      policiesSet: 1
    };
  }

  async createDefaultRooms(propertyId: ObjectId): Promise<number> {
    console.log('Creating default rooms...');

    const roomTypes = await this.db.collection('room_types').find({ propertyId }).toArray();
    let roomsCreated = 0;

    for (const roomType of roomTypes) {
      const roomCount = roomType.availability.totalRooms;

      for (let i = 1; i <= roomCount; i++) {
        const floorNumber = Math.ceil(i / 10);
        const roomNumber = floorNumber.toString().padStart(1, '0') + i.toString().padStart(2, '0');

        const room = {
          _id: new ObjectId(),
          propertyId,
          roomTypeId: roomType._id,
          number: roomNumber,
          type: roomType.category,
          status: 'available',
          floor: floorNumber,
          building: 'Main Building',
          section: this.getSectionFromFloor(floorNumber),
          capacity: roomType.maxOccupancy,
          dimensions: {
            area: this.getRoomArea(roomType.category),
            unit: 'sqft'
          },
          amenities: roomType.amenities.map((amenity: any) => ({
            type: amenity.type,
            name: amenity.name,
            included: amenity.included,
            condition: 'good'
          })),
          pricing: {
            baseRate: roomType.pricing.baseRate,
            currency: roomType.pricing.currency,
            seasonalRates: []
          },
          features: {
            view: this.getRoomView(floorNumber),
            balcony: roomType.amenities.some((a: any) => a.name.toLowerCase().includes('balcony')),
            smokingAllowed: false,
            petFriendly: false,
            accessible: roomType.category === 'accessible',
            connecting: false
          },
          housekeeping: {
            lastCleaned: new Date(),
            nextScheduled: this.getNextHousekeepingDate(),
            priority: 'medium',
            specialInstructions: []
          },
          maintenance: {
            lastInspection: new Date(),
            nextInspection: this.getNextMaintenanceDate(),
            issues: [],
            notes: ''
          },
          inventory: this.getDefaultInventory(roomType.category),
          booking: {},
          analytics: {
            occupancyHistory: [],
            maintenanceHistory: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.db.collection('rooms').insertOne(room);
        roomsCreated++;
      }
    }

    console.log(`Created ${roomsCreated} rooms`);
    return roomsCreated;
  }

  private getSectionFromFloor(floor: number): string {
    if (floor <= 2) return 'Ground Level';
    if (floor <= 5) return 'Mid Level';
    return 'Upper Level';
  }

  private getRoomArea(category: string): number {
    const areaMap: Record<string, number> = {
      'standard': 300,
      'deluxe': 400,
      'suite': 600,
      'family': 500,
      'accessible': 350
    };
    return areaMap[category] || 300;
  }

  private getRoomView(floor: number): string {
    if (floor >= 5) return 'City View';
    if (floor >= 3) return 'Partial View';
    return 'Standard View';
  }

  private getNextHousekeepingDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  }

  private getNextMaintenanceDate(): Date {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
  }

  private getDefaultInventory(category: string): Array<any> {
    const baseInventory = [
      { itemId: 'bed-sheets', name: 'Bed Sheets', category: 'linen', quantity: 2, condition: 'good' },
      { itemId: 'pillows', name: 'Pillows', category: 'linen', quantity: 4, condition: 'good' },
      { itemId: 'towels', name: 'Towels', category: 'linen', quantity: 4, condition: 'good' },
      { itemId: 'tv-remote', name: 'TV Remote', category: 'electronics', quantity: 1, condition: 'good' },
      { itemId: 'room-keys', name: 'Room Key Cards', category: 'security', quantity: 2, condition: 'good' }
    ];

    if (category === 'suite' || category === 'family') {
      baseInventory.push(
        { itemId: 'coffee-machine', name: 'Coffee Machine', category: 'appliances', quantity: 1, condition: 'good' },
        { itemId: 'mini-fridge', name: 'Mini Refrigerator', category: 'appliances', quantity: 1, condition: 'good' }
      );
    }

    return baseInventory.map(item => ({
      ...item,
      lastChecked: new Date()
    }));
  }

  async validatePropertySetup(propertyId: ObjectId): Promise<{
    isValid: boolean;
    issues: string[];
    completionPercentage: number;
    summary: {
      propertyConfigured: boolean;
      roomTypesSet: number;
      roomsCreated: number;
      staffStructureSet: boolean;
      facilitiesConfigured: number;
    };
  }> {
    const issues: string[] = [];

    // Check property configuration
    const property = await this.db.collection('properties').findOne({ _id: propertyId });
    if (!property) {
      issues.push('Property not found');
      return { isValid: false, issues, completionPercentage: 0, summary: {} as any };
    }

    // Check room types
    const roomTypesCount = await this.db.collection('room_types').countDocuments({ propertyId });
    if (roomTypesCount === 0) {
      issues.push('No room types configured');
    }

    // Check rooms
    const roomsCount = await this.db.collection('rooms').countDocuments({ propertyId });
    if (roomsCount === 0) {
      issues.push('No rooms created');
    }

    // Check staff structure
    const departmentsCount = await this.db.collection('departments').countDocuments({ propertyId });
    const rolesCount = await this.db.collection('staff_roles').countDocuments({ propertyId });
    const staffStructureSet = departmentsCount > 0 && rolesCount > 0;
    if (!staffStructureSet) {
      issues.push('Staff structure not configured');
    }

    // Check facilities
    const facilitiesCount = await this.db.collection('property_facilities').countDocuments({ propertyId });

    // Check operational configurations
    const configsCount = await this.db.collection('property_configurations').countDocuments({ propertyId });
    if (configsCount === 0) {
      issues.push('Operational configurations missing');
    }

    const completedItems = [
      property !== null,
      roomTypesCount > 0,
      roomsCount > 0,
      staffStructureSet,
      facilitiesCount > 0,
      configsCount > 0
    ].filter(Boolean).length;

    const completionPercentage = (completedItems / 6) * 100;

    return {
      isValid: issues.length === 0,
      issues,
      completionPercentage,
      summary: {
        propertyConfigured: property.setupCompleted || false,
        roomTypesSet: roomTypesCount,
        roomsCreated: roomsCount,
        staffStructureSet,
        facilitiesConfigured: facilitiesCount
      }
    };
  }

  async getDefaultStaffConfiguration(): Promise<StaffConfiguration> {
    return {
      departments: [
        {
          name: 'Front Office',
          description: 'Guest services and reception operations',
          roles: [
            {
              title: 'Front Desk Agent',
              responsibilities: ['Guest check-in/out', 'Reservations', 'Guest inquiries', 'Phone operations'],
              requiredSkills: ['customer_service', 'computer_skills', 'communication'],
              accessLevel: 'basic',
              shiftTypes: ['morning', 'afternoon', 'night']
            },
            {
              title: 'Front Office Supervisor',
              responsibilities: ['Staff supervision', 'Guest complaints', 'Revenue management', 'Reporting'],
              requiredSkills: ['leadership', 'problem_solving', 'revenue_management'],
              accessLevel: 'advanced',
              shiftTypes: ['morning', 'afternoon']
            }
          ]
        },
        {
          name: 'Housekeeping',
          description: 'Room cleaning and maintenance operations',
          roles: [
            {
              title: 'Room Attendant',
              responsibilities: ['Room cleaning', 'Inventory management', 'Guest requests', 'Quality standards'],
              requiredSkills: ['cleaning', 'attention_to_detail', 'time_management'],
              accessLevel: 'basic',
              shiftTypes: ['morning', 'afternoon']
            },
            {
              title: 'Housekeeping Supervisor',
              responsibilities: ['Team management', 'Quality control', 'Supply management', 'Scheduling'],
              requiredSkills: ['leadership', 'quality_control', 'inventory_management'],
              accessLevel: 'advanced',
              shiftTypes: ['morning']
            }
          ]
        },
        {
          name: 'Maintenance',
          description: 'Property maintenance and engineering',
          roles: [
            {
              title: 'Maintenance Technician',
              responsibilities: ['Preventive maintenance', 'Repairs', 'Equipment maintenance', 'Safety compliance'],
              requiredSkills: ['technical_skills', 'troubleshooting', 'safety_awareness'],
              accessLevel: 'basic',
              shiftTypes: ['morning', 'afternoon']
            },
            {
              title: 'Chief Engineer',
              responsibilities: ['Team leadership', 'System oversight', 'Vendor management', 'Budget planning'],
              requiredSkills: ['engineering', 'leadership', 'project_management'],
              accessLevel: 'manager',
              shiftTypes: ['morning']
            }
          ]
        },
        {
          name: 'Management',
          description: 'Executive and administrative operations',
          roles: [
            {
              title: 'General Manager',
              responsibilities: ['Overall operations', 'Strategic planning', 'Staff management', 'Financial oversight'],
              requiredSkills: ['leadership', 'strategic_thinking', 'financial_management'],
              accessLevel: 'admin',
              shiftTypes: ['morning', 'afternoon']
            },
            {
              title: 'Assistant Manager',
              responsibilities: ['Daily operations', 'Staff supervision', 'Guest relations', 'Reporting'],
              requiredSkills: ['management', 'communication', 'problem_solving'],
              accessLevel: 'manager',
              shiftTypes: ['morning', 'afternoon', 'evening']
            }
          ]
        }
      ],
      workingHours: {
        frontDesk: { start: '07:00', end: '23:00' },
        housekeeping: { start: '08:00', end: '17:00' },
        maintenance: { start: '07:00', end: '19:00' },
        management: { start: '08:00', end: '18:00' }
      },
      policies: {
        timeTracking: true,
        breakDuration: 30,
        overtimeRules: 'Time and a half after 40 hours per week',
        leavePolicy: 'Annual leave accrued at 2 days per month'
      }
    };
  }
}

export async function setupCompleteProperty(propertyData: PropertyData) {
  const integration = new PropertyManagementIntegration();
  await integration.initialize();

  try {
    // Setup property configuration
    const propertySetup = await integration.setupPropertyConfiguration(propertyData);
    console.log('Property setup completed:', propertySetup);

    // Setup staff structure
    const staffConfig = await integration.getDefaultStaffConfiguration();
    const staffSetup = await integration.setupStaffStructure(propertySetup.propertyId, staffConfig);
    console.log('Staff structure setup completed:', staffSetup);

    // Create default rooms
    const roomsCreated = await integration.createDefaultRooms(propertySetup.propertyId);
    console.log(`Created ${roomsCreated} rooms`);

    // Validate setup
    const validation = await integration.validatePropertySetup(propertySetup.propertyId);
    console.log('Setup validation:', validation);

    return {
      propertySetup,
      staffSetup,
      roomsCreated,
      validation
    };
  } catch (error) {
    console.error('Property setup failed:', error);
    throw error;
  }
}