const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/';

// Configuration
const PLAN_TYPES = ['EP', 'CP', 'MAP', 'AP'];
const OCCUPANCY_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'];
const INFINITE_END_DATE = new Date('2099-12-31');

/**
 * Initialize pricing for a property
 * Creates BASE entries for all plan/occupancy combinations
 */
async function initializePropertyPricing(propertyId, basePrice = 0, roomCategories = []) {
  try {
    console.log(`\n🔧 Initializing pricing for property: ${propertyId}`);
    console.log(`Base price: ₹${basePrice}`);
    console.log(`Room categories: ${roomCategories.length > 0 ? roomCategories.join(', ') : 'None specified'}\n`);

    await mongoose.connect(MONGODB_URI);

    const PropertyPricing = mongoose.models.PropertyPricing || mongoose.model('PropertyPricing', new mongoose.Schema({}, { strict: false, collection: 'propertypricing' }));
    const Property = mongoose.models.Property || mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));

    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // If no room categories provided, try to get from property
    let categories = roomCategories;
    if (categories.length === 0) {
      // Extract room categories from property.roomCategories or property.rooms
      if (property.roomCategories && property.roomCategories.length > 0) {
        categories = property.roomCategories.map(rc => rc.name || rc);
      } else if (property.rooms && property.rooms.length > 0) {
        categories = [...new Set(property.rooms.map(r => r.category))];
      } else {
        categories = ['standard']; // Default category
      }
    }

    console.log(`📦 Creating entries for ${categories.length} room categories`);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const roomCategory of categories) {
      console.log(`\n  Room Category: ${roomCategory}`);

      for (const planType of PLAN_TYPES) {
        for (const occupancyType of OCCUPANCY_TYPES) {
          const key = `${planType}-${occupancyType}`;

          // Check if BASE entry already exists
          const existing = await PropertyPricing.findOne({
            propertyId: propertyId.toString(),
            roomCategory,
            planType,
            occupancyType,
            pricingType: 'BASE'
          });

          if (existing) {
            // Update existing entry
            existing.price = basePrice;
            existing.isAvailable = basePrice > 0;
            existing.isActive = true;
            existing.startDate = startDate;
            existing.endDate = INFINITE_END_DATE;
            existing.updatedAt = new Date();
            await existing.save();
            updatedCount++;
            console.log(`    ✏️  Updated ${key}: ₹${basePrice}`);
          } else {
            // Create new BASE entry
            await PropertyPricing.create({
              propertyId: propertyId.toString(),
              roomCategory,
              planType,
              occupancyType,
              pricingType: 'BASE',
              startDate,
              endDate: INFINITE_END_DATE,
              price: basePrice,
              currency: 'INR',
              isActive: true,
              isAvailable: basePrice > 0,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            createdCount++;
            console.log(`    ✅ Created ${key}: ₹${basePrice}`);
          }
        }
      }
    }

    console.log('\n═'.repeat(60));
    console.log('📊 INITIALIZATION SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Property ID: ${propertyId}`);
    console.log(`Base Price: ₹${basePrice}`);
    console.log(`Room Categories: ${categories.length}`);
    console.log(`Total Combinations: ${categories.length * PLAN_TYPES.length * OCCUPANCY_TYPES.length}`);
    console.log(`\nNew entries created: ${createdCount}`);
    console.log(`Existing entries updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('═'.repeat(60));

    console.log('\n✨ Next Steps:');
    console.log('1. Go to admin panel → Properties → Pricing');
    console.log('2. Use Dynamic Pricing to set specific plan/occupancy prices');
    console.log('3. Mark unavailable combinations using availability toggles');
    console.log('4. Import Excel sheet for bulk updates if needed\n');

    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: createdCount + updatedCount + skippedCount
    };

  } catch (error) {
    console.error('❌ Error initializing pricing:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

/**
 * Initialize all properties with pricing
 */
async function initializeAllProperties() {
  try {
    console.log('🚀 Initializing pricing for ALL properties...\n');

    await mongoose.connect(MONGODB_URI);

    const Property = mongoose.models.Property || mongoose.model('Property', new mongoose.Schema({}, { strict: false, collection: 'properties' }));

    const properties = await Property.find({ isActive: true }).select('_id name basePrice');
    console.log(`Found ${properties.length} active properties\n`);

    await mongoose.connection.close();

    let totalCreated = 0;
    let totalUpdated = 0;

    for (const property of properties) {
      const basePrice = property.basePrice || 0;
      const result = await initializePropertyPricing(property._id.toString(), basePrice);
      totalCreated += result.created;
      totalUpdated += result.updated;
    }

    console.log('\n🎉 ALL PROPERTIES INITIALIZED:');
    console.log(`Total entries created: ${totalCreated}`);
    console.log(`Total entries updated: ${totalUpdated}`);
    console.log(`Properties processed: ${properties.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--all') {
    // Initialize all properties
    initializeAllProperties()
      .then(() => {
        console.log('✅ All properties initialized');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Failed:', error.message);
        process.exit(1);
      });
  } else if (args[0] && args[1]) {
    // Initialize single property: node script.cjs <propertyId> <basePrice>
    const propertyId = args[0];
    const basePrice = parseFloat(args[1]) || 0;
    const roomCategories = args[2] ? args[2].split(',') : [];

    initializePropertyPricing(propertyId, basePrice, roomCategories)
      .then(() => {
        console.log('✅ Property initialized successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Failed:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  Initialize all properties:');
    console.log('    MONGODB_URI="..." node initialize-property-pricing.cjs --all');
    console.log('\n  Initialize single property:');
    console.log('    MONGODB_URI="..." node initialize-property-pricing.cjs <propertyId> <basePrice> [roomCategories]');
    console.log('\n  Example:');
    console.log('    MONGODB_URI="..." node initialize-property-pricing.cjs 68543254321ae4322b9b5b31 5000 "standard,deluxe"');
    process.exit(1);
  }
}

module.exports = { initializePropertyPricing, initializeAllProperties };
