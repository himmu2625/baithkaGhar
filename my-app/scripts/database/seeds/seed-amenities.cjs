// Quick script to seed some amenities for testing
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

async function seedAmenities() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('propertyamenities');

    // Use a common property ID for testing
    const testPropertyId = '6862744d156cefeb1eb177a4';

    const sampleAmenities = [
      {
        propertyId: testPropertyId,
        amenityName: 'Free WiFi',
        amenityType: 'basic',
        category: 'room',
        description: 'High-speed wireless internet access throughout the property',
        isAvailable: true,
        hasAdditionalCost: false,
        icon: 'wifi',
        displayOrder: 1,
        isHighlight: true,
        verificationRequired: false,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        propertyId: testPropertyId,
        amenityName: 'Swimming Pool',
        amenityType: 'premium',
        category: 'property',
        description: 'Outdoor swimming pool with lounging area',
        isAvailable: true,
        hasAdditionalCost: false,
        icon: 'waves',
        displayOrder: 2,
        isHighlight: true,
        verificationRequired: false,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        propertyId: testPropertyId,
        amenityName: 'Airport Shuttle',
        amenityType: 'premium',
        category: 'service',
        description: 'Complimentary shuttle service to and from the airport',
        isAvailable: true,
        hasAdditionalCost: true,
        additionalCost: 500,
        costType: 'per_use',
        icon: 'car',
        displayOrder: 3,
        isHighlight: false,
        verificationRequired: false,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing amenities for this property
    await collection.deleteMany({ propertyId: testPropertyId });

    // Insert sample amenities
    const result = await collection.insertMany(sampleAmenities);
    console.log(`✅ Inserted ${result.insertedCount} amenities for property ${testPropertyId}`);

    // Verify insertion
    const count = await collection.countDocuments({ propertyId: testPropertyId });
    console.log(`📊 Total amenities for property: ${count}`);

  } catch (error) {
    console.error('❌ Error seeding amenities:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  seedAmenities();
}

module.exports = { seedAmenities };