/**
 * Quick Database Connection Check
 *
 * This script verifies which database we're connected to
 * and shows current statistics without making any changes
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

console.log("🔍 Database Connection Check\n");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to MongoDB Database: ${dbName}`);

    // Show collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      `📂 Available collections: ${collections.map((c) => c.name).join(", ")}`
    );

    return dbName;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Load models and check data
const checkData = async () => {
  try {
    // Connect to database
    const dbName = await connectDB();
    console.log("");

    // Load models with flexible schemas
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

    console.log("📊 Current Database Statistics:");

    // Count documents in each collection
    const propertyCount = await Property.countDocuments({});
    const cityCount = await City.countDocuments({});
    const userCount = await User.countDocuments({});

    console.log(`   Properties: ${propertyCount}`);
    console.log(`   Cities: ${cityCount}`);
    console.log(`   Users: ${userCount}`);
    console.log("");

    // Show sample properties if any exist
    if (propertyCount > 0) {
      console.log("🏠 Sample Properties:");
      const sampleProperties = await Property.find({})
        .limit(3)
        .select("title address.city propertyType verificationStatus createdAt");

      sampleProperties.forEach((prop, index) => {
        const city = prop.address?.city || prop.city || "Unknown City";
        const type = prop.propertyType || "Unknown Type";
        const status = prop.verificationStatus || "Unknown Status";
        console.log(
          `   ${index + 1}. ${
            prop.title || "Unnamed"
          } - ${city} (${type}) [${status}]`
        );
      });
      console.log("");
    }

    // Show cities and their property counts
    if (cityCount > 0) {
      console.log("🏙️  Cities and Property Counts:");
      const cities = await City.find({}).select("name properties").limit(10);
      cities.forEach((city) => {
        console.log(`   ${city.name}: ${city.properties || 0} properties`);
      });
      console.log("");
    }

    // Database recommendation
    console.log("💡 Database Status:");
    if (dbName === "baithakaGharDB") {
      console.log("   ✅ Connected to production database (baithakaGharDB)");
    } else {
      console.log(`   ⚠️  Connected to: ${dbName}`);
      console.log("   💡 Consider switching to baithakaGharDB for production");
    }

    if (propertyCount > 0) {
      console.log(
        "   📝 To clean up existing properties, run: npm run cleanup-db"
      );
    } else {
      console.log("   ✅ Database is clean and ready for production use");
    }
  } catch (error) {
    console.error("❌ Error checking data:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

// Show connection info
console.log("🔗 Connection Details:");
console.log(
  `   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//****:****@")}`
);
console.log("");

// Run the check
checkData().catch(console.error);
