const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/'

async function testNewPricingAPI() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'test'
    })
    console.log('✅ Connected to MongoDB (test database)')

    const Property = mongoose.connection.collection('properties')
    const PropertyPricing = mongoose.connection.collection('propertypricings')

    // Find Crescent Resort
    const property = await Property.findOne({
      title: 'BAITHAKA GHAR CRESCENT RESORT'
    })

    if (!property) {
      console.log('❌ Property not found')
      process.exit(1)
    }

    console.log(`\n✅ Testing with: ${property.title}`)
    console.log(`   Property ID: ${property._id}`)

    // Test parameters
    const testParams = {
      propertyId: property._id.toString(),
      roomCategory: 'deluxe',
      planType: 'EP',
      occupancyType: 'DOUBLE',
      checkIn: new Date('2025-12-25'),
      checkOut: new Date('2025-12-28')
    }

    console.log('\n📋 Test Parameters:')
    console.log(`   Room Category: ${testParams.roomCategory}`)
    console.log(`   Plan: ${testParams.planType}`)
    console.log(`   Occupancy: ${testParams.occupancyType}`)
    console.log(`   Dates: ${testParams.checkIn.toISOString().split('T')[0]} to ${testParams.checkOut.toISOString().split('T')[0]}`)

    // Simulate the API query logic
    console.log('\n🔍 Simulating API Query...\n')

    const days = []
    const currentDate = new Date(testParams.checkIn)
    while (currentDate < testParams.checkOut) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`📅 Processing ${days.length} nights:\n`)

    for (const day of days) {
      const dateStr = day.toISOString().split('T')[0]
      console.log(`   Date: ${dateStr}`)

      // Check DIRECT pricing
      const directPrice = await PropertyPricing.find({
        propertyId: testParams.propertyId,
        roomCategory: testParams.roomCategory,
        planType: testParams.planType,
        occupancyType: testParams.occupancyType,
        pricingType: 'DIRECT',
        startDate: { $lte: day },
        endDate: { $gte: day },
        isActive: true
      }).sort({ updatedAt: -1 }).limit(1).toArray()
      const directPriceResult = directPrice[0]

      if (directPriceResult) {
        console.log(`   ✓ DIRECT pricing found: ₹${directPriceResult.price}`)
        console.log(`     Reason: ${directPriceResult.reason || 'N/A'}`)
        continue
      }

      // Check PLAN_BASED pricing
      const planPrice = await PropertyPricing.find({
        propertyId: testParams.propertyId,
        roomCategory: testParams.roomCategory,
        planType: testParams.planType,
        occupancyType: testParams.occupancyType,
        pricingType: 'PLAN_BASED',
        startDate: { $lte: day },
        endDate: { $gte: day },
        isActive: true
      }).sort({ updatedAt: -1 }).limit(1).toArray()
      const planPriceResult = planPrice[0]

      if (planPriceResult) {
        console.log(`   ✓ PLAN_BASED pricing found: ₹${planPriceResult.price}`)
        console.log(`     Reason: ${planPriceResult.reason || 'N/A'}`)
        continue
      }

      // Check BASE pricing
      const basePrice = await PropertyPricing.find({
        propertyId: testParams.propertyId,
        roomCategory: testParams.roomCategory,
        planType: testParams.planType,
        occupancyType: testParams.occupancyType,
        pricingType: 'BASE',
        isActive: true
      }).sort({ updatedAt: -1 }).limit(1).toArray()
      const basePriceResult = basePrice[0]

      if (basePriceResult) {
        console.log(`   ✓ BASE pricing found: ₹${basePriceResult.price}`)
        console.log(`     Reason: ${basePriceResult.reason || 'N/A'}`)
        continue
      }

      // Fallback to property price
      const fallbackPrice = property.price?.base || 5000
      console.log(`   ⚠️  FALLBACK pricing used: ₹${fallbackPrice}`)
      console.log(`     Source: Property base price`)
    }

    // Check total pricing entries by type
    console.log('\n📊 Pricing Statistics:')

    const directCount = await PropertyPricing.countDocuments({
      propertyId: testParams.propertyId,
      pricingType: 'DIRECT',
      isActive: true
    })
    console.log(`   DIRECT pricing entries: ${directCount}`)

    const planBasedCount = await PropertyPricing.countDocuments({
      propertyId: testParams.propertyId,
      pricingType: 'PLAN_BASED',
      isActive: true
    })
    console.log(`   PLAN_BASED pricing entries: ${planBasedCount}`)

    const baseCount = await PropertyPricing.countDocuments({
      propertyId: testParams.propertyId,
      pricingType: 'BASE',
      isActive: true
    })
    console.log(`   BASE pricing entries: ${baseCount}`)

    const totalCount = await PropertyPricing.countDocuments({
      propertyId: testParams.propertyId,
      isActive: true
    })
    console.log(`   Total active entries: ${totalCount}`)

    // Show sample BASE pricing
    console.log('\n📋 Sample BASE Pricing Entries:')
    const sampleBase = await PropertyPricing.find({
      propertyId: testParams.propertyId,
      pricingType: 'BASE',
      isActive: true
    }).limit(5).toArray()

    sampleBase.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.roomCategory} - ${entry.planType} - ${entry.occupancyType}: ₹${entry.price}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
  }
}

testNewPricingAPI()
  .then(() => {
    console.log('\n✅ Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
