/**
 * Script to hide prices for all properties
 * This sets hidePrices=true for all properties in the database
 *
 * Usage:
 * MONGODB_URI="your_mongodb_uri" node scripts/hide-all-prices.cjs
 */

const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ Error: MONGODB_URI environment variable is not set');
    console.log('\nUsage:');
    console.log('MONGODB_URI="mongodb+srv://..." node scripts/hide-all-prices.cjs');
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
async function hideAllPrices() {
  try {
    console.log('\n🔄 Starting price hiding process...\n');

    // Connect to database
    await connectDB();

    // Count total properties
    const totalProperties = await Property.countDocuments({});
    console.log(`📊 Total properties found: ${totalProperties}`);

    // Count properties with hidden prices already
    const alreadyHidden = await Property.countDocuments({ hidePrices: true });
    console.log(`👁️  Properties with hidden prices: ${alreadyHidden}`);

    // Update all properties to hide prices
    const result = await Property.updateMany(
      {},
      { $set: { hidePrices: true } }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} properties`);
    console.log(`📝 ${result.matchedCount} properties matched the query`);

    // Verify the update
    const hiddenCount = await Property.countDocuments({ hidePrices: true });
    console.log(`\n✓ Verification: ${hiddenCount} properties now have hidden prices`);

    if (hiddenCount === totalProperties) {
      console.log('✅ All properties now have hidden prices!');
    } else {
      console.log(`⚠️  Warning: ${totalProperties - hiddenCount} properties still have visible prices`);
    }

  } catch (error) {
    console.error('\n❌ Error hiding prices:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
hideAllPrices()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
