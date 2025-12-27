const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';

async function updateNexusGreenPrice() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define Property model with flexible schema
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));

    // ==================== STEP 1: FIND THE PROPERTY ====================
    console.log('🔍 STEP 1: Finding BAITHAKA GHAR NEXUS GREEN HOTEL...');

    // Search for the property by title (case-insensitive)
    const property = await Property.findOne({
      title: { $regex: /NEXUS GREEN/i }
    });

    if (!property) {
      console.log('❌ Property "BAITHAKA GHAR NEXUS GREEN HOTEL" not found!');
      console.log('\n📋 Searching for similar properties...');

      // Search for properties with "Nexus" or "Green" in the title
      const similarProperties = await Property.find({
        $or: [
          { title: { $regex: /nexus/i } },
          { title: { $regex: /green/i } },
          { title: { $regex: /baithaka/i } }
        ]
      }).select('title _id pricing.perNight price.base').limit(10);

      if (similarProperties.length > 0) {
        console.log(`\nFound ${similarProperties.length} similar properties:`);
        similarProperties.forEach((prop, index) => {
          console.log(`${index + 1}. ${prop.title}`);
          console.log(`   ID: ${prop._id}`);
          console.log(`   Current Price (perNight): ${prop.pricing?.perNight || 'N/A'}`);
          console.log(`   Current Price (base): ${prop.price?.base || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('No similar properties found.');
      }

      return;
    }

    console.log(`✅ Found property: ${property.title}`);
    console.log(`   ID: ${property._id}`);
    console.log(`   Current pricing.perNight: ${property.pricing?.perNight || 'N/A'}`);
    console.log(`   Current price.base: ${property.price?.base || 'N/A'}`);
    console.log('');

    // ==================== STEP 2: UPDATE THE PRICE ====================
    console.log('💰 STEP 2: Updating price to 13000...');

    const updateData = {
      'pricing.perNight': '13000',
      'price.base': 13000,
      updatedAt: new Date()
    };

    const result = await Property.updateOne(
      { _id: property._id },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Price updated successfully!');
    } else {
      console.log('⚠️  No changes made (price might already be 13000)');
    }

    // ==================== STEP 3: VERIFY THE UPDATE ====================
    console.log('\n✅ STEP 3: Verifying the update...');

    const updatedProperty = await Property.findById(property._id);
    console.log(`\nUpdated property details:`);
    console.log(`   Title: ${updatedProperty.title}`);
    console.log(`   ID: ${updatedProperty._id}`);
    console.log(`   New pricing.perNight: ${updatedProperty.pricing?.perNight || 'N/A'}`);
    console.log(`   New price.base: ${updatedProperty.price?.base || 'N/A'}`);

    // ==================== STEP 4: UPDATE PLAN-BASED PRICING (if exists) ====================
    console.log('\n🔄 STEP 4: Checking for plan-based pricing entries...');

    const PropertyPricing = mongoose.model('PropertyPricing', new mongoose.Schema({}, { strict: false, collection: 'propertypricing' }));

    const pricingEntries = await PropertyPricing.find({
      propertyId: property._id.toString()
    });

    if (pricingEntries.length > 0) {
      console.log(`Found ${pricingEntries.length} pricing entries for this property`);
      console.log('⚠️  Note: You may want to update plan-based pricing through the admin panel');
      console.log('   These entries control the actual booking prices.');

      // Show a sample of pricing entries
      pricingEntries.slice(0, 5).forEach((entry, index) => {
        console.log(`\n   Entry ${index + 1}:`);
        console.log(`      Type: ${entry.pricingType}`);
        console.log(`      Plan: ${entry.planType || 'N/A'}`);
        console.log(`      Occupancy: ${entry.occupancyType || 'N/A'}`);
        console.log(`      Current Price: ${entry.price || 'N/A'}`);
      });
    } else {
      console.log('No plan-based pricing entries found for this property.');
    }

    // ==================== SUMMARY ====================
    console.log('\n📋 UPDATE SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Property: ${updatedProperty.title}`);
    console.log(`Property ID: ${updatedProperty._id}`);
    console.log(`New Base Price: ₹${updatedProperty.price?.base || 'N/A'}`);
    console.log(`New Per Night Price: ₹${updatedProperty.pricing?.perNight || 'N/A'}`);
    console.log('═'.repeat(60));
    console.log('\n✨ Next Steps:');
    console.log('1. Verify the price update in the admin panel');
    console.log('2. Update plan-based pricing if needed through admin panel');
    console.log('3. Clear any cached data if applicable\n');

  } catch (error) {
    console.error('❌ Error updating price:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  updateNexusGreenPrice()
    .then(() => {
      console.log('✅ Price update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = updateNexusGreenPrice;
