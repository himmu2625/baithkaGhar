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

async function findBaithakaProperties() {
  await connectDB()

  try {
    const Property = mongoose.connection.collection('properties')

    // Search for all properties with "baithaka" or "ghar" in the name
    const properties = await Property.find({
      $or: [
        { title: { $regex: /baithaka/i } },
        { title: { $regex: /ghar/i } },
        { title: { $regex: /crescent/i } }
      ]
    }).toArray()

    console.log(`\n📋 Found ${properties.length} properties:\n`)

    properties.forEach((p, index) => {
      console.log(`${index + 1}. ${p.title}`)
      console.log(`   ID: ${p._id}`)
      console.log(`   Base Price: ₹${p.price?.base || 'N/A'}`)

      if (p.propertyUnits && p.propertyUnits.length > 0) {
        console.log(`   Property Units (${p.propertyUnits.length}):`)
        p.propertyUnits.forEach(unit => {
          console.log(`     - ${unit.unitTypeName}: ₹${unit.pricing?.price || 'N/A'}`)
        })
      }

      if (p.roomCategories && p.roomCategories.length > 0) {
        console.log(`   Room Categories (${p.roomCategories.length}):`)
        p.roomCategories.forEach(cat => {
          console.log(`     - ${cat.name}: ₹${cat.price || 'N/A'}`)
        })
      }
      console.log('')
    })

    // If no properties found, list all properties
    if (properties.length === 0) {
      console.log('No properties found matching search criteria.')
      console.log('\n📋 Listing ALL properties:\n')

      const allProperties = await Property.find({}).limit(20).toArray()
      allProperties.forEach((p, index) => {
        console.log(`${index + 1}. ${p.title} (ID: ${p._id})`)
        console.log(`   Base Price: ₹${p.price?.base || 'N/A'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('✅ Database connection closed')
  }
}

// Run the script
findBaithakaProperties()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
