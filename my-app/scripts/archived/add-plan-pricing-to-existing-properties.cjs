const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';

// Generate plan-based pricing from existing pricing
function generatePlanBasedPricing(existingPrice) {
  const basePrice = parseFloat(existingPrice) || 3000;

  // Calculate pricing for all combinations
  // EP (Room Only) - Base price
  // CP (Room + Breakfast) - +25% from EP
  // MAP (Breakfast + 1 Meal) - +60% from EP
  // AP (All Meals) - +100% from EP

  return [
    // EP - Room Only (base prices)
    { planType: "EP", occupancyType: "SINGLE", price: Math.round(basePrice * 0.8) },
    { planType: "EP", occupancyType: "DOUBLE", price: basePrice },
    { planType: "EP", occupancyType: "TRIPLE", price: Math.round(basePrice * 1.3) },
    { planType: "EP", occupancyType: "QUAD", price: Math.round(basePrice * 1.6) },

    // CP - Room + Breakfast (+25% from EP)
    { planType: "CP", occupancyType: "SINGLE", price: Math.round(basePrice * 0.8 * 1.25) },
    { planType: "CP", occupancyType: "DOUBLE", price: Math.round(basePrice * 1.25) },
    { planType: "CP", occupancyType: "TRIPLE", price: Math.round(basePrice * 1.3 * 1.25) },
    { planType: "CP", occupancyType: "QUAD", price: Math.round(basePrice * 1.6 * 1.25) },

    // MAP - Room + Breakfast + 1 Meal (+60% from EP)
    { planType: "MAP", occupancyType: "SINGLE", price: Math.round(basePrice * 0.8 * 1.6) },
    { planType: "MAP", occupancyType: "DOUBLE", price: Math.round(basePrice * 1.6) },
    { planType: "MAP", occupancyType: "TRIPLE", price: Math.round(basePrice * 1.3 * 1.6) },
    { planType: "MAP", occupancyType: "QUAD", price: Math.round(basePrice * 1.6 * 1.6) },

    // AP - All Meals (+100% from EP)
    { planType: "AP", occupancyType: "SINGLE", price: Math.round(basePrice * 0.8 * 2) },
    { planType: "AP", occupancyType: "DOUBLE", price: Math.round(basePrice * 2) },
    { planType: "AP", occupancyType: "TRIPLE", price: Math.round(basePrice * 1.3 * 2) },
    { planType: "AP", occupancyType: "QUAD", price: Math.round(basePrice * 1.6 * 2) }
  ];
}

async function addPlanPricingToProperties() {
  let client;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    console.log('🔌 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    console.log('✅ Connected successfully');

    // Find all properties (including those without isActive field)
    const properties = await db.collection('properties').find({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    }).toArray();

    console.log(`📊 Found ${properties.length} active properties`);

    for (const property of properties) {
      let needsUpdate = false;
      const updatedUnits = [];

      // Check if property has propertyUnits
      if (!property.propertyUnits || property.propertyUnits.length === 0) {
        console.log(`⏭️  Skipping ${property.title || property.name} - No property units`);
        skippedCount++;
        continue;
      }

      // Process each unit
      for (const unit of property.propertyUnits) {
        // Check if unit already has plan-based pricing
        if (unit.planBasedPricing && unit.planBasedPricing.length > 0) {
          console.log(`   ✓ ${unit.unitTypeName} already has plan-based pricing`);
          updatedUnits.push(unit);
          continue;
        }

        // Get base price from unit pricing
        let basePrice = 3000; // default
        if (unit.pricing && unit.pricing.price) {
          basePrice = parseFloat(unit.pricing.price);
        }

        // Generate plan-based pricing
        const planBasedPricing = generatePlanBasedPricing(basePrice);

        // Add to unit
        updatedUnits.push({
          ...unit,
          planBasedPricing
        });

        needsUpdate = true;
        console.log(`   ➕ Added plan-based pricing to ${unit.unitTypeName} (base: ₹${basePrice})`);
      }

      // Update property if needed
      if (needsUpdate) {
        await db.collection('properties').updateOne(
          { _id: property._id },
          {
            $set: {
              propertyUnits: updatedUnits,
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Updated: ${property.title || property.name}`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped: ${property.title || property.name} - Already has pricing`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Properties updated: ${updatedCount}`);
    console.log(`⏭️  Properties skipped: ${skippedCount}`);
    console.log(`📈 Total properties: ${properties.length}`);

    if (updatedCount > 0) {
      console.log('\n💰 Pricing Structure Applied:');
      console.log('   EP (Room Only):');
      console.log('      - Single: Base × 0.8');
      console.log('      - Double: Base × 1.0');
      console.log('      - Triple: Base × 1.3');
      console.log('      - Quad: Base × 1.6');
      console.log('   CP (+ Breakfast): EP + 25%');
      console.log('   MAP (+ Breakfast + 1 Meal): EP + 60%');
      console.log('   AP (All Meals): EP + 100%');
    }

    console.log('\n✨ Next Steps:');
    console.log('   1. Visit any property page to see the pricing matrix');
    console.log('   2. Use the Edit Property modal to adjust prices');
    console.log('   3. Test booking with different plan combinations');
    console.log('   4. Check analytics dashboard for insights');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Connection closed');
    }
  }
}

// Run the migration
console.log('🚀 Starting Plan-Based Pricing Migration...\n');
addPlanPricingToProperties().catch(console.error);
