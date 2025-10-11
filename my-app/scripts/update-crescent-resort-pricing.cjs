const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'baithakaghar',
    })
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

async function updateCrescentResortPricing() {
  await connectDB()

  try {
    const Property = mongoose.connection.collection('properties')

    // Find BAITHAKA GHAR CRESCENT RESORT
    const property = await Property.findOne({
      title: { $regex: /BAITHAKA GHAR CRESCENT RESORT/i }
    })

    if (!property) {
      console.log('❌ Property "BAITHAKA GHAR CRESCENT RESORT" not found')
      console.log('📝 Searching for similar properties...')

      const allProperties = await Property.find({
        title: { $regex: /crescent/i }
      }).toArray()

      console.log(`Found ${allProperties.length} properties with "crescent" in the name:`)
      allProperties.forEach(p => {
        console.log(`  - ${p.title} (ID: ${p._id})`)
      })

      process.exit(1)
    }

    console.log(`✅ Found property: ${property.title}`)
    console.log(`   Property ID: ${property._id}`)

    // Update base price
    const updateData = {
      'price.base': 7400
    }

    // Update property units if they exist
    if (property.propertyUnits && Array.isArray(property.propertyUnits)) {
      console.log(`\n📋 Found ${property.propertyUnits.length} property units`)

      // Create updated property units with new price
      const updatedUnits = property.propertyUnits.map((unit, index) => {
        console.log(`   Unit ${index + 1}: ${unit.unitTypeName || 'Unnamed'} - Old price: ₹${unit.pricing?.price || 'N/A'}`)
        return {
          ...unit,
          pricing: {
            ...unit.pricing,
            price: '7400'
          }
        }
      })

      updateData.propertyUnits = updatedUnits
    }

    // Update room categories if they exist
    if (property.roomCategories && Array.isArray(property.roomCategories)) {
      console.log(`\n🛏️  Found ${property.roomCategories.length} room categories`)

      const updatedCategories = property.roomCategories.map((category, index) => {
        console.log(`   Category ${index + 1}: ${category.name || 'Unnamed'} - Old price: ₹${category.price || 'N/A'}`)
        return {
          ...category,
          price: 7400
        }
      })

      updateData.roomCategories = updatedCategories
    }

    // Perform the update
    const result = await Property.updateOne(
      { _id: property._id },
      { $set: updateData }
    )

    console.log('\n✅ Update completed!')
    console.log(`   Modified count: ${result.modifiedCount}`)
    console.log('\n📊 Updated pricing to ₹7400 for:')
    console.log(`   ✓ Base price`)
    if (updateData.propertyUnits) {
      console.log(`   ✓ ${updateData.propertyUnits.length} property units`)
    }
    if (updateData.roomCategories) {
      console.log(`   ✓ ${updateData.roomCategories.length} room categories`)
    }

    // Verify the update
    const updatedProperty = await Property.findOne({ _id: property._id })
    console.log('\n🔍 Verification:')
    console.log(`   Base price: ₹${updatedProperty.price?.base || 'N/A'}`)

    if (updatedProperty.propertyUnits && updatedProperty.propertyUnits.length > 0) {
      console.log('   Property units:')
      updatedProperty.propertyUnits.forEach((unit, index) => {
        console.log(`     ${index + 1}. ${unit.unitTypeName}: ₹${unit.pricing?.price || 'N/A'}`)
      })
    }

    if (updatedProperty.roomCategories && updatedProperty.roomCategories.length > 0) {
      console.log('   Room categories:')
      updatedProperty.roomCategories.forEach((cat, index) => {
        console.log(`     ${index + 1}. ${cat.name}: ₹${cat.price || 'N/A'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error updating pricing:', error)
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
