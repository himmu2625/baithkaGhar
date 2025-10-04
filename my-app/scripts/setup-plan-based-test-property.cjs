const { MongoClient } = require('mongodb');

// MongoDB connection string - use environment variable or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/baithaka-ghar';

// Test property data with comprehensive plan-based pricing
const testPropertyData = {
  title: "Plan-Based Pricing Test Property",
  name: "Grand Himalayan Resort & Spa",
  description: "A luxury resort in the Himalayas with comprehensive meal plans and occupancy options. Perfect for testing the plan-based pricing system.",
  propertyType: "resort",

  address: {
    street: "Mountain View Road",
    city: "Shimla",
    state: "Himachal Pradesh",
    zipCode: "171001",
    country: "India"
  },

  // Contact details
  contactDetails: {
    phone: "+91 9876543210",
    email: "bookings@grandhimalayan.com",
    website: "https://grandhimalayan.com"
  },

  // Property units with complete plan-based pricing
  propertyUnits: [
    {
      unitTypeName: "Deluxe Room",
      unitTypeCode: "DELUXE",
      count: 10,
      pricing: {
        price: "5000",
        pricePerWeek: "30000",
        pricePerMonth: "120000"
      },
      planBasedPricing: [
        // EP - Room Only
        { planType: "EP", occupancyType: "SINGLE", price: 4000 },
        { planType: "EP", occupancyType: "DOUBLE", price: 5000 },
        { planType: "EP", occupancyType: "TRIPLE", price: 6500 },
        { planType: "EP", occupancyType: "QUAD", price: 8000 },

        // CP - Room + Breakfast
        { planType: "CP", occupancyType: "SINGLE", price: 5000 },
        { planType: "CP", occupancyType: "DOUBLE", price: 6500 },
        { planType: "CP", occupancyType: "TRIPLE", price: 8000 },
        { planType: "CP", occupancyType: "QUAD", price: 9500 },

        // MAP - Room + Breakfast + 1 Meal
        { planType: "MAP", occupancyType: "SINGLE", price: 6500 },
        { planType: "MAP", occupancyType: "DOUBLE", price: 8500 },
        { planType: "MAP", occupancyType: "TRIPLE", price: 10500 },
        { planType: "MAP", occupancyType: "QUAD", price: 12500 },

        // AP - All Meals
        { planType: "AP", occupancyType: "SINGLE", price: 8000 },
        { planType: "AP", occupancyType: "DOUBLE", price: 10500 },
        { planType: "AP", occupancyType: "TRIPLE", price: 13000 },
        { planType: "AP", occupancyType: "QUAD", price: 15500 }
      ],
      roomNumbers: [
        { number: "D101", status: "available" },
        { number: "D102", status: "available" },
        { number: "D103", status: "available" },
        { number: "D104", status: "available" },
        { number: "D105", status: "available" }
      ]
    },
    {
      unitTypeName: "Suite",
      unitTypeCode: "SUITE",
      count: 5,
      pricing: {
        price: "10000",
        pricePerWeek: "60000",
        pricePerMonth: "240000"
      },
      planBasedPricing: [
        // EP - Room Only
        { planType: "EP", occupancyType: "SINGLE", price: 8000 },
        { planType: "EP", occupancyType: "DOUBLE", price: 10000 },
        { planType: "EP", occupancyType: "TRIPLE", price: 12500 },
        { planType: "EP", occupancyType: "QUAD", price: 15000 },

        // CP - Room + Breakfast
        { planType: "CP", occupancyType: "SINGLE", price: 10000 },
        { planType: "CP", occupancyType: "DOUBLE", price: 12500 },
        { planType: "CP", occupancyType: "TRIPLE", price: 15000 },
        { planType: "CP", occupancyType: "QUAD", price: 17500 },

        // MAP - Room + Breakfast + 1 Meal
        { planType: "MAP", occupancyType: "SINGLE", price: 12500 },
        { planType: "MAP", occupancyType: "DOUBLE", price: 16000 },
        { planType: "MAP", occupancyType: "TRIPLE", price: 19500 },
        { planType: "MAP", occupancyType: "QUAD", price: 23000 },

        // AP - All Meals
        { planType: "AP", occupancyType: "SINGLE", price: 15000 },
        { planType: "AP", occupancyType: "DOUBLE", price: 19500 },
        { planType: "AP", occupancyType: "TRIPLE", price: 24000 },
        { planType: "AP", occupancyType: "QUAD", price: 28500 }
      ],
      roomNumbers: [
        { number: "S201", status: "available" },
        { number: "S202", status: "available" },
        { number: "S203", status: "available" }
      ]
    },
    {
      unitTypeName: "Standard Room",
      unitTypeCode: "STANDARD",
      count: 15,
      pricing: {
        price: "3000",
        pricePerWeek: "18000",
        pricePerMonth: "72000"
      },
      planBasedPricing: [
        // EP - Room Only
        { planType: "EP", occupancyType: "SINGLE", price: 2500 },
        { planType: "EP", occupancyType: "DOUBLE", price: 3000 },
        { planType: "EP", occupancyType: "TRIPLE", price: 4000 },
        { planType: "EP", occupancyType: "QUAD", price: 5000 },

        // CP - Room + Breakfast
        { planType: "CP", occupancyType: "SINGLE", price: 3500 },
        { planType: "CP", occupancyType: "DOUBLE", price: 4500 },
        { planType: "CP", occupancyType: "TRIPLE", price: 5500 },
        { planType: "CP", occupancyType: "QUAD", price: 6500 },

        // MAP - Room + Breakfast + 1 Meal
        { planType: "MAP", occupancyType: "SINGLE", price: 4500 },
        { planType: "MAP", occupancyType: "DOUBLE", price: 6000 },
        { planType: "MAP", occupancyType: "TRIPLE", price: 7500 },
        { planType: "MAP", occupancyType: "QUAD", price: 9000 },

        // AP - All Meals
        { planType: "AP", occupancyType: "SINGLE", price: 5500 },
        { planType: "AP", occupancyType: "DOUBLE", price: 7500 },
        { planType: "AP", occupancyType: "TRIPLE", price: 9500 },
        { planType: "AP", occupancyType: "QUAD", price: 11500 }
      ],
      roomNumbers: [
        { number: "101", status: "available" },
        { number: "102", status: "available" },
        { number: "103", status: "available" },
        { number: "104", status: "available" },
        { number: "105", status: "available" }
      ]
    }
  ],

  // Amenities
  amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service", "Parking"],

  // Rules
  rules: [
    "Check-in: 2:00 PM",
    "Check-out: 11:00 AM",
    "No smoking in rooms",
    "Pets allowed with prior approval",
    "Children welcome"
  ],

  // Basic info
  bedrooms: 30,
  bathrooms: 30,
  maxGuests: 120,
  rating: 4.5,
  reviewCount: 127,

  // Pricing
  price: {
    base: 2500,
    currency: "INR"
  },

  // Images (placeholder)
  categorizedImages: [
    {
      category: "exterior",
      files: [
        { url: "https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=Exterior+View", public_id: "test_exterior_1" }
      ]
    },
    {
      category: "interior",
      files: [
        { url: "https://via.placeholder.com/800x600/2196F3/FFFFFF?text=Interior+View", public_id: "test_interior_1" }
      ]
    }
  ],

  // Status
  isApproved: true,
  isActive: true,
  hidePrices: false,

  // Timestamps
  createdAt: new Date(),
  updatedAt: new Date()
};

