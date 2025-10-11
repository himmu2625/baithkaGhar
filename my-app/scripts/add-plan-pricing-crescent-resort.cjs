const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function addPlanPricingForCrescentResort() {
  try {
    // Connect to the test database
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')
    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Find BAITHAKA GHAR CRESCENT RESORT
    const property = await Property.findOne({
      title: 'BAITHAKA GHAR CRESCENT RESORT'
    })

    if (!property) {
      console.log('❌ Property not found')
      process.exit(1)
    }

    console.log(`\n✅ Found property: ${property.title}`)
    console.log(`   Property ID: ${property._id}`)

    // Get property units (room categories)
    const roomCategories = property.propertyUnits || []
    console.log(`\n📋 Room Categories: ${roomCategories.length}`)
    roomCategories.forEach((unit, idx) => {
      console.log(`   ${idx + 1}. ${unit.unitTypeName} (Code: ${unit.unitTypeCode})`)
    })

    // Define plan types
    const planTypes = ['EP', 'CP', 'MAP', 'AP']
    const occupancyTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']

    // Create pricing entries for each combination
    const pricingEntries = []
    const basePrice = 7400

    // For each room category
    for (const roomUnit of roomCategories) {
      const roomCategory = roomUnit.unitTypeCode

      // For each plan type
      for (const planType of planTypes) {
        // For each occupancy type
        for (const occupancyType of occupancyTypes) {
          pricingEntries.push({
            propertyId: property._id.toString(),
            roomCategory: roomCategory,
            planType: planType,
            occupancyType: occupancyType,
            price: basePrice,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2026-12-31'),
            seasonType: 'regular',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    }

    console.log(`\n📊 Creating ${pricingEntries.length} pricing entries...`)

    // Delete existing pricing for this property
    const deleteResult = await PropertyPricing.deleteMany({
      propertyId: property._id.toString()
    })
    console.log(`   Deleted ${deleteResult.deletedCount} existing pricing entries`)

    // Insert new pricing entries
    if (pricingEntries.length > 0) {
      const insertResult = await PropertyPricing.insertMany(pricingEntries)
      console.log(`   Created ${insertResult.insertedCount} new pricing entries`)
    }

    // Verify
    console.log('\n✅ VERIFICATION:')
    const verifyCount = await PropertyPricing.countDocuments({
      propertyId: property._id.toString()
    })
    console.log(`   Total pricing entries: ${verifyCount}`)

    // Show sample pricing
    const samplePricing = await PropertyPricing.find({
      propertyId: property._id.toString()
    }).limit(5).toArray()

    console.log('\n   Sample pricing entries:')
    samplePricing.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.roomCategory} - ${p.planType} - ${p.occupancyType}: ₹${p.price}`)
    })

    console.log('\n✅ Plan-based pricing updated successfully!')
    console.log('   All room categories, plans, and occupancies set to ₹7400')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the script
addPlanPricingForCrescentResort()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
