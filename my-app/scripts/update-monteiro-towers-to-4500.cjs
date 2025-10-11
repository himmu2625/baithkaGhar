const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function updateMonteiroTowersPricing() {
  try {
    // Connect to the test database
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')
    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Find BAITHAKA GHAR MONTEIRO TOWERS
    const property = await Property.findOne({
      title: 'BAITHAKA GHAR MONTEIRO TOWERS'
    })

    if (!property) {
      console.log('❌ Property "BAITHAKA GHAR MONTEIRO TOWERS" not found')
      process.exit(1)
    }

    console.log(`\n✅ Found property: ${property.title}`)
    console.log(`   Property ID: ${property._id}`)
    console.log(`   Current Base Price: ₹${property.price?.base || 'N/A'}`)

    console.log('\n📋 Current Property Units:')
    if (property.propertyUnits && property.propertyUnits.length > 0) {
      property.propertyUnits.forEach((unit, index) => {
        console.log(`   ${index + 1}. ${unit.unitTypeName}: ₹${unit.pricing?.price || 'N/A'}`)
      })
    }

    // Step 1: Update base price and property units
    const updateData = {
      'price.base': 4500
    }

    if (property.propertyUnits && Array.isArray(property.propertyUnits)) {
      const updatedUnits = property.propertyUnits.map((unit) => ({
        ...unit,
        pricing: {
          ...unit.pricing,
          price: '4500'
        }
      }))
      updateData.propertyUnits = updatedUnits
    }

    if (property.roomCategories && Array.isArray(property.roomCategories)) {
      const updatedCategories = property.roomCategories.map((category) => ({
        ...category,
        price: 4500
      }))
      updateData.roomCategories = updatedCategories
    }

    console.log('\n🔄 Updating base pricing to ₹4500...')
    const result = await Property.updateOne(
      { _id: property._id },
      { $set: updateData }
    )
    console.log(`✅ Base pricing updated: ${result.modifiedCount} document(s)`)

    // Step 2: Update plan-based pricing
    const roomCategories = property.propertyUnits || []
    const planTypes = ['EP', 'CP', 'MAP', 'AP']
    const occupancyTypes = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']

    console.log(`\n📊 Updating plan-based pricing entries...`)

    // Delete existing pricing for this property
    const deleteResult = await PropertyPricing.deleteMany({
      propertyId: property._id.toString()
    })
    console.log(`   Deleted ${deleteResult.deletedCount} existing pricing entries`)

    // Create new pricing entries with updated price
    const pricingEntries = []
    const basePrice = 4500

    for (const roomUnit of roomCategories) {
      const roomCategory = roomUnit.unitTypeCode

      for (const planType of planTypes) {
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

    if (pricingEntries.length > 0) {
      const insertResult = await PropertyPricing.insertMany(pricingEntries)
      console.log(`   Created ${insertResult.insertedCount} new pricing entries`)
    }

    // Step 3: Verify the update
    const updatedProperty = await Property.findOne({ _id: property._id })

    console.log('\n✅ VERIFICATION - New Pricing:')
    console.log(`   Base Price: ₹${updatedProperty.price?.base}`)

    if (updatedProperty.propertyUnits && updatedProperty.propertyUnits.length > 0) {
      console.log('\n   Property Units:')
      updatedProperty.propertyUnits.forEach((unit, index) => {
        console.log(`   ${index + 1}. ${unit.unitTypeName}: ₹${unit.pricing?.price}`)
      })
    }

    // Verify plan-based pricing
    const verifyCount = await PropertyPricing.countDocuments({
      propertyId: property._id.toString()
    })
    console.log(`\n   Plan-based pricing entries: ${verifyCount}`)

    const samplePricing = await PropertyPricing.find({
      propertyId: property._id.toString()
    }).limit(3).toArray()

    console.log('\n   Sample plan pricing:')
    samplePricing.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.roomCategory} - ${p.planType} - ${p.occupancyType}: ₹${p.price}`)
    })

    console.log('\n✅ All pricing sections updated to ₹4500!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the script
updateMonteiroTowersPricing()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
