#!/usr/bin/env node

/**
 * 🏨 Working Mock Property Creator for OS Development Testing
 * Fixed version that works with the current project structure
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithakaGharDB';

// Simple mongoose schemas (no TypeScript)
const PropertySchema = new mongoose.Schema({
  title: String,
  name: String,
  description: String,
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    coordinates: [Number]
  },
  contactNumber: String,
  email: String,
  website: String,
  propertyType: String,
  starRating: Number,
  totalHotelRooms: String,
  propertyUnits: [mongoose.Schema.Types.Mixed],
  amenities: [String],
  facilities: [mongoose.Schema.Types.Mixed],
  isActive: Boolean,
  isVerified: Boolean,
  verificationStatus: String,
  tags: [String],
  pricing: mongoose.Schema.Types.Mixed,
  policies: mongoose.Schema.Types.Mixed,
  images: [String],
  slug: String,
  metaTitle: String,
  metaDescription: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  isAdmin: Boolean,
  propertyId: mongoose.Schema.Types.ObjectId,
  profileComplete: Boolean,
  permissions: [String],
  isSpam: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomNumber: String,
  roomType: String,
  floor: Number,
  status: String,
  capacity: Number,
  basePrice: Number,
  amenities: [String],
  description: String,
  isActive: Boolean,
  lastCleaned: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Property = mongoose.model('Property', PropertySchema);
const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);

// Mock data generators
const generateMockProperty = () => ({
  title: "🧪 DEV TEST HOTEL - Demo Property",
  name: "DEV TEST HOTEL - Demo Property",
  description: "Complete test property for OS development and feature testing. Includes all modules: inventory, F&B, housekeeping, analytics.",

  location: {
    address: "123 Developer Street, Test City, TC 12345",
    city: "Test City",
    state: "Test State",
    country: "Test Country",
    pincode: "12345",
    coordinates: [77.2090, 28.6139]
  },

  contactNumber: "+91-9999-TEST-01",
  email: "dev-test@baithakaghar.com",
  website: "https://dev-test.baithakaghar.com",

  propertyType: "hotel",
  starRating: 4,
  totalHotelRooms: "50",

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
    }
  ],

  amenities: [
    "wifi", "ac", "tv", "minibar", "room_service", "laundry",
    "swimming_pool", "gym", "spa", "restaurant", "bar", "parking"
  ],

  facilities: [
    {
      name: "Main Restaurant",
      type: "dining",
      capacity: 80,
      operatingHours: "6:00 AM - 11:00 PM",
      status: "operational"
    },
    {
      name: "Swimming Pool",
      type: "recreation",
      capacity: 30,
      operatingHours: "6:00 AM - 10:00 PM",
      status: "operational"
    }
  ],

  isActive: true,
  isVerified: true,
  verificationStatus: "approved",
  tags: ["test", "development", "demo", "mock"],

  pricing: {
    basePrice: 2500,
    currency: "INR",
    taxRate: 18,
    serviceCharge: 10
  },

  policies: {
    checkIn: "2:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Free cancellation up to 24 hours before check-in"
  },

  images: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600"
  ],

  slug: "dev-test-hotel-demo-property",
  metaTitle: "DEV TEST HOTEL - Complete OS Testing Environment",
  metaDescription: "Comprehensive test property for Baithaka GHAR OS development and feature testing."
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
  }
];

const generateMockRooms = (propertyId) => {
  const rooms = [];
  const roomTypes = ["Standard Room", "Deluxe Room", "Suite"];

  for (let i = 101; i <= 120; i++) {
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];

    rooms.push({
      propertyId: propertyId,
      roomNumber: i.toString(),
      roomType: roomType,
      floor: Math.floor(i / 100),
      status: "available",
      capacity: roomType === "Suite" ? 3 : 2,
      basePrice: roomType === "Suite" ? 5500 : roomType === "Deluxe Room" ? 3500 : 2500,
      amenities: ["wifi", "ac", "tv", "minibar"],
      description: `${roomType} on floor ${Math.floor(i / 100)}`,
      isActive: true,
      lastCleaned: new Date()
    });
  }

  return rooms;
};

async function createMockProperty() {
  try {
    console.log('🚀 Starting mock property creation...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing test data (optional)
    console.log('🧹 Cleaning existing test data...');
    await Property.deleteMany({ tags: "test" });
    await User.deleteMany({ email: /test\.com$/ });
    await Room.deleteMany({ roomNumber: /^1[0-2][0-9]$/ });

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

    // 5. Generate access information
    console.log('\n🎯 MOCK PROPERTY SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n📋 PROPERTY INFORMATION:');
    console.log(`Property ID: ${property._id}`);
    console.log(`Property Name: ${property.name}`);
    console.log(`Total Rooms: ${rooms.length}`);

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
    console.log(`OS Login: /os/login`);
    console.log(`Dashboard: /os/dashboard/${property._id}`);
    console.log(`Inventory: /os/inventory/dashboard/${property._id}`);
    console.log(`F&B: /os/fb/dashboard/${property._id}`);

    console.log('\n🛡️  SECURITY NOTE:');
    console.log('This is a DEVELOPMENT-ONLY test property.');
    console.log('Do not use these credentials in production!');

    console.log('\n' + '=' .repeat(60));
    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error creating mock property:', error);
    await mongoose.disconnect();
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

module.exports = { createMockProperty };