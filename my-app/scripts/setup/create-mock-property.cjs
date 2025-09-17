#!/usr/bin/env node

/**
 * 🏨 Mock Property Creator for OS Development Testing
 *
 * Creates a comprehensive test property with:
 * - Mock property data
 * - Test users with different roles
 * - Sample rooms, amenities, facilities
 * - Mock bookings and F&B data
 * - Complete inventory setup
 *
 * Usage: node scripts/setup/create-mock-property.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
require('../../lib/db/dbConnect');
const Property = require('../../models/Property');
const User = require('../../models/User');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');

// Mock data generators
const generateMockProperty = () => ({
  title: "🧪 DEV TEST HOTEL - Demo Property",
  name: "DEV TEST HOTEL - Demo Property",
  description: "Complete test property for OS development and feature testing. Includes all modules: inventory, F&B, housekeeping, analytics.",

  // Location data
  location: {
    address: "123 Developer Street, Test City, TC 12345",
    city: "Test City",
    state: "Test State",
    country: "Test Country",
    pincode: "12345",
    coordinates: [77.2090, 28.6139] // Delhi coordinates
  },

  // Contact information
  contactNumber: "+91-9999-TEST-01",
  email: "dev-test@baithakaghar.com",
  website: "https://dev-test.baithakaghar.com",

  // Property details
  propertyType: "hotel",
  starRating: 4,
  totalHotelRooms: "50",

  // Property units (room types)
  propertyUnits: [
    {
      unitType: "Standard Room",
      count: 20,
      basePrice: 2500,
      description: "Comfortable standard rooms with modern amenities"
    },
    {
      unitType: "Deluxe Room",
      count: 15,
      basePrice: 3500,
      description: "Spacious deluxe rooms with premium features"
    },
    {
      unitType: "Suite",
      count: 10,
      basePrice: 5500,
      description: "Luxury suites with separate living area"
    },
    {
      unitType: "Presidential Suite",
      count: 5,
      basePrice: 8500,
      description: "Ultimate luxury presidential suites"
    }
  ],

  // Amenities
  amenities: [
    "wifi", "ac", "tv", "minibar", "room_service", "laundry",
    "swimming_pool", "gym", "spa", "restaurant", "bar", "parking",
    "conference_room", "business_center", "concierge", "24x7_reception",
    "elevator", "garden", "terrace", "kitchen", "balcony", "jacuzzi"
  ],

  // Facilities
  facilities: [
    {
      name: "Main Restaurant",
      type: "dining",
      capacity: 80,
      operatingHours: "6:00 AM - 11:00 PM",
      status: "operational"
    },
    {
      name: "Rooftop Bar",
      type: "bar",
      capacity: 40,
      operatingHours: "5:00 PM - 1:00 AM",
      status: "operational"
    },
    {
      name: "Swimming Pool",
      type: "recreation",
      capacity: 30,
      operatingHours: "6:00 AM - 10:00 PM",
      status: "operational"
    },
    {
      name: "Fitness Center",
      type: "fitness",
      capacity: 15,
      operatingHours: "24/7",
      status: "operational"
    },
    {
      name: "Conference Hall A",
      type: "business",
      capacity: 100,
      operatingHours: "9:00 AM - 9:00 PM",
      status: "operational"
    },
    {
      name: "Spa & Wellness",
      type: "wellness",
      capacity: 8,
      operatingHours: "10:00 AM - 8:00 PM",
      status: "operational"
    }
  ],

  // Business details
  isActive: true,
  isVerified: true,
  verificationStatus: "approved",

  // Test property identifiers
  tags: ["test", "development", "demo", "mock"],

  // Pricing
  pricing: {
    basePrice: 2500,
    currency: "INR",
    taxRate: 18,
    serviceCharge: 10
  },

  // Policies
  policies: {
    checkIn: "2:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Free cancellation up to 24 hours before check-in",
    petPolicy: "Pets allowed with prior notice",
    smokingPolicy: "Smoking allowed in designated areas only"
  },

  // Images (placeholder URLs)
  images: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600"
  ],

  // SEO and metadata
  slug: "dev-test-hotel-demo-property",
  metaTitle: "DEV TEST HOTEL - Complete OS Testing Environment",
  metaDescription: "Comprehensive test property for Baithaka GHAR OS development and feature testing.",

  createdAt: new Date(),
  updatedAt: new Date()
});

const generateTestUsers = (propertyId) => [
  {
    name: "Dev Admin",
    email: "dev-admin@test.com",
    password: "DevTest@123",
    phone: "+91-9999-000-001",
    role: "admin",
    isAdmin: true,
    propertyId: propertyId,
    profileComplete: true,
    permissions: ["all"],
    isSpam: false
  },
  {
    name: "Test Manager",
    email: "test-manager@test.com",
    password: "TestManager@123",
    phone: "+91-9999-000-002",
    role: "admin",
    isAdmin: true,
    propertyId: propertyId,
    profileComplete: true,
    permissions: ["inventory", "fb", "housekeeping", "analytics"],
    isSpam: false
  },
  {
    name: "Demo Staff",
    email: "demo-staff@test.com",
    password: "DemoStaff@123",
    phone: "+91-9999-000-003",
    role: "user",
    isAdmin: false,
    propertyId: propertyId,
    profileComplete: true,
    permissions: ["inventory", "housekeeping"],
    isSpam: false
  },
  {
    name: "Test Guest",
    email: "test-guest@test.com",
    password: "TestGuest@123",
    phone: "+91-9999-000-004",
    role: "user",
    isAdmin: false,
    propertyId: propertyId,
    profileComplete: true,
    permissions: [],
    isSpam: false
  }
];

const generateMockRooms = (propertyId) => {
  const rooms = [];
  const roomTypes = ["Standard Room", "Deluxe Room", "Suite", "Presidential Suite"];
  const floors = [1, 2, 3, 4, 5];
  const statuses = ["available", "occupied", "maintenance", "cleaning"];

  for (let i = 101; i <= 150; i++) {
    const floor = Math.floor(i / 100);
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    rooms.push({
      propertyId: propertyId,
      roomNumber: i.toString(),
      roomType: roomType,
      floor: floor,
      status: status,
      capacity: roomType === "Presidential Suite" ? 4 : roomType === "Suite" ? 3 : 2,
      basePrice: roomType === "Presidential Suite" ? 8500 :
                 roomType === "Suite" ? 5500 :
                 roomType === "Deluxe Room" ? 3500 : 2500,
      amenities: ["wifi", "ac", "tv", "minibar"],
      description: `${roomType} on floor ${floor}`,
      isActive: true,
      lastCleaned: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return rooms;
};

const generateMockBookings = (propertyId, rooms) => {
  const bookings = [];
  const statuses = ["confirmed", "checked_in", "checked_out", "cancelled"];

  for (let i = 0; i < 25; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const checkIn = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + (1 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000);

    bookings.push({
      propertyId: propertyId,
      roomId: room._id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,

      // Guest details
      guestName: `Test Guest ${i + 1}`,
      guestEmail: `guest${i + 1}@test.com`,
      guestPhone: `+91-9999-${String(i + 1).padStart(3, '0')}-000`,

      // Booking details
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 1 + Math.floor(Math.random() * 3),
      numberOfNights: Math.ceil((checkOut - checkIn) / (24 * 60 * 60 * 1000)),

      // Pricing
      basePrice: room.basePrice,
      totalAmount: room.basePrice * Math.ceil((checkOut - checkIn) / (24 * 60 * 60 * 1000)),
      taxes: room.basePrice * 0.18,

      // Status
      status: status,
      paymentStatus: status === "cancelled" ? "refunded" : "paid",

      // Metadata
      bookingSource: "direct",
      specialRequests: "Test booking for development",
      createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }

  return bookings;
};

async function createMockProperty() {
  try {
    console.log('🚀 Starting mock property creation...');

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baithaka-ghar');
    }

    console.log('✅ Connected to MongoDB');

    // 1. Create mock property
    console.log('📋 Creating mock property...');
    const propertyData = generateMockProperty();
    const property = new Property(propertyData);
    await property.save();

    console.log(`✅ Mock property created with ID: ${property._id}`);

    // 2. Create test users
    console.log('👥 Creating test users...');
    const testUsers = generateTestUsers(property._id);

    for (const userData of testUsers) {
      // Hash password
      userData.password = await bcrypt.hash(userData.password, 12);

      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    // 3. Create mock rooms
    console.log('🏠 Creating mock rooms...');
    const roomsData = generateMockRooms(property._id);
    const rooms = await Room.insertMany(roomsData);
    console.log(`✅ Created ${rooms.length} mock rooms`);

    // 4. Create mock bookings
    console.log('📅 Creating mock bookings...');
    const bookingsData = generateMockBookings(property._id, rooms);
    await Booking.insertMany(bookingsData);
    console.log(`✅ Created ${bookingsData.length} mock bookings`);

    // 5. Generate access information
    console.log('\n🎯 MOCK PROPERTY SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n📋 PROPERTY INFORMATION:');
    console.log(`Property ID: ${property._id}`);
    console.log(`Property Name: ${property.name}`);
    console.log(`Total Rooms: ${rooms.length}`);
    console.log(`Total Bookings: ${bookingsData.length}`);

    console.log('\n👥 TEST USER CREDENTIALS:');
    console.log('Admin User:');
    console.log('  Email: dev-admin@test.com');
    console.log('  Password: DevTest@123');
    console.log('  Role: Admin (Full Access)');

    console.log('\nManager User:');
    console.log('  Email: test-manager@test.com');
    console.log('  Password: TestManager@123');
    console.log('  Role: Manager (Limited Access)');

    console.log('\nStaff User:');
    console.log('  Email: demo-staff@test.com');
    console.log('  Password: DemoStaff@123');
    console.log('  Role: Staff (Basic Access)');

    console.log('\n🔗 DIRECT ACCESS URLS:');
    console.log(`Inventory Dashboard: /os/inventory/dashboard/${property._id}`);
    console.log(`Amenities Management: /os/inventory/amenities/${property._id}`);
    console.log(`Room Management: /os/inventory/rooms/${property._id}`);
    console.log(`F&B Dashboard: /os/fb/dashboard/${property._id}`);
    console.log(`Housekeeping: /os/inventory/housekeeping/${property._id}`);
    console.log(`Analytics: /os/inventory/analytics/${property._id}`);

    console.log('\n📊 FEATURES TO TEST:');
    console.log('✅ Complete Inventory Management');
    console.log('✅ Room & Amenity Management');
    console.log('✅ F&B Operations');
    console.log('✅ Housekeeping Tasks');
    console.log('✅ Analytics & Reporting');
    console.log('✅ Multi-user Role Testing');
    console.log('✅ Booking Management');

    console.log('\n🛡️  SECURITY NOTE:');
    console.log('This is a DEVELOPMENT-ONLY test property.');
    console.log('Do not use these credentials in production!');

    console.log('\n' + '=' .repeat(60));

  } catch (error) {
    console.error('❌ Error creating mock property:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createMockProperty()
    .then(() => {
      console.log('🎉 Mock property setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create mock property:', error);
      process.exit(1);
    });
}

module.exports = { createMockProperty, generateMockProperty, generateTestUsers };