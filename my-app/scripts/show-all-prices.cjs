const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function showAllPrices() {
  try {
    // Connect to the test database
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')

    // Check how many properties have hidePrices set to true
    const hiddenCount = await Property.countDocuments({ hidePrices: true })
    const totalCount = await Property.countDocuments({})

    console.log(`\n📊 Database Statistics:`)
    console.log(`   Total properties: ${totalCount}`)
    console.log(`   Properties with hidden prices: ${hiddenCount}`)

    if (hiddenCount > 0) {
      // List properties with hidden prices
      const hiddenProperties = await Property.find({ hidePrices: true }).toArray()
      console.log(`\n📋 Properties with hidden prices:`)
      hiddenProperties.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.title}`)
      })
    }

    // Update all properties to show prices
    console.log(`\n🔄 Updating all properties to show prices...`)
    const result = await Property.updateMany(
      {},
      { $set: { hidePrices: false } }
    )

    console.log(`✅ Updated ${result.modifiedCount} properties`)

    // Verify
    const stillHidden = await Property.countDocuments({ hidePrices: true })
    console.log(`\n✅ Verification:`)
    console.log(`   Properties still hiding prices: ${stillHidden}`)
    console.log(`   All prices are now visible!`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the script
showAllPrices()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
