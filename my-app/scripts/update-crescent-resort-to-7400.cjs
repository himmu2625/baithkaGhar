const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function updateCrescentResortPricing() {
  try {
    // Connect to the test database where the property exists
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')

    // Find BAITHAKA GHAR CRESCENT RESORT
    const property = await Property.findOne({
      title: 'BAITHAKA GHAR CRESCENT RESORT'
    })

    if (!property) {
      console.log('❌ Property "BAITHAKA GHAR CRESCENT RESORT" not found')
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

    // Prepare update data
    const updateData = {
      'price.base': 7400
    }

    // Update all property units to 7400
    if (property.propertyUnits && Array.isArray(property.propertyUnits)) {
      const updatedUnits = property.propertyUnits.map((unit) => ({
        ...unit,
        pricing: {
          ...unit.pricing,
          price: '7400'
        }
      }))

      updateData.propertyUnits = updatedUnits
    }

    // Update room categories if they exist
    if (property.roomCategories && Array.isArray(property.roomCategories)) {
      const updatedCategories = property.roomCategories.map((category) => ({
        ...category,
        price: 7400
      }))

      updateData.roomCategories = updatedCategories
    }

    // Perform the update
    console.log('\n🔄 Updating pricing to ₹7400...')
    const result = await Property.updateOne(
      { _id: property._id },
      { $set: updateData }
    )

    console.log('✅ Update completed!')
    console.log(`   Modified: ${result.modifiedCount} document(s)`)

    // Verify the update
    const updatedProperty = await Property.findOne({ _id: property._id })

    console.log('\n✅ VERIFICATION - New Pricing:')
    console.log(`   Base Price: ₹${updatedProperty.price?.base}`)

    if (updatedProperty.propertyUnits && updatedProperty.propertyUnits.length > 0) {
      console.log('\n   Property Units:')
      updatedProperty.propertyUnits.forEach((unit, index) => {
        console.log(`   ${index + 1}. ${unit.unitTypeName}: ₹${unit.pricing?.price}`)
      })
    }

    if (updatedProperty.roomCategories && updatedProperty.roomCategories.length > 0) {
      console.log('\n   Room Categories:')
      updatedProperty.roomCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name}: ₹${cat.price}`)
      })
    }

    console.log('\n✅ All pricing sections updated to ₹7400!')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the script
updateCrescentResortPricing()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
