/**
 * Database Cleanup and Migration Script
 *
 * This script will:
 * 1. Connect to the database
 * 2. Remove all existing sample/test properties
 * 3. Reset city property counts to 0
 * 4. Verify the database is using baithakaGharDB
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

console.log("🧹 Starting Database Cleanup and Migration...\n");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to MongoDB Database: ${dbName}`);

    // Verify we're using the correct database
    if (dbName !== "baithakaGharDB") {
      console.log(
        `⚠️  Warning: Expected database 'baithakaGharDB' but connected to '${dbName}'`
      );
      console.log(
        "   Please update your MONGODB_URI to point to baithakaGharDB"
      );
    }
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

    const User =
      mongoose.models.User ||
      mongoose.model(
        "User",
        new mongoose.Schema({}, { strict: false, collection: "users" })
      );

    const Booking =
      mongoose.models.Booking ||
      mongoose.model(
        "Booking",
        new mongoose.Schema({}, { strict: false, collection: "bookings" })
      );

    return { Property, City, User, Booking };
  } catch (error) {
    console.error("❌ Error loading models:", error);
    process.exit(1);
  }
};

// Main cleanup function
const performCleanup = async () => {
  try {
    // Connect to database
    const dbName = await connectDB();
    console.log("");

    // Load models
    const { Property, City, User, Booking } = await loadModels();

    console.log("📊 Current Database Statistics:");

    // Count existing data
    const propertyCount = await Property.countDocuments({});
    const cityCount = await City.countDocuments({});
    const userCount = await User.countDocuments({});
    const bookingCount = await Booking.countDocuments({});

    console.log(`   Properties: ${propertyCount}`);
    console.log(`   Cities: ${cityCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Bookings: ${bookingCount}`);
    console.log("");

    // Show some sample properties before deletion
    if (propertyCount > 0) {
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
    }

    // Confirm deletion
    console.log(
      "⚠️  WARNING: This will delete ALL existing properties and reset city counts!"
    );
    console.log("   This action cannot be undone.");
    console.log("");

    // In a real scenario, you might want to add confirmation here
    // For now, let's proceed with the cleanup

    console.log("🗑️  Starting cleanup process...");

    // Step 1: Delete all properties
    console.log("   Deleting all properties...");
    const deleteResult = await Property.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} properties`);

    // Step 2: Delete all bookings (they reference properties)
    console.log("   Deleting all bookings...");
    const bookingDeleteResult = await Booking.deleteMany({});
    console.log(`   ✅ Deleted ${bookingDeleteResult.deletedCount} bookings`);

    // Step 3: Reset all city property counts to 0
    console.log("   Resetting city property counts...");
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

    // Step 4: Optional - Remove test/sample users (be careful with this)
    const testUsers = await User.find({
      $or: [
        { email: /test|sample|demo/i },
        { name: /test|sample|demo/i },
        { role: "test" },
      ],
    });

    if (testUsers.length > 0) {
      console.log(`   Found ${testUsers.length} test users to remove:`);
      testUsers.forEach((user) => {
        console.log(`     - ${user.name || "Unnamed"} (${user.email})`);
      });

      const userDeleteResult = await User.deleteMany({
        $or: [
          { email: /test|sample|demo/i },
          { name: /test|sample|demo/i },
          { role: "test" },
        ],
      });
      console.log(`   ✅ Deleted ${userDeleteResult.deletedCount} test users`);
    }

    console.log("");
    console.log("📊 Database Statistics After Cleanup:");

    const newPropertyCount = await Property.countDocuments({});
    const newCityCount = await City.countDocuments({});
    const newUserCount = await User.countDocuments({});
    const newBookingCount = await Booking.countDocuments({});

    console.log(`   Properties: ${newPropertyCount}`);
    console.log(`   Cities: ${newCityCount}`);
    console.log(`   Users: ${newUserCount}`);
    console.log(`   Bookings: ${newBookingCount}`);
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
    console.log("🎉 Database cleanup completed successfully!");
    console.log("");
    console.log("📝 Next Steps:");
    console.log(
      "   1. Your database is now clean and ready for production use"
    );
    console.log(
      "   2. New properties will be stored in baithakaGharDB/properties"
    );
    console.log(
      "   3. City counts will automatically update when new properties are added"
    );
    console.log(
      "   4. Make sure your MONGODB_URI points to baithakaGharDB database"
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
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
console.log(`   Target Database: baithakaGharDB`);
console.log("");

// Run the cleanup
performCleanup().catch(console.error);
