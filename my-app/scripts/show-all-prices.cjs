/**
 * Script to show prices for all properties
 * This sets hidePrices=false for all properties in the database
 *
 * Usage:
 * MONGODB_URI="your_mongodb_uri" node scripts/show-all-prices.cjs
 */

const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ Error: MONGODB_URI environment variable is not set');
    console.log('\nUsage:');
    console.log('MONGODB_URI="mongodb+srv://..." node scripts/show-all-prices.cjs');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Property Schema (minimal version for this script)
const PropertySchema = new mongoose.Schema({
  title: String,
  hidePrices: { type: Boolean, default: false }
}, {
  timestamps: true,
  strict: false // Allow other fields not defined in schema
});

const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

// Main script function
async function showAllPrices() {
  try {
    console.log('\n🔄 Starting price visibility process...\n');

    // Connect to database
    await connectDB();

    // Count total properties
    const totalProperties = await Property.countDocuments({});
    console.log(`📊 Total properties found: ${totalProperties}`);

    // Count properties with visible prices already
    const alreadyVisible = await Property.countDocuments({ hidePrices: false });
    console.log(`👁️  Properties with visible prices: ${alreadyVisible}`);

    // Update all properties to show prices
    const result = await Property.updateMany(
      {},
      { $set: { hidePrices: false } }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} properties`);
    console.log(`📝 ${result.matchedCount} properties matched the query`);

    // Verify the update
    const visibleCount = await Property.countDocuments({ hidePrices: false });
    console.log(`\n✓ Verification: ${visibleCount} properties now have visible prices`);

    if (visibleCount === totalProperties) {
      console.log('✅ All properties now have visible prices!');
    } else {
      console.log(`⚠️  Warning: ${totalProperties - visibleCount} properties still have hidden prices`);
    }

  } catch (error) {
    console.error('\n❌ Error showing prices:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
showAllPrices()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
