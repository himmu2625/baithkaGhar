const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function testPricingQuery() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')
    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Find the property
    const property = await Property.findOne({
      title: 'BAITHAKA GHAR CRESCENT RESORT'
    })

    if (!property) {
      console.log('❌ Property not found')
      process.exit(1)
    }

    console.log(`\n✅ Property: ${property.title}`)
    console.log(`   ID: ${property._id}`)

    // Test query similar to what the API does
    const propertyId = property._id.toString()
    const checkInDate = new Date('2025-10-08')
    const checkOutDate = new Date('2025-10-11')
    const planType = 'EP'
    const occupancyType = 'SINGLE'
    const roomCategory = 'deluxe'

    console.log('\n🔍 Testing pricing query with:')
    console.log(`   Property ID: ${propertyId}`)
    console.log(`   Check-in: ${checkInDate.toISOString().split('T')[0]}`)
    console.log(`   Check-out: ${checkOutDate.toISOString().split('T')[0]}`)
    console.log(`   Plan: ${planType}`)
    console.log(`   Occupancy: ${occupancyType}`)
    console.log(`   Room Category: ${roomCategory}`)

    const query = {
      propertyId,
      startDate: { $lte: checkOutDate },
      endDate: { $gte: checkInDate },
      isActive: true,
      planType,
      occupancyType,
      roomCategory
    }

    const pricingData = await PropertyPricing.find(query).toArray()

    console.log(`\n📊 Query results: ${pricingData.length} entries found`)

    if (pricingData.length > 0) {
      console.log('\n   Pricing data:')
      pricingData.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.roomCategory} - ${p.planType} - ${p.occupancyType}: ₹${p.price}`)
        console.log(`      Date range: ${p.startDate?.toISOString().split('T')[0]} to ${p.endDate?.toISOString().split('T')[0]}`)
        console.log(`      Active: ${p.isActive}`)
      })
    } else {
      console.log('\n   ❌ No pricing data found! This means the fallback will be used.')

      // Check what pricing exists for this property
      console.log('\n   Checking all pricing for this property...')
      const allPricing = await PropertyPricing.find({ propertyId }).limit(10).toArray()
      console.log(`   Total pricing entries: ${allPricing.length}`)

      if (allPricing.length > 0) {
        console.log('\n   Sample entries:')
        allPricing.slice(0, 5).forEach((p, idx) => {
          console.log(`   ${idx + 1}. ${p.roomCategory} - ${p.planType} - ${p.occupancyType}: ₹${p.price}`)
        })
      }
    }

    // Check property dynamic pricing
    console.log('\n🔍 Checking property dynamicPricing field:')
    if (property.dynamicPricing) {
      console.log('   ✅ Has dynamicPricing field')
      if (property.dynamicPricing.seasonalPricing?.rules) {
        console.log(`   Seasonal rules: ${property.dynamicPricing.seasonalPricing.rules.length}`)
      }
      if (property.dynamicPricing.directPricing?.customPrices) {
        console.log(`   Custom prices: ${property.dynamicPricing.directPricing.customPrices.length}`)
      }
    } else {
      console.log('   ❌ No dynamicPricing field')
    }

    // Check property base price
    console.log('\n💰 Property base price: ₹' + (property.price?.base || 'N/A'))

    if (property.propertyUnits) {
      console.log('\n🛏️  Property Units:')
      property.propertyUnits.forEach((unit, idx) => {
        console.log(`   ${idx + 1}. ${unit.unitTypeName} (${unit.unitTypeCode}): ₹${unit.pricing?.price}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

testPricingQuery()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
