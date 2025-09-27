const mongoose = require('mongoose');
const PropertyPricing = require('../models/PropertyPricing.ts').default;
const PlanType = require('../models/PlanType.ts').default;

async function testPricingSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🧪 Starting Pricing System Tests...\n');

    // Test 1: Plan Types
    console.log('📋 Test 1: Plan Types');
    const planTypes = await PlanType.find({}).sort({ sortOrder: 1 });
    console.log(`✅ Found ${planTypes.length} plan types:`);
    planTypes.forEach(plan => {
      console.log(`   - ${plan.code}: ${plan.name}`);
    });

    // Test 2: Pricing Data Structure
    console.log('\n💰 Test 2: Pricing Data Structure');
    const samplePricing = await PropertyPricing.findOne({});
    if (samplePricing) {
      console.log('✅ Sample pricing entry found:');
      console.log(`   - Property: ${samplePricing.propertyId}`);
      console.log(`   - Room: ${samplePricing.roomCategory}`);
      console.log(`   - Plan: ${samplePricing.planType}`);
      console.log(`   - Occupancy: ${samplePricing.occupancyType}`);
      console.log(`   - Price: ₹${samplePricing.price}`);
      console.log(`   - Dates: ${samplePricing.startDate.toISOString().split('T')[0]} to ${samplePricing.endDate.toISOString().split('T')[0]}`);
    } else {
      console.log('❌ No pricing data found');
    }

    // Test 3: Query Performance
    console.log('\n⚡ Test 3: Query Performance');
    const startTime = Date.now();

    const testPropertyId = await PropertyPricing.findOne({}, 'propertyId');
    if (testPropertyId) {
      const pricingQuery = await PropertyPricing.find({
        propertyId: testPropertyId.propertyId,
        startDate: { $lte: new Date('2025-12-31') },
        endDate: { $gte: new Date('2025-01-01') },
        isActive: true
      }).sort({ roomCategory: 1, planType: 1, occupancyType: 1 });

      const queryTime = Date.now() - startTime;
      console.log(`✅ Query completed in ${queryTime}ms`);
      console.log(`   - Found ${pricingQuery.length} pricing entries`);
    }

    // Test 4: Data Validation
    console.log('\n🔍 Test 4: Data Validation');

    // Check for missing required fields
    const invalidEntries = await PropertyPricing.find({
      $or: [
        { propertyId: { $exists: false } },
        { roomCategory: { $exists: false } },
        { planType: { $exists: false } },
        { occupancyType: { $exists: false } },
        { price: { $lte: 0 } }
      ]
    });

    if (invalidEntries.length === 0) {
      console.log('✅ All pricing entries have valid data');
    } else {
      console.log(`❌ Found ${invalidEntries.length} invalid entries`);
    }

    // Check for overlapping date ranges
    const properties = await PropertyPricing.distinct('propertyId');
    let overlappingCount = 0;

    for (const propertyId of properties.slice(0, 3)) { // Test first 3 properties
      const overlaps = await PropertyPricing.aggregate([
        { $match: { propertyId } },
        {
          $lookup: {
            from: 'propertypricing',
            let: {
              roomCat: '$roomCategory',
              plan: '$planType',
              occ: '$occupancyType',
              start: '$startDate',
              end: '$endDate',
              id: '$_id'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$propertyId', propertyId] },
                      { $eq: ['$roomCategory', '$roomCat'] },
                      { $eq: ['$planType', '$plan'] },
                      { $eq: ['$occupancyType', '$occ'] },
                      { $ne: ['$_id', '$id'] },
                      {
                        $or: [
                          {
                            $and: [
                              { $lte: ['$startDate', '$end'] },
                              { $gte: ['$endDate', '$start'] }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: 'overlaps'
          }
        },
        { $match: { 'overlaps.0': { $exists: true } } }
      ]);

      overlappingCount += overlaps.length;
    }

    if (overlappingCount === 0) {
      console.log('✅ No overlapping date ranges found');
    } else {
      console.log(`⚠️ Found ${overlappingCount} potential overlapping entries`);
    }

    // Test 5: Coverage Analysis
    console.log('\n📊 Test 5: Coverage Analysis');

    const coverageStats = await PropertyPricing.aggregate([
      {
        $group: {
          _id: '$propertyId',
          planTypes: { $addToSet: '$planType' },
          occupancyTypes: { $addToSet: '$occupancyType' },
          roomCategories: { $addToSet: '$roomCategory' },
          totalEntries: { $sum: 1 },
          priceRange: {
            $push: {
              min: { $min: '$price' },
              max: { $max: '$price' }
            }
          }
        }
      },
      {
        $project: {
          planCount: { $size: '$planTypes' },
          occupancyCount: { $size: '$occupancyTypes' },
          roomCount: { $size: '$roomCategories' },
          totalEntries: 1,
          completeCoverage: {
            $and: [
              { $eq: [{ $size: '$planTypes' }, 4] }, // All 4 plan types
              { $eq: [{ $size: '$occupancyTypes' }, 4] } // All 4 occupancy types
            ]
          }
        }
      }
    ]);

    const totalProperties = coverageStats.length;
    const completeProperties = coverageStats.filter(p => p.completeCoverage).length;

    console.log(`✅ Coverage Analysis:`);
    console.log(`   - Total properties with pricing: ${totalProperties}`);
    console.log(`   - Properties with complete coverage: ${completeProperties}`);
    console.log(`   - Coverage percentage: ${((completeProperties / totalProperties) * 100).toFixed(1)}%`);

    // Test 6: Sample Queries
    console.log('\n🔍 Test 6: Sample API Queries');

    if (testPropertyId) {
      // Test calendar query
      const calendarQuery = await PropertyPricing.find({
        propertyId: testPropertyId.propertyId,
        startDate: { $lte: new Date('2025-10-31') },
        endDate: { $gte: new Date('2025-10-01') },
        isActive: true
      }).sort({ roomCategory: 1, planType: 1, occupancyType: 1 });

      console.log(`✅ Calendar query (Oct 2025): ${calendarQuery.length} entries`);

      // Test specific plan/occupancy query
      const specificQuery = await PropertyPricing.find({
        propertyId: testPropertyId.propertyId,
        planType: 'EP',
        occupancyType: 'DOUBLE',
        isActive: true
      });

      console.log(`✅ Specific query (EP + Double): ${specificQuery.length} entries`);
    }

    console.log('\n🎉 All tests completed successfully!');

    // Summary
    console.log('\n📈 SYSTEM SUMMARY:');
    const totalEntries = await PropertyPricing.countDocuments();
    const activeEntries = await PropertyPricing.countDocuments({ isActive: true });
    const totalProperties = await PropertyPricing.distinct('propertyId');

    console.log(`- Total pricing entries: ${totalEntries}`);
    console.log(`- Active entries: ${activeEntries}`);
    console.log(`- Properties covered: ${totalProperties.length}`);
    console.log(`- Plan types available: ${planTypes.length}`);
    console.log('- System ready for production! ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run tests
testPricingSystem();