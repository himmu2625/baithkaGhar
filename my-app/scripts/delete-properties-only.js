/**
 * Delete Properties Only Script
 *
 * This script will:
 * 1. Delete ALL properties from the database
 * 2. Reset city property counts to 0
 * 3. Keep all other data (users, cities, etc.) intact
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, "../.env.local");
dotenv.config({ path: envPath });

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/baithakaGharDB";

console.log("🗑️  Properties Deletion Script\n");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to MongoDB Database: ${dbName}`);
    return dbName;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Load models
const loadModels = async () => {
  try {
    const Property =
      mongoose.models.Property ||
      mongoose.model(
        "Property",
        new mongoose.Schema({}, { strict: false, collection: "properties" })
      );

    const City =
      mongoose.models.City ||
      mongoose.model(
        "City",
        new mongoose.Schema({}, { strict: false, collection: "cities" })
      );

    const Booking =
      mongoose.models.Booking ||
      mongoose.model(
        "Booking",
        new mongoose.Schema({}, { strict: false, collection: "bookings" })
      );

    return { Property, City, Booking };
  } catch (error) {
    console.error("❌ Error loading models:", error);
    process.exit(1);
  }
};

// Main deletion function
const deletePropertiesOnly = async () => {
  try {
    // Connect to database
    const dbName = await connectDB();
    console.log("");

    // Load models
    const { Property, City, Booking } = await loadModels();

    console.log("📊 Current Database Statistics:");

    // Count existing data
    const propertyCount = await Property.countDocuments({});
    const cityCount = await City.countDocuments({});
    const bookingCount = await Booking.countDocuments({});

    console.log(`   Properties: ${propertyCount}`);
    console.log(`   Cities: ${cityCount}`);
    console.log(`   Bookings: ${bookingCount}`);
    console.log("");

    if (propertyCount === 0) {
      console.log("✅ No properties found in database - nothing to delete!");
      return;
    }

    // Show some sample properties before deletion
    console.log("🔍 Sample properties to be deleted:");
    const sampleProperties = await Property.find({})
      .limit(5)
      .select("title address.city propertyType verificationStatus");
    sampleProperties.forEach((prop, index) => {
      console.log(
        `   ${index + 1}. ${prop.title || "Unnamed"} - ${
          prop.address?.city || prop.city || "Unknown City"
        } (${prop.propertyType || "Unknown Type"})`
      );
    });
    console.log("");

    // Confirm deletion
    console.log(
      "⚠️  WARNING: This will delete ALL properties from the database!"
    );
    console.log("   Users, cities, and other data will be preserved.");
    console.log("   This action cannot be undone.");
    console.log("");

    console.log("🗑️  Starting properties deletion...");

    // Step 1: Delete all properties
    console.log("   Deleting all properties...");
    const deleteResult = await Property.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} properties`);

    // Step 2: Handle bookings that reference deleted properties
    if (bookingCount > 0) {
      console.log("   Checking bookings that reference deleted properties...");

      // Count bookings that might need to be handled
      const orphanedBookings = await Booking.countDocuments({});

      if (orphanedBookings > 0) {
        console.log(`   ⚠️  Found ${orphanedBookings} bookings in database`);
        console.log("   Note: These bookings may reference deleted properties");
        console.log(
          "   Consider reviewing and cleaning them up manually if needed"
        );
      }
    }

    // Step 3: Reset all city property counts to 0
    console.log("   Resetting city property counts to 0...");
    const cityUpdateResult = await City.updateMany(
      {},
      {
        $set: {
          properties: 0,
          updatedAt: new Date(),
        },
      }
    );
    console.log(
      `   ✅ Reset property counts for ${cityUpdateResult.modifiedCount} cities`
    );

    console.log("");
    console.log("📊 Database Statistics After Property Deletion:");

    const newPropertyCount = await Property.countDocuments({});
    const newCityCount = await City.countDocuments({});
    const newBookingCount = await Booking.countDocuments({});

    console.log(`   Properties: ${newPropertyCount}`);
    console.log(`   Cities: ${newCityCount} (preserved)`);
    console.log(`   Bookings: ${newBookingCount} (preserved)`);
    console.log("");

    // Verify city counts are all 0
    const citiesWithProperties = await City.find({ properties: { $gt: 0 } });
    if (citiesWithProperties.length === 0) {
      console.log("✅ All city property counts have been reset to 0");
    } else {
      console.log(
        `⚠️  ${citiesWithProperties.length} cities still have non-zero property counts`
      );
    }

    console.log("");
    console.log("🎉 Properties deletion completed successfully!");
    console.log("");
    console.log("📝 What was done:");
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} properties`);
    console.log(
      `   ✅ Reset ${cityUpdateResult.modifiedCount} city property counts to 0`
    );
    console.log("   ✅ Preserved all users and cities");
    console.log("   ✅ Preserved all bookings (review manually if needed)");
    console.log("");
    console.log("📝 Next Steps:");
    console.log("   1. Your database is now clean of all properties");
    console.log("   2. New properties will automatically update city counts");
    console.log("   3. City cards on homepage should now show 0 properties");
    console.log("   4. Ready to add real property listings");
  } catch (error) {
    console.error("❌ Error during properties deletion:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

// Show database connection info
console.log("🔗 Database Configuration:");
console.log(
  `   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`
);
console.log(`   Target: Delete properties only`);
console.log("");

// Run the deletion
deletePropertiesOnly().catch(console.error);
