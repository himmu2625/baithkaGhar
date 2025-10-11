const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function migratePricingType() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Check current state
    const totalCount = await PropertyPricing.countDocuments({})
    const withType = await PropertyPricing.countDocuments({ pricingType: { $exists: true } })
    const withoutType = totalCount - withType

    console.log('\n📊 Current State:')
    console.log(`   Total pricing entries: ${totalCount}`)
    console.log(`   With pricingType: ${withType}`)
    console.log(`   Without pricingType: ${withoutType}`)

    if (withoutType === 0) {
      console.log('\n✅ All entries already have pricingType field')
      return
    }

    // Add pricingType field to all existing entries
    console.log('\n🔄 Adding pricingType field to existing entries...')
    const result = await PropertyPricing.updateMany(
      { pricingType: { $exists: false } },
      {
        $set: {
          pricingType: "BASE",
          reason: "Base pricing",
          updatedAt: new Date()
        }
      }
    )

    console.log(`✅ Updated ${result.modifiedCount} entries`)

    // Create indexes for performance
    console.log('\n📇 Creating indexes...')

    try {
      await PropertyPricing.createIndex({
        propertyId: 1,
        roomCategory: 1,
        planType: 1,
        occupancyType: 1,
        pricingType: 1,
        startDate: 1,
        endDate: 1
      })
      console.log('✅ Created compound index')
    } catch (error) {
      console.log('ℹ️  Index may already exist:', error.message)
    }

    try {
      await PropertyPricing.createIndex({
        propertyId: 1,
        pricingType: 1,
        startDate: 1,
        endDate: 1
      })
      console.log('✅ Created date range index')
    } catch (error) {
      console.log('ℹ️  Index may already exist:', error.message)
    }

    // Verify
    const afterUpdate = await PropertyPricing.countDocuments({ pricingType: { $exists: true } })
    console.log('\n✅ VERIFICATION:')
    console.log(`   Entries with pricingType: ${afterUpdate}/${totalCount}`)

    // Show sample entries
    const samples = await PropertyPricing.find({}).limit(3).toArray()
    console.log('\n📋 Sample Entries:')
    samples.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.roomCategory} - ${entry.planType} - ${entry.occupancyType}`)
      console.log(`      Price: ₹${entry.price}`)
      console.log(`      Type: ${entry.pricingType}`)
      console.log(`      Dates: ${entry.startDate?.toISOString().split('T')[0]} to ${entry.endDate?.toISOString().split('T')[0]}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

migratePricingType()
  .then(() => {
    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
