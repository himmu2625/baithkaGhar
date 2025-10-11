const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function setupAllPropertiesPricing() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')
    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Get all properties with "BAITHAKA GHAR" in the name
    const properties = await Property.find({
      title: { $regex: /BAITHAKA GHAR/i }
    }).toArray()

    console.log(`\n📋 Found ${properties.length} BAITHAKA GHAR properties\n`)

    const planTypes = ['EP', 'CP', 'MAP', 'AP']
    const occupancyTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']

    let totalCreated = 0
    let propertiesUpdated = 0

    for (const property of properties) {
      console.log(`\n🏨 Processing: ${property.title}`)
      console.log(`   ID: ${property._id}`)

      // Get base price
      const basePrice = property.price?.base || 5000
      console.log(`   Base Price: ₹${basePrice}`)

      // Get room categories
      const roomCategories = property.propertyUnits || []
      console.log(`   Room Categories: ${roomCategories.length}`)

      if (roomCategories.length === 0) {
        console.log(`   ⚠️  No room categories found, skipping...`)
        continue
      }

      // Check if pricing already exists
      const existingCount = await PropertyPricing.countDocuments({
        propertyId: property._id.toString()
      })

      if (existingCount > 0) {
        console.log(`   ℹ️  Already has ${existingCount} pricing entries, skipping...`)
        continue
      }

      // Create pricing entries
      const pricingEntries = []

      for (const roomUnit of roomCategories) {
        const roomCategory = roomUnit.unitTypeCode
        const roomPrice = parseFloat(roomUnit.pricing?.price) || basePrice

        for (const planType of planTypes) {
          for (const occupancyType of occupancyTypes) {
            pricingEntries.push({
              propertyId: property._id.toString(),
              roomCategory: roomCategory,
              planType: planType,
              occupancyType: occupancyType,
              price: roomPrice,
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

      if (pricingEntries.length > 0) {
        const insertResult = await PropertyPricing.insertMany(pricingEntries)
        console.log(`   ✅ Created ${insertResult.insertedCount} pricing entries`)
        totalCreated += insertResult.insertedCount
        propertiesUpdated++
      }

      // Ensure hidePrices is false
      await Property.updateOne(
        { _id: property._id },
        { $set: { hidePrices: false } }
      )
    }

    console.log(`\n\n📊 SUMMARY:`)
    console.log(`   Properties processed: ${properties.length}`)
    console.log(`   Properties updated: ${propertiesUpdated}`)
    console.log(`   Total pricing entries created: ${totalCreated}`)

    // Verification
    console.log(`\n✅ VERIFICATION:`)
    const totalPricingEntries = await PropertyPricing.countDocuments({})
    console.log(`   Total pricing entries in database: ${totalPricingEntries}`)

    const propertiesWithHiddenPrices = await Property.countDocuments({ hidePrices: true })
    console.log(`   Properties with hidden prices: ${propertiesWithHiddenPrices}`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

setupAllPropertiesPricing()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