async function setupTestProperty() {
  let client;

  try {
    console.log('🔌 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    console.log('✅ Connected successfully');

    // Check if test property already exists
    const existingProperty = await db.collection('properties').findOne({
      title: testPropertyData.title
    });

    if (existingProperty) {
      console.log('⚠️  Test property already exists. Updating...');

      const result = await db.collection('properties').updateOne(
        { _id: existingProperty._id },
        { $set: testPropertyData }
      );

      console.log('✅ Test property updated successfully!');
      console.log('   Property ID:', existingProperty._id.toString());
    } else {
      console.log('➕ Creating new test property...');

      const result = await db.collection('properties').insertOne(testPropertyData);

      console.log('✅ Test property created successfully!');
      console.log('   Property ID:', result.insertedId.toString());
    }

    console.log('\n📊 Plan-Based Pricing Summary:');
    console.log('   - 3 Room Categories (Standard, Deluxe, Suite)');
    console.log('   - 4 Meal Plans (EP, CP, MAP, AP)');
    console.log('   - 4 Occupancy Types (Single, Double, Triple, Quad)');
    console.log('   - Total 48 pricing combinations (3 × 4 × 4)');
    console.log('\n💰 Price Range:');
    console.log('   - Lowest:  ₹2,500/night (Standard EP Single)');
    console.log('   - Highest: ₹28,500/night (Suite AP Quad)');

    console.log('\n🏨 Property Details:');
    console.log('   - Location: Shimla, Himachal Pradesh');
    console.log('   - Total Rooms: 30 (15 Standard + 10 Deluxe + 5 Suite)');
    console.log('   - Max Capacity: 120 guests');

    console.log('\n✨ Next Steps:');
    console.log('   1. Visit the property page to see the pricing matrix');
    console.log('   2. Try booking with different plan and occupancy combinations');
    console.log('   3. Check the plan-based revenue analytics dashboard');
    console.log('   4. Generate invoices to see plan details');

  } catch (error) {
    console.error('❌ Error setting up test property:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Connection closed');
    }
  }
}

// Run the setup
setupTestProperty().catch(console.error);
