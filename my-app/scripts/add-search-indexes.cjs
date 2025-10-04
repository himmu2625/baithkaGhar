const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not defined');
  process.exit(1);
}

async function addSearchIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const propertiesCollection = db.collection('properties');

    console.log('\n📊 Creating search indexes...');

    // Index for plan type filtering
    await propertiesCollection.createIndex(
      { 'propertyUnits.planBasedPricing.planType': 1 },
      { name: 'plan_type_search' }
    );
    console.log('✅ Created index: plan_type_search');

    // Index for occupancy type filtering
    await propertiesCollection.createIndex(
      { 'propertyUnits.planBasedPricing.occupancyType': 1 },
      { name: 'occupancy_type_search' }
    );
    console.log('✅ Created index: occupancy_type_search');

    // Index for price filtering
    await propertiesCollection.createIndex(
      { 'propertyUnits.planBasedPricing.price': 1 },
      { name: 'plan_price_search' }
    );
    console.log('✅ Created index: plan_price_search');

    // Compound index for combined searches
    await propertiesCollection.createIndex(
      {
        'propertyUnits.planBasedPricing.planType': 1,
        'propertyUnits.planBasedPricing.occupancyType': 1,
        'propertyUnits.planBasedPricing.price': 1
      },
      { name: 'plan_occupancy_price_search' }
    );
    console.log('✅ Created compound index: plan_occupancy_price_search');

    // Index for status and verification
    await propertiesCollection.createIndex(
      {
        status: 1,
        isPublished: 1,
        verificationStatus: 1
      },
      { name: 'property_status_search' }
    );
    console.log('✅ Created index: property_status_search');

    console.log('\n📋 Listing all indexes:');
    const indexes = await propertiesCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ All search indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addSearchIndexes();
