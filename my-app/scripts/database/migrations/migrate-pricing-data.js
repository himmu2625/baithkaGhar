const mongoose = require('mongoose');
const PropertyPricing = require('../models/PropertyPricing.ts').default;
const Property = require('../models/Property.ts').default;

async function migratePricingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to database');

    // Get all properties
    const properties = await Property.find({});
    console.log(`🏨 Found ${properties.length} properties`);

    for (const property of properties) {
      console.log(`\n🔄 Processing property: ${property.name} (${property._id})`);

      // Check if property already has new pricing data
      const existingPricing = await PropertyPricing.findOne({
        propertyId: property._id.toString()
      });

      if (existingPricing) {
        console.log(`⏭️ Property ${property.name} already has new pricing data, skipping...`);
        continue;
      }

      // Create default pricing entries for this property
      // This is a basic migration - adjust based on your existing data structure
      const defaultPricingEntries = [
        // Deluxe Room pricing
        {
          propertyId: property._id.toString(),
          roomCategory: 'DELUXE ROOM',
          planType: 'EP',
          occupancyType: 'SINGLE',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          price: property.price || 5000,
          currency: 'INR',
          seasonType: 'Regular',
          isActive: true
        },
        {
          propertyId: property._id.toString(),
          roomCategory: 'DELUXE ROOM',
          planType: 'CP',
          occupancyType: 'DOUBLE',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          price: (property.price || 5000) * 1.2,
          currency: 'INR',
          seasonType: 'Regular',
          isActive: true
        },
        {
          propertyId: property._id.toString(),
          roomCategory: 'DELUXE ROOM',
          planType: 'MAP',
          occupancyType: 'TRIPLE',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          price: (property.price || 5000) * 1.4,
          currency: 'INR',
          seasonType: 'Regular',
          isActive: true
        },
        {
          propertyId: property._id.toString(),
          roomCategory: 'DELUXE ROOM',
          planType: 'AP',
          occupancyType: 'QUAD',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          price: (property.price || 5000) * 1.6,
          currency: 'INR',
          seasonType: 'Regular',
          isActive: true
        }
      ];

      // If property has specific room types, create pricing for each
      if (property.roomTypes && property.roomTypes.length > 0) {
        for (const roomType of property.roomTypes) {
          const roomPricingEntries = [
            {
              propertyId: property._id.toString(),
              roomCategory: roomType.name.toUpperCase(),
              planType: 'EP',
              occupancyType: 'SINGLE',
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-12-31'),
              price: roomType.price || roomType.basePrice || 5000,
              currency: 'INR',
              seasonType: 'Regular',
              isActive: true
            },
            {
              propertyId: property._id.toString(),
              roomCategory: roomType.name.toUpperCase(),
              planType: 'CP',
              occupancyType: 'DOUBLE',
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-12-31'),
              price: (roomType.price || roomType.basePrice || 5000) * 1.2,
              currency: 'INR',
              seasonType: 'Regular',
              isActive: true
            }
          ];

          defaultPricingEntries.push(...roomPricingEntries);
        }
      }

      // Insert pricing entries
      try {
        await PropertyPricing.insertMany(defaultPricingEntries);
        console.log(`✅ Created ${defaultPricingEntries.length} pricing entries for ${property.name}`);
      } catch (error) {
        console.error(`❌ Error creating pricing for ${property.name}:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');

    // Print summary
    const totalPricingEntries = await PropertyPricing.countDocuments();
    const propertiesWithPricing = await PropertyPricing.distinct('propertyId');

    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`- Total pricing entries created: ${totalPricingEntries}`);
    console.log(`- Properties with pricing: ${propertiesWithPricing.length}`);
    console.log(`- Plan types: EP, CP, MAP, AP`);
    console.log(`- Occupancy types: SINGLE, DOUBLE, TRIPLE, QUAD`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migratePricingData();