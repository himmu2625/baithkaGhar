const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function findCrescentResort() {
  try {
    // Connect without specifying dbName to access all databases
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // List all databases
    const admin = mongoose.connection.db.admin()
    const { databases } = await admin.listDatabases()

    console.log('\n📋 Available databases:')
    databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`)
    })

    // Search in each database
    for (const dbInfo of databases) {
      const dbName = dbInfo.name

      // Skip system databases
      if (['admin', 'local', 'config'].includes(dbName)) {
        continue
      }

      console.log(`\n🔍 Searching in database: ${dbName}`)

      const db = mongoose.connection.client.db(dbName)
      const collections = await db.listCollections().toArray()

      console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`)

      // Check if properties collection exists
      const hasProperties = collections.some(c => c.name === 'properties')

      if (hasProperties) {
        const Property = db.collection('properties')
        const count = await Property.countDocuments()
        console.log(`   📊 Total properties in ${dbName}: ${count}`)

        // Search for Crescent Resort
        const crescentProperties = await Property.find({
          $or: [
            { title: { $regex: /crescent/i } },
            { title: { $regex: /baithaka/i } },
            { title: { $regex: /GHAR/i } }
          ]
        }).toArray()

        if (crescentProperties.length > 0) {
          console.log(`\n   ✅ Found ${crescentProperties.length} matching properties:`)
          crescentProperties.forEach((p, index) => {
            console.log(`\n   ${index + 1}. ${p.title}`)
            console.log(`      ID: ${p._id}`)
            console.log(`      Database: ${dbName}`)
            console.log(`      Base Price: ₹${p.price?.base || 'N/A'}`)

            if (p.propertyUnits && p.propertyUnits.length > 0) {
              console.log(`      Property Units:`)
              p.propertyUnits.forEach(unit => {
                console.log(`        - ${unit.unitTypeName}: ₹${unit.pricing?.price || 'N/A'}`)
              })
            }
          })
        }

        // List first 5 properties in this database
        if (count > 0 && crescentProperties.length === 0) {
          console.log(`   \n   📋 Sample properties in ${dbName}:`)
          const sampleProperties = await Property.find({}).limit(5).toArray()
          sampleProperties.forEach((p, index) => {
            console.log(`      ${index + 1}. ${p.title} (₹${p.price?.base || 'N/A'})`)
          })
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the script
findCrescentResort()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
