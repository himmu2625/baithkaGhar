const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function addPerformanceIndexes() {
  console.log('🔌 Connecting to MongoDB...')
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db()

  console.log('📊 Adding performance indexes...\n')

  try {
    // Properties indexes
    console.log('Creating indexes for properties collection...')
    await db.collection('properties').createIndexes([
      { key: { 'address.city': 1, isActive: 1 }, name: 'idx_city_active' },
      { key: { propertyType: 1, isActive: 1 }, name: 'idx_type_active' },
      { key: { 'address.city': 1, propertyType: 1, isActive: 1 }, name: 'idx_city_type_active' },
      { key: { createdAt: -1 }, name: 'idx_created_desc' },
      { key: { ownerId: 1, isActive: 1 }, name: 'idx_owner_active' },
      { key: { verificationStatus: 1 }, name: 'idx_verification_status' },
    ])
    console.log('✅ Properties indexes created')

    // Bookings indexes
    console.log('Creating indexes for bookings collection...')
    await db.collection('bookings').createIndexes([
      { key: { propertyId: 1, status: 1 }, name: 'idx_property_status' },
      { key: { userId: 1, createdAt: -1 }, name: 'idx_user_created' },
      { key: { dateFrom: 1, dateTo: 1 }, name: 'idx_date_range' },
      { key: { status: 1, createdAt: -1 }, name: 'idx_status_created' },
      { key: { planType: 1, occupancyType: 1 }, name: 'idx_plan_occupancy' },
      { key: { propertyId: 1, dateFrom: 1, dateTo: 1 }, name: 'idx_property_dates' },
      { key: { roomCategory: 1, planType: 1 }, name: 'idx_category_plan' },
    ])
    console.log('✅ Bookings indexes created')

    // Users indexes
    console.log('Creating indexes for users collection...')
    const existingIndexes = await db.collection('users').indexes()
    const emailIndexExists = existingIndexes.some(idx => idx.name === 'email_1' || idx.key?.email)

    if (!emailIndexExists) {
      await db.collection('users').createIndex(
        { email: 1 },
        { name: 'idx_email_unique', unique: true }
      )
    }

    await db.collection('users').createIndexes([
      { key: { role: 1 }, name: 'idx_role' },
      { key: { createdAt: -1 }, name: 'idx_created_desc' },
    ])
    console.log('✅ Users indexes created')

    // Cities indexes
    console.log('Creating indexes for cities collection...')
    await db.collection('cities').createIndexes([
      { key: { name: 1 }, name: 'idx_name' },
      { key: { propertyCount: -1 }, name: 'idx_property_count_desc' },
      { key: { featured: 1, propertyCount: -1 }, name: 'idx_featured_count' },
    ])
    console.log('✅ Cities indexes created')

    // Reviews indexes (if collection exists)
    const collections = await db.listCollections().toArray()
    if (collections.some(c => c.name === 'reviews')) {
      console.log('Creating indexes for reviews collection...')
      await db.collection('reviews').createIndexes([
        { key: { propertyId: 1, status: 1 }, name: 'idx_property_status' },
        { key: { userId: 1, createdAt: -1 }, name: 'idx_user_created' },
        { key: { rating: -1 }, name: 'idx_rating_desc' },
      ])
      console.log('✅ Reviews indexes created')
    }

    // List all indexes
    console.log('\n📋 Index Summary:')
    const collections_to_check = ['properties', 'bookings', 'users', 'cities']
    for (const collName of collections_to_check) {
      const indexes = await db.collection(collName).indexes()
      console.log(`\n${collName}:`)
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`)
      })
    }

    console.log('\n✨ All performance indexes added successfully!')
  } catch (error) {
    console.error('❌ Error adding indexes:', error)
  } finally {
    await client.close()
    console.log('\n🔌 Connection closed')
  }
}

addPerformanceIndexes().catch(console.error)
